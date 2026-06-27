import { describe, expect, it } from 'vitest'
import {
  TAG_DICTIONARY,
  calculateScore,
  normalizeInput,
  WEIGHTS,
} from './score'

// ============================================================
// score.test.ts —— v1.6.0 集成测试
// 主要验证 calculateScore 的契约与若干典型场景的总分预期
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
      subway: true,
      food: 4,
      facilities: 5,
    })
    expect(result.sunlight).toBe(5)
    expect(result.noise).toBe(5)
    expect(result.space).toBe(5)
    expect(result.condition).toBe(5)
    expect(result.subway).toBe(true)
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
  it('包含全部字段，且分数都在 0-100', () => {
    const result = calculateScore({
      rent: 3000,
      income: 10000,
      sunlight: 4,
      noise: 2,
      space: 4,
      condition: 4,
      subway: true,
      food: 4,
      facilities: 4,
    })
    const fields = [
      'totalScore',
      'rentRatio',
      'commuteScore',
      'liveScore',
      'lifeScore',
      'stress',
      'persona',
      'housingType',
    ] as const
    fields.forEach((f) => expect(result).toHaveProperty(f))
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
    expect(typeof result.persona).toBe('string')
  })

  it('WEIGHTS 总和 = 1.00（不含 stress）', () => {
    const sum = WEIGHTS.rent + WEIGHTS.commute + WEIGHTS.live + WEIGHTS.life
    expect(sum).toBeCloseTo(1.0, 6)
  })
})

describe('TAG_DICTIONARY 完整性', () => {
  it('各类字典都不为空', () => {
    expect(Object.keys(TAG_DICTIONARY.sunlight).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.noise).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.space).length).toBeGreaterThan(0)
    expect(Object.keys(TAG_DICTIONARY.condition).length).toBeGreaterThan(0)
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

// ============================================================
// 4 个典型场景的总分（每个 expect 的预期范围均带有手算注释）
// ============================================================

describe('calculateScore - 典型场景', () => {
  // 场景 A：一线高薪、整租优质
  // rent=5000, income=25000 → ratio=20
  // 一线(city=5) modifier.rent=+8, baseline=38, offset=20-38=-18 → rentScore=100
  // total=30,fatigue=30 → base=100*e^-0.5≈60.65 + bonus=+5(<=30) ≈65.65 → 66
  // liveScore：全 5 noise=1 → 100
  // lifeScore：space=5, food=5, facilities=5 → 100
  // stress：ratio<=20, fatigue<=30, income>=10000, whole, city=5 +5 → 5
  // cityBonus=+5
  // total = 100*0.30 + 66*0.25 + 100*0.25 + 100*0.20 - 5*0.10 + 5
  //       = 30 + 16.5 + 25 + 20 - 0.5 + 5 = 96
  it('场景 A：一线高薪整租优质 → 总分 ≥ 90', () => {
    const r = calculateScore({
      rent: 5000,
      income: 25000,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
      sunlight: 5,
      noise: 1,
      space: 5,
      condition: 5,
      subway: true,
      food: 5,
      facilities: 5,
      housingType: 'whole',
      cityType: '一线',
      utility: 5,
      floor: 5,
      bathroom: 5,
      kitchen: 5,
    })
    expect(r.totalScore).toBeGreaterThanOrEqual(90)
    expect(r.rentRatio).toBe(20)
    expect(r.liveScore).toBe(100)
    expect(r.lifeScore).toBe(100)
    expect(r.stress).toBe(5) // 仅城市修正 +5
  })

  // 场景 B：新一线躺平
  // rent=3000, income=12000 → ratio=25
  // 新一线(4) modifier.rent=+4, baseline=34, offset=25-34=-9 → 在 seg[0](-10,100) 与 seg[1](-5,95) 之间
  //   插值: 100 + (95-100)*((-9-(-10))/(-5-(-10))) = 100 + (-5)*(1/5) = 99
  // total=50,fatigue=50 → base=100*e^(-50/60)=100*0.4346≈43.46 + 0(60>50>30 → normal) → 43.46 → 43
  // liveScore 中等（全 3）→ 50
  // lifeScore (space=4,food=3,facilities=3) → scaleFromFive(4)=75 → 75*0.4 + 50*0.3 + 50*0.3 = 30+15+15=60
  // stress：ratio=25>20 → 5*1.5=7.5；fatigue=50>30 → 20*0.4=8；income>=10000 → 0；whole → 0；city4 → +2  → 17.5 → 18
  // cityBonus=+3
  // total = 99*0.30 + 43*0.25 + 50*0.25 + 60*0.20 - 18*0.10 + 3
  //       = 29.7 + 10.75 + 12.5 + 12 - 1.8 + 3 = 66.15 → 66
  it('场景 B：新一线躺平整租 → 总分约 60-75', () => {
    const r = calculateScore({
      rent: 3000,
      income: 12000,
      commuteWeighted: 50,
      commuteTotalMinutes: 50,
      sunlight: 3,
      noise: 3,
      space: 4,
      condition: 3,
      subway: false,
      food: 3,
      facilities: 3,
      housingType: 'whole',
      cityType: '新一线',
      utility: 3,
      floor: 3,
      bathroom: 3,
      kitchen: 3,
    })
    expect(r.totalScore).toBeGreaterThanOrEqual(60)
    expect(r.totalScore).toBeLessThanOrEqual(75)
    expect(r.rentRatio).toBe(25)
  })

  // 场景 C：三线小工资合租
  // rent=1200, income=5000 → ratio=24
  // 三线及以下(2) modifier.rent=-4, baseline=35-4=31（合租）, offset=24-31=-7
  //   在 seg[0](-10,100) 与 seg[1](-5,95) 之间：100 + (95-100)*((-7-(-10))/5) = 100 -5*(3/5) = 97
  // total=20,fatigue=20 → base=100*e^(-1/3)≈71.65 + bonus=+5 → 76.65 → 77
  // liveScore 全 3 → 50
  // lifeScore (space=2,food=3,facilities=3): scaleFromFive(2)=25 → 25*0.4 + 50*0.3 + 50*0.3 = 10+15+15=40
  // stress：ratio=24>20 → 4*1.5=6；fatigue=20<30 → 0；income=5000 not <5000 → 0 (actually 5000不 <5000) wait 5000 是不 <5000;
  //         5000<10000 → +8；shared → +6；city2 modifier=-2 → 6+8+6-2=18
  // cityBonus=-3
  // total = 97*0.30 + 77*0.25 + 50*0.25 + 40*0.20 - 18*0.10 + (-3)
  //       = 29.1 + 19.25 + 12.5 + 8 - 1.8 - 3 = 64.05 → 64
  it('场景 C：三线小工资合租 → 总分约 55-70', () => {
    const r = calculateScore({
      rent: 1200,
      income: 5000,
      commuteWeighted: 20,
      commuteTotalMinutes: 20,
      sunlight: 3,
      noise: 3,
      space: 2,
      condition: 3,
      subway: false,
      food: 3,
      facilities: 3,
      housingType: 'shared',
      cityType: '三线及以下',
      utility: 3,
      floor: 3,
      bathroom: 3,
      kitchen: 3,
    })
    expect(r.totalScore).toBeGreaterThanOrEqual(55)
    expect(r.totalScore).toBeLessThanOrEqual(70)
    expect(r.rentRatio).toBe(24)
    expect(r.housingType).toBe('shared')
  })

  // 场景 D：极端通勤
  // rent=3000, income=10000 → ratio=30 (二线整租 baseline=30, offset=0) → rentScore=85
  // total=140,fatigue=140 → base=100*e^(-140/60)=100*e^(-2.333)≈9.70 + bonus=-25(>90) → -15.3 → clamp 0
  // liveScore 全 3 → 50
  // lifeScore 全 3 → 50
  // stress: ratio=30>20 → 10*1.5=15；fatigue=140>30 → 110*0.4=44；income>=10000 → 0；whole→0；city3→0  → 59 → 59
  // cityBonus=0
  // total = 85*0.30 + 0*0.25 + 50*0.25 + 50*0.20 - 59*0.10 + 0
  //       = 25.5 + 0 + 12.5 + 10 - 5.9 = 42.1 → 42
  it('场景 D：极端通勤 → 总分低于 50', () => {
    const r = calculateScore({
      rent: 3000,
      income: 10000,
      commuteWeighted: 140,
      commuteTotalMinutes: 140,
      sunlight: 3,
      noise: 3,
      space: 3,
      condition: 3,
      subway: false,
      food: 3,
      facilities: 3,
      housingType: 'whole',
      cityType: '二线',
      utility: 3,
      floor: 3,
      bathroom: 3,
      kitchen: 3,
    })
    expect(r.totalScore).toBeLessThan(50)
    expect(r.commuteScore).toBe(0)
    expect(r.stress).toBeGreaterThan(40)
  })
})

describe('calculateScore - 极端输入鲁棒性', () => {
  it('全空输入不会崩 / 不会 NaN', () => {
    const r = calculateScore({})
    expect(Number.isFinite(r.totalScore)).toBe(true)
    expect(Number.isFinite(r.rentRatio)).toBe(true)
    expect(r.rentRatio).toBe(0)
  })

  it('rent=0, income=0 → rentRatio=0, commuteScore=100（无通勤）', () => {
    const r = calculateScore({
      rent: 0,
      income: 0,
      commuteWeighted: 0,
      commuteTotalMinutes: 0,
    })
    expect(r.rentRatio).toBe(0)
    // 无通勤：base=100，short bonus=+5 → clamp 100
    expect(r.commuteScore).toBe(100)
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

describe('calculateScore - 回归测试：subway 不再额外加 30 分', () => {
  it('subway 切换不会改变 lifeScore', () => {
    const base = {
      rent: 3000,
      income: 10000,
      commuteWeighted: 30,
      commuteTotalMinutes: 30,
      sunlight: 3,
      noise: 3,
      space: 3,
      condition: 3,
      food: 3,
      facilities: 3,
      housingType: 'whole' as const,
      cityType: 3,
    }
    const off = calculateScore({ ...base, subway: false })
    const on = calculateScore({ ...base, subway: true })
    expect(on.lifeScore).toBe(off.lifeScore)
  })

  it('subway 全 5 的场景下 lifeScore 不会超过 100', () => {
    const r = calculateScore({
      rent: 3000,
      income: 10000,
      space: 5,
      food: 5,
      facilities: 5,
      subway: true,
    })
    expect(r.lifeScore).toBeLessThanOrEqual(100)
  })
})
