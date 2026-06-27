import { describe, expect, it } from 'vitest'
import { calcCommuteScore, calcCommuteTotalBonus } from '../commute'

// ============================================================
// commute.test.ts —— 通勤双层评分单元测试
// ============================================================

describe('calcCommuteTotalBonus 分段', () => {
  it('短通勤（<=30 分钟）+5', () => {
    expect(calcCommuteTotalBonus(0)).toBe(5)
    expect(calcCommuteTotalBonus(15)).toBe(5)
    expect(calcCommuteTotalBonus(30)).toBe(5)
  })

  it('正常通勤（30<x<=60） 0', () => {
    expect(calcCommuteTotalBonus(31)).toBe(0)
    expect(calcCommuteTotalBonus(60)).toBe(0)
  })

  it('长通勤（60<x<=90） -10', () => {
    expect(calcCommuteTotalBonus(61)).toBe(-10)
    expect(calcCommuteTotalBonus(90)).toBe(-10)
  })

  it('极长通勤（>90） -25', () => {
    expect(calcCommuteTotalBonus(91)).toBe(-25)
    expect(calcCommuteTotalBonus(500)).toBe(-25)
  })
})

describe('calcCommuteScore', () => {
  it('无通勤：base=100, bonus=+5 → clamp 100', () => {
    const s = calcCommuteScore({ totalMinutes: 0, fatigueWeightedMinutes: 0 })
    expect(s).toBe(100)
  })

  it('30 分钟通勤（短段）：base=100*e^(-0.5)≈60.65 + bonus +5 → ~65.65', () => {
    const s = calcCommuteScore({ totalMinutes: 30, fatigueWeightedMinutes: 30 })
    expect(s).toBeGreaterThan(60)
    expect(s).toBeLessThan(70)
  })

  it('60 分钟（normal 段）：base=100*e^(-1)≈36.79 + 0 → ~36.79', () => {
    const s = calcCommuteScore({ totalMinutes: 60, fatigueWeightedMinutes: 60 })
    expect(s).toBeCloseTo(100 * Math.exp(-1), 5)
  })

  it('90 分钟（long 段）：base=100*e^(-1.5)≈22.31 + (-10) → ~12.31', () => {
    const s = calcCommuteScore({ totalMinutes: 90, fatigueWeightedMinutes: 90 })
    expect(s).toBeCloseTo(100 * Math.exp(-1.5) - 10, 5)
  })

  it('120 分钟（extreme 段）：base≈13.53 + (-25) → 0（clamp）', () => {
    const s = calcCommuteScore({ totalMinutes: 120, fatigueWeightedMinutes: 120 })
    expect(s).toBe(0)
  })

  it('fatigue 与 total 解耦：相同 total 但 fatigue 越大 base 越低', () => {
    const a = calcCommuteScore({ totalMinutes: 60, fatigueWeightedMinutes: 30 })
    const b = calcCommuteScore({ totalMinutes: 60, fatigueWeightedMinutes: 60 })
    expect(a).toBeGreaterThan(b)
  })

  it('短 total + 长 fatigue（理论不会出现，但测试鲁棒性）：bonus +5 仍生效', () => {
    const s = calcCommuteScore({ totalMinutes: 20, fatigueWeightedMinutes: 30 })
    // base = 100*exp(-0.5) ≈ 60.65; +5 → 65.65
    expect(s).toBeCloseTo(100 * Math.exp(-0.5) + 5, 4)
  })
})
