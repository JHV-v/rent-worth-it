import { describe, expect, it } from 'vitest'
import {
  TAG_DICTIONARY,
  VALUE_WEIGHTS,
  COST_WEIGHTS,
  calculateScore,
  normalizeInput,
} from './score'

// ============================================================
// score.test.ts —— v1.6.3 集成测试
// 公式：基础分 = 价值 × 0.65 + (100 - 成本) × 0.35
//      价值 = 居住×0.45 + 生活×0.35 + 幸福×0.20
//      成本 = (100-房租)×0.40 + (100-通勤)×0.30 + 压力×0.30
// 短板惩罚：4 客观维度 < 30 → 按 (30-score)×0.3 扣分
// ============================================================

describe('normalizeInput', () => {
  it('把中文标签翻译成 1-5 分数', () => {
    const result = normalizeInput({
      rent: 3000,
      income: 10000,
      sunlight: '阳光充足',
      noise: '隔音极差',
      space: '宽敞',
      condition: '全新精装',
    })
    expect(result.sunlight).toBe(5)
    expect(result.noise).toBe(5)
    expect(result.space).toBe(5)
    expect(result.condition).toBe(5)
  })

  it('未匹配的标签回落到默认值 3', () => {
    const result = normalizeInput({
      sunlight: '一个根本不存在的标签',
      noise: undefined,
      space: '',
    })
    expect(result.sunlight).toBe(3)
    expect(result.noise).toBe(3)
    expect(result.space).toBe(3)
  })

  it('防止除零：income 至少为 1', () => {
    const result = normalizeInput({ rent: 1000, income: 0 })
    expect(result.income).toBe(1)
  })

  it('对脏数据保持稳定（null / undefined / 非法字符串）', () => {
    const result = normalizeInput({
      rent: 'abc' as unknown as number,
      income: undefined,
    })
    expect(result.rent).toBe(0)
    expect(result.income).toBeGreaterThanOrEqual(1)
  })

  it('已是数字的字段直接裁剪到 1-5', () => {
    const r1 = normalizeInput({ sunlight: 10 })
    const r2 = normalizeInput({ sunlight: -3 })
    expect(r1.sunlight).toBe(5)
    expect(r2.sunlight).toBe(1)
  })

  it('commuteTotalMinutes 标准化', () => {
    const r = normalizeInput({ commuteTotalMinutes: 45 })
    expect(r.commuteTotalMinutes).toBe(45)
    const r2 = normalizeInput({ commuteTotalMinutes: -10 })
    expect(r2.commuteTotalMinutes).toBe(0)
  })
})

describe('calculateScore - 输出结构', () => {
  it('包含全部新旧字段，分数都在 0-100', () => {
    const result = calculateScore({
      rent: 3000,
      income: 10000,
      sunlight: 4,
      noise: 2,
      space: 4,
      condition: 4,
    })
    // 新：6 维特征向量
    expect(result.rentFeature.mainScore).toBeGreaterThanOrEqual(0)
    expect(result.commuteFeature.mainScore).toBeGreaterThanOrEqual(0)
    expect(result.liveFeature.mainScore).toBeGreaterThanOrEqual(0)
    expect(result.lifeFeature.mainScore).toBeGreaterThanOrEqual(0)
    expect(result.stressFeature.mainScore).toBeGreaterThanOrEqual(0)
    expect(result.happinessFeature.mainScore).toBeGreaterThanOrEqual(0)
    const fields = [
      'totalScore',
      'rentRatio',
      'rentFeature',
      'commuteFeature',
      'liveFeature',
      'lifeFeature',
      'stressFeature',
      'happinessFeature',
      'persona',
      'housingType',
    ] as const
    fields.forEach((f) => expect(result).toHaveProperty(f))
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
    expect(typeof result.persona).toBe('string')
  })

  it('6 维特征向量结构完整：mainScore 为数字', () => {
    const r = calculateScore({
      rent: 3000,
      income: 10000,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
    })
    expect(typeof r.rentFeature.mainScore).toBe('number')
    expect(typeof r.commuteFeature.mainScore).toBe('number')
    expect(typeof r.liveFeature.mainScore).toBe('number')
    expect(typeof r.lifeFeature.mainScore).toBe('number')
    expect(typeof r.stressFeature.mainScore).toBe('number')
    expect(typeof r.happinessFeature.mainScore).toBe('number')
  })

  it('VALUE_WEIGHTS 总和 = 1.00', () => {
    const sum = VALUE_WEIGHTS.live + VALUE_WEIGHTS.life + VALUE_WEIGHTS.happiness
    expect(sum).toBeCloseTo(1.0, 6)
  })

  it('COST_WEIGHTS 总和 = 1.00', () => {
    const sum = COST_WEIGHTS.rent + COST_WEIGHTS.commute + COST_WEIGHTS.stress
    expect(sum).toBeCloseTo(1.0, 6)
  })
})

describe('TAG_DICTIONARY 完整性', () => {
  it('各类字典都不为空', () => {
    expect(Object.keys(TAG_DICTIONARY.sunlight).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.noise).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.space).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.condition).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.floor).length).toBeGreaterThan(0)
  })

  it('字典里的所有值都在 1-5 之间', () => {
    Object.values(TAG_DICTIONARY).forEach((dict) => {
      Object.values(dict).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(1)
        expect(v).toBeLessThanOrEqual(5)
      })
    })
  })
})

describe('calculateScore - 极端输入鲁棒性', () => {
  it('全空输入不会崩 / 不会 NaN', () => {
    const r = calculateScore({})
    expect(Number.isFinite(r.totalScore)).toBe(true)
    expect(Number.isFinite(r.rentRatio)).toBe(true)
    expect(r.rentRatio).toBe(0)
  })

  it('rent=0, income=0 → rentRatio=0, commuteFeature.mainScore=100（无通勤）', () => {
    const r = calculateScore({
      rent: 0,
      income: 0,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
    })
    expect(r.rentRatio).toBe(0)
    // 无通勤：base=100，short bonus=+10 → clamp 100
    expect(r.commuteFeature.mainScore).toBe(100)
  })

  it('rentRatio 上限 999', () => {
    const r = calculateScore({ rent: 1_000_000, income: 1 })
    expect(r.rentRatio).toBeLessThanOrEqual(999)
  })

  it('totalScore 始终 ∈ [0,100]', () => {
    const samples = [
      { rent: 0, income: 100000 },
      { rent: 100000, income: 1 },
      { rent: 5000, income: 10000, commuteWeighted: 999 },
      { rent: 2000, income: 8000, housingType: 'shared' as const },
    ]
    samples.forEach((s) => {
      const r = calculateScore(s)
      expect(r.totalScore).toBeGreaterThanOrEqual(0)
      expect(r.totalScore).toBeLessThanOrEqual(100)
    })
  })

  it('persona 始终是非空字符串', () => {
    const r = calculateScore({ rent: 99999, income: 1 })
    expect(typeof r.persona).toBe('string')
    expect(r.persona.length).toBeGreaterThan(0)
  })
})

describe('calculateScore - v1.6.3 核心契约', () => {
  it('真·完美：rent=0 + 全 5 + 12 项细节 + 2年+ + 一线 + 高薪 + 短通勤 → ≥ 99', () => {
    const r = calculateScore({
      rent: 0,
      income: 50000,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
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
      housingType: 'whole',
    })
    // D1 拆分：一线 cityBenefit=100 给价值 / cityBurden=80 给成本，
    // 两者无法完全抵消，理论最高 ≈ 99（基础分 98.74 → round 99）
    expect(r.totalScore).toBeGreaterThanOrEqual(99)
  })

  it('rent 在 baseline 内（低占比死区）→ rentScore 100', () => {
    // 整租二线 baseline=30；rent=2500/income=10000=25% < 30
    const r = calculateScore({ rent: 2500, income: 10000, cityType: '二线' })
    expect(r.rentFeature?.mainScore).toBe(100)
  })

  it('低占比死区：rent 在 baseline 内变动，rentScore 不动', () => {
    const a = calculateScore({ rent: 1500, income: 10000, cityType: '二线' })
    const b = calculateScore({ rent: 2500, income: 10000, cityType: '二线' })
    expect(a.rentFeature?.mainScore).toBe(b.rentFeature?.mainScore) // 都=100
  })
})
