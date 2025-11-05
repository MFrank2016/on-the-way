package models

import (
	"time"

	"gorm.io/gorm"
)

type Reminder struct {
	ID           string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID       string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	EntityType   string         `json:"entityType" gorm:"type:varchar(20);not null"` // task, habit
	EntityID     string         `json:"entityId" gorm:"type:varchar(36);index;not null"`
	ReminderTime time.Time      `json:"reminderTime" gorm:"index;not null"`
	ReminderType string         `json:"reminderType" gorm:"type:varchar(20);not null"` // popup, email, wechat
	Status       string         `json:"status" gorm:"type:varchar(20);default:'pending'"` // pending, sent, failed
	RetryCount   int            `json:"retryCount" gorm:"default:0"`
	Metadata     string         `json:"metadata" gorm:"type:text"` // JSON格式: {"title":"", "description":"", "icon":""}
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	User User `json:"-" gorm:"foreignKey:UserID"`
}

