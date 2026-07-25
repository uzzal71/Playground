package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/uzzal71/blogs-api/internal/config"
	"github.com/uzzal71/blogs-api/internal/http/handlers/blog"
)

func main() {
	// load config
	cfg := config.MustLoad()
	// database setup
	// setup routes
	router := http.NewServeMux()

	router.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	router.HandleFunc("POST /api/blogs", blog.New())

	// setup server
	httpServer := &http.Server{
		Addr:    cfg.HRRPServer.Addr,
		Handler: router,
	}

	// start server
	slog.Info("Server started on", "address", cfg.HRRPServer.Addr)
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		if err := httpServer.ListenAndServe(); err != nil {
			panic(err)
		}
	}()

	<-done
	slog.Info("Server stopped")
	context, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(context); err != nil {
		slog.Error("Server shutdown failed", "error", err)
	} else {
		slog.Info("Server exited properly")
	}
}