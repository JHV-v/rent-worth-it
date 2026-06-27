// ============================================================
// 压力指数（v1.6.0）
// ============================================================

import { getCityModifier } from './constants'
import type { HousingType } from './types'
import { clamp } from './utils'

/**
 * 压力指数：
 *   - 房租超 20% 部分 × 1.5
 *   - 通勤超 30 分钟（等效疲惫度分钟数） × 0.4
 *   - 收入惩罚：<5000 +15；<10000 +8
 *   - 合租额外惩罚：+6（v1.6.0 由 +8 调整为 +6）
 *   - 城市修正：CITY_MODIFIER.stress
 */
export function calcStress(
  rentRatio: number,
  commuteWeighted: number,
  income: number,
  housingType: HousingType,
  cityType: number,
): number {
  const incomePenalty = income < 5000 ? 15 : income < 10000 ? 8 : 0
  const sharedPenalty = housingType === 'shared' ? 6 : 0
  const cityModifier = getCityModifier(cityType).stress
  return clamp(
    Math.max(0, rentRatio - 20) * 1.5 +
      Math.max(0, commuteWeighted - 30) * 0.4 +
      incomePenalty +
      sharedPenalty +
      cityModifier,
  )
}
