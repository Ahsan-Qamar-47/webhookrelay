package cmd

import (
	"bytes"
	"strings"
	"testing"
)

func resetFlags() {
	QuietFlag = false
	VerboseFlag = false
	connectToken = ""
	loginEmail = ""
	loginPassword = ""
}

func TestVerboseFlag(t *testing.T) {
	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetArgs([]string{"version", "--verbose"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing version with --verbose: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "[DEBUG]") {
		t.Errorf("Expected debug message in output when --verbose is used, got %q", output)
	}
	resetFlags()
}

func TestQuietFlag(t *testing.T) {
	resetFlags()
	buf := new(bytes.Buffer)
	rootCmd.SetOut(buf)
	rootCmd.SetArgs([]string{"status", "--quiet"})

	err := rootCmd.Execute()
	if err != nil {
		t.Fatalf("Unexpected error executing status with --quiet: %v", err)
	}

	output := buf.String()
	if strings.Contains(output, "Webhook Relay CLI Status:") {
		t.Errorf("Expected header to be omitted in quiet mode, got %q", output)
	}
	if !strings.Contains(output, "config=") {
		t.Errorf("Expected concise script key=value output in quiet mode, got %q", output)
	}
	resetFlags()
}
