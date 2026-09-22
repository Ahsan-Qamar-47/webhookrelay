package tunnel

import "bytes"
import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/fatih/color"
)

// Replayer handles forwarding webhook events to local application endpoints.
type Replayer struct {
	TargetPort int
	HTTPClient *http.Client
}

// NewReplayer creates a new Replayer instance for the specified local port.
func NewReplayer(targetPort int) *Replayer {
	return &Replayer{
		TargetPort: targetPort,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// ReplayEvent executes the local HTTP request and returns the execution result.
func (r *Replayer) ReplayEvent(event *EventPayload) (*ReplayResultPayload, error) {
	start := time.Now()

	// 1. Construct target URL e.g. http://localhost:3000
	method := strings.ToUpper(event.Method)
	if method == "" {
		method = "POST"
	}
	targetURL := fmt.Sprintf("http://localhost:%d", r.TargetPort)

	// 2. Prepare request body
	bodyBytes := event.Body
	if len(bodyBytes) == 0 {
		bodyBytes = event.Payload
	}

	req, err := http.NewRequest(method, targetURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create local HTTP request: %w", err)
	}

	// 3. Set headers
	for k, v := range event.Headers {
		// Skip pseudo-headers or host header overrides
		if strings.HasPrefix(k, ":") || strings.EqualFold(k, "host") {
			continue
		}
		if strVal, ok := v.(string); ok {
			req.Header.Set(k, strVal)
		}
	}
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}

	// Propagate X-Request-ID header to local HTTP target
	if event.RequestID != "" {
		req.Header.Set("X-Request-ID", event.RequestID)
	}

	// 4. Execute request
	resp, err := r.HTTPClient.Do(req)
	latency := time.Since(start).Milliseconds()

	reqIDTag := ""
	if event.RequestID != "" {
		reqIDTag = fmt.Sprintf(" [req:%s]", event.RequestID)
	}

	if err != nil {
		color.Red("  ✖ [%s] %s%s -> ERR: %v (%dms)", method, targetURL, reqIDTag, err, latency)
		return &ReplayResultPayload{
			EventID:    getEventID(event),
			StatusCode: 502,
			Headers:    map[string]string{"content-type": "application/json"},
			Body:       fmt.Sprintf(`{"error": "%s"}`, err.Error()),
			LatencyMS:  latency,
		}, nil
	}
	defer resp.Body.Close()

	// 5. Read response body & headers
	respBody, _ := io.ReadAll(resp.Body)
	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		if len(v) > 0 {
			respHeaders[k] = v[0]
		}
	}

	// 6. Colorized console output
	statusStr := fmt.Sprintf("%d %s", resp.StatusCode, http.StatusText(resp.StatusCode))
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		color.Green("  ✔ [%s] %s%s -> %s (%dms)", method, targetURL, reqIDTag, statusStr, latency)
	} else if resp.StatusCode >= 300 && resp.StatusCode < 400 {
		color.Yellow("  ⚡ [%s] %s%s -> %s (%dms)", method, targetURL, reqIDTag, statusStr, latency)
	} else {
		color.Red("  ✖ [%s] %s%s -> %s (%dms)", method, targetURL, reqIDTag, statusStr, latency)
	}

	return &ReplayResultPayload{
		EventID:    getEventID(event),
		StatusCode: resp.StatusCode,
		Headers:    respHeaders,
		Body:       string(respBody),
		LatencyMS:  latency,
	}, nil
}

func getEventID(event *EventPayload) string {
	if event.EventID != "" {
		return event.EventID
	}
	return event.ID
}
