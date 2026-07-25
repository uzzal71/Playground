package repository

import (
	"errors"
	"fmt"

	"github.com/uzzal71/students-api/internal/models"
	"gorm.io/gorm"
)

type StudentRepository interface {
	Create(student *models.Student) error
	GetByID(id uint) (*models.Student, error)
	GetAll() ([]models.Student, error)
}

type studentRepository struct {
	db *gorm.DB
}

func NewStudentRepository(db *gorm.DB) StudentRepository {
	return &studentRepository{db: db}
}

func (r *studentRepository) Create(student *models.Student) error {
	return r.db.Create(student).Error
}

func (r *studentRepository) GetByID(id uint) (*models.Student, error) {
	var student models.Student

	if err := r.db.First(&student, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("no student found with id %d", id)
		}
		return nil, err
	}

	return &student, nil
}

func (r *studentRepository) GetAll() ([]models.Student, error) {
	var students []models.Student

	if err := r.db.Find(&students).Error; err != nil {
		return nil, err
	}

	return students, nil
}
