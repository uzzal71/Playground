package config

import (
	"flag"
	"fmt"
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

type Postgres struct {
	Host     string `yaml:"host" env:"DB_HOST" env-required:"true"`
	Port     string `yaml:"port" env:"DB_PORT" env-required:"true"`
	User     string `yaml:"user" env:"DB_USER" env-required:"true"`
	Password string `yaml:"password" env:"DB_PASSWORD" env-required:"true"`
	DBName   string `yaml:"dbname" env:"DB_NAME" env-required:"true"`
	SSLMode  string `yaml:"sslmode" env-default:"disable"`
}

func (p Postgres) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		p.Host, p.Port, p.User, p.Password, p.DBName, p.SSLMode,
	)
}

type Config struct {
	Env        string `yaml:"env" env:"ENV" env-required:"true"`
	HTTPServer `yaml:"http_server"`
	JWT        `yaml:"jwt"`
	Postgres   `yaml:"postgres"`
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
