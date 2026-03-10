package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-api-in-gin/internal/database"
)

func (app *application) addAttendanceToEvent(ctx *gin.Context) {
	eventId, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	event, err := app.models.Events.Get(eventId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if event == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "event not found"})
		return
	}

	var attendance database.Attendance
	if err := ctx.ShouldBindJSON(&attendance); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attendance.EventId = eventId

	id, err := app.models.Attendances.Insert(&attendance)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	attendance.Id = id
	ctx.JSON(http.StatusCreated, attendance)
}

func (app *application) getEventAttendances(ctx *gin.Context) {
	eventId, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	attendances, err := app.models.Attendances.GetByEventId(eventId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, attendances)
}