package controllers

import (
	"encoding/json"
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FilterController struct {
	db *gorm.DB
}

func NewFilterController(db *gorm.DB) *FilterController {
	return &FilterController{db: db}
}

type FilterRequest struct {
	Name         string               `json:"name" binding:"required"`
	Icon         string               `json:"icon"`
	IsPinned     bool                 `json:"isPinned"`
	SortOrder    int                  `json:"sortOrder"`
	FilterConfig *models.FilterConfig `json:"filterConfig" binding:"required"`
}

type FilterTogglePinRequest struct {
	IsPinned bool `json:"isPinned"`
}

type ReorderRequest struct {
	FilterIDs []uint64 `json:"filterIds" binding:"required"`
}

// GetFilters 获取用户的所有过滤器
func (ctrl *FilterController) GetFilters(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var filters []models.Filter
	if err := ctrl.db.Where("user_id = ?", userID).
		Order("is_pinned DESC, sort_order ASC").
		Find(&filters).Error; err != nil {
		utils.InternalError(c, "Failed to get filters")
		return
	}

	utils.Success(c, filters)
}

// CreateFilter 创建新过滤器
func (ctrl *FilterController) CreateFilter(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req FilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 序列化 FilterConfig 为 JSON 字符串
	configJSON, err := json.Marshal(req.FilterConfig)
	if err != nil {
		utils.BadRequest(c, "Invalid filter configuration")
		return
	}

	// 获取当前最大的 sortOrder
	var maxSortOrder int
	ctrl.db.Model(&models.Filter{}).
		Where("user_id = ?", userID).
		Select("COALESCE(MAX(sort_order), 0)").
		Scan(&maxSortOrder)

	filter := models.Filter{
		UserID:       userID,
		Name:         req.Name,
		Icon:         req.Icon,
		IsPinned:     req.IsPinned,
		SortOrder:    maxSortOrder + 1,
		FilterConfig: string(configJSON),
	}

	if err := ctrl.db.Create(&filter).Error; err != nil {
		utils.InternalError(c, "Failed to create filter")
		return
	}

	utils.Success(c, filter)
}

// UpdateFilter 更新过滤器
func (ctrl *FilterController) UpdateFilter(c *gin.Context) {
	userID := middleware.GetUserID(c)
	filterID := c.Param("id")

	var filter models.Filter
	if err := ctrl.db.Where("id = ? AND user_id = ?", filterID, userID).
		First(&filter).Error; err != nil {
		utils.NotFound(c, "Filter not found")
		return
	}

	var req FilterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 序列化 FilterConfig 为 JSON 字符串
	configJSON, err := json.Marshal(req.FilterConfig)
	if err != nil {
		utils.BadRequest(c, "Invalid filter configuration")
		return
	}

	filter.Name = req.Name
	filter.Icon = req.Icon
	filter.FilterConfig = string(configJSON)

	if err := ctrl.db.Save(&filter).Error; err != nil {
		utils.InternalError(c, "Failed to update filter")
		return
	}

	utils.Success(c, filter)
}

// DeleteFilter 删除过滤器
func (ctrl *FilterController) DeleteFilter(c *gin.Context) {
	userID := middleware.GetUserID(c)
	filterID := c.Param("id")

	result := ctrl.db.Where("id = ? AND user_id = ?", filterID, userID).
		Delete(&models.Filter{})

	if result.Error != nil {
		utils.InternalError(c, "Failed to delete filter")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Filter not found")
		return
	}

	utils.Success(c, gin.H{"message": "Filter deleted successfully"})
}

// TogglePin 切换置顶状态
func (ctrl *FilterController) TogglePin(c *gin.Context) {
	userID := middleware.GetUserID(c)
	filterID := c.Param("id")

	var filter models.Filter
	if err := ctrl.db.Where("id = ? AND user_id = ?", filterID, userID).
		First(&filter).Error; err != nil {
		utils.NotFound(c, "Filter not found")
		return
	}

	var req FilterTogglePinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	filter.IsPinned = req.IsPinned

	if err := ctrl.db.Save(&filter).Error; err != nil {
		utils.InternalError(c, "Failed to toggle pin")
		return
	}

	utils.Success(c, filter)
}

// ReorderFilters 重新排序过滤器
func (ctrl *FilterController) ReorderFilters(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 在事务中更新所有过滤器的排序
	err := ctrl.db.Transaction(func(tx *gorm.DB) error {
		for idx, filterID := range req.FilterIDs {
			if err := tx.Model(&models.Filter{}).
				Where("id = ? AND user_id = ?", filterID, userID).
				Update("sort_order", idx).Error; err != nil {
				return err
			}
		}
		return nil
	})

	if err != nil {
		utils.InternalError(c, "Failed to reorder filters")
		return
	}

	utils.Success(c, gin.H{"message": "Filters reordered successfully"})
}
