package models

import (
	"time"

	"gorm.io/gorm"
)

type Countdown struct {
	ID         string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID     string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	Title      string         `json:"title" gorm:"type:varchar(100);not null"`
	TargetDate time.Time      `json:"targetDate" gorm:"not null"`
	ImageURL   string         `json:"imageUrl" gorm:"type:varchar(500)"`
	Type       string         `json:"type" gorm:"type:varchar(20);default:'countdown'"` // countdown, anniversary
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
	
	User       User           `json:"-" gorm:"foreignKey:UserID"`
}

