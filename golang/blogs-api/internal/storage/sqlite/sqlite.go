package sqlite

import (
	"database/sql"
	"fmt"

	"github.com/uzzal71/blogs-api/internal/config"
	"github.com/uzzal71/blogs-api/internal/types"
	_ "github.com/mattn/go-sqlite3"
)

type Sqlite struct {
	Db *sql.DB
}

func New(cfg *config.Config) (*Sqlite, error) {
	db, err := sql.Open("sqlite3", cfg.StoragePath)
	if err != nil {
		return nil, err
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS blogs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	title TEXT,
	content TEXT
	)`)

	if err != nil {
		return nil, err
	}

	return &Sqlite{
		Db: db,
	}, nil
}

func (s *Sqlite) CreateBlog(title string, content string) (int64, error) {

	stmt, err := s.Db.Prepare("INSERT INTO blogs (title, content) VALUES (?, ?)")
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(title, content)
	if err != nil {
		return 0, err
	}

	lastId, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return lastId, nil
}

func (s *Sqlite) GetBlogById(id int64) (types.Blog, error) {
	stmt, err := s.Db.Prepare("SELECT id, title, content FROM blogs WHERE id = ? LIMIT 1")
	if err != nil {
		return types.Blog{}, err
	}

	defer stmt.Close()

	var blog types.Blog

	err = stmt.QueryRow(id).Scan(&blog.ID, &blog.Title, &blog.Content)
	if err != nil {
		if err == sql.ErrNoRows {
			return types.Blog{}, fmt.Errorf("no blog found with id %s", fmt.Sprint(id))
		}
		return types.Blog{}, fmt.Errorf("query error: %w", err)
	}

	return blog, nil
}

func (s *Sqlite) GetBlogs() ([]types.Blog, error) {
	stmt, err := s.Db.Prepare("SELECT id, title, content FROM blogs")
	if err != nil {
		return nil, err
	}

	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	var blogs []types.Blog

	for rows.Next() {
		var blog types.Blog

		err := rows.Scan(&blog.ID, &blog.Title, &blog.Content)
		if err != nil {
			return nil, err
		}

		blogs = append(blogs, blog)
	}

	return blogs, nil
}
