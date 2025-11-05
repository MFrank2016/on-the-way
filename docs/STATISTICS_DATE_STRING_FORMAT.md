# Statistics 表日期字段改为字符串格式 - 修改总结

## 修改概述

将 `statistics` 表的 `date` 字段从 `time.Time` 类型改为 `string` 类型，存储格式从数据库的日期类型（如 `2025-11-05`）改为字符串 `20251105`，以便更高效地查询和比较。

## 修改完成情况 ✅

- ✅ 修改 models/statistics.go 的 Date 字段类型为 string
- ✅ 修改创建和更新统计记录的代码（task.go 中的 updateDailyStatistics）
- ✅ 修改查询统计记录的代码（statistics.go 中的所有查询）
- ✅ 修改 services/statistics_service.go 中的相关代码
- ✅ 修改 pomodoro.go 中更新统计的代码
- ✅ 编译测试确保没有错误

## 文件修改清单

### 1. backend/models/statistics.go

**修改内容**：
- 将 `Date` 字段类型从 `time.Time` 改为 `string`
- 数据库类型从 `date` 改为 `varchar(20)`
- 添加注释说明格式：`// 格式：20251105`

```go
// 修改后
Date string `json:"date" gorm:"type:varchar(20);not null;uniqueIndex:idx_user_date;index:idx_date_range"` // 格式：20251105
```

### 2. backend/controllers/task.go

**修改内容**：
- `updateDailyStatistics` 函数中，将日期转换为字符串格式

**关键修改**：
```go
// 修改前
dateOnly := utils.BeginningOfDay(date)
err := db.Where("user_id = ? AND date = ?", userID, dateOnly)...

// 修改后
dateStr := date.Format("20060102")
err := db.Where("user_id = ? AND date = ?", userID, dateStr)...
```

### 3. backend/controllers/pomodoro.go

**修改内容**：
- 更新番茄钟统计时，使用字符串格式的日期

**关键修改**：
```go
// 修改前
dateOnly := utils.BeginningOfDay(now)
err = ctrl.db.Where("user_id = ? AND date = ?", userID, dateOnly)...

// 修改后
dateStr := now.Format("20060102")
err = ctrl.db.Where("user_id = ? AND date = ?", userID, dateStr)...
```

### 4. backend/controllers/statistics.go

**修改内容**：
- 添加 `strings` 包导入
- 修改所有查询统计数据的函数

**主要修改的函数**：
1. **GetOverview** - 查询今日统计
   ```go
   todayStr := utils.Now().Format("20060102")
   err = ctrl.db.Where("user_id = ? AND date = ?", userID, todayStr).First(&todayStats).Error
   ```

2. **GetDaily** - 获取每日统计
   ```go
   startDateStr := utils.DaysAgo(30).Format("20060102")
   ctrl.db.Where("user_id = ? AND date >= ?", userID, startDateStr)...
   ```

3. **GetHeatmap** - 获取热力图数据
   ```go
   startDateStr := year + "0101"  // 20250101
   endDateStr := year + "1231"    // 20251231
   ctrl.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDateStr, endDateStr)...
   
   // 返回给前端时转换格式
   dateStr := stat.Date
   formattedDate := dateStr[0:4] + "-" + dateStr[4:6] + "-" + dateStr[6:8]
   ```

4. **GetTasksOverview** - 获取任务统计概览
   ```go
   // 接收前端的 2025-11-05 格式，转换为 20251105
   startDate = strings.ReplaceAll(startDate, "-", "")
   endDate = strings.ReplaceAll(endDate, "-", "")
   ```

### 5. backend/services/statistics_service.go

**修改内容**：
- 修改所有统计服务函数的日期处理逻辑

**主要修改的函数**：

1. **CalculateStreakDays** - 计算连续打卡天数
   ```go
   dateStr := currentDate.Format("20060102")
   s.db.Model(&models.Statistics{}).
       Where("user_id = ? AND date = ?", userID, dateStr)...
   ```

2. **GetWeeklyCheckIn** - 获取本周打卡进展
   ```go
   dateStr := currentDate.Format("20060102")
   s.db.Model(&models.Statistics{}).
       Where("user_id = ? AND date = ?", userID, dateStr)...
   ```

3. **GetDailyData** - 获取按日统计
   ```go
   startDateStr := startDate.Format("20060102")
   endDateStr := endDate.Format("20060102")
   s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDateStr, endDateStr)...
   
   // 创建映射和结果时使用字符串
   dateMap[stat.Date] = stat
   dateKey := date.Format("20060102")
   ```

4. **GetWeeklyData** - 获取按周统计
   ```go
   // 日期比较从 time.Time 改为字符串比较
   if stat.Date >= weekStartDateStr && stat.Date <= weekEndDateStr {
       // 聚合数据
   }
   ```

5. **GetMonthlyData** - 获取按月统计
   ```go
   monthStartStr := monthStart.Format("20060102")
   monthEndStr := monthEnd.Format("20060102")
   if stat.Date >= monthStartStr && stat.Date <= monthEndStr {
       // 聚合数据
   }
   ```

6. **GetAchievementDailyData** - 获取按日成就值
   ```go
   startDateStr := startDate.Format("20060102")
   tomorrowStr := tomorrow.Format("20060102")
   
   // 返回给前端时转换格式
   formattedDate := dateKey[0:4] + "-" + dateKey[4:6] + "-" + dateKey[6:8]
   ```

7. **GetAchievementWeeklyData** - 获取按周成就值
8. **GetAchievementMonthlyData** - 获取按月成就值

## 技术优势

### 1. 查询性能提升
- **字符串比较**：`"20251105" >= "20251101"` 直接比较，无需类型转换
- **索引效率**：字符串索引在范围查询时更高效
- **无需日期函数**：避免数据库日期函数的开销

### 2. 代码简化
```go
// 修改前：time.Time 比较
if !stat.Date.Before(startDate) && !stat.Date.After(endDate) {
    // ...
}

// 修改后：字符串比较
if stat.Date >= startDateStr && stat.Date <= endDateStr {
    // ...
}
```

### 3. 跨数据库兼容性
- 字符串类型在所有数据库（SQLite、MySQL、PostgreSQL）中行为一致
- 避免不同数据库对日期类型的处理差异

### 4. 易于调试
- 日期直接显示为 `20251105`，易于阅读和调试
- 日志中直接看到具体日期值

## 日期格式约定

### 存储格式
- **内部存储**：`20251105`（8位数字字符串）
- **数据库类型**：`varchar(20)`

### 转换方法
```go
// 1. time.Time 转 字符串
dateStr := time.Now().Format("20060102")  // 20251105

// 2. 字符串 转 time.Time
t, err := time.Parse("20060102", "20251105")

// 3. 字符串 转 前端格式
dateStr := "20251105"
formatted := dateStr[0:4] + "-" + dateStr[4:6] + "-" + dateStr[6:8]  // 2025-11-05

// 4. 前端格式 转 字符串
dateStr := strings.ReplaceAll("2025-11-05", "-", "")  // 20251105
```

## 数据库迁移

详细的数据库迁移步骤请参考：[MIGRATE_STATISTICS_DATE_FORMAT.md](./MIGRATE_STATISTICS_DATE_FORMAT.md)

**简要步骤**：
1. 备份现有数据
2. 修改表结构（将 date 字段改为 varchar(20)）
3. 更新数据格式（将 `2025-11-05` 转换为 `20251105`）
4. 重建索引
5. 验证数据

## 测试验证

### 编译测试 ✅
```bash
cd backend
go build -o on-the-way.exe
# 编译成功，无任何错误
```

### 静态检查 ✅
- 无 linter 错误
- 无类型不匹配
- 无未使用的导入

### 建议的功能测试
1. **创建任务并完成** - 验证统计记录创建
2. **完成番茄钟** - 验证番茄钟统计更新
3. **查看统计总览** - 验证今日/累计统计
4. **查看任务统计** - 验证不同日期范围的统计
5. **查看热力图** - 验证年度数据查询
6. **查看成就值趋势** - 验证日/周/月趋势图

## 注意事项

### 1. 数据迁移
- ⚠️ **必须先迁移数据库**，否则会导致数据不匹配
- ⚠️ **迁移前务必备份**

### 2. 日期格式一致性
- 所有写入必须使用 `date.Format("20060102")`
- 禁止手动拼接日期字符串
- 确保格式始终为 8 位数字

### 3. 前后端交互
- 后端内部使用 `20251105` 格式
- 返回给前端时转换为 `2025-11-05` 格式
- 接收前端数据时转换回 `20251105` 格式

## 相关文档

- [数据库迁移指南](./MIGRATE_STATISTICS_DATE_FORMAT.md) - 详细的数据库迁移步骤
- [统计数据一致性修复](./FIX_STATISTICS_CONSISTENCY.md) - 之前的统计数据修复

## 后续优化建议

1. **添加日期验证**：在创建/更新统计时验证日期格式
2. **封装日期转换**：创建统一的日期格式转换工具函数
3. **性能监控**：对比修改前后的查询性能
4. **单元测试**：为日期格式转换添加单元测试

## 日期

2025-11-05

## 贡献者

- AI Assistant (Claude)

