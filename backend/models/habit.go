package models

import (
	"time"

	"gorm.io/gorm"
)

type Habit struct {
	ID                string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID            string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	Name              string         `json:"name" gorm:"type:varchar(100);not null"`
	Icon              string         `json:"icon" gorm:"type:varchar(50)"`
	Frequency         string         `json:"frequency" gorm:"type:varchar(20);default:'daily'"` // daily, weekly, custom
	FrequencyDays     string         `json:"frequencyDays" gorm:"type:varchar(50)"` // JSON数组: "[1,2,3,4,5]"
	FrequencyInterval int            `json:"frequencyInterval" gorm:"default:1"` // 间隔天数
	GoalType          string         `json:"goalType" gorm:"type:varchar(30);default:'daily_complete'"` // daily_complete, times_per_day
	GoalCount         int            `json:"goalCount" gorm:"default:1"` // 目标次数
	StartDate         *time.Time     `json:"startDate"` // 开始日期
	EndDays           int            `json:"endDays" gorm:"default:0"` // 持续天数，0表示永远
	Group             string         `json:"group" gorm:"type:varchar(50)"` // morning, afternoon, evening, other, custom
	ReminderTimes     string         `json:"reminderTimes" gorm:"type:varchar(200)"` // JSON数组: "[\"19:30\",\"20:00\"]"
	AutoJournal       bool           `json:"autoJournal" gorm:"default:false"` // 自动弹出打卡日志
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `json:"-" gorm:"index"`
	
	User    User          `json:"-" gorm:"foreignKey:UserID"`
	Records []HabitRecord `json:"records" gorm:"foreignKey:HabitID"`
}

type HabitRecord struct {
	ID        string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	HabitID   string         `json:"habitId" gorm:"type:varchar(36);index;not null"`
	CheckDate time.Time      `json:"checkDate" gorm:"type:date;not null"`
	CreatedAt time.Time      `json:"createdAt"`
	
	Habit     Habit          `json:"-" gorm:"foreignKey:HabitID"`
}

