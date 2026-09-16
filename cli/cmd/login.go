package cmd

import (
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
		cmd.Println("Login not implemented — Week 3")
	},
}

func init() {
	loginCmd.Flags().StringVarP(&loginEmail, "email", "e", "", "User email address")
	loginCmd.Flags().StringVarP(&loginPassword, "password", "p", "", "User password")

	rootCmd.AddCommand(loginCmd)
}
