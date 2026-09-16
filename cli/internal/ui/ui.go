package ui

import (
	"fmt"
	"io"
	"os"

	"github.com/fatih/color"
)

var (
	BannerArt = `
  _  _ _ _____ ___ _  _  ___  ___  _  _ ___ _    _  _   _   _ 
 | || | | ____| __| || |/ _ \| _ \| || | __| |  /_\ \ \ / / 
 | || | |  _| | _|| __ | (_) |   /| __ | _|| | / _ \ \ V /  
 |_||_| |_|   |___|_||_|\___/|_|_|_||_|___|___/_/ \_\ |_|   
`
	Cyan    = color.New(color.FgCyan, color.Bold).SprintfFunc()
	Green   = color.New(color.FgGreen, color.Bold).SprintfFunc()
	Yellow  = color.New(color.FgYellow).SprintfFunc()
	Red     = color.New(color.FgRed, color.Bold).SprintfFunc()
	Dim     = color.New(color.FgWhite, color.Faint).SprintfFunc()
	Bold    = color.New(color.Bold).SprintfFunc()
)

// PrintBanner prints the ASCII banner if quiet mode is not enabled.
func PrintBanner(w io.Writer, quiet bool) {
	if quiet {
		return
	}
	if w == nil {
		w = os.Stdout
	}
	fmt.Fprintln(w, Cyan(BannerArt))
	fmt.Fprintln(w, Dim(" Webhook Relay CLI - Local Tunneling for Webhooks"))
	fmt.Fprintln(w)
}

// Success prints a green success message if quiet mode is not enabled.
func Success(w io.Writer, quiet bool, format string, a ...interface{}) {
	if quiet {
		return
	}
	if w == nil {
		w = os.Stdout
	}
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintln(w, Green("✔ ") + msg)
}

// Info prints a cyan info message if quiet mode is not enabled.
func Info(w io.Writer, quiet bool, format string, a ...interface{}) {
	if quiet {
		return
	}
	if w == nil {
		w = os.Stdout
	}
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintln(w, Cyan("ℹ ") + msg)
}

// Warn prints a yellow warning message if quiet mode is not enabled.
func Warn(w io.Writer, quiet bool, format string, a ...interface{}) {
	if quiet {
		return
	}
	if w == nil {
		w = os.Stdout
	}
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintln(w, Yellow("⚠ ") + msg)
}

// Error prints a red error message.
func Error(w io.Writer, format string, a ...interface{}) {
	if w == nil {
		w = os.Stderr
	}
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintln(w, Red("✖ Error: ") + msg)
}

// Debug prints a debug message if verbose is true and quiet is false.
func Debug(w io.Writer, verbose bool, quiet bool, format string, a ...interface{}) {
	if !verbose || quiet {
		return
	}
	if w == nil {
		w = os.Stdout
	}
	msg := fmt.Sprintf(format, a...)
	fmt.Fprintln(w, Dim("[DEBUG] "+msg))
}
