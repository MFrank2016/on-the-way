'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

// 基础颜色
const basicColors = [
  '#EF4444', // 红
  '#F59E0B', // 橙
  '#EAB308', // 黄
  '#84CC16', // 黄绿
  '#10B981', // 绿
  '#06B6D4', // 青
  '#3B82F6', // 蓝
  '#8B5CF6', // 紫
]

// 色系定义
const colorThemes = {
  macaron: {
    name: '马卡龙色系',
    colors: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C9C9FF', '#E0BBE4', '#FFC0CB']
  },
  morandi: {
    name: '莫兰迪色系',
    colors: ['#D4A5A5', '#E6B89C', '#D9E8AE', '#B8D8BA', '#A3D5D3', '#A8C5DD', '#B19CD9', '#D4A5A5']
  },
  rococo: {
    name: '洛可可色系',
    colors: ['#C97064', '#E59866', '#E8D174', '#7FB285', '#5DADE2', '#5499C7', '#7986CB', '#C97064']
  },
  classic: {
    name: '经典色系',
    colors: ['#E74C3C', '#F39C12', '#F4D03F', '#52BE80', '#3498DB', '#5DADE2', '#AF7AC5', '#EC407A']
  },
  geifers: {
    name: '盖非斯色系',
    colors: ['#E53935', '#F4511E', '#FFB300', '#00ACC1', '#00897B', '#7E57C2', '#8E24AA', '#EC407A']
  }
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showPanel, setShowPanel] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false)
      }
    }

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPanel])

  const handleColorClick = (color: string) => {
    onChange(color)
    setShowPanel(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* 基础颜色选择 */}
      <div className="flex items-center gap-2">
        {basicColors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'w-8 h-8 rounded-full transition',
              value === color
                ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                : 'hover:scale-105'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        {/* 更多颜色按钮 */}
        <button
          type="button"
          onClick={() => setShowPanel(!showPanel)}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-purple-400 hover:scale-105 transition flex items-center justify-center"
          title="更多颜色"
        >
          {showPanel ? <span className="text-white text-xs">−</span> : <span className="text-white text-xs">+</span>}
        </button>
      </div>

      {/* 色系面板 */}
      {showPanel && (
        <div className="absolute top-12 left-0 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 w-80">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(colorThemes).map(([key, theme]) => (
              <div key={key}>
                <div className="text-xs text-gray-600 mb-2">{theme.name}</div>
                <div className="grid grid-cols-8 gap-2">
                  {theme.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorClick(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition',
                        value === color
                          ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
                          : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* 自定义颜色 */}
            <div>
              <div className="text-xs text-gray-600 mb-2">自定义颜色</div>
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

