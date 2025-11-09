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
import TodayTasksPanel from '@/components/TodayTasksPanel'

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

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      if (selectedTask) {
        await taskAPI.updateTask(selectedTask.id.toString(), taskData)
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

  // 渲染移动端日期单元格
  const renderMobileDateCell = (day: Date) => {
    const isCurrentMonth = isSameMonth(day, currentMonth)
    const isTodayDate = isToday(day)
    const lunarInfo = getLunarInfo(day)
    const holidayInfo = getDateHolidayInfo(day)
    
    return (
      <div 
        className="flex flex-col items-center justify-center py-4 border-b border-r border-gray-100 last:border-r-0"
        onClick={() => {
          // 移动端点击日期可以查看当天任务或创建任务
        }}
      >
        {/* 日期数字 */}
        <div className={cn(
          'text-xl font-medium mb-1',
          isTodayDate && 'w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center',
          !isTodayDate && isCurrentMonth && 'text-gray-900',
          !isCurrentMonth && 'text-gray-400'
        )}>
          {format(day, 'd')}
        </div>
        
        {/* 农历/节假日/节气信息 */}
        <div className="text-[10px] text-center">
          {holidayInfo ? (
            holidayInfo.isOffDay ? (
              <span className="text-red-500 font-medium">{holidayInfo.name}</span>
            ) : (
              <span className="text-orange-500 font-medium">{holidayInfo.name.length > 4 ? holidayInfo.name.substring(0, 4) : holidayInfo.name}</span>
            )
          ) : lunarInfo.term ? (
            <span className="text-green-600 font-medium">{lunarInfo.term}</span>
          ) : (
            <span className="text-gray-500">{lunarInfo.month || lunarInfo.day}</span>
          )}
        </div>
      </div>
    )
  }

  // 渲染日期单元格内容的函数（桌面端）
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
          'relative flex flex-col p-2 md:p-3 border border-gray-200 overflow-hidden h-full',
          'hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer',
          !isCurrentMonth && 'bg-gray-50/50',
          isTodayDate && 'bg-blue-50'
        )}
      >
        {/* 日期头部 */}
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          {/* 左上角：日期数字 - 始终显示 */}
          <span
            className={cn(
              'text-sm md:text-base font-semibold min-w-[1.5rem]',
              !isCurrentMonth && 'text-gray-500',
              isCurrentMonth && !isTodayDate && 'text-gray-800',
              isTodayDate && 'text-blue-600'
            )}
          >
            {format(day, 'd')}
          </span>

          {/* 右上角：按优先级显示信息 */}
          <div className="text-[10px] md:text-xs">
            {holidayInfo ? (
              holidayInfo.isOffDay ? (
                <span className="text-red-500 font-medium">{holidayInfo.name}</span>
              ) : (
                <span className="text-orange-500 font-medium">{holidayInfo.name}(调休)</span>
              )
            ) : lunarInfo.term ? (
              <span className="text-orange-500 font-medium">{lunarInfo.term}</span>
            ) : weekNumber ? (
              <span className="text-gray-500 font-medium">第{weekNumber}周</span>
            ) : (
              <span className="text-gray-500">{lunarInfo.month || lunarInfo.day}</span>
            )}
          </div>
        </div>

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

  // 获取今天的任务
  const todayTasks = getTasksForDate(new Date())

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 - 移动端和桌面端不同 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        {/* 移动端导航 */}
        <div className="md:hidden px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button className="p-2">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <button className="p-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              <button className="p-2">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-gray-600"
              aria-label="上个月"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              {format(currentMonth, 'M月', { locale: zhCN })}
            </h1>
            <button
              onClick={handleNextMonth}
              className="p-1 text-gray-600"
              aria-label="下个月"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* 桌面端导航（保持现有） */}
        <div className="hidden md:block px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
              </h1>
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
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                今天
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 日历主体 - 占满剩余空间 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 星期标题 - 移动端和桌面端不同 */}
        {/* 移动端：单字 */}
        <div className="md:hidden flex-shrink-0 grid grid-cols-7 bg-white border-b border-gray-200">
          {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* 桌面端：完整周名 */}
        <div className="hidden md:grid flex-shrink-0 grid-cols-7 bg-white border-b border-gray-200">
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* 移动端：简化日期网格 */}
        <div className="md:hidden flex-1 overflow-y-auto bg-white">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {week.map((day, dayIndex) => (
                <div key={dayIndex}>
                  {renderMobileDateCell(day)}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* 桌面端：完整功能日期网格 */}
        <div className="hidden md:block flex-1">
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

      {/* 移动端：今日任务面板 */}
      <TodayTasksPanel 
        tasks={todayTasks}
        onTaskClick={handleTaskClick}
      />

      {/* 移动端：悬浮操作按钮 */}
      <button 
        onClick={() => setShowTaskDialog(true)}
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-orange-500 rounded-full shadow-lg flex items-center justify-center text-white text-3xl active:bg-orange-600 transition-colors z-40"
      >
        +
      </button>
    </div>
  )
}
