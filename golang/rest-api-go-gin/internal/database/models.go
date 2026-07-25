package database

import "database/sql"

type Models struct {
	Users UserModel
	Events EventModel
	Attendances AttendanceModel
}

func NewModels(db *sql.DB) Models {
	return Models{
		Users: UserModel{DB: db},
		Events: EventModel{DB: db},
		Attendances: AttendanceModel{DB: db},
	}
}