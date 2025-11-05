'use client'

interface TasksOverviewCardsProps {
  completionData: {
    completed: number
    completionRate: number
  }
  yesterdayCompleted?: number
}

export default function TasksOverviewCards({ completionData, yesterdayCompleted }: TasksOverviewCardsProps) {
  // 计算与昨天的差值
  const diffFromYesterday = yesterdayCompleted !== undefined 
    ? completionData.completed - yesterdayCompleted 
    : null

  // 生成比较文字
  const getComparisonText = () => {
    if (diffFromYesterday === null) {
      return { text: '', color: 'text-gray-500', arrow: '' }
    }
    if (diffFromYesterday > 0) {
      return { text: `比前一天多${diffFromYesterday}个`, color: 'text-green-600', arrow: '↑' }
    } else if (diffFromYesterday < 0) {
      return { text: `比前一天少${Math.abs(diffFromYesterday)}个`, color: 'text-red-600', arrow: '↓' }
    } else {
      return { text: '跟前一天持平', color: 'text-gray-600', arrow: '—' }
    }
  }

  const comparison = getComparisonText()

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">概览</h3>
      <div className="grid grid-cols-2 gap-8">
        <div>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {completionData.completed}
          </div>
          <div className="text-sm text-gray-600 mb-1">完成数</div>
          {comparison.text && (
            <div className={`flex items-center gap-1 text-xs ${comparison.color}`}>
              <span>{comparison.text}</span>
              <span>{comparison.arrow}</span>
            </div>
          )}
        </div>
        <div>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {completionData.completionRate.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 mb-1">完成率</div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <span>比前一天多{completionData.completionRate.toFixed(0)}%</span>
            <span>↑</span>
          </div>
        </div>
      </div>
    </div>
  )
}

