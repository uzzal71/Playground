package database

import (
	"database/sql"
	"time"
)

type AttendanceModel struct {
	DB *sql.DB
}

type Attendance struct {
	Id        int       `json:"id"`
	UserId    int       `json:"userId", binding:"required"`
	EventId   int       `json:"eventId", binding:"required"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}