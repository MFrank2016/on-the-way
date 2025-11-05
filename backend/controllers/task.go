package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/services"
	"on-the-way/backend/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TaskController struct {
	db *gorm.DB
}

func NewTaskController(db *gorm.DB) *TaskController {
	return &TaskController{db: db}
}

type TaskRequest struct {
	ListID              *string    `json:"listId"`
	Title               string     `json:"title" binding:"required"`
	Description         string     `json:"description"`
	Priority            int        `json:"priority"`
	DueDate             *time.Time `json:"dueDate"`
	ReminderTime        *time.Time `json:"reminderTime"`
	IsRecurring         bool       `json:"isRecurring"`
	RecurrenceType      string     `json:"recurrenceType"`
	RecurrenceInterval  int        `json:"recurrenceInterval"`
	RecurrenceWeekdays  string     `json:"recurrenceWeekdays"`
	RecurrenceMonthDay  int        `json:"recurrenceMonthDay"`
	RecurrenceLunarDate string     `json:"recurrenceLunarDate"`
	RecurrenceEndDate   *time.Time `json:"recurrenceEndDate"`
}

func (ctrl *TaskController) GetTasks(c *gin.Context) {
	userID := middleware.GetUserID(c)
	
	var tasks []models.Task
	query := ctrl.db.Where("user_id = ?", userID).Preload("List").Preload("Tags")

	// 根据查询参数筛选
	listType := c.Query("type")
	listID := c.Query("listId")
	status := c.Query("status")

	if listID != "" {
		query = query.Where("list_id = ?", listID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "todo") // 默认只显示未完成
	}

	// 根据类型筛选
	now := time.Now()
	switch listType {
	case "today":
		startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		query = query.Where("due_date >= ? AND due_date < ?", startOfDay, endOfDay)
	case "tomorrow":
		tomorrow := now.AddDate(0, 0, 1)
		startOfDay := time.Date(tomorrow.Year(), tomorrow.Month(), tomorrow.Day(), 0, 0, 0, 0, tomorrow.Location())
		endOfDay := startOfDay.Add(24 * time.Hour)
		query = query.Where("due_date >= ? AND due_date < ?", startOfDay, endOfDay)
	case "week":
		endOfWeek := now.AddDate(0, 0, 7)
		query = query.Where("due_date <= ?", endOfWeek)
	}

	query = query.Order("created_at DESC")

	if err := query.Find(&tasks).Error; err != nil {
		utils.InternalError(c, "Failed to get tasks")
		return
	}

	utils.Success(c, tasks)
}

func (ctrl *TaskController) CreateTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	
	var req TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果没有指定清单，使用默认收集箱
	listID := ""
	if req.ListID != nil {
		listID = *req.ListID
	} else {
		// 查找默认收集箱
		var defaultList models.List
		if err := ctrl.db.Where("user_id = ? AND is_default = ?", userID, true).First(&defaultList).Error; err != nil {
			utils.BadRequest(c, "Default inbox not found. Please specify a list.")
			return
		}
		listID = defaultList.ID
	}

	// 验证清单存在且属于当前用户
	var list models.List
	if err := ctrl.db.Where("id = ? AND user_id = ?", listID, userID).First(&list).Error; err != nil {
		utils.BadRequest(c, "List not found")
		return
	}

	task := models.Task{
		ID:                  uuid.New().String(),
		UserID:              userID,
		ListID:              listID,
		Title:               req.Title,
		Description:         req.Description,
		Priority:            req.Priority,
		Status:              "todo",
		DueDate:             req.DueDate,
		ReminderTime:        req.ReminderTime,
		IsRecurring:         req.IsRecurring,
		RecurrenceType:      req.RecurrenceType,
		RecurrenceInterval:  req.RecurrenceInterval,
		RecurrenceWeekdays:  req.RecurrenceWeekdays,
		RecurrenceMonthDay:  req.RecurrenceMonthDay,
		RecurrenceLunarDate: req.RecurrenceLunarDate,
		RecurrenceEndDate:   req.RecurrenceEndDate,
	}

	// 如果是重复任务但没有设置间隔，默认为1
	if task.IsRecurring && task.RecurrenceInterval == 0 {
		task.RecurrenceInterval = 1
	}

	if err := ctrl.db.Create(&task).Error; err != nil {
		utils.InternalError(c, "Failed to create task")
		return
	}

	// 重新加载关联数据
	ctrl.db.Preload("List").Preload("Tags").First(&task, "id = ?", task.ID)

	utils.Success(c, task)
}

func (ctrl *TaskController) GetTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).
		Preload("List").Preload("Tags").First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	utils.Success(c, task)
}

func (ctrl *TaskController) UpdateTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	var req TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 处理清单ID
	if req.ListID != nil {
		// 验证清单存在且属于当前用户
		var list models.List
		if err := ctrl.db.Where("id = ? AND user_id = ?", *req.ListID, userID).First(&list).Error; err != nil {
			utils.BadRequest(c, "List not found")
			return
		}
		task.ListID = *req.ListID
	}

	task.Title = req.Title
	task.Description = req.Description
	task.Priority = req.Priority
	task.DueDate = req.DueDate
	task.ReminderTime = req.ReminderTime
	task.IsRecurring = req.IsRecurring
	task.RecurrenceType = req.RecurrenceType
	task.RecurrenceInterval = req.RecurrenceInterval
	task.RecurrenceWeekdays = req.RecurrenceWeekdays
	task.RecurrenceMonthDay = req.RecurrenceMonthDay
	task.RecurrenceLunarDate = req.RecurrenceLunarDate
	task.RecurrenceEndDate = req.RecurrenceEndDate

	// 如果是重复任务但没有设置间隔，默认为1
	if task.IsRecurring && task.RecurrenceInterval == 0 {
		task.RecurrenceInterval = 1
	}

	if err := ctrl.db.Save(&task).Error; err != nil {
		utils.InternalError(c, "Failed to update task")
		return
	}

	ctrl.db.Preload("List").Preload("Tags").First(&task, "id = ?", task.ID)
	utils.Success(c, task)
}

func (ctrl *TaskController) DeleteTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	result := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).Delete(&models.Task{})
	if result.Error != nil {
		utils.InternalError(c, "Failed to delete task")
		return
	}

	if result.RowsAffected == 0 {
		utils.NotFound(c, "Task not found")
		return
	}

	utils.Success(c, gin.H{"message": "Task deleted successfully"})
}

func (ctrl *TaskController) CompleteTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	now := time.Now()
	task.Status = "completed"
	task.CompletedAt = &now

	// 开始事务
	tx := ctrl.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 保存完成状态
	if err := tx.Save(&task).Error; err != nil {
		tx.Rollback()
		utils.InternalError(c, "Failed to complete task")
		return
	}

	// 如果是重复任务，生成下一个任务实例
	if task.IsRecurring {
		recurrenceService := services.NewRecurrenceService()
		nextTask, err := recurrenceService.GenerateNextRecurringTask(&task)
		if err != nil {
			// 记录错误但不中断完成操作
			// 可以添加日志记录
		} else if nextTask != nil {
			// 设置新任务的ID
			nextTask.ID = uuid.New().String()
			
			// 创建下一个任务
			if err := tx.Create(nextTask).Error; err != nil {
				// 记录错误但不中断完成操作
				// 可以添加日志记录
			}
		}
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		utils.InternalError(c, "Failed to commit transaction")
		return
	}

	// 更新统计数据
	updateDailyStatistics(ctrl.db, userID, now)

	ctrl.db.Preload("List").Preload("Tags").First(&task, "id = ?", task.ID)
	utils.Success(c, task)
}

func (ctrl *TaskController) UpdatePriority(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID := c.Param("id")

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	var req struct {
		Priority int `json:"priority"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	task.Priority = req.Priority

	if err := ctrl.db.Save(&task).Error; err != nil {
		utils.InternalError(c, "Failed to update priority")
		return
	}

	ctrl.db.Preload("List").Preload("Tags").First(&task, "id = ?", task.ID)
	utils.Success(c, task)
}

// 辅助函数：更新每日统计
func updateDailyStatistics(db *gorm.DB, userID string, date time.Time) {
	dateOnly := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	
	var stats models.Statistics
	err := db.Where("user_id = ? AND date = ?", userID, dateOnly).First(&stats).Error
	
	if err == gorm.ErrRecordNotFound {
		stats = models.Statistics{
			ID:             uuid.New().String(),
			UserID:         userID,
			Date:           dateOnly,
			CompletedTasks: 1,
		}
		db.Create(&stats)
	} else {
		stats.CompletedTasks++
		db.Save(&stats)
	}
}

