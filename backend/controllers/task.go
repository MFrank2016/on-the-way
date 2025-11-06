package controllers

import (
	"on-the-way/backend/middleware"
	"on-the-way/backend/models"
	"on-the-way/backend/services"
	"on-the-way/backend/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type TaskController struct {
	db *gorm.DB
}

func NewTaskController(db *gorm.DB) *TaskController {
	return &TaskController{db: db}
}

type TaskRequest struct {
	ListID              *uint64  `json:"listId"`
	Title               string   `json:"title" binding:"required"`
	Description         string   `json:"description"`
	Priority            int      `json:"priority"`
	DueDate             string   `json:"dueDate"`             // 格式：20251105
	DueTime             string   `json:"dueTime"`             // 格式：18:20
	ReminderTime        string   `json:"reminderTime"`        // 格式：20251105 18:20
	IsRecurring         bool     `json:"isRecurring"`
	RecurrenceType      string   `json:"recurrenceType"`
	RecurrenceInterval  int      `json:"recurrenceInterval"`
	RecurrenceWeekdays  string   `json:"recurrenceWeekdays"`
	RecurrenceMonthDay  int      `json:"recurrenceMonthDay"`
	RecurrenceLunarDate string   `json:"recurrenceLunarDate"`
	RecurrenceEndDate   string   `json:"recurrenceEndDate"`   // 格式：20251231
	TagIDs              []uint64 `json:"tagIds"`
}

// UpdateTaskRequest 用于更新任务，所有字段都是可选的
type UpdateTaskRequest struct {
	ListID              *uint64  `json:"listId"`
	Title               *string  `json:"title"`
	Description         *string  `json:"description"`
	Priority            *int     `json:"priority"`
	DueDate             *string  `json:"dueDate"`             // 格式：20251105
	DueTime             *string  `json:"dueTime"`             // 格式：18:20
	ReminderTime        *string  `json:"reminderTime"`        // 格式：20251105 18:20
	IsRecurring         *bool    `json:"isRecurring"`
	RecurrenceType      *string  `json:"recurrenceType"`
	RecurrenceInterval  *int     `json:"recurrenceInterval"`
	RecurrenceWeekdays  *string  `json:"recurrenceWeekdays"`
	RecurrenceMonthDay  *int     `json:"recurrenceMonthDay"`
	RecurrenceLunarDate *string  `json:"recurrenceLunarDate"`
	RecurrenceEndDate   *string  `json:"recurrenceEndDate"`   // 格式：20251231
	TagIDs              *[]uint64 `json:"tagIds"`
}

func (ctrl *TaskController) GetTasks(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var tasks []models.Task
	query := ctrl.db.Where("user_id = ?", userID)

	// 根据查询参数筛选
	listType := c.Query("type")
	listIDStr := c.Query("listId")
	status := c.Query("status")

	if listIDStr != "" {
		if listID, err := strconv.ParseUint(listIDStr, 10, 64); err == nil {
			query = query.Where("list_id = ?", listID)
		}
	}

	if status != "" {
		query = query.Where("status = ?", status)
	} else {
		query = query.Where("status = ?", "todo") // 默认只显示未完成
	}

	// 根据类型筛选
	now := time.Now()
	todayStr := now.Format("20060102") // 格式：20251105
	
	switch listType {
	case "today":
		// 今日待办：截止日期 <= 今天（包括已过期的）
		query = query.Where("due_date != '' AND due_date <= ?", todayStr)
	case "tomorrow":
		tomorrowStr := now.AddDate(0, 0, 1).Format("20060102")
		query = query.Where("due_date = ?", tomorrowStr)
	case "week":
		weekLaterStr := now.AddDate(0, 0, 7).Format("20060102")
		query = query.Where("due_date != '' AND due_date <= ?", weekLaterStr)
	}

	query = query.Order("sort_order ASC, created_at DESC").
		Preload("Tags").
		Preload("List")

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
	var listID uint64
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
		UserID:              userID,
		ListID:              listID,
		Title:               req.Title,
		Description:         req.Description,
		Priority:            req.Priority,
		Status:              "todo",
		DueDate:             req.DueDate,
		DueTime:             req.DueTime,
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

	// 关联标签
	if len(req.TagIDs) > 0 {
		var tags []models.Tag
		ctrl.db.Where("id IN ? AND user_id = ?", req.TagIDs, userID).Find(&tags)
		if err := ctrl.db.Model(&task).Association("Tags").Replace(tags); err != nil {
			utils.Logger.Error("Failed to associate tags", zap.Error(err))
		}
	}

	// 重新加载任务以包含关联数据
	ctrl.db.Preload("Tags").Preload("List").First(&task, task.ID)

	utils.Success(c, task)
}

func (ctrl *TaskController) GetTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskIDStr := c.Param("id")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid task ID")
		return
	}

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).
		Preload("Tags").
		Preload("List").
		First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	utils.Success(c, task)
}

func (ctrl *TaskController) UpdateTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskIDStr := c.Param("id")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid task ID")
		return
	}

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	var req UpdateTaskRequest
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

	// 只更新传入的字段
	if req.Title != nil {
		task.Title = *req.Title
	}
	if req.Description != nil {
		task.Description = *req.Description
	}
	if req.Priority != nil {
		task.Priority = *req.Priority
	}
	if req.DueDate != nil {
		task.DueDate = *req.DueDate
	}
	if req.DueTime != nil {
		task.DueTime = *req.DueTime
	}
	if req.ReminderTime != nil {
		task.ReminderTime = *req.ReminderTime
	}
	if req.IsRecurring != nil {
		task.IsRecurring = *req.IsRecurring
	}
	if req.RecurrenceType != nil {
		task.RecurrenceType = *req.RecurrenceType
	}
	if req.RecurrenceInterval != nil {
		task.RecurrenceInterval = *req.RecurrenceInterval
	}
	if req.RecurrenceWeekdays != nil {
		task.RecurrenceWeekdays = *req.RecurrenceWeekdays
	}
	if req.RecurrenceMonthDay != nil {
		task.RecurrenceMonthDay = *req.RecurrenceMonthDay
	}
	if req.RecurrenceLunarDate != nil {
		task.RecurrenceLunarDate = *req.RecurrenceLunarDate
	}
	if req.RecurrenceEndDate != nil {
		task.RecurrenceEndDate = *req.RecurrenceEndDate
	}

	// 如果是重复任务但没有设置间隔，默认为1
	if task.IsRecurring && task.RecurrenceInterval == 0 {
		task.RecurrenceInterval = 1
	}

	if err := ctrl.db.Save(&task).Error; err != nil {
		utils.InternalError(c, "Failed to update task")
		return
	}

	// 更新标签关联（只有传入tagIds时才更新）
	if req.TagIDs != nil {
		var tags []models.Tag
		if len(*req.TagIDs) > 0 {
			ctrl.db.Where("id IN ? AND user_id = ?", *req.TagIDs, userID).Find(&tags)
		}
		if err := ctrl.db.Model(&task).Association("Tags").Replace(tags); err != nil {
			utils.Logger.Error("Failed to update tags", zap.Error(err))
		}
	}

	// 重新加载任务以包含关联数据
	ctrl.db.Preload("Tags").Preload("List").First(&task, task.ID)

	utils.Success(c, task)
}

func (ctrl *TaskController) DeleteTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskIDStr := c.Param("id")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid task ID")
		return
	}

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
	taskIDStr := c.Param("id")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid task ID")
		return
	}

	var task models.Task
	if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		utils.NotFound(c, "Task not found")
		return
	}

	// 切换任务状态
	now := time.Now()
	if task.Status == "completed" {
		// 取消完成 - 从已完成拖回待办
		task.Status = "todo"
		task.CompletedAt = ""
		
		if err := ctrl.db.Save(&task).Error; err != nil {
			utils.InternalError(c, "Failed to uncomplete task")
			return
		}
		
		utils.Success(c, task)
		return
	}

	// 标记为完成 - 从待办拖到已完成
	task.Status = "completed"
	task.CompletedAt = now.Format("20060102 15:04") // 格式：20251105 18:20

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
			// 创建下一个任务（ID由数据库自动生成）
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
	updateDailyStatistics(ctrl.db, userID, now, &task)

	utils.Success(c, task)
}

func (ctrl *TaskController) UpdatePriority(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskIDStr := c.Param("id")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "Invalid task ID")
		return
	}

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

	utils.Success(c, task)
}

// 辅助函数：更新每日统计
func updateDailyStatistics(db *gorm.DB, userID uint64, date time.Time, task *models.Task) {
	// 将日期转换为字符串格式：20251105
	dateStr := date.Format("20060102")

	utils.LogInfo("更新每日统计",
		zap.Uint64("userID", userID),
		zap.String("date", dateStr),
		zap.Uint64("taskID", task.ID),
		zap.String("taskTitle", task.Title))

	// 判断完成类型
	isOnTime := false
	isOverdue := false
	isNoDate := false

	if task.DueDate == "" {
		// 无截止日期
		isNoDate = true
		utils.LogInfo("任务完成类型：无截止日期", zap.Uint64("taskID", task.ID))
	} else if task.CompletedAt != "" {
		// 有截止日期，比较完成日期和截止日期
		completedDateStr := task.CompletedAt[:8] // 取前8位作为日期：20251105
		
		if completedDateStr <= task.DueDate {
			isOnTime = true
			utils.LogInfo("任务完成类型：按时完成",
				zap.Uint64("taskID", task.ID),
				zap.String("completedAt", task.CompletedAt),
				zap.String("dueDate", task.DueDate))
		} else {
			isOverdue = true
			utils.LogInfo("任务完成类型：逾期完成",
				zap.Uint64("taskID", task.ID),
				zap.String("completedAt", task.CompletedAt),
				zap.String("dueDate", task.DueDate))
		}
	}

	// 使用 FirstOrCreate 确保记录存在，然后更新
	var stats models.Statistics
	err := db.Where("user_id = ? AND date = ?", userID, dateStr).
		Attrs(models.Statistics{
			UserID:                userID,
			Date:                  dateStr,
			CompletedTasks:        0,
			OnTimeCompletedTasks:  0,
			OverdueCompletedTasks: 0,
			NoDateCompletedTasks:  0,
			PomodoroCount:         0,
			FocusTime:             0,
		}).
		FirstOrCreate(&stats).Error

	if err != nil {
		utils.LogError("获取或创建统计记录失败", zap.Error(err), zap.Uint64("userID", userID))
		return
	}

	// 更新计数
	stats.CompletedTasks++
	if isOnTime {
		stats.OnTimeCompletedTasks++
	} else if isOverdue {
		stats.OverdueCompletedTasks++
	} else if isNoDate {
		stats.NoDateCompletedTasks++
	}

	// 保存更新
	if err := db.Save(&stats).Error; err != nil {
		utils.LogError("更新统计记录失败", zap.Error(err), zap.Uint64("statsID", stats.ID))
	} else {
		utils.LogInfo("统计记录更新成功",
			zap.Uint64("statsID", stats.ID),
			zap.Int("completedTasks", stats.CompletedTasks),
			zap.Int("onTime", stats.OnTimeCompletedTasks),
			zap.Int("overdue", stats.OverdueCompletedTasks),
			zap.Int("noDate", stats.NoDateCompletedTasks))
	}
}

// ReorderTasks 批量更新任务排序
func (ctrl *TaskController) ReorderTasks(c *gin.Context) {
	userID := middleware.GetUserID(c)

	type ReorderRequest struct {
		TaskIDs []uint64 `json:"taskIds" binding:"required"`
	}

	var req ReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	// 更新每个任务的排序顺序
	for index, taskID := range req.TaskIDs {
		var task models.Task
		if err := ctrl.db.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
			continue // 跳过不存在或不属于当前用户的任务
		}

		task.SortOrder = index
		ctrl.db.Save(&task)
	}

	utils.Success(c, gin.H{"message": "Tasks reordered successfully"})
}
