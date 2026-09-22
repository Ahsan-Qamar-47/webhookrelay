package cmd

import (
	"errors"
	"os"

	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/logger"
	"github.com/Ahsan-Qamar-47/webhookrelay/cli/internal/tunnel"
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
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		_ = logger.InitLogger(VerboseFlag)
	},
	Run: func(cmd *cobra.Command, args []string) {
		ui.PrintBanner(cmd.OutOrStdout(), QuietFlag)
		_ = cmd.Help()
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		var connErr *tunnel.ConnectionError
		var unrecErr *tunnel.UnrecoverableError
		if errors.As(err, &connErr) {
			logger.Error("Command exited with connection error", "error", err)
			os.Exit(2)
		} else if errors.As(err, &unrecErr) {
			logger.Error("Command exited with configuration/auth error", "error", err)
			os.Exit(1)
		}
		logger.Error("Command exited with error", "error", err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().BoolVarP(&VerboseFlag, "verbose", "v", false, "Enable verbose debug logging")
	rootCmd.PersistentFlags().BoolVarP(&QuietFlag, "quiet", "q", false, "Silence non-essential output for scripting")
}
