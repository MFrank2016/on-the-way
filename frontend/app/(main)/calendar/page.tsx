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
  getYear
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { 
  getWeekNumber, 
  getLunarInfo, 
  formatDateToApiString 
} from '@/lib/calendar-utils'
import { useHolidays } from '@/hooks/useHolidays'
import { cn } from '@/lib/utils'
import TaskPopover from '@/components/TaskPopover'
import TaskDialog from '@/components/TaskDialog'
import DraggableCalendar from '@/components/DraggableCalendar'

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [popoverData, setPopoverData] = useState<{
    tasks: Task[]
    anchorElement: HTMLElement | null
  } | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  
  // 获取当前年份的节假日数据
  const currentYear = getYear(currentMonth)
  const { getDateHolidayInfo } = useHolidays(currentYear)

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

  const handleShowMoreTasks = (tasks: Task[], event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    const target = event.currentTarget.closest('[data-date-cell]') as HTMLElement
    setPopoverData({
      tasks,
      anchorElement: target
    })
  }

  // 获取日历中的所有日期
  const getCalendarDays = () => {
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

    return days
  }

  // 将日期分组为周
  const getWeeks = () => {
    const days = getCalendarDays()
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }
    return weeks
  }

  // 获取指定日期的任务
  const getTasksForDate = (date: Date) => {
    const dateStr = formatDateToApiString(date)
    return tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed' || task.status === 'abandoned') return false
      return task.dueDate === dateStr
    })
  }

  // 获取任务显示的颜色
  const getTaskColor = (task: Task) => {
    const taskList = lists.find(l => l.id === task.listId)
    return taskList?.color || '#3B82F6' // 默认蓝色
  }

  const weeks = getWeeks()

  // 渲染日期单元格内容的函数
  const renderDateCellContent = (
    day: Date,
    dayIndex: number,
    weekIndex: number,
    dayTasks: Task[],
    renderTasksFn: (tasks: Task[]) => React.ReactNode
  ) => {
    const isCurrentMonth = isSameMonth(day, currentMonth)
    const isTodayDate = isToday(day)
    const isMonday = dayIndex === 0
    const lunarInfo = getLunarInfo(day)
    const holidayInfo = getDateHolidayInfo(day)
    const weekNumber = isMonday ? getWeekNumber(day) : undefined

    return (
      <div
        data-date-cell
        className={cn(
          'relative flex flex-col p-1 md:p-2 border-r border-gray-200 last:border-r-0 overflow-hidden h-full',
          !isCurrentMonth && 'bg-gray-50'
        )}
      >
        {/* 日期和农历信息 */}
        <div className="flex items-start justify-between mb-1 flex-shrink-0">
          {/* 左上角：阳历日期 */}
          <div className="flex items-center">
            <span
              className={cn(
                'text-xs md:text-sm font-medium',
                !isCurrentMonth && 'text-gray-400',
                isTodayDate && 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center'
              )}
            >
              {format(day, 'd')}
            </span>
          </div>

          {/* 右上角：周数或农历 */}
          <div className="text-[10px] md:text-xs text-gray-500">
            {weekNumber ? (
              <span className="font-medium">第{weekNumber}周</span>
            ) : (
              <span>{lunarInfo.month || lunarInfo.day}</span>
            )}
          </div>
        </div>

        {/* 节假日/节气 */}
        {(holidayInfo || lunarInfo.term) && (
          <div className="flex-shrink-0 mb-1">
            {holidayInfo && (
              <div className="text-[10px] md:text-xs text-red-500 font-medium truncate">
                {holidayInfo.name}
              </div>
            )}
            {lunarInfo.term && !holidayInfo && (
              <div className="text-[10px] md:text-xs text-orange-500 font-medium truncate">
                {lunarInfo.term}
              </div>
            )}
          </div>
        )}

        {/* 任务列表 */}
        <div className="flex-1 space-y-1 overflow-hidden">
          {renderTasksFn(dayTasks)}
          {dayTasks.length > 3 && (
            <div 
              className="text-[10px] md:text-xs text-gray-500 px-1.5 py-0.5 cursor-pointer hover:bg-gray-100 rounded transition-colors"
              onClick={(e) => handleShowMoreTasks(dayTasks, e)}
            >
              +{dayTasks.length - 3}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 - 固定高度 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
            </h1>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              今天
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="上个月"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="下个月"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 日历主体 - 占满剩余空间 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 星期标题 */}
        <div className="flex-shrink-0 grid grid-cols-7 bg-white border-b border-gray-200">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 日期网格 - 使用DraggableCalendar组件 */}
        <DraggableCalendar
          weeks={weeks}
          tasks={tasks}
          lists={lists}
          currentMonth={currentMonth}
          onTaskClick={handleTaskClick}
          onTasksUpdate={loadTasks}
          getTasksForDate={getTasksForDate}
          getTaskColor={getTaskColor}
          renderDateCell={renderDateCellContent}
        />
      </div>

      {/* 任务悬浮框 */}
      {popoverData && (
        <TaskPopover
          tasks={popoverData.tasks}
          lists={lists}
          anchorElement={popoverData.anchorElement}
          onClose={() => setPopoverData(null)}
          onTaskClick={handleTaskClick}
        />
      )}

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
