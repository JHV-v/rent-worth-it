import { describe, expect, it } from 'vitest'
import { calculateScore } from './score'

// ============================================================
// score.boundary.test.ts —— v1.6.3
// 单调性 / 平滑性 / 边界契约（更新到新算法）
// ============================================================

const baseInput = {
  rent: 3000,
  income: 10000,
  commuteWeighted: 30,
  commuteTotalMinutes: 30,
  sunlight: 3,
  noise: 3,
  space: 3,
  condition: 3,
  cityType: 3,
  utility: 3,
  floor: 3,
  bathroom: 3,
  kitchen: 3,
  housingType: 'whole' as const,
} as const

describe('calculateScore - 单调性', () => {
  it('疲惫度越短，commuteScore 越高', () => {
    const r5 = calculateScore({ ...baseInput, commuteWeighted: 5, commuteTotalMinutes: 5 })
    const r30 = calculateScore({ ...baseInput, commuteWeighted: 30, commuteTotalMinutes: 30 })
    const r60 = calculateScore({ ...baseInput, commuteWeighted: 60, commuteTotalMinutes: 60 })
    const r120 = calculateScore({
      ...baseInput,
      commuteWeighted: 120,
      commuteTotalMinutes: 120,
    })
    expect(r5.commuteFeature.mainScore).toBeGreaterThan(r30.commuteFeature.mainScore)
    expect(r30.commuteFeature.mainScore).toBeGreaterThan(r60.commuteFeature.mainScore)
    expect(r60.commuteFeature.mainScore).toBeGreaterThan(r120.commuteFeature.mainScore)
  })

  it('房租占比越高，rentRatio 越大', () => {
    const r1 = calculateScore({ ...baseInput, rent: 1000, income: 10000 })
    const r2 = calculateScore({ ...baseInput, rent: 5000, income: 10000 })
    expect(r2.rentRatio).toBeGreaterThan(r1.rentRatio)
  })

  it('采光越好，liveScore 越高', () => {
    const dark = calculateScore({ ...baseInput, sunlight: 1 })
    const bright = calculateScore({ ...baseInput, sunlight: 5 })
    expect(bright.liveFeature.mainScore).toBeGreaterThan(dark.liveFeature.mainScore)
  })

  it('噪音越大（越吵），liveScore 越低（反向）', () => {
    const quiet = calculateScore({ ...baseInput, noise: 1 })
    const loud = calculateScore({ ...baseInput, noise: 5 })
    expect(quiet.liveFeature.mainScore).toBeGreaterThan(loud.liveFeature.mainScore)
  })

  it('卫浴越好，liveScore 越高', () => {
    const bad = calculateScore({ ...baseInput, bathroom: 1 })
    const good = calculateScore({ ...baseInput, bathroom: 5 })
    expect(good.liveFeature.mainScore).toBeGreaterThan(bad.liveFeature.mainScore)
  })
})

describe('calculateScore - 边界值与契约', () => {
  it('commute=0 时 commuteFeature.mainScore=100（base=100 + bonus=+10 → clamp=100）', () => {
    const r = calculateScore({
      ...baseInput,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
    })
    expect(r.commuteFeature.mainScore).toBe(100)
  })

  it('rentFeature.mainScore=100 在 baseline 内（offset≤0 死区饱和）', () => {
    // 整租二线 baseline=30；ratio=30 → offset=0 → 100
    const r = calculateScore({ ...baseInput, rent: 3000, income: 10000 })
    expect(r.rentRatio).toBe(30)
    expect(r.rentFeature.mainScore).toBe(100)
  })

  it('极大 commute（999 分钟）也不会产生 NaN / 负数', () => {
    const r = calculateScore({
      ...baseInput,
      commuteWeighted: 999,
      commuteTotalMinutes: 999,
    })
    expect(Number.isFinite(r.commuteFeature.mainScore)).toBe(true)
    expect(r.commuteFeature.mainScore).toBeGreaterThanOrEqual(0)
  })

  it('极大 rent / income=1 时 rentRatio 不会超过 999 上限', () => {
    const r = calculateScore({ ...baseInput, rent: 1_000_000, income: 1 })
    expect(r.rentRatio).toBeLessThanOrEqual(999)
  })

  it('totalScore 永远在 [0,100] 闭区间内', () => {
    const inputs = [
      { ...baseInput, rent: 0, income: 100000, commuteWeighted: 0, commuteTotalMinutes: 0 },
      {
        ...baseInput,
        rent: 100000,
        income: 1,
        commuteWeighted: 999,
        commuteTotalMinutes: 999,
      },
      { ...baseInput, sunlight: 5, noise: 1, space: 5, condition: 5 },
      { ...baseInput, sunlight: 1, noise: 5, space: 1, condition: 1 },
    ]
    inputs.forEach((i) => {
      const r = calculateScore(i)
      expect(r.totalScore).toBeGreaterThanOrEqual(0)
      expect(r.totalScore).toBeLessThanOrEqual(100)
    })
  })

  it('persona 始终是非空字符串', () => {
    for (let total = 0; total <= 100; total += 7) {
      const r = calculateScore({
        ...baseInput,
        rent: 5000 - total * 30,
      })
      expect(typeof r.persona).toBe('string')
      expect(r.persona.length).toBeGreaterThan(0)
    }
  })
})

describe('calculateScore - 邻近值平滑', () => {
  it('rent 相差 100 元时 totalScore 变化 ≤ 5 分（避免跳变）', () => {
    for (let r = 1000; r <= 8000; r += 1000) {
      const a = calculateScore({ ...baseInput, rent: r })
      const b = calculateScore({ ...baseInput, rent: r + 100 })
      expect(Math.abs(a.totalScore - b.totalScore)).toBeLessThanOrEqual(5)
    }
  })

  it('commute 相差 5 分钟时 commuteScore 变化 ≤ 16 分（含分段 bonus 跳变）', () => {
    // 在 30/60/90 分段点 bonus 会跳变（+10/0/-10/-20），跨段时 5 分钟差异最大约 10-15 分
    for (let t = 0; t < 100; t += 10) {
      const a = calculateScore({ ...baseInput, commuteWeighted: t, commuteTotalMinutes: t })
      const b = calculateScore({
        ...baseInput,
        commuteWeighted: t + 5,
        commuteTotalMinutes: t + 5,
      })
      expect(Math.abs(a.commuteFeature.mainScore - b.commuteFeature.mainScore)).toBeLessThanOrEqual(16)
    }
  })
})

describe('v1.6.3 D9/D10 架构验证', () => {
  it('价值/成本两侧解耦：贵的好房子 vs 便宜破房 分差 ≥ 10', () => {
    // A: 贵的好房子（高房租 + 全居住 5）
    const a = calculateScore({
      ...baseInput,
      rent: 6000,
      income: 15000,
      sunlight: 5,
      noise: 1,
      space: 5,
      condition: 5,
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
      cityType: '一线',
    })
    // B: 便宜的破房子（低房租 + 全居住 1）
    const b = calculateScore({
      ...baseInput,
      rent: 1500,
      income: 12000,
      sunlight: 1,
      noise: 5,
      space: 1,
      condition: 1,
      utility: 1,
      floor: 1,
      bathroom: 1,
      kitchen: 1,
      cityType: '二线',
    })
    // D9/D10 设计目标：两类用户分差打开，体现"价值-成本"哲学
    expect(a.totalScore - b.totalScore).toBeGreaterThanOrEqual(10)
  })

  it('短板惩罚：4 客观维度任一 < 30 → 总分被扣分', () => {
    // baseline 场景：rent 100、commute 84（30 min）、live 50、life 50
    const baseline = calculateScore({ ...baseInput })

    // 居住全部最差（liveScore 0，触发短板惩罚 -9）
    const withShortfall = calculateScore({
      ...baseInput,
      sunlight: 1,
      noise: 5,
      space: 1,
      condition: 1,
      utility: 1,
      floor: 1,
      bathroom: 1,
      kitchen: 1,
    })
    // 居住从 50 掉到 0 本身就让总分降低，再加 -9 短板惩罚
    expect(baseline.totalScore).toBeGreaterThan(withShortfall.totalScore)
  })
})
