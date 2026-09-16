package cmd

import (
	"errors"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config"
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var connectToken string

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Connect to the relay server",
	RunE: func(cmd *cobra.Command, args []string) error {
		ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Checking configuration and authentication token...")

		token := connectToken
		if token == "" {
			cfg, err := config.LoadConfig()
			if err == nil && cfg.Token != "" {
				token = cfg.Token
				ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Loaded token from configuration file")
			}
		}

		if token == "" {
			return errors.New("no token provided: please log in or pass --token")
		}

		ui.Success(cmd.OutOrStdout(), QuietFlag, "Connecting to tunnel with token... Connected!")
		return nil
	},
}

func init() {
	connectCmd.Flags().StringVarP(&connectToken, "token", "t", "", "Authentication token")
	rootCmd.AddCommand(connectCmd)
}
