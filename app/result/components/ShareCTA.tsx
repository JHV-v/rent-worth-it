'use client'

import { useState } from 'react'

interface ShareCTAProps {
  onRestart: () => void
  onBack: () => void
  onShareImage: () => Promise<void>
}

export default function ShareCTA({ onRestart, onBack, onShareImage }: ShareCTAProps) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback: ignore
    }
  }

  const handleShare = async () => {
    setSharing(true)
    try {
      await onShareImage()
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-stack-md pt-stack-md pb-stack-lg">
      <button
        type="button"
        onClick={handleShare}
        disabled={sharing}
        className="w-full premium-btn py-5 rounded-full text-white font-headline-sm shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-stack-md"
      >
        <span className="material-symbols-outlined fill-1">ios_share</span>
        {sharing ? '正在生成分享图...' : '生成分享图'}
      </button>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onRestart}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-white border border-outline-variant/30 py-3 sm:py-4 rounded-2xl sm:rounded-full text-on-surface text-xs sm:text-base font-label-md hover:bg-surface-container-low transition-all soft-shadow"
        >
          <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">refresh</span>
          重新测评
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-white border border-outline-variant/30 py-3 sm:py-4 rounded-2xl sm:rounded-full text-on-surface text-xs sm:text-base font-label-md hover:bg-surface-container-low transition-all soft-shadow"
        >
          <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">link</span>
          {copied ? '已复制!' : '复制链接'}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-white border border-outline-variant/30 py-3 sm:py-4 rounded-2xl sm:rounded-full text-on-surface text-xs sm:text-base font-label-md hover:bg-surface-container-low transition-all soft-shadow"
        >
          <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">edit</span>
          重新填写
        </button>
      </div>
    </div>
  )
}
