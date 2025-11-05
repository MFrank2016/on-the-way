'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code, Link as LinkIcon, Maximize,
  Paperclip, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function RichTextEditor({ content, onChange, placeholder = '添加描述...' }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  })

  if (!editor) {
    return null
  }

  const ToolbarButton = ({ 
    onClick, 
    active, 
    children, 
    title 
  }: { 
    onClick: () => void
    active?: boolean
    children: React.ReactNode
    title: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition',
        active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 编辑器内容区 */}
      <EditorContent editor={editor} className="bg-white" />

      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-2 py-2 bg-gray-50 border-t border-gray-200 flex-wrap">
        {/* 全屏 */}
        <ToolbarButton onClick={() => {}} title="全屏">
          <Maximize className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 标题 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="一级标题"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="二级标题"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="三级标题"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 粗体、斜体、下划线、删除线 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="下划线"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="删除线"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        {/* 高亮 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="高亮"
        >
          <span className="text-sm font-semibold">A</span>
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 列表 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="无序列表"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="有序列表"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive('taskList')}
          title="检查项"
        >
          <CheckSquare className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 引用、代码 */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="引用"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="代码"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* 链接、附件、时间戳 */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('输入链接URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          active={editor.isActive('link')}
          title="插入链接"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {}}
          title="附件"
        >
          <Paperclip className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const now = new Date().toLocaleString('zh-CN')
            editor.chain().focus().insertContent(now).run()
          }}
          title="插入时间戳"
        >
          <Clock className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}

