package models

import (
	"time"

	"gorm.io/gorm"
)

type Task struct {
	ID           uint64 `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uint64 `json:"userId" gorm:"not null;index:idx_user_status;index:idx_user_list;index:idx_user_due_date"`
	ListID       uint64 `json:"listId" gorm:"not null;index:idx_user_list"` // 必填，默认为收集箱
	Title        string `json:"title" gorm:"type:varchar(500);not null"`
	Description  string `json:"description" gorm:"type:text"`
	Priority     int    `json:"priority" gorm:"default:0;index:idx_user_priority"`                   // 0-3 (四象限)
	Status       string `json:"status" gorm:"type:varchar(20);default:'todo';index:idx_user_status"` // todo, completed, abandoned
	SortOrder    int    `json:"sortOrder" gorm:"default:0;index:idx_sort_order"`                     // 排序顺序
	DueDate      string `json:"dueDate" gorm:"type:varchar(8);index:idx_user_due_date"`              // 截止日期，格式：20251105
	DueTime      string `json:"dueTime" gorm:"type:varchar(5)"`                                      // 截止时间，格式：18:20
	ReminderTime string `json:"reminderTime" gorm:"type:varchar(14)"`                                // 提醒时间，格式：20251105 18:20
	CompletedAt  string `json:"completedAt" gorm:"type:varchar(14);index:idx_completed_at"`          // 完成时间，格式：20251105 18:20

	// 重复任务相关字段
	IsRecurring         bool    `json:"isRecurring" gorm:"default:false;index:idx_recurring"`
	RecurrenceType      string  `json:"recurrenceType" gorm:"type:varchar(20)"` // daily, weekly, monthly, yearly, workday, holiday, lunar_monthly, lunar_yearly, custom
	RecurrenceInterval  int     `json:"recurrenceInterval" gorm:"default:1"`
	RecurrenceWeekdays  string  `json:"recurrenceWeekdays" gorm:"type:varchar(50)"`  // JSON数组，如 "[1,2,3,4,5]" 代表周一到周五
	RecurrenceMonthDay  int     `json:"recurrenceMonthDay"`                          // 每月第几天，1-31
	RecurrenceLunarDate string  `json:"recurrenceLunarDate" gorm:"type:varchar(20)"` // 农历日期，格式: "MM-DD"
	RecurrenceEndDate   string  `json:"recurrenceEndDate" gorm:"type:varchar(8)"`    // 重复结束日期，格式：20251231
	ParentTaskID        *uint64 `json:"parentTaskId" gorm:"index:idx_parent_task"`   // 原始重复任务ID

	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-"`

	// 关联
	List       *List `json:"list,omitempty" gorm:"foreignKey:ListID"`
	Tags       []Tag `json:"tags,omitempty" gorm:"many2many:task_tags;"`
	ParentTask *Task `json:"parentTask,omitempty" gorm:"foreignKey:ParentTaskID"`
}
