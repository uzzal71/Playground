package http

import (
	"github.com/gin-gonic/gin"
	"github.com/uzzal71/students-api/internal/http/handlers/student"
)

func NewRouter(studentHandler *student.Handler) *gin.Engine {
	router := gin.Default()

	api := router.Group("/api/students")
	{
		api.POST("", studentHandler.Create)
		api.GET("", studentHandler.GetAll)
		api.GET("/:id", studentHandler.GetByID)
	}

	return router
}
