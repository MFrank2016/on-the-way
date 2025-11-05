# 提醒音效文件

本目录用于存放提醒音效文件。

## 需要的音效文件

请在此目录下添加以下音效文件：

1. **default.mp3** - 默认提醒音
2. **gentle.mp3** - 柔和提醒音
3. **alert.mp3** - 警告提醒音

## 音效文件要求

- 格式：MP3
- 时长：建议 1-3 秒
- 音量：适中，不刺耳

## 获取音效文件

你可以从以下来源获取免费的音效文件：

1. **Freesound** (https://freesound.org)
2. **Zapsplat** (https://www.zapsplat.com)
3. **Notification Sounds** (https://notificationsounds.com)

或者使用在线文本转语音工具生成简单的提示音。

## 示例代码

音效在以下场景中会被播放：

- 习惯提醒到达时
- 任务提醒到达时
- 用户在设置页面试听音效时

播放代码位于 `frontend/lib/reminderService.ts` 中。

