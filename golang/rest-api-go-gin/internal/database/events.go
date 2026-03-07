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
	OwnerId     int       `json:"ownerId" binding:"required"`
	Name        string    `json:"name" binding:"required, min=3, max=100"`
	Description string    `json:"description" binding:"required, min=10, max=200"`
	Date        time.Time `json:"date" binding:"required, datetime=2026-01-02"`
	Location    string    `json:"location" binding:"required, min=3, max=100"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}