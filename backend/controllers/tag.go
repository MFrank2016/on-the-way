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

type MoveTagRequest struct {
	ParentID  *uint64 `json:"parentId"`
	SortOrder int     `json:"sortOrder"`
}

// GetTags 获取标签树形结构
func (ctrl *TagController) GetTags(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var tags []models.Tag
	if err := ctrl.db.Where("user_id = ?", userID).
		Preload("Children").
		Order("sort_order ASC").
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

	tag.Name = req.Name
	tag.Color = req.Color

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

