package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ListController struct {
	db *gorm.DB
}

func NewListController(db *gorm.DB) *ListController {
	return &ListController{db: db}
}

type ListRequest struct {
	FolderID  *uint64 `json:"folderId"`
	Name      string  `json:"name" binding:"required"`
	Type      string  `json:"type"`
	ViewType  string  `json:"viewType"`
	Color     string  `json:"color"`
	Icon      string  `json:"icon"`
	SortOrder int     `json:"sortOrder"`
}

type ListWithCount struct {
	models.List
	TodoCount int `json:"todoCount"`
}

func (ctrl *ListController) GetLists(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var lists []models.List
	if err := ctrl.db.Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&lists).Error; err != nil {
		utils.InternalError(c, "Failed to get lists")
		return
	}

	// 为每个清单计算未完成任务数
	var listsWithCount []ListWithCount
	for _, list := range lists {
		var todoCount int64
		ctrl.db.Model(&models.Task{}).
			Where("user_id = ? AND list_id = ? AND status = ?", userID, list.ID, "todo").
			Count(&todoCount)
		
		listsWithCount = append(listsWithCount, ListWithCount{
			List:      list,
			TodoCount: int(todoCount),
		})
	}

	utils.Success(c, listsWithCount)
}

func (ctrl *ListController) CreateList(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req ListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果指定了文件夹，验证其存在且属于当前用户
	if req.FolderID != nil {
		var folder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.FolderID, userID).First(&folder).Error; err != nil {
			utils.BadRequest(c, "Folder not found")
			return
		}
	}

	// 设置默认 ViewType
	viewType := req.ViewType
	if viewType == "" {
		viewType = "list"
	}

	list := models.List{
		UserID:    userID,
		FolderID:  req.FolderID,
		Name:      req.Name,
		Type:      req.Type,
		ViewType:  viewType,
		Color:     req.Color,
		Icon:      req.Icon,
		SortOrder: req.SortOrder,
		IsDefault: false,
		IsSystem:  false,
	}

	if err := ctrl.db.Create(&list).Error; err != nil {
		utils.InternalError(c, "Failed to create list")
		return
	}

	// 创建对应的 view_config 记录，使用清单的 viewType
	viewConfig := models.ViewConfig{
		UserID:        userID,
		EntityType:    "list",
		EntityID:      list.ID,
		GroupBy:       "none",
		SortBy:        "time",
		SortOrder:     "asc",
		ViewType:      viewType,
		HideCompleted: false,
		ShowDetail:    false,
	}

	if err := ctrl.db.Create(&viewConfig).Error; err != nil {
		// 这里只记录错误，不影响清单创建的成功
		// 因为即使 view_config 创建失败，前端也会使用默认配置
		utils.Logger.Warn("Failed to create view config for list",
			zap.Uint64("listId", list.ID),
			zap.Error(err),
		)
	}

	utils.Success(c, list)
}

func (ctrl *ListController) UpdateList(c *gin.Context) {
	userID := middleware.GetUserID(c)
	listIDStr := c.Param("id")

	listID, err := strconv.ParseUint(listIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid list ID")
		return
	}

	var list models.List
	if err := ctrl.db.Where("id = ? AND user_id = ?", listID, userID).First(&list).Error; err != nil {
		utils.NotFound(c, "List not found")
		return
	}

	var req ListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果指定了文件夹，验证其存在
	if req.FolderID != nil {
		var folder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.FolderID, userID).First(&folder).Error; err != nil {
			utils.BadRequest(c, "Folder not found")
			return
		}
	}

	list.FolderID = req.FolderID
	list.Name = req.Name
	list.Type = req.Type
	if req.ViewType != "" {
		list.ViewType = req.ViewType
	}
	list.Color = req.Color
	list.Icon = req.Icon
	list.SortOrder = req.SortOrder

	if err := ctrl.db.Save(&list).Error; err != nil {
		utils.InternalError(c, "Failed to update list")
		return
	}

	// 如果更新了 viewType，同时更新对应的 view_config
	if req.ViewType != "" {
		var viewConfig models.ViewConfig
		err := ctrl.db.Where("user_id = ? AND entity_type = ? AND entity_id = ?",
			userID, "list", listID).First(&viewConfig).Error

		if err == gorm.ErrRecordNotFound {
			// 如果不存在，创建新的 view_config
			viewConfig = models.ViewConfig{
				UserID:        userID,
				EntityType:    "list",
				EntityID:      list.ID,
				GroupBy:       "none",
				SortBy:        "time",
				SortOrder:     "asc",
				ViewType:      req.ViewType,
				HideCompleted: false,
				ShowDetail:    false,
			}
			if err := ctrl.db.Create(&viewConfig).Error; err != nil {
				utils.Logger.Warn("Failed to create view config for list",
					zap.Uint64("listId", list.ID),
					zap.Error(err),
				)
			}
		} else if err == nil {
			// 如果存在，只更新 viewType
			viewConfig.ViewType = req.ViewType
			if err := ctrl.db.Save(&viewConfig).Error; err != nil {
				utils.Logger.Warn("Failed to update view config for list",
					zap.Uint64("listId", list.ID),
					zap.Error(err),
				)
			}
		}
	}

	utils.Success(c, list)
}

func (ctrl *ListController) DeleteList(c *gin.Context) {
	userID := middleware.GetUserID(c)
	listIDStr := c.Param("id")

	listID, err := strconv.ParseUint(listIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid list ID")
		return
	}

	// 检查清单是否存在
	var list models.List
	if err := ctrl.db.Where("id = ? AND user_id = ?", listID, userID).First(&list).Error; err != nil {
		utils.NotFound(c, "List not found")
		return
	}

	// 禁止删除系统清单
	if list.IsSystem {
		utils.BadRequest(c, "Cannot delete system list")
		return
	}

	// 删除清单
	if err := ctrl.db.Delete(&list).Error; err != nil {
		utils.InternalError(c, "Failed to delete list")
		return
	}

	utils.Success(c, gin.H{"message": "List deleted successfully"})
}

// MoveList 移动清单到文件夹或顶层
func (ctrl *ListController) MoveList(c *gin.Context) {
	userID := middleware.GetUserID(c)
	listIDStr := c.Param("id")

	listID, err := strconv.ParseUint(listIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid list ID")
		return
	}

	var req struct {
		FolderID  *uint64 `json:"folderId"`
		SortOrder int     `json:"sortOrder"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var list models.List
	if err := ctrl.db.Where("id = ? AND user_id = ?", listID, userID).First(&list).Error; err != nil {
		utils.NotFound(c, "List not found")
		return
	}

	// 验证文件夹
	if req.FolderID != nil {
		var folder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.FolderID, userID).First(&folder).Error; err != nil {
			utils.BadRequest(c, "Folder not found")
			return
		}
	}

	list.FolderID = req.FolderID
	list.SortOrder = req.SortOrder

	if err := ctrl.db.Save(&list).Error; err != nil {
		utils.InternalError(c, "Failed to move list")
		return
	}

	utils.Success(c, list)
}
