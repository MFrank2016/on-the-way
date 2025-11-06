'use client'

import { useEffect } from 'react'
import { taskAPI } from '@/lib/api'
import CrossListDraggable from '@/components/CrossListDraggable'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import TaskDetailPanelNew from '@/components/TaskDetailPanelNew'
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
import { Calendar, CalendarDays, CalendarRange, Clock } from 'lucide-react'

export default function TodayPage() {
  const { activeFilter } = useFilterStore()
  
  // 数据管理
  const {
    overdueTasks,
    todoTasks,
    completedTasks,
    groupedTasks,
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
  
  // 监听过滤器变化
  useEffect(() => {
    setSelectedTask(null)
  }, [activeFilter, setSelectedTask])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 获取默认清单
  const defaultList = lists.find(l => l.isDefault)
  const defaultListId = defaultList?.id
  
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

  return (
    <div className="flex h-full">
      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <PageHeader title={pageTitle} subtitle={pageSubtitle} />

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

          {/* 所有视图 - 显示分组的任务 */}
          {isAllView ? (
            <>
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

              {/* 今天 */}
              <TaskSection
                title="今天"
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

              {/* 明天 */}
              <TaskSection
                title="明天"
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

          {/* 习惯打卡 */}
          <HabitsSection
            habits={todayHabits}
            onCheck={handleCheckHabit}
          />

          {/* 已完成习惯区域 */}
          <CompletedHabitsSection
            habits={completedHabits}
            completedTasksCount={completedTasks.length}
            onUncheck={handleUncheckHabit}
          />

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

