import { describe, expect, it } from 'vitest'
import { calcLiveFeature } from './housing'
import { normalizeInput } from './normalize'
import type { RawScoreInput } from './types'

// ============================================================
// housing.test.ts —— v1.6.3 D12a 居住特征向量
// 权重：sunlight 0.20, noise 0.18, bathroom 0.16, condition 0.15,
//       kitchen 0.13, floor 0.10, utility 0.08  → 合计 1.00
// ============================================================

function feat(partial: Partial<RawScoreInput>) {
  return calcLiveFeature(
    normalizeInput({
      sunlight: 3,
      noise: 3,
      bathroom: 3,
      condition: 3,
      kitchen: 3,
      floor: 3,
      utility: 3,
      ...partial,
    }),
  )
}

describe('calcLiveFeature - 全 0 / 全 5', () => {
  it('全部最差（noise=5、其他=1）→ 0', () => {
    const f = feat({
      sunlight: 1,
      noise: 5,
      bathroom: 1,
      condition: 1,
      kitchen: 1,
      floor: 1,
      utility: 1,
    })
    expect(f.mainScore).toBe(0)
    // 所有子项 score=0 ≤ 30 → strongest 应为 null
    expect(f.strongest).toBeNull()
  })

  it('全部最优（noise=1、其他=5）→ 100', () => {
    const f = feat({
      sunlight: 5,
      noise: 1,
      bathroom: 5,
      condition: 5,
      kitchen: 5,
      floor: 5,
      utility: 5,
    })
    expect(f.mainScore).toBe(100)
    // 所有子项 score=100 ≥ 80 → weakest 应为 null
    expect(f.weakest).toBeNull()
  })

  it('全 3 → 50', () => {
    expect(feat({}).mainScore).toBe(50)
  })
})

describe('calcLiveFeature - 权重分布', () => {
  // 仅 sunlight=1（→0 分），其他全 5（→100）：
  // 0×0.20 + 100×(0.18+0.16+0.15+0.13+0.10+0.08) = 80
  it('采光拉到 0，其余满分 → 80（权重 0.20 验证）', () => {
    const f = feat({
      sunlight: 1,
      noise: 1,
      bathroom: 5,
      condition: 5,
      kitchen: 5,
      floor: 5,
      utility: 5,
    })
    expect(f.mainScore).toBeCloseTo(80, 5)
  })

  // 仅 utility=1（→0），其他满分：100×(1 - 0.08) = 92
  it('水电拉到 0，其余满分 → 92（权重 0.08 验证）', () => {
    const f = feat({
      sunlight: 5,
      noise: 1,
      bathroom: 5,
      condition: 5,
      kitchen: 5,
      floor: 5,
      utility: 1,
    })
    expect(f.mainScore).toBeCloseTo(92, 5)
  })
})

describe('calcLiveFeature - weakest / strongest', () => {
  it('采光最差 → weakest = sunlight', () => {
    // sunlight=1（score 0），其他 4（score 75）
    const f = feat({
      sunlight: 1,
      noise: 2, // 反向：score 75
      bathroom: 4,
      condition: 4,
      kitchen: 4,
      floor: 4,
      utility: 4,
    })
    expect(f.weakest?.key).toBe('sunlight')
    expect(f.weakest?.score).toBe(0)
  })

  it('采光最好 → strongest = sunlight', () => {
    // sunlight=5（100），其他 3（50）
    const f = feat({ sunlight: 5 })
    expect(f.strongest?.key).toBe('sunlight')
  })

  it('正向维度阈值：全员 ≤30 → strongest=null；全员 ≥80 → weakest=null', () => {
    // 全员 score=0 ≤ 30
    const allBad = feat({
      sunlight: 1,
      noise: 5,
      bathroom: 1,
      condition: 1,
      kitchen: 1,
      floor: 1,
      utility: 1,
    })
    expect(allBad.strongest).toBeNull()
    expect(allBad.weakest?.key).toBeDefined() // 全员差时 weakest 仍可展示

    // 全员 score=100 ≥ 80
    const allGood = feat({
      sunlight: 5,
      noise: 1,
      bathroom: 5,
      condition: 5,
      kitchen: 5,
      floor: 5,
      utility: 5,
    })
    expect(allGood.weakest).toBeNull()
    expect(allGood.strongest?.key).toBeDefined()
  })
})
