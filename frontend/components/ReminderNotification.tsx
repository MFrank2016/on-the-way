'use client'

import { useEffect } from 'react'
import { X, Clock, Check } from 'lucide-react'
import { useReminderStore } from '@/stores/reminderStore'

export default function ReminderNotification() {
  const { reminders, fetchReminders, markReminderSent, snoozeReminder, startPolling, stopPolling } = useReminderStore()

  useEffect(() => {
    // 组件挂载时开始轮询
    startPolling()

    // 组件卸载时停止轮询
    return () => {
      stopPolling()
    }
  }, [startPolling, stopPolling])

  const handleComplete = async (reminderId: number) => {
    await markReminderSent(reminderId)
    // TODO: 这里可以添加完成任务/习惯的逻辑
  }

  const handleSnooze = async (reminderId: number) => {
    await snoozeReminder(reminderId, 10) // 默认延迟10分钟
  }

  const handleDismiss = async (reminderId: number) => {
    await markReminderSent(reminderId)
  }

  // 确保reminders是数组
  if (!Array.isArray(reminders) || reminders.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {reminders.map((reminder) => {
        const metadata = reminder.metadata ? JSON.parse(reminder.metadata) : {}
        
        return (
          <div
            key={reminder.id}
            className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4 animate-slide-in"
          >
            {/* 头部 */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                {metadata.icon && (
                  <div className="text-2xl">{metadata.icon}</div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {metadata.title || '提醒'}
                  </h4>
                  {metadata.description && (
                    <p className="text-sm text-gray-600">
                      {metadata.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(reminder.reminderTime).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(reminder.id)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {reminder.entityType === 'habit' && (
                <button
                  onClick={() => handleComplete(reminder.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>立即打卡</span>
                </button>
              )}
              {reminder.entityType === 'task' && (
                <button
                  onClick={() => handleComplete(reminder.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>完成任务</span>
                </button>
              )}
              <button
                onClick={() => handleSnooze(reminder.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>稍后提醒</span>
              </button>
            </div>
          </div>
        )
      })}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

