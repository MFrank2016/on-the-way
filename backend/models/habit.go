package models

import (
	"time"

	"gorm.io/gorm"
)

type Habit struct {
	ID                uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID            uint64         `json:"userId" gorm:"not null;index:idx_user_habits"`
	Name              string         `json:"name" gorm:"type:varchar(100);not null"`
	Icon              string         `json:"icon" gorm:"type:varchar(50)"`
	Frequency         string         `json:"frequency" gorm:"type:varchar(20);default:'daily'"`         // daily, weekly, custom
	FrequencyDays     string         `json:"frequencyDays" gorm:"type:varchar(50)"`                     // JSON数组: "[1,2,3,4,5]"
	FrequencyInterval int            `json:"frequencyInterval" gorm:"default:1"`                        // 间隔天数
	GoalType          string         `json:"goalType" gorm:"type:varchar(30);default:'daily_complete'"` // daily_complete, times_per_day
	GoalCount         int            `json:"goalCount" gorm:"default:1"`                                // 目标次数
	StartDate         string         `json:"startDate" gorm:"type:varchar(8)"`                          // 开始日期，格式：20251105
	EndDays           int            `json:"endDays" gorm:"default:0"`                                  // 持续天数，0表示永远
	Group             string         `json:"group" gorm:"type:varchar(50);index:idx_user_group"`        // morning, afternoon, evening, other, custom
	ReminderTimes     string         `json:"reminderTimes" gorm:"type:varchar(200)"`                    // JSON数组: "[\"19:30\",\"20:00\"]"
	AutoJournal       bool           `json:"autoJournal" gorm:"default:false"`                          // 自动弹出打卡日志
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
}

type HabitRecord struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	HabitID   uint64    `json:"habitId" gorm:"not null;index:idx_habit_records;index:idx_habit_date"`
	CheckDate time.Time `json:"checkDate" gorm:"type:date;not null;index:idx_habit_date"`
	CreatedAt time.Time `json:"createdAt"`
}
