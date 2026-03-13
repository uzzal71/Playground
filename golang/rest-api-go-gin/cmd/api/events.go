package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"rest-api-in-gin/internal/database"
)

// createEvent creates a new event
// @Summary Create a new event
// @Description Create a new event (requires authentication)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param event body database.Event true "Event object"
// @Success 201 {object} database.Event
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events [post]
func (app *application) createEvent(ctx *gin.Context) {
	var event database.Event
	if err := ctx.ShouldBindJSON(&event); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := app.GetUserFromContext(ctx)
	if user.Id == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	event.OwnerId = user.Id

	id, err := app.models.Events.Insert(&event)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	event.Id = id
	ctx.JSON(http.StatusCreated, event)
}

// getAllEvents returns all events
// @Summary Return all events
// @Description Return all events
// @Tags Events
// @Accept json
// @Produce json
// @Success 200 {array} database.Event
// @Failure 500 {object} map[string]string
// @Router /api/v1/events [get]
func (app *application) getAllEvents(ctx *gin.Context) {
	events, err := app.models.Events.GetAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, events)
}

// getEvent returns a single event by ID
// @Summary Get event by ID
// @Description Get a single event by its ID
// @Tags Events
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {object} database.Event
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id} [get]
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

// updateEvent updates an existing event
// @Summary Update an event
// @Description Update an event by ID (owner only)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Param event body database.Event true "Updated event object"
// @Success 200 {object} database.Event
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id} [put]
func (app *application) updateEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	user := app.GetUserFromContext(ctx)
	if user.Id == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
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

	if existingEvent.OwnerId != user.Id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
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

// deleteEvent deletes an event
// @Summary Delete an event
// @Description Delete an event by ID (owner only)
// @Tags Events
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id} [delete]
func (app *application) deleteEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	user := app.GetUserFromContext(ctx)
	if user.Id == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
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

	if existingEvent.OwnerId != user.Id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = app.models.Events.Delete(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusNoContent, nil)
}

// addAttendanceToEvent adds a user as attendee
// @Summary Add attendance to event
// @Description Add a user as attendee to an event (owner only)
// @Tags Attendance
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Param userId path int true "User ID"
// @Success 201 {object} database.Attendance
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id}/attendance/{userId} [post]
func (app *application) addAttendanceToEvent(ctx *gin.Context) {
	eventId, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	userId, err := strconv.Atoi(ctx.Param("userId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
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

	userToAdd, err := app.models.Users.Get(userId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if userToAdd == nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user := app.GetUserFromContext(ctx)
	if user.Id == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if event.OwnerId != user.Id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	existingAttendance, err := app.models.Attendances.GetByEventAndAttendance(event.Id, userToAdd.Id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if existingAttendance != nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "user already attending this event"})
		return
	}

	attendance := &database.Attendance{
		UserId:  userToAdd.Id,
		EventId: event.Id,
	}

	attendanceId, err := app.models.Attendances.Insert(attendance)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	attendance.Id = attendanceId
	ctx.JSON(http.StatusCreated, attendance)
}

// getAttendanceForEvent returns all attendees for an event
// @Summary Get attendance for event
// @Description Get all attendees for a specific event
// @Tags Attendance
// @Accept json
// @Produce json
// @Param id path int true "Event ID"
// @Success 200 {array} database.Attendance
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id}/attendance [get]
func (app *application) getAttendanceForEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	attendances, err := app.models.Attendances.GetAttendancesByEvent(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, attendances)
}

// deleteAttendanceFromEvent removes a user from event attendance
// @Summary Remove attendance from event
// @Description Remove a user from event attendance (owner only)
// @Tags Attendance
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Event ID"
// @Param userId path int true "User ID"
// @Success 204
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/events/{id}/attendance/{userId} [delete]
func (app *application) deleteAttendanceFromEvent(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	userId, err := strconv.Atoi(ctx.Param("userId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
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

	user := app.GetUserFromContext(ctx)
	if user.Id == 0 {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	if event.OwnerId != user.Id {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	err = app.models.Attendances.Delete(userId, id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusNoContent, nil)
}

// getEventByAttendance returns events a user is attending
// @Summary Get events by user attendance
// @Description Get all events a specific user is attending
// @Tags Attendance
// @Accept json
// @Produce json
// @Param id path int true "User ID"
// @Success 200 {array} database.Event
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/users/{id}/events [get]
func (app *application) getEventByAttendance(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid event id"})
		return
	}

	events, err := app.models.Attendances.GetEventsByAttendance(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, events)
}