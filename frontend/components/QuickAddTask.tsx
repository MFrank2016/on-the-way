'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

interface QuickAddTaskProps {
  onAdd: (title: string, description?: string) => Promise<void>
  placeholder?: string
}

export default function QuickAddTask({ onAdd, placeholder = '添加任务...' }: QuickAddTaskProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onAdd(title, description || undefined)
      setTitle('')
      setDescription('')
      setIsExpanded(false)
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex items-center gap-2 px-4 py-3 w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-gray-600"
      >
        <Plus className="w-5 h-5" />
        <span>{placeholder}</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border-2 border-blue-400 shadow-md">
      <div className="p-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="任务标题"
          autoFocus
          className="w-full text-lg font-medium outline-none text-gray-900 placeholder:text-gray-400"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="添加描述（可选）"
          rows={2}
          className="w-full text-sm outline-none resize-none text-gray-900 placeholder:text-gray-400"
        />
      </div>
      
      <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 rounded-b-lg border-t">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded transition"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!title.trim() || loading}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '添加中...' : '添加任务'}
        </button>
      </div>
    </form>
  )
}

