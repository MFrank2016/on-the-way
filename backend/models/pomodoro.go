package models

import (
	"time"

	"gorm.io/gorm"
)

type Pomodoro struct {
	ID        uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint64         `json:"userId" gorm:"not null;index:idx_user_pomodoros;index:idx_user_start_time"`
	TaskID    *uint64        `json:"taskId" gorm:"index:idx_task_pomodoros"`
	StartTime time.Time      `json:"startTime" gorm:"not null;index:idx_user_start_time"`
	EndTime   *time.Time     `json:"endTime"`
	Duration  int            `json:"duration" gorm:"default:0"` // 秒数
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-"`
}
