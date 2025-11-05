'use client'

import { Statistics, DailyStats } from '@/types'
import AchievementScoreChart from './charts/AchievementScoreChart'
import CompletedTasksTrendChart from './charts/CompletedTasksTrendChart'
import CompletionRateTrendChart from './charts/CompletionRateTrendChart'
import PomodoroTrendChart from './charts/PomodoroTrendChart'
import FocusTimeTrendChart from './charts/FocusTimeTrendChart'
import OverviewStatsCard from './overview/OverviewStatsCard'

interface OverviewTabProps {
  stats: Statistics
  trendsData: DailyStats[]
}

export default function OverviewTab({ stats, trendsData }: OverviewTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* 顶部数据卡片 - 四个指标 */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
          <div className="text-center sm:text-left">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">任务</div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 md:mb-1">{stats.totalTasks}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">已完成 {stats.completedTasks}</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">已完成</div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 md:mb-1">{stats.completedTasks}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">清单 {stats.totalLists}</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">清单</div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 md:mb-1">{stats.totalLists}</div>
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-0.5 md:mb-1">使用天数</div>
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-0.5 md:mb-1">{stats.usageDays}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-500 leading-tight">你比 52% 的用户更勤奋</div>
          </div>
        </div>
      </div>

      {/* 概览和成就值 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* 概览统计卡片 */}
        <OverviewStatsCard
          todayCompleted={stats.todayCompleted}
          todayPomodoros={stats.todayPomodoros}
          todayFocusTime={stats.todayFocusTime}
          totalCompleted={stats.completedTasks}
          totalPomodoros={stats.totalPomodoros}
          totalFocusTime={stats.totalFocusTime}
        />

        {/* 我的成就值 */}
        <AchievementScoreChart 
          achievementScore={stats.achievementScore || 2282}
          trendsData={trendsData}
        />
      </div>

      {/* 趋势图表 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <CompletedTasksTrendChart trendsData={trendsData} />
        <CompletionRateTrendChart trendsData={trendsData} />
      </div>

      {/* 番茄和专注时长图表 - 两列布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <PomodoroTrendChart trendsData={trendsData} />
        <FocusTimeTrendChart trendsData={trendsData} />
      </div>
    </div>
  )
}

