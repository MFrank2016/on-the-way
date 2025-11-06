# 视图布局优化文档

## 概述

根据用户需求，优化了"今天"和"所有"视图的展示布局，使其更加清晰和符合使用习惯。

## 各视图展示内容

### 1. "今天"视图

展示顺序：
1. **已过期** - 显示所有逾期未完成的任务
2. **今日待办** - 显示今天到期的待办任务（可拖拽排序）
3. **今日习惯** - 显示需要打卡的习惯
4. **已完成** - 显示已完成的习惯和任务

特点：
- 专注于今天的任务和习惯
- 不显示明天或未来的任务
- 清晰的分栏展示

### 2. "所有"视图

展示顺序：
1. **已过期** - 显示所有逾期未完成的任务
2. **今天 (周几)** - 显示今天到期的任务，标题显示如"今天 周四"
3. **明天 (周几)** - 显示明天到期的任务，标题显示如"明天 周五"
4. **最近7天** - 显示后天到7天内到期的任务
5. **更远** - 显示7天之后到期的任务
6. **无日期** - 显示没有设置截止日期的任务
7. **已完成** - 显示已完成的任务

特点：
- 全面展示所有任务
- 今天和明天标题带有星期标注
- 按时间维度清晰分组

### 3. "最近7天"视图

展示顺序：
1. **已过期** - 显示所有逾期未完成的任务
2. **今天** - 显示今天到期的任务
3. **今日习惯** - 显示需要打卡的习惯
4. **明天** - 显示明天到期的任务
5. **按日期分组** - 后天到7天内的任务，每天单独一组，显示"11月9日, 周日"格式
6. **已完成习惯** - 显示已完成的习惯
7. **已完成** - 显示已完成的任务

特点：
- 适合查看一周内的任务安排
- 按具体日期分组，便于规划
- 集成习惯打卡功能

## 实现细节

### 1. 视图判断逻辑

```typescript
// 判断是否显示"所有"视图的分组显示
const isAllView = activeFilter.type === 'all'

// 判断是否为"今天"视图
const isTodayView = activeFilter.type === 'date' && activeFilter.days === 0

// 判断是否为"最近7天"视图
const isWeekView = activeFilter.type === 'date' && activeFilter.days === 7
```

### 2. 日期格式化函数

在 `lib/utils.ts` 中添加了新的格式化函数：

```typescript
// 获取今天和明天的日期及星期（用于所有视图）
export function getTodayWithWeekday(): string {
  const today = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `今天 ${weekdays[today.getDay()]}`
}

export function getTomorrowWithWeekday(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `明天 ${weekdays[tomorrow.getDay()]}`
}
```

### 3. 渲染逻辑优化

使用条件渲染实现三种不同的视图布局：

```typescript
{isTodayView ? (
  // 今天视图布局
  <>
    <OverdueTasksSection ... />
    <CrossListDraggable todoTasks={todoTasks} ... />
    <HabitsSection ... />
    <CompletedHabitsSection ... />
    <CrossListDraggable completedTasks={completedTasks} ... />
  </>
) : isWeekView ? (
  // 最近7天视图布局
  <>...</>
) : isAllView ? (
  // 所有视图布局
  <>
    <TaskSection title="已过期" ... />
    <TaskSection title={getTodayWithWeekday()} ... />
    <TaskSection title={getTomorrowWithWeekday()} ... />
    <TaskSection title="最近7天" ... />
    <TaskSection title="更远" ... />
    <TaskSection title="无日期" ... />
    <CrossListDraggable completedTasks={completedTasks} ... />
  </>
) : (
  // 其他视图布局
  <>...</>
)}
```

### 4. 习惯显示逻辑

习惯打卡根据不同视图有不同的显示位置：

- **今天视图**: 习惯显示在今日待办之后，已完成之前
- **最近7天视图**: 习惯显示在今天任务之后，明天任务之前
- **所有视图**: 不显示习惯（因为不是按日期聚焦）
- **其他视图**: 习惯显示在页面末尾

```typescript
{!isTodayView && !isAllView && !isWeekView && (
  <>
    <HabitsSection ... />
    <CompletedHabitsSection ... />
  </>
)}
```

## 修改的文件

1. **`frontend/lib/utils.ts`**
   - 新增 `getTodayWithWeekday()` 函数
   - 新增 `getTomorrowWithWeekday()` 函数

2. **`frontend/app/(main)/today/page.tsx`**
   - 添加 `isTodayView` 判断
   - 重新组织三种视图的渲染逻辑
   - 优化习惯显示的条件判断
   - 在"所有"视图中为今天和明天添加周几标注

## 用户体验优化

### 1. 信息层次清晰

- **今天视图**: 专注当前，减少干扰
- **所有视图**: 全面展示，便于整体规划
- **最近7天视图**: 中期规划，按日分组

### 2. 日期标识明确

- "所有"视图中的"今天 周四"、"明天 周五"让用户快速识别
- "最近7天"视图中的"11月9日, 周日"提供完整的日期信息

### 3. 习惯集成自然

- 习惯打卡在"今天"和"最近7天"视图中自然融入任务流程
- 避免在"所有"视图中显示习惯，保持视图的专注性

### 4. 灵活的视图切换

- 用户可以根据不同场景快速切换视图
- 每个视图都有明确的使用场景

## 使用场景

### 今天视图
适合：
- 每日工作开始时查看今日计划
- 专注完成今天的任务和习惯
- 快速处理逾期任务

### 所有视图
适合：
- 进行整体任务规划
- 查看长期任务安排
- 管理没有截止日期的任务

### 最近7天视图
适合：
- 制定一周工作计划
- 查看本周的任务分布
- 平衡每日任务负载

## 测试建议

1. **今天视图测试**
   - 创建不同日期的任务，验证只显示今天的任务
   - 测试习惯打卡功能
   - 验证已完成区域的显示

2. **所有视图测试**
   - 验证各个日期分组的任务显示
   - 检查"今天 周几"和"明天 周几"格式
   - 测试无日期任务的显示

3. **最近7天视图测试**
   - 验证按日期分组的正确性
   - 测试习惯在正确位置显示
   - 检查日期格式"月日, 周几"

4. **视图切换测试**
   - 在不同视图之间切换，验证数据正确性
   - 测试任务操作（完成、删除、编辑）在各视图中的表现

---

**更新日期**: 2025-11-06  
**版本**: v2.0

