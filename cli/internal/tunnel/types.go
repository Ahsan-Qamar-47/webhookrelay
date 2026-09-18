package tunnel

import "encoding/json"

// Frame represents a WebSocket protocol envelope.
type Frame struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// HandshakePayload represents HANDSHAKE frame data.
type HandshakePayload struct {
	Token     string `json:"token"`
	Subdomain string `json:"subdomain,omitempty"`
}

// AckPayload represents ACK frame data from server.
type AckPayload struct {
	Status    string `json:"status"`
	TunnelID  string `json:"tunnel_id"`
	Subdomain string `json:"subdomain"`
	PublicURL string `json:"public_url"`
}

// EventPayload represents an incoming webhook request forwarded by server.
type EventPayload struct {
	ID         string                 `json:"id"`
	EventID    string                 `json:"event_id"`
	EndpointID string                 `json:"endpoint_id"`
	Subdomain  string                 `json:"subdomain"`
	Provider   string                 `json:"provider"`
	Method     string                 `json:"method"`
	Headers    map[string]interface{} `json:"headers"`
	Body       json.RawMessage        `json:"body"`
	Payload    json.RawMessage        `json:"payload"`
	Timestamp  string                 `json:"timestamp"`
}

// ReplayResultPayload represents response data returned to server.
type ReplayResultPayload struct {
	EventID    string            `json:"event_id"`
	StatusCode int               `json:"status_code"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
	LatencyMS  int64             `json:"latency_ms"`
}

// ErrorPayload represents an error frame from server.
type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
