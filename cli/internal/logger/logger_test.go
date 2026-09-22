package logger

import (
	"os"
	"path/filepath"
	"testing"
)

func TestInitLogger(t *testing.T) {
	err := InitLogger(true)
	if err != nil {
		t.Fatalf("InitLogger failed: %v", err)
	}

	Info("Test info message", "key", "value")
	Debug("Test debug message", "key", "value")
	Warn("Test warn message")
	Error("Test error message")

	home, _ := os.UserHomeDir()
	logPath := filepath.Join(home, ".webhookrelay", "relay.log")

	if _, err := os.Stat(logPath); os.IsNotExist(err) {
		t.Errorf("Expected log file to exist at %s", logPath)
	}
}
