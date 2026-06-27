// ============================================================
// 通勤双层判断（v1.6.0）
// ============================================================

import { COMMUTE_TOTAL_BONUS } from './constants'
import { clamp } from './utils'

/**
 * 通勤总时长加成 / 惩罚（按总实际通勤时长）
 *   <= 30 分钟      → +5  (短通勤奖励)
 *   30 < x <= 60    → 0
 *   60 < x <= 90    → -10 (标准惩罚)
 *   > 90            → -25 (加倍惩罚)
 */
export function calcCommuteTotalBonus(totalMinutes: number): number {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return COMMUTE_TOTAL_BONUS.short.bonus
  }
  if (totalMinutes <= COMMUTE_TOTAL_BONUS.short.max) return COMMUTE_TOTAL_BONUS.short.bonus
  if (totalMinutes <= COMMUTE_TOTAL_BONUS.normal.max) return COMMUTE_TOTAL_BONUS.normal.bonus
  if (totalMinutes <= COMMUTE_TOTAL_BONUS.long.max) return COMMUTE_TOTAL_BONUS.long.bonus
  return COMMUTE_TOTAL_BONUS.extreme.bonus
}

/**
 * 通勤评分（双层判断）。
 *
 *   baseScore = 100 * exp(-fatigueWeightedMinutes / 60)
 *   bonus     = 见 calcCommuteTotalBonus
 *   result    = clamp(baseScore + bonus, 0, 100)
 */
export function calcCommuteScore(args: {
  totalMinutes: number
  fatigueWeightedMinutes: number
}): number {
  const { totalMinutes, fatigueWeightedMinutes } = args
  const fatigue =
    Number.isFinite(fatigueWeightedMinutes) && fatigueWeightedMinutes > 0
      ? fatigueWeightedMinutes
      : 0
  const baseScore = 100 * Math.exp(-fatigue / 60)
  const bonus = calcCommuteTotalBonus(totalMinutes)
  return clamp(baseScore + bonus)
}
