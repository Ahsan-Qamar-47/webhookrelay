package ui

import (
	"bytes"
	"strings"
	"testing"
)

func TestUIFunctions(t *testing.T) {
	buf := new(bytes.Buffer)

	PrintBanner(buf, false)
	if !strings.Contains(buf.String(), "Webhook Relay CLI") {
		t.Errorf("Expected banner to contain 'Webhook Relay CLI'")
	}

	buf.Reset()
	PrintBanner(buf, true)
	if buf.Len() != 0 {
		t.Errorf("Expected banner to be empty in quiet mode")
	}

	buf.Reset()
	Success(buf, false, "Task completed: %s", "OK")
	if !strings.Contains(buf.String(), "Task completed: OK") {
		t.Errorf("Expected success message, got %q", buf.String())
	}

	buf.Reset()
	Debug(buf, true, false, "Debug log line")
	if !strings.Contains(buf.String(), "[DEBUG] Debug log line") {
		t.Errorf("Expected debug log when verbose=true, got %q", buf.String())
	}

	buf.Reset()
	Debug(buf, false, false, "Debug log line")
	if buf.Len() != 0 {
		t.Errorf("Expected no debug log when verbose=false")
	}
}
