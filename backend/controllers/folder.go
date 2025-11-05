package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FolderController struct {
	db *gorm.DB
}

func NewFolderController(db *gorm.DB) *FolderController {
	return &FolderController{db: db}
}

type FolderRequest struct {
	ParentID   *string `json:"parentId"`
	Name       string  `json:"name" binding:"required"`
	Color      string  `json:"color"`
	Icon       string  `json:"icon"`
	SortOrder  int     `json:"sortOrder"`
	IsExpanded bool    `json:"isExpanded"`
}

// GetFolders 获取用户所有文件夹（树形结构）
func (ctrl *FolderController) GetFolders(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var folders []models.Folder
	if err := ctrl.db.Where("user_id = ?", userID).
		Preload("Lists").
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		utils.InternalError(c, "Failed to get folders")
		return
	}

	// 构建树形结构
	folderMap := make(map[string]*models.Folder)
	var rootFolders []models.Folder

	// 第一遍：创建映射
	for i := range folders {
		folderMap[folders[i].ID] = &folders[i]
		folders[i].Children = []models.Folder{}
	}

	// 第二遍：构建树形结构
	for i := range folders {
		if folders[i].ParentID == nil {
			rootFolders = append(rootFolders, folders[i])
		} else if parent, ok := folderMap[*folders[i].ParentID]; ok {
			parent.Children = append(parent.Children, folders[i])
		}
	}

	utils.Success(c, rootFolders)
}

// CreateFolder 创建文件夹
func (ctrl *FolderController) CreateFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req FolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果指定了父文件夹，验证其存在且属于当前用户
	if req.ParentID != nil {
		var parentFolder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).First(&parentFolder).Error; err != nil {
			utils.BadRequest(c, "Parent folder not found")
			return
		}
	}

	folder := models.Folder{
		ID:         uuid.New().String(),
		UserID:     userID,
		ParentID:   req.ParentID,
		Name:       req.Name,
		Color:      req.Color,
		Icon:       req.Icon,
		SortOrder:  req.SortOrder,
		IsExpanded: req.IsExpanded,
	}

	if err := ctrl.db.Create(&folder).Error; err != nil {
		utils.InternalError(c, "Failed to create folder")
		return
	}

	utils.Success(c, folder)
}

// GetFolder 获取单个文件夹
func (ctrl *FolderController) GetFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID := c.Param("id")

	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).
		Preload("Lists").
		Preload("Children").
		First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	utils.Success(c, folder)
}

// UpdateFolder 更新文件夹
func (ctrl *FolderController) UpdateFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID := c.Param("id")

	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	var req FolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果更改了父文件夹，验证新父文件夹
	if req.ParentID != nil {
		// 不能将文件夹移动到自己或自己的子文件夹下
		if *req.ParentID == folder.ID {
			utils.BadRequest(c, "Cannot move folder to itself")
			return
		}

		// 检查父文件夹是否存在
		var parentFolder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).First(&parentFolder).Error; err != nil {
			utils.BadRequest(c, "Parent folder not found")
			return
		}

		// TODO: 检查是否会造成循环引用（将来可以添加）
	}

	folder.ParentID = req.ParentID
	folder.Name = req.Name
	folder.Color = req.Color
	folder.Icon = req.Icon
	folder.SortOrder = req.SortOrder
	folder.IsExpanded = req.IsExpanded

	if err := ctrl.db.Save(&folder).Error; err != nil {
		utils.InternalError(c, "Failed to update folder")
		return
	}

	utils.Success(c, folder)
}

// DeleteFolder 删除文件夹
func (ctrl *FolderController) DeleteFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID := c.Param("id")

	// 检查文件夹是否存在
	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	// 开始事务
	tx := ctrl.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 将该文件夹下的所有清单移到顶层（folder_id 设为 NULL）
	if err := tx.Model(&models.List{}).
		Where("folder_id = ? AND user_id = ?", folderID, userID).
		Update("folder_id", nil).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to move lists")
		return
	}

	// 将子文件夹移到该文件夹的父级（或顶层）
	if err := tx.Model(&models.Folder{}).
		Where("parent_id = ? AND user_id = ?", folderID, userID).
		Update("parent_id", folder.ParentID).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to move subfolders")
		return
	}

	// 删除文件夹
	if err := tx.Delete(&folder).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete folder")
		return
	}

	tx.Commit()
	utils.Success(c, gin.H{"message": "Folder deleted successfully"})
}

// MoveFolder 移动文件夹
func (ctrl *FolderController) MoveFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID := c.Param("id")

	var req struct {
		ParentID  *string `json:"parentId"`
		SortOrder int     `json:"sortOrder"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	// 不能移动到自己
	if req.ParentID != nil && *req.ParentID == folder.ID {
		utils.BadRequest(c, "Cannot move folder to itself")
		return
	}

	// 验证父文件夹
	if req.ParentID != nil {
		var parentFolder models.Folder
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).First(&parentFolder).Error; err != nil {
			utils.BadRequest(c, "Parent folder not found")
			return
		}
	}

	folder.ParentID = req.ParentID
	folder.SortOrder = req.SortOrder

	if err := ctrl.db.Save(&folder).Error; err != nil {
		utils.InternalError(c, "Failed to move folder")
		return
	}

	utils.Success(c, folder)
}

// ToggleExpand 切换文件夹展开/折叠状态
func (ctrl *FolderController) ToggleExpand(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID := c.Param("id")

	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	folder.IsExpanded = !folder.IsExpanded

	if err := ctrl.db.Save(&folder).Error; err != nil {
		utils.InternalError(c, "Failed to toggle expand")
		return
	}

	utils.Success(c, folder)
}

