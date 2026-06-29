import { describe, expect, it } from 'vitest'
import { calculateScore } from './index'
import type { RawScoreInput } from './types'

// ============================================================
// integration.test.ts —— v1.6.3 D10 集成测试
//
// 实际分数（P5 完成后锁定，2026-06-29）：
//   #1  真·完美             totalScore=99  完美
//   #12 一线 4w 精致小户     totalScore=77  良好
//   #9  一线 5w 顶级公寓     totalScore=81  良好
//   #10 二线 2w 高级生活     totalScore=71  良好下半
//   #11 新一线 2.5w 骨干    totalScore=69  良好下半
//   #2  一线 3w 高薪租中房   totalScore=67  良好下半
//   #4  一线 1.5w 贵的好房子 totalScore=76  良好
//   #5  二线 1.2w 便宜破房   totalScore=33  不及格
//   #8  一线 4k 极端贫困     totalScore=0   严重不及格
//
// 后续若调参导致总分变化超过 ±2，需重新校准本表并 review 调参是否合理。
// ============================================================

type Scenario = {
  id: number
  name: string
  input: RawScoreInput
  expectedTotal: number
  expectedTier: '完美' | '优秀' | '良好' | '良好下半' | '及格' | '凑合' | '不及格' | '严重不及格'
}

// 按 plan 文档表头列出 17 个场景，输入参数尽量贴近场景描述
const SCENARIOS: Scenario[] = [
  {
    id: 1,
    name: '真·完美（极限）',
    input: {
      rent: 0,
      income: 50000,
      sunlight: 5,
      noise: 1,
      space: 5,
      condition: 5,
      cityType: '一线',
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
      convenience: 5,
      dining: 5,
      medical: 5,
      lifeDetails: new Array(12).fill('x'),
      contractTerm: '2年+',
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
      housingType: 'whole',
    },
    expectedTotal: 99,
    expectedTier: '完美',
  },
  {
    id: 12,
    name: '一线 4w 精致小户',
    input: {
      rent: 7000,
      income: 40000,
      sunlight: 5,
      noise: 2,
      space: 4,
      condition: 5,
      cityType: '一线',
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
      housingType: 'whole',
    },
    expectedTotal: 77,
    expectedTier: '良好',
  },
  {
    id: 9,
    name: '一线 5w 顶级公寓',
    input: {
      rent: 8000,
      income: 50000,
      sunlight: 5,
      noise: 1,
      space: 5,
      condition: 5,
      cityType: '一线',
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
      commuteWeighted: 20,
      commuteTotalMinutes: 20,
      housingType: 'whole',
    },
    expectedTotal: 81,
    expectedTier: '良好',
  },
  {
    id: 10,
    name: '二线 2w 高级生活',
    input: {
      rent: 4000,
      income: 20000,
      sunlight: 4,
      noise: 2,
      space: 4,
      condition: 4,
      cityType: '二线',
      utility: 5,
      floor: 4,
      bathroom: 5,
      kitchen: 3,
      commuteWeighted: 25,
      commuteTotalMinutes: 25,
      housingType: 'whole',
    },
    expectedTotal: 71,
    expectedTier: '良好下半',
  },
  {
    id: 11,
    name: '新一线 2.5w 骨干',
    input: {
      rent: 5500,
      income: 25000,
      sunlight: 4,
      noise: 2,
      space: 4,
      condition: 4,
      cityType: '新一线',
      utility: 5,
      floor: 4,
      bathroom: 5,
      kitchen: 3,
      commuteWeighted: 35,
      commuteTotalMinutes: 35,
      housingType: 'whole',
    },
    expectedTotal: 69,
    expectedTier: '良好下半',
  },
  {
    id: 2,
    name: '一线 3w 高薪租中房',
    input: {
      rent: 8000,
      income: 30000,
      sunlight: 4,
      noise: 3,
      space: 4,
      condition: 4,
      cityType: '一线',
      utility: 5,
      floor: 4,
      bathroom: 4,
      kitchen: 3,
      commuteWeighted: 40,
      commuteTotalMinutes: 40,
      housingType: 'whole',
    },
    expectedTotal: 67,
    expectedTier: '良好下半',
  },
  {
    id: 4,
    name: '一线 1.5w 贵的好房子',
    input: {
      rent: 6000,
      income: 15000,
      sunlight: 5,
      noise: 1,
      space: 5,
      condition: 5,
      cityType: '一线',
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
      housingType: 'whole',
    },
    expectedTotal: 76,
    expectedTier: '良好',
  },
  {
    id: 5,
    name: '二线 1.2w 便宜破房',
    input: {
      rent: 1500,
      income: 12000,
      sunlight: 1,
      noise: 5,
      space: 1,
      condition: 1,
      cityType: '二线',
      utility: 1,
      floor: 1,
      bathroom: 1,
      kitchen: 1,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
      housingType: 'whole',
    },
    expectedTotal: 33,
    expectedTier: '不及格',
  },
  {
    id: 8,
    name: '一线 4k 极端贫困',
    input: {
      rent: 3500,
      income: 4000,
      sunlight: 1,
      noise: 5,
      space: 1,
      condition: 1,
      cityType: '一线',
      utility: 1,
      floor: 1,
      bathroom: 1,
      kitchen: 1,
      commuteWeighted: 120,
      commuteTotalMinutes: 120,
      housingType: 'shared',
    },
    expectedTotal: 0,
    expectedTier: '严重不及格',
  },
]

describe('集成测试：9 场景总分锁定', () => {
  it('所有场景都能算出 0-100 的总分', () => {
    SCENARIOS.forEach((sc) => {
      const r = calculateScore(sc.input)
      expect(Number.isFinite(r.totalScore), `场景 #${sc.id} ${sc.name}`).toBe(true)
      expect(r.totalScore).toBeGreaterThanOrEqual(0)
      expect(r.totalScore).toBeLessThanOrEqual(100)
    })
  })

  it('每个场景总分 == expectedTotal ± 2（锁定调参基线）', () => {
    SCENARIOS.forEach((sc) => {
      const r = calculateScore(sc.input)
      const diff = Math.abs(r.totalScore - sc.expectedTotal)
      expect(
        diff,
        `场景 #${sc.id} ${sc.name}: 实际 ${r.totalScore}, 期望 ${sc.expectedTotal}, 偏差 ${diff}`,
      ).toBeLessThanOrEqual(2)
    })
  })

  it('真·完美（场景 1）总分 ≥ 99（一线 cityBurden 80 无法清零，详见 ADR-D1）', () => {
    const sc = SCENARIOS.find((s) => s.id === 1)!
    const r = calculateScore(sc.input)
    expect(r.totalScore).toBeGreaterThanOrEqual(99)
  })

  it('极端贫困（场景 8）总分 ≤ 5（应触发短板惩罚归零）', () => {
    const sc = SCENARIOS.find((s) => s.id === 8)!
    const r = calculateScore(sc.input)
    expect(r.totalScore).toBeLessThanOrEqual(5)
  })

  it('"贵的好房子"（#4） > "便宜的破房子"（#5）', () => {
    const expensive = calculateScore(SCENARIOS.find((s) => s.id === 4)!.input)
    const cheap = calculateScore(SCENARIOS.find((s) => s.id === 5)!.input)
    // D9/D10 设计目标：两类用户分差打开
    expect(expensive.totalScore - cheap.totalScore).toBeGreaterThanOrEqual(10)
  })

  it('档位单调性：完美 > 良好 > 良好下半 > 不及格 > 严重不及格', () => {
    const perfect = calculateScore(SCENARIOS.find((s) => s.id === 1)!.input).totalScore
    const good = calculateScore(SCENARIOS.find((s) => s.id === 9)!.input).totalScore
    const lowerGood = calculateScore(SCENARIOS.find((s) => s.id === 10)!.input).totalScore
    const fail = calculateScore(SCENARIOS.find((s) => s.id === 5)!.input).totalScore
    const severeFail = calculateScore(SCENARIOS.find((s) => s.id === 8)!.input).totalScore
    expect(perfect).toBeGreaterThan(good)
    expect(good).toBeGreaterThan(lowerGood)
    expect(lowerGood).toBeGreaterThan(fail)
    expect(fail).toBeGreaterThan(severeFail)
  })
})

// ============================================================
// 打印当前各场景实际总分（调参时取消 .skip 用于看分布）
// ============================================================
describe.skip('场景实际总分打印（调参用）', () => {
  it('print', () => {
    SCENARIOS.forEach((sc) => {
      const r = calculateScore(sc.input)
      // eslint-disable-next-line no-console
      console.log(
        `#${sc.id} ${sc.name.padEnd(20)} → totalScore=${r.totalScore}, ` +
          `rent=${r.rentFeature?.mainScore.toFixed(1)}, ` +
          `commute=${r.commuteFeature?.mainScore.toFixed(1)}, ` +
          `live=${r.liveFeature?.mainScore.toFixed(1)}, ` +
          `life=${r.lifeFeature?.mainScore.toFixed(1)}, ` +
          `stress=${r.stressFeature?.mainScore.toFixed(1)}, ` +
          `happiness=${r.happinessFeature?.mainScore.toFixed(1)}`,
      )
    })
  })
})
