'use client'

import { FocusStats } from '@/types'
import { Clock } from 'lucide-react'

interface FocusRecordsListProps {
  stats: FocusStats
}

export default function FocusRecordsList({ stats }: FocusRecordsListProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">专注记录</h3>
      <div className="space-y-3 max-h-[200px] overflow-y-auto">
        {stats.focusRecords && stats.focusRecords.length > 0 ? (
          stats.focusRecords.slice(0, 5).map((record) => {
            const startTime = new Date(record.startTime)
            const endTime = record.endTime ? new Date(record.endTime) : null
            return (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {startTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      {endTime && ` - ${endTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                    <div className="text-xs text-gray-500">{record.task?.title || '无关联任务'}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-blue-600">{formatTime(record.duration)}</div>
              </div>
            )
          })
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">
            暂无记录
          </div>
        )}
      </div>
    </div>
  )
}

