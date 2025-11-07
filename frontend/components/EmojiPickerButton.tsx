'use client'

import { useState, useRef, useEffect } from 'react'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface EmojiPickerButtonProps {
  value: string
  onChange: (emoji: string) => void
}

export default function EmojiPickerButton({ value, onChange }: EmojiPickerButtonProps) {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji)
    setShowPicker(false)
  }

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-12 h-12 flex items-center justify-center text-2xl border-2 border-gray-300 rounded-lg hover:border-blue-500 transition"
      >
        {value || '😀'}
      </button>

      {showPicker && (
        <div className="absolute top-14 left-0 z-50 shadow-2xl">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={350}
            height={400}
            searchPlaceHolder="搜索..."
            previewConfig={{
              showPreview: false
            }}
          />
        </div>
      )}
    </div>
  )
}

