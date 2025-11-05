package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	Username     string         `json:"username" gorm:"type:varchar(100);uniqueIndex;not null"`
	Email        string         `json:"email" gorm:"type:varchar(100);uniqueIndex;not null"`
	PasswordHash string         `json:"-" gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

