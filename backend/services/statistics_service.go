package services

import (
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

// StatisticsService 统计服务
type StatisticsService struct {
	db *gorm.DB
}

// NewStatisticsService 创建统计服务实例
func NewStatisticsService(db *gorm.DB) *StatisticsService {
	return &StatisticsService{db: db}
}

// CalculateStreakDays 计算连续打卡天数
func (s *StatisticsService) CalculateStreakDays(userID uint64) int {
	streakDays := 0
	currentDate := utils.Today()

	// 从今天开始向前查找
	for {
		var count int64
		s.db.Model(&models.Statistics{}).
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

// CalculateScore 计算成就值
// 参数：已完成任务数、专注时长（秒）、番茄钟数
// 成就值计算公式：完成任务数 * 10 + 专注时长（小时）* 50 + 番茄钟数 * 5
func (s *StatisticsService) CalculateScore(completedTasks int, focusTime int, pomodoroCount int) int {
	focusHours := focusTime / 3600
	score := completedTasks*10 + focusHours*50 + pomodoroCount*5
	return score
}

// GetWeeklyCheckIn 获取本周打卡进展
func (s *StatisticsService) GetWeeklyCheckIn(userID uint64) []gin.H {
	now := utils.Now()

	// 获取本周一
	mondayStart := utils.BeginningOfWeek(now)

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
		s.db.Model(&models.Statistics{}).
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

// GetBestFocusTime 获取最佳专注时间（按小时统计）
func (s *StatisticsService) GetBestFocusTime(userID uint64) []gin.H {
	type HourStat struct {
		Hour  int
		Count int64
	}

	var hourStats []HourStat

	// 查询所有番茄钟记录，按开始时间的小时分组
	s.db.Table("pomodoros").
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

// GetFocusDetailsByTask 获取按任务分类的专注时间详情
func (s *StatisticsService) GetFocusDetailsByTask(userID uint64) []gin.H {
	type TaskFocusStat struct {
		TaskID    uint64
		TaskTitle string
		ListName  string
		ListColor string
		Duration  int
	}

	var taskStats []TaskFocusStat

	// 查询按任务分类的专注时长
	s.db.Table("pomodoros").
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

// GetDailyData 获取按日统计的数据点
func (s *StatisticsService) GetDailyData(userID uint64, endTime time.Time, days int) []models.Statistics {
	endDate := utils.BeginningOfDay(endTime)
	startDate := endDate.AddDate(0, 0, -(days - 1))

	var rawStats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date ASC").
		Find(&rawStats)

	// 创建日期映射
	dateMap := make(map[string]models.Statistics)
	for _, stat := range rawStats {
		dateKey := stat.Date.Format("2006-01-02")
		dateMap[dateKey] = stat
	}

	// 生成完整的天数数据
	result := make([]models.Statistics, days)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i)
		dateKey := date.Format("2006-01-02")

		if stat, exists := dateMap[dateKey]; exists {
			result[i] = stat
		} else {
			result[i] = models.Statistics{
				Date:           date,
				CompletedTasks: 0,
				PomodoroCount:  0,
				FocusTime:      0,
			}
		}
	}

	return result
}

// GetWeeklyData 获取按周统计的数据点（每个数据点代表7天的聚合）
func (s *StatisticsService) GetWeeklyData(userID uint64, endTime time.Time) []models.Statistics {
	endDate := utils.BeginningOfDay(endTime)
	// 7周 = 49天
	startDate := endDate.AddDate(0, 0, -48) // 49天前（包括今天）

	var rawStats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date ASC").
		Find(&rawStats)

	// 生成7个周数据点
	result := make([]models.Statistics, 7)
	for i := 0; i < 7; i++ {
		// 每个数据点的起始日期（往前数7天）
		weekEndDate := endDate.AddDate(0, 0, -i*7)
		weekStartDate := weekEndDate.AddDate(0, 0, -6)

		// 聚合这7天的数据
		var completedTasks, pomodoroCount, focusTime int
		for _, stat := range rawStats {
			if !stat.Date.Before(weekStartDate) && !stat.Date.After(weekEndDate) {
				completedTasks += stat.CompletedTasks
				pomodoroCount += stat.PomodoroCount
				focusTime += stat.FocusTime
			}
		}

		result[6-i] = models.Statistics{
			Date:           weekStartDate, // 使用周开始日期
			CompletedTasks: completedTasks,
			PomodoroCount:  pomodoroCount,
			FocusTime:      focusTime,
		}
	}

	return result
}

// GetMonthlyData 获取按月统计的数据点（每个数据点代表一个自然月）
func (s *StatisticsService) GetMonthlyData(userID uint64, endTime time.Time) []models.Statistics {
	now := utils.Now()
	currentYear := now.Year()
	currentMonth := now.Month()

	// 计算查询的起始月份（往前推6个月，加上当前月共7个月）
	startMonthInt := int(currentMonth) - 6
	startYear := currentYear
	if startMonthInt <= 0 {
		startMonthInt += 12
		startYear--
	}

	// 获取所有需要的数据（从6个月前的1号到现在）
	startDate := time.Date(startYear, time.Month(startMonthInt), 1, 0, 0, 0, 0, now.Location())
	endDate := now

	var rawStats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
		Order("date ASC").
		Find(&rawStats)

	// 生成7个月的数据点
	result := make([]models.Statistics, 7)

	for i := 0; i < 7; i++ {
		// 计算目标月份（从6个月前开始）
		monthOffset := int(currentMonth) - (6 - i)
		targetYear := currentYear
		targetMonth := monthOffset

		if targetMonth <= 0 {
			targetMonth += 12
			targetYear--
		}

		// 月初和月末
		monthStart := time.Date(targetYear, time.Month(targetMonth), 1, 0, 0, 0, 0, now.Location())
		var monthEnd time.Time

		// 如果是当前月，结束日期是今天；否则是该月最后一天
		if targetYear == currentYear && time.Month(targetMonth) == currentMonth {
			monthEnd = now
		} else {
			// 下个月1号的前一天就是本月最后一天
			nextMonth := time.Date(targetYear, time.Month(targetMonth)+1, 1, 0, 0, 0, 0, now.Location())
			monthEnd = nextMonth.Add(-time.Second)
		}

		// 聚合该月的数据
		var completedTasks, pomodoroCount, focusTime int
		for _, stat := range rawStats {
			if !stat.Date.Before(monthStart) && !stat.Date.After(monthEnd) {
				completedTasks += stat.CompletedTasks
				pomodoroCount += stat.PomodoroCount
				focusTime += stat.FocusTime
			}
		}

		result[i] = models.Statistics{
			Date:           monthStart, // 使用月初日期作为标识
			CompletedTasks: completedTasks,
			PomodoroCount:  pomodoroCount,
			FocusTime:      focusTime,
		}
	}

	return result
}

// GetAchievementDailyData 获取按日统计的成就值累计数据（7天）
func (s *StatisticsService) GetAchievementDailyData(userID uint64, endTime time.Time) []gin.H {
	now := utils.Now()
	// 今天凌晨0点
	today := utils.Today()
	// 明天凌晨0点（用于包含今天整天的数据）
	tomorrow := utils.Tomorrow(now)
	startDate := today.AddDate(0, 0, -6) // 最近7天的起始日期

	// 1. 计算7天前的累计成就值
	var baseScore int

	// 统计7天前之前的所有数据
	var priorStats []models.Statistics
	s.db.Where("user_id = ? AND date < ?", userID, startDate).
		Find(&priorStats)

	for _, stat := range priorStats {
		baseScore += s.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
	}

	// 2. 获取最近7天的数据（包含今天）
	var stats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date < ?", userID, startDate, tomorrow).
		Order("date ASC").
		Find(&stats)

	utils.LogInfo("getAchievementDailyData stats", zap.Any("stats", stats))

	// 创建日期映射，聚合同一天的多条记录（如果存在）
	type DayData struct {
		CompletedTasks int
		FocusTime      int
		PomodoroCount  int
	}
	dateMap := make(map[string]*DayData)
	for _, stat := range stats {
		dateKey := stat.Date.Format("2006-01-02")
		if _, exists := dateMap[dateKey]; !exists {
			dateMap[dateKey] = &DayData{}
		}
		dateMap[dateKey].CompletedTasks += stat.CompletedTasks
		dateMap[dateKey].FocusTime += stat.FocusTime
		dateMap[dateKey].PomodoroCount += stat.PomodoroCount
	}

	// 3. 生成7天的累计数据
	result := make([]gin.H, 7)
	cumulative := baseScore

	for i := 0; i < 7; i++ {
		date := startDate.AddDate(0, 0, i)
		dateKey := date.Format("2006-01-02")

		var dailyScore int
		if dayData, exists := dateMap[dateKey]; exists {
			dailyScore = s.CalculateScore(dayData.CompletedTasks, dayData.FocusTime, dayData.PomodoroCount)
		}

		cumulative += dailyScore

		result[i] = gin.H{
			"date":  date.Format("2006-01-02"),
			"score": cumulative,
		}
	}

	return result
}

// GetAchievementWeeklyData 获取按周统计的成就值累计数据（7周）
func (s *StatisticsService) GetAchievementWeeklyData(userID uint64, endTime time.Time) []gin.H {
	now := utils.Now()
	// 今天凌晨0点
	today := utils.Today()
	// 明天凌晨0点
	tomorrow := utils.Tomorrow(now)
	// 7周 = 49天
	startDate := today.AddDate(0, 0, -48) // 49天前（包括今天）

	// 1. 计算49天前的累计成就值
	var baseScore int

	var priorStats []models.Statistics
	s.db.Where("user_id = ? AND date < ?", userID, startDate).
		Find(&priorStats)

	for _, stat := range priorStats {
		baseScore += s.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
	}

	// 2. 获取最近49天的数据（包含今天）
	var stats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date < ?", userID, startDate, tomorrow).
		Order("date ASC").
		Find(&stats)

	// 3. 生成7周的累计数据
	result := make([]gin.H, 7)

	// 先计算所有周的增量
	weeklyScores := make([]int, 7)
	for j := 0; j < 7; j++ {
		wEndDate := today.AddDate(0, 0, -j*7)
		wStartDate := wEndDate.AddDate(0, 0, -6)

		var wScore int
		for _, stat := range stats {
			if !stat.Date.Before(wStartDate) && !stat.Date.After(wEndDate) {
				wScore += s.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
			}
		}
		weeklyScores[6-j] = wScore
	}

	// 生成累计数据
	cumulative := baseScore
	for j := 0; j < 7; j++ {
		cumulative += weeklyScores[j]
		wStartDate := today.AddDate(0, 0, -(6-j)*7-6)

		result[j] = gin.H{
			"date":  wStartDate.Format("2006-01-02"),
			"score": cumulative,
		}
	}

	return result
}

// GetAchievementMonthlyData 获取按月统计的成就值累计数据（7个月）
func (s *StatisticsService) GetAchievementMonthlyData(userID uint64, endTime time.Time) []gin.H {
	now := utils.Now()
	currentYear := now.Year()
	currentMonth := now.Month()

	// 计算起始月份
	startMonthInt := int(currentMonth) - 6
	startYear := currentYear
	if startMonthInt <= 0 {
		startMonthInt += 12
		startYear--
	}
	startDate := time.Date(startYear, time.Month(startMonthInt), 1, 0, 0, 0, 0, now.Location())

	// 1. 计算7个月前的累计成就值
	var baseScore int

	var priorStats []models.Statistics
	s.db.Where("user_id = ? AND date < ?", userID, startDate).
		Find(&priorStats)

	for _, stat := range priorStats {
		baseScore += s.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
	}

	// 2. 获取7个月的数据（包含今天）
	tomorrow := utils.Tomorrow(now)

	var stats []models.Statistics
	s.db.Where("user_id = ? AND date >= ? AND date < ?", userID, startDate, tomorrow).
		Order("date ASC").
		Find(&stats)

	// 3. 生成7个月的累计数据
	result := make([]gin.H, 7)
	cumulative := baseScore

	for i := 0; i < 7; i++ {
		monthOffset := int(currentMonth) - (6 - i)
		targetYear := currentYear
		targetMonth := monthOffset

		if targetMonth <= 0 {
			targetMonth += 12
			targetYear--
		}

		monthStart := time.Date(targetYear, time.Month(targetMonth), 1, 0, 0, 0, 0, now.Location())
		var monthEnd time.Time

		// 如果是当前月，结束日期用明天（包含今天）；否则用下个月1号（不包含下个月）
		if targetYear == currentYear && time.Month(targetMonth) == currentMonth {
			monthEnd = tomorrow
		} else {
			monthEnd = time.Date(targetYear, time.Month(targetMonth)+1, 1, 0, 0, 0, 0, now.Location())
		}

		// 聚合该月的成就值增量
		var monthlyScore int
		for _, stat := range stats {
			if !stat.Date.Before(monthStart) && stat.Date.Before(monthEnd) {
				monthlyScore += s.CalculateScore(stat.CompletedTasks, stat.FocusTime, stat.PomodoroCount)
			}
		}

		cumulative += monthlyScore

		result[i] = gin.H{
			"date":  monthStart.Format("2006-01-02"),
			"score": cumulative,
		}
	}

	return result
}
