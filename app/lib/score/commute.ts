// ============================================================
// 通勤维度（v1.6.3 D12d：候选 1，调慢 exp + 对称 bonus）
// ============================================================

import { COMMUTE_BASE_DECAY, COMMUTE_TOTAL_BONUS } from './constants'
import type { DimensionFeature, ScoreInput } from './types'
import { clamp } from './utils'

/**
 * 通勤总时长加成 / 惩罚（v1.6.3 D12d 对称化）：
 *   <= 30 min  → +10
 *   30-60 min  → 0
 *   60-90 min  → -10
 *   > 90 min   → -20
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
 * 通勤维度特征向量（D12d）：
 *
 *   Step 1) fatigueWeighted = input.commuteWeighted
 *           ⚠️ 不在此处重新加权！adapter 已按模式系数 × 位置权重 算好。
 *   Step 2) totalMinutes    = input.commuteTotalMinutes
 *   Step 3) baseScore       = 100 × exp(-fatigueWeighted / 100)
 *   Step 4) bonus           = calcCommuteTotalBonus(totalMinutes)
 *   Step 5) mainScore       = clamp(baseScore + bonus, 0, 100)
 *
 * 无同质子项：weakest / strongest 均为 null（"疲惫度 + bonus"不同质）。
 */
export function calcCommuteFeature(input: ScoreInput): DimensionFeature {
  const fatigue =
    Number.isFinite(input.commuteWeighted) && input.commuteWeighted > 0
      ? input.commuteWeighted
      : 0
  const totalMinutes =
    Number.isFinite(input.commuteTotalMinutes) && input.commuteTotalMinutes > 0
      ? input.commuteTotalMinutes
      : 0

  const baseScore = 100 * Math.exp(-fatigue / COMMUTE_BASE_DECAY)
  const bonus = calcCommuteTotalBonus(totalMinutes)
  const mainScore = clamp(baseScore + bonus)

  return {
    mainScore,
    weakest: null,
    strongest: null,
  }
}
