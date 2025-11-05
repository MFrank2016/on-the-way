package models

import (
	"time"

	"gorm.io/gorm"
)

type UserSettings struct {
	ID               uint64         `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID           uint64         `json:"userId" gorm:"uniqueIndex;not null"`
	PopupEnabled     bool           `json:"popupEnabled" gorm:"default:true"`
	PopupSound       string         `json:"popupSound" gorm:"type:varchar(50);default:'default'"` // default, gentle, alert
	EmailEnabled     bool           `json:"emailEnabled" gorm:"default:false"`
	EmailAddress     string         `json:"emailAddress" gorm:"type:varchar(100)"`
	WechatEnabled    bool           `json:"wechatEnabled" gorm:"default:false"`
	WechatWebhookURL string         `json:"wechatWebhookUrl" gorm:"type:varchar(500)"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}
