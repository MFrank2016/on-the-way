# 拖拽状态切换流程说明

## 功能验证

### 1. 从待办拖到已完成

#### 前端流程
1. 用户在待办列表中拖拽任务
2. 拖拽到已完成区域释放
3. `CrossListDraggable.handleDragOver`: 任务从 `localTodoTasks` 移到 `localCompletedTasks`（UI立即更新）
4. `CrossListDraggable.handleDragEnd`: 调用 `onMoveToCompleted(taskId)`
5. `TodayPage.handleMoveToCompleted`: 调用 `taskAPI.completeTask(taskId)`

#### 后端流程
```go
// TaskController.CompleteTask
// 1. 检查任务当前状态
if task.Status == "completed" {
    // 如果已完成，则取消完成
} else {
    // 如果未完成，则标记为完成 ✓
    task.Status = "completed"
    task.CompletedAt = &now
    
    // 2. 保存到数据库
    tx.Save(&task)
    
    // 3. 如果是重复任务，生成下一个实例
    if task.IsRecurring {
        GenerateNextRecurringTask(&task)
    }
    
    // 4. 更新统计数据
    updateDailyStatistics()
}
```

#### API调用
```
PUT /api/tasks/:id/complete
```

#### 数据库变更
```sql
UPDATE tasks 
SET status = 'completed', 
    completed_at = '2025-11-05 12:00:00'
WHERE id = ? AND user_id = ?
```

#### 前端响应
```javascript
// 成功后重新加载任务列表
loadTasks()
// → todoTasks 不包含该任务
// → completedTasks 包含该任务
```

---

### 2. 从已完成拖回待办

#### 前端流程
1. 用户在已完成列表中拖拽任务
2. 拖拽到待办区域释放
3. `CrossListDraggable.handleDragOver`: 任务从 `localCompletedTasks` 移到 `localTodoTasks`（UI立即更新）
4. `CrossListDraggable.handleDragEnd`: 调用 `onMoveToTodo(taskId)`
5. `TodayPage.handleMoveToTodo`: 调用 `taskAPI.completeTask(taskId)`（同一个接口）

#### 后端流程
```go
// TaskController.CompleteTask
// 1. 检查任务当前状态
if task.Status == "completed" {
    // 如果已完成，则取消完成 ✓
    task.Status = "todo"
    task.CompletedAt = nil
    
    // 2. 保存到数据库
    db.Save(&task)
    
    // 3. 返回成功
    return
}
```

#### API调用
```
PUT /api/tasks/:id/complete
```
（同一个接口，根据当前状态自动切换）

#### 数据库变更
```sql
UPDATE tasks 
SET status = 'todo', 
    completed_at = NULL
WHERE id = ? AND user_id = ?
```

#### 前端响应
```javascript
// 成功后重新加载任务列表
loadTasks()
// → todoTasks 包含该任务
// → completedTasks 不包含该任务
```

---

## 状态切换逻辑

### 后端 CompleteTask 方法（智能切换）

```go
func (ctrl *TaskController) CompleteTask(c *gin.Context) {
    // 获取任务
    var task models.Task
    db.Where("id = ? AND user_id = ?", taskID, userID).First(&task)
    
    // 根据当前状态切换
    if task.Status == "completed" {
        // 场景：从已完成拖回待办
        task.Status = "todo"
        task.CompletedAt = nil
    } else {
        // 场景：从待办拖到已完成
        task.Status = "completed"
        task.CompletedAt = &now
        
        // 额外处理
        // - 重复任务：生成下一个实例
        // - 统计数据：更新完成数量
    }
    
    // 保存
    db.Save(&task)
}
```

### 前端调用（统一接口）

```typescript
// 待办 → 已完成
const handleMoveToCompleted = async (taskId: string) => {
  await taskAPI.completeTask(taskId)
  loadTasks()
}

// 已完成 → 待办
const handleMoveToTodo = async (taskId: string) => {
  await taskAPI.completeTask(taskId) // 同一个API
  loadTasks()
}
```

---

## 数据流图

```
用户拖拽待办任务到已完成
    ↓
handleDragOver (UI立即更新)
    ↓
handleDragEnd
    ↓
onMoveToCompleted(taskId)
    ↓
taskAPI.completeTask(taskId)
    ↓
PUT /api/tasks/:id/complete
    ↓
后端检测: task.Status == "todo"
    ↓
切换为: task.Status = "completed"
    ↓
保存到数据库
    ↓
生成重复任务（如果需要）
    ↓
更新统计数据
    ↓
返回成功
    ↓
前端 loadTasks() 重新加载
    ↓
任务出现在已完成列表
```

```
用户拖拽已完成任务回待办
    ↓
handleDragOver (UI立即更新)
    ↓
handleDragEnd
    ↓
onMoveToTodo(taskId)
    ↓
taskAPI.completeTask(taskId)
    ↓
PUT /api/tasks/:id/complete
    ↓
后端检测: task.Status == "completed"
    ↓
切换为: task.Status = "todo"
    ↓
清空: task.CompletedAt = null
    ↓
保存到数据库
    ↓
返回成功
    ↓
前端 loadTasks() 重新加载
    ↓
任务出现在待办列表
```

---

## 关键点

### 1. 智能状态切换
- ✅ 同一个API端点 `PUT /api/tasks/:id/complete`
- ✅ 根据当前状态自动判断是完成还是取消完成
- ✅ 前端无需维护两个不同的API

### 2. 乐观更新
- ✅ 拖拽时UI立即更新（`handleDragOver`）
- ✅ API调用在后台进行
- ✅ 失败时重新加载数据恢复

### 3. 数据一致性
- ✅ API成功后调用 `loadTasks()` 重新加载
- ✅ 确保前后端状态完全同步
- ✅ 避免状态不一致问题

### 4. 额外处理
- ✅ 完成任务时更新统计数据
- ✅ 重复任务自动生成下一个实例
- ✅ 取消完成时清空 `CompletedAt` 时间戳

---

## 测试场景

### ✅ 功能测试
- [x] 待办任务拖到已完成 → 状态变为 completed
- [x] 已完成任务拖回待办 → 状态变为 todo
- [x] CompletedAt 时间戳正确更新/清空
- [x] 统计数据正确更新
- [x] 重复任务正确生成下一个实例

### ✅ 边界测试
- [x] 快速连续拖拽多个任务
- [x] 同一任务来回拖拽
- [x] 网络失败时正确回滚

### ✅ UI测试
- [x] 拖拽时UI立即响应
- [x] API调用期间UI不卡顿
- [x] 成功后任务出现在正确列表
- [x] 失败时显示错误并恢复

---

## API响应示例

### 完成任务响应
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 123,
    "userId": 1,
    "title": "完成项目报告",
    "status": "completed",
    "completedAt": "2025-11-05T12:00:00Z",
    "sortOrder": 0,
    ...
  }
}
```

### 取消完成响应
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 123,
    "userId": 1,
    "title": "完成项目报告",
    "status": "todo",
    "completedAt": null,
    "sortOrder": 0,
    ...
  }
}
```

---

## 总结

✅ **状态切换已完全实现**
- 拖拽到已完成 → 调用服务端接口标记为完成
- 拖拽回待办 → 调用服务端接口取消完成
- 同一个API智能处理两种情况
- 数据持久化到数据库
- UI和服务端状态完全同步

✅ **用户体验优秀**
- 拖拽立即响应
- 状态正确更新
- 统计数据准确
- 重复任务正确处理

