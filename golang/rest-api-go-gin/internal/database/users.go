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
	Name string `json:"name"`
	Email string `json:"email"`
	Password string `json:"-"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}