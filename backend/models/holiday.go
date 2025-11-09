package models

import (
	"time"
)

type Holiday struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Year      int       `json:"year" gorm:"not null;index:idx_year"`
	Name      string    `json:"name" gorm:"type:varchar(50);not null"`
	Date      string    `json:"date" gorm:"type:varchar(10);not null;index:idx_date;uniqueIndex:idx_year_date"`
	IsOffDay  bool      `json:"isOffDay" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// TableName 指定表名
func (Holiday) TableName() string {
	return "holidays"
}

