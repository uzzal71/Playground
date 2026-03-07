package database

import (
	"database/sql"
	"time"
)

type EventModel struct {
	DB *sql.DB
}

type Event struct {
	Id          int       `json:"id"`
	OwnerId     int       `json:"owner_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	Location    string    `json:"location"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}