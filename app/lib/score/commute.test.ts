import { describe, expect, it } from 'vitest'
import { calcCommuteFeature, calcCommuteTotalBonus } from './commute'
import { normalizeInput } from './normalize'

// ============================================================
// commute.test.ts —— v1.6.3 D12d
//   baseScore = 100 × exp(-fatigue / 100)
//   bonus     = +10 (<=30) / 0 (30-60) / -10 (60-90) / -20 (>90)
//   mainScore = clamp(base + bonus, 0, 100)
// ============================================================

function commute(args: {
  fatigue: number
  total: number
}): number {
  return calcCommuteFeature(
    normalizeInput({
      commuteWeighted: args.fatigue,
      commuteTotalMinutes: args.total,
    }),
  ).mainScore
}

describe('calcCommuteTotalBonus 分段（D12d 对称化）', () => {
  it('短通勤（<=30）+10', () => {
    expect(calcCommuteTotalBonus(0)).toBe(10)
    expect(calcCommuteTotalBonus(30)).toBe(10)
  })

  it('正常通勤（30-60）0', () => {
    expect(calcCommuteTotalBonus(31)).toBe(0)
    expect(calcCommuteTotalBonus(60)).toBe(0)
  })

  it('长通勤（60-90）-10', () => {
    expect(calcCommuteTotalBonus(61)).toBe(-10)
    expect(calcCommuteTotalBonus(90)).toBe(-10)
  })

  it('极长通勤（>90）-20', () => {
    expect(calcCommuteTotalBonus(91)).toBe(-20)
    expect(calcCommuteTotalBonus(500)).toBe(-20)
  })
})

describe('calcCommuteFeature', () => {
  it('无通勤：base=100, bonus=+10 → clamp 100', () => {
    expect(commute({ fatigue: 0, total: 0 })).toBe(100)
  })

  it('30 分钟：base=100*exp(-0.3)≈74.08 + 10 → ≈84.08', () => {
    const v = commute({ fatigue: 30, total: 30 })
    expect(v).toBeCloseTo(100 * Math.exp(-0.3) + 10, 5)
  })

  it('60 分钟：base=100*exp(-0.6)≈54.88 + 0 → ≈54.88', () => {
    const v = commute({ fatigue: 60, total: 60 })
    expect(v).toBeCloseTo(100 * Math.exp(-0.6), 5)
  })

  it('90 分钟：base=100*exp(-0.9)≈40.66 + (-10) → ≈30.66', () => {
    const v = commute({ fatigue: 90, total: 90 })
    expect(v).toBeCloseTo(100 * Math.exp(-0.9) - 10, 5)
  })

  it('120 分钟（>90 极长段）：base=100*exp(-1.2)≈30.12 + (-20) → ≈10.12', () => {
    const v = commute({ fatigue: 120, total: 120 })
    expect(v).toBeCloseTo(100 * Math.exp(-1.2) - 20, 5)
  })

  it('180 分钟：base≈16.53 + (-20) = -3.47 → clamp 0', () => {
    expect(commute({ fatigue: 180, total: 180 })).toBe(0)
  })

  it('fatigue 与 total 解耦：相同 total 但 fatigue 越大 base 越低', () => {
    const a = commute({ fatigue: 30, total: 60 })
    const b = commute({ fatigue: 60, total: 60 })
    expect(a).toBeGreaterThan(b)
  })
})

describe('calcCommuteFeature - 特征向量结构', () => {
  it('weakest / strongest 均为 null（无同质子项）', () => {
    const f = calcCommuteFeature(
      normalizeInput({ commuteWeighted: 30, commuteTotalMinutes: 30 }),
    )
    expect(f.weakest).toBeNull()
    expect(f.strongest).toBeNull()
    expect(typeof f.mainScore).toBe('number')
  })
})
