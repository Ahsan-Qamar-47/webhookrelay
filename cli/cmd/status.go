package cmd

import (
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config"
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Display Webhook Relay CLI status",
	Long:  `Show current configuration path, connection status, endpoint URL, and last event timestamp.`,
	Run: func(cmd *cobra.Command, args []string) {
		ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Loading status information...")

		cfgPath, err := config.GetConfigPath()
		if err != nil {
			cfgPath = "Unknown"
		}

		cfg, err := config.LoadConfig()
		endpoint := "http://localhost:3000"
		if err == nil && cfg.Endpoint != "" {
			endpoint = cfg.Endpoint
		}

		if QuietFlag {
			cmd.Printf("config=%s connected=false endpoint=%s last_event=N/A\n", cfgPath, endpoint)
			return
		}

		ui.Info(cmd.OutOrStdout(), false, "Webhook Relay CLI Status:")
		cmd.Printf("  Config File Path: %s\n", ui.Bold(cfgPath))
		cmd.Printf("  Connected:        %s\n", ui.Yellow("false"))
		cmd.Printf("  Endpoint URL:     %s\n", ui.Cyan(endpoint))
		cmd.Printf("  Last Event:       %s\n", ui.Dim("N/A"))
	},
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
