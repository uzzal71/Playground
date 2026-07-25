package blog

import (
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/uzzal71/blogs-api/internal/types"
	"github.com/uzzal71/blogs-api/internal/utils/response"
)


func New() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slog.Info("Handling request for /api/blogs")
		
		var blog types.Blog
		
		err := json.NewDecoder(r.Body).Decode(&blog)
		if errors.Is(err, io.EOF) {
			response.WriteJson(w, http.StatusBadRequest, response.GeneralError(errors.New("request body is empty")))
			return
		}
		if err != nil {
			response.WriteJson(w, http.StatusBadRequest, response.GeneralError(errors.New("invalid request body")))
			return
		}

		// reqeust validation
		if err := validator.New().Struct(blog); err != nil {
			response.WriteJson(w, http.StatusBadRequest, response.ValidationError(err.(validator.ValidationErrors)))
			return
		}

		response.WriteJson(w, http.StatusOK, response.SuccessResponse("Blog created successfully", blog))
	}
}