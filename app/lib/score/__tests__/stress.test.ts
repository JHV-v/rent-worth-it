import { describe, expect, it } from 'vitest'
import { calcStress } from '../stress'

// ============================================================
// stress.test.ts —— 压力指数
//   max(0, rentRatio-20)*1.5 + max(0,fatigue-30)*0.4 + 收入惩罚 +
//   合租惩罚 +6 + 城市修正
// ============================================================

describe('calcStress', () => {
  it('完美场景：ratio<=20, fatigue<=30, income>=10000, whole, city3 → 0', () => {
    expect(calcStress(20, 30, 10000, 'whole', 3)).toBe(0)
  })

  it('合租加成已降至 +6（原 +8）', () => {
    const whole = calcStress(0, 0, 50000, 'whole', 3)
    const shared = calcStress(0, 0, 50000, 'shared', 3)
    expect(shared - whole).toBe(6)
  })

  it('低收入惩罚：<5000 +15', () => {
    expect(calcStress(0, 0, 4000, 'whole', 3)).toBe(15)
  })

  it('中低收入惩罚：<10000 +8', () => {
    expect(calcStress(0, 0, 8000, 'whole', 3)).toBe(8)
  })

  it('城市修正：一线 +5', () => {
    expect(calcStress(0, 0, 50000, 'whole', 5)).toBe(5)
  })

  it('房租超 20% 部分 × 1.5', () => {
    // ratio=40 → (40-20)*1.5=30
    expect(calcStress(40, 0, 50000, 'whole', 3)).toBe(30)
  })

  it('疲惫度超 30 部分 × 0.4', () => {
    // fatigue=80 → (80-30)*0.4=20
    expect(calcStress(0, 80, 50000, 'whole', 3)).toBe(20)
  })

  it('叠加全部惩罚后 clamp 到 100', () => {
    // 不论怎么累计 clamp 不超过 100
    const v = calcStress(999, 999, 100, 'shared', 5)
    expect(v).toBe(100)
  })
})
