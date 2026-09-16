package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Config holds CLI configuration parameters.
type Config struct {
	Token    string `mapstructure:"token" yaml:"token" json:"token"`
	Server   string `mapstructure:"server" yaml:"server" json:"server"`
	Port     int    `mapstructure:"port" yaml:"port" json:"port"`
	Endpoint string `mapstructure:"endpoint" yaml:"endpoint" json:"endpoint"`
}

// GetConfigDir returns the directory path for webhookrelay configuration (~/.webhookrelay).
func GetConfigDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user home directory: %w", err)
	}
	return filepath.Join(home, ".webhookrelay"), nil
}

// GetConfigPath returns the full path to the config file (~/.webhookrelay/config.yml).
func GetConfigPath() (string, error) {
	dir, err := GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.yml"), nil
}

// DefaultConfig returns default configuration settings.
func DefaultConfig() *Config {
	return &Config{
		Token:    "",
		Server:   "localhost",
		Port:     3000,
		Endpoint: "http://localhost:3000",
	}
}

// LoadConfig loads configuration from ~/.webhookrelay/config.yml or returns defaults.
func LoadConfig() (*Config, error) {
	configDir, err := GetConfigDir()
	if err != nil {
		return DefaultConfig(), nil
	}

	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(configDir)

	v.SetDefault("token", "")
	v.SetDefault("server", "localhost")
	v.SetDefault("port", 3000)
	v.SetDefault("endpoint", "http://localhost:3000")

	cfg := DefaultConfig()

	if err := v.ReadInConfig(); err != nil {
		return cfg, nil
	}

	if err := v.Unmarshal(cfg); err != nil {
		return DefaultConfig(), nil
	}

	return cfg, nil
}

// SaveConfig saves the given configuration to ~/.webhookrelay/config.yml.
func SaveConfig(cfg *Config) error {
	configDir, err := GetConfigDir()
	if err != nil {
		return fmt.Errorf("failed to get config directory: %w", err)
	}

	if err := os.MkdirAll(configDir, 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	configPath, err := GetConfigPath()
	if err != nil {
		return err
	}

	v := viper.New()
	v.SetConfigFile(configPath)
	v.SetConfigType("yaml")

	v.Set("token", cfg.Token)
	v.Set("server", cfg.Server)
	v.Set("port", cfg.Port)
	v.Set("endpoint", cfg.Endpoint)

	return v.WriteConfigAs(configPath)
}
