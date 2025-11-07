package models

import (
	"time"

	"gorm.io/gorm"
)

// ViewConfig 视图配置模型 - 用于存储每个清单/过滤器/预设视图的分组和排序配置
type ViewConfig struct {
	ID         uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID     uint64         `json:"userId" gorm:"not null;index:idx_user_view_config"`
	EntityType string         `json:"entityType" gorm:"type:varchar(20);not null;index:idx_entity_config"` // "filter", "list", "preset"
	EntityID   uint64         `json:"entityId" gorm:"not null;index:idx_entity_config"`
	GroupBy    string         `json:"groupBy" gorm:"type:varchar(20);default:'none'"` // "none", "time", "list", "tag", "priority"
	SortBy     string         `json:"sortBy" gorm:"type:varchar(20);default:'time'"`  // "time", "title", "tag", "priority"
	SortOrder  string         `json:"sortOrder" gorm:"type:varchar(10);default:'asc'"` // "asc" 或 "desc"
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-"`
}

// TableName 指定表名
func (ViewConfig) TableName() string {
	return "view_configs"
}

