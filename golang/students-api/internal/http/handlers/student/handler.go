package student

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/uzzal71/students-api/internal/models"
	"github.com/uzzal71/students-api/internal/repository"
)

type Handler struct {
	repo repository.StudentRepository
}

func NewHandler(repo repository.StudentRepository) *Handler {
	return &Handler{repo: repo}
}

// Create godoc
// @Summary      Create a student
// @Tags         students
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        student  body      models.Student  true  "Student info"
// @Success      201      {object}  models.Student
// @Failure      400      {object}  map[string]string
// @Failure      401      {object}  map[string]string
// @Router       /students [post]
func (h *Handler) Create(c *gin.Context) {
	var student models.Student

	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.Create(&student); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, student)
}

// GetByID godoc
// @Summary      Get a student by ID
// @Tags         students
// @Produce      json
// @Security     BearerAuth
// @Param        id   path      int  true  "Student ID"
// @Success      200  {object}  models.Student
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /students/{id} [get]
func (h *Handler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	student, err := h.repo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, student)
}

// GetAll godoc
// @Summary      List all students
// @Tags         students
// @Produce      json
// @Security     BearerAuth
// @Success      200  {array}   models.Student
// @Failure      401  {object}  map[string]string
// @Router       /students [get]
func (h *Handler) GetAll(c *gin.Context) {
	students, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, students)
}
