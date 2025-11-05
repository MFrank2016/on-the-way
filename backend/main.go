package main

import (
	"log"
	"on-the-way/backend/config"
	"on-the-way/backend/database"
	"on-the-way/backend/middleware"
	"on-the-way/backend/routes"
	"on-the-way/backend/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// 初始化日志系统
	if err := utils.InitLogger(); err != nil {
		log.Fatal("Failed to initialize logger:", err)
	}
	defer utils.Sync()

	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	db, err := database.InitDB(cfg.DatabasePath)
	if err != nil {
		utils.LogFatal("Failed to initialize database", zap.Error(err))
	}

	// 创建Gin实例（不使用默认中间件）
	r := gin.New()

	// 添加 Recovery 中间件
	r.Use(gin.Recovery())

	// 添加自定义日志中间件
	r.Use(middleware.LoggerMiddleware())

	// 配置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3002"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// 注册路由
	routes.RegisterRoutes(r, db)

	// 启动服务器
	utils.LogInfo("Server is running", zap.String("port", cfg.Port))
	if err := r.Run(":" + cfg.Port); err != nil {
		utils.LogFatal("Failed to start server", zap.Error(err))
	}
}

