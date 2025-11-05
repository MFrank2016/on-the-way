package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserSettingsController struct {
	db *gorm.DB
}

func NewUserSettingsController(db *gorm.DB) *UserSettingsController {
	return &UserSettingsController{db: db}
}

type SettingsRequest struct {
	PopupEnabled     *bool   `json:"popupEnabled"`
	PopupSound       string  `json:"popupSound"`
	EmailEnabled     *bool   `json:"emailEnabled"`
	EmailAddress     string  `json:"emailAddress"`
	WechatEnabled    *bool   `json:"wechatEnabled"`
	WechatWebhookURL string  `json:"wechatWebhookUrl"`
}

// GetSettings 获取用户设置
func (ctrl *UserSettingsController) GetSettings(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var settings models.UserSettings
	err := ctrl.db.Where("user_id = ?", userID).First(&settings).Error

	// 如果不存在，创建默认设置
	if err == gorm.ErrRecordNotFound {
		settings = models.UserSettings{
			ID:           uuid.New().String(),
			UserID:       userID,
			PopupEnabled: true,
			PopupSound:   "default",
		}
		if err := ctrl.db.Create(&settings).Error; err != nil {
			utils.InternalError(c, "Failed to create default settings")
			return
		}
	} else if err != nil {
		utils.InternalError(c, "Failed to get settings")
		return
	}

	utils.Success(c, settings)
}

// UpdateSettings 更新用户设置
func (ctrl *UserSettingsController) UpdateSettings(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req SettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var settings models.UserSettings
	err := ctrl.db.Where("user_id = ?", userID).First(&settings).Error

	// 如果不存在，创建新的
	if err == gorm.ErrRecordNotFound {
		settings = models.UserSettings{
			ID:     uuid.New().String(),
			UserID: userID,
		}
	} else if err != nil {
		utils.InternalError(c, "Failed to get settings")
		return
	}

	// 更新字段
	if req.PopupEnabled != nil {
		settings.PopupEnabled = *req.PopupEnabled
	}
	if req.PopupSound != "" {
		settings.PopupSound = req.PopupSound
	}
	if req.EmailEnabled != nil {
		settings.EmailEnabled = *req.EmailEnabled
	}
	if req.EmailAddress != "" {
		settings.EmailAddress = req.EmailAddress
	}
	if req.WechatEnabled != nil {
		settings.WechatEnabled = *req.WechatEnabled
	}
	if req.WechatWebhookURL != "" {
		settings.WechatWebhookURL = req.WechatWebhookURL
	}

	if err := ctrl.db.Save(&settings).Error; err != nil {
		utils.InternalError(c, "Failed to update settings")
		return
	}

	utils.Success(c, settings)
}

