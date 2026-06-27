// ============================================================
// 居住分（v1.6.0，统一加权版）
// ============================================================

import { HOUSING_WEIGHTS } from './constants'
import type { ScoreInput } from './types'
import { clamp, reverseFromFive, scaleFromFive } from './utils'

/**
 * 居住分（保留命名 calcLiveScore，便于兼容旧调用方）。
 *
 *   采光  sunlight  × 0.22
 *   噪音反向 noise  × 0.20
 *   卫浴  bathroom  × 0.16
 *   房况  condition × 0.15
 *   厨房  kitchen   × 0.12
 *   楼层  floor     × 0.10
 *   水电  utility   × 0.05
 *   合计 1.00
 *
 * 注意：空间感 space 已挪到生活分；不再区分整租/合租。
 */
export function calcLiveScore(input: ScoreInput): number {
  return clamp(
    scaleFromFive(input.sunlight) * HOUSING_WEIGHTS.sunlight +
      reverseFromFive(input.noise) * HOUSING_WEIGHTS.noise +
      scaleFromFive(input.bathroom) * HOUSING_WEIGHTS.bathroom +
      scaleFromFive(input.condition) * HOUSING_WEIGHTS.condition +
      scaleFromFive(input.kitchen) * HOUSING_WEIGHTS.kitchen +
      scaleFromFive(input.floor) * HOUSING_WEIGHTS.floor +
      scaleFromFive(input.utility) * HOUSING_WEIGHTS.utility,
  )
}
