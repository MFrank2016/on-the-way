package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/services"
	"on-the-way/backend/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type HabitController struct {
	db              *gorm.DB
	reminderService *services.ReminderService
}

func NewHabitController(db *gorm.DB) *HabitController {
	return &HabitController{
		db:              db,
		reminderService: services.NewReminderService(db),
	}
}

type HabitRequest struct {
	Name              string     `json:"name" binding:"required"`
	Icon              string     `json:"icon"`
	Frequency         string     `json:"frequency"`     // daily, weekly, custom
	FrequencyDays     string     `json:"frequencyDays"` // JSON数组
	FrequencyInterval int        `json:"frequencyInterval"`
	GoalType          string     `json:"goalType"`      // daily_complete, times_per_day
	GoalCount         int        `json:"goalCount"`     // 目标次数
	StartDate         *time.Time `json:"startDate"`     // 开始日期
	EndDays           int        `json:"endDays"`       // 持续天数
	Group             string     `json:"group"`         // 分组
	ReminderTimes     string     `json:"reminderTimes"` // JSON数组
	AutoJournal       bool       `json:"autoJournal"`
}

func (ctrl *HabitController) GetHabits(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var habits []models.Habit
	if err := ctrl.db.Where("user_id = ?", userID).Preload("Records").Find(&habits).Error; err != nil {
		utils.InternalError(c, "Failed to get habits")
		return
	}

	// 构造带连续打卡天数的响应
	type HabitResponse struct {
		models.Habit
		CurrentStreak int `json:"currentStreak"`
	}

	var response []HabitResponse
	for _, habit := range habits {
		response = append(response, HabitResponse{
			Habit:         habit,
			CurrentStreak: calculateStreak(habit.Records),
		})
	}

	utils.Success(c, response)
}

func (ctrl *HabitController) CreateHabit(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req HabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	habit := models.Habit{
		UserID:            userID,
		Name:              req.Name,
		Icon:              req.Icon,
		Frequency:         req.Frequency,
		FrequencyDays:     req.FrequencyDays,
		FrequencyInterval: req.FrequencyInterval,
		GoalType:          req.GoalType,
		GoalCount:         req.GoalCount,
		StartDate:         req.StartDate,
		EndDays:           req.EndDays,
		Group:             req.Group,
		ReminderTimes:     req.ReminderTimes,
		AutoJournal:       req.AutoJournal,
	}

	if err := ctrl.db.Create(&habit).Error; err != nil {
		utils.InternalError(c, "Failed to create habit")
		return
	}

	// 创建提醒
	if req.ReminderTimes != "" {
		ctrl.reminderService.CreateReminderForHabit(&habit)
	}

	utils.Success(c, habit)
}

func (ctrl *HabitController) UpdateHabit(c *gin.Context) {
	userID := middleware.GetUserID(c)
	habitID := c.Param("id")

	var habit models.Habit
	if err := ctrl.db.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		utils.NotFound(c, "Habit not found")
		return
	}

	var req HabitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	habit.Name = req.Name
	habit.Icon = req.Icon
	habit.Frequency = req.Frequency
	habit.FrequencyDays = req.FrequencyDays
	habit.FrequencyInterval = req.FrequencyInterval
	habit.GoalType = req.GoalType
	habit.GoalCount = req.GoalCount
	habit.StartDate = req.StartDate
	habit.EndDays = req.EndDays
	habit.Group = req.Group
	habit.ReminderTimes = req.ReminderTimes
	habit.AutoJournal = req.AutoJournal

	if err := ctrl.db.Save(&habit).Error; err != nil {
		utils.InternalError(c, "Failed to update habit")
		return
	}

	// 更新提醒
	if req.ReminderTimes != "" {
		ctrl.reminderService.CreateReminderForHabit(&habit)
	} else {
		// 删除提醒
		ctrl.db.Where("entity_type = ? AND entity_id = ?", "habit", habit.ID).Delete(&models.Reminder{})
	}

	utils.Success(c, habit)
}

func (ctrl *HabitController) DeleteHabit(c *gin.Context) {
	userID := middleware.GetUserID(c)
	habitID := c.Param("id")

	// 删除相关提醒
	ctrl.db.Where("entity_type = ? AND entity_id = ?", "habit", habitID).Delete(&models.Reminder{})

	result := ctrl.db.Where("id = ? AND user_id = ?", habitID, userID).Delete(&models.Habit{})
	if result.Error != nil {
		utils.InternalError(c, "Failed to delete habit")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Habit not found")
		return
	}

	utils.Success(c, gin.H{"message": "Habit deleted successfully"})
}

type CheckInRequest struct {
	Date string `json:"date"` // 打卡日期，格式：yyyy-MM-dd，如果不提供则默认为今天
}

func (ctrl *HabitController) CheckIn(c *gin.Context) {
	userID := middleware.GetUserID(c)
	habitIDStr := c.Param("id")

	habitID, err := strconv.ParseUint(habitIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid habit ID")
		return
	}

	// 验证habit是否存在
	var habit models.Habit
	if err := ctrl.db.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		utils.NotFound(c, "Habit not found")
		return
	}

	// 获取请求参数
	var req CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 如果绑定失败，使用今天的日期
		req.Date = ""
	}

	// 确定打卡日期
	var checkDate time.Time
	if req.Date != "" {
		// 解析日期字符串 (格式: yyyy-MM-dd)
		parseDate, parseErr := time.Parse("2006-01-02", req.Date)
		if parseErr != nil {
			utils.BadRequest(c, "Invalid date format, expected yyyy-MM-dd")
			return
		}
		checkDate = parseDate
	} else {
		checkDate = utils.Now()
	}

	// 只保留日期部分，去掉时间
	dateOnly := utils.BeginningOfDay(checkDate)

	// 检查该日期是否已打卡
	var existingRecord models.HabitRecord
	checkErr := ctrl.db.Where("habit_id = ? AND check_date = ?", habitID, dateOnly).First(&existingRecord).Error
	if checkErr == nil {
		utils.BadRequest(c, "Already checked in on this date")
		return
	}

	record := models.HabitRecord{
		HabitID:   habitID,
		CheckDate: dateOnly,
	}

	if err := ctrl.db.Create(&record).Error; err != nil {
		utils.InternalError(c, "Failed to check in")
		return
	}

	utils.Success(c, record)
}

// CancelCheckIn 取消打卡
func (ctrl *HabitController) CancelCheckIn(c *gin.Context) {
	userID := middleware.GetUserID(c)
	habitIDStr := c.Param("id")

	habitID, err := strconv.ParseUint(habitIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid habit ID")
		return
	}

	// 验证habit是否存在
	var habit models.Habit
	if err := ctrl.db.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		utils.NotFound(c, "Habit not found")
		return
	}

	// 获取请求参数
	var req CheckInRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// 如果绑定失败，使用今天的日期
		req.Date = ""
	}

	// 确定打卡日期
	var checkDate time.Time
	if req.Date != "" {
		// 解析日期字符串 (格式: yyyy-MM-dd)
		parseDate, parseErr := time.Parse("2006-01-02", req.Date)
		if parseErr != nil {
			utils.BadRequest(c, "Invalid date format, expected yyyy-MM-dd")
			return
		}
		checkDate = parseDate
	} else {
		checkDate = utils.Now()
	}

	// 只保留日期部分，去掉时间
	dateOnly := utils.BeginningOfDay(checkDate)
	nextDay := dateOnly.AddDate(0, 0, 1)

	// 查找该日期的打卡记录（通过日期范围查询，忽略时间部分）
	var record models.HabitRecord
	findErr := ctrl.db.Where("habit_id = ? AND check_date >= ? AND check_date < ?", habitID, dateOnly, nextDay).First(&record).Error
	if findErr != nil {
		utils.NotFound(c, "Check-in record not found for this date")
		return
	}

	if err := ctrl.db.Delete(&record).Error; err != nil {
		utils.InternalError(c, "Failed to cancel check-in")
		return
	}

	utils.Success(c, gin.H{"message": "Check-in cancelled successfully"})
}

func (ctrl *HabitController) GetRecords(c *gin.Context) {
	userID := middleware.GetUserID(c)
	habitID := c.Param("id")

	// 验证habit是否存在
	var habit models.Habit
	if err := ctrl.db.Where("id = ? AND user_id = ?", habitID, userID).First(&habit).Error; err != nil {
		utils.NotFound(c, "Habit not found")
		return
	}

	var records []models.HabitRecord
	if err := ctrl.db.Where("habit_id = ?", habitID).Order("check_date DESC").Find(&records).Error; err != nil {
		utils.InternalError(c, "Failed to get records")
		return
	}

	utils.Success(c, records)
}

// 计算连续打卡天数
func calculateStreak(records []models.HabitRecord) int {
	if len(records) == 0 {
		return 0
	}

	// 按日期排序
	dates := make([]time.Time, len(records))
	for i, r := range records {
		dates[i] = r.CheckDate
	}

	// 简单实现：从最近的日期开始计数
	dateOnly := utils.Today()

	streak := 0
	checkDate := dateOnly

	for {
		found := false
		for _, d := range dates {
			if d.Equal(checkDate) {
				found = true
				streak++
				break
			}
		}

		if !found {
			break
		}

		checkDate = checkDate.AddDate(0, 0, -1)
	}

	return streak
}
