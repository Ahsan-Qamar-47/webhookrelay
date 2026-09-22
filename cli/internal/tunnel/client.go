package tunnel

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/logger"
	"github.com/fatih/color"
	"github.com/gorilla/websocket"
)

// UnrecoverableError indicates an error that should not trigger auto-reconnect (e.g. invalid auth token).
type UnrecoverableError struct {
	Err error
}

func (e *UnrecoverableError) Error() string {
	return e.Err.Error()
}

// ConnectionError indicates a network or gateway connection failure (exit code 2).
type ConnectionError struct {
	Err error
}

func (e *ConnectionError) Error() string {
	return e.Err.Error()
}

func (e *ConnectionError) Unwrap() error {
	return e.Err
}

// Client handles the persistent WebSocket tunnel connection with auto-reconnect.
type Client struct {
	ServerURL  string
	Token      string
	Subdomain  string
	TargetPort int
	Replayer   *Replayer

	conn      *websocket.Conn
	sendChan  chan *Frame
	done      chan struct{}
	closeOnce sync.Once
	mu        sync.Mutex
	writeMu   sync.Mutex
	stopped   bool
}

// NewClient initializes a tunnel client configuration.
func NewClient(serverURL, token, subdomain string, targetPort int) *Client {
	return &Client{
		ServerURL:  serverURL,
		Token:      token,
		Subdomain:  subdomain,
		TargetPort: targetPort,
		Replayer:   NewReplayer(targetPort),
		sendChan:   make(chan *Frame, 256),
		done:       make(chan struct{}),
	}
}

// Connect dials the WebSocket gateway, handles auto-reconnect with exponential backoff, and listens for OS interrupts.
func (c *Client) Connect() error {
	u, err := url.Parse(c.ServerURL)
	if err != nil {
		return fmt.Errorf("invalid server URL: %w", err)
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	backoff := 1 * time.Second
	maxBackoff := 30 * time.Second
	attempt := 0

	color.Cyan("\n🌐 Connecting to Webhook Relay Gateway at %s...", u.String())

	for {
		c.mu.Lock()
		if c.stopped {
			c.mu.Unlock()
			return nil
		}
		if c.sendChan == nil {
			c.sendChan = make(chan *Frame, 256)
		}
		if c.done == nil {
			c.done = make(chan struct{})
		}
		c.closeOnce = sync.Once{}
		c.mu.Unlock()

		ackPayload, err := c.connectAndHandshake(u.String())
		if err != nil {
			var unrec *UnrecoverableError
			if errors.As(err, &unrec) {
				return unrec.Err
			}

			c.mu.Lock()
			stopped := c.stopped
			c.mu.Unlock()
			if stopped {
				return nil
			}

			attempt++
			color.Yellow("\n⚠️ Connection failed: %v. Reconnecting in %v (attempt %d)...", err, backoff, attempt)

			select {
			case <-interrupt:
				color.Yellow("\nDisconnecting tunnel...")
				c.Close()
				return nil
			case <-time.After(backoff):
			}

			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
			continue
		}

		// Connected successfully! Reset backoff
		backoff = 1 * time.Second
		attempt = 0

		// Print Banner
		color.Green("⚡ Tunnel Established Successfully!")
		color.White("   Public Ingress URL:  ")
		color.HiCyan("   %s", ackPayload.PublicURL)
		color.White("   Forwarding Traffic:  ")
		color.HiYellow("   http://localhost:%d", c.TargetPort)
		color.White("   Subdomain:           ")
		color.HiMagenta("   %s\n", ackPayload.Subdomain)
		color.Yellow("press Ctrl+C to disconnect tunnel\n")

		go c.writeLoop()
		go c.readLoop()

		select {
		case <-interrupt:
			color.Yellow("\nDisconnecting tunnel...")
			c.Close()
			return nil
		case <-c.done:
			c.mu.Lock()
			stopped := c.stopped
			c.mu.Unlock()
			if stopped {
				return nil
			}
			attempt++
			color.Yellow("\n⚠️ Tunnel connection closed. Reconnecting in %v (attempt %d)...", backoff, attempt)

			select {
			case <-interrupt:
				color.Yellow("\nDisconnecting tunnel...")
				c.Close()
				return nil
			case <-time.After(backoff):
			}

			backoff *= 2
			if backoff > maxBackoff {
				backoff = maxBackoff
			}
		}
	}
}

// connectAndHandshake opens the WS connection and negotiates HANDSHAKE / ACK.
func (c *Client) connectAndHandshake(serverURL string) (*AckPayload, error) {
	dialer := websocket.DefaultDialer
	conn, _, err := dialer.Dial(serverURL, nil)
	if err != nil {
		logger.Error("WebSocket dial failed", "server_url", serverURL, "error", err)
		return nil, &ConnectionError{Err: fmt.Errorf("dial error: %w", err)}
	}

	c.mu.Lock()
	c.conn = conn
	c.mu.Unlock()

	hsPayload, _ := json.Marshal(HandshakePayload{
		Token:     c.Token,
		Subdomain: c.Subdomain,
	})
	hsFrame := &Frame{
		Type:    "HANDSHAKE",
		Payload: hsPayload,
	}

	c.writeMu.Lock()
	err = conn.WriteJSON(hsFrame)
	c.writeMu.Unlock()
	if err != nil {
		conn.Close()
		return nil, &ConnectionError{Err: fmt.Errorf("failed to send HANDSHAKE frame: %w", err)}
	}

	var ackFrame Frame
	if err := conn.ReadJSON(&ackFrame); err != nil {
		conn.Close()
		return nil, &ConnectionError{Err: fmt.Errorf("failed to receive ACK frame: %w", err)}
	}

	if ackFrame.Type == "ERROR" {
		var errPayload ErrorPayload
		_ = json.Unmarshal(ackFrame.Payload, &errPayload)
		conn.Close()
		return nil, &UnrecoverableError{
			Err: fmt.Errorf("server handshake rejected: %s (code: %s)", errPayload.Message, errPayload.Code),
		}
	}

	if ackFrame.Type != "ACK" {
		conn.Close()
		return nil, fmt.Errorf("unexpected handshake response frame: %s", ackFrame.Type)
	}

	var ack AckPayload
	if err := json.Unmarshal(ackFrame.Payload, &ack); err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to parse ACK frame payload: %w", err)
	}

	return &ack, nil
}

// Close gracefully closes the WebSocket connection and marks client stopped.
func (c *Client) Close() {
	c.mu.Lock()
	c.stopped = true
	conn := c.conn
	c.mu.Unlock()

	c.closeOnce.Do(func() {
		if c.done != nil {
			close(c.done)
		}
	})

	if conn != nil {
		c.writeMu.Lock()
		_ = conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Client disconnecting"))
		c.writeMu.Unlock()
		_ = conn.Close()
	}
}

// readLoop listens for incoming frames from the WebSocket server.
func (c *Client) readLoop() {
	defer c.Close()

	for {
		c.mu.Lock()
		conn := c.conn
		c.mu.Unlock()

		if conn == nil {
			return
		}

		var frame Frame
		err := conn.ReadJSON(&frame)
		if err != nil {
			c.mu.Lock()
			stopped := c.stopped
			c.mu.Unlock()
			if !stopped && websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				color.Red("WebSocket read error: %v", err)
			}
			return
		}

		switch frame.Type {
		case "EVENT":
			var event EventPayload
			if err := json.Unmarshal(frame.Payload, &event); err == nil {
				logger.Debug("Received EVENT frame", "id", event.ID, "request_id", event.RequestID)
				go c.handleEvent(&event)
			} else {
				logger.Warn("Malformed EVENT frame payload received", "error", err)
				color.Yellow("⚠️ Received malformed EVENT frame payload (skipped)")
			}
		case "PING":
			c.SendFrame("PONG", map[string]int64{"timestamp": time.Now().UnixMilli()})
		case "ERROR":
			var errPayload ErrorPayload
			_ = json.Unmarshal(frame.Payload, &errPayload)
			logger.Error("Received ERROR frame from server", "code", errPayload.Code, "message", errPayload.Message)
			color.Red("✖ Server Error: %s", errPayload.Message)
		}
	}
}

// writeLoop sends queued frames over the WebSocket connection.
func (c *Client) writeLoop() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		c.mu.Lock()
		conn := c.conn
		c.mu.Unlock()

		select {
		case frame, ok := <-c.sendChan:
			if !ok {
				return
			}
			if conn != nil {
				c.writeMu.Lock()
				err := conn.WriteJSON(frame)
				c.writeMu.Unlock()
				if err != nil {
					return
				}
			}
		case <-ticker.C:
			if conn != nil {
				c.writeMu.Lock()
				_ = conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second))
				c.writeMu.Unlock()
			}
		case <-c.done:
			return
		}
	}
}

// handleEvent executes local HTTP replay and transmits REPLAY_RESULT frame.
func (c *Client) handleEvent(event *EventPayload) {
	result, err := c.Replayer.ReplayEvent(event)
	if err != nil {
		return
	}

	c.SendFrame("REPLAY_RESULT", result)
}

// SendFrame queues a frame payload for transmission.
func (c *Client) SendFrame(frameType string, payload interface{}) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return
	}

	frame := &Frame{
		Type:    frameType,
		Payload: raw,
	}

	c.mu.Lock()
	sendChan := c.sendChan
	stopped := c.stopped
	c.mu.Unlock()

	if stopped || sendChan == nil {
		return
	}

	select {
	case sendChan <- frame:
	default:
		// Queue full
	}
}
