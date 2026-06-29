import { describe, expect, it } from 'vitest'
import { calcLifeFeature } from './life'
import type { ScoreInput } from './types'

// ============================================================
// life.test.ts —— v1.6.3 D12b 生活特征向量
// 权重：space 0.30, convenience 0.25, dining 0.25, medical 0.20  → 合计 1.00
//
// P1 阶段 normalize 尚未输出 convenience/dining/medical，
// 直接构造 ScoreInput 测试 calcLifeFeature 本身的算法。
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
    lifeDetails: 0,
    housingType: 'whole',
    cityType: 3,
    utility: 3,
    floor: 3,
    bathroom: 3,
    kitchen: 3,
    commuteWeighted: 0,
    commuteTotalMinutes: 0,
    ...overrides,
  }
}

describe('calcLifeFeature - 全 0 / 全 5', () => {
  it('全 1 → 0', () => {
    const f = calcLifeFeature(
      makeInput({ space: 1, convenience: 1, dining: 1, medical: 1 }),
    )
    expect(f.mainScore).toBe(0)
    expect(f.strongest).toBeNull()
  })

  it('全 5 → 100', () => {
    const f = calcLifeFeature(
      makeInput({ space: 5, convenience: 5, dining: 5, medical: 5 }),
    )
    expect(f.mainScore).toBe(100)
    expect(f.weakest).toBeNull()
  })

  it('全 3 → 50', () => {
    const f = calcLifeFeature(makeInput({}))
    expect(f.mainScore).toBe(50)
  })
})

describe('calcLifeFeature - 权重分布', () => {
  // space=1（→0），其他 5（→100）：
  // 0×0.30 + 100×(0.25+0.25+0.20) = 70
  it('space=1，其他满分 → 70（验证 space 权重 0.30）', () => {
    const f = calcLifeFeature(
      makeInput({ space: 1, convenience: 5, dining: 5, medical: 5 }),
    )
    expect(f.mainScore).toBeCloseTo(70, 5)
  })

  // medical=1（→0），其他满分：100×(0.30+0.25+0.25) = 80
  it('medical=1，其他满分 → 80（验证 medical 权重 0.20）', () => {
    const f = calcLifeFeature(
      makeInput({ space: 5, convenience: 5, dining: 5, medical: 1 }),
    )
    expect(f.mainScore).toBeCloseTo(80, 5)
  })
})

describe('calcLifeFeature - weakest / strongest', () => {
  it('space 拉低 → weakest = space（贡献最低）', () => {
    // space=1 (→0) 贡献 0；其他 4 (→75) 贡献分别 75×权重
    const f = calcLifeFeature(
      makeInput({ space: 1, convenience: 4, dining: 4, medical: 4 }),
    )
    expect(f.weakest?.key).toBe('space')
  })

  it('space 拉高 → strongest = space（权重最大）', () => {
    // space=5 (→100) 贡献 30；其他 3 (→50) 贡献 12.5/12.5/10
    const f = calcLifeFeature(makeInput({ space: 5 }))
    expect(f.strongest?.key).toBe('space')
  })

  it('全 3 分（默认中性）→ 50 分', () => {
    // convenience/dining/medical 必填，全 3 对应 scaleFromFive(3)=50
    const f = calcLifeFeature(
      makeInput({ space: 3, convenience: 3, dining: 3, medical: 3 }),
    )
    expect(f.mainScore).toBe(50)
  })
})
