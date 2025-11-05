package models

import (
	"time"

	"gorm.io/gorm"
)

type Statistics struct {
	ID             string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID         string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	Date           time.Time      `json:"date" gorm:"type:date;not null;uniqueIndex:idx_user_date"`
	CompletedTasks int            `json:"completedTasks" gorm:"default:0"`
	PomodoroCount  int            `json:"pomodoroCount" gorm:"default:0"`
	FocusTime      int            `json:"focusTime" gorm:"default:0"` // 秒数
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
	
	User           User           `json:"-" gorm:"foreignKey:UserID"`
}

