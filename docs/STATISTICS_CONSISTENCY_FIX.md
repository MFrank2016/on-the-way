# 统计数据一致性修复

## 问题描述

完成6个任务后，发现：
1. **总览标签页**的统计数据有更新
2. **任务标签页**的数据没有变化
3. **已完成分类统计**组件完全没有展示

## 问题分析

### 1. 数据来源不一致

#### 总览标签页（Overview）
- **接口**：`/api/statistics/overview`
- **数据源**：`statistics` 表
- **统计方式**：聚合所有历史数据
```go
var stats []models.Statistics
ctrl.db.Where("user_id = ?", userID).Find(&stats)
for _, stat := range stats {
    completedTasks += int64(stat.CompletedTasks)
}
```

#### 任务标签页（Tasks）
- **概览接口**：`/api/statistics/tasks-overview`
- **分类接口**：`/api/statistics/tasks-by-category`
- **原数据源**：
  - `tasks-overview`：从 `statistics` 表按日期范围聚合
  - `tasks-by-category`：**直接从 `tasks` 表查询**

### 2. 统计口径不一致

**问题核心**：
- `GetTasksOverview` 从 `statistics` 表统计
- `GetTasksByCategory` 从 `tasks` 表查询

这导致两个接口的统计口径不一致，同一个页面上显示的数据来自不同的数据源。

### 3. 日期格式匹配问题

在原 `GetTasksByCategory` 实现中，存在日期格式匹配错误：

```go
// 原代码尝试同时匹配两种格式
startDateCompact := strings.ReplaceAll(startDate, "-", "") + " 00:00"  // 20251107 00:00
endDateCompact := strings.ReplaceAll(endDate, "-", "") + " 23:59"      // 20251107 23:59
startDateTime := startDate + " 00:00:00"                                // 2025-11-07 00:00:00
endDateTime := endDate + " 23:59:59"                                    // 2025-11-07 23:59:59

Where("("+
    "(tasks.completed_at >= ? AND tasks.completed_at <= ?) OR "+  // 新格式匹配
    "(tasks.completed_at >= ? AND tasks.completed_at <= ?)"+        // 旧格式匹配
    ")", startDateCompact, endDateCompact, startDateTime, endDateTime)
```

而 `task.CompletedAt` 的实际格式是：`20251105 18:20`（见 `task.go` 第380行）

这种双重匹配逻辑复杂且容易出错。

## 解决方案

### 统一数据源和统计口径

将 `GetTasksOverview` 和 `GetTasksByCategory` 都改为从 `tasks` 表查询，确保统计口径一致。

#### 为什么选择 `tasks` 表？

1. **`statistics` 表的局限性**：
   - `statistics` 表按日期聚合，没有按清单分类的信息
   - 无法提供任务的详细分类数据

2. **`tasks` 表的优势**：
   - 包含完整的任务信息（清单、标签、完成时间等）
   - 可以灵活地按不同维度统计
   - 实时性更好

### 修复细节

#### 1. 修改 `GetTasksOverview`

**修改前**：从 `statistics` 表聚合
```go
var stats []models.Statistics
ctrl.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate).
    Find(&stats)

for _, stat := range stats {
    totalCompleted += stat.CompletedTasks
    // ...
}
```

**修改后**：从 `tasks` 表查询
```go
var completedTasks []models.Task
ctrl.db.Where("user_id = ? AND status = ?", userID, "completed").
    Where("completed_at >= ? AND completed_at <= ?", startDateCompact, endDateCompact).
    Find(&completedTasks)

for _, task := range completedTasks {
    if task.DueDate == "" {
        noDateCompleted++
    } else if task.CompletedAt != "" {
        completedDateStr := task.CompletedAt[:8]
        if completedDateStr <= task.DueDate {
            onTimeCompleted++
        } else {
            overdueCompleted++
        }
    }
}
```

#### 2. 修改 `GetTasksByCategory`

**修改前**：复杂的双重日期格式匹配
```go
startDateCompact := strings.ReplaceAll(startDate, "-", "") + " 00:00"
endDateCompact := strings.ReplaceAll(endDate, "-", "") + " 23:59"
startDateTime := startDate + " 00:00:00"
endDateTime := endDate + " 23:59:59"

Where("("+
    "(tasks.completed_at >= ? AND tasks.completed_at <= ?) OR "+
    "(tasks.completed_at >= ? AND tasks.completed_at <= ?)"+
    ")", startDateCompact, endDateCompact, startDateTime, endDateTime)
```

**修改后**：统一的日期格式匹配
```go
// completed_at 格式：20251105 18:20
// 匹配范围：20251105 00:00 到 20251105 23:59
startDateCompact := strings.ReplaceAll(startDate, "-", "") + " 00:00"
endDateCompact := strings.ReplaceAll(endDate, "-", "") + " 23:59"

Where("tasks.completed_at >= ? AND tasks.completed_at <= ?", startDateCompact, endDateCompact)
```

#### 3. 新增未完成任务统计

修复后，还增加了未完成任务的统计，使完成率计算更加准确：

```go
// 计算未完成任务数（截止日期在范围内但未完成的）
var incompleteTasks int64
startDateOnly := strings.ReplaceAll(startDate, "-", "")
endDateOnly := strings.ReplaceAll(endDate, "-", "")
ctrl.db.Model(&models.Task{}).
    Where("user_id = ? AND status != ?", userID, "completed").
    Where("due_date >= ? AND due_date <= ?", startDateOnly, endDateOnly).
    Count(&incompleteTasks)

// 计算完成率
totalCount := totalCompleted + int(incompleteTasks)
completionRate := 0.0
if totalCount > 0 {
    completionRate = float64(totalCompleted) / float64(totalCount) * 100.0
}
```

## 影响范围

### 修改的文件
- `backend/controllers/statistics.go`

### 修改的接口
1. `GET /api/statistics/tasks-overview`
   - 数据源：`statistics` 表 → `tasks` 表
   - 增加了 `incompleteCount` 字段
   - 完成率计算逻辑更准确

2. `GET /api/statistics/tasks-by-category`
   - 简化了日期格式匹配逻辑
   - 移除了旧格式的匹配代码

### 前端兼容性
前端代码无需修改，因为返回的数据结构保持一致。

## 数据一致性说明

### 关于 `statistics` 表的作用

`statistics` 表仍然发挥重要作用：
1. **任务完成时实时更新**（见 `task.go` 的 `updateDailyStatistics` 函数）
2. **用于总览标签页的历史趋势图**
3. **用于成就值计算**
4. **用于专注统计**

但对于**任务标签页**的统计，应该直接从 `tasks` 表查询，以便：
- 按不同维度（清单、标签）分类
- 获取实时、详细的任务数据
- 保持统计口径一致

## 测试建议

1. 完成几个任务后，检查：
   - 任务标签页的"概览"卡片是否显示正确的完成数
   - "完成率分布"饼图是否正确显示各类任务数量
   - "已完成分类统计"是否正确展示按清单/标签的分类

2. 切换不同的日期范围（按日/按周/按月），验证数据是否正确

3. 验证"完成率"计算是否准确（已完成 / (已完成 + 未完成)）

## 总结

此次修复解决了任务统计页面数据不一致的问题，核心原因是**两个接口使用了不同的数据源**。修复后：
- ✅ 统计口径统一（都从 `tasks` 表查询）
- ✅ 日期格式匹配简化且准确
- ✅ 增加了未完成任务统计
- ✅ 完成率计算更准确
- ✅ 代码更清晰易维护

