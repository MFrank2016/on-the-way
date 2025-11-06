# 任务统计数据更新修复

## 问题描述

当修改任务的日期后,左侧任务侧边栏(TaskSidebar)中显示的"今天"、"明天"、"最近7天"等统计数据没有随之更新。

## 问题原因

1. **TaskSidebar 组件**中的 `loadTaskCounts` 函数只在组件初始化时调用一次
2. 当任务被修改、添加或删除后,没有机制通知 TaskSidebar 重新加载统计数据
3. TaskSidebar 和 TodayPage 是独立的组件,没有共享状态管理

## 解决方案

使用**自定义浏览器事件(CustomEvent)**实现跨组件通信:

### 1. TaskSidebar 监听更新事件

在 `TaskSidebar.tsx` 中添加事件监听器:

```typescript
useEffect(() => {
  const loadData = async () => {
    await Promise.all([
      loadFolders(),
      loadLists(),
      loadTags(),
      loadFilters(),
      loadTaskCounts(),
    ])
  }
  loadData()
  
  // 监听任务更新事件，刷新任务数量统计
  const handleTaskUpdate = () => {
    loadTaskCounts()
  }
  
  window.addEventListener('taskUpdated', handleTaskUpdate)
  
  return () => {
    window.removeEventListener('taskUpdated', handleTaskUpdate)
  }
}, [])
```

### 2. 任务操作时触发事件

在 `useTaskOperations.ts` 中,在以下操作后触发 `taskUpdated` 事件:

- **添加任务** (`handleAddTask`)
- **完成/取消完成任务** (`handleCompleteTask`)
- **删除任务** (`handleDeleteTask`)
- **更新任务** (`handleUpdateTask`) - 仅当更新了日期或清单时

```typescript
// 触发全局任务更新事件，通知侧边栏刷新统计数据
window.dispatchEvent(new CustomEvent('taskUpdated'))
```

## 修改的文件

1. `/frontend/components/TaskSidebar.tsx`
   - 添加 `taskUpdated` 事件监听器
   - 在事件触发时调用 `loadTaskCounts()`

2. `/frontend/hooks/useTaskOperations.ts`
   - 在 `handleAddTask` 中触发事件
   - 在 `handleCompleteTask` 中触发事件
   - 在 `handleDeleteTask` 中触发事件
   - 在 `handleUpdateTask` 中(仅当更新日期或清单时)触发事件

## 技术选择说明

### 为什么使用自定义事件而不是其他方案?

1. **状态管理库(如 Zustand/Redux)**
   - 优点:更强大的状态管理
   - 缺点:需要重构大量代码,引入新的依赖

2. **Context API**
   - 优点:React 原生支持
   - 缺点:需要重构组件树结构,所有子组件都会重新渲染

3. **自定义事件(选择的方案)**
   - 优点:简单轻量,无需重构现有代码,性能好
   - 缺点:不是 React 推荐的方式,需要手动管理事件监听器

考虑到项目当前的架构和最小改动原则,选择了自定义事件方案。

## 测试场景

修复后,以下操作都会实时更新侧边栏统计数据:

1. ✅ 修改任务日期(从明天改到今天)
2. ✅ 添加新任务
3. ✅ 完成任务
4. ✅ 删除任务
5. ✅ 修改任务所属清单

## 后续优化建议

如果项目规模继续扩大,建议考虑:

1. 引入全局状态管理库(Zustand 或 Redux)
2. 统一管理任务数据和统计数据
3. 使用 React Query 或 SWR 管理服务器状态和缓存

## 相关问题修复

在同一次修复中,还解决了另一个相关问题:

- **问题**: 左侧"今天"一栏显示的任务数只统计了今天到期的任务,没有包括逾期任务
- **修复**: 在 `TaskSidebar.tsx` 的 `loadTaskCounts` 中,将今天任务数改为 `overdueCount + todayDueCount`
- **详见**: 第一次提交的修改

---

**修复日期**: 2025-11-06  
**修复版本**: v1.0

