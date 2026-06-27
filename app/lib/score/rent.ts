// ============================================================
// 房租分段函数（v1.6.0）
// ============================================================

import {
  RENT_BASELINE_SHARED,
  RENT_BASELINE_WHOLE,
  RENT_SEGMENTS,
  getCityModifier,
} from './constants'
import type { HousingType } from './types'
import { clamp } from './utils'

/**
 * 房租分段评分。
 *
 * @param rentRatio   房租/月薪 × 100（百分比）
 * @param cityType    城市等级 1-5
 * @param housingType 户型类型
 * @returns 0-100 分
 *
 * 算法：
 *   1) 基准比例：合租 35%，否则 30%
 *   2) 城市修正：baseline + CITY_MODIFIER.rent（一线 +8 → baseline 38）
 *   3) 计算 offset = rentRatio - adjustedBaseline
 *   4) 在 RENT_SEGMENTS 内查找 offset 所在区间并做线性插值
 */
export function calcRentScore(
  rentRatio: number,
  cityType: number,
  housingType: HousingType,
): number {
  if (!Number.isFinite(rentRatio)) return 0

  const baseSegment =
    housingType === 'shared' ? RENT_BASELINE_SHARED : RENT_BASELINE_WHOLE
  const cityModifier = getCityModifier(cityType).rent
  const adjustedBaseline = baseSegment + cityModifier
  const offset = rentRatio - adjustedBaseline

  // 小于等于第一个 segment.offset → 取首段分数
  if (offset <= RENT_SEGMENTS[0].offset) {
    return clamp(RENT_SEGMENTS[0].score)
  }

  // 在相邻 segment 之间线性插值
  for (let i = 1; i < RENT_SEGMENTS.length; i++) {
    const prev = RENT_SEGMENTS[i - 1]
    const curr = RENT_SEGMENTS[i]
    if (offset <= curr.offset) {
      if (!Number.isFinite(curr.offset)) {
        // 最后一个 Infinity 段：不再插值，直接返回该段分数
        return clamp(curr.score)
      }
      const span = curr.offset - prev.offset
      if (span <= 0) return clamp(curr.score)
      const ratio = (offset - prev.offset) / span
      const interpolated = prev.score + (curr.score - prev.score) * ratio
      return clamp(interpolated)
    }
  }

  // 超过最后一个有限 segment：clamp 到 0
  return 0
}
