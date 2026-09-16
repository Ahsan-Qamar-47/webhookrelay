package cmd

import (
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version number of relay",
	Run: func(cmd *cobra.Command, args []string) {
		ui.Debug(cmd.OutOrStdout(), VerboseFlag, QuietFlag, "Fetching CLI version details...")
		cmd.Println("WebhookRelay CLI v0.1.0")
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
