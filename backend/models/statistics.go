package models

import (
	"time"

	"gorm.io/gorm"
)

type Statistics struct {
	ID                    uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID                uint64         `json:"userId" gorm:"not null;uniqueIndex:idx_user_date"`
	Date                  string         `json:"date" gorm:"type:varchar(20);not null;uniqueIndex:idx_user_date;index:idx_date_range"` // 格式：20251105
	CompletedTasks        int            `json:"completedTasks" gorm:"default:0"`                                                       // 总完成任务数
	OnTimeCompletedTasks  int            `json:"onTimeCompletedTasks" gorm:"default:0"`                                                 // 按时完成任务数
	OverdueCompletedTasks int            `json:"overdueCompletedTasks" gorm:"default:0"`                                                // 逾期完成任务数
	NoDateCompletedTasks  int            `json:"noDateCompletedTasks" gorm:"default:0"`                                                 // 无日期任务完成数
	PomodoroCount         int            `json:"pomodoroCount" gorm:"default:0"`
	FocusTime             int            `json:"focusTime" gorm:"default:0"` // 秒数
	CreatedAt             time.Time      `json:"createdAt"`
	UpdatedAt             time.Time      `json:"updatedAt"`
	DeletedAt             gorm.DeletedAt `json:"-" gorm:"index"`
}
