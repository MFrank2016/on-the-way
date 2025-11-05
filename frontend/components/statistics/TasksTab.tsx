'use client'

import { TaskCategoryStats } from '@/types'
import TasksDateSelector from './tasks/TasksDateSelector'
import TasksOverviewCards from './tasks/TasksOverviewCards'
import CompletionDistributionChart from './tasks/CompletionDistributionChart'
import CategoryStatisticsChart from './tasks/CategoryStatisticsChart'

interface TasksTabProps {
  dateRange: string
  currentDate: Date
  categoryData: TaskCategoryStats[]
  completionData: {
    completed: number
    onTime: number
    overdue: number
    noDueDate: number
    uncompleted: number
    completionRate: number
  }
  categoryType: string
  yesterdayCompleted?: number
  onDateRangeChange: (range: string) => void
  onDateChange: (date: Date) => void
  onCategoryTypeChange: (type: string) => void
}

export default function TasksTab({
  dateRange,
  currentDate,
  categoryData,
  completionData,
  categoryType,
  yesterdayCompleted,
  onDateRangeChange,
  onDateChange,
  onCategoryTypeChange,
}: TasksTabProps) {
  return (
    <div className="space-y-6">
      {/* 日期选择器 */}
      <TasksDateSelector
        dateRange={dateRange}
        currentDate={currentDate}
        onDateRangeChange={onDateRangeChange}
        onDateChange={onDateChange}
      />

      {/* 概览和完成率分布 */}
      <div className="grid grid-cols-2 gap-6">
        <TasksOverviewCards 
          completionData={completionData} 
          yesterdayCompleted={yesterdayCompleted}
        />
        <CompletionDistributionChart completionData={completionData} />
      </div>

      {/* 已完成分类统计 */}
      <CategoryStatisticsChart
        categoryData={categoryData}
        categoryType={categoryType}
        completedCount={completionData.completed}
        onCategoryTypeChange={onCategoryTypeChange}
      />
    </div>
  )
}

