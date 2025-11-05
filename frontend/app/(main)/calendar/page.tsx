'use client'

import { useEffect, useState } from 'react'
import { taskAPI, listAPI } from '@/lib/api'
import { Task, List } from '@/types'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import TaskDialog from '@/components/TaskDialog'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
    loadLists()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await taskAPI.getTasks()
      setTasks(response.data.data || [])
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLists = async () => {
    try {
      const response = await listAPI.getLists()
      setLists(response.data.data || [])
    } catch (error) {
      console.error('Failed to load lists:', error)
    }
  }

  const handlePrevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDialog(true)
  }

  const handleSaveTask = async (taskData: any) => {
    try {
      if (selectedTask) {
        await taskAPI.updateTask(selectedTask.id, taskData)
      } else {
        await taskAPI.createTask(taskData)
      }
      setShowTaskDialog(false)
      setSelectedTask(null)
      loadTasks()
    } catch (error) {
      console.error('Failed to save task:', error)
      alert('保存失败，请重试')
    }
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(parseISO(task.dueDate), date)
    })
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const days = []
    let day = calendarStart

    while (day <= calendarEnd) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="bg-white rounded-lg shadow">
        {/* 星期标题 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 */}
        <div className="divide-y divide-gray-200">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x divide-gray-200">
              {week.map((day, dayIndex) => {
                const dayTasks = getTasksForDate(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isTodayDate = isToday(day)
                const isSelected = selectedDate && isSameDay(day, selectedDate)

                return (
                  <div
                    key={dayIndex}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[120px] p-2 cursor-pointer transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          !isCurrentMonth
                            ? 'text-gray-400'
                            : isTodayDate
                            ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
                            : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>

                    {/* 任务列表 */}
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTaskClick(task)
                          }}
                          className={`text-xs p-1 rounded truncate cursor-pointer transition-colors ${
                            task.priority === 3
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : task.priority === 2
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : task.priority === 1
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayTasks.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 头部 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
          </h1>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            今天
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 日历 */}
      {renderCalendar()}

      {/* 任务编辑对话框 */}
      {showTaskDialog && (
        <TaskDialog
          task={selectedTask || undefined}
          lists={lists}
          onSave={handleSaveTask}
          onClose={() => {
            setShowTaskDialog(false)
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}

