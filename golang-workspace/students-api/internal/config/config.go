package config

import (
	"flag"
	"log"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

type HTTPServer struct {
	Address string `yaml:"address" env-required:"true"`
}

type JWT struct {
	Secret    string `yaml:"secret" env:"JWT_SECRET" env-required:"true"`
	ExpiresIn string `yaml:"expires_in" env-default:"24h"`
}

type Config struct {
	Env         string `yaml:"env" env:"ENV" env-required:"true"`
	StoragePath string `yaml:"storage_path" env-required:"true"`
	HTTPServer  `yaml:"http_server"`
	JWT         `yaml:"jwt"`
}

const defaultConfigPath = "config/local.yaml"

func MustLoad() *Config {
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		flags := flag.String("config", defaultConfigPath, "path to the configuration file")
		flag.Parse()

		configPath = *flags
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		log.Fatalf("config file does not exist: %s", configPath)
	}

	var cfg Config
	if err := cleanenv.ReadConfig(configPath, &cfg); err != nil {
		log.Fatalf("failed to read config: %s", err)
	}

	return &cfg
}
