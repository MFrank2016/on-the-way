package services

import (
	"encoding/json"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"time"
)

// RecurrenceService 重复任务服务
type RecurrenceService struct{}

// NewRecurrenceService 创建重复任务服务实例
func NewRecurrenceService() *RecurrenceService {
	return &RecurrenceService{}
}

// CalculateNextDueDate 根据重复规则计算下次截止日期
func (s *RecurrenceService) CalculateNextDueDate(task *models.Task, fromDate time.Time) (*time.Time, error) {
	if !task.IsRecurring || task.RecurrenceType == "" {
		return nil, nil
	}

	var nextDate time.Time

	switch task.RecurrenceType {
	case "daily":
		// 每天重复
		nextDate = fromDate.AddDate(0, 0, task.RecurrenceInterval)

	case "weekly":
		// 每周重复
		if task.RecurrenceWeekdays != "" {
			// 解析指定的星期几
			var weekdays []int
			if err := json.Unmarshal([]byte(task.RecurrenceWeekdays), &weekdays); err == nil && len(weekdays) > 0 {
				nextDate = s.findNextWeekday(fromDate, weekdays)
			} else {
				// 如果没有指定星期几，默认按周重复
				nextDate = fromDate.AddDate(0, 0, 7*task.RecurrenceInterval)
			}
		} else {
			nextDate = fromDate.AddDate(0, 0, 7*task.RecurrenceInterval)
		}

	case "monthly":
		// 每月重复
		if task.RecurrenceMonthDay > 0 {
			// 指定每月第几天
			nextDate = s.findNextMonthDay(fromDate, task.RecurrenceMonthDay, task.RecurrenceInterval)
		} else {
			// 默认按月重复（相同日期）
			nextDate = fromDate.AddDate(0, task.RecurrenceInterval, 0)
		}

	case "yearly":
		// 每年重复
		nextDate = fromDate.AddDate(task.RecurrenceInterval, 0, 0)

	case "workday":
		// 工作日重复（周一到周五）
		nextDate = s.findNextWorkday(fromDate)

	case "holiday":
		// 节假日重复（需要节假日API，暂时返回周末）
		nextDate = s.findNextHoliday(fromDate)

	case "lunar_monthly":
		// 农历每月重复（需要农历库，暂时按阳历处理）
		nextDate = fromDate.AddDate(0, task.RecurrenceInterval, 0)

	case "lunar_yearly":
		// 农历每年重复（需要农历库，暂时按阳历处理）
		nextDate = fromDate.AddDate(task.RecurrenceInterval, 0, 0)

	case "custom":
		// 自定义间隔（按天计算）
		nextDate = fromDate.AddDate(0, 0, task.RecurrenceInterval)

	default:
		return nil, nil
	}

	// 检查是否超过结束日期
	if task.RecurrenceEndDate != nil && nextDate.After(*task.RecurrenceEndDate) {
		return nil, nil
	}

	return &nextDate, nil
}

// findNextWeekday 查找下一个符合条件的星期几
func (s *RecurrenceService) findNextWeekday(fromDate time.Time, weekdays []int) time.Time {
	// weekdays: 0=周日, 1=周一, ..., 6=周六
	
	// 先尝试当天之后的本周日期
	for i := 1; i <= 7; i++ {
		nextDate := fromDate.AddDate(0, 0, i)
		nextWeekday := int(nextDate.Weekday())
		for _, wd := range weekdays {
			if nextWeekday == wd {
				return nextDate
			}
		}
	}

	// 如果没有找到，返回下周的第一个匹配日
	for i := 1; i <= 14; i++ {
		nextDate := fromDate.AddDate(0, 0, i)
		nextWeekday := int(nextDate.Weekday())
		for _, wd := range weekdays {
			if nextWeekday == wd {
				return nextDate
			}
		}
	}

	// 兜底：返回明天
	return fromDate.AddDate(0, 0, 1)
}

// findNextMonthDay 查找下一个每月指定日期
func (s *RecurrenceService) findNextMonthDay(fromDate time.Time, dayOfMonth int, interval int) time.Time {
	year := fromDate.Year()
	month := fromDate.Month()
	
	// 尝试下一个月
	month += time.Month(interval)
	for month > 12 {
		month -= 12
		year++
	}
	
	// 获取该月的最后一天
	lastDay := time.Date(year, month+1, 0, fromDate.Hour(), fromDate.Minute(), fromDate.Second(), 0, fromDate.Location()).Day()
	
	// 如果指定的日期超过该月最后一天，使用最后一天
	actualDay := dayOfMonth
	if actualDay > lastDay {
		actualDay = lastDay
	}
	
	nextDate := time.Date(year, month, actualDay, fromDate.Hour(), fromDate.Minute(), fromDate.Second(), 0, fromDate.Location())
	
	// 如果计算出的日期还在过去，再加一个间隔
	if nextDate.Before(fromDate) {
		return s.findNextMonthDay(nextDate, dayOfMonth, interval)
	}
	
	return nextDate
}

// findNextWorkday 查找下一个工作日（周一到周五）
func (s *RecurrenceService) findNextWorkday(fromDate time.Time) time.Time {
	nextDate := fromDate.AddDate(0, 0, 1)
	
	// 跳过周末
	for {
		weekday := nextDate.Weekday()
		if weekday != time.Saturday && weekday != time.Sunday {
			return nextDate
		}
		nextDate = nextDate.AddDate(0, 0, 1)
	}
}

// findNextHoliday 查找下一个节假日（暂时返回周末）
func (s *RecurrenceService) findNextHoliday(fromDate time.Time) time.Time {
	nextDate := fromDate.AddDate(0, 0, 1)
	
	// 查找下一个周六或周日
	for {
		weekday := nextDate.Weekday()
		if weekday == time.Saturday || weekday == time.Sunday {
			return nextDate
		}
		nextDate = nextDate.AddDate(0, 0, 1)
	}
}

// GenerateNextRecurringTask 生成下一个重复任务实例
func (s *RecurrenceService) GenerateNextRecurringTask(completedTask *models.Task) (*models.Task, error) {
	if !completedTask.IsRecurring {
		return nil, nil
	}

	// 计算下次截止日期
	baseDate := utils.Now()
	if completedTask.DueDate != nil {
		baseDate = *completedTask.DueDate
	}

	nextDueDate, err := s.CalculateNextDueDate(completedTask, baseDate)
	if err != nil || nextDueDate == nil {
		return nil, err
	}

	// 创建新任务实例
	newTask := &models.Task{
		UserID:              completedTask.UserID,
		ListID:              completedTask.ListID,
		Title:               completedTask.Title,
		Description:         completedTask.Description,
		Priority:            completedTask.Priority,
		Status:              "todo",
		DueDate:             nextDueDate,
		IsRecurring:         true,
		RecurrenceType:      completedTask.RecurrenceType,
		RecurrenceInterval:  completedTask.RecurrenceInterval,
		RecurrenceWeekdays:  completedTask.RecurrenceWeekdays,
		RecurrenceMonthDay:  completedTask.RecurrenceMonthDay,
		RecurrenceLunarDate: completedTask.RecurrenceLunarDate,
		RecurrenceEndDate:   completedTask.RecurrenceEndDate,
		ParentTaskID:        &completedTask.ID,
	}

	// 计算提醒时间（如果原任务有提醒）
	if completedTask.ReminderTime != nil && completedTask.DueDate != nil {
		// 计算原任务的提醒时间与截止时间的差值
		reminderOffset := completedTask.DueDate.Sub(*completedTask.ReminderTime)
		newReminderTime := nextDueDate.Add(-reminderOffset)
		newTask.ReminderTime = &newReminderTime
	}

	return newTask, nil
}

