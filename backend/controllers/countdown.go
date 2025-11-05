package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CountdownController struct {
	db *gorm.DB
}

func NewCountdownController(db *gorm.DB) *CountdownController {
	return &CountdownController{db: db}
}

type CountdownRequest struct {
	Title      string    `json:"title" binding:"required"`
	TargetDate time.Time `json:"targetDate" binding:"required"`
	ImageURL   string    `json:"imageUrl"`
	Type       string    `json:"type"`
}

func (ctrl *CountdownController) GetCountdowns(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var countdowns []models.Countdown
	if err := ctrl.db.Where("user_id = ?", userID).Order("target_date ASC").Find(&countdowns).Error; err != nil {
		utils.InternalError(c, "Failed to get countdowns")
		return
	}

	utils.Success(c, countdowns)
}

func (ctrl *CountdownController) CreateCountdown(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CountdownRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	countdown := models.Countdown{
		ID:         uuid.New().String(),
		UserID:     userID,
		Title:      req.Title,
		TargetDate: req.TargetDate,
		ImageURL:   req.ImageURL,
		Type:       req.Type,
	}

	if err := ctrl.db.Create(&countdown).Error; err != nil {
		utils.InternalError(c, "Failed to create countdown")
		return
	}

	utils.Success(c, countdown)
}

func (ctrl *CountdownController) UpdateCountdown(c *gin.Context) {
	userID := middleware.GetUserID(c)
	countdownID := c.Param("id")

	var countdown models.Countdown
	if err := ctrl.db.Where("id = ? AND user_id = ?", countdownID, userID).First(&countdown).Error; err != nil {
		utils.NotFound(c, "Countdown not found")
		return
	}

	var req CountdownRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	countdown.Title = req.Title
	countdown.TargetDate = req.TargetDate
	countdown.ImageURL = req.ImageURL
	countdown.Type = req.Type

	if err := ctrl.db.Save(&countdown).Error; err != nil {
		utils.InternalError(c, "Failed to update countdown")
		return
	}

	utils.Success(c, countdown)
}

func (ctrl *CountdownController) DeleteCountdown(c *gin.Context) {
	userID := middleware.GetUserID(c)
	countdownID := c.Param("id")

	result := ctrl.db.Where("id = ? AND user_id = ?", countdownID, userID).Delete(&models.Countdown{})
	if result.Error != nil {
		utils.InternalError(c, "Failed to delete countdown")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Countdown not found")
		return
	}

	utils.Success(c, gin.H{"message": "Countdown deleted successfully"})
}

