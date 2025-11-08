export interface HolidayInfo {
  date: string // 格式：20251231
  name: string
  type: 'holiday' | 'festival'
  isOffDay: boolean
}

export interface LunarInfo {
  day: string // 如：初一、十五
  month?: string // 跨月时显示，如：十月
  term?: string // 节气，如：立春
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  lunarInfo: LunarInfo
  holidayInfo?: HolidayInfo
  weekNumber?: number // 仅周一显示
}

