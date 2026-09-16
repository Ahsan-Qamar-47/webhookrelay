package cmd

import (
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var (
	loginEmail    string
	loginPassword string
)

var loginCmd = &cobra.Command{
	Use:   "login",
	Short: "Log in to Webhook Relay service",
	Long:  `Authenticate with your Webhook Relay account credentials.`,
	Run: func(cmd *cobra.Command, args []string) {
		ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Attempting login with provided email credentials...")
		ui.Info(cmd.OutOrStdout(), QuietFlag, "Login not implemented — Week 3")
	},
}

func init() {
	loginCmd.Flags().StringVarP(&loginEmail, "email", "e", "", "User email address")
	loginCmd.Flags().StringVarP(&loginPassword, "password", "p", "", "User password")

	rootCmd.AddCommand(loginCmd)
}
