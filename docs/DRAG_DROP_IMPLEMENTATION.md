# 拖拽排序功能实现文档

## 实现时间
2025年11月5日

## 功能概述
实现了全功能的拖拽排序系统，支持：
1. ✅ 任意位置拖拽待办事项
2. ✅ 同列表内拖拽排序
3. ✅ 跨列表拖拽（待办 ↔ 已完成）
4. ✅ 拖拽到已完成自动标记完成
5. ✅ 拖拽回待办自动取消完成

## 技术实现

### 1. 依赖库
使用 `@dnd-kit` 库系列：
- `@dnd-kit/core` - 核心拖拽功能
- `@dnd-kit/sortable` - 排序功能
- `@dnd-kit/utilities` - 工具函数

### 2. 后端实现

#### Task模型增强 (`backend/models/task.go`)
```go
SortOrder int `json:"sortOrder" gorm:"default:0;index:idx_sort_order"`
```

#### 排序逻辑 (`backend/controllers/task.go`)
- **GetTasks**: 按 `sort_order ASC, created_at DESC` 排序
- **ReorderTasks**: 批量更新任务排序

```go
func (ctrl *TaskController) ReorderTasks(c *gin.Context) {
    // 接收任务ID数组，按顺序更新sortOrder
}
```

#### API路由 (`backend/routes/routes.go`)
```
PUT /api/tasks/reorder
```

### 3. 前端实现

#### 组件架构

##### DraggableTaskList (`frontend/components/DraggableTaskList.tsx`)
- 单列表内拖拽排序
- 整个任务项可拖拽
- 拖拽激活距离：8px（避免误触发）

##### CrossListDraggable (`frontend/components/CrossListDraggable.tsx`) 
- **核心功能组件**，支持跨列表拖拽
- 管理待办和已完成两个列表
- 使用 DragOverlay 显示拖拽预览

**关键特性**：
```typescript
// 拖拽事件处理
onDragStart: 记录正在拖拽的任务
onDragOver: 实时更新列表（跨列表移动）
onDragEnd: 完成拖拽，保存到服务器

// 跨列表移动逻辑
- 从待办拖到已完成 → 调用 completeTask API
- 从已完成拖回待办 → 调用 completeTask API（切换状态）
```

#### Today页面集成 (`frontend/app/(main)/today/page.tsx`)

**主要处理函数**：
- `handleReorderTodo`: 待办列表内排序
- `handleReorderCompleted`: 已完成列表内排序
- `handleMoveToCompleted`: 拖拽到已完成（标记完成）
- `handleMoveToTodo`: 拖拽回待办（取消完成）

**布局结构**：
```tsx
<CrossListDraggable
  todoTasks={todoTasks}
  completedTasks={completedTasks}
  onReorderTodo={handleReorderTodo}
  onReorderCompleted={handleReorderCompleted}
  onMoveToCompleted={handleMoveToCompleted}
  onMoveToTodo={handleMoveToTodo}
/>
```

## 用户体验设计

### 拖拽交互
1. **激活条件**：移动8px后开始拖拽
2. **视觉反馈**：
   - 拖拽中的任务：透明度30%
   - 拖拽预览：DragOverlay显示任务副本
   - 鼠标样式：`cursor: grab` / `active:cursor-grabbing`

3. **平滑动画**：CSS transitions提供流畅的移动效果

### 跨列表拖拽流程

#### 场景1：待办 → 已完成
1. 用户拖拽待办任务
2. 移动到已完成区域
3. `onDragOver`：任务从待办列表移除，添加到已完成列表（本地UI）
4. `onDragEnd`：调用 `taskAPI.completeTask(taskId)`
5. 服务器更新任务状态为 `completed`
6. 重新加载数据确保同步

#### 场景2：已完成 → 待办
1. 用户拖拽已完成任务
2. 移动到待办区域
3. `onDragOver`：任务从已完成移除，添加到待办（本地UI）
4. `onDragEnd`：调用 `taskAPI.completeTask(taskId)`（切换状态）
5. 服务器更新任务状态为 `todo`
6. 重新加载数据确保同步

#### 场景3：列表内排序
1. 用户拖拽任务到新位置
2. `onDragEnd`：计算新顺序
3. 立即更新UI（乐观更新）
4. 调用 `taskAPI.reorderTasks([...taskIds])`
5. 服务器批量更新 sortOrder
6. 失败时重新加载数据恢复

## 性能优化

### 1. 乐观更新
- 拖拽完成后立即更新UI
- 后台异步保存到服务器
- 提供即时的用户反馈

### 2. 本地状态管理
```typescript
const [localTodoTasks, setLocalTodoTasks] = useState(todoTasks)
const [localCompletedTasks, setLocalCompletedTasks] = useState(completedTasks)

// 使用useEffect同步props变化
useEffect(() => {
  setLocalTodoTasks(todoTasks)
}, [todoTasks])
```

### 3. 最小API调用
- 拖拽过程中只更新本地状态
- `onDragEnd` 时才调用API
- 批量操作减少请求次数

## 数据流

```
用户拖拽
  ↓
onDragStart (记录activeId)
  ↓
onDragOver (实时更新UI)
  ↓
onDragEnd
  ↓
判断操作类型:
  - 同列表排序 → reorderTasks
  - 跨列表移动 → completeTask / uncompleteTask
  ↓
API调用
  ↓
成功: UI已更新
失败: 重新加载数据
```

## 注意事项

### 1. 防止冲突
- 拖拽时禁用其他按钮的点击事件
- 使用事件传播控制

### 2. 状态同步
- Props更新时同步本地状态
- API失败时回滚本地状态

### 3. 键盘支持
- 使用 KeyboardSensor 支持键盘操作
- 无障碍访问友好

## 测试场景

### 功能测试
- [x] 在待办列表内拖拽排序
- [x] 在已完成列表内拖拽排序
- [x] 从待办拖到已完成（自动完成）
- [x] 从已完成拖回待办（自动取消完成）
- [x] 拖拽任意位置都可以触发
- [x] 拖拽预览正常显示
- [x] 排序持久化到服务器

### 边界情况
- [x] 只有一个任务时的拖拽
- [x] 快速连续拖拽
- [x] 拖拽到相同位置
- [x] 网络失败时的回滚

## 文件清单

### 新增文件
- `frontend/components/DraggableTaskList.tsx` - 单列表拖拽组件
- `frontend/components/CrossListDraggable.tsx` - 跨列表拖拽组件

### 修改文件
- `backend/models/task.go` - 添加 SortOrder 字段
- `backend/controllers/task.go` - 添加 ReorderTasks 方法
- `backend/routes/routes.go` - 注册排序API
- `frontend/lib/api.ts` - 添加 reorderTasks API
- `frontend/app/(main)/today/page.tsx` - 集成拖拽组件
- `package.json` - 添加 @dnd-kit 依赖

## 未来增强

### 可选功能
1. **多选拖拽**：支持选中多个任务批量拖拽
2. **拖拽动画**：更丰富的拖拽动画效果
3. **触摸优化**：针对移动端的触摸拖拽优化
4. **撤销/重做**：拖拽操作的撤销重做功能
5. **拖拽提示**：首次使用时的引导提示
6. **手势支持**：长按、双击等手势操作

### 性能优化
1. 虚拟滚动：大量任务时的性能优化
2. 防抖优化：减少API调用频率
3. Web Worker：复杂排序计算的性能优化

## 总结
成功实现了完整的拖拽排序功能，用户体验流畅，支持跨列表拖拽和自动状态切换。代码架构清晰，易于维护和扩展。

