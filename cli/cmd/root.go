package cmd

import (
	"os"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/ui"
	"github.com/spf13/cobra"
)

var (
	VerboseFlag bool
	QuietFlag   bool
)

var rootCmd = &cobra.Command{
	Use:   "relay",
	Short: "Webhook Relay CLI",
	Long:  `A CLI to connect your local environment to the Webhook Relay server.`,
	Run: func(cmd *cobra.Command, args []string) {
		ui.PrintBanner(cmd.OutOrStdout(), QuietFlag)
		_ = cmd.Help()
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&VerboseFlag, "verbose", "v", false, "Enable verbose debug logging")
	rootCmd.PersistentFlags().BoolVarP(&QuietFlag, "quiet", "q", false, "Silence non-essential output for scripting")
}
