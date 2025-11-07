package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ViewConfigController struct {
	db *gorm.DB
}

func NewViewConfigController(db *gorm.DB) *ViewConfigController {
	return &ViewConfigController{db: db}
}

type ViewConfigRequest struct {
	EntityType    string `json:"entityType" binding:"required,oneof=filter list preset"`
	EntityID      uint64 `json:"entityId" binding:"required"`
	GroupBy       string `json:"groupBy" binding:"required,oneof=none time list tag priority"`
	SortBy        string `json:"sortBy" binding:"required,oneof=time title tag priority"`
	SortOrder     string `json:"sortOrder" binding:"required,oneof=asc desc"`
	ViewType      string `json:"viewType" binding:"omitempty,oneof=list kanban timeline"`
	HideCompleted *bool  `json:"hideCompleted"`
	ShowDetail    *bool  `json:"showDetail"`
}

// GetViewConfig 获取视图配置
// Query参数: entityType (filter/list/preset), entityId
func (ctrl *ViewConfigController) GetViewConfig(c *gin.Context) {
	userID := middleware.GetUserID(c)
	entityType := c.Query("entityType")
	entityID := c.Query("entityId")

	if entityType == "" || entityID == "" {
		utils.BadRequest(c, "entityType and entityId are required")
		return
	}

	// 验证entityType
	if entityType != "filter" && entityType != "list" && entityType != "preset" {
		utils.BadRequest(c, "entityType must be 'filter', 'list' or 'preset'")
		return
	}

	var config models.ViewConfig
	err := ctrl.db.Where("user_id = ? AND entity_type = ? AND entity_id = ?", userID, entityType, entityID).
		First(&config).Error

	// 如果不存在，返回默认配置
	if err == gorm.ErrRecordNotFound {
		utils.Success(c, gin.H{
			"groupBy":       "none",
			"sortBy":        "time",
			"sortOrder":     "asc",
			"viewType":      "list",
			"hideCompleted": false,
			"showDetail":    false,
		})
		return
	}

	if err != nil {
		utils.InternalError(c, "Failed to get view config")
		return
	}

	utils.Success(c, config)
}

// UpdateViewConfig 更新或创建视图配置（upsert）
func (ctrl *ViewConfigController) UpdateViewConfig(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ViewConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var config models.ViewConfig
	err := ctrl.db.Where("user_id = ? AND entity_type = ? AND entity_id = ?",
		userID, req.EntityType, req.EntityID).
		First(&config).Error

	// 如果不存在，创建新记录
	if err == gorm.ErrRecordNotFound {
		config = models.ViewConfig{
			UserID:     userID,
			EntityType: req.EntityType,
			EntityID:   req.EntityID,
			GroupBy:    req.GroupBy,
			SortBy:     req.SortBy,
			SortOrder:  req.SortOrder,
		}
		// 设置可选字段的默认值
		if req.ViewType != "" {
			config.ViewType = req.ViewType
		} else {
			config.ViewType = "list"
		}
		if req.HideCompleted != nil {
			config.HideCompleted = *req.HideCompleted
		}
		if req.ShowDetail != nil {
			config.ShowDetail = *req.ShowDetail
		}
		if err := ctrl.db.Create(&config).Error; err != nil {
			utils.InternalError(c, "Failed to create view config")
			return
		}
	} else if err != nil {
		utils.InternalError(c, "Failed to get view config")
		return
	} else {
		// 更新现有记录
		config.GroupBy = req.GroupBy
		config.SortBy = req.SortBy
		config.SortOrder = req.SortOrder
		if req.ViewType != "" {
			config.ViewType = req.ViewType
		}
		if req.HideCompleted != nil {
			config.HideCompleted = *req.HideCompleted
		}
		if req.ShowDetail != nil {
			config.ShowDetail = *req.ShowDetail
		}
		if err := ctrl.db.Save(&config).Error; err != nil {
			utils.InternalError(c, "Failed to update view config")
			return
		}
	}

	utils.Success(c, config)
}

