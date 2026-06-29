import { describe, expect, it } from 'vitest'
import { mapFormDataToScoreInput, type RentFormData } from './adapter'

const HOUSING_TYPES = ['整租一居', '整租二居', '合租主卧', '合租次卧'] as const
const CITY_TYPES = ['一线', '新一线', '二线', '三线及以下', '三线', '四线', '县城', '乡镇'] as const

function buildForm(housing: string, city: string): RentFormData {
  return {
    salary: '10000',
    rent: '3000',
    deposit: '押一',
    agencyFee: '无',
    paymentCycle: '月付',
    contractTerm: '1年',
    activeOptions: {
      城市类型: [city],
      租赁类型: [housing],
    },
    commuteTimes: { 骑行: '20' },
    commuteOrder: ['骑行', '公共交通', '驾车', '步行'],
  }
}

describe('mapFormDataToScoreInput', () => {
  it('在所有 housing × city 组合下不抛错', () => {
    for (const housing of HOUSING_TYPES) {
      for (const city of CITY_TYPES) {
        expect(() => mapFormDataToScoreInput(buildForm(housing, city))).not.toThrow()
      }
    }
  })

  it('合租场景下 housingType=shared', () => {
    const r = mapFormDataToScoreInput(buildForm('合租主卧', '一线'))
    expect(r.housingType).toBe('shared')
  })

  it('整租场景下 housingType=whole', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '二线'))
    expect(r.housingType).toBe('whole')
  })

  it('未选租赁类型时 housingType=unknown', () => {
    const form = buildForm('整租一居', '一线')
    form.activeOptions['租赁类型'] = []
    const r = mapFormDataToScoreInput(form)
    expect(r.housingType).toBe('unknown')
  })
})

describe('migrateCityType（通过 adapter 输出验证）', () => {
  it('旧 tag "三线" 被迁移到 "三线及以下"', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '三线'))
    expect(r.cityType).toBe('三线及以下')
  })

  it('旧 tag "四线" 被迁移到 "三线及以下"', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '四线'))
    expect(r.cityType).toBe('三线及以下')
  })

  it('旧 tag "县城" 被迁移到 "三线及以下"', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '县城'))
    expect(r.cityType).toBe('三线及以下')
  })

  it('旧 tag "乡镇" 被迁移到 "三线及以下"', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '乡镇'))
    expect(r.cityType).toBe('三线及以下')
  })

  it('新 tag "一线" 保持不变', () => {
    const r = mapFormDataToScoreInput(buildForm('整租一居', '一线'))
    expect(r.cityType).toBe('一线')
  })
})

// v1.6.3 P5：subway 字段已从 RawScoreInput 移除（D1 之后地铁信号不再单独参与算法），
// 原 hasSubwayAccess 边界测试随之删除。

// ============================================================
// v1.6.3 新增字段映射
// ============================================================

describe('v1.6.3 - 商超 / 餐饮 / 医疗 3 个独立便利字段', () => {
  it('3 个字段独立设置 → 分别映射到 convenience / dining / medical', () => {
    const form = buildForm('整租一居', '一线')
    form.activeOptions['商超便利'] = ['很方便']
    form.activeOptions['餐饮便利'] = ['一般']
    form.activeOptions['医疗便利'] = ['不方便']
    const r = mapFormDataToScoreInput(form)
    expect(r.convenience).toBe(5) // 很方便
    expect(r.dining).toBe(3) // 一般
    expect(r.medical).toBe(1) // 不方便
  })

  it('未选 → 三个字段均为 undefined（normalize 走默认 3）', () => {
    const form = buildForm('整租一居', '一线')
    const r = mapFormDataToScoreInput(form)
    expect(r.convenience).toBeUndefined()
    expect(r.dining).toBeUndefined()
    expect(r.medical).toBeUndefined()
  })
})

describe('v1.6.3 - 生活小细节 → lifeDetails 数组传递', () => {
  it('勾选 3 项 → lifeDetails 数组长度 3', () => {
    const form = buildForm('整租一居', '一线')
    form.activeOptions['生活小细节'] = ['宠物友好', '晾晒方便', '有阳台']
    const r = mapFormDataToScoreInput(form)
    expect(Array.isArray(r.lifeDetails)).toBe(true)
    expect(r.lifeDetails?.length).toBe(3)
  })

  it('未选 → lifeDetails 为空数组', () => {
    const form = buildForm('整租一居', '一线')
    const r = mapFormDataToScoreInput(form)
    expect(r.lifeDetails).toEqual([])
  })
})

describe('v1.6.3 - contractTerm 直传', () => {
  it('"1年" 中文标签直传给 normalize', () => {
    const form = buildForm('整租一居', '一线')
    form.contractTerm = '1年'
    const r = mapFormDataToScoreInput(form)
    expect(r.contractTerm).toBe('1年')
  })
})
