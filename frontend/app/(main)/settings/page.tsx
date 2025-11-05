'use client'

import { useEffect, useState } from 'react'
import { settingsAPI } from '@/lib/api'
import { UserSettings } from '@/types'
import { Save, Volume2 } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [popupEnabled, setPopupEnabled] = useState(true)
  const [popupSound, setPopupSound] = useState('default')
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [wechatEnabled, setWechatEnabled] = useState(false)
  const [wechatWebhookUrl, setWechatWebhookUrl] = useState('')

  const soundOptions = [
    { value: 'default', label: '默认' },
    { value: 'gentle', label: '柔和' },
    { value: 'alert', label: '警告' },
  ]

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings()
      const data = response.data.data
      setSettings(data)
      setPopupEnabled(data.popupEnabled)
      setPopupSound(data.popupSound || 'default')
      setEmailEnabled(data.emailEnabled)
      setEmailAddress(data.emailAddress || '')
      setWechatEnabled(data.wechatEnabled)
      setWechatWebhookUrl(data.wechatWebhookUrl || '')
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsAPI.updateSettings({
        popupEnabled,
        popupSound,
        emailEnabled,
        emailAddress,
        wechatEnabled,
        wechatWebhookUrl,
      })
      alert('设置已保存')
      loadSettings()
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('保存设置失败')
    } finally {
      setSaving(false)
    }
  }

  const playTestSound = () => {
    const audio = new Audio(`/sounds/${popupSound}.mp3`)
    audio.volume = 0.5
    audio.play().catch(e => console.warn('播放音效失败:', e))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">管理提醒偏好和通知方式</p>
      </div>

      {/* 设置项 */}
      <div className="space-y-6">
        {/* 弹窗提醒 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">弹窗提醒</h3>
              <p className="text-sm text-gray-600 mt-1">在浏览器中显示提醒弹窗</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={popupEnabled}
                onChange={(e) => setPopupEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {popupEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">提醒音效</label>
                <div className="flex items-center gap-2">
                  <select
                    value={popupSound}
                    onChange={(e) => setPopupSound(e.target.value)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {soundOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={playTestSound}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>试听</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 邮件提醒 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">邮件提醒</h3>
              <p className="text-sm text-gray-600 mt-1">通过邮件接收提醒（预留功能）</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {emailEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">邮箱地址</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 企业微信提醒 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">企业微信提醒</h3>
              <p className="text-sm text-gray-600 mt-1">通过企业微信机器人发送提醒（预留功能）</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={wechatEnabled}
                onChange={(e) => setWechatEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {wechatEnabled && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Webhook URL</label>
                <input
                  type="text"
                  value={wechatWebhookUrl}
                  onChange={(e) => setWechatWebhookUrl(e.target.value)}
                  placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
                  className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  请填写企业微信群机器人的 Webhook 地址
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? '保存中...' : '保存设置'}</span>
        </button>
      </div>

      {/* 提示 */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 mb-2">💡 提示</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• 弹窗提醒会在浏览器中显示，需要保持网页打开</li>
          <li>• 邮件和企业微信提醒功能为预留功能，需要后端配置才能使用</li>
          <li>• 建议开启弹窗提醒以获得最佳体验</li>
        </ul>
      </div>
    </div>
  )
}

