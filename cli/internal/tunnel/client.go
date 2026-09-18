package tunnel

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/fatih/color"
	"github.com/gorilla/websocket"
)

// Client handles the persistent WebSocket tunnel connection.
type Client struct {
	ServerURL  string
	Token      string
	Subdomain  string
	TargetPort int
	Replayer   *Replayer

	conn     *websocket.Conn
	sendChan chan *Frame
	done     chan struct{}
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

// Connect dials the WebSocket gateway, executes HANDSHAKE, and starts forwarding loops.
func (c *Client) Connect() error {
	u, err := url.Parse(c.ServerURL)
	if err != nil {
		return fmt.Errorf("invalid server URL: %w", err)
	}

	color.Cyan("\n🌐 Connecting to Webhook Relay Gateway at %s...", u.String())

	dialer := websocket.DefaultDialer
	conn, _, err := dialer.Dial(u.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to connect to server: %w", err)
	}
	c.conn = conn

	// 1. Transmit HANDSHAKE frame
	hsPayload, _ := json.Marshal(HandshakePayload{
		Token:     c.Token,
		Subdomain: c.Subdomain,
	})
	hsFrame := &Frame{
		Type:    "HANDSHAKE",
		Payload: hsPayload,
	}

	if err := conn.WriteJSON(hsFrame); err != nil {
		conn.Close()
		return fmt.Errorf("failed to send HANDSHAKE frame: %w", err)
	}

	// 2. Read ACK frame response
	var ackFrame Frame
	if err := conn.ReadJSON(&ackFrame); err != nil {
		conn.Close()
		return fmt.Errorf("failed to receive ACK frame: %w", err)
	}

	if ackFrame.Type == "ERROR" {
		var errPayload ErrorPayload
		_ = json.Unmarshal(ackFrame.Payload, &errPayload)
		conn.Close()
		return fmt.Errorf("server handshake rejected: %s (code: %s)", errPayload.Message, errPayload.Code)
	}

	if ackFrame.Type != "ACK" {
		conn.Close()
		return fmt.Errorf("unexpected handshake response frame: %s", ackFrame.Type)
	}

	var ack AckPayload
	if err := json.Unmarshal(ackFrame.Payload, &ack); err != nil {
		conn.Close()
		return fmt.Errorf("failed to parse ACK frame payload: %w", err)
	}

	// Print Connection Banner
	color.Green("⚡ Tunnel Established Successfully!")
	color.White("   Public Ingress URL:  ")
	color.HiCyan("   %s", ack.PublicURL)
	color.White("   Forwarding Traffic:  ")
	color.HiYellow("   http://localhost:%d", c.TargetPort)
	color.White("   Subdomain:           ")
	color.HiMagenta("   %s\n", ack.Subdomain)
	color.Yellow("press Ctrl+C to disconnect tunnel\n")

	// 3. Start Read & Write loops
	go c.writeLoop()
	go c.readLoop()

	// 4. Handle OS Interrupts
	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt, syscall.SIGTERM)

	select {
	case <-interrupt:
		color.Yellow("\nDisconnecting tunnel...")
		c.Close()
	case <-c.done:
		color.Red("\nTunnel connection closed by server.")
	}

	return nil
}

// Close gracefully closes the WebSocket connection.
func (c *Client) Close() {
	close(c.done)
	if c.conn != nil {
		// Send CLOSE frame
		_ = c.conn.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, "Client disconnecting"))
		_ = c.conn.Close()
	}
}

// readLoop listens for incoming frames from the WebSocket server.
func (c *Client) readLoop() {
	defer close(c.done)

	for {
		var frame Frame
		err := c.conn.ReadJSON(&frame)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				color.Red("WebSocket read error: %v", err)
			}
			return
		}

		switch frame.Type {
		case "EVENT":
			var event EventPayload
			if err := json.Unmarshal(frame.Payload, &event); err == nil {
				go c.handleEvent(&event)
			}
		case "PING":
			c.SendFrame("PONG", map[string]int64{"timestamp": time.Now().UnixMilli()})
		case "ERROR":
			var errPayload ErrorPayload
			_ = json.Unmarshal(frame.Payload, &errPayload)
			color.Red("✖ Server Error: %s", errPayload.Message)
		}
	}
}

// writeLoop sends queued frames over the WebSocket connection.
func (c *Client) writeLoop() {
	ticker := time.NewTicker(15 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case frame := <-c.sendChan:
			if err := c.conn.WriteJSON(frame); err != nil {
				return
			}
		case <-ticker.C:
			// Heartbeat Ping
			_ = c.conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(5*time.Second))
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

	select {
	case c.sendChan <- frame:
	default:
		// Queue full
	}
}
