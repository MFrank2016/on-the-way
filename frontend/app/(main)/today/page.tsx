'use client'

import { useEffect, useState } from 'react'
import { taskAPI, listAPI, habitAPI, tagAPI } from '@/lib/api'
import { Task, List, Habit, Tag } from '@/types'
import CrossListDraggable from '@/components/CrossListDraggable'
import QuickAddTaskNew from '@/components/QuickAddTaskNew'
import TaskDialog from '@/components/TaskDialog'
import TaskDetailPanelNew from '@/components/TaskDetailPanelNew'
import TaskItem from '@/components/TaskItem'
import { Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { useFilterStore } from '@/stores/filterStore'

export default function TodayPage() {
  const { activeFilter } = useFilterStore()
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [todoTasks, setTodoTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [todayHabits, setTodayHabits] = useState<Habit[]>([])
  const [completedHabits, setCompletedHabits] = useState<Habit[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [taskCounts, setTaskCounts] = useState({
    overdue: 0,
    today: 0,
    tomorrow: 0,
    week: 0,
    further: 0,
    noDate: 0,
    completed: 0,
    inbox: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  // 监听过滤器变化
  useEffect(() => {
    loadTasks()
    loadHabits()
    // 切换过滤器时关闭任务详情面板
    setSelectedTask(null)
  }, [activeFilter])

  const loadData = async () => {
    try {
      await Promise.all([
        loadTasks(),
        loadHabits(),
        loadLists(),
        loadTags(),
        loadTaskCounts(),
      ])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLists = async () => {
    try {
      const response = await listAPI.getLists()
      setLists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load lists:', error)
    }
  }

  const loadTags = async () => {
    try {
      const response = await tagAPI.getTags()
      setTags(response.data.data || [])
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const loadTaskCounts = async () => {
    try {
      // 获取所有待办任务
      const allTodoResponse = await taskAPI.getTasks({ status: 'todo' })
      const allTasks = allTodoResponse.data.data || []
      
      // 获取所有已完成任务
      const allCompletedResponse = await taskAPI.getTasks({ status: 'completed' })
      const allCompleted = allCompletedResponse.data.data || []
      
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      
      // 计算各类任务数量
      const counts = {
        overdue: allTasks.filter((t: Task) => t.dueDate && t.dueDate < todayDateStr).length,
        today: allTasks.filter((t: Task) => t.dueDate === todayDateStr).length,
        tomorrow: allTasks.filter((t: Task) => t.dueDate === tomorrowDateStr).length,
        week: allTasks.filter((t: Task) => t.dueDate && t.dueDate > todayDateStr && t.dueDate <= weekDateStr).length,
        further: allTasks.filter((t: Task) => t.dueDate && t.dueDate > weekDateStr).length,
        noDate: allTasks.filter((t: Task) => !t.dueDate).length,
        completed: allCompleted.length,
        inbox: allTasks.filter((t: Task) => t.list?.isDefault || t.list?.type === 'inbox').length,
      }
      
      setTaskCounts(counts)
    } catch (error) {
      console.error('Failed to load task counts:', error)
    }
  }

  const loadTasks = async () => {
    try {
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      
      // 获取所有待办任务用于过滤
      const allTodoResponse = await taskAPI.getTasks({ status: 'todo' })
      const allTodoTasks = allTodoResponse.data.data || []
      
      // 根据过滤器加载任务
      let filteredTasks: Task[] = []
      
      if (activeFilter.type === 'all') {
        // 所有任务
        filteredTasks = allTodoTasks
        setOverdueTasks([])
      } else if (activeFilter.type === 'date') {
        // 日期过滤
        if (activeFilter.days === 0) {
          filteredTasks = allTodoTasks.filter((t: Task) => t.dueDate === todayDateStr)
        } else if (activeFilter.days === 1) {
          const tomorrowDate = new Date()
          tomorrowDate.setDate(tomorrowDate.getDate() + 1)
          const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
          filteredTasks = allTodoTasks.filter((t: Task) => t.dueDate === tomorrowDateStr)
        } else if (activeFilter.days === 7) {
          const weekDate = new Date()
          weekDate.setDate(weekDate.getDate() + 7)
          const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
          filteredTasks = allTodoTasks.filter((t: Task) => t.dueDate && t.dueDate <= weekDateStr)
        }
        setOverdueTasks([])
      } else if (activeFilter.type === 'list' && activeFilter.listId) {
        // 清单过滤
        filteredTasks = allTodoTasks.filter((t: Task) => t.listId === activeFilter.listId)
        setOverdueTasks([])
      } else if (activeFilter.type === 'custom' && activeFilter.customFilterId) {
        // 自定义过滤器
        const filter = (useFilterStore.getState().customFilters || []).find(f => f.id === activeFilter.customFilterId)
        if (filter) {
          filteredTasks = allTodoTasks.filter((t: Task) => {
            // 应用自定义过滤器条件
            const config = filter.filterConfig
            
            // 清单过滤
            if (config.listIds && config.listIds.length > 0) {
              if (!config.listIds.includes(t.listId)) return false
            }
            
            // 标签过滤
            if (config.tagIds && config.tagIds.length > 0) {
              const taskTagIds = t.tags?.map(tag => tag.id) || []
              if (!config.tagIds.some(id => taskTagIds.includes(id))) return false
            }
            
            // 日期过滤
            if (config.dateType) {
              if (config.dateType === 'today') {
                if (t.dueDate !== todayDateStr) return false
              } else if (config.dateType === 'tomorrow') {
                const tomorrowDate = new Date()
                tomorrowDate.setDate(tomorrowDate.getDate() + 1)
                const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
                if (t.dueDate !== tomorrowDateStr) return false
              } else if (config.dateType === 'overdue') {
                if (!t.dueDate || t.dueDate >= todayDateStr) return false
              } else if (config.dateType === 'noDate') {
                if (t.dueDate) return false
              }
            }
            
            // 优先级过滤
            if (config.priorities && config.priorities.length > 0) {
              if (!config.priorities.includes(t.priority)) return false
            }
            
            // 内容关键词过滤
            if (config.contentKeyword) {
              if (!t.title.includes(config.contentKeyword)) return false
            }
            
            return true
          })
        }
        setOverdueTasks([])
      } else {
        // 默认显示所有
        filteredTasks = allTodoTasks
        setOverdueTasks([])
      }
      
      setTodoTasks(filteredTasks)
      
      // 根据过滤器加载已完成任务
      const allCompletedResponse = await taskAPI.getTasks({ status: 'completed' })
      const allCompleted = allCompletedResponse.data.data || []
      
      let filteredCompletedTasks: Task[] = []
      
      if (activeFilter.type === 'all') {
        // 所有已完成任务
        filteredCompletedTasks = allCompleted
      } else if (activeFilter.type === 'date') {
        if (activeFilter.days === 0) {
          // 今天：只显示今日完成的任务
          filteredCompletedTasks = allCompleted.filter((task: any) => {
            if (!task.completedAt) return false
            const completedDate = task.completedAt.substring(0, 8)
            return completedDate === todayDateStr
          })
        } else if (activeFilter.days === 1) {
          // 明天：不显示已完成任务（空数组）
          filteredCompletedTasks = []
        } else if (activeFilter.days === 7) {
          // 最近7天：显示7天内完成的任务
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
          
          filteredCompletedTasks = allCompleted.filter((task: any) => {
            if (!task.completedAt) return false
            const completedDate = task.completedAt.substring(0, 8)
            return completedDate >= sevenDaysAgoStr && completedDate <= todayDateStr
          })
        }
      } else if (activeFilter.type === 'list' && activeFilter.listId) {
        // 清单过滤：显示该清单中的已完成任务
        filteredCompletedTasks = allCompleted.filter((task: Task) => task.listId === activeFilter.listId)
      } else if (activeFilter.type === 'custom' && activeFilter.customFilterId) {
        // 自定义过滤器：应用相同的过滤条件到已完成任务
        const filter = (useFilterStore.getState().customFilters || []).find(f => f.id === activeFilter.customFilterId)
        if (filter) {
          filteredCompletedTasks = allCompleted.filter((t: Task) => {
            const config = filter.filterConfig
            
            // 清单过滤
            if (config.listIds && config.listIds.length > 0) {
              if (!config.listIds.includes(t.listId)) return false
            }
            
            // 标签过滤
            if (config.tagIds && config.tagIds.length > 0) {
              const taskTagIds = t.tags?.map(tag => tag.id) || []
              if (!config.tagIds.some(id => taskTagIds.includes(id))) return false
            }
            
            // 优先级过滤
            if (config.priorities && config.priorities.length > 0) {
              if (!config.priorities.includes(t.priority)) return false
            }
            
            // 内容关键词过滤
            if (config.contentKeyword) {
              if (!t.title.includes(config.contentKeyword)) return false
            }
            
            return true
          })
        }
      } else {
        // 默认显示今日完成的任务
        filteredCompletedTasks = allCompleted.filter((task: any) => {
          if (!task.completedAt) return false
          const completedDate = task.completedAt.substring(0, 8)
          return completedDate === todayDateStr
        })
      }
      
      setCompletedTasks(filteredCompletedTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadHabits = async () => {
    try {
      // 根据过滤器决定是否加载习惯
      // 明天视图不显示习惯
      if (activeFilter.type === 'date' && activeFilter.days === 1) {
        setTodayHabits([])
        setCompletedHabits([])
        return
      }
      
      // 今日待打卡的习惯
      const response = await habitAPI.getTodayHabits()
      const habits = response.data.data || []
      
      // 分离未完成和已完成
      setTodayHabits(habits.filter((h: Habit) => !h.checkedToday))
      setCompletedHabits(habits.filter((h: Habit) => h.checkedToday))
    } catch (error) {
      console.error('Failed to load habits:', error)
    }
  }

  const handleAddTask = async (data: {
    title: string
    dueDate?: string
    dueTime?: string
    priority?: number
    tagIds?: number[]
    listId?: number
  }) => {
    try {
      await taskAPI.createTask({ 
        ...data,
        priority: data.priority || 0,
      })
      loadTasks()
      loadTaskCounts() // 更新左侧菜单的数字
    } catch (error) {
      console.error('Failed to add task:', error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    // 检查任务是在待办还是已完成列表中
    const taskToComplete = [...todoTasks, ...overdueTasks].find(t => t.id.toString() === taskId)
    const taskToUncomplete = completedTasks.find(t => t.id.toString() === taskId)
    
    if (taskToComplete) {
      // 任务在待办列表中：完成它
      // 乐观更新：先在前端移动任务
      // 从待办列表中移除
      setTodoTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      setOverdueTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      // 添加到已完成列表（带有当前完成时间）
      const completedTask = {
        ...taskToComplete,
        status: 'completed' as const,
        completedAt: new Date().toISOString().replace(/[-:T]/g, '').split('.')[0], // 格式：20251106123045
      }
      setCompletedTasks(prev => [completedTask, ...prev])
    } else if (taskToUncomplete) {
      // 任务在已完成列表中：取消完成
      // 乐观更新：先在前端移动任务
      // 从已完成列表中移除
      setCompletedTasks(prev => prev.filter(t => t.id.toString() !== taskId))
      
      // 添加回待办列表（移除完成时间）
      const todoTask = {
        ...taskToUncomplete,
        status: 'todo' as const,
        completedAt: undefined,
      }
      setTodoTasks(prev => [todoTask, ...prev])
    }
    
    // 异步发送请求
    try {
      await taskAPI.completeTask(taskId)
      // 成功后重新加载任务计数（更新左侧菜单的数字）
      loadTaskCounts()
    } catch (error) {
      console.error('Failed to complete task:', error)
      // 如果失败，回滚状态
      loadTasks()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskAPI.deleteTask(taskId)
      loadTasks()
      loadTaskCounts() // 更新左侧菜单的数字
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleEditTask = (task: Task) => {
    // 点击任务直接显示详情面板（桌面端）或对话框（移动端）
    setSelectedTask(task)
  }

  const handleUpdateTitle = async (taskId: string, title: string) => {
    try {
      await taskAPI.updateTask(taskId, { title })
      loadTasks()
    } catch (error) {
      console.error('Failed to update task title:', error)
    }
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        await taskAPI.updateTask(editingTask.id.toString(), taskData)
      } else {
        await taskAPI.createTask(taskData)
      }
      loadTasks()
      loadTaskCounts() // 更新左侧菜单的数字
      setShowTaskDialog(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  const handleCheckHabit = async (habitId: number) => {
    try {
      await habitAPI.checkIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to check habit:', error)
    }
  }

  const handleUncheckHabit = async (habitId: number) => {
    try {
      await habitAPI.cancelCheckIn(habitId.toString())
      loadHabits()
    } catch (error) {
      console.error('Failed to uncheck habit:', error)
    }
  }

  const handleReorderTodo = async (newTasks: Task[]) => {
    setTodoTasks(newTasks)
    try {
      const taskIds = newTasks.map(task => task.id)
      await taskAPI.reorderTasks(taskIds)
    } catch (error) {
      console.error('Failed to reorder todo tasks:', error)
      loadTasks()
    }
  }

  const handleReorderCompleted = async (newTasks: Task[]) => {
    setCompletedTasks(newTasks)
    try {
      const taskIds = newTasks.map(task => task.id)
      await taskAPI.reorderTasks(taskIds)
    } catch (error) {
      console.error('Failed to reorder completed tasks:', error)
      loadTasks()
    }
  }

  const handleMoveToCompleted = async (taskId: string) => {
    // 不需要乐观更新，CrossListDraggable组件已经处理了UI更新
    // 只需要调用API持久化更改
    try {
      await taskAPI.completeTask(taskId)
      // 成功后重新加载数据以确保与后端同步
      await loadTasks()
      loadTaskCounts()
    } catch (error) {
      console.error('Failed to move task to completed:', error)
      // 如果失败，重新加载以恢复正确状态
      loadTasks()
    }
  }

  const handleMoveToTodo = async (taskId: string) => {
    // 不需要乐观更新，CrossListDraggable组件已经处理了UI更新
    // 只需要调用API持久化更改
    try {
      // 通过完成接口切换状态（再次调用会取消完成）
      await taskAPI.completeTask(taskId)
      // 成功后重新加载数据以确保与后端同步
      await loadTasks()
      loadTaskCounts()
    } catch (error) {
      console.error('Failed to move task to todo:', error)
      // 如果失败，重新加载以恢复正确状态
      loadTasks()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const totalCompleted = completedTasks.length + completedHabits.length
  
  // 获取默认清单
  const defaultList = lists.find(l => l.isDefault)
  const defaultListId = defaultList?.id

  // 根据 activeFilter 计算标题
  const getPageTitle = () => {
    if (activeFilter.type === 'all') {
      return '所有'
    }
    if (activeFilter.type === 'list') {
      const list = lists.find(l => l.id === activeFilter.listId)
      return list?.name || '收集箱'
    }
    if (activeFilter.type === 'date') {
      if (activeFilter.days === 0) return '今天'
      if (activeFilter.days === 1) return '明天'
      if (activeFilter.days === 7) return '最近7天'
    }
    return activeFilter.label || '今天'
  }

  // 根据 activeFilter 计算副标题
  const getPageSubtitle = () => {
    if (activeFilter.type === 'date' && activeFilter.days === 0) {
      return new Date().toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })
    }
    if (activeFilter.type === 'date' && activeFilter.days === 1) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow.toLocaleDateString('zh-CN', { 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      })
    }
    return ''
  }

  // 根据 activeFilter 计算默认截止日期
  const getDefaultDueDate = () => {
    if (activeFilter.type === 'date' && activeFilter.days === 1) {
      // 明天视图：默认截止日期为明天
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    }
    // 所有、今天、最近7天、清单：默认截止日期为今天
    return new Date()
  }

  return (
    <div className="flex h-full">
      {/* 主内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{getPageTitle()}</h1>
            {getPageSubtitle() && (
              <p className="text-sm text-gray-600">
                {getPageSubtitle()}
              </p>
            )}
          </div>

          {/* Quick Add */}
          <div className="mb-4">
            <QuickAddTaskNew 
              onAdd={handleAddTask} 
              lists={lists} 
              tags={tags}
              defaultDueDate={getDefaultDueDate()}
              defaultListId={defaultListId}
            />
          </div>

          {/* 已过期区域 */}
          {overdueTasks.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                已过期
                <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                  {overdueTasks.length}
                </span>
              </h2>
              <div className="space-y-2">
                {overdueTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                    onEdit={handleEditTask}
                    onUpdateTitle={handleUpdateTitle}
                    isSelected={selectedTask?.id.toString() === task.id.toString()}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 今天区域 - 使用拖拽组件 */}
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

          {/* 习惯打卡 */}
          {todayHabits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                习惯打卡
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {todayHabits.length}
                </span>
              </h2>
              <div className="space-y-2">
                {todayHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className="group flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition"
                  >
                    <button
                      onClick={() => handleCheckHabit(habit.id)}
                      className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 hover:border-blue-500 flex items-center justify-center transition"
                    >
                    </button>
                    
                    <span className="text-sm flex-1">{habit.name}</span>
                    
                    {habit.currentStreak && habit.currentStreak > 0 && (
                      <span className="text-xs text-gray-500">
                        🔥 {habit.currentStreak} 天
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 已完成习惯区域 */}
          {completedHabits.length > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="w-full flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 hover:text-gray-900"
              >
                {showCompleted ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                已完成习惯
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {completedHabits.length}
                </span>
              </button>
              
              {showCompleted && (
                <div className="space-y-2">
                  
                  {/* 已完成的习惯 */}
                  {(showAllCompleted ? completedHabits : completedHabits.slice(0, 5 - Math.min(completedTasks.length, 5))).map((habit) => (
                    <div
                      key={habit.id}
                      className="group flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 opacity-60"
                    >
                      <button
                        onClick={() => handleUncheckHabit(habit.id)}
                        className="flex-shrink-0 w-4 h-4 rounded border-2 bg-blue-600 border-blue-600 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </button>
                      
                      <span className="text-sm flex-1 line-through text-gray-400">{habit.name}</span>
                      
                      {habit.currentStreak && habit.currentStreak > 0 && (
                        <span className="text-xs text-gray-400">
                          🔥 {habit.currentStreak} 天
                        </span>
                      )}
                    </div>
                  ))}
                  
                  {/* 查看更多按钮 */}
                  {!showAllCompleted && (completedTasks.length + completedHabits.length) > 5 && (
                    <button
                      onClick={() => setShowAllCompleted(true)}
                      className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 text-center"
                    >
                      查看更多
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {todoTasks.length === 0 && todayHabits.length === 0 && completedTasks.length === 0 && completedHabits.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">今天还没有待办事项</p>
            </div>
          )}

          {/* Task Dialog */}
          {showTaskDialog && (
            <TaskDialog
              task={editingTask}
              lists={lists}
              onSave={handleSaveTask}
              onClose={() => {
                setShowTaskDialog(false)
                setEditingTask(null)
              }}
            />
          )}
        </div>
      </div>

      {/* Task Detail Panel (右侧固定) */}
      <TaskDetailPanelNew
        task={selectedTask}
        lists={lists}
        tags={tags}
        onClose={() => setSelectedTask(null)}
        onUpdate={async (taskId, data) => {
          try {
            const response = await taskAPI.updateTask(taskId, data)
            const updatedTask = response.data.data
            
            // 更新selectedTask以保持任务详情面板同步
            setSelectedTask(updatedTask)
            
            // 重新加载任务列表以更新左侧列表
            await loadTasks()
            loadTaskCounts() // 更新左侧菜单的数字
          } catch (error) {
            console.error('Failed to update task:', error)
          }
        }}
        onDelete={(taskId) => {
          handleDeleteTask(taskId)
          setSelectedTask(null)
        }}
        onComplete={handleCompleteTask}
      />
    </div>
  )
}

