package main

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
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

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

type loginResponse struct {
	Token string `json:"token"`
}

// login authenticates a user and returns a JWT token
// @Summary User login
// @Description Authenticate with email and password to receive a JWT token
// @Tags Auth
// @Accept json
// @Produce json
// @Param credentials body loginRequest true "Login credentials"
// @Success 200 {object} loginResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/login [post]
func (app *application) login(ctx *gin.Context) {
	var auth loginRequest
	if err := ctx.ShouldBindJSON(&auth); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := app.models.Users.GetByEmail(auth.Email)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(auth.Password)); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.Id,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}).SignedString([]byte(app.jwtSecretKey))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	resp := loginResponse{Token: token}
	ctx.JSON(http.StatusOK, resp)
}

// registerUser creates a new user account
// @Summary Register a new user
// @Description Create a new user account with name, email, and password
// @Tags Auth
// @Accept json
// @Produce json
// @Param user body registerRequest true "Registration details"
// @Success 201 {object} registerResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/auth/register [post]
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