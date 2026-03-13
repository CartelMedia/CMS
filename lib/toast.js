'use client'
import { useState, useCallback } from 'react'

let toastQueue = []
let listeners = []

function notify(listeners, toasts) {
  listeners.forEach(l => l(toasts))
}

export function toast(message, type = 'info', duration = 3500) {
  const id = Date.now() + Math.random()
  const item = { id, message, type }
  toastQueue = [...toastQueue, item]
  notify(listeners, toastQueue)
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id)
    notify(listeners, toastQueue)
  }, duration)
}

toast.success = (msg, d) => toast(msg, 'success', d)
toast.error = (msg, d) => toast(msg, 'error', d)
toast.warning = (msg, d) => toast(msg, 'warning', d)

export function useToasts() {
  const [toasts, setToasts] = useState(toastQueue)
  const subscribe = useCallback((fn) => {
    listeners = [...listeners, fn]
    return () => { listeners = listeners.filter(l => l !== fn) }
  }, [])
  useState(() => {
    const unsub = subscribe(setToasts)
    return unsub
  })
  return toasts
}
