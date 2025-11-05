# 统计数据一致性修复

## 问题描述

统计总览（Overview Tab）显示的任务数与任务概览（Tasks Tab）中的任务数对不上。

### 问题分析

两个视图使用了不同的数据源和统计方法：

| 视图 | API 接口 | 数据来源 | 统计范围 | 原实现 |
|------|----------|----------|----------|--------|
| 统计总览 | `/statistics/overview` | `tasks` 表 | 所有时间累计 | 直接查询 tasks 表 |
| 任务概览 | `/statistics/tasks-overview` | `statistics` 表 | 指定日期范围 | 聚合 statistics 表 |

### 数据不一致的原因

1. **统计总览**：从 `tasks` 表直接查询已完成的任务数，这是实时的、准确的任务状态
2. **任务概览**：从 `statistics` 表聚合指定日期范围的数据，这是按日记录的增量统计数据

`statistics` 表是在任务完成时记录的，每条记录代表某一天完成的任务数。如果选择"今天"作为查询范围，而今天没有完成任务，则显示为 0。

## 修复方案

### 核心原则
**统一数据源**：让所有统计数据都从 `statistics` 表获取，确保数据来源一致性。

### 修改内容

修改了 `backend/controllers/statistics.go` 中的 `GetOverview` 函数：

#### 1. 已完成任务数
**修改前**：
```go
// 从 tasks 表直接查询
var completedTasks int64
ctrl.db.Model(&models.Task{}).Where("user_id = ? AND status = ?", userID, "completed").Count(&completedTasks)
```

**修改后**：
```go
// 从 statistics 表聚合累计数据
var stats []models.Statistics
ctrl.db.Where("user_id = ?", userID).Find(&stats)

var completedTasks int64 = 0
for _, stat := range stats {
    completedTasks += int64(stat.CompletedTasks)
}
```

#### 2. 今日统计
**修改前**：
```go
// 从 tasks 表查询今天完成的任务
var todayCompleted int64
ctrl.db.Model(&models.Task{}).
    Where("user_id = ? AND status = ? AND completed_at >= ? AND completed_at < ?", 
          userID, "completed", startOfDay, endOfDay).
    Count(&todayCompleted)
```

**修改后**：
```go
// 从 statistics 表查询当天数据
var todayStats models.Statistics
var todayCompleted int64 = 0

err = ctrl.db.Where("user_id = ? AND date = ?", userID, startOfDay).First(&todayStats).Error
if err == nil {
    todayCompleted = int64(todayStats.CompletedTasks)
}
```

#### 3. 番茄钟和专注时长统计
**修改前**：
```go
// 从 pomodoro 表直接查询
var totalPomodoros int64
ctrl.db.Model(&models.Pomodoro{}).Where("user_id = ?", userID).Count(&totalPomodoros)

var totalFocusTime int
ctrl.db.Model(&models.Pomodoro{}).
    Where("user_id = ? AND end_time IS NOT NULL", userID).
    Select("COALESCE(SUM(duration), 0)").
    Scan(&totalFocusTime)
```

**修改后**：
```go
// 从 statistics 表聚合累计数据
var totalPomodoros int64 = 0
var totalFocusTime int = 0

for _, stat := range stats {
    totalPomodoros += int64(stat.PomodoroCount)
    totalFocusTime += stat.FocusTime
}
```

### 保持不变的部分

以下数据仍从原表查询，因为它们不在 `statistics` 表中记录：

1. **总任务数** (`totalTasks`)：仍从 `tasks` 表查询，因为需要包含未完成的任务
2. **清单数** (`totalLists`)：从 `lists` 表查询
3. **使用天数** (`usageDays`)：根据第一个任务的创建时间计算
4. **连续打卡天数** (`streakDays`)：通过 service 计算
5. **成就值** (`achievementScore`)：已经是从 `statistics` 表聚合
6. **本周打卡进展** (`weeklyCheckIn`)：通过 service 计算

## 修复效果

修复后，两个视图的数据将保持一致：

1. **统计总览**显示的已完成任务数 = `statistics` 表中所有记录的 `CompletedTasks` 之和
2. **任务概览**显示的已完成任务数 = `statistics` 表中指定日期范围内的 `CompletedTasks` 之和

当任务概览选择"全部时间"作为查询范围时，两者将显示完全相同的数字。

## 重要说明

### Statistics 表的数据记录机制

`statistics` 表是在任务完成时自动更新的，相关代码在 `backend/controllers/task.go` 的 `updateDailyStatistics` 函数中：

```go
func updateDailyStatistics(db *gorm.DB, userID uint64, date time.Time, task *models.Task) {
    dateOnly := utils.BeginningOfDay(date)
    
    // 获取或创建当天的统计记录
    var stats models.Statistics
    err := db.Where("user_id = ? AND date = ?", userID, dateOnly).
        FirstOrCreate(&stats).Error
    
    // 更新完成任务数
    stats.CompletedTasks++
    // ... 更新其他字段
    
    db.Save(&stats)
}
```

这确保了每次任务完成时，都会在 `statistics` 表中记录相应的统计数据。

### 数据一致性保证

- 所有完成任务的统计数据都通过 `statistics` 表
- 避免了从不同表查询可能导致的数据不一致
- 提高了查询性能（无需实时统计，直接聚合预先计算的数据）

## 测试建议

1. 重启后端服务以应用更改
2. 刷新前端页面
3. 对比统计总览和任务概览的数据
4. 在任务概览中选择不同的日期范围，验证数据正确性
5. 完成一个新任务，验证统计数据是否正确更新

## 文件变更

- `backend/controllers/statistics.go` - 修改 `GetOverview` 函数的数据查询逻辑

## 日期

2025-11-05

