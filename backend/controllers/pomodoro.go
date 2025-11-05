package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PomodoroController struct {
	db *gorm.DB
}

func NewPomodoroController(db *gorm.DB) *PomodoroController {
	return &PomodoroController{db: db}
}

type PomodoroStartRequest struct {
	TaskID *string `json:"taskId"`
}

func (ctrl *PomodoroController) Start(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req PomodoroStartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	pomodoro := models.Pomodoro{
		ID:        uuid.New().String(),
		UserID:    userID,
		TaskID:    req.TaskID,
		StartTime: time.Now(),
	}

	if err := ctrl.db.Create(&pomodoro).Error; err != nil {
		utils.InternalError(c, "Failed to start pomodoro")
		return
	}

	ctrl.db.Preload("Task").First(&pomodoro, "id = ?", pomodoro.ID)
	utils.Success(c, pomodoro)
}

func (ctrl *PomodoroController) End(c *gin.Context) {
	userID := middleware.GetUserID(c)
	pomodoroID := c.Param("id")

	var pomodoro models.Pomodoro
	if err := ctrl.db.Where("id = ? AND user_id = ?", pomodoroID, userID).First(&pomodoro).Error; err != nil {
		utils.NotFound(c, "Pomodoro not found")
		return
	}

	now := time.Now()
	pomodoro.EndTime = &now
	pomodoro.Duration = int(now.Sub(pomodoro.StartTime).Seconds())

	if err := ctrl.db.Save(&pomodoro).Error; err != nil {
		utils.InternalError(c, "Failed to end pomodoro")
		return
	}

	// 更新统计数据
	dateOnly := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	var stats models.Statistics
	err := ctrl.db.Where("user_id = ? AND date = ?", userID, dateOnly).First(&stats).Error
	
	if err == gorm.ErrRecordNotFound {
		stats = models.Statistics{
			ID:            uuid.New().String(),
			UserID:        userID,
			Date:          dateOnly,
			PomodoroCount: 1,
			FocusTime:     pomodoro.Duration,
		}
		ctrl.db.Create(&stats)
	} else {
		stats.PomodoroCount++
		stats.FocusTime += pomodoro.Duration
		ctrl.db.Save(&stats)
	}

	ctrl.db.Preload("Task").First(&pomodoro, "id = ?", pomodoro.ID)
	utils.Success(c, pomodoro)
}

func (ctrl *PomodoroController) GetPomodoros(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var pomodoros []models.Pomodoro
	query := ctrl.db.Where("user_id = ?", userID).Preload("Task")

	// 根据日期筛选
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	if startDate != "" {
		query = query.Where("start_time >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("start_time <= ?", endDate)
	}

	query = query.Order("start_time DESC")

	if err := query.Find(&pomodoros).Error; err != nil {
		utils.InternalError(c, "Failed to get pomodoros")
		return
	}

	utils.Success(c, pomodoros)
}

func (ctrl *PomodoroController) GetTodayStats(c *gin.Context) {
	userID := middleware.GetUserID(c)

	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var count int64
	var totalDuration int

	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ?", userID, startOfDay, endOfDay).
		Count(&count)

	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ? AND end_time IS NOT NULL", userID, startOfDay, endOfDay).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&totalDuration)

	utils.Success(c, gin.H{
		"count":        count,
		"totalDuration": totalDuration,
	})
}

