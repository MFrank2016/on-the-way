'use client'

interface OverviewStatsCardProps {
  todayCompleted: number
  todayPomodoros: number
  todayFocusTime: number
  totalCompleted: number
  totalPomodoros: number
  totalFocusTime: number
}

export default function OverviewStatsCard({
  todayCompleted,
  todayPomodoros,
  todayFocusTime,
  totalCompleted,
  totalPomodoros,
  totalFocusTime,
}: OverviewStatsCardProps) {
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h${minutes}m`
  }

  // 统计项组件
  const StatItem = ({ value, label }: { value: string | number; label: string }) => (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-blue-500 mb-1">{value}</div>
      <div className="text-[10px] sm:text-xs lg:text-sm text-gray-600 leading-tight">{label}</div>
    </div>
  )

  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-sm p-4 md:p-6 lg:p-8">
      <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 mb-3 md:mb-4 lg:mb-6">概览</h3>
      
      {/* 今日统计 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 lg:gap-12 mb-4 md:mb-6 lg:mb-10">
        <StatItem value={todayCompleted} label="今日已完成" />
        <StatItem value={todayPomodoros} label="今日番茄" />
        <StatItem value={formatTime(todayFocusTime)} label="今日专注时长" />
      </div>

      {/* 总计统计 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 lg:gap-12">
        <StatItem value={totalCompleted} label="总已完成" />
        <StatItem value={totalPomodoros} label="总番茄" />
        <StatItem value={formatTime(totalFocusTime)} label="总专注时长" />
      </div>
    </div>
  )
}

