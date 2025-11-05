package services

import (
	"encoding/json"
	"on-the-way/backend/models"
	"time"

	"gorm.io/gorm"
)

type ReminderService struct {
	db *gorm.DB
}

func NewReminderService(db *gorm.DB) *ReminderService {
	return &ReminderService{db: db}
}

// CheckAndTriggerReminders 检查并触发到期提醒
func (s *ReminderService) CheckAndTriggerReminders(userID string) ([]models.Reminder, error) {
	var reminders []models.Reminder
	now := time.Now()
	
	// 查找待发送的提醒（提醒时间在当前时间前5分钟到未来5分钟之间）
	err := s.db.Where(
		"user_id = ? AND status = ? AND reminder_time >= ? AND reminder_time <= ?",
		userID, "pending", now.Add(-5*time.Minute), now.Add(5*time.Minute),
	).Find(&reminders).Error
	
	if err != nil {
		return nil, err
	}
	
	return reminders, nil
}

// CreateReminderForHabit 为习惯创建提醒
func (s *ReminderService) CreateReminderForHabit(habit *models.Habit) error {
	// 解析提醒时间
	var reminderTimes []string
	if habit.ReminderTimes != "" {
		if err := json.Unmarshal([]byte(habit.ReminderTimes), &reminderTimes); err != nil {
			return err
		}
	}
	
	// 删除旧的提醒
	s.db.Where("entity_type = ? AND entity_id = ?", "habit", habit.ID).Delete(&models.Reminder{})
	
	// 创建新的提醒
	for _, timeStr := range reminderTimes {
		// 解析时间（格式：HH:MM）
		t, err := time.Parse("15:04", timeStr)
		if err != nil {
			continue
		}
		
		// 计算下一个提醒时间
		now := time.Now()
		reminderTime := time.Date(now.Year(), now.Month(), now.Day(), t.Hour(), t.Minute(), 0, 0, now.Location())
		
		// 如果今天的时间已过，设置为明天
		if reminderTime.Before(now) {
			reminderTime = reminderTime.Add(24 * time.Hour)
		}
		
		// 创建元数据
		metadata := map[string]string{
			"title":       habit.Name,
			"icon":        habit.Icon,
			"description": "习惯打卡提醒",
		}
		metadataJSON, _ := json.Marshal(metadata)
		
		reminder := models.Reminder{
			ID:           generateID(),
			UserID:       habit.UserID,
			EntityType:   "habit",
			EntityID:     habit.ID,
			ReminderTime: reminderTime,
			ReminderType: "popup",
			Status:       "pending",
			Metadata:     string(metadataJSON),
		}
		
		if err := s.db.Create(&reminder).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// CreateReminderForTask 为任务创建提醒
func (s *ReminderService) CreateReminderForTask(task *models.Task) error {
	if task.ReminderTime == nil {
		return nil
	}
	
	// 删除旧的提醒
	s.db.Where("entity_type = ? AND entity_id = ?", "task", task.ID).Delete(&models.Reminder{})
	
	// 创建元数据
	metadata := map[string]string{
		"title":       task.Title,
		"description": task.Description,
	}
	metadataJSON, _ := json.Marshal(metadata)
	
	reminder := models.Reminder{
		ID:           generateID(),
		UserID:       task.UserID,
		EntityType:   "task",
		EntityID:     task.ID,
		ReminderTime: *task.ReminderTime,
		ReminderType: "popup",
		Status:       "pending",
		Metadata:     string(metadataJSON),
	}
	
	return s.db.Create(&reminder).Error
}

// MarkReminderSent 标记提醒已发送
func (s *ReminderService) MarkReminderSent(reminderID string) error {
	return s.db.Model(&models.Reminder{}).Where("id = ?", reminderID).Update("status", "sent").Error
}

// DeleteReminder 删除提醒
func (s *ReminderService) DeleteReminder(reminderID string, userID string) error {
	return s.db.Where("id = ? AND user_id = ?", reminderID, userID).Delete(&models.Reminder{}).Error
}

// SnoozeReminder 延迟提醒
func (s *ReminderService) SnoozeReminder(reminderID string, minutes int) error {
	var reminder models.Reminder
	if err := s.db.First(&reminder, "id = ?", reminderID).Error; err != nil {
		return err
	}
	
	newTime := reminder.ReminderTime.Add(time.Duration(minutes) * time.Minute)
	return s.db.Model(&reminder).Update("reminder_time", newTime).Error
}

func generateID() string {
	return time.Now().Format("20060102150405") + randString(8)
}

func randString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}

