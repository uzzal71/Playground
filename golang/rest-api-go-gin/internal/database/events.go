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

func (m *EventModel) Insert(event *Event) (int, error) {
	query := `
	INSERT INTO events (owner_id, name, description, date, location, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	result, err := m.DB.Exec(query, event.OwnerId, event.Name, event.Description, event.Date, event.Location, time.Now(), time.Now())
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

func (m *EventModel) GetAll() ([]*Event, error) {
	query := `SELECT id, owner_id, name, description, date, location, created_at, updated_at FROM events`

	rows, err := m.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var events []*Event

	for rows.Next() {
		var event Event
		err := rows.Scan(&event.Id, &event.OwnerId, &event.Name, &event.Description, &event.Date, &event.Location, &event.CreatedAt, &event.UpdatedAt)
		if err != nil {
			return nil, err
		}
		events = append(events, &event)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}

func (m *EventModel) Get(id int) (*Event, error) {
	query := `SELECT id, owner_id, name, description, date, location, created_at, updated_at FROM events WHERE id = ?`

	row := m.DB.QueryRow(query, id)

	var event Event
	err := row.Scan(&event.Id, &event.OwnerId, &event.Name, &event.Description, &event.Date, &event.Location, &event.CreatedAt, &event.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &event, nil
}

func (m *EventModel) Update(event *Event) error	 {
	query := `
	UPDATE events
	SET owner_id = ?, name = ?, description = ?, date = ?, location = ?, updated_at = ?
	WHERE id = ?
	`

	_, err := m.DB.Exec(query, event.OwnerId, event.Name, event.Description, event.Date, event.Location, time.Now(), event.Id)
	return err
}

func (m *EventModel) Delete(id int) error {
	query := `DELETE FROM events WHERE id = ?`

	_, err := m.DB.Exec(query, id)
	return err
}	