package types

type Blog struct {
	ID      string `json:"id"`
	Title   string `json:"title" validate:"required"`
	Content string `json:"content" validate:"required"`
}