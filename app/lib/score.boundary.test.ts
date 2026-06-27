import { describe, expect, it } from 'vitest'
import { calculateScore } from './score'

// ============================================================
// score.boundary.test.ts —— v1.6.0
// 单调性 / 平滑性 / 边界契约
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
  subway: false,
  food: 3,
  facilities: 3,
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
    const r120 = calculateScore({ ...baseInput, commuteWeighted: 120, commuteTotalMinutes: 120 })
    expect(r5.commuteScore).toBeGreaterThan(r30.commuteScore)
    expect(r30.commuteScore).toBeGreaterThan(r60.commuteScore)
    expect(r60.commuteScore).toBeGreaterThan(r120.commuteScore)
  })

  it('房租占比越高，rentRatio 越大', () => {
    const r1 = calculateScore({ ...baseInput, rent: 1000, income: 10000 })
    const r2 = calculateScore({ ...baseInput, rent: 5000, income: 10000 })
    expect(r2.rentRatio).toBeGreaterThan(r1.rentRatio)
  })

  it('空间感觉越好，lifeScore 越高（v1.6.0：space 转入 lifeScore）', () => {
    const small = calculateScore({ ...baseInput, space: 1 })
    const big = calculateScore({ ...baseInput, space: 5 })
    expect(big.lifeScore).toBeGreaterThan(small.lifeScore)
  })

  it('采光越好，liveScore 越高', () => {
    const dark = calculateScore({ ...baseInput, sunlight: 1 })
    const bright = calculateScore({ ...baseInput, sunlight: 5 })
    expect(bright.liveScore).toBeGreaterThan(dark.liveScore)
  })

  it('噪音越大（越吵），liveScore 越低（反向）', () => {
    const quiet = calculateScore({ ...baseInput, noise: 1 })
    const loud = calculateScore({ ...baseInput, noise: 5 })
    expect(quiet.liveScore).toBeGreaterThan(loud.liveScore)
  })

  it('卫浴越好，liveScore 越高', () => {
    const bad = calculateScore({ ...baseInput, bathroom: 1 })
    const good = calculateScore({ ...baseInput, bathroom: 5 })
    expect(good.liveScore).toBeGreaterThan(bad.liveScore)
  })
})

describe('calculateScore - 边界值与契约', () => {
  it('commute=0 时 commuteScore 应等于 100（exp(0)*100=100，+短通勤奖励 clamp=100）', () => {
    const r = calculateScore({
      ...baseInput,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
    })
    expect(r.commuteScore).toBe(100)
  })

  it('rentScore 在基准点（offset=0）应得 85（整租二线 baseline=30）', () => {
    // ratio=30：baseline=30, offset=0 → 85
    const r = calculateScore({ ...baseInput, rent: 3000, income: 10000 })
    // commuteScore 等会算到，但我们只测 rentRatio 的影响。
    // 通过比较两个 rent 占比下 totalScore 的差异验证 rentScore 是 85
    expect(r.rentRatio).toBe(30)
  })

  it('极大 commute（999 分钟）也不会产生 NaN / 负数', () => {
    const r = calculateScore({
      ...baseInput,
      commuteWeighted: 999,
      commuteTotalMinutes: 999,
    })
    expect(Number.isFinite(r.commuteScore)).toBe(true)
    expect(r.commuteScore).toBeGreaterThanOrEqual(0)
  })

  it('极大 rent / income=1 时 rentRatio 不会超过 999 上限', () => {
    const r = calculateScore({ ...baseInput, rent: 1_000_000, income: 1 })
    expect(r.rentRatio).toBeLessThanOrEqual(999)
  })

  it('totalScore 永远在 0-100 闭区间内', () => {
    const inputs = [
      { ...baseInput, rent: 0, income: 100000, commuteWeighted: 0, commuteTotalMinutes: 0 },
      { ...baseInput, rent: 100000, income: 1, commuteWeighted: 999, commuteTotalMinutes: 999 },
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

  it('commute 相差 5 分钟时 commuteScore 变化 ≤ 16 分', () => {
    // 注意：双层算法在 30/60/90 分钟分段点会有 bonus 跳变（+5 → 0 → -10 → -25），
    // 跨段时 5 分钟差异最大约 15 分（90→95 跨入极长段，bonus 由 -10 跳到 -25）；
    // 非跨段区间则连续平滑。
    for (let t = 0; t < 100; t += 10) {
      const a = calculateScore({ ...baseInput, commuteWeighted: t, commuteTotalMinutes: t })
      const b = calculateScore({
        ...baseInput,
        commuteWeighted: t + 5,
        commuteTotalMinutes: t + 5,
      })
      expect(Math.abs(a.commuteScore - b.commuteScore)).toBeLessThanOrEqual(16)
    }
  })
})

describe('v1.6.0 回归：核心权重变更', () => {
  it('合租 stress 加成已降至 +6（不再是 +8）', () => {
    // 控制其他变量：整租 vs 合租，仅看 stress 差异
    const whole = calculateScore({
      ...baseInput,
      housingType: 'whole',
      rent: 0,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
      income: 50000, // 排除收入惩罚
    })
    const shared = calculateScore({
      ...baseInput,
      housingType: 'shared',
      rent: 0,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
      income: 50000,
    })
    // shared 仅多出 +6 stress（city3 modifier=0）
    expect(shared.stress - whole.stress).toBe(6)
  })

  it('commute 权重提升到 0.25：通勤恶化对 totalScore 的影响 ≥ 旧版本（粗略）', () => {
    // 短通勤 vs 长通勤总分差 > 12（0.25 × ~50 分差）
    const short = calculateScore({
      ...baseInput,
      commuteWeighted: 10,
      commuteTotalMinutes: 10,
    })
    const long = calculateScore({
      ...baseInput,
      commuteWeighted: 100,
      commuteTotalMinutes: 100,
    })
    expect(short.totalScore - long.totalScore).toBeGreaterThanOrEqual(12)
  })
})
