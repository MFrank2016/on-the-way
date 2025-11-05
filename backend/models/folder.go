package models

import (
	"time"

	"gorm.io/gorm"
)

type Folder struct {
	ID         string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID     string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	ParentID   *string        `json:"parentId" gorm:"type:varchar(36);index"`
	Name       string         `json:"name" gorm:"type:varchar(100);not null"`
	Color      string         `json:"color" gorm:"type:varchar(20)"`
	Icon       string         `json:"icon" gorm:"type:varchar(50)"`
	SortOrder  int            `json:"sortOrder" gorm:"default:0"`
	IsExpanded bool           `json:"isExpanded" gorm:"default:true"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`
	
	User       User           `json:"-" gorm:"foreignKey:UserID"`
	Parent     *Folder        `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children   []Folder       `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Lists      []List         `json:"lists,omitempty" gorm:"foreignKey:FolderID"`
}

