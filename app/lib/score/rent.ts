// ============================================================
// 房租维度（v1.6.3 D12c：候选 K，低占比饱和 100 + 高占比 exp 衰减）
// ============================================================

import {
  RENT_BASELINE_SHARED,
  RENT_BASELINE_WHOLE,
  RENT_DECAY,
  getCityModifier,
} from './constants'
import type { DimensionFeature, ScoreInput } from './types'
import { clamp } from './utils'

/**
 * 房租维度特征向量（D12c）：
 *
 *   Step 1) rentRatio = input.rent / max(input.income, 1) × 100
 *   Step 2) baseline  = (shared ? 35 : 30) + cityModifier.rent
 *           注：housingType === 'unknown' 视为整租基准（不放宽）
 *   Step 3) offset    = rentRatio - baseline
 *   Step 4) score:
 *             offset <= 0  → 100        （死区饱和，不评价"为什么便宜"）
 *             offset >  0  → 100 × exp(-offset / 15)
 *
 * 无同质子项：返回 weakest / strongest 均为 null（按 D11 房租维度不输出）。
 */
export function calcRentFeature(input: ScoreInput): DimensionFeature {
  // Step 1：rentRatio（normalize 已 income >= 1，max() 是双保险）
  const income = Math.max(input.income, 1)
  const rentRatio = clamp((input.rent / income) * 100, 0, 999)

  // Step 2：baseline
  const baseSegment =
    input.housingType === 'shared' ? RENT_BASELINE_SHARED : RENT_BASELINE_WHOLE
  const cityRentModifier = getCityModifier(input.cityType).rent
  const baseline = baseSegment + cityRentModifier

  // Step 3：offset
  const offset = rentRatio - baseline

  // Step 4：mainScore
  const mainScore =
    offset <= 0 ? 100 : clamp(100 * Math.exp(-offset / RENT_DECAY))

  return {
    mainScore,
    weakest: null,
    strongest: null,
  }
}

/**
 * 工具：根据 input 计算 rentRatio。
 * index.ts 需要直接拿 rentRatio 用于压力侧 rentBurden 和返回值；
 * 与 calcRentFeature 内的 Step 1 保持一致（同样用 max(income, 1) 防御）。
 */
export function calcRentRatio(input: ScoreInput): number {
  const income = Math.max(input.income, 1)
  return clamp((input.rent / income) * 100, 0, 999)
}
