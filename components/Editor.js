'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExt from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useCallback } from 'react'
import {
  Bold, Italic, Strikethrough, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Code2, AlignLeft,
} from 'lucide-react'

function ToolbarButton({ onClick, active, title, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '4px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
        color: active ? 'var(--accent)' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!disabled && !active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
}

export default function Editor({ content, onChange, placeholder = 'Start writing…' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExt.configure({ HTMLAttributes: { class: 'editor-image' } }),
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange?.({ json: editor.getJSON(), html: editor.getHTML() })
    },
    editorProps: {
      attributes: {
        style: 'outline: none; min-height: 300px; padding: 1.25rem; font-size: 1rem; line-height: 1.75; color: var(--text-primary);',
      },
    },
  })

  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:')
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  if (!editor) return null

  const charCount = editor.getText().length
  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
      background: 'rgba(255,255,255,0.02)', overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2px',
        padding: '0.5rem 0.625rem', borderBottom: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><Heading3 size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code"><Code size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List"><List size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List"><ListOrdered size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block"><Code2 size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Add Link"><LinkIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={addImage} title="Add Image"><ImageIcon size={14} /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus size={14} /></ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph"><AlignLeft size={14} /></ToolbarButton>
      </div>

      {/* Content */}
      <EditorContent editor={editor} />

      {/* Footer */}
      <div style={{
        padding: '0.375rem 0.75rem', borderTop: '1px solid var(--border)',
        display: 'flex', gap: '1rem',
        fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)',
      }}>
        <span>{wordCount} words</span>
        <span>{charCount} characters</span>
      </div>

      <style>{`
        .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1.25rem 0 0.75rem; color: var(--text-primary); }
        .ProseMirror h2 { font-size: 1.4rem; font-weight: 600; margin: 1rem 0 0.5rem; color: var(--text-primary); }
        .ProseMirror h3 { font-size: 1.15rem; font-weight: 600; margin: 0.875rem 0 0.5rem; color: var(--text-primary); }
        .ProseMirror p { margin: 0 0 0.875rem; }
        .ProseMirror ul, .ProseMirror ol { margin: 0 0 0.875rem 1.5rem; }
        .ProseMirror li { margin: 0.25rem 0; }
        .ProseMirror blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1rem 0; color: var(--text-secondary); font-style: italic; }
        .ProseMirror code { background: rgba(255,255,255,0.08); padding: 0.125rem 0.375rem; border-radius: 4px; font-family: monospace; font-size: 0.875em; }
        .ProseMirror pre { background: rgba(0,0,0,0.3); padding: 1rem; border-radius: var(--radius-md); overflow-x: auto; margin: 0.875rem 0; }
        .ProseMirror pre code { background: none; padding: 0; }
        .ProseMirror a { color: var(--accent); text-decoration: underline; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 1.5rem 0; }
        .ProseMirror .editor-image { max-width: 100%; height: auto; border-radius: var(--radius-md); }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: var(--text-muted); pointer-events: none; position: absolute; }
        .ProseMirror { position: relative; }
      `}</style>
    </div>
  )
}
