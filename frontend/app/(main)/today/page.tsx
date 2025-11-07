'use client'

import { useEffect, useState, useMemo } from 'react'
import CrossListDraggable from '@/components/CrossListDraggable'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import TaskDetailPanelNew from '@/components/TaskDetailPanelNew'
import GroupSortButton from '@/components/GroupSortButton'
import GroupedTaskList from '@/components/GroupedTaskList'
import { useFilterStore } from '@/stores/filterStore'
import { useTodayData } from '@/hooks/useTodayData'
import { useTaskOperations } from '@/hooks/useTaskOperations'
import { useHabitOperations } from '@/hooks/useHabitOperations'
import { PageHeader } from '@/components/today/PageHeader'
import { OverdueTasksSection } from '@/components/today/OverdueTasksSection'
import { HabitsSection } from '@/components/today/HabitsSection'
import { CompletedHabitsSection } from '@/components/today/CompletedHabitsSection'
import { EmptyState } from '@/components/today/EmptyState'
import { TaskSection } from '@/components/today/TaskSection'
import { getPageTitle, getPageSubtitle, getDefaultDueDate } from '@/lib/pageHelpers'
import { formatDateWithWeekday, getTodayWithWeekday, getTomorrowWithWeekday } from '@/lib/utils'
import { Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react'
import { viewConfigAPI } from '@/lib/api'
import { 
  groupTasksByTime, 
  groupTasksByList, 
  groupTasksByTag, 
  groupTasksByPriority,
  sortTasks,
  TaskGroup
} from '@/lib/taskGroupSort'

export default function TodayPage() {
  const { activeFilter } = useFilterStore()
  
  // 视图配置状态
  const [viewConfig, setViewConfig] = useState({
    groupBy: 'none' as 'none' | 'time' | 'list' | 'tag' | 'priority',
    sortBy: 'time' as 'time' | 'title' | 'tag' | 'priority',
    sortOrder: 'asc' as 'asc' | 'desc',
  })
  
  // 数据管理
  const {
    overdueTasks,
    todoTasks,
    completedTasks,
    groupedTasks,
    weekViewGroupedTasks,
    todayHabits,
    completedHabits,
    lists,
    tags,
    loading,
    setOverdueTasks,
    setTodoTasks,
    setCompletedTasks,
    loadTasks,
    loadTaskCounts,
    loadHabits,
  } = useTodayData()
  
  // 任务操作
  const {
    selectedTask,
    setSelectedTask,
    handleAddTask,
    handleCompleteTask,
    handleAbandonTask,
    handleDeleteTask,
    handleEditTask,
    handleUpdateTitle,
    handleReorderTodo,
    handleReorderCompleted,
    handleMoveToCompleted,
    handleMoveToTodo,
    handleUpdateTask,
  } = useTaskOperations({
    todoTasks,
    completedTasks,
    overdueTasks,
    setTodoTasks,
    setCompletedTasks,
    setOverdueTasks,
    loadTasks,
    loadTaskCounts,
  })
  
  // 习惯操作
  const { handleCheckHabit, handleUncheckHabit } = useHabitOperations(loadHabits)
  
  // 获取预设视图的ID映射
  const getPresetViewId = () => {
    if (activeFilter.type === 'all') return 1 // 所有
    if (activeFilter.type === 'date' && activeFilter.days === 0) return 2 // 今天
    if (activeFilter.type === 'date' && activeFilter.days === 1) return 3 // 明天
    if (activeFilter.type === 'date' && activeFilter.days === 7) return 4 // 最近7天
    return null
  }
  
  // 加载视图配置
  useEffect(() => {
    const loadViewConfig = async () => {
      try {
        let entityType: 'filter' | 'list' | 'preset' | null = null
        let entityId: number | null = null
        
        if (activeFilter.customFilterId) {
          entityType = 'filter'
          entityId = activeFilter.customFilterId
        } else if (activeFilter.type === 'list' && activeFilter.listId) {
          entityType = 'list'
          entityId = activeFilter.listId
        } else {
          const presetId = getPresetViewId()
          if (presetId) {
            entityType = 'preset'
            entityId = presetId
          }
        }
        
        if (entityType && entityId) {
          const response = await viewConfigAPI.getViewConfig(entityType, entityId)
          const config = response.data.data || response.data
          setViewConfig({
            groupBy: config.groupBy || 'none',
            sortBy: config.sortBy || 'time',
            sortOrder: config.sortOrder || 'asc',
          })
        } else {
          // 没有对应的实体ID，使用默认配置
          setViewConfig({
            groupBy: 'none',
            sortBy: 'time',
            sortOrder: 'asc',
          })
        }
      } catch (error) {
        console.error('Failed to load view config:', error)
        // 加载失败时使用默认配置
        setViewConfig({
          groupBy: 'none',
          sortBy: 'time',
          sortOrder: 'asc',
        })
      }
    }
    
    loadViewConfig()
  }, [activeFilter])
  
  // 监听过滤器变化
  useEffect(() => {
    setSelectedTask(null)
  }, [activeFilter, setSelectedTask])
  
  // 保存视图配置
  const handleSaveViewConfig = async (groupBy: string, sortBy: string, sortOrder: string) => {
    // 先更新本地状态
    setViewConfig({
      groupBy: groupBy as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    })
    
    // 保存到后端
    try {
      let entityType: 'filter' | 'list' | 'preset' | null = null
      let entityId: number | null = null
      
      if (activeFilter.customFilterId) {
        entityType = 'filter'
        entityId = activeFilter.customFilterId
      } else if (activeFilter.type === 'list' && activeFilter.listId) {
        entityType = 'list'
        entityId = activeFilter.listId
      } else {
        const presetId = getPresetViewId()
        if (presetId) {
          entityType = 'preset'
          entityId = presetId
        }
      }
      
      if (entityType && entityId) {
        console.log('Saving view config:', { entityType, entityId, groupBy, sortBy, sortOrder })
        await viewConfigAPI.updateViewConfig({
          entityType,
          entityId,
          groupBy: groupBy as any,
          sortBy: sortBy as any,
          sortOrder: sortOrder as any,
        })
        console.log('View config saved successfully')
      } else {
        console.warn('Cannot save view config: invalid entityType or entityId', { 
          activeFilter, 
          entityType, 
          entityId 
        })
      }
    } catch (error) {
      console.error('Failed to save view config:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Error response:', axiosError.response?.data)
      }
    }
  }
  
  // 应用分组和排序
  const processedTasks = useMemo(() => {
    const allTasks = [...todoTasks, ...completedTasks]
    
    // 先排序
    const sorted = sortTasks(allTasks, viewConfig.sortBy, viewConfig.sortOrder)
    
    // 再分组
    let groups: TaskGroup[] = []
    
    if (viewConfig.groupBy === 'none') {
      // 不分组，但区分待办和已完成/已放弃
      const todo = sorted.filter(t => t.status === 'todo')
      const completedOrAbandoned = sorted.filter(t => t.status === 'completed' || t.status === 'abandoned')
      
      if (todo.length > 0) {
        groups.push({ id: 'todo', label: '待办', tasks: todo, sortOrder: 0 })
      }
      if (completedOrAbandoned.length > 0) {
        groups.push({ id: 'completed', label: '已完成 & 已放弃', tasks: completedOrAbandoned, sortOrder: 1 })
      }
    } else if (viewConfig.groupBy === 'time') {
      groups = groupTasksByTime(sorted)
    } else if (viewConfig.groupBy === 'list') {
      groups = groupTasksByList(sorted, lists)
    } else if (viewConfig.groupBy === 'tag') {
      groups = groupTasksByTag(sorted, tags)
    } else if (viewConfig.groupBy === 'priority') {
      groups = groupTasksByPriority(sorted)
    }
    
    return groups
  }, [todoTasks, completedTasks, viewConfig, lists, tags])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 获取默认清单
  const defaultList = lists.find(l => l.isDefault)
  
  // 计算默认清单ID：如果是清单视图，使用当前清单ID；否则使用默认清单ID
  const defaultListId = activeFilter.type === 'list' && activeFilter.listId 
    ? activeFilter.listId 
    : defaultList?.id
  
  // 计算页面信息
  const pageTitle = getPageTitle(activeFilter, lists)
  const pageSubtitle = getPageSubtitle(activeFilter)
  const defaultDueDate = getDefaultDueDate(activeFilter)
  
  // 检查是否为空状态
  const isEmpty = activeFilter.type === 'all'
    ? Object.values(groupedTasks).every(tasks => tasks.length === 0) && 
      completedTasks.length === 0 &&
      todayHabits.length === 0 && 
      completedHabits.length === 0
    : overdueTasks.length === 0 &&
      todoTasks.length === 0 && 
      todayHabits.length === 0 && 
      completedTasks.length === 0 && 
      completedHabits.length === 0
  
  // 判断是否显示"所有"视图的分组显示
  const isAllView = activeFilter.type === 'all'
  
  // 判断是否为"今天"视图
  const isTodayView = activeFilter.type === 'date' && activeFilter.days === 0
  
  // 判断是否为"最近7天"视图
  const isWeekView = activeFilter.type === 'date' && activeFilter.days === 7
  
  // 判断是否为清单视图（清单是实体，不显示习惯）
  const isListView = activeFilter.type === 'list'
  
  // 判断是否应该显示分组排序按钮（自定义过滤器、清单视图、预设视图都显示）
  const showGroupSort = activeFilter.customFilterId || 
    (activeFilter.type === 'list' && activeFilter.listId) ||
    getPresetViewId() !== null
  
  // 判断是否使用自定义分组排序的任务列表
  const useCustomGroupSort = showGroupSort && (viewConfig.groupBy !== 'none' || viewConfig.sortBy !== 'time' || viewConfig.sortOrder !== 'asc')

  return (
    <div className="flex h-full">
      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <PageHeader 
            title={pageTitle} 
            subtitle={pageSubtitle}
            actions={
              showGroupSort ? (
                <GroupSortButton
                  currentGroupBy={viewConfig.groupBy}
                  currentSortBy={viewConfig.sortBy}
                  currentSortOrder={viewConfig.sortOrder}
                  onSave={handleSaveViewConfig}
                />
              ) : undefined
            }
          />

          {/* Quick Add */}
          <div className="mb-4">
            <QuickAddTaskNew 
              onAdd={handleAddTask} 
              lists={lists} 
              tags={tags}
              defaultDueDate={defaultDueDate}
              defaultListId={defaultListId}
            />
          </div>

          {/* 使用自定义分组排序的任务列表 */}
          {useCustomGroupSort ? (
            <>
              <GroupedTaskList
                groups={processedTasks}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                onAbandon={handleAbandonTask}
              />
              
              {/* 习惯（如果不是清单视图） */}
              {!isListView && (
                <>
                  <HabitsSection
                    habits={todayHabits}
                    onCheck={handleCheckHabit}
                  />
                  <CompletedHabitsSection
                    habits={completedHabits}
                    completedTasksCount={completedTasks.length}
                    onUncheck={handleUncheckHabit}
                  />
                </>
              )}
            </>
          ) : isTodayView ? (
            /* 今天视图 - 展示：已过期、今日待办、今日习惯、已完成 */
            <>
              {/* 已过期 */}
              <OverdueTasksSection
                tasks={overdueTasks}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
              />

              {/* 今日待办 */}
              {todoTasks.length > 0 && (
                <CrossListDraggable
                  todoTasks={todoTasks}
                  completedTasks={[]}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  onReorderTodo={handleReorderTodo}
                  onReorderCompleted={handleReorderCompleted}
                  onMoveToCompleted={handleMoveToCompleted}
                  onMoveToTodo={handleMoveToTodo}
                  selectedTaskId={selectedTask?.id.toString()}
                />
              )}

              {/* 今日习惯 */}
              <HabitsSection
                habits={todayHabits}
                onCheck={handleCheckHabit}
              />

              {/* 已完成习惯 */}
              <CompletedHabitsSection
                habits={completedHabits}
                completedTasksCount={completedTasks.length}
                onUncheck={handleUncheckHabit}
              />

              {/* 已完成任务 */}
              {completedTasks.length > 0 && (
                <CrossListDraggable
                  todoTasks={[]}
                  completedTasks={completedTasks}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  onReorderTodo={handleReorderTodo}
                  onReorderCompleted={handleReorderCompleted}
                  onMoveToCompleted={handleMoveToCompleted}
                  onMoveToTodo={handleMoveToTodo}
                  selectedTaskId={selectedTask?.id.toString()}
                />
              )}
            </>
          ) : isWeekView ? (
            <>
              {/* 最近7天视图 - 特殊布局 */}
              {/* 已过期 */}
              {weekViewGroupedTasks.overdue.length > 0 && (
                <TaskSection
                  title="已过期"
                  tasks={weekViewGroupedTasks.overdue}
                  selectedTaskId={selectedTask?.id.toString()}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  icon={<Clock className="w-4 h-4 text-red-500" />}
                  countColor="bg-red-50 text-red-600"
                  defaultExpanded={true}
                />
              )}

              {/* 今天 */}
              {weekViewGroupedTasks.today.length > 0 && (
                <TaskSection
                  title="今天"
                  tasks={weekViewGroupedTasks.today}
                  selectedTaskId={selectedTask?.id.toString()}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  icon={<Calendar className="w-4 h-4 text-blue-500" />}
                  countColor="bg-blue-50 text-blue-600"
                  defaultExpanded={true}
                />
              )}

              {/* 今日习惯 */}
              <HabitsSection
                habits={todayHabits}
                onCheck={handleCheckHabit}
              />

              {/* 明天 */}
              {weekViewGroupedTasks.tomorrow.length > 0 && (
                <TaskSection
                  title="明天"
                  tasks={weekViewGroupedTasks.tomorrow}
                  selectedTaskId={selectedTask?.id.toString()}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  icon={<CalendarDays className="w-4 h-4 text-green-500" />}
                  countColor="bg-green-50 text-green-600"
                  defaultExpanded={true}
                />
              )}

              {/* 后天到7天内的任务，按日期分组 */}
              {weekViewGroupedTasks.byDate.map(({ date, tasks }) => (
                <TaskSection
                  key={date}
                  title={formatDateWithWeekday(date)}
                  tasks={tasks}
                  selectedTaskId={selectedTask?.id.toString()}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  icon={<Calendar className="w-4 h-4 text-purple-500" />}
                  countColor="bg-purple-50 text-purple-600"
                  defaultExpanded={true}
                />
              ))}

              {/* 已完成习惯区域 */}
              <CompletedHabitsSection
                habits={completedHabits}
                completedTasksCount={completedTasks.length}
                onUncheck={handleUncheckHabit}
              />

              {/* 已完成 */}
              {completedTasks.length > 0 && (
                <CrossListDraggable
                  todoTasks={[]}
                  completedTasks={completedTasks}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  onReorderTodo={handleReorderTodo}
                  onReorderCompleted={handleReorderCompleted}
                  onMoveToCompleted={handleMoveToCompleted}
                  onMoveToTodo={handleMoveToTodo}
                  selectedTaskId={selectedTask?.id.toString()}
                />
              )}
            </>
          ) : isAllView ? (
            <>
              {/* 所有视图 - 展示：已过期、今天(周几)、明天(周几)、最近7天、更远、无日期、已完成 */}
              
              {/* 已过期 */}
              <TaskSection
                title="已过期"
                tasks={groupedTasks.overdue}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                icon={<Clock className="w-4 h-4 text-red-500" />}
                countColor="bg-red-50 text-red-600"
                defaultExpanded={true}
              />

              {/* 今天 (周几) */}
              <TaskSection
                title={getTodayWithWeekday()}
                tasks={groupedTasks.today}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                icon={<Calendar className="w-4 h-4 text-blue-500" />}
                countColor="bg-blue-50 text-blue-600"
                defaultExpanded={true}
              />

              {/* 习惯打卡 */}
              <HabitsSection
                habits={todayHabits}
                onCheck={handleCheckHabit}
              />

              {/* 明天 (周几) */}
              <TaskSection
                title={getTomorrowWithWeekday()}
                tasks={groupedTasks.tomorrow}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                icon={<CalendarDays className="w-4 h-4 text-green-500" />}
                countColor="bg-green-50 text-green-600"
                defaultExpanded={true}
              />

              {/* 最近7天 */}
              <TaskSection
                title="最近7天"
                tasks={groupedTasks.week}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                icon={<CalendarRange className="w-4 h-4 text-purple-500" />}
                countColor="bg-purple-50 text-purple-600"
                defaultExpanded={true}
              />

              {/* 更远 */}
              <TaskSection
                title="更远"
                tasks={groupedTasks.further}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                countColor="bg-gray-100 text-gray-600"
                defaultExpanded={true}
              />

              {/* 无日期 */}
              <TaskSection
                title="无日期"
                tasks={groupedTasks.noDate}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
                countColor="bg-gray-100 text-gray-600"
                defaultExpanded={true}
              />

              {/* 已完成 */}
              {completedTasks.length > 0 && (
                <CrossListDraggable
                  todoTasks={[]}
                  completedTasks={completedTasks}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  onReorderTodo={handleReorderTodo}
                  onReorderCompleted={handleReorderCompleted}
                  onMoveToCompleted={handleMoveToCompleted}
                  onMoveToTodo={handleMoveToTodo}
                  selectedTaskId={selectedTask?.id.toString()}
                />
              )}
            </>
          ) : (
            <>
              {/* 其他视图 - 显示已过期区域 */}
              <OverdueTasksSection
                tasks={overdueTasks}
                selectedTaskId={selectedTask?.id.toString()}
                onComplete={handleCompleteTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                onUpdateTitle={handleUpdateTitle}
              />

              {/* 今天/明天/最近7天区域 - 使用拖拽组件 */}
              {(todoTasks.length > 0 || completedTasks.length > 0) && (
                <CrossListDraggable
                  todoTasks={todoTasks}
                  completedTasks={completedTasks}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                  onEdit={handleEditTask}
                  onUpdateTitle={handleUpdateTitle}
                  onReorderTodo={handleReorderTodo}
                  onReorderCompleted={handleReorderCompleted}
                  onMoveToCompleted={handleMoveToCompleted}
                  onMoveToTodo={handleMoveToTodo}
                  selectedTaskId={selectedTask?.id.toString()}
                />
              )}
            </>
          )}

          {/* 习惯打卡 - 只在视图中显示，不在清单中显示 */}
          {/* 视图包括：今天、所有、最近7天等基于时间/条件的聚合展示 */}
          {/* 清单是实体，任务归属于清单，习惯不属于清单 */}
          {!isTodayView && !isAllView && !isWeekView && !isListView && (
            <>
          <HabitsSection
            habits={todayHabits}
            onCheck={handleCheckHabit}
          />

          <CompletedHabitsSection
            habits={completedHabits}
            completedTasksCount={completedTasks.length}
            onUncheck={handleUncheckHabit}
          />
            </>
          )}

          {/* Empty State */}
          {isEmpty && <EmptyState />}
        </div>
      </div>

      {/* Task Detail Panel (右侧固定) */}
      <TaskDetailPanelNew
        task={selectedTask}
        lists={lists}
        tags={tags}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={(taskId) => {
          handleDeleteTask(taskId)
          setSelectedTask(null)
        }}
        onComplete={handleCompleteTask}
      />
    </div>
  )
}

