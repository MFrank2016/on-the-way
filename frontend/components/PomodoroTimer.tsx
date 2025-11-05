'use client'

import { useEffect, useState } from 'react'
import { usePomodoroStore } from '@/stores/pomodoroStore'
import { Play, Pause, Square, RotateCcw } from 'lucide-react'
import { pomodoroAPI } from '@/lib/api'

export default function PomodoroTimer() {
  const {
    isRunning,
    isPaused,
    timeLeft,
    totalTime,
    currentPomodoroId,
    start,
    pause,
    resume,
    stop,
    tick,
    setCurrentPomodoroId,
  } = usePomodoroStore()

  const [selectedDuration, setSelectedDuration] = useState(25)

  useEffect(() => {
    if (isRunning && !isPaused) {
      const timer = setInterval(() => {
        tick()
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [isRunning, isPaused, tick])

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      handleComplete()
    }
  }, [timeLeft, isRunning])

  const handleStart = async () => {
    try {
      const response = await pomodoroAPI.start({})
      setCurrentPomodoroId(response.data.data.id)
      start(undefined, selectedDuration * 60)
    } catch (error) {
      console.error('Failed to start pomodoro:', error)
    }
  }

  const handleStop = async () => {
    if (currentPomodoroId) {
      try {
        await pomodoroAPI.end(currentPomodoroId)
        stop()
      } catch (error) {
        console.error('Failed to stop pomodoro:', error)
      }
    } else {
      stop()
    }
  }

  const handleComplete = async () => {
    if (currentPomodoroId) {
      try {
        await pomodoroAPI.end(currentPomodoroId)
        // 播放提示音或通知
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('番茄时钟完成！', {
            body: '恭喜你完成了一个番茄时钟，休息一下吧！',
          })
        }
        stop()
      } catch (error) {
        console.error('Failed to complete pomodoro:', error)
      }
    }
  }

  const handleReset = () => {
    stop()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((totalTime - timeLeft) / totalTime) * 100

  return (
    <div className="flex flex-col items-center">
      {/* 计时器显示 */}
      <div className="relative w-80 h-80 mb-8">
        {/* 进度圈 */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#E5E7EB"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="160"
            cy="160"
            r="140"
            stroke="#3B82F6"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 140}`}
            strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* 时间显示 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-gray-900 mb-2">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-500">
            {isRunning ? (isPaused ? '已暂停' : '专注中...') : '准备开始'}
          </div>
        </div>
      </div>

      {/* 时长选择 */}
      {!isRunning && (
        <div className="flex gap-2 mb-6">
          {[15, 25, 30, 45].map((duration) => (
            <button
              key={duration}
              onClick={() => setSelectedDuration(duration)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedDuration === duration
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {duration}分钟
            </button>
          ))}
        </div>
      )}

      {/* 控制按钮 */}
      <div className="flex gap-4">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg"
          >
            <Play className="w-6 h-6" />
            <span className="text-lg font-medium">开始专注</span>
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resume}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg"
              >
                <Play className="w-6 h-6" />
                <span className="text-lg font-medium">继续</span>
              </button>
            ) : (
              <button
                onClick={pause}
                className="flex items-center gap-2 px-8 py-4 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition shadow-lg"
              >
                <Pause className="w-6 h-6" />
                <span className="text-lg font-medium">暂停</span>
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-6 py-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-lg"
            >
              <Square className="w-5 h-5" />
              <span className="text-lg font-medium">停止</span>
            </button>
          </>
        )}

        {isRunning && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition shadow-lg"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>番茄工作法：专注{selectedDuration}分钟，然后休息5分钟</p>
        <p className="mt-1">重复4次后，休息15-30分钟</p>
      </div>
    </div>
  )
}

