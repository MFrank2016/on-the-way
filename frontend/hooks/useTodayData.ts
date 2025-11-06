import { useState, useEffect } from 'react'
import { taskAPI, listAPI, habitAPI, tagAPI } from '@/lib/api'
import { Task, List, Habit, Tag } from '@/types'
import { useFilterStore } from '@/stores/filterStore'
import { filterTodoTasks, filterCompletedTasks } from '@/lib/taskFilters'

export interface TaskCounts {
  overdue: number
  today: number
  tomorrow: number
  week: number
  further: number
  noDate: number
  completed: number
  inbox: number
}

export interface GroupedTasks {
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  week: Task[]
  further: Task[]
  noDate: Task[]
}

// 最近7天视图的分组数据（按日期分组）
export interface WeekViewGroupedTasks {
  overdue: Task[]
  today: Task[]
  tomorrow: Task[]
  byDate: { date: string; tasks: Task[] }[]  // 后天到7天内的任务，按日期分组
}

export function useTodayData() {
  const { activeFilter } = useFilterStore()
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [todoTasks, setTodoTasks] = useState<Task[]>([])
  const [completedTasks, setCompletedTasks] = useState<Task[]>([])
  const [groupedTasks, setGroupedTasks] = useState<GroupedTasks>({
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    further: [],
    noDate: [],
  })
  const [weekViewGroupedTasks, setWeekViewGroupedTasks] = useState<WeekViewGroupedTasks>({
    overdue: [],
    today: [],
    tomorrow: [],
    byDate: [],
  })
  const [todayHabits, setTodayHabits] = useState<Habit[]>([])
  const [completedHabits, setCompletedHabits] = useState<Habit[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [taskCounts, setTaskCounts] = useState<TaskCounts>({
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

  useEffect(() => {
    loadTasks()
    loadHabits()
  }, [activeFilter])

  // 当任务数据更新时，自动重新计算 groupedTasks（用于"所有"视图）
  useEffect(() => {
    if (activeFilter.type === 'all') {
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      
      const grouped: GroupedTasks = {
        overdue: overdueTasks,
        today: todoTasks.filter((t: Task) => t.dueDate === todayDateStr),
        tomorrow: todoTasks.filter((t: Task) => t.dueDate === tomorrowDateStr),
        week: todoTasks.filter((t: Task) => t.dueDate && t.dueDate > tomorrowDateStr && t.dueDate <= weekDateStr),
        further: todoTasks.filter((t: Task) => t.dueDate && t.dueDate > weekDateStr),
        noDate: todoTasks.filter((t: Task) => !t.dueDate),
      }
      setGroupedTasks(grouped)
    }
  }, [activeFilter.type, todoTasks, overdueTasks])

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
      const allTodoResponse = await taskAPI.getTasks({ status: 'todo' })
      const allTasks = allTodoResponse.data.data || []
      
      const allCompletedResponse = await taskAPI.getTasks({ status: 'completed' })
      const allCompleted = allCompletedResponse.data.data || []
      
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      
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
      const allTodoResponse = await taskAPI.getTasks({ status: 'todo' })
      const allTodoTasks = allTodoResponse.data.data || []
      
      const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      
      // 分离已过期任务
      const overdue = allTodoTasks.filter((t: Task) => t.dueDate && t.dueDate < todayDateStr)
      const notOverdue = allTodoTasks.filter((t: Task) => !t.dueDate || t.dueDate >= todayDateStr)
      
      const filteredTasks = filterTodoTasks(notOverdue, activeFilter)
      const filteredOverdue = filterTodoTasks(overdue, activeFilter)
      
      setOverdueTasks(filteredOverdue)
      setTodoTasks(filteredTasks)
      
      // 为"所有"视图分组任务
      if (activeFilter.type === 'all') {
        const grouped: GroupedTasks = {
          overdue: filteredOverdue,
          today: filteredTasks.filter((t: Task) => t.dueDate === todayDateStr),
          tomorrow: filteredTasks.filter((t: Task) => t.dueDate === tomorrowDateStr),
          week: filteredTasks.filter((t: Task) => t.dueDate && t.dueDate > tomorrowDateStr && t.dueDate <= weekDateStr),
          further: filteredTasks.filter((t: Task) => t.dueDate && t.dueDate > weekDateStr),
          noDate: filteredTasks.filter((t: Task) => !t.dueDate),
        }
        setGroupedTasks(grouped)
      } else {
        setGroupedTasks({
          overdue: [],
          today: [],
          tomorrow: [],
          week: [],
          further: [],
          noDate: [],
        })
      }
      
      // 为"最近7天"视图生成特殊分组
      if (activeFilter.type === 'date' && activeFilter.days === 7) {
        const dayAfterTomorrowDate = new Date()
        dayAfterTomorrowDate.setDate(dayAfterTomorrowDate.getDate() + 2)
        const dayAfterTomorrowDateStr = dayAfterTomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
        
        // 收集后天到7天内的任务，按日期分组
        const tasksByDate: { [key: string]: Task[] } = {}
        
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
      
      const allCompletedResponse = await taskAPI.getTasks({ status: 'completed' })
      const allCompleted = allCompletedResponse.data.data || []
      
      const filteredCompletedTasks = filterCompletedTasks(allCompleted, activeFilter)
      setCompletedTasks(filteredCompletedTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const loadHabits = async () => {
    try {
      // 明天视图不显示习惯
      if (activeFilter.type === 'date' && activeFilter.days === 1) {
        setTodayHabits([])
        setCompletedHabits([])
        return
      }
      
      const response = await habitAPI.getTodayHabits()
      const habits = response.data.data || []
      
      setTodayHabits(habits.filter((h: Habit) => !h.checkedToday))
      setCompletedHabits(habits.filter((h: Habit) => h.checkedToday))
    } catch (error) {
      console.error('Failed to load habits:', error)
    }
  }

  return {
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
    taskCounts,
    setOverdueTasks,
    setTodoTasks,
    setCompletedTasks,
    loadTasks,
    loadTaskCounts,
    loadHabits,
  }
}

