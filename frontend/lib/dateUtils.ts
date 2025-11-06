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

