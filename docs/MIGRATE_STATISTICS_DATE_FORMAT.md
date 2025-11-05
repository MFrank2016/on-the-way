# Statistics 表日期格式迁移指南

## 修改说明

将 `statistics` 表的 `date` 字段从 `time.Time` 类型改为 `string` 类型，存储格式从 `2025-11-05` 改为 `20251105`，以便更高效地查询和比较日期。

## 数据库迁移

### 方式一：自动迁移（推荐）

如果您的数据不多，可以让 GORM 自动处理迁移：

1. **备份现有数据**（重要！）
   ```sql
   -- 导出现有数据
   SELECT * FROM statistics;
   ```

2. **删除旧表并重新创建**
   - 启动后端服务，GORM 会自动根据新的模型定义重新创建表
   - 字段类型从 `date` 变为 `varchar(20)`

3. **如果有历史数据需要保留**，请使用方式二

### 方式二：手动迁移（保留数据）

#### SQLite 数据库

```sql
-- 1. 创建新表
CREATE TABLE statistics_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date VARCHAR(20) NOT NULL,
    completed_tasks INTEGER DEFAULT 0,
    on_time_completed_tasks INTEGER DEFAULT 0,
    overdue_completed_tasks INTEGER DEFAULT 0,
    no_date_completed_tasks INTEGER DEFAULT 0,
    pomodoro_count INTEGER DEFAULT 0,
    focus_time INTEGER DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME
);

-- 2. 迁移数据（将日期格式从 2025-11-05 转换为 20251105）
INSERT INTO statistics_new (
    id, user_id, date, 
    completed_tasks, on_time_completed_tasks, overdue_completed_tasks, no_date_completed_tasks,
    pomodoro_count, focus_time,
    created_at, updated_at, deleted_at
)
SELECT 
    id, user_id, 
    REPLACE(date, '-', '') as date,  -- 将 2025-11-05 转换为 20251105
    completed_tasks, on_time_completed_tasks, overdue_completed_tasks, no_date_completed_tasks,
    pomodoro_count, focus_time,
    created_at, updated_at, deleted_at
FROM statistics;

-- 3. 删除旧表
DROP TABLE statistics;

-- 4. 重命名新表
ALTER TABLE statistics_new RENAME TO statistics;

-- 5. 重新创建索引
CREATE UNIQUE INDEX idx_user_date ON statistics(user_id, date);
CREATE INDEX idx_date_range ON statistics(date);
```

#### MySQL 数据库

```sql
-- 1. 备份表
CREATE TABLE statistics_backup AS SELECT * FROM statistics;

-- 2. 修改字段类型并更新数据
-- 注意：MySQL 可以在同一语句中修改字段类型和更新数据
ALTER TABLE statistics 
MODIFY COLUMN date VARCHAR(20) NOT NULL;

-- 3. 更新日期格式
UPDATE statistics 
SET date = DATE_FORMAT(STR_TO_DATE(date, '%Y-%m-%d'), '%Y%m%d');

-- 4. 验证数据
SELECT * FROM statistics LIMIT 10;

-- 5. 如果一切正常，删除备份
-- DROP TABLE statistics_backup;
```

#### PostgreSQL 数据库

```sql
-- 1. 备份表
CREATE TABLE statistics_backup AS SELECT * FROM statistics;

-- 2. 添加新列
ALTER TABLE statistics ADD COLUMN date_new VARCHAR(20);

-- 3. 转换数据格式
UPDATE statistics 
SET date_new = TO_CHAR(date, 'YYYYMMDD');

-- 4. 删除旧列
ALTER TABLE statistics DROP COLUMN date;

-- 5. 重命名新列
ALTER TABLE statistics RENAME COLUMN date_new TO date;

-- 6. 设置 NOT NULL 约束
ALTER TABLE statistics ALTER COLUMN date SET NOT NULL;

-- 7. 重新创建索引
DROP INDEX IF EXISTS idx_user_date;
DROP INDEX IF EXISTS idx_date_range;
CREATE UNIQUE INDEX idx_user_date ON statistics(user_id, date);
CREATE INDEX idx_date_range ON statistics(date);

-- 8. 验证数据
SELECT * FROM statistics LIMIT 10;

-- 9. 如果一切正常，删除备份
-- DROP TABLE statistics_backup;
```

## 代码修改说明

### 1. 模型定义（models/statistics.go）

```go
// 修改前
Date time.Time `json:"date" gorm:"type:date;not null;..."`

// 修改后
Date string `json:"date" gorm:"type:varchar(20);not null;..."` // 格式：20251105
```

### 2. 创建/更新记录

所有创建或更新 statistics 记录的地方，日期格式改为：

```go
// 修改前
dateOnly := utils.BeginningOfDay(date)
stats.Date = dateOnly

// 修改后
dateStr := date.Format("20060102")
stats.Date = dateStr
```

### 3. 查询记录

所有查询 statistics 记录的地方，日期比较改为：

```go
// 修改前
s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDate, endDate)

// 修改后
startDateStr := startDate.Format("20060102")
endDateStr := endDate.Format("20060102")
s.db.Where("user_id = ? AND date >= ? AND date <= ?", userID, startDateStr, endDateStr)
```

### 4. 日期比较

字符串格式的日期可以直接进行字符串比较：

```go
// 20251105 格式可以直接比较大小
if stat.Date >= "20251101" && stat.Date <= "20251130" {
    // 2025年11月的数据
}
```

### 5. 返回给前端的日期格式

在需要返回给前端时，将 `20251105` 转换为 `2025-11-05`：

```go
// 方式一：使用字符串切片
dateStr := "20251105"
formattedDate := dateStr[0:4] + "-" + dateStr[4:6] + "-" + dateStr[6:8]
// 结果：2025-11-05

// 方式二：解析后格式化
t, _ := time.Parse("20060102", dateStr)
formattedDate := t.Format("2006-01-02")
```

## 修改的文件列表

1. **backend/models/statistics.go** - 修改 Date 字段类型
2. **backend/controllers/task.go** - updateDailyStatistics 函数
3. **backend/controllers/pomodoro.go** - 更新统计数据的代码
4. **backend/controllers/statistics.go** - 所有查询和返回统计数据的函数
5. **backend/services/statistics_service.go** - 所有统计服务函数

## 优势

### 1. 查询性能提升
- 字符串比较比日期类型转换更快
- 直接使用字符串索引，不需要日期函数转换

### 2. 代码简化
```go
// 修改前：需要时间比较
if !stat.Date.Before(startDate) && !stat.Date.After(endDate) {
    // ...
}

// 修改后：直接字符串比较
if stat.Date >= startDateStr && stat.Date <= endDateStr {
    // ...
}
```

### 3. 存储优化
- `varchar(20)` 只需要 8 字节（实际存储 8 个字符 + 长度）
- 原 `date` 类型在某些数据库中需要更多存储空间

### 4. 跨数据库兼容性
- 字符串类型在所有数据库中行为一致
- 避免不同数据库对日期类型的处理差异

## 注意事项

1. **迁移前务必备份数据**
2. **测试环境先验证**：在测试环境中先执行迁移，确保没有问题
3. **索引重建**：迁移后记得重新创建索引
4. **数据验证**：迁移后验证数据是否正确转换
5. **日期格式**：确保所有日期都是 8 位数字格式 `YYYYMMDD`

## 回滚方案

如果需要回滚到原来的日期格式：

```sql
-- 将 20251105 转换回 2025-11-05
UPDATE statistics 
SET date = SUBSTR(date, 1, 4) || '-' || SUBSTR(date, 5, 2) || '-' || SUBSTR(date, 7, 2);

-- 修改字段类型回 DATE
ALTER TABLE statistics MODIFY COLUMN date DATE;
```

## 测试建议

1. **单元测试**：测试日期格式转换逻辑
2. **集成测试**：测试完整的统计数据流程
3. **性能测试**：对比修改前后的查询性能
4. **边界测试**：测试月末、年末等边界日期

## 日期

2025-11-05

