import { describe, expect, it } from 'vitest'
import { calcLifeScore } from './life'
import { normalizeInput } from './normalize'

// ============================================================
// life.test.ts —— 生活分加权
// 权重：space 0.40, food 0.30, facilities 0.30  → 合计 1.00
// subway 字段不再参与
// ============================================================

function ofPartial(partial: Record<string, unknown>): number {
  return calcLifeScore(
    normalizeInput({
      space: 3,
      food: 3,
      facilities: 3,
      ...partial,
    }),
  )
}

describe('calcLifeScore - 单项满分', () => {
  // space=5（100×0.4）+ food=3 (50×0.3) + facilities=3 (50×0.3) = 40+15+15 = 70
  it('仅 space=5 → 70', () => {
    expect(ofPartial({ space: 5 })).toBeCloseTo(70, 5)
  })

  // food=5: 50×0.4 + 100×0.3 + 50×0.3 = 20+30+15 = 65
  it('仅 food=5 → 65', () => {
    expect(ofPartial({ food: 5 })).toBeCloseTo(65, 5)
  })

  // facilities=5: 20+15+30 = 65
  it('仅 facilities=5 → 65', () => {
    expect(ofPartial({ facilities: 5 })).toBeCloseTo(65, 5)
  })
})

describe('calcLifeScore - 全 0 / 全满', () => {
  it('全 1 → 0', () => {
    expect(ofPartial({ space: 1, food: 1, facilities: 1 })).toBe(0)
  })

  it('全 5 → 100', () => {
    expect(ofPartial({ space: 5, food: 5, facilities: 5 })).toBe(100)
  })

  it('全 3 → 50', () => {
    expect(ofPartial({})).toBe(50)
  })
})

describe('calcLifeScore - subway 不参与', () => {
  it('subway=true vs false 不改变 lifeScore', () => {
    const off = ofPartial({ subway: false })
    const on = ofPartial({ subway: true })
    expect(off).toBe(on)
  })

  it('全 5 + subway=true 不会超过 100', () => {
    const v = ofPartial({ space: 5, food: 5, facilities: 5, subway: true })
    expect(v).toBeLessThanOrEqual(100)
    expect(v).toBe(100)
  })
})
