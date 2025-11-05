import { reminderAPI } from './api'
import { Reminder } from '@/types'

export class ReminderService {
  private checkInterval: NodeJS.Timeout | null = null
  private audioContext: AudioContext | null = null
  private onReminderCallback: ((reminders: Reminder[]) => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('音频上下文初始化失败:', e)
      }
    }
  }

  // 开始轮询提醒
  startPolling(callback: (reminders: Reminder[]) => void) {
    this.onReminderCallback = callback
    
    // 立即检查一次
    this.checkReminders()
    
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, 60000) // 60秒
  }

  // 停止轮询
  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  // 检查提醒
  private async checkReminders() {
    try {
      const response = await reminderAPI.getActiveReminders()
      const reminders = response.data.data || []
      
      if (reminders.length > 0 && this.onReminderCallback) {
        this.onReminderCallback(reminders)
      }
    } catch (error) {
      console.error('检查提醒失败:', error)
    }
  }

  // 播放音效
  playSound(soundName: string) {
    if (typeof window === 'undefined') return

    const audio = new Audio(`/sounds/${soundName}.mp3`)
    audio.volume = 0.5
    audio.play().catch(e => console.warn('播放音效失败:', e))
  }

  // 标记提醒已发送
  async markSent(reminderId: string) {
    try {
      await reminderAPI.markReminderSent(reminderId)
    } catch (error) {
      console.error('标记提醒失败:', error)
    }
  }

  // 延迟提醒
  async snooze(reminderId: string, minutes: number = 10) {
    try {
      await reminderAPI.snoozeReminder(reminderId, minutes)
    } catch (error) {
      console.error('延迟提醒失败:', error)
    }
  }

  // 删除提醒
  async delete(reminderId: string) {
    try {
      await reminderAPI.deleteReminder(reminderId)
    } catch (error) {
      console.error('删除提醒失败:', error)
    }
  }
}

// 单例模式
let reminderServiceInstance: ReminderService | null = null

export function getReminderService(): ReminderService {
  if (!reminderServiceInstance) {
    reminderServiceInstance = new ReminderService()
  }
  return reminderServiceInstance
}

