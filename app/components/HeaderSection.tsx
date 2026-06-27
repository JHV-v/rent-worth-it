'use client'

import { incrementVisitRemote, getVisitStatsRemote, formatCount, type VisitStats } from '../lib/visitCounter'
import { useEffect, useRef, useState } from 'react'

const SESSION_FLAG = '__visit_counted'

// 未来要挂真实链接，把 href 从 null 改成具体 URL 即可
const SOCIAL_LINKS = [
  {
    name: '小红书',
    href: null as string | null,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm5 4h-1v6h1v-2.4l1.7 2.4h1.1l-1.9-2.6c.9-.2 1.4-.8 1.4-1.7 0-1.1-.7-1.7-2-1.7H8Zm.9 2.6H9V10h.9c.5 0 .8.3.8.8s-.3.8-.8.8Zm3.8-2.6v6h3.5v-.9h-2.5v-1.7h2.2v-.9h-2.2V9.9h2.4V9h-3.4Z"/>
      </svg>
    ),
  },
  {
    name: 'B 站',
    href: null as string | null,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M7.17 3.66a1 1 0 0 1 1.41 0L10.66 5.74h2.68l2.08-2.08a1 1 0 1 1 1.42 1.42l-.66.66H18a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h1.82l-.65-.66a1 1 0 0 1 0-1.42ZM6 9.74a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H6Zm2.5 2.5a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Zm7 0a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1Z"/>
      </svg>
    ),
  },
  {
    name: '抖音',
    href: null as string | null,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
        <path d="M15 3v9.5a3.5 3.5 0 1 1-3.5-3.5h.5V12h-.5a2 2 0 1 0 2 2V3h1.5Zm0 0h1.5a4 4 0 0 0 4 4V5.5a2.5 2.5 0 0 1-2.5-2.5H15Z"/>
      </svg>
    ),
  },
] as const

export default function HeaderSection() {
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading')
  const [toast, setToast] = useState<string | null>(null)
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

    const controller = new AbortController()
    const { signal } = controller

    // 兜底：3 秒后还在 loading 状态就强制切到 empty，避免无限转圈
    const safetyTimer = window.setTimeout(() => {
      if (!signal.aborted) {
        setStatus((prev) => (prev === 'loading' ? 'empty' : prev))
      }
    }, 3000)

    ;(async () => {
      try {
        const remote = alreadyCounted
          ? await getVisitStatsRemote()
          : await incrementVisitRemote()
        if (signal.aborted) return
        if (remote.total > 0 || remote.today > 0) {
          setStats(remote)
          setStatus('ready')
          if (!alreadyCounted) {
            try {
              window.sessionStorage.setItem(SESSION_FLAG, '1')
            } catch {
              // ignore
            }
          }
        } else {
          setStatus('empty')
        }
      } catch {
        if (!signal.aborted) setStatus('empty')
      }
    })()

    return () => {
      controller.abort()
      window.clearTimeout(safetyTimer)
    }
  }, [])

  const handleSocialClick = (name: string) => {
    setToast(`${name} 链接敬请期待`)
    window.setTimeout(() => setToast(null), 1800)
  }

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
        <span className="bg-stone-100 text-stone-600 text-xs px-2.5 py-1 rounded-full font-medium">v1.6.1</span>
        <a
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-0.5 text-sm"
          href="https://github.com/JHV-v/rent-worth-it"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="material-symbols-outlined text-sm">code</span> GitHub
        </a>
        <span className="text-stone-300" aria-hidden="true">|</span>
        <div className="flex items-center gap-2">
          {SOCIAL_LINKS.map((s) =>
            s.href ? (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                title={s.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-colors hover:border-primary hover:text-primary"
              >
                {s.icon}
              </a>
            ) : (
              <button
                key={s.name}
                type="button"
                onClick={() => handleSocialClick(s.name)}
                aria-label={`${s.name}（敬请期待）`}
                title={`${s.name}（敬请期待）`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-stone-200 bg-white text-stone-300 transition-colors hover:border-stone-400 hover:text-stone-500"
              >
                {s.icon}
              </button>
            ),
          )}
        </div>
      </div>
      {status === 'loading' && (
        <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
            今日访问: <span className="font-semibold text-on-surface">--</span>
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            总访问: <span className="font-semibold text-on-surface">--</span>
          </span>
        </div>
      )}
      {status === 'ready' && stats && (
        <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            今日访问: <span className="font-semibold text-on-surface">{formatCount(stats.today)}</span>
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">group</span>
            总访问: <span className="font-semibold text-on-surface">{formatCount(stats.total)}</span>
          </span>
        </div>
      )}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-on-surface/90 px-4 py-2 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  )
}
