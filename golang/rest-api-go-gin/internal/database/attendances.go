package database

import (
	"database/sql"
	"time"
)

type AttendanceModel struct {
	DB *sql.DB
}

type Attendance struct {
	Id        int    `json:"id"`
	UserId    int    `json:"userId" binding:"required"`
	EventId   int    `json:"eventId"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func (m *AttendanceModel) Insert(attendance *Attendance) (int, error) {
	query := `
	INSERT INTO attendances (user_id, event_id, created_at, updated_at)
	VALUES (?, ?, ?, ?)
	`

	now := time.Now().Format(time.RFC3339)
	result, err := m.DB.Exec(query, attendance.UserId, attendance.EventId, now, now)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

func (m *AttendanceModel) GetByEventAndAttendance(eventId, userId int) (*Attendance, error) {
	query := `SELECT id, user_id, event_id, created_at, updated_at FROM attendances WHERE event_id = ? AND user_id = ?`

	row := m.DB.QueryRow(query, eventId, userId)

	var a Attendance
	err := row.Scan(&a.Id, &a.UserId, &a.EventId, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &a, nil
}

func (m *AttendanceModel) GetAttendancesByEvent(eventId int) ([]*Attendance, error) {
	query := `SELECT id, user_id, event_id, created_at, updated_at FROM attendances WHERE event_id = ?`

	rows, err := m.DB.Query(query, eventId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attendances []*Attendance

	for rows.Next() {
		var a Attendance
		err := rows.Scan(&a.Id, &a.UserId, &a.EventId, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		attendances = append(attendances, &a)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return attendances, nil
}