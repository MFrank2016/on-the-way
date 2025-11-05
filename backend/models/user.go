package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           string         `json:"id" gorm:"primaryKey;type:varchar(36)"`
	Username     string         `json:"username" gorm:"type:varchar(100);uniqueIndex;not null"`
	Email        string         `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

