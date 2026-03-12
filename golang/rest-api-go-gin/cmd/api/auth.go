package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"rest-api-in-gin/internal/database"
)

type registerRequest struct {
	Name     string `json:"name" binding:"required,min=3,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

type registerResponse struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (app *application) loginUser(ctx *gin.Context) {}

func (app *application) registerUser(ctx *gin.Context) {
	var req registerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	req.Password = string(hashedPassword)

	user := &database.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password,
	}

	id, err := app.models.Users.Insert(user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := registerResponse{
		Id:    id,
		Name:  user.Name,
		Email: user.Email,
	}

	ctx.JSON(http.StatusCreated, resp)
}