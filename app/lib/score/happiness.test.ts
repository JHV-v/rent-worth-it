import { describe, expect, it } from 'vitest'
import { calcHappinessFeature } from './happiness'
import type { ScoreInput } from './types'

// ============================================================
// happiness.test.ts —— v1.6.3 D7 幸福指数特征向量
// 3 子项内权重：lifeDetails 0.40 / contractBenefit 0.30 / cityBenefit 0.30
//
// 子项 0-100 映射：
//   lifeDetailsScore  = lifeDetails × 100/12（0-12 项）
//   contractBenefit   = 半年 0 / 1年 50 / 2年+ 100
//   cityBenefit       = 一线 100 / 新一线 67 / 二线 33 / 三线及以下 0
// ============================================================

function makeInput(overrides: Partial<ScoreInput>): ScoreInput {
  return {
    rent: 0,
    income: 1,
    sunlight: 3,
    noise: 3,
    space: 3,
    condition: 3,
    convenience: 3,
    dining: 3,
    medical: 3,
    housingType: 'whole',
    cityType: 2, // 三线 cityBenefit=0
    utility: 3,
    floor: 3,
    bathroom: 3,
    kitchen: 3,
    commuteWeighted: 0,
    commuteTotalMinutes: 0,
    lifeDetails: 0,
    contractTerm: 1, // 半年 → contractBenefit 0
    ...overrides,
  }
}

describe('calcHappinessFeature - 最低 / 最高组合', () => {
  it('最低（0 项 + 半年 + 三线）→ 0', () => {
    const f = calcHappinessFeature(makeInput({}))
    expect(f.mainScore).toBe(0)
    // 全员 ≤30 → strongest=null
    expect(f.strongest).toBeNull()
  })

  it('最高（12 项 + 2年+ + 一线）→ 100', () => {
    const f = calcHappinessFeature(
      makeInput({ lifeDetails: 12, contractTerm: 3, cityType: 5 }),
    )
    expect(f.mainScore).toBe(100)
    // 全员 ≥80 → weakest=null
    expect(f.weakest).toBeNull()
  })
})

describe('calcHappinessFeature - 子项映射', () => {
  it('lifeDetails=6 → 50 × 0.40 = 20', () => {
    const f = calcHappinessFeature(makeInput({ lifeDetails: 6 }))
    expect(f.mainScore).toBeCloseTo(20, 5)
  })

  it('contractTerm=2（1年）→ 50 × 0.30 = 15', () => {
    const f = calcHappinessFeature(makeInput({ contractTerm: 2 }))
    expect(f.mainScore).toBeCloseTo(15, 5)
  })

  it('cityType=5（一线）→ 100 × 0.30 = 30', () => {
    const f = calcHappinessFeature(makeInput({ cityType: 5 }))
    expect(f.mainScore).toBeCloseTo(30, 5)
  })

  it('cityType=4（新一线）→ 67 × 0.30 ≈ 20.1', () => {
    const f = calcHappinessFeature(makeInput({ cityType: 4 }))
    expect(f.mainScore).toBeCloseTo(20.1, 1)
  })

  it('示例：6 项 + 1年 + 二线 ≈ 44.9', () => {
    // lifeDetails 50 ×0.40 = 20
    // contractBenefit 50 ×0.30 = 15
    // cityBenefit 33 ×0.30 = 9.9
    // 合计 44.9
    const f = calcHappinessFeature(
      makeInput({ lifeDetails: 6, contractTerm: 2, cityType: 3 }),
    )
    expect(f.mainScore).toBeCloseTo(44.9, 1)
  })
})

describe('calcHappinessFeature - 边界 / 兜底', () => {
  it('lifeDetails 字段缺失（P1）→ 按 0 算', () => {
    const input = makeInput({})
    // 删 lifeDetails 字段
    delete (input as { lifeDetails?: number }).lifeDetails
    const f = calcHappinessFeature(input)
    expect(f.mainScore).toBe(0)
  })

  it('contractTerm 字段缺失 → contractBenefit 按 0 算', () => {
    const input = makeInput({})
    delete (input as { contractTerm?: number }).contractTerm
    const f = calcHappinessFeature(input)
    expect(f.mainScore).toBe(0)
  })

  it('lifeDetails 超过 12 → clamp 到 12', () => {
    const f = calcHappinessFeature(makeInput({ lifeDetails: 99 }))
    // 12/12 × 100 × 0.40 = 40
    expect(f.mainScore).toBeCloseTo(40, 5)
  })

  it('lifeDetails 为负 → clamp 到 0', () => {
    const f = calcHappinessFeature(makeInput({ lifeDetails: -5 }))
    expect(f.mainScore).toBe(0)
  })
})

describe('calcHappinessFeature - weakest / strongest（正向维度）', () => {
  it('lifeDetails 主导 → strongest = lifeDetails', () => {
    // 12 项 → 100 × 0.40 = 40；其他 0
    const f = calcHappinessFeature(makeInput({ lifeDetails: 12 }))
    expect(f.strongest?.key).toBe('lifeDetails')
  })

  it('全部正常组合（6 项 + 1年 + 二线）→ weakest = cityBenefit（贡献 9.9）', () => {
    // 贡献：lifeDetails 20 / contractBenefit 15 / cityBenefit 9.9
    const f = calcHappinessFeature(
      makeInput({ lifeDetails: 6, contractTerm: 2, cityType: 3 }),
    )
    expect(f.weakest?.key).toBe('cityBenefit')
  })
})
