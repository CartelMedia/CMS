'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

let toastListeners = []
let toastQueue = []

export function toast(message, type = 'info', duration = 3500) {
  const id = Date.now() + Math.random()
  const item = { id, message, type }
  toastQueue = [...toastQueue, item]
  toastListeners.forEach(l => l([...toastQueue]))
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    toastListeners.forEach(l => l([...toastQueue]))
  }, duration)
}

toast.success = (msg, d) => toast(msg, 'success', d)
toast.error = (msg, d) => toast(msg, 'error', d)
toast.warning = (msg, d) => toast(msg, 'warning', d)

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'var(--success)',
  error: 'var(--danger)',
  warning: 'var(--warning)',
  info: 'var(--info)',
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastListeners.push(setToasts)
    return () => {
      toastListeners = toastListeners.filter(l => l !== setToasts)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: '1.25rem',
      right: '1.25rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '380px',
      width: '100%',
    }}>
      {toasts.map(t => {
        const Icon = ICONS[t.type] || Info
        const color = COLORS[t.type] || 'var(--info)'
        return (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'rgba(15,15,25,0.95)',
            border: `1px solid ${color}33`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 'var(--radius-md)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'fadeIn 0.25s ease',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
          }}>
            <Icon size={16} style={{ color, flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => {
                toastQueue = toastQueue.filter(q => q.id !== t.id)
                setToasts([...toastQueue])
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
