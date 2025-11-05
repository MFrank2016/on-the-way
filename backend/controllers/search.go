package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SearchController struct {
	db *gorm.DB
}

func NewSearchController(db *gorm.DB) *SearchController {
	return &SearchController{db: db}
}

func (ctrl *SearchController) Search(c *gin.Context) {
	userID := middleware.GetUserID(c)
	query := c.Query("q")

	if query == "" {
		utils.BadRequest(c, "Search query is required")
		return
	}

	// 搜索任务
	var tasks []models.Task
	ctrl.db.Where("user_id = ? AND (title LIKE ? OR description LIKE ?)", userID, "%"+query+"%", "%"+query+"%").
		Preload("List").Preload("Tags").
		Limit(20).
		Find(&tasks)

	// 搜索清单
	var lists []models.List
	ctrl.db.Where("user_id = ? AND name LIKE ?", userID, "%"+query+"%").
		Limit(10).
		Find(&lists)

	// 搜索标签
	var tags []models.Tag
	ctrl.db.Where("user_id = ? AND name LIKE ?", userID, "%"+query+"%").
		Limit(10).
		Find(&tags)

	utils.Success(c, gin.H{
		"tasks": tasks,
		"lists": lists,
		"tags":  tags,
	})
}

