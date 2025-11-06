# 最近7天视图实现文档

## 概述

根据用户需求,为"最近7天"视图实现了特殊的任务展示布局,展示顺序为:
1. 已过期
2. 今天
3. 今日习惯
4. 明天
5. 后天到7天内的任务(按日期单独分组,显示格式如"11月9日, 周日")
6. 已完成习惯
7. 已完成任务

## 实现细节

### 1. 数据结构

在 `useTodayData.ts` 中新增了 `WeekViewGroupedTasks` 接口:

```typescript
export interface WeekViewGroupedTasks {
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  byDate: { date: string; tasks: Task[] }[]  // 后天到7天内的任务，按日期分组
}
```

### 2. 数据加载逻辑

在 `loadTasks` 函数中添加了专门为"最近7天"视图生成分组数据的逻辑:

```typescript
// 为"最近7天"视图生成特殊分组
if (activeFilter.type === 'date' && activeFilter.days === 7) {
  // 收集后天到7天内的任务，按日期分组
  const tasksByDate: { [key: string]: Task[] } = {}
  
  // 初始化未来5天的日期(后天到第7天)
  for (let i = 2; i <= 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    tasksByDate[dateStr] = []
  }
  
  // 将任务分配到对应的日期
  filteredTasks.forEach((t: Task) => {
    if (t.dueDate && t.dueDate >= dayAfterTomorrowDateStr && t.dueDate <= weekDateStr) {
      if (tasksByDate[t.dueDate]) {
        tasksByDate[t.dueDate].push(t)
      }
    }
  })
  
  // 转换为数组格式，只包含有任务的日期
  const byDateArray = Object.entries(tasksByDate)
    .filter(([, tasks]) => tasks.length > 0)
    .map(([date, tasks]) => ({ date, tasks }))
  
  setWeekViewGroupedTasks({
    overdue: filteredOverdue,
    today: filteredTasks.filter((t: Task) => t.dueDate === todayDateStr),
    tomorrow: filteredTasks.filter((t: Task) => t.dueDate === tomorrowDateStr),
    byDate: byDateArray,
  })
}
```

### 3. 日期格式化

在 `lib/utils.ts` 中添加了新的日期格式化函数:

```typescript
// 格式化日期为 "11月9日, 周日" 格式（用于最近7天视图）
export function formatDateWithWeekday(dateStr: string): string {
  // dateStr 格式: 20251109
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))
  
  const date = new Date(year, month - 1, day)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  
  return `${month}月${day}日, ${weekday}`
}
```

### 4. 页面渲染逻辑

在 `today/page.tsx` 中添加了 `isWeekView` 判断和特殊的渲染逻辑:

```typescript
// 判断是否为"最近7天"视图
const isWeekView = activeFilter.type === 'date' && activeFilter.days === 7

// 渲染逻辑
{isWeekView ? (
  <>
    {/* 已过期 */}
    {weekViewGroupedTasks.overdue.length > 0 && (...)}
    
    {/* 今天 */}
    {weekViewGroupedTasks.today.length > 0 && (...)}
    
    {/* 今日习惯 */}
    <HabitsSection habits={todayHabits} onCheck={handleCheckHabit} />
    
    {/* 明天 */}
    {weekViewGroupedTasks.tomorrow.length > 0 && (...)}
    
    {/* 后天到7天内的任务，按日期分组 */}
    {weekViewGroupedTasks.byDate.map(({ date, tasks }) => (
      <TaskSection
        key={date}
        title={formatDateWithWeekday(date)}
        tasks={tasks}
        ...
      />
    ))}
    
    {/* 已完成习惯 */}
    <CompletedHabitsSection ... />
    
    {/* 已完成任务 */}
    {completedTasks.length > 0 && (...)}
  </>
) : ...}
```

## 修改的文件

1. `/frontend/hooks/useTodayData.ts`
   - 新增 `WeekViewGroupedTasks` 接口
   - 新增 `weekViewGroupedTasks` 状态
   - 在 `loadTasks` 中添加专门的数据分组逻辑
   - 在返回值中导出 `weekViewGroupedTasks`

2. `/frontend/lib/utils.ts`
   - 新增 `formatDateWithWeekday` 函数

3. `/frontend/app/(main)/today/page.tsx`
   - 导入 `formatDateWithWeekday` 和 `weekViewGroupedTasks`
   - 添加 `isWeekView` 判断
   - 添加专门的"最近7天"视图渲染逻辑
   - 调整习惯显示逻辑(不在"所有"和"最近7天"视图的其他部分重复显示)

## 特性说明

### 1. 按日期分组显示

后天到第7天之间的任务会按照实际日期分组显示,每个日期显示为"11月9日, 周日"的格式,符合用户需求。

### 2. 只显示有任务的日期

如果某个日期没有任务,则不会显示该日期的分组,保持界面简洁。

### 3. 习惯打卡位置

习惯打卡显示在"今天"和"明天"之间,符合图片中的布局要求。

### 4. 完成任务和习惯的位置

已完成的习惯和任务显示在最后,与其他视图保持一致。

## 视图层级

"最近7天"视图的展示优先级:
1. 最近7天视图(isWeekView) - 特殊布局
2. 所有视图(isAllView) - 包含所有分组
3. 其他视图 - 标准的待办/已完成布局

## 用户体验优化

1. **智能分组**: 自动按日期分组,用户无需手动筛选
2. **清晰的日期标识**: 使用"月日+星期"的格式,一目了然
3. **完整的功能**: 支持所有任务操作(完成、删除、编辑、拖拽等)
4. **习惯集成**: 今日习惯自然融入任务列表中
5. **空状态处理**: 只显示有任务的日期分组

## 测试建议

1. 创建不同日期的任务,验证分组是否正确
2. 检查日期格式显示是否符合要求
3. 测试任务拖拽、完成等操作是否正常
4. 验证习惯打卡功能
5. 测试空状态(没有任务时)的显示

---

**实现日期**: 2025-11-06  
**版本**: v1.0

