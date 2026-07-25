package auth

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/uzzal71/students-api/internal/auth"
	"github.com/uzzal71/students-api/internal/config"
	"github.com/uzzal71/students-api/internal/models"
	"github.com/uzzal71/students-api/internal/repository"
)

type Handler struct {
	repo      repository.UserRepository
	secret    string
	expiresIn time.Duration
}

func NewHandler(repo repository.UserRepository, cfg config.JWT) *Handler {
	expiresIn, err := time.ParseDuration(cfg.ExpiresIn)
	if err != nil {
		expiresIn = 24 * time.Hour
	}

	return &Handler{repo: repo, secret: cfg.Secret, expiresIn: expiresIn}
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type TokenResponse struct {
	Token string `json:"token"`
}

// Register godoc
// @Summary      Register a new user
// @Description  Create a user account and receive a JWT
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        user  body      models.User  true  "User info"
// @Success      201   {object}  TokenResponse
// @Failure      400   {object}  map[string]string
// @Failure      409   {object}  map[string]string
// @Router       /auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var user models.User

	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashed, err := auth.HashPassword(user.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	user.Password = hashed

	if err := h.repo.Create(&user); err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists or invalid data"})
		return
	}

	token, err := auth.GenerateToken(h.secret, h.expiresIn, user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, TokenResponse{Token: token})
}

// Login godoc
// @Summary      Login
// @Description  Authenticate with email and password and receive a JWT
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        credentials  body      LoginRequest  true  "Login credentials"
// @Success      200          {object}  TokenResponse
// @Failure      400          {object}  map[string]string
// @Failure      401          {object}  map[string]string
// @Router       /auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.repo.GetByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	if err := auth.CheckPassword(user.Password, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := auth.GenerateToken(h.secret, h.expiresIn, user.ID, user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, TokenResponse{Token: token})
}
