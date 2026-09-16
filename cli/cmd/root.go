package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "relay",
	Short: "Webhook Relay CLI",
	Long:  `A CLI to connect your local environment to the Webhook Relay server.`,
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	// Global flags go here
}
