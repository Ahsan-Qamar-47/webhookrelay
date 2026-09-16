package cmd

import (
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Display Webhook Relay CLI status",
	Long:  `Show current configuration path, connection status, endpoint URL, and last event timestamp.`,
	Run: func(cmd *cobra.Command, args []string) {
		cfgPath, err := config.GetConfigPath()
		if err != nil {
			cfgPath = "Unknown"
		}

		cfg, err := config.LoadConfig()
		endpoint := "http://localhost:3000"
		if err == nil && cfg.Endpoint != "" {
			endpoint = cfg.Endpoint
		}

		cmd.Println("Webhook Relay CLI Status:")
		cmd.Printf("  Config File Path: %s\n", cfgPath)
		cmd.Printf("  Connected:        %s\n", "false")
		cmd.Printf("  Endpoint URL:     %s\n", endpoint)
		cmd.Printf("  Last Event:       %s\n", "N/A")
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
