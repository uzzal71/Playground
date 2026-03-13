package main

import (
	"database/sql"
	"log"

	_ "github.com/joho/godotenv/autoload"
	_ "github.com/mattn/go-sqlite3"

	_ "rest-api-in-gin/docs"
	"rest-api-in-gin/internal/database"
	"rest-api-in-gin/internal/env"
)

// @title Go Gin REST API
// @version 1.0
// @description This is a sample REST API built with Go and Gin framework.
// @securityDefinitions.apiKey BearerAuth
// @in header
// @name Authorization
// @description Enter your JWT token in the format: **Bearer &lt;token&gt;**

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email

type application struct {
	port int
	jwtSecretKey string
	models database.Models
}

func main() {
	db, err := sql.Open("sqlite3", "./data.db")
	if err != nil {
		log.Fatal(err)
	}

	defer db.Close()

	models := database.NewModels(db)

	app := &application{
		port: env.GetEnvInt("PORT", 4000),
		jwtSecretKey: env.GetEnvString("JWT_SECRET", "123456"),
		models: models,
	}

	if err := app.serve(); err != nil {
		log.Fatal(err)
	}
}