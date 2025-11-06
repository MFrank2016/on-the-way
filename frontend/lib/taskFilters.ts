import { Task } from '@/types'
import { useFilterStore } from '@/stores/filterStore'

export function filterTodoTasks(allTodoTasks: Task[], activeFilter: any): Task[] {
  const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  
  if (activeFilter.type === 'all') {
    return allTodoTasks
  }
  
  if (activeFilter.type === 'date') {
    if (activeFilter.days === 0) {
      return allTodoTasks.filter((t: Task) => t.dueDate === todayDateStr)
    } else if (activeFilter.days === 1) {
      const tomorrowDate = new Date()
      tomorrowDate.setDate(tomorrowDate.getDate() + 1)
      const tomorrowDateStr = tomorrowDate.toISOString().split('T')[0].replace(/-/g, '')
      return allTodoTasks.filter((t: Task) => t.dueDate === tomorrowDateStr)
    } else if (activeFilter.days === 7) {
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + 7)
      const weekDateStr = weekDate.toISOString().split('T')[0].replace(/-/g, '')
      return allTodoTasks.filter((t: Task) => t.dueDate && t.dueDate <= weekDateStr)
    }
  }
  
  if (activeFilter.type === 'list' && activeFilter.listId) {
    return allTodoTasks.filter((t: Task) => t.listId === activeFilter.listId)
  }
  
  if (activeFilter.type === 'custom' && activeFilter.customFilterId) {
    const filter = (useFilterStore.getState().customFilters || []).find(f => f.id === activeFilter.customFilterId)
    if (filter) {
      return allTodoTasks.filter((t: Task) => {
        const config = filter.filterConfig
        
        if (config.listIds && config.listIds.length > 0) {
          if (!config.listIds.includes(t.listId)) return false
        }
        
        if (config.tagIds && config.tagIds.length > 0) {
          const taskTagIds = t.tags?.map(tag => tag.id) || []
          if (!config.tagIds.some(id => taskTagIds.includes(id))) return false
        }
        
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
        
        if (config.priorities && config.priorities.length > 0) {
          if (!config.priorities.includes(t.priority)) return false
        }
        
        if (config.contentKeyword) {
          if (!t.title.includes(config.contentKeyword)) return false
        }
        
        return true
      })
    }
  }
  
  return allTodoTasks
}

export function filterCompletedTasks(allCompleted: Task[], activeFilter: any): Task[] {
  const todayDateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
  
  if (activeFilter.type === 'all') {
    return allCompleted
  }
  
  if (activeFilter.type === 'date') {
    if (activeFilter.days === 0) {
      return allCompleted.filter((task: any) => {
        if (!task.completedAt) return false
        const completedDate = task.completedAt.substring(0, 8)
        return completedDate === todayDateStr
      })
    } else if (activeFilter.days === 1) {
      return []
    } else if (activeFilter.days === 7) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0].replace(/-/g, '')
      
      return allCompleted.filter((task: any) => {
        if (!task.completedAt) return false
        const completedDate = task.completedAt.substring(0, 8)
        return completedDate >= sevenDaysAgoStr && completedDate <= todayDateStr
      })
    }
  }
  
  if (activeFilter.type === 'list' && activeFilter.listId) {
    return allCompleted.filter((task: Task) => task.listId === activeFilter.listId)
  }
  
  if (activeFilter.type === 'custom' && activeFilter.customFilterId) {
    const filter = (useFilterStore.getState().customFilters || []).find(f => f.id === activeFilter.customFilterId)
    if (filter) {
      return allCompleted.filter((t: Task) => {
        const config = filter.filterConfig
        
        if (config.listIds && config.listIds.length > 0) {
          if (!config.listIds.includes(t.listId)) return false
        }
        
        if (config.tagIds && config.tagIds.length > 0) {
          const taskTagIds = t.tags?.map(tag => tag.id) || []
          if (!config.tagIds.some(id => taskTagIds.includes(id))) return false
        }
        
        if (config.priorities && config.priorities.length > 0) {
          if (!config.priorities.includes(t.priority)) return false
        }
        
        if (config.contentKeyword) {
          if (!t.title.includes(config.contentKeyword)) return false
        }
        
        return true
      })
    }
  }
  
  return allCompleted.filter((task: any) => {
    if (!task.completedAt) return false
    const completedDate = task.completedAt.substring(0, 8)
    return completedDate === todayDateStr
  })
}

