package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/utils"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuthController struct {
	db *gorm.DB
}

func NewAuthController(db *gorm.DB) *AuthController {
	return &AuthController{db: db}
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (ctrl *AuthController) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 检查邮箱是否已存在
	var existingUser models.User
	if err := ctrl.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "Email already exists")
		return
	}

	// 检查用户名是否已存在
	if err := ctrl.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		utils.BadRequest(c, "Username already exists")
		return
	}

	// 哈希密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.InternalError(c, "Failed to hash password")
		return
	}

	// 创建用户
	user := models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hashedPassword,
	}

	// 开始事务
	tx := ctrl.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to create user")
		return
	}

	// 创建默认收集箱清单
	inboxList := models.List{
		UserID:    user.ID,
		Name:      "收集箱",
		Type:      "inbox",
		Icon:      "📥",
		Color:     "#3B82F6",
		SortOrder: 0,
		IsDefault: true,
		IsSystem:  true,
	}

	if err := tx.Create(&inboxList).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to create default inbox")
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, "Failed to commit transaction")
		return
	}

	// 生成token
	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		utils.InternalError(c, "Failed to generate token")
		return
	}

	utils.Success(c, gin.H{
		"user":  user,
		"token": token,
	})
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 查找用户
	var user models.User
	if err := ctrl.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	// 验证密码
	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		utils.Unauthorized(c, "Invalid email or password")
		return
	}

	// 生成token
	token, err := utils.GenerateToken(user.ID)
	if err != nil {
		utils.InternalError(c, "Failed to generate token")
		return
	}

	utils.Success(c, gin.H{
		"user":  user,
		"token": token,
	})
}

func (ctrl *AuthController) Logout(c *gin.Context) {
	utils.Success(c, gin.H{
		"message": "Logged out successfully",
	})
}

func (ctrl *AuthController) GetProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var user models.User
	if err := ctrl.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	utils.Success(c, user)
}

func (ctrl *AuthController) UpdateProfile(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var user models.User
	if err := ctrl.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.NotFound(c, "User not found")
		return
	}

	var req struct {
		Username string `json:"username"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if req.Username != "" {
		user.Username = req.Username
	}

	if err := ctrl.db.Save(&user).Error; err != nil {
		utils.InternalError(c, "Failed to update user")
		return
	}

	utils.Success(c, user)
}
