export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0].replace(/-/g, '')
}

export function getTomorrowDateStr(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0].replace(/-/g, '')
}

export function getWeekDateStr(): string {
  const weekDate = new Date()
  weekDate.setDate(weekDate.getDate() + 7)
  return weekDate.toISOString().split('T')[0].replace(/-/g, '')
}

export function formatDateString(date: Date): string {
  return date.toLocaleDateString('zh-CN', { 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  })
}

export function getTomorrowDate(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow
}

/**
 * 解析后端返回的日期字符串（格式：YYYYMMDD，如 20251105）
 * @param dateStr 日期字符串，格式为 YYYYMMDD
 * @returns Date 对象
 */
export function parseDateString(dateStr: string): Date {
  if (!dateStr || dateStr.length !== 8) {
    return new Date()
  }
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1 // 月份从 0 开始
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

