package cmd

import (
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of relay",
	Run: func(cmd *cobra.Command, args []string) {
		cmd.Println("WebhookRelay CLI v0.1.0")
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
