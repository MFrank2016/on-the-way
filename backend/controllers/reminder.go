package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/services"
	"on-the-way/backend/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ReminderController struct {
	db      *gorm.DB
	service *services.ReminderService
}

func NewReminderController(db *gorm.DB) *ReminderController {
	return &ReminderController{
		db:      db,
		service: services.NewReminderService(db),
	}
}

// GetActiveReminders 获取当前用户的活跃提醒
func (ctrl *ReminderController) GetActiveReminders(c *gin.Context) {
	userID := middleware.GetUserID(c)

	reminders, err := ctrl.service.CheckAndTriggerReminders(userID)
	if err != nil {
		utils.InternalError(c, "Failed to get reminders")
		return
	}

	utils.Success(c, reminders)
}

// MarkReminderSent 标记提醒已发送
func (ctrl *ReminderController) MarkReminderSent(c *gin.Context) {
	reminderID := c.Param("id")

	if err := ctrl.service.MarkReminderSent(reminderID); err != nil {
		utils.InternalError(c, "Failed to mark reminder as sent")
		return
	}

	utils.Success(c, nil)
}

// SnoozeReminder 延迟提醒
func (ctrl *ReminderController) SnoozeReminder(c *gin.Context) {
	reminderID := c.Param("id")
	minutesStr := c.Query("minutes")

	minutes, err := strconv.Atoi(minutesStr)
	if err != nil || minutes <= 0 {
		minutes = 10 // 默认延迟10分钟
	}

	if err := ctrl.service.SnoozeReminder(reminderID, minutes); err != nil {
		utils.InternalError(c, "Failed to snooze reminder")
		return
	}

	utils.Success(c, nil)
}

// DeleteReminder 删除提醒
func (ctrl *ReminderController) DeleteReminder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	reminderID := c.Param("id")

	if err := ctrl.service.DeleteReminder(reminderID, userID); err != nil {
		utils.InternalError(c, "Failed to delete reminder")
		return
	}

	utils.Success(c, nil)
}

