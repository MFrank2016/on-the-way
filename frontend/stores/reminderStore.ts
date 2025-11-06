import { create } from 'zustand'
import { Reminder } from '@/types'
import { reminderAPI } from '@/lib/api'

interface ReminderStore {
  reminders: Reminder[]
  lastFetchTime: number
  pollingInterval: NodeJS.Timeout | null
  
  // 方法
  fetchReminders: () => Promise<void>
  markReminderSent: (reminderId: number) => Promise<void>
  snoozeReminder: (reminderId: number, minutes: number) => Promise<void>
  deleteReminder: (reminderId: number) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  lastFetchTime: 0,
  pollingInterval: null,

  // 获取活跃提醒
  fetchReminders: async () => {
    try {
      const response = await reminderAPI.getActiveReminders()
      const data = response.data
      // 确保返回的是数组
      const remindersData = Array.isArray(data) ? data : (data?.reminders || [])
      set({ 
        reminders: remindersData,
        lastFetchTime: Date.now()
      })
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
      // 出错时确保reminders仍然是数组
      set({ reminders: [] })
    }
  },

  // 标记提醒已发送
  markReminderSent: async (reminderId: number) => {
    try {
      await reminderAPI.markReminderSent(reminderId.toString())
      set((state) => ({
        reminders: state.reminders.filter(r => r.id !== reminderId)
      }))
    } catch (error) {
      console.error('Failed to mark reminder as sent:', error)
    }
  },

  // 延迟提醒
  snoozeReminder: async (reminderId: number, minutes: number) => {
    try {
      await reminderAPI.snoozeReminder(reminderId.toString(), minutes)
      set((state) => ({
        reminders: state.reminders.filter(r => r.id !== reminderId)
      }))
    } catch (error) {
      console.error('Failed to snooze reminder:', error)
    }
  },

  // 删除提醒
  deleteReminder: async (reminderId: number) => {
    try {
      await reminderAPI.deleteReminder(reminderId.toString())
      set((state) => ({
        reminders: state.reminders.filter(r => r.id !== reminderId)
      }))
    } catch (error) {
      console.error('Failed to delete reminder:', error)
    }
  },

  // 开始轮询
  startPolling: () => {
    const { pollingInterval, fetchReminders } = get()
    
    // 如果已经在轮询，先停止
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }

    // 立即获取一次
    fetchReminders()

    // 每30秒检查一次
    const interval = setInterval(() => {
      fetchReminders()
    }, 30000) // 30秒

    set({ pollingInterval: interval })
  },

  // 停止轮询
  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },
}))

