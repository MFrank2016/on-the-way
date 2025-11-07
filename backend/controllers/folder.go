package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type FolderController struct {
	db *gorm.DB
}

func NewFolderController(db *gorm.DB) *FolderController {
	return &FolderController{db: db}
}

type FolderRequest struct {
	Name       string `json:"name" binding:"required"`
	Color      string `json:"color"`
	Icon       string `json:"icon"`
	SortOrder  int    `json:"sortOrder"`
	IsExpanded bool   `json:"isExpanded"`
}

// FolderListWithCount 清单及其待办任务数
type FolderListWithCount struct {
	models.List
	TodoCount int `json:"todoCount"`
}

// FolderResponse 文件夹响应结构，包含清单列表和待办任务总数
type FolderResponse struct {
	models.Folder
	Lists     []FolderListWithCount `json:"lists,omitempty"`
	TodoCount int             `json:"todoCount"`
}

// GetFolders 获取用户所有文件夹（平级结构）
func (ctrl *FolderController) GetFolders(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var folders []models.Folder
	if err := ctrl.db.Where("user_id = ?", userID).
		Order("sort_order ASC, created_at ASC").
		Find(&folders).Error; err != nil {
		utils.InternalError(c, "Failed to get folders")
		return
	}

	// 查询所有清单
	var lists []models.List
	ctrl.db.Where("user_id = ?", userID).Find(&lists)

	// 构建文件夹ID到清单的映射，并计算每个清单的待办任务数
	listsByFolder := make(map[uint64][]FolderListWithCount)
	for _, list := range lists {
		var todoCount int64
		ctrl.db.Model(&models.Task{}).
			Where("user_id = ? AND list_id = ? AND status = ?", userID, list.ID, "todo").
			Count(&todoCount)

		listWithCount := FolderListWithCount{
			List:      list,
			TodoCount: int(todoCount),
		}

		if list.FolderID != nil {
			listsByFolder[*list.FolderID] = append(listsByFolder[*list.FolderID], listWithCount)
		}
	}

	// 构建响应（平级结构），计算每个文件夹的待办任务总数
	var folderResponses []FolderResponse
	for i := range folders {
		folderLists := listsByFolder[folders[i].ID]
		
		// 计算文件夹下所有清单的待办任务总数
		folderTodoCount := 0
		for _, list := range folderLists {
			folderTodoCount += list.TodoCount
		}

		folderResp := FolderResponse{
			Folder:    folders[i],
			Lists:     folderLists,
			TodoCount: folderTodoCount,
		}
		folderResponses = append(folderResponses, folderResp)
	}

	utils.Success(c, folderResponses)
}

// CreateFolder 创建文件夹
func (ctrl *FolderController) CreateFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req FolderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	folder := models.Folder{
		UserID:     userID,
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
	folderIDStr := c.Param("id")

	folderID, err := strconv.ParseUint(folderIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid folder ID")
		return
	}

	var folder models.Folder
	if err := ctrl.db.Where("id = ? AND user_id = ?", folderID, userID).
		First(&folder).Error; err != nil {
		utils.NotFound(c, "Folder not found")
		return
	}

	// 手动查询清单，并计算待办任务数
	var lists []models.List
	ctrl.db.Where("folder_id = ? AND user_id = ?", folderID, userID).Find(&lists)

	// 为每个清单计算待办任务数
	var listsWithCount []FolderListWithCount
	folderTodoCount := 0
	for _, list := range lists {
		var todoCount int64
		ctrl.db.Model(&models.Task{}).
			Where("user_id = ? AND list_id = ? AND status = ?", userID, list.ID, "todo").
			Count(&todoCount)

		listsWithCount = append(listsWithCount, FolderListWithCount{
			List:      list,
			TodoCount: int(todoCount),
		})
		folderTodoCount += int(todoCount)
	}

	// 构造响应
	folderResp := FolderResponse{
		Folder:    folder,
		Lists:     listsWithCount,
		TodoCount: folderTodoCount,
	}

	utils.Success(c, folderResp)
}

// UpdateFolder 更新文件夹
func (ctrl *FolderController) UpdateFolder(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderIDStr := c.Param("id")

	folderID, err := strconv.ParseUint(folderIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid folder ID")
		return
	}

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
	folderIDStr := c.Param("id")

	folderID, err := strconv.ParseUint(folderIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid folder ID")
		return
	}

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

	// 删除文件夹
	if err := tx.Delete(&folder).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to delete folder")
		return
	}

	tx.Commit()
	utils.Success(c, gin.H{"message": "Folder deleted successfully"})
}

// ToggleExpand 切换文件夹展开/折叠状态
func (ctrl *FolderController) ToggleExpand(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderIDStr := c.Param("id")

	folderID, err := strconv.ParseUint(folderIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid folder ID")
		return
	}

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
