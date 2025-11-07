package models

import (
	"time"

	"gorm.io/gorm"
)

type List struct {
	ID        uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint64         `json:"userId" gorm:"not null;index:idx_user_lists"`
	FolderID  *uint64        `json:"folderId" gorm:"index:idx_folder_lists"`
	Name      string         `json:"name" gorm:"type:varchar(100);not null"`
	Type      string         `json:"type" gorm:"type:varchar(20);not null;index:idx_list_type"` // inbox, today, tomorrow, week, custom
	ViewType  string         `json:"viewType" gorm:"type:varchar(20);default:'list'"`           // list, kanban, timeline
	Color     string         `json:"color" gorm:"type:varchar(20)"`
	Icon      string         `json:"icon" gorm:"type:varchar(50)"`
	SortOrder int            `json:"sortOrder" gorm:"default:0;index:idx_list_sort"`
	IsDefault bool           `json:"isDefault" gorm:"default:false;index:idx_user_default"`
	IsSystem  bool           `json:"isSystem" gorm:"default:false"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-"`
}
