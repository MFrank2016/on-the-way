package models

import (
	"time"

	"gorm.io/gorm"
)

type List struct {
	ID        string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID    string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	FolderID  *string        `json:"folderId" gorm:"type:varchar(36);index"`
	Name      string         `json:"name" gorm:"type:varchar(100);not null"`
	Type      string         `json:"type" gorm:"type:varchar(20);not null"` // inbox, today, tomorrow, week, custom
	Color     string         `json:"color" gorm:"type:varchar(20)"`
	Icon      string         `json:"icon" gorm:"type:varchar(50)"`
	SortOrder int            `json:"sortOrder" gorm:"default:0"`
	IsDefault bool           `json:"isDefault" gorm:"default:false"`
	IsSystem  bool           `json:"isSystem" gorm:"default:false"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	User      User           `json:"-" gorm:"foreignKey:UserID"`
	Folder    *Folder        `json:"folder,omitempty" gorm:"foreignKey:FolderID"`
}

