import { describe, expect, it } from 'vitest'
import { calcRentScore } from '../rent'

// ============================================================
// rent.test.ts —— 分段函数单元测试
// 城市类型 cityType=3（二线，无修正）作为默认基准
// 整租 baseline=30，合租 baseline=35
// ============================================================

describe('calcRentScore - 整租（基准 30）', () => {
  it('ratio=15 → offset=-15，落在首段之外 → 100', () => {
    expect(calcRentScore(15, 3, 'whole')).toBe(100)
  })

  it('ratio=20 → offset=-10，命中 seg[0] → 100', () => {
    expect(calcRentScore(20, 3, 'whole')).toBe(100)
  })

  it('ratio=25 → offset=-5，命中 seg[1] → 95', () => {
    expect(calcRentScore(25, 3, 'whole')).toBe(95)
  })

  it('ratio=30 → offset=0，命中 seg[2] → 85', () => {
    expect(calcRentScore(30, 3, 'whole')).toBe(85)
  })

  it('ratio=35 → offset=+5，命中 seg[3] → 70', () => {
    expect(calcRentScore(35, 3, 'whole')).toBe(70)
  })

  it('ratio=40 → offset=+10，命中 seg[4] → 55', () => {
    expect(calcRentScore(40, 3, 'whole')).toBe(55)
  })

  it('ratio=50 → offset=+20，命中 seg[5] → 30', () => {
    expect(calcRentScore(50, 3, 'whole')).toBe(30)
  })

  it('ratio=60 → offset=+30，命中 seg[6] → 15', () => {
    expect(calcRentScore(60, 3, 'whole')).toBe(15)
  })

  it('ratio=70 → offset=+40，超过最后有限 seg → 0', () => {
    expect(calcRentScore(70, 3, 'whole')).toBe(0)
  })

  it('线性插值：ratio=27.5 → offset=-2.5（在 seg1-seg2 中点）→ 90', () => {
    // seg[1]=(-5,95), seg[2]=(0,85). offset=-2.5 → ratio=(2.5)/5=0.5
    // score = 95 + (85-95)*0.5 = 90
    expect(calcRentScore(27.5, 3, 'whole')).toBeCloseTo(90, 5)
  })

  it('线性插值：ratio=32.5 → offset=+2.5（在 seg2-seg3 中点）→ 77.5', () => {
    // seg[2]=(0,85), seg[3]=(5,70). offset=+2.5 → ratio=0.5
    // score = 85 + (70-85)*0.5 = 77.5
    expect(calcRentScore(32.5, 3, 'whole')).toBeCloseTo(77.5, 5)
  })
})

describe('calcRentScore - 合租（基准 35）', () => {
  it('ratio=25 → offset=-10 → 100', () => {
    expect(calcRentScore(25, 3, 'shared')).toBe(100)
  })

  it('ratio=35 → offset=0 → 85', () => {
    expect(calcRentScore(35, 3, 'shared')).toBe(85)
  })

  it('ratio=40 → offset=+5 → 70', () => {
    expect(calcRentScore(40, 3, 'shared')).toBe(70)
  })
})

describe('calcRentScore - 城市修正', () => {
  it('一线整租 ratio=35：baseline=30+8=38, offset=-3', () => {
    // seg[1]=(-5,95), seg[2]=(0,85), offset=-3 → r=(2)/5=0.4
    // score = 95 + (85-95)*0.4 = 91
    expect(calcRentScore(35, 5, 'whole')).toBeCloseTo(91, 5)
  })

  it('一线整租 ratio=38（落在新基准）→ 85', () => {
    expect(calcRentScore(38, 5, 'whole')).toBe(85)
  })

  it('三线及以下整租 ratio=30：baseline=30-4=26, offset=+4', () => {
    // seg[2]=(0,85), seg[3]=(5,70), offset=+4 → r=4/5=0.8
    // score = 85 + (70-85)*0.8 = 73
    expect(calcRentScore(30, 2, 'whole')).toBeCloseTo(73, 5)
  })
})

describe('calcRentScore - 边界 / 鲁棒性', () => {
  it('ratio=0 → 100', () => {
    expect(calcRentScore(0, 3, 'whole')).toBe(100)
  })

  it('非有限值 → 0', () => {
    expect(calcRentScore(NaN, 3, 'whole')).toBe(0)
    expect(calcRentScore(Infinity, 3, 'whole')).toBe(0)
  })

  it('unknown 房型按整租处理（baseline=30）', () => {
    expect(calcRentScore(30, 3, 'unknown')).toBe(85)
  })
})
