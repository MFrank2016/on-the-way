package models

import (
	"time"

	"gorm.io/gorm"
)

// Filter 过滤器模型
type Filter struct {
	ID           uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID       uint64         `json:"userId" gorm:"not null;index:idx_user_filters"`
	Name         string         `json:"name" gorm:"type:varchar(100);not null"`
	Icon         string         `json:"icon" gorm:"type:varchar(50)"`
	IsPinned     bool           `json:"isPinned" gorm:"default:false"`
	SortOrder    int            `json:"sortOrder" gorm:"default:0;index:idx_filter_sort"`
	FilterConfig string         `json:"filterConfig" gorm:"type:text"` // JSON格式存储
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-"`
}

// FilterConfig 过滤器配置结构（用于JSON序列化）
type FilterConfig struct {
	ListIDs        []uint64   `json:"listIds,omitempty"`
	TagIDs         []uint64   `json:"tagIds,omitempty"`
	DateType       string     `json:"dateType,omitempty"` // today, tomorrow, week, overdue, noDate, custom, all
	DateRange      *DateRange `json:"dateRange,omitempty"`
	Priorities     []int      `json:"priorities,omitempty"` // 0,1,2,3
	ContentKeyword string     `json:"contentKeyword,omitempty"`
	TaskType       string     `json:"taskType,omitempty"` // all, task, note
}

// DateRange 日期范围
type DateRange struct {
	Start string `json:"start"` // 格式：20251105
	End   string `json:"end"`   // 格式：20251105
}
