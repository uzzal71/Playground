package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"github.com/uzzal71/students-api/internal/http/handlers/auth"
	"github.com/uzzal71/students-api/internal/http/handlers/student"
	"github.com/uzzal71/students-api/internal/http/middleware"
)

func NewRouter(studentHandler *student.Handler, authHandler *auth.Handler, jwtSecret string) *gin.Engine {
	router := gin.Default()

	docsHandler := ginSwagger.WrapHandler(swaggerFiles.Handler)
	router.GET("/api-docs/*any", func(c *gin.Context) {
		if c.Param("any") == "/" {
			c.Redirect(http.StatusMovedPermanently, "/api-docs/index.html")
			return
		}
		docsHandler(c)
	})
	router.GET("/api-docs", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/api-docs/index.html")
	})

	api := router.Group("/api")
	{
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
		}

		students := api.Group("/students")
		students.Use(middleware.Auth(jwtSecret))
		{
			students.POST("", studentHandler.Create)
			students.GET("", studentHandler.GetAll)
			students.GET("/:id", studentHandler.GetByID)
		}
	}

	return router
}
