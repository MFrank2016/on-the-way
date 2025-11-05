package models

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint64         `json:"userId" gorm:"not null;index:idx_user_tags"`
	Name      string         `json:"name" gorm:"type:varchar(50);not null;index:idx_user_tag_name"`
	Color     string         `json:"color" gorm:"type:varchar(20)"`
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	User      User           `json:"-" gorm:"foreignKey:UserID"`
}

type TaskTag struct {
	TaskID uint64 `gorm:"primaryKey;index:idx_task_tags"`
	TagID  uint64 `gorm:"primaryKey;index:idx_tag_tasks"`
}

