import { useState, useEffect } from 'react'
import { fetchHolidays, getHolidayInfo } from '@/lib/calendar-utils'
import { HolidayInfo } from '@/types/calendar'

/**
 * 节假日Hook
 * 自动获取指定年份的节假日数据并缓存
 */
export function useHolidays(year: number) {
  const [holidayMap, setHolidayMap] = useState<Map<string, HolidayInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadHolidays = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchHolidays(year)
        
        if (isMounted) {
          setHolidayMap(data)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load holidays'))
          setLoading(false)
        }
      }
    }

    loadHolidays()

    return () => {
      isMounted = false
    }
  }, [year])

  /**
   * 获取指定日期的节假日信息
   */
  const getDateHolidayInfo = (date: Date): HolidayInfo | undefined => {
    return getHolidayInfo(date, holidayMap)
  }

  return {
    holidayMap,
    loading,
    error,
    getDateHolidayInfo
  }
}

