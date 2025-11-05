'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface InlineEditableTitleProps {
  value: string
  onChange: (value: string) => void
  onSave?: (value: string) => void
  className?: string
  placeholder?: string
  autoFocus?: boolean
}

export default function InlineEditableTitle({ 
  value, 
  onChange, 
  onSave,
  className = 'text-xl font-semibold',
  placeholder = '输入标题...',
  autoFocus = false
}: InlineEditableTitleProps) {
  const [isEditing, setIsEditing] = useState(autoFocus)
  const [tempValue, setTempValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = tempValue.trim()
    if (trimmed && trimmed !== value) {
      onChange(trimmed)
      onSave?.(trimmed)
    } else if (!trimmed) {
      setTempValue(value) // 恢复原值
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setTempValue(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          className,
          'w-full bg-transparent border-b-2 border-blue-500 outline-none text-gray-900 placeholder:text-gray-400'
        )}
      />
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        className,
        'cursor-text hover:bg-gray-50 px-2 py-1 -mx-2 -my-1 rounded transition text-gray-900'
      )}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </div>
  )
}

