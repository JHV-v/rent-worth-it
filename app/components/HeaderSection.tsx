'use client'

import { incrementVisit, incrementVisitRemote, formatCount } from '../lib/visitCounter'
import { useEffect, useRef, useState } from 'react'

const SESSION_FLAG = '__visit_counted'

export default function HeaderSection() {
  const [stats, setStats] = useState<{ today: number; total: number } | null>(null)
  // 防止 React StrictMode 在开发环境下重复执行 effect
  const didRunRef = useRef(false)

  useEffect(() => {
    if (didRunRef.current) return
    didRunRef.current = true

    // session 内去重：避免单次会话内多次刷新页面都计数
    let alreadyCounted = false
    try {
      alreadyCounted = typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_FLAG) === '1'
    } catch {
      // ignore
    }

    if (alreadyCounted) {
      // 已计过：只展示当前本地缓存值，不再 +1
      setStats({ today: 0, total: 0 })
    } else {
      const local = incrementVisit()
      setStats(local)
      try {
        window.sessionStorage.setItem(SESSION_FLAG, '1')
      } catch {
        // ignore
      }
    }

    const controller = new AbortController()
    const { signal } = controller

    ;(async () => {
      // 只有未在本 session 内计过数时才请求远程 +1，否则改成 GET 拉取
      if (alreadyCounted) {
        try {
          const res = await fetch('/api/visit-count', { method: 'GET', signal })
          if (!res.ok) return
          const data: { today: number; total: number; fallback?: boolean } = await res.json()
          if (signal.aborted) return
          if (!data.fallback && (data.total > 0 || data.today > 0)) setStats(data)
        } catch {
          // 静默
        }
        return
      }
      try {
        const remote = await incrementVisitRemote()
        if (signal.aborted) return
        if (remote.total > 0 || remote.today > 0) setStats(remote)
      } catch {
        // 静默
      }
    })()

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="text-center space-y-4">
      <div>
        <h1 className="text-headline-lg font-headline-lg text-on-surface tracking-tight">
          这房值不值
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          租房性价比精细测算 · Rent Worth It
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full font-medium">v1.6.0</span>
        <a
          className="hover:text-primary transition-colors flex items-center gap-0.5"
          href="https://github.com/JHV-v/rent-worth-it"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="material-symbols-outlined text-sm">code</span> GitHub
        </a>
      </div>
      <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          今日访问: <span className="font-semibold text-on-surface">{stats ? formatCount(stats.today) : '--'}</span>
        </span>
        <span className="text-stone-300">|</span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          总访问: <span className="font-semibold text-on-surface">{stats ? formatCount(stats.total) : '--'}</span>
        </span>
      </div>
    </div>
  )
}
