package config

import (
	"os"
	"testing"
)

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.Server != "localhost" {
		t.Errorf("Expected default server 'localhost', got %q", cfg.Server)
	}
	if cfg.Port != 3000 {
		t.Errorf("Expected default port 3000, got %d", cfg.Port)
	}
	if cfg.Endpoint != "http://localhost:3000" {
		t.Errorf("Expected default endpoint 'http://localhost:3000', got %q", cfg.Endpoint)
	}
}

func TestSaveAndLoadConfig(t *testing.T) {
	tempHome := t.TempDir()
	origHome := os.Getenv("HOME")
	os.Setenv("HOME", tempHome)
	defer os.Setenv("HOME", origHome)

	testCfg := &Config{
		Token:    "sample-auth-token",
		Server:   "relay.example.com",
		Port:     8080,
		Endpoint: "https://relay.example.com:8080",
	}

	err := SaveConfig(testCfg)
	if err != nil {
		t.Fatalf("Failed to save config: %v", err)
	}

	cfgPath, err := GetConfigPath()
	if err != nil {
		t.Fatalf("Failed to get config path: %v", err)
	}

	if _, err := os.Stat(cfgPath); os.IsNotExist(err) {
		t.Fatalf("Config file does not exist at %s", cfgPath)
	}

	loaded, err := LoadConfig()
	if err != nil {
		t.Fatalf("Failed to load config: %v", err)
	}

	if loaded.Token != testCfg.Token {
		t.Errorf("Expected Token %q, got %q", testCfg.Token, loaded.Token)
	}
	if loaded.Server != testCfg.Server {
		t.Errorf("Expected Server %q, got %q", testCfg.Server, loaded.Server)
	}
	if loaded.Port != testCfg.Port {
		t.Errorf("Expected Port %d, got %d", testCfg.Port, loaded.Port)
	}
	if loaded.Endpoint != testCfg.Endpoint {
		t.Errorf("Expected Endpoint %q, got %q", testCfg.Endpoint, loaded.Endpoint)
	}
}
