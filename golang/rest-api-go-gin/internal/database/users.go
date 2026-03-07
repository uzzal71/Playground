package database

import (
	"database/sql"
	"time"
)

type UserModel struct {
	DB *sql.DB
}

type User struct {
	Id 	 int `json:"id"`
	Name string `json:"name", binding:"required, min=3, max=100"`
	Email string `json:"email", binding:"required, email"`
	Password string `json:"-" binding:"required, min=6, max=100"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}