import { Solar } from 'lunar-javascript'
import { format, getWeek } from 'date-fns'
import { HolidayInfo, LunarInfo } from '@/types/calendar'

/**
 * 获取ISO周数（一年的第几周）
 */
export function getWeekNumber(date: Date): number {
  return getWeek(date, { weekStartsOn: 1 })
}

/**
 * 获取农历信息
 */
export function getLunarInfo(date: Date): LunarInfo {
  const solar = Solar.fromDate(date)
  const lunar = solar.getLunar()
  
  const day = lunar.getDayInChinese()
  const term = lunar.getJieQi() // 获取节气
  
  // 判断是否是农历初一（需要显示月份）
  let month: string | undefined
  if (lunar.getDay() === 1) {
    month = lunar.getMonthInChinese()
  }
  
  return {
    day,
    month,
    term: term || undefined
  }
}

/**
 * 格式化农历日期显示
 * 如果是初一，显示月份（如"十月"）
 * 否则显示日期（如"十五"）
 */
export function formatLunarDate(date: Date): string {
  const lunarInfo = getLunarInfo(date)
  return lunarInfo.month || lunarInfo.day
}

/**
 * 将Date对象转换为API所需的日期字符串格式 YYYYMMDD
 */
export function formatDateToApiString(date: Date): string {
  return format(date, 'yyyyMMdd')
}

/**
 * 将API日期字符串格式 YYYYMMDD 转换为显示格式
 */
export function parseApiDateString(dateStr: string): Date {
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))
  return new Date(year, month, day)
}

/**
 * 从localStorage获取缓存的节假日数据
 */
function getCachedHolidays(year: number): HolidayInfo[] | null {
  try {
    const cached = localStorage.getItem(`holiday_data_${year}`)
    if (cached) {
      const data = JSON.parse(cached)
      // 检查缓存是否过期（可选：设置30天过期）
      const cacheTime = data.timestamp || 0
      const now = Date.now()
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      
      if (now - cacheTime < thirtyDays) {
        return data.holidays
      }
    }
  } catch (error) {
    console.error('Failed to read cached holidays:', error)
  }
  return null
}

/**
 * 缓存节假日数据到localStorage
 */
function setCachedHolidays(year: number, holidays: HolidayInfo[]) {
  try {
    const data = {
      holidays,
      timestamp: Date.now()
    }
    localStorage.setItem(`holiday_data_${year}`, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to cache holidays:', error)
  }
}

/**
 * 获取节假日数据
 * 优先从localStorage读取，如果没有则从后端API获取
 */
export async function fetchHolidays(year: number): Promise<Map<string, HolidayInfo>> {
  const holidayMap = new Map<string, HolidayInfo>()
  
  try {
    // 1. 先尝试从localStorage读取
    const cached = getCachedHolidays(year)
    if (cached) {
      cached.forEach(holiday => {
        const dateStr = holiday.date.replace(/-/g, '') // 转换为 YYYYMMDD 格式
        holidayMap.set(dateStr, {
          date: dateStr,
          name: holiday.name,
          type: holiday.isOffDay ? 'holiday' : 'festival',
          isOffDay: holiday.isOffDay
        })
      })
      return holidayMap
    }

    // 2. 从后端API获取
    const response = await fetch(`/api/holidays/${year}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.code === 0 && result.data && result.data.days) {
      const holidays: HolidayInfo[] = []
      
      result.data.days.forEach((day: any) => {
        const dateStr = day.date.replace(/-/g, '') // 转换为 YYYYMMDD 格式
        const holidayInfo: HolidayInfo = {
          date: dateStr,
          name: day.name,
          type: day.isOffDay ? 'holiday' : 'festival',
          isOffDay: day.isOffDay
        }
        holidayMap.set(dateStr, holidayInfo)
        holidays.push({
          date: day.date,
          name: day.name,
          type: day.isOffDay ? 'holiday' : 'festival',
          isOffDay: day.isOffDay
        })
      })
      
      // 缓存到localStorage
      setCachedHolidays(year, holidays)
    }
    
    return holidayMap
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
    return holidayMap
  }
}

/**
 * 获取指定日期的节假日信息
 */
export function getHolidayInfo(
  date: Date,
  holidayMap: Map<string, HolidayInfo>
): HolidayInfo | undefined {
  const dateStr = formatDateToApiString(date)
  return holidayMap.get(dateStr)
}

/**
 * 更新任务的截止日期
 */
export function formatTaskDueDate(date: Date, time?: string): string {
  return formatDateToApiString(date)
}

