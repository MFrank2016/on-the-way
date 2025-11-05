package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatisticsController struct {
	db *gorm.DB
}

func NewStatisticsController(db *gorm.DB) *StatisticsController {
	return &StatisticsController{db: db}
}

func (ctrl *StatisticsController) GetOverview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 总任务数
	var totalTasks int64
	ctrl.db.Model(&models.Task{}).Where("user_id = ?", userID).Count(&totalTasks)

	// 已完成任务数
	var completedTasks int64
	ctrl.db.Model(&models.Task{}).Where("user_id = ? AND status = ?", userID, "completed").Count(&completedTasks)

	// 清单数
	var totalLists int64
	ctrl.db.Model(&models.List{}).Where("user_id = ?", userID).Count(&totalLists)

	// 使用天数（从创建第一个任务开始）
	var firstTask models.Task
	var usageDays int
	err := ctrl.db.Where("user_id = ?", userID).Order("created_at ASC").First(&firstTask).Error
	if err == nil {
		usageDays = int(time.Since(firstTask.CreatedAt).Hours() / 24)
	}

	// 今日统计
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var todayCompleted int64
	ctrl.db.Model(&models.Task{}).
		Where("user_id = ? AND status = ? AND completed_at >= ? AND completed_at < ?", userID, "completed", startOfDay, endOfDay).
		Count(&todayCompleted)

	var todayPomodoros int64
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ?", userID, startOfDay, endOfDay).
		Count(&todayPomodoros)

	var todayFocusTime int
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ? AND end_time IS NOT NULL", userID, startOfDay, endOfDay).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&todayFocusTime)

	// 总番茄数和总专注时长
	var totalPomodoros int64
	ctrl.db.Model(&models.Pomodoro{}).Where("user_id = ?", userID).Count(&totalPomodoros)

	var totalFocusTime int
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND end_time IS NOT NULL", userID).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&totalFocusTime)

	// 计算连续打卡天数
	streakDays := ctrl.calculateStreakDays(userID)

	// 计算成就值
	achievementScore := ctrl.calculateAchievementScore(int(completedTasks), totalFocusTime, streakDays)

	// 计算本周打卡进展
	weeklyCheckIn := ctrl.getWeeklyCheckIn(userID)

	utils.Success(c, gin.H{
		"totalTasks":       totalTasks,
		"completedTasks":   completedTasks,
		"totalLists":       totalLists,
		"usageDays":        usageDays,
		"todayCompleted":   todayCompleted,
		"todayPomodoros":   todayPomodoros,
		"todayFocusTime":   todayFocusTime,
		"totalPomodoros":   totalPomodoros,
		"totalFocusTime":   totalFocusTime,
		"streakDays":       streakDays,
		"achievementScore": achievementScore,
		"weeklyCheckIn":    weeklyCheckIn,
	})
}

func (ctrl *StatisticsController) GetDaily(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 获取最近30天的统计
	var stats []models.Statistics
	startDate := time.Now().AddDate(0, 0, -30)

	if err := ctrl.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date ASC").Find(&stats).Error; err != nil {
		utils.InternalError(c, "Failed to get daily statistics")
		return
	}

	utils.Success(c, stats)
}

func (ctrl *StatisticsController) GetTrends(c *gin.Context) {
	userID := middleware.GetUserID(c)

	days := c.DefaultQuery("days", "7")
	daysInt := 7
	if days == "30" {
		daysInt = 30
	}

	// 获取从N天前到今天（包括今天）的数据
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, -(daysInt - 1))
	endDate := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999, now.Location())

	var stats []models.Statistics
	if err := ctrl.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date ASC").Find(&stats).Error; err != nil {
		utils.InternalError(c, "Failed to get trends")
		return
	}

	// 如果查询结果为空或不足7天，补充空数据
	if len(stats) == 0 || len(stats) < daysInt {
		// 创建一个完整的7天数据map
		dateMap := make(map[string]models.Statistics)
		for _, stat := range stats {
			dateKey := stat.Date.Format("2006-01-02")
			dateMap[dateKey] = stat
		}

		// 生成完整的7天数据
		fullStats := make([]models.Statistics, 0, daysInt)
		for i := 0; i < daysInt; i++ {
			date := startDate.AddDate(0, 0, i)
			dateKey := date.Format("2006-01-02")

			if stat, exists := dateMap[dateKey]; exists {
				fullStats = append(fullStats, stat)
			} else {
				// 补充空数据
				fullStats = append(fullStats, models.Statistics{
					Date:           date,
					CompletedTasks: 0,
					PomodoroCount:  0,
					FocusTime:      0,
				})
			}
		}
		stats = fullStats
	}

	utils.Success(c, stats)
}

func (ctrl *StatisticsController) GetFocus(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 今日番茄和专注时长
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	var todayPomodoros int64
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ?", userID, startOfDay, endOfDay).
		Count(&todayPomodoros)

	var todayFocusTime int
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND start_time >= ? AND start_time < ? AND end_time IS NOT NULL", userID, startOfDay, endOfDay).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&todayFocusTime)

	// 总番茄数和总专注时长
	var totalPomodoros int64
	ctrl.db.Model(&models.Pomodoro{}).Where("user_id = ?", userID).Count(&totalPomodoros)

	var totalFocusTime int
	ctrl.db.Model(&models.Pomodoro{}).
		Where("user_id = ? AND end_time IS NOT NULL", userID).
		Select("COALESCE(SUM(duration), 0)").
		Scan(&totalFocusTime)

	// 最近的专注记录
	var recentPomodoros []models.Pomodoro
	ctrl.db.Where("user_id = ? AND end_time IS NOT NULL", userID).
		Preload("Task").
		Order("start_time DESC").
		Limit(20).
		Find(&recentPomodoros)

	// 专注趋势（最近7天）
	startOfWeek := startOfDay.AddDate(0, 0, -6)
	var weeklyStats []models.Statistics
	ctrl.db.Where("user_id = ? AND date >= ?", userID, startOfWeek).
		Order("date ASC").
		Find(&weeklyStats)

	// 最佳专注时间分析
	bestFocusTime := ctrl.getBestFocusTime(userID)

	// 专注时间详情（按任务分组）
	focusDetails := ctrl.getFocusDetailsByTask(userID)

	utils.Success(c, gin.H{
		"todayPomodoros": todayPomodoros,
		"totalPomodoros": totalPomodoros,
		"todayFocusTime": todayFocusTime,
		"totalFocusTime": totalFocusTime,
		"focusRecords":   recentPomodoros,
		"focusTrends":    weeklyStats,
		"bestFocusTime":  bestFocusTime,
		"focusDetails":   focusDetails,
	})
}

func (ctrl *StatisticsController) GetHeatmap(c *gin.Context) {
	userID := middleware.GetUserID(c)
	year := c.DefaultQuery("year", "2025")

	// 获取指定年份的所有统计数据
	startDate := year + "-01-01"
	endDate := year + "-12-31"

	var stats []models.Statistics
	if err := ctrl.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Find(&stats).Error; err != nil {
		utils.InternalError(c, "Failed to get heatmap data")
		return
	}

	// 转换为热力图格式
	heatmapData := make([]gin.H, 0)
	for _, stat := range stats {
		level := 0
		if stat.FocusTime > 0 {
			// 根据专注时长计算level (0-4)
			hours := stat.FocusTime / 3600
			if hours >= 5 {
				level = 4
			} else if hours >= 3 {
				level = 3
			} else if hours >= 1 {
				level = 2
			} else {
				level = 1
			}
		}

		heatmapData = append(heatmapData, gin.H{
			"date":  stat.Date.Format("2006-01-02"),
			"count": stat.FocusTime,
			"level": level,
		})
	}

	utils.Success(c, heatmapData)
}

// GetTasksByCategory 获取任务分类统计
func (ctrl *StatisticsController) GetTasksByCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 获取日期范围参数
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	// 如果没有指定日期范围，默认获取最近30天
	if startDate == "" || endDate == "" {
		now := time.Now()
		endDate = now.Format("2006-01-02")
		startDate = now.AddDate(0, 0, -30).Format("2006-01-02")
	}

	// 查询按清单分类的已完成任务
	type CategoryStat struct {
		ListID    string
		ListName  string
		ListColor string
		Count     int64
	}

	var categoryStats []CategoryStat
	ctrl.db.Table("tasks").
		Select("tasks.list_id, lists.name as list_name, lists.color as list_color, COUNT(*) as count").
		Joins("LEFT JOIN lists ON tasks.list_id = lists.id").
		Where("tasks.user_id = ? AND tasks.status = ? AND DATE(tasks.completed_at) >= ? AND DATE(tasks.completed_at) <= ?", userID, "completed", startDate, endDate).
		Group("tasks.list_id, lists.name, lists.color").
		Scan(&categoryStats)

	// 转换为返回格式
	result := make([]gin.H, 0)
	for _, stat := range categoryStats {
		color := stat.ListColor
		if color == "" {
			color = "#3b82f6" // 默认蓝色
		}
		result = append(result, gin.H{
			"listId":   stat.ListID,
			"listName": stat.ListName,
			"count":    stat.Count,
			"color":    color,
		})
	}

	utils.Success(c, result)
}

// calculateStreakDays 计算连续打卡天数
func (ctrl *StatisticsController) calculateStreakDays(userID string) int {
	now := time.Now()
	streakDays := 0
	currentDate := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	// 从今天开始向前查找
	for {
		var count int64
		ctrl.db.Model(&models.Statistics{}).
			Where("user_id = ? AND date = ? AND (completed_tasks > 0 OR pomodoro_count > 0)", userID, currentDate).
			Count(&count)

		if count == 0 {
			break
		}

		streakDays++
		currentDate = currentDate.AddDate(0, 0, -1)

		// 防止无限循环，最多统计365天
		if streakDays >= 365 {
			break
		}
	}

	return streakDays
}

// calculateAchievementScore 计算成就值
func (ctrl *StatisticsController) calculateAchievementScore(completedTasks int, focusTime int, streakDays int) int {
	// 成就值计算公式：
	// 完成任务数 * 10 + 专注时长（小时）* 50 + 连续打卡天数 * 20
	focusHours := focusTime / 3600
	score := completedTasks*10 + focusHours*50 + streakDays*20

	return score
}

// getWeeklyCheckIn 获取本周打卡进展
func (ctrl *StatisticsController) getWeeklyCheckIn(userID string) []gin.H {
	now := time.Now()

	// 获取本周一
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // 周日为7
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	mondayStart := time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, monday.Location())

	result := make([]gin.H, 7)

	// 遍历本周7天
	for i := 0; i < 7; i++ {
		currentDate := mondayStart.AddDate(0, 0, i)
		dayOfWeek := int(currentDate.Weekday())
		if dayOfWeek == 0 {
			dayOfWeek = 7
		}

		// 检查当天是否有活动
		var count int64
		ctrl.db.Model(&models.Statistics{}).
			Where("user_id = ? AND date = ? AND (completed_tasks > 0 OR pomodoro_count > 0)", userID, currentDate).
			Count(&count)

		result[i] = gin.H{
			"dayOfWeek":   dayOfWeek,
			"date":        currentDate.Format("2006-01-02"),
			"hasActivity": count > 0,
		}
	}

	return result
}

// getBestFocusTime 获取最佳专注时间（按小时统计）
func (ctrl *StatisticsController) getBestFocusTime(userID string) []gin.H {
	type HourStat struct {
		Hour  int
		Count int64
	}

	var hourStats []HourStat

	// 查询所有番茄钟记录，按开始时间的小时分组
	ctrl.db.Table("pomodoros").
		Select("EXTRACT(HOUR FROM start_time) as hour, COUNT(*) as count").
		Where("user_id = ? AND end_time IS NOT NULL", userID).
		Group("hour").
		Order("hour ASC").
		Scan(&hourStats)

	// 初始化24小时的数据（0-23）
	result := make([]gin.H, 24)
	hourMap := make(map[int]int64)

	for _, stat := range hourStats {
		hourMap[stat.Hour] = stat.Count
	}

	for i := 0; i < 24; i++ {
		result[i] = gin.H{
			"hour":  i,
			"count": hourMap[i],
		}
	}

	return result
}

// getFocusDetailsByTask 获取按任务分类的专注时间详情
func (ctrl *StatisticsController) getFocusDetailsByTask(userID string) []gin.H {
	type TaskFocusStat struct {
		TaskID    string
		TaskTitle string
		ListName  string
		ListColor string
		Duration  int
	}

	var taskStats []TaskFocusStat

	// 查询按任务分类的专注时长
	ctrl.db.Table("pomodoros").
		Select("pomodoros.task_id, tasks.title as task_title, lists.name as list_name, lists.color as list_color, SUM(pomodoros.duration) as duration").
		Joins("LEFT JOIN tasks ON pomodoros.task_id = tasks.id").
		Joins("LEFT JOIN lists ON tasks.list_id = lists.id").
		Where("pomodoros.user_id = ? AND pomodoros.end_time IS NOT NULL AND pomodoros.task_id IS NOT NULL", userID).
		Group("pomodoros.task_id, tasks.title, lists.name, lists.color").
		Order("duration DESC").
		Limit(10).
		Scan(&taskStats)

	result := make([]gin.H, 0)
	for _, stat := range taskStats {
		color := stat.ListColor
		if color == "" {
			color = "#3b82f6"
		}
		result = append(result, gin.H{
			"taskId":    stat.TaskID,
			"taskTitle": stat.TaskTitle,
			"listName":  stat.ListName,
			"color":     color,
			"duration":  stat.Duration,
		})
	}

	return result
}
