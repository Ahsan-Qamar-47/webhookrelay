package tunnel

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func TestClient_Handshake_Success(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		var frame Frame
		if err := conn.ReadJSON(&frame); err != nil {
			return
		}

		if frame.Type != "HANDSHAKE" {
			t.Errorf("expected HANDSHAKE frame, got %s", frame.Type)
			return
		}

		var hs HandshakePayload
		_ = json.Unmarshal(frame.Payload, &hs)
		if hs.Token != "valid-token-123" {
			t.Errorf("expected token valid-token-123, got %s", hs.Token)
			return
		}

		ackPayload, _ := json.Marshal(AckPayload{
			PublicURL: "http://relay.webhookrelay.dev/u/demo-slug",
			Subdomain: "demo-slug",
		})
		_ = conn.WriteJSON(Frame{
			Type:    "ACK",
			Payload: ackPayload,
		})
	}))
	defer s.Close()

	wsURL := "ws" + strings.TrimPrefix(s.URL, "http")

	client := NewClient(wsURL, "valid-token-123", "demo-slug", 3000)
	ack, err := client.connectAndHandshake(wsURL)
	if err != nil {
		t.Fatalf("handshake failed unexpectedly: %v", err)
	}

	if ack.Subdomain != "demo-slug" {
		t.Errorf("expected subdomain demo-slug, got %s", ack.Subdomain)
	}
	if ack.PublicURL != "http://relay.webhookrelay.dev/u/demo-slug" {
		t.Errorf("unexpected public URL: %s", ack.PublicURL)
	}
}

func TestClient_Handshake_RejectedError(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		var frame Frame
		_ = conn.ReadJSON(&frame)

		errPayload, _ := json.Marshal(ErrorPayload{
			Code:    "UNAUTHORIZED",
			Message: "Invalid token",
		})
		_ = conn.WriteJSON(Frame{
			Type:    "ERROR",
			Payload: errPayload,
		})
	}))
	defer s.Close()

	wsURL := "ws" + strings.TrimPrefix(s.URL, "http")

	client := NewClient(wsURL, "invalid-token", "demo-slug", 3000)
	_, err := client.connectAndHandshake(wsURL)
	if err == nil {
		t.Fatal("expected error on rejected handshake, got nil")
	}

	if !strings.Contains(err.Error(), "Invalid token") {
		t.Errorf("expected error message to contain 'Invalid token', got: %v", err)
	}
}

func TestClient_EventProcessing(t *testing.T) {
	localServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"ok":true}`))
	}))
	defer localServer.Close()

	uLocal, _ := url.Parse(localServer.URL)
	localPort, _ := strconv.Atoi(uLocal.Port())

	eventReceivedChan := make(chan bool, 1)

	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		var hsFrame Frame
		_ = conn.ReadJSON(&hsFrame)

		ackPayload, _ := json.Marshal(AckPayload{
			PublicURL: "http://relay.webhookrelay.dev/u/test",
			Subdomain: "test",
		})
		_ = conn.WriteJSON(Frame{
			Type:    "ACK",
			Payload: ackPayload,
		})

		// Send EVENT frame to client
		evtPayload, _ := json.Marshal(EventPayload{
			ID:     "evt_abc_123",
			Method: "POST",
			Body:   []byte(`{"ping":true}`),
		})
		_ = conn.WriteJSON(Frame{
			Type:    "EVENT",
			Payload: evtPayload,
		})

		// Read REPLAY_RESULT frame back from client
		var resFrame Frame
		_ = conn.ReadJSON(&resFrame)
		if resFrame.Type == "REPLAY_RESULT" {
			eventReceivedChan <- true
		}
	}))
	defer s.Close()

	wsURL := "ws" + strings.TrimPrefix(s.URL, "http")

	client := NewClient(wsURL, "test-token", "test", localPort)

	ack, err := client.connectAndHandshake(wsURL)
	if err != nil {
		t.Fatalf("failed handshake: %v", err)
	}
	if ack == nil {
		t.Fatal("expected non-nil ack")
	}

	go client.readLoop()
	go client.writeLoop()

	select {
	case <-eventReceivedChan:
		// Success! Replay result was produced and sent back over websocket
	case <-time.After(2 * time.Second):
		t.Fatal("timed out waiting for REPLAY_RESULT frame")
	}

	client.Close()
}
