'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import ReminderNotification from '@/components/ReminderNotification'
import { getReminderService } from '@/lib/reminderService'
import { Reminder } from '@/types'
import { habitAPI, taskAPI } from '@/lib/api'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([])

  useEffect(() => {
    // 等待 zustand 恢复数据后再检查认证状态
    if (!_hasHydrated) return
    
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, _hasHydrated, router])

  // 启动提醒服务
  useEffect(() => {
    if (!isAuthenticated) return

    const reminderService = getReminderService()

    // 开始轮询提醒
    reminderService.startPolling((reminders) => {
      setActiveReminders(reminders)
      // 播放音效
      if (reminders.length > 0) {
        reminderService.playSound('default')
      }
    })

    return () => {
      reminderService.stopPolling()
    }
  }, [isAuthenticated])

  // 完成任务或打卡
  const handleComplete = async (reminderId: string) => {
    const reminder = activeReminders.find(r => r.id === reminderId)
    if (!reminder) return

    try {
      if (reminder.entityType === 'habit') {
        await habitAPI.checkIn(reminder.entityId)
      } else if (reminder.entityType === 'task') {
        await taskAPI.completeTask(reminder.entityId)
      }
      
      // 标记提醒已发送
      const reminderService = getReminderService()
      await reminderService.markSent(reminderId)
      
      // 从列表中移除
      setActiveReminders(prev => prev.filter(r => r.id !== reminderId))
    } catch (error) {
      console.error('操作失败:', error)
      alert('操作失败，请重试')
    }
  }

  // 延迟提醒
  const handleSnooze = async (reminderId: string) => {
    const reminderService = getReminderService()
    await reminderService.snooze(reminderId, 10)
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId))
  }

  // 关闭提醒
  const handleDismiss = async (reminderId: string) => {
    const reminderService = getReminderService()
    await reminderService.markSent(reminderId)
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId))
  }

  // 等待水合完成
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  // 未认证则不渲染（让 useEffect 处理跳转）
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">正在跳转...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <Sidebar />
      
      {/* 移动端头部 */}
      <MobileHeader />
      
      {/* 主内容区域 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* 提醒通知 */}
      <ReminderNotification
        reminders={activeReminders}
        onComplete={handleComplete}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
      />
    </div>
  )
}

