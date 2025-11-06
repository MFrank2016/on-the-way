package models

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint64         `json:"userId" gorm:"not null;index:idx_user_tags"`
	ParentID  *uint64        `json:"parentId" gorm:"index:idx_parent_tags"`
	Name      string         `json:"name" gorm:"type:varchar(50);not null;index:idx_user_tag_name"`
	Color     string         `json:"color" gorm:"type:varchar(20)"`
	IsPinned  bool           `json:"isPinned" gorm:"default:false;index:idx_pinned"`
	SortOrder int            `json:"sortOrder" gorm:"default:0"`
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	// 关联
	Parent   *Tag  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children []Tag `json:"children,omitempty" gorm:"foreignKey:ParentID"`
}

type TaskTag struct {
	TaskID uint64 `gorm:"primaryKey;index:idx_task_tags"`
	TagID  uint64 `gorm:"primaryKey;index:idx_tag_tasks"`
}
