package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var connectCmd = &cobra.Command{
	Use:   "connect",
	Short: "Connect to the relay server",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Connecting to tunnel... (stub)")
	},
}

func init() {
	rootCmd.AddCommand(connectCmd)
}
