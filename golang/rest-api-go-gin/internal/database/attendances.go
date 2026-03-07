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
	UserId    int       `json:"user_id"`
	EventId   int       `json:"event_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}