package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TagController struct {
	db *gorm.DB
}

func NewTagController(db *gorm.DB) *TagController {
	return &TagController{db: db}
}

type TagRequest struct {
	Name      string  `json:"name" binding:"required"`
	Color     string  `json:"color"`
	ParentID  *uint64 `json:"parentId"`
	SortOrder int     `json:"sortOrder"`
}

type TogglePinRequest struct {
	IsPinned bool `json:"isPinned"`
}

type MoveTagRequest struct {
	ParentID  *uint64 `json:"parentId"`
	SortOrder int     `json:"sortOrder"`
}

// GetTags 获取标签树形结构
func (ctrl *TagController) GetTags(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var tags []models.Tag
	if err := ctrl.db.Where("user_id = ?", userID).
		Preload("Children", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order ASC")
		}).
		Order("is_pinned DESC, sort_order ASC").
		Find(&tags).Error; err != nil {
		utils.InternalError(c, "Failed to get tags")
		return
	}

	// 构建树形结构（只返回顶层标签，子标签已通过Preload加载）
	var rootTags []models.Tag
	for _, tag := range tags {
		if tag.ParentID == nil {
			rootTags = append(rootTags, tag)
		}
	}

	utils.Success(c, rootTags)
}

// CreateTag 创建标签
func (ctrl *TagController) CreateTag(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req TagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果有父标签ID，验证父标签是否存在
	if req.ParentID != nil {
		var parentTag models.Tag
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).
			First(&parentTag).Error; err != nil {
			utils.NotFound(c, "Parent tag not found")
			return
		}
	}

	tag := models.Tag{
		UserID:    userID,
		Name:      req.Name,
		Color:     req.Color,
		ParentID:  req.ParentID,
		SortOrder: req.SortOrder,
	}

	if err := ctrl.db.Create(&tag).Error; err != nil {
		utils.InternalError(c, "Failed to create tag")
		return
	}

	utils.Success(c, tag)
}

// UpdateTag 更新标签
func (ctrl *TagController) UpdateTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID := c.Param("id")

	var tag models.Tag
	if err := ctrl.db.Where("id = ? AND user_id = ?", tagID, userID).
		First(&tag).Error; err != nil {
		utils.NotFound(c, "Tag not found")
		return
	}

	var req TagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果修改父标签，需要验证
	if req.ParentID != nil && *req.ParentID != 0 {
		// 不能设置自己为父标签
		if *req.ParentID == tag.ID {
			utils.BadRequest(c, "Cannot set tag as its own parent")
			return
		}

		// 验证父标签存在
		var parentTag models.Tag
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).
			First(&parentTag).Error; err != nil {
			utils.NotFound(c, "Parent tag not found")
			return
		}

		// 检查循环引用
		if parentTag.ParentID != nil && *parentTag.ParentID == tag.ID {
			utils.BadRequest(c, "Cannot create circular reference")
			return
		}
	}

	tag.Name = req.Name
	tag.Color = req.Color
	if req.ParentID != nil {
		if *req.ParentID == 0 {
			tag.ParentID = nil
		} else {
			tag.ParentID = req.ParentID
		}
	}

	if err := ctrl.db.Save(&tag).Error; err != nil {
		utils.InternalError(c, "Failed to update tag")
		return
	}

	utils.Success(c, tag)
}

// DeleteTag 删除标签
func (ctrl *TagController) DeleteTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID := c.Param("id")

	// 检查是否有子标签
	var childCount int64
	ctrl.db.Model(&models.Tag{}).Where("parent_id = ?", tagID).Count(&childCount)
	if childCount > 0 {
		utils.BadRequest(c, "Cannot delete tag with children. Please delete or move child tags first.")
		return
	}

	// 删除标签与任务的关联
	ctrl.db.Where("tag_id = ?", tagID).Delete(&models.TaskTag{})

	// 删除标签
	result := ctrl.db.Where("id = ? AND user_id = ?", tagID, userID).
		Delete(&models.Tag{})
	
	if result.Error != nil {
		utils.InternalError(c, "Failed to delete tag")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Tag not found")
		return
	}

	utils.Success(c, gin.H{"message": "Tag deleted successfully"})
}

// MoveTag 移动标签（修改父级或排序）
func (ctrl *TagController) MoveTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID := c.Param("id")

	var tag models.Tag
	if err := ctrl.db.Where("id = ? AND user_id = ?", tagID, userID).
		First(&tag).Error; err != nil {
		utils.NotFound(c, "Tag not found")
		return
	}

	var req MoveTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果有新的父标签ID，验证父标签是否存在且不是自己或自己的子孙
	if req.ParentID != nil {
		if *req.ParentID == tag.ID {
			utils.BadRequest(c, "Cannot move tag to itself")
			return
		}

		var parentTag models.Tag
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ParentID, userID).
			First(&parentTag).Error; err != nil {
			utils.NotFound(c, "Parent tag not found")
			return
		}

		// 检查是否会造成循环引用（简单检查：父标签的父级是否是当前标签）
		if parentTag.ParentID != nil && *parentTag.ParentID == tag.ID {
			utils.BadRequest(c, "Cannot create circular reference")
			return
		}
	}

	tag.ParentID = req.ParentID
	tag.SortOrder = req.SortOrder

	if err := ctrl.db.Save(&tag).Error; err != nil {
		utils.InternalError(c, "Failed to move tag")
		return
	}

	utils.Success(c, tag)
}

// TogglePin 切换标签置顶状态
func (ctrl *TagController) TogglePin(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID := c.Param("id")

	var tag models.Tag
	if err := ctrl.db.Where("id = ? AND user_id = ?", tagID, userID).
		First(&tag).Error; err != nil {
		utils.NotFound(c, "Tag not found")
		return
	}

	var req TogglePinRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	tag.IsPinned = req.IsPinned

	if err := ctrl.db.Save(&tag).Error; err != nil {
		utils.InternalError(c, "Failed to toggle pin")
		return
	}

	utils.Success(c, tag)
}

// GetTasksByTag 根据标签ID获取所有关联的任务（包括子标签的任务）
func (ctrl *TagController) GetTasksByTag(c *gin.Context) {
	userID := middleware.GetUserID(c)
	tagID := c.Param("id")

	// 验证标签存在
	var tag models.Tag
	if err := ctrl.db.Where("id = ? AND user_id = ?", tagID, userID).
		First(&tag).Error; err != nil {
		utils.NotFound(c, "Tag not found")
		return
	}

	// 获取所有子标签ID（递归）
	tagIDs := []uint64{tag.ID}
	ctrl.getChildTagIDs(tag.ID, userID, &tagIDs)

	// 查询包含这些标签的任务
	var tasks []models.Task
	if err := ctrl.db.
		Joins("JOIN task_tags ON task_tags.task_id = tasks.id").
		Where("task_tags.tag_id IN ? AND tasks.user_id = ? AND tasks.status = ?", tagIDs, userID, "todo").
		Preload("Tags").
		Preload("List").
		Order("tasks.sort_order ASC, tasks.created_at DESC").
		Group("tasks.id").
		Find(&tasks).Error; err != nil {
		utils.InternalError(c, "Failed to get tasks")
		return
	}

	utils.Success(c, tasks)
}

// getChildTagIDs 递归获取所有子标签ID
func (ctrl *TagController) getChildTagIDs(parentID uint64, userID uint64, tagIDs *[]uint64) {
	var children []models.Tag
	ctrl.db.Where("parent_id = ? AND user_id = ?", parentID, userID).Find(&children)
	
	for _, child := range children {
		*tagIDs = append(*tagIDs, child.ID)
		ctrl.getChildTagIDs(child.ID, userID, tagIDs)
	}
}

