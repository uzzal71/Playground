package storage

import "github.com/uzzal71/blogs-api/internal/types"


type Storage interface {
	CreateBlog(title string, content string) (int64, error)
	GetBlogById(id int64) (types.Blog, error)
	GetBlogs() ([]types.Blog, error)
}