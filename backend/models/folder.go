package models

import (
	"time"

	"gorm.io/gorm"
)

type Folder struct {
	ID         uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID     uint64         `json:"userId" gorm:"not null;index:idx_user_folders"`
	Name       string         `json:"name" gorm:"type:varchar(100);not null"`
	Color      string         `json:"color" gorm:"type:varchar(20)"`
	Icon       string         `json:"icon" gorm:"type:varchar(50)"`
	SortOrder  int            `json:"sortOrder" gorm:"default:0;index:idx_folder_sort"`
	IsExpanded bool           `json:"isExpanded" gorm:"default:true"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-"`
}
