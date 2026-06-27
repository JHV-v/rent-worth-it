import type { HousingType, RawScoreInput } from './score'
import {
  COMMUTE_FATIGUE_COEFFICIENT,
  COMMUTE_POSITION_WEIGHTS,
} from './score/constants'

export type RentFormData = {
  salary: string
  rent: string
  deposit: string
  agencyFee: string
  paymentCycle: string
  contractTerm: string
  activeOptions: Record<string, string[]>
  commuteTimes: Record<string, string>
  commuteOrder: string[]
}

function pickFirstTag(tags: string[] | undefined): string | undefined {
  return tags?.find((t) => t && t.length > 0)
}

function detectHousingType(tags: string[] | undefined): HousingType {
  const tag = pickFirstTag(tags)
  if (!tag) return 'unknown'
  if (tag.startsWith('合租')) return 'shared'
  if (tag.startsWith('整租')) return 'whole'
  return 'unknown'
}

/**
 * 等效疲惫度时长（v1.6.0）：
 *   sum_i minutes_i × positionWeight_i × fatigueCoeff_i
 *
 * - positionWeight 依据拖拽顺序（1.0 / 0.7 / 0.4 / 0.2）
 * - fatigueCoeff 依据出行方式（COMMUTE_FATIGUE_COEFFICIENT）
 * - 0 分钟的方式跳过
 */
function calcCommuteFatigueMinutes(
  commuteTimes: Record<string, string> | undefined,
  commuteOrder: string[] | undefined,
): number {
  if (!commuteTimes) return 0

  const order =
    commuteOrder && commuteOrder.length > 0
      ? commuteOrder
      : Object.keys(commuteTimes)

  let sum = 0
  for (let i = 0; i < order.length; i++) {
    const method = order[i]
    const minutes = Number(commuteTimes[method])
    if (!Number.isFinite(minutes) || minutes <= 0) continue
    const positionWeight = COMMUTE_POSITION_WEIGHTS[i] ?? 0.1
    const fatigue = COMMUTE_FATIGUE_COEFFICIENT[method] ?? 1.0
    sum += minutes * positionWeight * fatigue
  }
  return sum
}

/** 所有方式时长求和（不加权） */
function calcCommuteTotalMinutes(
  commuteTimes: Record<string, string> | undefined,
): number {
  if (!commuteTimes) return 0
  return Object.values(commuteTimes)
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0)
    .reduce((a, b) => a + b, 0)
}

const CITY_TYPE_MIGRATION: Record<string, string> = {
  '三线': '三线及以下',
  '四线': '三线及以下',
  '县城': '三线及以下',
  '乡镇': '三线及以下',
}

function migrateCityType(tag: string | undefined): string | undefined {
  if (!tag) return tag
  return CITY_TYPE_MIGRATION[tag] ?? tag
}

function hasSubwayAccess(
  commuteTimes: Record<string, string> | undefined,
  convenienceTags: string[] | undefined,
): boolean {
  if (commuteTimes) {
    const publicTransit = Number(commuteTimes['公共交通'])
    if (Number.isFinite(publicTransit) && publicTransit > 0) return true
  }
  const tag = pickFirstTag(convenienceTags)
  return tag === '很方便'
}

export function mapFormDataToScoreInput(form: RentFormData): RawScoreInput {
  const options = form.activeOptions ?? {}
  const convenience = options['周边便利度'] ?? options['配套便利']
  const convenienceTag = pickFirstTag(convenience)
  const applianceTag = pickFirstTag(options['家电配置'])

  return {
    rent: form.rent,
    income: form.salary,
    commuteWeighted: calcCommuteFatigueMinutes(form.commuteTimes, form.commuteOrder),
    commuteTotalMinutes: calcCommuteTotalMinutes(form.commuteTimes),
    sunlight: pickFirstTag(options['采光通风']),
    noise: pickFirstTag(options['隔音水平']),
    space: pickFirstTag(options['空间感觉']),
    condition: pickFirstTag(options['家电配置']),
    subway: hasSubwayAccess(form.commuteTimes, convenience),
    food: convenienceTag?.length ? mapConvenience(convenienceTag) : undefined,
    facilities: applianceTag?.length ? mapAppliance(applianceTag) : undefined,
    housingType: detectHousingType(options['租赁类型']),
    cityType: migrateCityType(pickFirstTag(options['城市类型'])),
    utility: pickFirstTag(options['水电收费']),
    floor: pickFirstTag(options['楼层类型']),
    bathroom: pickFirstTag(options['卫浴体验 (合租)']),
    kitchen: pickFirstTag(options['厨房体验 (合租)']),
  }
}

const CONVENIENCE_MAP: Record<string, number> = {
  很方便: 5,
  方便: 4,
  一般: 3,
  不方便: 1,
}

const APPLIANCE_MAP: Record<string, number> = {
  齐全且新: 5,
  较新: 4,
  刚好够用: 3,
  破旧老化: 2,
  纯毛坯房: 1,
}

function mapConvenience(tag: string | undefined): number {
  return tag != null && CONVENIENCE_MAP[tag] != null ? CONVENIENCE_MAP[tag] : 3
}

function mapAppliance(tag: string | undefined): number {
  return tag != null && APPLIANCE_MAP[tag] != null ? APPLIANCE_MAP[tag] : 3
}
