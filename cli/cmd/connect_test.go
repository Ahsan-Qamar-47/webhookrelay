package cmd

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

func TestConnectCommand_NoToken(t *testing.T) {
	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetErr(buf)
	rootCmd.SetArgs([]string{"connect"})

	err := rootCmd.Execute()
	if err == nil {
		t.Fatalf("Expected error when executing connect command without token, got nil")
	}
	resetFlags()
}

func TestConnectCommand_WithToken(t *testing.T) {
	upgrader := websocket.Upgrader{}
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer ws.Close()

		// Read HANDSHAKE
		var msg map[string]interface{}
		if err := ws.ReadJSON(&msg); err == nil {
			// Write ACK response
			ackPayload, _ := json.Marshal(map[string]string{
				"status":     "connected",
				"subdomain":  "test-subdomain",
				"public_url": "http://localhost:8080/ingest/test-subdomain",
			})
			_ = ws.WriteJSON(map[string]interface{}{
				"type":    "ACK",
				"payload": json.RawMessage(ackPayload),
			})
		}

		// Close after short delay for unit test completion
		time.Sleep(100 * time.Millisecond)
	}))
	defer s.Close()

	wsURL := "ws" + strings.TrimPrefix(s.URL, "http")

	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetErr(buf)
	rootCmd.SetArgs([]string{"connect", "--token", "test-auth-token-123", "--server", wsURL})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing connect command with token: %v", err)
	}

	resetFlags()
}
