package blog

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/uzzal71/blogs-api/internal/storage"
	"github.com/uzzal71/blogs-api/internal/types"
	"github.com/uzzal71/blogs-api/internal/utils/response"
)

func New(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slog.Info("creating a blog")

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

		if err := validator.New().Struct(blog); err != nil {
			response.WriteJson(w, http.StatusBadRequest, response.ValidationError(err.(validator.ValidationErrors)))
			return
		}

		lastId, err := storage.CreateBlog(blog.Title, blog.Content)
		if err != nil {
			response.WriteJson(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}

		slog.Info("blog created successfully", slog.String("blogId", fmt.Sprint(lastId)))

		response.WriteJson(w, http.StatusCreated, response.SuccessResponse("Blog created successfully", map[string]int64{"id": lastId}))
	}
}

func GetById(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		slog.Info("getting a blog", slog.String("id", id))

		intId, err := strconv.ParseInt(id, 10, 64)
		if err != nil {
			response.WriteJson(w, http.StatusBadRequest, response.GeneralError(err))
			return
		}

		blog, err := storage.GetBlogById(intId)
		if err != nil {
			slog.Error("error getting blog", slog.String("id", id))
			response.WriteJson(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}

		response.WriteJson(w, http.StatusOK, response.SuccessResponse("Blog fetched successfully", blog))
	}
}

func GetList(storage storage.Storage) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slog.Info("getting all blogs")

		blogs, err := storage.GetBlogs()
		if err != nil {
			response.WriteJson(w, http.StatusInternalServerError, response.GeneralError(err))
			return
		}

		response.WriteJson(w, http.StatusOK, response.SuccessResponse("Blogs fetched successfully", blogs))
	}
}
