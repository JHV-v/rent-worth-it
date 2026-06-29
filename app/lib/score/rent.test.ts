import { describe, expect, it } from 'vitest'
import { calcRentFeature } from './rent'
import { normalizeInput } from './normalize'
import type { HousingType, RawScoreInput } from './types'

// ============================================================
// rent.test.ts —— v1.6.3 D12c：候选 K
//   offset <= 0  → 100（饱和死区）
//   offset >  0  → 100 × exp(-offset / 15)
// 整租 baseline=30，合租 baseline=35；城市修正（一线 +8 / 新一线 +4 / 二线 0 / 三线 -4）
// ============================================================

function rent(args: {
  rent: number
  income: number
  cityType?: number
  housingType?: HousingType
}): number {
  const raw: RawScoreInput = {
    rent: args.rent,
    income: args.income,
    cityType: args.cityType ?? 3,
    housingType: args.housingType ?? 'whole',
  }
  return calcRentFeature(normalizeInput(raw)).mainScore
}

describe('calcRentFeature - 整租（基准 30）', () => {
  it('ratio<=baseline → 100（死区饱和）', () => {
    expect(rent({ rent: 0, income: 10000 })).toBe(100) // ratio=0
    expect(rent({ rent: 1500, income: 10000 })).toBe(100) // ratio=15
    expect(rent({ rent: 3000, income: 10000 })).toBe(100) // ratio=30，贴基准
  })

  it('offset=+5 → 100*exp(-5/15) ≈ 71.65', () => {
    // ratio=35：offset=5
    const v = rent({ rent: 3500, income: 10000 })
    expect(v).toBeCloseTo(100 * Math.exp(-5 / 15), 5)
  })

  it('offset=+10 → 100*exp(-10/15) ≈ 51.34', () => {
    const v = rent({ rent: 4000, income: 10000 })
    expect(v).toBeCloseTo(100 * Math.exp(-10 / 15), 5)
  })

  it('offset=+20 → 100*exp(-20/15) ≈ 26.36', () => {
    const v = rent({ rent: 5000, income: 10000 })
    expect(v).toBeCloseTo(100 * Math.exp(-20 / 15), 5)
  })

  it('offset=+50 → 100*exp(-50/15) ≈ 3.56', () => {
    const v = rent({ rent: 8000, income: 10000 })
    expect(v).toBeCloseTo(100 * Math.exp(-50 / 15), 5)
  })
})

describe('calcRentFeature - 合租（基准 35）', () => {
  it('ratio=25 < 35 → 100', () => {
    expect(rent({ rent: 2500, income: 10000, housingType: 'shared' })).toBe(100)
  })

  it('ratio=35（贴基准）→ 100', () => {
    expect(rent({ rent: 3500, income: 10000, housingType: 'shared' })).toBe(100)
  })

  it('ratio=40，offset=+5 → ≈71.65', () => {
    const v = rent({ rent: 4000, income: 10000, housingType: 'shared' })
    expect(v).toBeCloseTo(100 * Math.exp(-5 / 15), 5)
  })
})

describe('calcRentFeature - 城市修正', () => {
  it('一线 baseline=30+8=38，ratio=38 → 100', () => {
    expect(rent({ rent: 3800, income: 10000, cityType: 5 })).toBe(100)
  })

  it('一线 ratio=43，offset=+5 → ≈71.65', () => {
    const v = rent({ rent: 4300, income: 10000, cityType: 5 })
    expect(v).toBeCloseTo(100 * Math.exp(-5 / 15), 5)
  })

  it('三线 baseline=30-4=26，ratio=30 offset=+4 → ≈76.34', () => {
    const v = rent({ rent: 3000, income: 10000, cityType: 2 })
    expect(v).toBeCloseTo(100 * Math.exp(-4 / 15), 5)
  })
})

describe('calcRentFeature - 边界 / 鲁棒性', () => {
  it('rent=0 → 100', () => {
    expect(rent({ rent: 0, income: 10000 })).toBe(100)
  })

  it('income=0（normalize 兜底为 1）：极高 ratio → 接近 0 但不 NaN', () => {
    const v = rent({ rent: 1000, income: 0 })
    expect(Number.isFinite(v)).toBe(true)
    expect(v).toBeGreaterThanOrEqual(0)
    expect(v).toBeLessThanOrEqual(100)
  })

  it('unknown 房型按整租基准（30）处理', () => {
    const v = rent({ rent: 3000, income: 10000, housingType: 'unknown' })
    expect(v).toBe(100) // ratio=30 = baseline
  })

  it('特征向量：weakest / strongest 均为 null（无同质子项）', () => {
    const f = calcRentFeature(
      normalizeInput({ rent: 3000, income: 10000, cityType: 3 }),
    )
    expect(f.weakest).toBeNull()
    expect(f.strongest).toBeNull()
    expect(typeof f.mainScore).toBe('number')
  })
})

describe('calcRentFeature - 单调性', () => {
  it('占比越高 → mainScore 越低（高占比段）', () => {
    const a = rent({ rent: 3500, income: 10000 }) // offset 5
    const b = rent({ rent: 4500, income: 10000 }) // offset 15
    const c = rent({ rent: 6000, income: 10000 }) // offset 30
    expect(a).toBeGreaterThan(b)
    expect(b).toBeGreaterThan(c)
  })
})
