package models

import (
	"time"

	"gorm.io/gorm"
)

type Task struct {
	ID                  string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID              string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	ListID              string         `json:"listId" gorm:"type:varchar(36);index;not null"` // 必填，默认为收集箱
	Title               string         `json:"title" gorm:"type:varchar(500);not null"`
	Description         string         `json:"description" gorm:"type:text"`
	Priority            int            `json:"priority" gorm:"default:0"` // 0-3 (四象限)
	Status              string         `json:"status" gorm:"type:varchar(20);default:'todo'"` // todo, completed
	DueDate             *time.Time     `json:"dueDate"`
	ReminderTime        *time.Time     `json:"reminderTime"`
	CompletedAt         *time.Time     `json:"completedAt"`
	
	// 重复任务相关字段
	IsRecurring         bool           `json:"isRecurring" gorm:"default:false"`
	RecurrenceType      string         `json:"recurrenceType" gorm:"type:varchar(20)"` // daily, weekly, monthly, yearly, workday, holiday, lunar_monthly, lunar_yearly, custom
	RecurrenceInterval  int            `json:"recurrenceInterval" gorm:"default:1"`
	RecurrenceWeekdays  string         `json:"recurrenceWeekdays" gorm:"type:varchar(50)"` // JSON数组，如 "[1,2,3,4,5]" 代表周一到周五
	RecurrenceMonthDay  int            `json:"recurrenceMonthDay"` // 每月第几天，1-31
	RecurrenceLunarDate string         `json:"recurrenceLunarDate" gorm:"type:varchar(20)"` // 农历日期，格式: "MM-DD"
	RecurrenceEndDate   *time.Time     `json:"recurrenceEndDate"` // 重复结束日期
	ParentTaskID        *string        `json:"parentTaskId" gorm:"type:varchar(36);index"` // 原始重复任务ID
	
	CreatedAt           time.Time      `json:"createdAt"`
	UpdatedAt           time.Time      `json:"updatedAt"`
	DeletedAt           gorm.DeletedAt `json:"-" gorm:"index"`
	
	User                User           `json:"-" gorm:"foreignKey:UserID"`
	List                *List          `json:"list" gorm:"foreignKey:ListID"`
	Tags                []Tag          `json:"tags" gorm:"many2many:task_tags;"`
	ParentTask          *Task          `json:"parentTask,omitempty" gorm:"foreignKey:ParentTaskID"`
}

