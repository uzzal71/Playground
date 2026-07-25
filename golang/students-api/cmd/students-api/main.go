package main

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/uzzal71/students-api/docs"
	"github.com/uzzal71/students-api/internal/config"
	apphttp "github.com/uzzal71/students-api/internal/http"
	"github.com/uzzal71/students-api/internal/http/handlers/auth"
	"github.com/uzzal71/students-api/internal/http/handlers/student"
	"github.com/uzzal71/students-api/internal/models"
	"github.com/uzzal71/students-api/internal/repository"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// @title           Students API
// @version         1.0
// @description     REST API for managing students, secured with JWT authentication.
// @host            localhost:8082
// @BasePath        /api

// @securityDefinitions.apikey  BearerAuth
// @in                          header
// @name                        Authorization
// @description                 Type "Bearer" followed by a space and the JWT token.

func main() {
	cfg := config.MustLoad()

	gormLogger := logger.New(
		log.New(os.Stdout, "", log.LstdFlags),
		logger.Config{
			LogLevel:                  logger.Warn,
			IgnoreRecordNotFoundError: true,
		},
	)
	db, err := gorm.Open(postgres.Open(cfg.Postgres.DSN()), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		slog.Error("failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}

	if err := db.AutoMigrate(&models.Student{}, &models.User{}); err != nil {
		slog.Error("failed to migrate database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	slog.Info("storage initialized", slog.String("env", cfg.Env))

	studentRepo := repository.NewStudentRepository(db)
	studentHandler := student.NewHandler(studentRepo)

	userRepo := repository.NewUserRepository(db)
	authHandler := auth.NewHandler(userRepo, cfg.JWT)

	router := apphttp.NewRouter(studentHandler, authHandler, cfg.JWT.Secret)

	server := http.Server{
		Addr:    cfg.HTTPServer.Address,
		Handler: router,
	}

	slog.Info("server started", slog.String("address", cfg.HTTPServer.Address))

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("failed to start server", slog.String("error", err.Error()))
		}
	}()

	<-done

	slog.Info("shutting down server")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		slog.Error("failed to shutdown server", slog.String("error", err.Error()))
	}

	slog.Info("server stopped")
}
