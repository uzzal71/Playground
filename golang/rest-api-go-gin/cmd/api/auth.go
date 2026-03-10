package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"rest-api-in-gin/internal/database"
)

func (app *application) registerUser(ctx *gin.Context) {
	var user database.User
	if err := ctx.ShouldBindJSON(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := app.models.Users.Insert(&user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user.Id = id
	ctx.JSON(http.StatusCreated, user)
}