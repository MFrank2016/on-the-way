export interface User {
  id: number
  username: string
  email: string
  createdAt: string
  updatedAt: string
}

export interface Folder {
  id: number
  userId: number
  parentId?: number
  name: string
  color?: string
  icon?: string
  sortOrder: number
  isExpanded: boolean
  createdAt: string
  updatedAt: string
  parent?: Folder
  children?: Folder[]
  lists?: List[]
}

export interface List {
  id: number
  userId: number
  folderId?: number
  name: string
  type: 'inbox' | 'today' | 'tomorrow' | 'week' | 'custom'
  color?: string
  icon?: string
  sortOrder: number
  isDefault: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
  folder?: Folder
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'workday' | 'holiday' | 'lunar_monthly' | 'lunar_yearly' | 'custom'
  interval: number
  weekdays?: number[] // 0=周日, 1=周一, ..., 6=周六
  monthDay?: number // 1-31
  lunarDate?: string // 格式: "MM-DD"
  endDate?: string
}

export interface Task {
  id: number
  userId: number
  listId: number
  title: string
  description?: string
  priority: number // 0: 不重要不紧急, 1: 不重要但紧急, 2: 重要不紧急, 3: 重要且紧急
  status: 'todo' | 'completed'
  sortOrder: number
  dueDate: string // 格式：20251105
  dueTime?: string // 格式：18:20
  reminderTime?: string // 格式：20251105 18:20
  completedAt?: string // 格式：20251105 18:20
  isRecurring: boolean
  recurrenceType?: string
  recurrenceInterval?: number
  recurrenceWeekdays?: string
  recurrenceMonthDay?: number
  recurrenceLunarDate?: string
  recurrenceEndDate?: string // 格式：20251231
  parentTaskId?: number
  createdAt: string
  updatedAt: string
  tags?: Tag[]
  list?: List
  parentTask?: Task
}

export interface Tag {
  id: number
  userId: number
  parentId?: number
  name: string
  color: string
  sortOrder: number
  createdAt: string
  parent?: Tag
  children?: Tag[]
}

export interface Pomodoro {
  id: number
  userId: number
  taskId?: number
  startTime: string
  endTime?: string
  duration: number // 秒数
  createdAt: string
  task?: Task
}

export interface Habit {
  id: number
  userId: number
  name: string
  icon: string
  frequency: 'daily' | 'weekly' | 'custom'
  frequencyDays?: string // JSON数组 "[1,2,3,4,5]"
  frequencyInterval?: number
  goalType: 'daily_complete' | 'times_per_day'
  goalCount?: number
  startDate?: string
  endDays?: number // 0 表示永远
  group?: string
  reminderTimes?: string // JSON数组 "[\"19:30\",\"20:00\"]"
  autoJournal: boolean
  createdAt: string
  records?: HabitRecord[]
  currentStreak?: number
  checkedToday?: boolean
}

export interface HabitRecord {
  id: number
  habitId: number
  checkDate: string
  createdAt: string
}

export interface Countdown {
  id: number
  userId: number
  title: string
  targetDate: string
  imageUrl?: string
  type: 'countdown' | 'anniversary'
  createdAt: string
}

export interface Reminder {
  id: number
  userId: number
  entityType: 'task' | 'habit'
  entityId: number
  reminderTime: string
  reminderType: 'popup' | 'email' | 'wechat'
  status: 'pending' | 'sent' | 'failed'
  metadata: string // JSON格式
  createdAt: string
}

export interface UserSettings {
  id: number
  userId: number
  popupEnabled: boolean
  popupSound: string
  emailEnabled: boolean
  emailAddress: string
  wechatEnabled: boolean
  wechatWebhookUrl: string
  createdAt: string
}

export interface Statistics {
  totalTasks: number
  completedTasks: number
  totalLists: number
  usageDays: number
  todayCompleted: number
  todayPomodoros: number
  todayFocusTime: number
  totalPomodoros: number
  totalFocusTime: number
  streakDays: number
  achievementScore: number
  weeklyCheckIn: WeeklyCheckIn[]
}

export interface DailyStats {
  id: number
  userId: number
  date: string
  completedTasks: number
  pomodoroCount: number
  focusTime: number
  createdAt: string
  updatedAt: string
}

export interface TrendData {
  labels: string[]
  completedTasks: number[]
  completionRate: number[]
  pomodoroCount: number[]
  focusTime: number[]
}

export interface FocusStats {
  todayPomodoros: number
  totalPomodoros: number
  todayFocusTime: number
  totalFocusTime: number
  focusDetails: FocusDetail[]
  focusRecords: Pomodoro[]
  focusTrends: DailyStats[]
  bestFocusTime: BestFocusTime[]
}

export interface HeatmapData {
  date: string
  count: number
  level: number // 0-4
}

export interface TaskCategoryStats {
  listId: number
  listName: string
  count: number
  color: string
  [key: string]: string | number
}

export interface BestFocusTime {
  hour: number
  count: number
}

export interface WeeklyCheckIn {
  dayOfWeek: number
  date: string
  hasActivity: boolean
}

export interface FocusDetail {
  taskId: number
  taskTitle: string
  listName: string
  color: string
  duration: number
  [key: string]: string | number
}

export interface Filter {
  id: number
  userId: number
  name: string
  icon?: string
  isPinned: boolean
  sortOrder: number
  filterConfig: FilterConfigData
  createdAt: string
  updatedAt: string
}

export interface FilterConfigData {
  listIds?: number[]
  tagIds?: number[]
  dateType?: 'today' | 'tomorrow' | 'week' | 'overdue' | 'noDate' | 'custom' | 'all'
  dateRange?: { start: string; end: string }
  priorities?: number[]
  contentKeyword?: string
  taskType?: 'all' | 'task' | 'note'
}

