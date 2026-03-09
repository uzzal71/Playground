package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-api-in-gin/internal/database"
)

func (app *application) createEvent(ctx *gin.Context) {
	var event database.Event
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := app.models.Events.Insert(&event)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	event.Id = id
	ctx.JSON(http.StatusCreated, event)
}

func (app *application) getAllEvents(ctx *gin.Context) {
	events, err := app.models.Events.GetAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, events)
}

func (app *application) getEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	event, err := app.models.Events.Get(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if event == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	ctx.JSON(http.StatusOK, event)
}

func (app *application) updateEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id")	)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existingEvent, err := app.models.Events.Get(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingEvent == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	updatedEvent := &database.Event{}
	if err := ctx.ShouldBindJSON(updatedEvent); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedEvent.Id = id

	err = app.models.Events.Update(updatedEvent)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedEvent)
}

func (app *application) deleteEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	err = app.models.Events.Delete(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusNoContent, nil)
}