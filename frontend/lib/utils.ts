import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  
  // 获取今天、昨天、明天等日期（只比较日期，不比较时间）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  
  // 计算天数差
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  // 根据天数差返回相对日期
  if (diffDays === 0) return '今天'
  if (diffDays === -1) return '昨天'
  if (diffDays === -2) return '前天'
  if (diffDays === 1) return '明天'
  if (diffDays === 2) return '后天'
  
  // 7天内显示星期几
  if (diffDays > 2 && diffDays <= 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[d.getDay()]
  }
  
  if (diffDays < -2 && diffDays >= -7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `上${weekdays[d.getDay()]}`
  }
  
  // 同年份只显示月日
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }
  
  // 不同年份显示完整日期
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h${minutes}m`
  }
  return `${minutes}m`
}

// 将 Date 对象转换为日期字符串（格式：20251105）
export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 将 Date 对象转换为时间字符串（格式：18:20）
export function toTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 将 Date 对象转换为日期时间字符串（格式：20251105 18:20）
export function toDateTimeString(date: Date): string {
  return `${toDateString(date)} ${toTimeString(date)}`
}

// 将日期字符串转换为 Date 对象（格式：20251105）
export function fromDateString(dateStr: string): Date | null {
  if (!dateStr || dateStr.length !== 8) return null
  
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  
  return new Date(year, month, day)
}

// 将时间字符串转换为 Date 对象（格式：18:20）
export function fromTimeString(timeStr: string): Date | null {
  if (!timeStr || !timeStr.includes(':')) return null
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  
  return date
}

// 将日期时间字符串转换为 Date 对象（格式：20251105 18:20）
export function fromDateTimeString(datetimeStr: string): Date | null {
  if (!datetimeStr) return null
  
  const parts = datetimeStr.split(' ')
  if (parts.length !== 2) return null
  
  const dateStr = parts[0]
  const timeStr = parts[1]
  
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  
  const [hours, minutes] = timeStr.split(':').map(Number)
  
  return new Date(year, month, day, hours, minutes)
}

// 合并日期和时间字符串
export function combineDateAndTime(dateStr: string, timeStr?: string): string {
  if (!dateStr) return ''
  if (!timeStr) return dateStr
  return `${dateStr} ${timeStr}`
}

// 格式化日期字符串用于显示（将 20251105 转换为人性化格式）
export function formatDateString(dateStr: string, timeStr?: string): string {
  const date = fromDateString(dateStr)
  if (!date) return ''
  
  const formatted = formatDate(date)
  if (timeStr) {
    return `${formatted} ${timeStr}`
  }
  return formatted
}

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

