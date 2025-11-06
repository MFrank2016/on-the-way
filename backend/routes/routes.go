package routes

import (
	"on-the-way/backend/controllers"
	"on-the-way/backend/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine, db *gorm.DB) {
	api := r.Group("/api")

	// 初始化controllers
	authController := controllers.NewAuthController(db)
	folderController := controllers.NewFolderController(db)
	taskController := controllers.NewTaskController(db)
	listController := controllers.NewListController(db)
	pomodoroController := controllers.NewPomodoroController(db)
	habitController := controllers.NewHabitController(db)
	countdownController := controllers.NewCountdownController(db)
	statisticsController := controllers.NewStatisticsController(db)
	searchController := controllers.NewSearchController(db)
	reminderController := controllers.NewReminderController(db)
	settingsController := controllers.NewUserSettingsController(db)
	tagController := controllers.NewTagController(db)
	filterController := controllers.NewFilterController(db)

	// 认证路由 (不需要JWT)
	auth := api.Group("/auth")
	{
		auth.POST("/register", authController.Register)
		auth.POST("/login", authController.Login)
	}

	// 需要认证的路由
	authorized := api.Group("")
	authorized.Use(middleware.AuthMiddleware())
	{
		// 用户相关
		authorized.POST("/auth/logout", authController.Logout)
		authorized.GET("/auth/profile", authController.GetProfile)
		authorized.PUT("/auth/profile", authController.UpdateProfile)

		// 任务相关
		authorized.GET("/tasks", taskController.GetTasks)
		authorized.POST("/tasks", taskController.CreateTask)
		authorized.GET("/tasks/:id", taskController.GetTask)
		authorized.PUT("/tasks/:id", taskController.UpdateTask)
		authorized.DELETE("/tasks/:id", taskController.DeleteTask)
		authorized.PUT("/tasks/:id/complete", taskController.CompleteTask)
		authorized.PUT("/tasks/:id/priority", taskController.UpdatePriority)
		authorized.PUT("/tasks/reorder", taskController.ReorderTasks)

		// 文件夹相关
		authorized.GET("/folders", folderController.GetFolders)
		authorized.POST("/folders", folderController.CreateFolder)
		authorized.GET("/folders/:id", folderController.GetFolder)
		authorized.PUT("/folders/:id", folderController.UpdateFolder)
		authorized.DELETE("/folders/:id", folderController.DeleteFolder)
		authorized.PUT("/folders/:id/move", folderController.MoveFolder)
		authorized.PUT("/folders/:id/toggle", folderController.ToggleExpand)

		// 清单相关
		authorized.GET("/lists", listController.GetLists)
		authorized.POST("/lists", listController.CreateList)
		authorized.PUT("/lists/:id", listController.UpdateList)
		authorized.DELETE("/lists/:id", listController.DeleteList)
		authorized.PUT("/lists/:id/move", listController.MoveList)

		// 番茄时钟相关
		authorized.POST("/pomodoros", pomodoroController.Start)
		authorized.PUT("/pomodoros/:id", pomodoroController.End)
		authorized.GET("/pomodoros", pomodoroController.GetPomodoros)
		authorized.GET("/pomodoros/today", pomodoroController.GetTodayStats)

		// 习惯相关
		authorized.GET("/habits", habitController.GetHabits)
		authorized.GET("/habits/today", habitController.GetTodayHabits)
		authorized.POST("/habits", habitController.CreateHabit)
		authorized.PUT("/habits/:id", habitController.UpdateHabit)
		authorized.DELETE("/habits/:id", habitController.DeleteHabit)
		authorized.POST("/habits/:id/check", habitController.CheckIn)
		authorized.DELETE("/habits/:id/check", habitController.CancelCheckIn)
		authorized.GET("/habits/:id/records", habitController.GetRecords)

		// 倒数日相关
		authorized.GET("/countdowns", countdownController.GetCountdowns)
		authorized.POST("/countdowns", countdownController.CreateCountdown)
		authorized.PUT("/countdowns/:id", countdownController.UpdateCountdown)
		authorized.DELETE("/countdowns/:id", countdownController.DeleteCountdown)

		// 统计相关
		authorized.GET("/statistics/overview", statisticsController.GetOverview)
		authorized.GET("/statistics/daily", statisticsController.GetDaily)
		authorized.GET("/statistics/trends", statisticsController.GetTrends)
		authorized.GET("/statistics/focus", statisticsController.GetFocus)
		authorized.GET("/statistics/focus-trends", statisticsController.GetFocusTrends)
		authorized.GET("/statistics/achievement-trends", statisticsController.GetAchievementTrends)
		authorized.GET("/statistics/heatmap", statisticsController.GetHeatmap)
		authorized.GET("/statistics/tasks-overview", statisticsController.GetTasksOverview)
		authorized.GET("/statistics/tasks-by-category", statisticsController.GetTasksByCategory)

		// 搜索
		authorized.GET("/search", searchController.Search)

		// 提醒相关
		authorized.GET("/reminders/active", reminderController.GetActiveReminders)
		authorized.PUT("/reminders/:id/sent", reminderController.MarkReminderSent)
		authorized.PUT("/reminders/:id/snooze", reminderController.SnoozeReminder)
		authorized.DELETE("/reminders/:id", reminderController.DeleteReminder)

		// 用户设置
		authorized.GET("/settings", settingsController.GetSettings)
		authorized.PUT("/settings", settingsController.UpdateSettings)

		// 标签相关
		authorized.GET("/tags", tagController.GetTags)
		authorized.POST("/tags", tagController.CreateTag)
		authorized.PUT("/tags/:id", tagController.UpdateTag)
		authorized.DELETE("/tags/:id", tagController.DeleteTag)
		authorized.PUT("/tags/:id/move", tagController.MoveTag)
		authorized.PUT("/tags/:id/toggle-pin", tagController.TogglePin)
		authorized.GET("/tags/:id/tasks", tagController.GetTasksByTag)

		// 过滤器相关
		authorized.GET("/filters", filterController.GetFilters)
		authorized.POST("/filters", filterController.CreateFilter)
		authorized.PUT("/filters/:id", filterController.UpdateFilter)
		authorized.DELETE("/filters/:id", filterController.DeleteFilter)
		authorized.PUT("/filters/:id/toggle-pin", filterController.TogglePin)
		authorized.PUT("/filters/reorder", filterController.ReorderFilters)
	}
}
