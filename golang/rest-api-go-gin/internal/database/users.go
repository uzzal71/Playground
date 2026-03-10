package database

import (
	"context"
	"database/sql"
	"time"
)

type UserModel struct {
	DB *sql.DB
}

type User struct {
	Id        int    `json:"id"`
	Name      string `json:"name" binding:"required,min=3,max=100"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"-" binding:"required,min=6,max=100"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (m *UserModel) Insert(user *User) (int, error) {
	query := `
	INSERT INTO users (name, email, password, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?)
	`

	result, err := m.DB.Exec(query, user.Name, user.Email, user.Password, time.Now(), time.Now())
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

func (m *UserModel) Get(id int) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	query := `SELECT * FROM users WHERE id = $1`

	row := m.DB.QueryRowContext(ctx, query, id)

	var u User
	err := row.Scan(&u.Id, &u.Name, &u.Email, &u.Password, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &u, nil
}