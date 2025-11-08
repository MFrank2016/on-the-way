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
 * 获取节假日数据
 * 使用 https://timor.tech/api/holiday/ API
 */
export async function fetchHolidays(year: number): Promise<Map<string, HolidayInfo>> {
  try {
    const response = await fetch(`https://timor.tech/api/holiday/year/${year}/`)
    const data = await response.json()
    
    const holidayMap = new Map<string, HolidayInfo>()
    
    if (data.code === 0 && data.holiday) {
      // 遍历所有月份的节假日数据
      Object.keys(data.holiday).forEach((dateKey) => {
        const holidayData = data.holiday[dateKey]
        const dateStr = dateKey.replace(/-/g, '') // 转换为 YYYYMMDD 格式
        
        holidayMap.set(dateStr, {
          date: dateStr,
          name: holidayData.name,
          type: holidayData.wage === 3 ? 'holiday' : 'festival',
          isOffDay: holidayData.wage === 3 || holidayData.wage === 2
        })
      })
    }
    
    return holidayMap
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
    return new Map()
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

