import { Task, Tag, List } from '@/types'

// 任务分组类型
export interface TaskGroup {
  id: string
  label: string
  tasks: Task[]
  sortOrder: number
}

// 按时间分组任务
export function groupTasksByTime(tasks: Task[]): TaskGroup[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = formatDate(today)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = formatDate(tomorrow)
  
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)
  const sevenDaysStr = formatDate(sevenDaysLater)

  const groups: Record<string, Task[]> = {
    overdue: [],      // 已过期
    today: [],        // 今天
    tomorrow: [],     // 明天
    week: [],         // 最近7天
    later: [],        // 更远
    noDate: [],       // 无日期
    completed: [],    // 已完成
  }

  tasks.forEach((task) => {
    // 已完成和已放弃任务单独分组
    if (task.status === 'completed' || task.status === 'abandoned') {
      groups.completed.push(task)
      return
    }

    // 无日期
    if (!task.dueDate) {
      groups.noDate.push(task)
      return
    }

    const dueDate = task.dueDate

    // 已过期
    if (dueDate < todayStr) {
      groups.overdue.push(task)
    }
    // 今天
    else if (dueDate === todayStr) {
      groups.today.push(task)
    }
    // 明天
    else if (dueDate === tomorrowStr) {
      groups.tomorrow.push(task)
    }
    // 最近7天
    else if (dueDate <= sevenDaysStr) {
      groups.week.push(task)
    }
    // 更远
    else {
      groups.later.push(task)
    }
  })

  const result: TaskGroup[] = []
  
  if (groups.overdue.length > 0) {
    result.push({ id: 'overdue', label: '已过期', tasks: groups.overdue, sortOrder: 1 })
  }
  if (groups.today.length > 0) {
    result.push({ id: 'today', label: '今天', tasks: groups.today, sortOrder: 2 })
  }
  if (groups.tomorrow.length > 0) {
    result.push({ id: 'tomorrow', label: '明天', tasks: groups.tomorrow, sortOrder: 3 })
  }
  if (groups.week.length > 0) {
    result.push({ id: 'week', label: '最近7天', tasks: groups.week, sortOrder: 4 })
  }
  if (groups.later.length > 0) {
    result.push({ id: 'later', label: '更远', tasks: groups.later, sortOrder: 5 })
  }
  if (groups.noDate.length > 0) {
    result.push({ id: 'noDate', label: '无日期', tasks: groups.noDate, sortOrder: 6 })
  }
  if (groups.completed.length > 0) {
    result.push({ id: 'completed', label: '已完成 & 已放弃', tasks: groups.completed, sortOrder: 7 })
  }

  return result
}

// 按清单分组任务
export function groupTasksByList(tasks: Task[], lists: List[]): TaskGroup[] {
  // 分离待办任务和已完成/已放弃任务
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const completedOrAbandoned = tasks.filter(t => t.status === 'completed' || t.status === 'abandoned')
  
  const groupMap = new Map<number, Task[]>()
  const noListTasks: Task[] = []

  todoTasks.forEach((task) => {
    if (task.listId) {
      if (!groupMap.has(task.listId)) {
        groupMap.set(task.listId, [])
      }
      groupMap.get(task.listId)!.push(task)
    } else {
      noListTasks.push(task)
    }
  })

  const result: TaskGroup[] = []
  
  lists.forEach((list, index) => {
    const listTasks = groupMap.get(list.id)
    if (listTasks && listTasks.length > 0) {
      result.push({
        id: `list-${list.id}`,
        label: `${list.icon || '📋'} ${list.name}`,
        tasks: listTasks,
        sortOrder: index,
      })
    }
  })

  if (noListTasks.length > 0) {
    result.push({
      id: 'no-list',
      label: '无清单',
      tasks: noListTasks,
      sortOrder: lists.length,
    })
  }

  // 添加已完成 & 已放弃分组
  if (completedOrAbandoned.length > 0) {
    result.push({
      id: 'completed',
      label: '已完成 & 已放弃',
      tasks: completedOrAbandoned,
      sortOrder: lists.length + 1,
    })
  }

  return result
}

// 按标签分组任务
export function groupTasksByTag(tasks: Task[], tags: Tag[]): TaskGroup[] {
  // 分离待办任务和已完成/已放弃任务
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const completedOrAbandoned = tasks.filter(t => t.status === 'completed' || t.status === 'abandoned')
  
  const groupMap = new Map<number, Task[]>()
  const noTagTasks: Task[] = []

  todoTasks.forEach((task) => {
    if (task.tags && task.tags.length > 0) {
      // 一个任务可能有多个标签，这里按第一个标签分组
      const firstTag = task.tags[0]
      if (!groupMap.has(firstTag.id)) {
        groupMap.set(firstTag.id, [])
      }
      groupMap.get(firstTag.id)!.push(task)
    } else {
      noTagTasks.push(task)
    }
  })

  const result: TaskGroup[] = []
  
  tags.forEach((tag, index) => {
    const tagTasks = groupMap.get(tag.id)
    if (tagTasks && tagTasks.length > 0) {
      result.push({
        id: `tag-${tag.id}`,
        label: tag.name,
        tasks: tagTasks,
        sortOrder: index,
      })
    }
  })

  if (noTagTasks.length > 0) {
    result.push({
      id: 'no-tag',
      label: '无标签',
      tasks: noTagTasks,
      sortOrder: tags.length,
    })
  }

  // 添加已完成 & 已放弃分组
  if (completedOrAbandoned.length > 0) {
    result.push({
      id: 'completed',
      label: '已完成 & 已放弃',
      tasks: completedOrAbandoned,
      sortOrder: tags.length + 1,
    })
  }

  return result
}

// 按优先级分组任务
export function groupTasksByPriority(tasks: Task[]): TaskGroup[] {
  // 分离待办任务和已完成/已放弃任务
  const todoTasks = tasks.filter(t => t.status === 'todo')
  const completedOrAbandoned = tasks.filter(t => t.status === 'completed' || t.status === 'abandoned')
  
  const priorityLabels: Record<number, string> = {
    3: '高优先级',
    2: '中优先级',
    1: '低优先级',
    0: '无优先级',
  }

  const groups: Record<number, Task[]> = {
    3: [],
    2: [],
    1: [],
    0: [],
  }

  todoTasks.forEach((task) => {
    const priority = task.priority ?? 0
    groups[priority].push(task)
  })

  const result: TaskGroup[] = []
  
  // 按优先级从高到低排列
  ;[3, 2, 1, 0].forEach((priority, index) => {
    if (groups[priority].length > 0) {
      result.push({
        id: `priority-${priority}`,
        label: priorityLabels[priority],
        tasks: groups[priority],
        sortOrder: index,
      })
    }
  })

  // 添加已完成 & 已放弃分组
  if (completedOrAbandoned.length > 0) {
    result.push({
      id: 'completed',
      label: '已完成 & 已放弃',
      tasks: completedOrAbandoned,
      sortOrder: 4,
    })
  }

  return result
}

// 任务排序函数
export function sortTasks(
  tasks: Task[],
  sortBy: 'time' | 'title' | 'tag' | 'priority',
  sortOrder: 'asc' | 'desc'
): Task[] {
  const sorted = [...tasks]

  sorted.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'time':
        // 按时间排序：无日期的排在最后
        if (!a.dueDate && !b.dueDate) {
          comparison = 0
        } else if (!a.dueDate) {
          comparison = 1
        } else if (!b.dueDate) {
          comparison = -1
        } else {
          // 比较日期字符串
          comparison = a.dueDate.localeCompare(b.dueDate)
          // 如果日期相同，比较时间
          if (comparison === 0 && a.dueTime && b.dueTime) {
            comparison = a.dueTime.localeCompare(b.dueTime)
          }
        }
        break

      case 'title':
        comparison = a.title.localeCompare(b.title, 'zh-CN')
        break

      case 'tag':
        // 按标签名称排序，无标签的排在最后
        const aTagName = a.tags && a.tags.length > 0 ? a.tags[0].name : ''
        const bTagName = b.tags && b.tags.length > 0 ? b.tags[0].name : ''
        if (!aTagName && !bTagName) {
          comparison = 0
        } else if (!aTagName) {
          comparison = 1
        } else if (!bTagName) {
          comparison = -1
        } else {
          comparison = aTagName.localeCompare(bTagName, 'zh-CN')
        }
        break

      case 'priority':
        // 按优先级排序，数字越大优先级越高
        comparison = (b.priority ?? 0) - (a.priority ?? 0)
        break
    }

    return sortOrder === 'desc' ? -comparison : comparison
  })

  return sorted
}

// 格式化日期为 YYYYMMDD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

