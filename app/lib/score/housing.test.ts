import { describe, expect, it } from 'vitest'
import { calcLiveScore } from './housing'
import { normalizeInput } from './normalize'

// ============================================================
// housing.test.ts —— 居住分加权
// 权重：sunlight 0.22, noise 0.20, bathroom 0.16, condition 0.15,
//       kitchen 0.12, floor 0.10, utility 0.05  → 合计 1.00
// ============================================================

function ofPartial(partial: Record<string, number>): number {
  // 默认全 3，等价 50 分
  return calcLiveScore(
    normalizeInput({
      sunlight: 3,
      noise: 3,
      space: 3,
      condition: 3,
      bathroom: 3,
      kitchen: 3,
      floor: 3,
      utility: 3,
      ...partial,
    }),
  )
}

describe('calcLiveScore - 单项满分（其他 3）', () => {
  // 仅 sunlight=5：sunlight 100×0.22 + noise(rev3=50)×0.20 + bathroom 50×0.16
  // + condition 50×0.15 + kitchen 50×0.12 + floor 50×0.10 + utility 50×0.05
  // = 22 + 10 + 8 + 7.5 + 6 + 5 + 2.5 = 61
  it('仅 sunlight=5 → 61', () => {
    expect(ofPartial({ sunlight: 5 })).toBeCloseTo(61, 5)
  })

  // 仅 noise=1（最安静，反向 100）：noise 100×0.20 + 其余 50×0.80 = 20 + 40 = 60
  it('仅 noise=1（最安静）→ 60', () => {
    expect(ofPartial({ noise: 1 })).toBeCloseTo(60, 5)
  })

  // 仅 bathroom=5：bathroom 100×0.16 + 其余 50×0.84 = 16 + 42 = 58
  it('仅 bathroom=5 → 58', () => {
    expect(ofPartial({ bathroom: 5 })).toBeCloseTo(58, 5)
  })
})

describe('calcLiveScore - 全 0 / 全满', () => {
  it('全部最差（sunlight=1, noise=5, 其他都=1）→ 0', () => {
    const v = calcLiveScore(
      normalizeInput({
        sunlight: 1,
        noise: 5,
        space: 1,
        condition: 1,
        bathroom: 1,
        kitchen: 1,
        floor: 1,
        utility: 1,
      }),
    )
    expect(v).toBe(0)
  })

  it('全部最优（sunlight=5, noise=1, 其他都=5）→ 100', () => {
    const v = calcLiveScore(
      normalizeInput({
        sunlight: 5,
        noise: 1,
        space: 5,
        condition: 5,
        bathroom: 5,
        kitchen: 5,
        floor: 5,
        utility: 5,
      }),
    )
    expect(v).toBe(100)
  })

  it('全 3 → 50', () => {
    expect(ofPartial({})).toBe(50)
  })
})

describe('calcLiveScore - space 不再参与', () => {
  it('space 变化不影响 liveScore', () => {
    const small = ofPartial({ space: 1 })
    const big = ofPartial({ space: 5 })
    expect(small).toBe(big)
  })
})

describe('calcLiveScore - 不区分整租/合租', () => {
  it('housingType 不影响 liveScore', () => {
    const input = {
      sunlight: 4,
      noise: 2,
      space: 4,
      condition: 4,
      bathroom: 4,
      kitchen: 4,
      floor: 4,
      utility: 4,
    }
    const whole = calcLiveScore(normalizeInput({ ...input, housingType: 'whole' }))
    const shared = calcLiveScore(normalizeInput({ ...input, housingType: 'shared' }))
    expect(whole).toBe(shared)
  })
})
