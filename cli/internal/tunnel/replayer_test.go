package tunnel

import (
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
)

func TestReplayer_ReplayEvent_Success(t *testing.T) {
	// 1. Create a mock local server
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST method, got %s", r.Method)
		}
		if r.Header.Get("X-Webhook-Source") != "stripe" {
			t.Errorf("expected header X-Webhook-Source to be stripe, got %s", r.Header.Get("X-Webhook-Source"))
		}
		body, _ := io.ReadAll(r.Body)
		if string(body) != `{"type":"payment_intent.succeeded"}` {
			t.Errorf("unexpected body: %s", string(body))
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"received":true}`))
	})

	server := httptest.NewServer(handler)
	defer server.Close()

	u, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("failed to parse mock server URL: %v", err)
	}
	port, _ := strconv.Atoi(u.Port())

	// 2. Instantiate Replayer targeting mock server port
	replayer := NewReplayer(port)

	event := &EventPayload{
		ID:     "evt_test_999",
		Method: "POST",
		Headers: map[string]interface{}{
			"X-Webhook-Source": "stripe",
		},
		Body: []byte(`{"type":"payment_intent.succeeded"}`),
	}

	// 3. Replay event
	result, err := replayer.ReplayEvent(event)
	if err != nil {
		t.Fatalf("ReplayEvent failed: %v", err)
	}

	if result.StatusCode != 200 {
		t.Errorf("expected status 200, got %d", result.StatusCode)
	}
	if result.EventID != "evt_test_999" {
		t.Errorf("expected event ID evt_test_999, got %s", result.EventID)
	}
	if result.Body != `{"received":true}` {
		t.Errorf("expected response body {\"received\":true}, got %s", result.Body)
	}
}

func TestReplayer_ReplayEvent_LocalServerDown(t *testing.T) {
	// Target an unused port to simulate local server being offline/unreachable
	replayer := NewReplayer(59999)

	event := &EventPayload{
		ID:     "evt_down_123",
		Method: "POST",
		Body:   []byte(`{"test":true}`),
	}

	result, err := replayer.ReplayEvent(event)
	if err != nil {
		t.Fatalf("expected nil error on HTTP connection failure, got %v", err)
	}

	if result.StatusCode != 502 {
		t.Errorf("expected status 502 Bad Gateway when local server is offline, got %d", result.StatusCode)
	}
	if result.EventID != "evt_down_123" {
		t.Errorf("expected event ID evt_down_123, got %s", result.EventID)
	}
}
