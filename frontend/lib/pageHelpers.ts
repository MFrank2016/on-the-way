import { List } from '@/types'
import { formatDateString, getTomorrowDate } from './dateUtils'

export function getPageTitle(activeFilter: any, lists: List[]): string {
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

export function getPageSubtitle(activeFilter: any): string {
  if (activeFilter.type === 'date' && activeFilter.days === 0) {
    return formatDateString(new Date())
  }
  if (activeFilter.type === 'date' && activeFilter.days === 1) {
    return formatDateString(getTomorrowDate())
  }
  return ''
}

export function getDefaultDueDate(activeFilter: any): Date {
  if (activeFilter.type === 'date' && activeFilter.days === 1) {
    return getTomorrowDate()
  }
  return new Date()
}

