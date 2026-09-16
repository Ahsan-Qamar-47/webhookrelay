package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func TestLoginCommand(t *testing.T) {
	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetArgs([]string{"login", "--email", "user@example.com", "--password", "secret"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing login command: %v", err)
	}

	output := buf.String()
	expected := "Login not implemented — Week 3"
	if !strings.Contains(output, expected) {
		t.Errorf("Expected output to contain %q, got %q", expected, output)
	}
	resetFlags()
}
