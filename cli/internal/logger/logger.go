package logger

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
)

var (
	defaultLogger *slog.Logger
	logFile       *os.File
	once          sync.Once
)

// InitLogger initializes the slog file logger writing to ~/.webhookrelay/relay.log.
func InitLogger(verbose bool) error {
	var initErr error
	once.Do(func() {
		home, err := os.UserHomeDir()
		if err != nil {
			home = os.TempDir()
		}

		logDir := filepath.Join(home, ".webhookrelay")
		if err := os.MkdirAll(logDir, 0755); err != nil {
			initErr = fmt.Errorf("failed to create log directory %s: %w", logDir, err)
			return
		}

		logPath := filepath.Join(logDir, "relay.log")
		f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err != nil {
			initErr = fmt.Errorf("failed to open log file %s: %w", logPath, err)
			return
		}
		logFile = f

		level := slog.LevelInfo
		if verbose {
			level = slog.LevelDebug
		}

		handler := slog.NewJSONHandler(logFile, &slog.HandlerOptions{
			Level: level,
		})

		defaultLogger = slog.New(handler)
		slog.SetDefault(defaultLogger)
	})

	return initErr
}

// CloseLogger safely flushes and closes the log file descriptor.
func CloseLogger() {
	if logFile != nil {
		_ = logFile.Sync()
		_ = logFile.Close()
	}
}

// Info logs an informational structured message.
func Info(msg string, args ...any) {
	if defaultLogger != nil {
		defaultLogger.Info(msg, args...)
	} else {
		slog.Info(msg, args...)
	}
}

// Debug logs a debug structured message.
func Debug(msg string, args ...any) {
	if defaultLogger != nil {
		defaultLogger.Debug(msg, args...)
	} else {
		slog.Debug(msg, args...)
	}
}

// Warn logs a warning structured message.
func Warn(msg string, args ...any) {
	if defaultLogger != nil {
		defaultLogger.Warn(msg, args...)
	} else {
		slog.Warn(msg, args...)
	}
}

// Error logs an error structured message.
func Error(msg string, args ...any) {
	if defaultLogger != nil {
		defaultLogger.Error(msg, args...)
	} else {
		slog.Error(msg, args...)
	}
}
