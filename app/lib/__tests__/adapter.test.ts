import { describe, expect, it } from 'vitest'
import { mapFormDataToScoreInput, type RentFormData } from '../adapter'

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

describe('hasSubwayAccess 边界（通过 adapter 输出验证）', () => {
  it('公共交通时长>0 时 subway=true', () => {
    const form = buildForm('整租一居', '一线')
    form.commuteTimes = { 公共交通: '30' }
    expect(mapFormDataToScoreInput(form).subway).toBe(true)
  })

  it('公共交通时长=0 时不计为有地铁', () => {
    const form = buildForm('整租一居', '一线')
    form.commuteTimes = { 公共交通: '0' }
    expect(mapFormDataToScoreInput(form).subway).toBe(false)
  })

  it('没有公共交通时长但便利度=很方便 也算有地铁', () => {
    const form = buildForm('整租一居', '一线')
    form.commuteTimes = {}
    form.activeOptions['周边便利度'] = ['很方便']
    expect(mapFormDataToScoreInput(form).subway).toBe(true)
  })

  it('既无公共交通时长也无便利度=很方便 时 subway=false', () => {
    const form = buildForm('整租一居', '一线')
    form.commuteTimes = {}
    form.activeOptions['周边便利度'] = ['一般']
    expect(mapFormDataToScoreInput(form).subway).toBe(false)
  })

  it('commuteTimes 为空对象 + 没选便利度时 subway=false', () => {
    const form = buildForm('整租一居', '一线')
    form.commuteTimes = {}
    delete form.activeOptions['周边便利度']
    expect(mapFormDataToScoreInput(form).subway).toBe(false)
  })
})
