package cmd

import (
	"bytes"
	"strings"
	"testing"
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
	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetErr(buf)
	rootCmd.SetArgs([]string{"connect", "--token", "test-auth-token-123"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing connect command with token: %v", err)
	}

	output := buf.String()
	expected := "Connected"
	if !strings.Contains(output, expected) {
		t.Errorf("Expected output to contain %q, got %q", expected, output)
	}
	resetFlags()
}
