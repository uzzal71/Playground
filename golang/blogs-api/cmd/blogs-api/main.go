package main

import (
	"fmt"
	"net/http"

	"github.com/uzzal71/blogs-api/internal/config"
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

	router.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("welcome to blogs api"))
	})

	// setup server
	httpServer := &http.Server{
		Addr:    cfg.HRRPServer.Addr,
		Handler: router,
	}

	// start server
	fmt.Println("Server started on", cfg.HRRPServer.Addr)
	if err := httpServer.ListenAndServe(); err != nil {
		panic(err)
	}
}