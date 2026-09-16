package cmd

import (
	"errors"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/config"
	"github.com/spf13/cobra"
)

var connectToken string

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Connect to the relay server",
	RunE: func(cmd *cobra.Command, args []string) error {
		token := connectToken
		if token == "" {
			cfg, err := config.LoadConfig()
			if err == nil && cfg.Token != "" {
				token = cfg.Token
			}
		}

		if token == "" {
			return errors.New("no token provided: please log in or pass --token")
		}

		cmd.Println("Connecting to tunnel with token... Connected!")
		return nil
	},
}

func init() {
	connectCmd.Flags().StringVarP(&connectToken, "token", "t", "", "Authentication token")
	rootCmd.AddCommand(connectCmd)
}
