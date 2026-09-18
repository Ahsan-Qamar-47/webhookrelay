package cmd

import (
	"errors"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config"
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/tunnel"
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var (
	connectToken     string
	connectSubdomain string
	connectPort      int
	connectServer    string
)

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Establish an authenticated tunnel connection to relay webhooks to localhost",
	RunE: func(cmd *cobra.Command, args []string) error {
		ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Loading configuration and credentials...")

		token := connectToken
		subdomain := connectSubdomain
		serverURL := connectServer

		// Fallback to saved Viper configuration if flag not explicitly provided
		cfg, err := config.LoadConfig()
		if err == nil {
			if token == "" && cfg.Token != "" {
				token = cfg.Token
				ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Loaded authentication token from configuration file")
			}
			if serverURL == "ws://localhost:8081" && cfg.Server != "" && cfg.Server != "localhost" {
				serverURL = cfg.Server
			}
		}

		if token == "" {
			return errors.New("authentication token required: please run 'relay login' or pass '--token <TOKEN>'")
		}

		client := tunnel.NewClient(serverURL, token, subdomain, connectPort)
		return client.Connect()
	},
}

func init() {
	connectCmd.Flags().StringVarP(&connectToken, "token", "t", "", "Authentication token or API key")
	connectCmd.Flags().StringVarP(&connectSubdomain, "subdomain", "s", "", "Subdomain to bind e.g. stripe-demo")
	connectCmd.Flags().IntVarP(&connectPort, "port", "p", 3000, "Target local HTTP port to forward webhooks to")
	connectCmd.Flags().StringVar(&connectServer, "server", "ws://localhost:8081", "Relay WebSocket server URL")

	rootCmd.AddCommand(connectCmd)
}
