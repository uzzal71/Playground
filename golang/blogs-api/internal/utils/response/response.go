package response

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
)

type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

const (
	StatusSuccess = "success"
	StatusError = "error"
)

func WriteJson(w http.ResponseWriter, status int, data interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("Failed to write JSON response", "error", err)
		return err
	}
	return nil
}

func GeneralError(err error) Response {
	return Response{
		Status:  StatusError,
		Message: err.Error(),
		Data:    nil,
	}
}

func ValidationError(err validator.ValidationErrors) Response {
	var messages []string
	for _, err := range err {
		switch err.ActualTag() {
		case "required":
			messages = append(messages, err.Field()+" is required")
		default:
			messages = append(messages, err.Field()+" is invalid")
		}		
	}
	
	return Response{
		Status:  StatusError,
		Message: strings.Join(messages, ", "),
		Data:    nil,
	}
}

func SuccessResponse(message string, data interface{}) Response {
	return Response{
		Status:  StatusSuccess,
		Message: message,
		Data:    data,
	}
}