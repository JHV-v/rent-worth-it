'use client'

import { Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { mapFormDataToScoreInput, type RentFormData } from '../lib/adapter'
import { calculateScore, type ScoreResult, type RawScoreInput } from '../lib/score'
import { loadRentFormData } from '../lib/storage'
import HeroSection from './components/HeroSection'
import EvaluationSection from './components/EvaluationSection'
import ProsConsSection from './components/ProsConsSection'
import AIRoastSection from './components/AIRoastSection'
import RecommendationsSection from './components/RecommendationsSection'
import ShareCTA from './components/ShareCTA'
import SharePoster from './components/SharePoster'
import ResultFooter from './components/ResultFooter'

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sharePosterRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState<RentFormData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [posterMounted, setPosterMounted] = useState(false)

  useEffect(() => {
    const t = searchParams.get('t')
    const data = loadRentFormData()
    if (data) {
      setFormData(data)
    } else if (!t) {
      router.replace('/')
    }
  }, [searchParams, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    let cancelled = false
    ;(async () => {
      try {
        const QRCode = (await import('qrcode')).default
        const url = await QRCode.toDataURL(window.location.origin, {
          width: 192,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
        })
        if (!cancelled) setQrCodeUrl(url)
      } catch {
        if (!cancelled) setQrCodeUrl('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const score: ScoreResult | null = useMemo(() => {
    if (!formData) return null
    return calculateScore(mapFormDataToScoreInput(formData))
  }, [formData])

  const rawInput: RawScoreInput | null = useMemo(() => {
    if (!formData) return null
    return mapFormDataToScoreInput(formData)
  }, [formData])

  if (!formData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">sentiment_dissatisfied</span>
          <p className="text-on-surface-variant">暂无评测数据，请先填写租房信息</p>
          <p className="text-xs text-on-surface-variant/80 leading-relaxed">
            这是别人的报告链接？测评数据保存在原浏览器中，请用同一浏览器打开，或重新填写测评。
          </p>
          <button
            type="button"
            onClick={() => router.replace('/')}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-on-primary shadow-lg shadow-primary/30 transition-all hover:brightness-110 active:scale-95"
          >
            去填写
          </button>
        </div>
      </div>
    )
  }

  if (!score || !rawInput) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">正在生成你的租房报告...</p>
        </div>
      </div>
    )
  }

  const handleRestart = () => router.push('/')
  const handleBack = () => router.push('/')

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rent-score-${score.totalScore}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleShareImage = async () => {
    try {
      // 延迟挂载海报 DOM，避免一直占用渲染开销
      setPosterMounted(true)
      // 等一帧让 SharePoster 出现在 DOM 中
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

      const node = sharePosterRef.current
      if (!node) {
        alert('分享图生成失败，请稍后重试')
        return
      }

      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.95))
      if (!blob) {
        alert('分享图生成失败，请稍后重试')
        return
      }

      const file = new File([blob], `rent-score-${score.totalScore}.png`, { type: 'image/png' })
      const shareData = {
        title: '我的租房性价比报告',
        text: `我的租房性价比 ${score.totalScore} 分，${score.persona}。你也来测测这房租得值不值。`,
        files: [file],
      }

      if (navigator.canShare?.(shareData)) {
        try {
          await navigator.share(shareData)
          return
        } catch (err) {
          // 用户取消静默忽略
          if (err instanceof Error && err.name === 'AbortError') return
          throw err
        }
      }

      downloadBlob(blob)
    } catch (err) {
      // AbortError 已在内部处理；其它错误兜底提示
      if (err instanceof Error && err.name === 'AbortError') return
      alert('分享图生成失败，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary-fixed-dim">
      <button
        type="button"
        onClick={handleBack}
        aria-label="返回输入页修改"
        className="fixed left-3 top-3 sm:left-4 sm:top-4 z-[100] flex items-center gap-1.5 rounded-full border border-outline-variant/30 bg-primary px-3 py-2 sm:px-4 text-xs sm:text-sm font-semibold text-on-primary shadow-lg shadow-primary/30 transition-all hover:brightness-110 hover:shadow-xl active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        <span className="hidden sm:inline">返回修改</span>
      </button>

      <header className="bg-white/70 backdrop-blur-xl border-b border-outline-variant/30 fixed w-full top-0 z-50">
        <div className="flex justify-between items-center px-margin-desktop h-16 w-full max-w-container-max mx-auto">
          <div className="text-headline-md font-headline-md font-bold text-primary tracking-tight">RentScore AI</div>
        </div>
      </header>

      <main className="report-gradient pb-stack-lg pt-16">
        <div className="max-w-[800px] mx-auto px-margin-mobile md:px-0 pt-stack-lg space-y-gutter">
          <HeroSection totalScore={score.totalScore} persona={score.persona} />
          <EvaluationSection score={score} input={rawInput} />
          <ProsConsSection score={score} input={rawInput} />
          <AIRoastSection score={score} input={rawInput} />
          <RecommendationsSection score={score} />
          {posterMounted && (
            <div className="fixed left-[-9999px] top-0 pointer-events-none" aria-hidden="true">
              <div ref={sharePosterRef}>
                <SharePoster score={score} input={rawInput} qrCodeUrl={qrCodeUrl} />
              </div>
            </div>
          )}
          <ShareCTA onRestart={handleRestart} onBack={handleBack} onShareImage={handleShareImage} />
        </div>
      </main>

      <ResultFooter />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-surface">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-on-surface-variant">正在生成你的租房报告...</p>
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
