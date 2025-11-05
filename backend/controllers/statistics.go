package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/services"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type StatisticsController struct {
	db      *gorm.DB
	service *services.StatisticsService
}

func NewStatisticsController(db *gorm.DB) *StatisticsController {
	return &StatisticsController{
		db:      db,
		service: services.NewStatisticsService(db),
	}
}

// GetOverview 获取统计概览
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
	startOfDay := utils.Today()
	endOfDay := utils.Tomorrow(utils.Now())

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
	streakDays := ctrl.service.CalculateStreakDays(userID)

	// 计算成就值（从 statistics 表聚合，保持与趋势图一致）
	achievementScore := ctrl.calculateTotalAchievementScore(userID)

	// 计算本周打卡进展
	weeklyCheckIn := ctrl.service.GetWeeklyCheckIn(userID)

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

// GetDaily 获取每日统计数据
func (ctrl *StatisticsController) GetDaily(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 获取最近30天的统计
	var stats []models.Statistics
	startDate := utils.DaysAgo(30)

	if err := ctrl.db.Where("user_id = ? AND date >= ?", userID, startDate).
		Order("date ASC").Find(&stats).Error; err != nil {
		utils.InternalError(c, "Failed to get daily statistics")
		return
	}

	utils.Success(c, stats)
}

// GetTrends 获取趋势数据
func (ctrl *StatisticsController) GetTrends(c *gin.Context) {
	userID := middleware.GetUserID(c)

	timeRange := c.DefaultQuery("range", "day")
	now := utils.Now()

	// 统一返回7个数据点
	var stats []models.Statistics

	switch timeRange {
	case "week":
		// 按周：7周数据（49天），每7天一个数据点
		stats = ctrl.service.GetWeeklyData(userID, now)
	case "month":
		// 按月：7个月数据，每30天一个数据点
		stats = ctrl.service.GetMonthlyData(userID, now)
	default:
		// 按日：7天数据，每天一个数据点
		stats = ctrl.service.GetDailyData(userID, now, 7)
	}

	utils.Success(c, stats)
}

// GetFocus 获取专注统计数据
func (ctrl *StatisticsController) GetFocus(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 今日番茄和专注时长
	startOfDay := utils.Today()
	endOfDay := utils.Tomorrow(utils.Now())

	var todayPomodoros int64
	var todayFocusTime int
	var totalPomodoros int64
	var totalFocusTime int

	// 批量查询统计数据
	var result struct {
		TodayPomodoros int64 `gorm:"column:today_pomodoros"`
		TodayFocusTime int   `gorm:"column:today_focus_time"`
		TotalPomodoros int64 `gorm:"column:total_pomodoros"`
		TotalFocusTime int   `gorm:"column:total_focus_time"`
	}

	ctrl.db.Raw(`
		SELECT 
			COUNT(CASE WHEN start_time >= ? AND start_time < ? THEN 1 END) as today_pomodoros,
			COALESCE(SUM(CASE WHEN start_time >= ? AND start_time < ? AND end_time IS NOT NULL THEN duration END), 0) as today_focus_time,
			COUNT(*) as total_pomodoros,
			COALESCE(SUM(CASE WHEN end_time IS NOT NULL THEN duration END), 0) as total_focus_time
		FROM pomodoros
		WHERE user_id = ?
	`, startOfDay, endOfDay, startOfDay, endOfDay, userID).Scan(&result)

	todayPomodoros = result.TodayPomodoros
	todayFocusTime = result.TodayFocusTime
	totalPomodoros = result.TotalPomodoros
	totalFocusTime = result.TotalFocusTime

	// 最近的专注记录（限制20条以提高性能）
	var recentPomodoros []models.Pomodoro
	ctrl.db.Where("user_id = ? AND end_time IS NOT NULL", userID).
		Preload("Task").
		Order("start_time DESC").
		Limit(20).
		Find(&recentPomodoros)

	// 最佳专注时间分析
	bestFocusTime := ctrl.service.GetBestFocusTime(userID)

	// 专注时间详情（按任务分组，只返回Top 10）
	focusDetails := ctrl.service.GetFocusDetailsByTask(userID)

	utils.Success(c, gin.H{
		"todayPomodoros": todayPomodoros,
		"totalPomodoros": totalPomodoros,
		"todayFocusTime": todayFocusTime,
		"totalFocusTime": totalFocusTime,
		"focusRecords":   recentPomodoros,
		"bestFocusTime":  bestFocusTime,
		"focusDetails":   focusDetails,
	})
}

// GetFocusTrends 获取专注趋势数据（独立接口）
func (ctrl *StatisticsController) GetFocusTrends(c *gin.Context) {
	userID := middleware.GetUserID(c)
	timeRange := c.DefaultQuery("range", "day")

	now := time.Now()
	var stats []models.Statistics

	switch timeRange {
	case "week":
		// 按周：7周数据
		stats = ctrl.service.GetWeeklyData(userID, now)
	case "month":
		// 按月：7个月数据
		stats = ctrl.service.GetMonthlyData(userID, now)
	default:
		// 按日：7天数据
		stats = ctrl.service.GetDailyData(userID, now, 7)
	}

	utils.Success(c, stats)
}

// GetAchievementTrends 获取成就值趋势数据（累计值）
func (ctrl *StatisticsController) GetAchievementTrends(c *gin.Context) {
	userID := middleware.GetUserID(c)
	timeRange := c.DefaultQuery("range", "day")

	now := utils.Now()
	var result []gin.H

	switch timeRange {
	case "week":
		// 按周：7周数据
		result = ctrl.service.GetAchievementWeeklyData(userID, now)
	case "month":
		// 按月：7个月数据
		result = ctrl.service.GetAchievementMonthlyData(userID, now)
	default:
		// 按日：7天数据
		result = ctrl.service.GetAchievementDailyData(userID, now)
	}

	utils.Success(c, result)
}

// calculateTotalAchievementScore 计算总成就值（从 statistics 表聚合）
func (ctrl *StatisticsController) calculateTotalAchievementScore(userID uint64) int {
	var stats []models.Statistics
	ctrl.db.Where("user_id = ?", userID).Find(&stats)

	totalScore := 0
	for _, stat := range stats {
		totalScore += ctrl.service.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
	}

	return totalScore
}

// GetHeatmap 获取热力图数据
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

// GetTasksOverview 获取任务统计概览（从 statistics 表聚合）
func (ctrl *StatisticsController) GetTasksOverview(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 获取日期范围参数
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	// 如果没有指定日期范围，默认获取最近30天
	if startDate == "" || endDate == "" {
		now := utils.Now()
		endDate = now.Format("2006-01-02")
		startDate = utils.DaysAgo(30).Format("2006-01-02")
	}

	// 从 statistics 表查询指定日期范围的数据
	var stats []models.Statistics
	ctrl.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Find(&stats)

	// 聚合统计数据
	var totalCompleted int
	var onTimeCompleted int
	var overdueCompleted int
	var noDateCompleted int
	var totalPomodoros int
	var totalFocusTime int

	for _, stat := range stats {
		totalCompleted += stat.CompletedTasks
		onTimeCompleted += stat.OnTimeCompletedTasks
		overdueCompleted += stat.OverdueCompletedTasks
		noDateCompleted += stat.NoDateCompletedTasks
		totalPomodoros += stat.PomodoroCount
		totalFocusTime += stat.FocusTime
	}

	// 计算完成率
	// 完成率 = 已完成任务数 / 总任务数 * 100%
	// 注意：statistics 表只记录已完成的任务，所以这里的完成率是 100%
	// 如果需要计算真实的完成率，需要额外记录未完成任务数
	completionRate := 0.0
	if totalCompleted > 0 {
		completionRate = 100.0
	}

	utils.Success(c, gin.H{
		"completedCount":   totalCompleted,
		"totalCount":       totalCompleted,
		"completionRate":   completionRate,
		"onTimeCount":      onTimeCompleted,
		"overdueCompleted": overdueCompleted,
		"noDateCompleted":  noDateCompleted,
		"incompleteCount":  0, // statistics 表不记录未完成的任务
		"pomodoroCount":    totalPomodoros,
		"focusTime":        totalFocusTime,
	})
}

// GetTasksByCategory 获取任务分类统计
func (ctrl *StatisticsController) GetTasksByCategory(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// 获取日期范围参数
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	// 如果没有指定日期范围，默认获取最近30天
	if startDate == "" || endDate == "" {
		now := utils.Now()
		endDate = now.Format("2006-01-02")
		startDate = utils.DaysAgo(30).Format("2006-01-02")
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
