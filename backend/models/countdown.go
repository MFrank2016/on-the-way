package models

import (
	"time"

	"gorm.io/gorm"
)

type Countdown struct {
	ID         uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID     uint64         `json:"userId" gorm:"not null;index:idx_user_countdowns"`
	Title      string         `json:"title" gorm:"type:varchar(100);not null"`
	TargetDate time.Time      `json:"targetDate" gorm:"not null;index:idx_user_target_date"`
	ImageURL   string         `json:"imageUrl" gorm:"type:varchar(500)"`
	Type       string         `json:"type" gorm:"type:varchar(20);default:'countdown';index:idx_countdown_type"` // countdown, anniversary
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
}
