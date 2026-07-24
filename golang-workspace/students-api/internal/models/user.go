package models

type User struct {
	ID       uint   `json:"id" gorm:"primaryKey"`
	Name     string `json:"name" gorm:"not null" binding:"required"`
	Email    string `json:"email" gorm:"not null;unique" binding:"required,email"`
	Password string `json:"password" gorm:"not null" binding:"required,min=6"`
}
