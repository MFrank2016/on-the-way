package models

import (
	"time"

	"gorm.io/gorm"
)

type Reminder struct {
	ID           uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uint64         `json:"userId" gorm:"not null;index:idx_user_reminders"`
	EntityType   string         `json:"entityType" gorm:"type:varchar(20);not null;index:idx_entity"` // task, habit
	EntityID     uint64         `json:"entityId" gorm:"not null;index:idx_entity"`
	ReminderTime time.Time      `json:"reminderTime" gorm:"not null;index:idx_reminder_time;index:idx_status_time"`
	ReminderType string         `json:"reminderType" gorm:"type:varchar(20);not null"` // popup, email, wechat
	Status       string         `json:"status" gorm:"type:varchar(20);default:'pending';index:idx_status_time"` // pending, sent, failed
	RetryCount   int            `json:"retryCount" gorm:"default:0"`
	Metadata     string         `json:"metadata" gorm:"type:text"` // JSON格式: {"title":"", "description":"", "icon":""}
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	User User `json:"-" gorm:"foreignKey:UserID"`
}

