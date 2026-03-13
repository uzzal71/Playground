package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (app *application) routes() http.Handler {
	g := gin.Default()

	v1 := g.Group("/api/v1")
	{
		v1.GET("/events", app.getAllEvents)
		v1.GET("/events/:id", app.getEvent)
		v1.GET("/events/:id/attendances", app.getAttendanceForEvent)
		v1.GET("/attendances/:id/events", app.getEventByAttendance)
		v1.POST("/auth/register", app.registerUser)
		v1.POST("/auth/login", app.login)
	}

	authGroup := g.Group("/")
	authGroup.Use(app.AuthMiddleware())
	{
		authGroup.POST("/events", app.createEvent)
		authGroup.PUT("/events/:id", app.updateEvent)
		authGroup.DELETE("/events/:id", app.deleteEvent)
		authGroup.POST("/events/:id/attendances/:userId", app.addAttendanceToEvent)
		authGroup.DELETE("/events/:id/attendances/:User", app.deleteAttendanceFromEvent)
	}

	return g
}