package models

import (
	"time"

	"gorm.io/gorm"
)

type Pomodoro struct {
	ID        string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID    string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	TaskID    *string        `json:"taskId" gorm:"type:varchar(36);index"`
	StartTime time.Time      `json:"startTime" gorm:"not null"`
	EndTime   *time.Time     `json:"endTime"`
	Duration  int            `json:"duration" gorm:"default:0"` // 秒数
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	User      User           `json:"-" gorm:"foreignKey:UserID"`
	Task      *Task          `json:"task" gorm:"foreignKey:TaskID"`
}

