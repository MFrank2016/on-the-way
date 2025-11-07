'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Tag } from '@/types'

interface TagDialogProps {
  tag?: Tag | null
  tags?: Tag[]
  onSave: (data: { name: string; color: string; parentId?: number }) => void
  onClose: () => void
}

// 预设色系
const COLOR_PALETTES = {
  '马卡龙色系': ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C9BAFF', '#FFBAF3', '#FFD4BA'],
  '莫兰迪色系': ['#C9B5A0', '#D4C4B0', '#D5D5A8', '#A7C4BC', '#B0C4DE', '#B5B5D5', '#C4AFAF', '#D5B8B8'],
  '洛可可色系': ['#D88A8A', '#E0A862', '#D9C66B', '#78B4A0', '#6B9FC7', '#8585C7', '#B884B8', '#C78A9C'],
  '经典色系': ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E'],
  '孟菲斯色系': ['#FF6B6B', '#FFA500', '#FFD700', '#4ECDC4', '#45B7D1', '#9B59B6', '#E91E63', '#FF6347'],
}

export default function TagDialog({ tag, tags = [], onSave, onClose }: TagDialogProps) {
  const [name, setName] = useState(tag?.name || '')
  const [color, setColor] = useState(tag?.color || '#3B82F6')
  const [parentId, setParentId] = useState<number | undefined>(tag?.parentId || undefined)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#3B82F6')

  // 过滤掉当前标签及其子标签（不能选择自己作为父标签）
  const availableParentTags = tags.filter(t => {
    if (!tag) return true
    if (t.id === tag.id) return false
    if (t.parentId === tag.id) return false
    return true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      color,
      parentId: parentId || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-opacity-25 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {tag ? '编辑标签' : '添加标签'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 标签名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入标签名称"
              className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* 颜色选择 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                颜色
              </label>
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showColorPicker ? '收起' : '展开全部'}
              </button>
            </div>
            
            {/* 当前选中颜色预览 */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-200"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm text-gray-600">{color}</span>
            </div>

            {/* 预设色系 */}
            <div className="space-y-4">
              {Object.entries(COLOR_PALETTES).map(([paletteName, colors]) => (
                <div key={paletteName}>
                  <div className="text-xs text-gray-500 mb-2">{paletteName}</div>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full transition-all ${
                          color === c
                            ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* 自定义颜色 */}
              {showColorPicker && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">自定义颜色</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value)
                        setColor(e.target.value)
                      }}
                      className="w-12 h-12 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value)
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          setColor(e.target.value)
                        }
                      }}
                      placeholder="#3B82F6"
                      className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 上级标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上级标签
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">无</option>
              {availableParentTags
                .filter(t => !t.parentId) // 只显示顶层标签
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

