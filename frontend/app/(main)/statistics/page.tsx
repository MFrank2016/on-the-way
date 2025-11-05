'use client'

import { useEffect, useState, useCallback } from 'react'
import { statisticsAPI } from '@/lib/api'
import { RefreshCw } from 'lucide-react'
import { Statistics, DailyStats, FocusStats, TaskCategoryStats, HeatmapData } from '@/types'
import OverviewTab from '@/components/statistics/OverviewTab'
import TasksTab from '@/components/statistics/TasksTab'
import FocusTab from '@/components/statistics/FocusTab'

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Overview data
  const [overviewStats, setOverviewStats] = useState<Statistics | null>(null)
  const [trendsData, setTrendsData] = useState<DailyStats[]>([])

  // Tasks data
  const [tasksDateRange, setTasksDateRange] = useState('day') // 'day', 'week', 'month'
  const [tasksCurrentDate, setTasksCurrentDate] = useState(new Date())
  const [tasksCategoryData, setTasksCategoryData] = useState<TaskCategoryStats[]>([])
  const [tasksCompletionData, setTasksCompletionData] = useState({
    completed: 0,
    onTime: 0,
    overdue: 0,
    noDueDate: 0,
    uncompleted: 0,
    completionRate: 0,
  })
  const [yesterdayCompleted, setYesterdayCompleted] = useState<number>(0)
  const [tasksCategoryType, setTasksCategoryType] = useState('list') // 'list' or 'tag'

  // Focus data
  const [focusStats, setFocusStats] = useState<FocusStats | null>(null)
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([])
  const [heatmapYear, setHeatmapYear] = useState(new Date().getFullYear())

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        statisticsAPI.getOverview(),
        statisticsAPI.getTrends({ days: 7 }),
      ])
      setOverviewStats(overviewRes.data.data)
      setTrendsData(trendsRes.data.data)
    } catch (error) {
      console.error('Failed to load overview data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadTasksData = useCallback(async () => {
    try {
      let startDate = ''
      let endDate = ''

      if (tasksDateRange === 'day') {
        startDate = endDate = tasksCurrentDate.toISOString().split('T')[0]
      } else if (tasksDateRange === 'week') {
        const weekStart = new Date(tasksCurrentDate)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        startDate = weekStart.toISOString().split('T')[0]
        endDate = weekEnd.toISOString().split('T')[0]
      } else if (tasksDateRange === 'month') {
        const monthStart = new Date(tasksCurrentDate.getFullYear(), tasksCurrentDate.getMonth(), 1)
        const monthEnd = new Date(tasksCurrentDate.getFullYear(), tasksCurrentDate.getMonth() + 1, 0)
        startDate = monthStart.toISOString().split('T')[0]
        endDate = monthEnd.toISOString().split('T')[0]
      }

      const response = await statisticsAPI.getTasksByCategory({ startDate, endDate })
      const categoryData = response.data.data || []
      setTasksCategoryData(categoryData)

      // 计算完成率分布数据（这里先用模拟数据，后续需要后端支持）
      const totalCompleted = categoryData.reduce((sum: number, item: TaskCategoryStats) => sum + item.count, 0)
      setTasksCompletionData({
        completed: totalCompleted,
        onTime: totalCompleted, // 临时使用相同值
        overdue: 0,
        noDueDate: 0,
        uncompleted: 0,
        completionRate: totalCompleted > 0 ? 100 : 0,
      })

      // 如果是查看"按日"模式，获取昨天的数据用于对比
      if (tasksDateRange === 'day') {
        const yesterday = new Date(tasksCurrentDate)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        try {
          const yesterdayResponse = await statisticsAPI.getTasksByCategory({ 
            startDate: yesterdayStr, 
            endDate: yesterdayStr 
          })
          const yesterdayData = yesterdayResponse.data.data || []
          const yesterdayTotal = yesterdayData.reduce((sum: number, item: TaskCategoryStats) => sum + item.count, 0)
          setYesterdayCompleted(yesterdayTotal)
        } catch (error) {
          console.error('Failed to load yesterday data:', error)
          setYesterdayCompleted(0)
        }
      }
    } catch (error) {
      console.error('Failed to load tasks data:', error)
    }
  }, [tasksDateRange, tasksCurrentDate])

  const loadFocusData = useCallback(async () => {
    try {
      const [focusRes, heatmapRes] = await Promise.all([
        statisticsAPI.getFocus(),
        statisticsAPI.getHeatmap(heatmapYear),
      ])
      setFocusStats(focusRes.data.data)
      setHeatmapData(heatmapRes.data.data || [])
    } catch (error) {
      console.error('Failed to load focus data:', error)
    }
  }, [heatmapYear])

  // 手动刷新所有数据
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await loadData()
      if (activeTab === 'tasks') {
        await loadTasksData()
      } else if (activeTab === 'focus') {
        await loadFocusData()
      }
    } finally {
      setRefreshing(false)
    }
  }, [activeTab, loadData, loadTasksData, loadFocusData])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (activeTab === 'tasks') {
      loadTasksData()
    } else if (activeTab === 'focus') {
      loadFocusData()
    }
  }, [activeTab, tasksDateRange, tasksCurrentDate, heatmapYear, loadTasksData, loadFocusData])

  // 当页面重新获得焦点时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时刷新数据
        loadData()
        if (activeTab === 'tasks') {
          loadTasksData()
        } else if (activeTab === 'focus') {
          loadFocusData()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [activeTab, loadData, loadTasksData, loadFocusData])


  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
      {/* 头部 */}
        <div className="mb-4 md:mb-6 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">统计</h1>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{refreshing ? '刷新中...' : '刷新'}</span>
          </button>
      </div>

      {/* 标签页 */}
        <div className="mb-4 md:mb-6">
          <div className="flex gap-2 md:gap-4 bg-white rounded-lg p-1 w-full md:w-auto md:inline-flex">
            {[
              { id: 'overview', label: '总览' },
              { id: 'tasks', label: '任务' },
              { id: 'focus', label: '专注' },
            ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none px-4 md:px-8 py-2 rounded-lg font-medium transition text-sm md:text-base ${
                    activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                {tab.label}
                </button>
            ))}
          </div>
        </div>

        {/* 总览标签页 */}
          {activeTab === 'overview' && overviewStats && (
          <OverviewTab stats={overviewStats} trendsData={trendsData} />
        )}

        {/* 任务标签页 */}
              {activeTab === 'tasks' && (
                <TasksTab
                  dateRange={tasksDateRange}
                  currentDate={tasksCurrentDate}
                  categoryData={tasksCategoryData}
                  completionData={tasksCompletionData}
                  categoryType={tasksCategoryType}
                  yesterdayCompleted={yesterdayCompleted}
                  onDateRangeChange={setTasksDateRange}
                  onDateChange={setTasksCurrentDate}
                  onCategoryTypeChange={setTasksCategoryType}
                />
              )}

        {/* 专注标签页 */}
        {activeTab === 'focus' && focusStats && (
          <FocusTab
            stats={focusStats}
            heatmapData={heatmapData}
            heatmapYear={heatmapYear}
            onHeatmapYearChange={setHeatmapYear}
          />
          )}
      </div>
    </div>
  )
}
