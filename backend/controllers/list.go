package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"strconv"

	"github.com/gin-gonic/gin"
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
	Color     string  `json:"color"`
	Icon      string  `json:"icon"`
	SortOrder int     `json:"sortOrder"`
}

func (ctrl *ListController) GetLists(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var lists []models.List
	if err := ctrl.db.Where("user_id = ?", userID).
		Preload("Folder").
		Order("sort_order ASC, created_at ASC").
		Find(&lists).Error; err != nil {
		utils.InternalError(c, "Failed to get lists")
		return
	}

	utils.Success(c, lists)
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

	list := models.List{
		UserID:    userID,
		FolderID:  req.FolderID,
		Name:      req.Name,
		Type:      req.Type,
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

	// 重新加载关联数据
	ctrl.db.Preload("Folder").First(&list, "id = ?", list.ID)

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
	list.Color = req.Color
	list.Icon = req.Icon
	list.SortOrder = req.SortOrder

	if err := ctrl.db.Save(&list).Error; err != nil {
		utils.InternalError(c, "Failed to update list")
		return
	}

	// 重新加载关联数据
	ctrl.db.Preload("Folder").First(&list, "id = ?", list.ID)

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

	// 重新加载关联数据
	ctrl.db.Preload("Folder").First(&list, "id = ?", list.ID)

	utils.Success(c, list)
}

