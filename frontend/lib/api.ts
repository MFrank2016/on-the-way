import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    // 从 zustand store 获取 token
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除认证状态
      useAuthStore.getState().logout()
      // 跳转到登录页
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
}

// Task API
export const taskAPI = {
  getTasks: (params?: any) => api.get('/tasks', { params }),
  createTask: (data: any) => api.post('/tasks', data),
  getTask: (id: string) => api.get(`/tasks/${id}`),
  updateTask: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  completeTask: (id: string) => api.put(`/tasks/${id}/complete`),
  updatePriority: (id: string, priority: number) => 
    api.put(`/tasks/${id}/priority`, { priority }),
}

// Folder API
export const folderAPI = {
  getFolders: () => api.get('/folders'),
  createFolder: (data: any) => api.post('/folders', data),
  getFolder: (id: string) => api.get(`/folders/${id}`),
  updateFolder: (id: string, data: any) => api.put(`/folders/${id}`, data),
  deleteFolder: (id: string) => api.delete(`/folders/${id}`),
  moveFolder: (id: string, data: { parentId?: string; sortOrder: number }) =>
    api.put(`/folders/${id}/move`, data),
  toggleExpand: (id: string) => api.put(`/folders/${id}/toggle`),
}

// List API
export const listAPI = {
  getLists: () => api.get('/lists'),
  createList: (data: any) => api.post('/lists', data),
  updateList: (id: string, data: any) => api.put(`/lists/${id}`, data),
  deleteList: (id: string) => api.delete(`/lists/${id}`),
  moveList: (id: string, data: { folderId?: string; sortOrder: number }) =>
    api.put(`/lists/${id}/move`, data),
}

// Pomodoro API
export const pomodoroAPI = {
  start: (data: any) => api.post('/pomodoros', data),
  end: (id: string) => api.put(`/pomodoros/${id}`),
  getPomodoros: (params?: any) => api.get('/pomodoros', { params }),
  getTodayStats: () => api.get('/pomodoros/today'),
}

// Habit API
export const habitAPI = {
  getHabits: () => api.get('/habits'),
  createHabit: (data: any) => api.post('/habits', data),
  updateHabit: (id: string, data: any) => api.put(`/habits/${id}`, data),
  deleteHabit: (id: string) => api.delete(`/habits/${id}`),
  checkIn: (id: string, date?: Date) => {
    if (date) {
      // 格式化为 yyyy-MM-dd
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      console.log('Checking in with date:', dateStr) // 调试日志
      return api.post(`/habits/${id}/check`, { date: dateStr })
    }
    console.log('Checking in without date (today)') // 调试日志
    return api.post(`/habits/${id}/check`, {})
  },
  cancelCheckIn: (id: string, date?: Date) => {
    if (date) {
      // 格式化为 yyyy-MM-dd
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      console.log('Cancelling check-in with date:', dateStr) // 调试日志
      return api.delete(`/habits/${id}/check`, { data: { date: dateStr } })
    }
    console.log('Cancelling check-in without date (today)') // 调试日志
    return api.delete(`/habits/${id}/check`, {})
  },
  getRecords: (id: string) => api.get(`/habits/${id}/records`),
}

// Countdown API
export const countdownAPI = {
  getCountdowns: () => api.get('/countdowns'),
  createCountdown: (data: any) => api.post('/countdowns', data),
  updateCountdown: (id: string, data: any) => api.put(`/countdowns/${id}`, data),
  deleteCountdown: (id: string) => api.delete(`/countdowns/${id}`),
}

// Statistics API
export const statisticsAPI = {
  getOverview: () => api.get('/statistics/overview'),
  getDaily: (params?: any) => api.get('/statistics/daily', { params }),
  getTrends: (params?: { range?: 'day' | 'week' | 'month'; chart?: string }) => 
    api.get('/statistics/trends', { params }),
  getFocus: () => api.get('/statistics/focus'),
  getFocusTrends: (params?: { range?: 'day' | 'week' | 'month' }) =>
    api.get('/statistics/focus-trends', { params }),
  getAchievementTrends: (params?: { range?: 'day' | 'week' | 'month' }) =>
    api.get('/statistics/achievement-trends', { params }),
  getHeatmap: (year: number) => api.get('/statistics/heatmap', { params: { year } }),
  getTasksOverview: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/statistics/tasks-overview', { params }),
  getTasksByCategory: (params?: { startDate?: string; endDate?: string }) => 
    api.get('/statistics/tasks-by-category', { params }),
}

// Search API
export const searchAPI = {
  search: (query: string) => api.get('/search', { params: { q: query } }),
}

// Reminder API
export const reminderAPI = {
  getActiveReminders: () => api.get('/reminders/active'),
  markReminderSent: (id: string) => api.put(`/reminders/${id}/sent`),
  snoozeReminder: (id: string, minutes: number) => api.put(`/reminders/${id}/snooze?minutes=${minutes}`),
  deleteReminder: (id: string) => api.delete(`/reminders/${id}`),
}

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data: any) => api.put('/settings', data),
}

