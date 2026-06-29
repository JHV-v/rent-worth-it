'use client'

import type { RawScoreInput, ScoreResult } from '../../lib/score'
import { beatPercentile, generateCons, generatePros, generateRoast, heroSubtitle, heroTitle } from '../../lib/resultText'

interface SharePosterProps {
  score: ScoreResult
  input: RawScoreInput
  qrCodeUrl: string
}

export default function SharePoster({ score, input, qrCodeUrl }: SharePosterProps) {
  const pros = generatePros(score, input)
  const cons = generateCons(score, input)
  const roast = generateRoast(score, input)
  const percentile = beatPercentile(score.totalScore)

  return (
    <div className="w-[720px] overflow-hidden rounded-[36px] bg-[#f7f8ff] text-on-surface shadow-2xl">
      <div className="relative bg-gradient-to-br from-[#eaf0ff] via-white to-[#fff3e8] px-10 py-12">
        <div className="absolute right-[-80px] top-[-80px] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-90px] left-[-90px] h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />

        <div className="relative space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-extrabold text-primary tracking-tight">这房值不值</div>
              <div className="mt-1 text-sm font-medium text-on-surface-variant">租房性价比精细测算</div>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-primary shadow-sm">分享报告</div>
          </div>

          <div className="rounded-[32px] bg-white/85 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)] ring-1 ring-white/80">
            <div className="flex items-center gap-8">
              <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/25">
                <div className="text-center">
                  <div className="text-6xl font-black leading-none">{score.totalScore}</div>
                  <div className="mt-1 text-sm font-bold opacity-90">综合分</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-4xl font-black tracking-tight text-on-surface">{score.persona}</div>
                <div className="mt-3 text-xl font-bold text-on-surface">{heroTitle(score.persona)}</div>
                <p className="mt-3 text-base leading-relaxed text-on-surface-variant">{heroSubtitle(score.persona)}</p>
                <div className="mt-5 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
                  击败了 {percentile}% 的租房人
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              ['租金压力', `${score.rentRatio}%`],
              ['通勤体验', `${Math.round(score.commuteFeature.mainScore)}`],
              ['居住体验', `${Math.round(score.liveFeature.mainScore)}`],
              ['生活便利', `${Math.round(score.lifeFeature.mainScore)}`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-white/85 p-4 text-center shadow-sm ring-1 ring-white/80">
                <div className="text-xs font-bold text-on-surface-variant">{label}</div>
                <div className="mt-2 text-2xl font-black text-primary">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[28px] bg-white/85 p-5 shadow-sm ring-1 ring-white/80">
              <div className="mb-3 text-base font-black text-green-700">居住优势</div>
              <div className="space-y-2">
                {pros.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-2xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-900">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[28px] bg-white/85 p-5 shadow-sm ring-1 ring-white/80">
              <div className="mb-3 text-base font-black text-orange-700">微小烦恼</div>
              <div className="space-y-2">
                {cons.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-2xl bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-900">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-[#111827] p-6 text-white shadow-xl">
            <div className="mb-2 text-sm font-black text-primary-fixed-dim">AI 辣评</div>
            <p className="text-lg font-bold leading-relaxed">{roast}</p>
          </div>

          <div className="flex items-center justify-between rounded-[28px] bg-white/90 p-5 shadow-sm ring-1 ring-white/80">
            <div>
              <div className="text-lg font-black text-on-surface">扫码测测这房值不值</div>
              <div className="mt-1 text-sm font-medium text-on-surface-variant">别让房租偷走你的生活质量</div>
            </div>
            {qrCodeUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeUrl} alt="这房值不值 二维码" className="h-24 w-24 rounded-2xl bg-white p-2 shadow-sm" />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-stone-100" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
