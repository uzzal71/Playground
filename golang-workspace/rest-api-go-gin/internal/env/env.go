package env

import (
	"os"
	"strconv"
)

func GetEnvString(key string, defaultValue string) string {
	value := defaultValue

	if envValue, exists := os.LookupEnv(key); exists {
		value = envValue
	}

	return value
}

func GetEnvInt(key string, defaultValue int) int {
	value := defaultValue

	if envValue, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(envValue); err == nil {
			value = intValue
		}
	}

	return value
}