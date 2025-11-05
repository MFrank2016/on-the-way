package models

import (
	"time"

	"gorm.io/gorm"
)

type Tag struct {
	ID        string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	UserID    string         `json:"userId" gorm:"type:varchar(36);index;not null"`
	Name      string         `json:"name" gorm:"type:varchar(50);not null"`
	Color     string         `json:"color" gorm:"type:varchar(20)"`
	CreatedAt time.Time      `json:"createdAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
	
	User      User           `json:"-" gorm:"foreignKey:UserID"`
}

type TaskTag struct {
	TaskID string `gorm:"primaryKey;type:varchar(36)"`
	TagID  string `gorm:"primaryKey;type:varchar(36)"`
}

