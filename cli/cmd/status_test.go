package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func TestStatusCommand(t *testing.T) {
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetArgs([]string{"status"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing status command: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "Webhook Relay CLI Status:") {
		t.Errorf("Expected output to contain header, got %q", output)
	}
	if !strings.Contains(output, "Config File Path:") {
		t.Errorf("Expected output to contain Config File Path, got %q", output)
	}
	if !strings.Contains(output, "Connected:") {
		t.Errorf("Expected output to contain Connected status, got %q", output)
	}
	if !strings.Contains(output, "Endpoint URL:") {
		t.Errorf("Expected output to contain Endpoint URL, got %q", output)
	}
	if !strings.Contains(output, "Last Event:") {
		t.Errorf("Expected output to contain Last Event, got %q", output)
	}
}
