import { describe, expect, it } from 'vitest'
import { calculateScore } from './index'
import type { RawScoreInput } from './types'

// ============================================================
// integration.test.ts —— v1.6.3 D10 17 场景集成测试
//
// ⚠️ 注：本测试在 P1 阶段（normalize 尚未输出 convenience/dining/medical/
//        lifeDetails/contractTerm）下，生活和幸福维度的子项走默认值兜底，
//        与 plan 文档 17 场景表中的 expected 会有偏差（约 -5 到 -15 分）。
//        P3 normalize.ts 完成后再回填精确的 expected。
//
// 当前阶段断言：
// 1) 所有场景能算出 0-100 的总分（不崩溃）
// 2) 按 plan 文档"档位顺序"大致单调（容忍因新字段缺失导致的轻微乱序）
// 3) 极端场景（场景 1 真·完美 / 场景 8 极端贫困）仍在合理范围
// ============================================================

type Scenario = {
  id: number
  name: string
  input: RawScoreInput
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
    expectedTier: '优秀',
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
    expectedTier: '优秀',
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
    expectedTier: '良好',
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
    expectedTier: '良好',
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
    expectedTier: '良好',
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
    expectedTier: '良好下半',
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
    expectedTier: '凑合',
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
    expectedTier: '严重不及格',
  },
]

describe('17 场景集成测试（P1 阶段：粗校验）', () => {
  it('所有场景都能算出 0-100 的总分', () => {
    SCENARIOS.forEach((sc) => {
      const r = calculateScore(sc.input)
      expect(Number.isFinite(r.totalScore), `场景 #${sc.id} ${sc.name}`).toBe(true)
      expect(r.totalScore).toBeGreaterThanOrEqual(0)
      expect(r.totalScore).toBeLessThanOrEqual(100)
    })
  })

  it('真·完美（场景 1）总分 ≥ 99（一线 cityBurden 80 无法清零，详见 ADR-D1）', () => {
    const sc = SCENARIOS.find((s) => s.id === 1)!
    const r = calculateScore(sc.input)
    expect(r.totalScore).toBeGreaterThanOrEqual(99)
  })

  it('极端贫困（场景 8）总分 ≤ 40（应触发短板惩罚）', () => {
    const sc = SCENARIOS.find((s) => s.id === 8)!
    const r = calculateScore(sc.input)
    expect(r.totalScore).toBeLessThanOrEqual(40)
  })

  it('良好（一线 4w 精致小户）> 凑合（便宜破房）', () => {
    const good = calculateScore(SCENARIOS.find((s) => s.id === 12)!.input)
    const bad = calculateScore(SCENARIOS.find((s) => s.id === 5)!.input)
    expect(good.totalScore).toBeGreaterThan(bad.totalScore)
  })

  it('"贵的好房子"（#4） > "便宜的破房子"（#5）', () => {
    const expensive = calculateScore(SCENARIOS.find((s) => s.id === 4)!.input)
    const cheap = calculateScore(SCENARIOS.find((s) => s.id === 5)!.input)
    // D9/D10 设计目标：两类用户分差打开
    expect(expensive.totalScore - cheap.totalScore).toBeGreaterThanOrEqual(10)
  })
})

// ============================================================
// 打印当前各场景实际总分（供 P3 完成后回填 expected 用）
// 取消下方 it.skip 改为 it 即可看到实际值
// ============================================================
describe.skip('17 场景实际总分打印（P3 后回填用）', () => {
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
