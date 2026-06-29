import { describe, expect, it } from 'vitest'
import { calcStressFeature } from './stress'
import type { ScoreInput } from './types'

// ============================================================
// stress.test.ts —— v1.6.3 D8 压力指数特征向量
// 5 子项内权重：rent 0.30 / commute 0.30 / income 0.15 / shared 0.10 / city 0.15
//
// 子项 0-100 映射：
//   rentBurden    = clamp((rentRatio - 20) × 3)
//   commuteBurden = clamp((fatigue - 30) × 1)
//   incomeBurden  = clamp((15000 - income) / 150)
//   sharedBurden  = 整租 0 / 合租 60 / unknown 0
//   cityBurden    = 一线 80 / 新一线 50 / 二线 20 / 三线及以下 0
// ============================================================

function makeInput(overrides: Partial<ScoreInput>): ScoreInput {
  return {
    rent: 0,
    income: 15000, // 不触发 incomeBurden
    sunlight: 3,
    noise: 3,
    space: 3,
    condition: 3,
    convenience: 3,
    dining: 3,
    medical: 3,
    lifeDetails: 0,
    housingType: 'whole',
    cityType: 2, // 三线 cityBurden=0
    utility: 3,
    floor: 3,
    bathroom: 3,
    kitchen: 3,
    commuteWeighted: 0,
    commuteTotalMinutes: 0,
    ...overrides,
  }
}

describe('calcStressFeature - 完美场景', () => {
  it('rentRatio=20, fatigue=30, income>=15000, whole, 三线 → 0', () => {
    const f = calcStressFeature({
      rentRatio: 20,
      input: makeInput({}),
    })
    expect(f.mainScore).toBe(0)
    // 所有子项 ≤ 30 → strongest=null
    expect(f.strongest).toBeNull()
  })
})

describe('calcStressFeature - 子项映射', () => {
  it('rentBurden：ratio=40 → (40-20)*3=60 → 子分 60 × 权重 0.30 = 18', () => {
    const f = calcStressFeature({
      rentRatio: 40,
      input: makeInput({}),
    })
    expect(f.mainScore).toBeCloseTo(18, 5)
  })

  it('commuteBurden：fatigue=80 → (80-30)*1=50 → 子分 50 × 0.30 = 15', () => {
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ commuteWeighted: 80 }),
    })
    expect(f.mainScore).toBeCloseTo(15, 5)
  })

  it('incomeBurden：income=5000 → (15000-5000)/150≈66.67 × 0.15 = 10', () => {
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ income: 5000 }),
    })
    expect(f.mainScore).toBeCloseTo((10000 / 150) * 0.15, 5)
  })

  it('sharedBurden：合租 → 60 × 0.10 = 6', () => {
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ housingType: 'shared' }),
    })
    expect(f.mainScore).toBeCloseTo(6, 5)
  })

  it('cityBurden：一线 → 80 × 0.15 = 12', () => {
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ cityType: 5 }),
    })
    expect(f.mainScore).toBeCloseTo(12, 5)
  })

  it('unknown 房型按整租宽松（sharedBurden=0）', () => {
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ housingType: 'unknown' }),
    })
    expect(f.mainScore).toBe(0)
  })
})

describe('calcStressFeature - 极端封顶', () => {
  it('5 项全封顶（ratio=90, fatigue=130, income=5000, 合租, 一线）→ ≈88', () => {
    // rentBurden 100 ×0.30 = 30
    // commuteBurden 100 ×0.30 = 30
    // incomeBurden 66.67 ×0.15 = 10
    // sharedBurden 60 ×0.10 = 6
    // cityBurden 80 ×0.15 = 12
    // 合计 88
    const f = calcStressFeature({
      rentRatio: 90,
      input: makeInput({
        commuteWeighted: 130,
        income: 5000,
        housingType: 'shared',
        cityType: 5,
      }),
    })
    expect(f.mainScore).toBeCloseTo(88, 1)
  })

  it('mainScore ∈ [0, 100]', () => {
    const f = calcStressFeature({
      rentRatio: 999,
      input: makeInput({
        commuteWeighted: 999,
        income: 0,
        housingType: 'shared',
        cityType: 5,
      }),
    })
    expect(f.mainScore).toBeGreaterThanOrEqual(0)
    expect(f.mainScore).toBeLessThanOrEqual(100)
  })
})

describe('calcStressFeature - weakest / strongest（负向维度语义）', () => {
  it('合租为主导压力源 → strongest = sharedBurden（贡献最高）', () => {
    // 只有合租触发：sharedBurden 60 × 0.10 = 6；其他都 0
    const f = calcStressFeature({
      rentRatio: 0,
      input: makeInput({ housingType: 'shared' }),
    })
    expect(f.strongest?.key).toBe('sharedBurden')
  })

  it('整租 + 三线 + 高薪 + 短通勤 + 低房租 → 所有子项 ≤30 → strongest=null', () => {
    const f = calcStressFeature({
      rentRatio: 10,
      input: makeInput({}),
    })
    expect(f.strongest).toBeNull()
  })
})
