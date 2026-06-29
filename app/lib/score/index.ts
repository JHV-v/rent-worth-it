// ============================================================
// v1.6.3 主入口（特征推理 + 价值/成本公式）
// ============================================================

import { pickPersona } from '../personas'
import { calcCommuteFeature } from './commute'
import {
  COST_INFLUENCE,
  COST_WEIGHTS,
  SHORTFALL_PENALTY_FACTOR,
  SHORTFALL_THRESHOLD,
  VALUE_DOMINANCE,
  VALUE_WEIGHTS,
} from './constants'
import { calcHappinessFeature } from './happiness'
import { calcLifeFeature } from './life'
import { calcLiveFeature } from './housing'
import { normalizeInput } from './normalize'
import { calcRentFeature, calcRentRatio } from './rent'
import { calcStressFeature } from './stress'
import type { DimensionFeature, RawScoreInput, ScoreResult } from './types'
import { clamp } from './utils'

export function calculateScore(rawInput: RawScoreInput | null | undefined): ScoreResult {
  const input = normalizeInput(rawInput)

  // 1) rentRatio（压力侧 rentBurden 与返回值都要用，提前算）
  const rentRatio = calcRentRatio(input)

  // 2) 6 维度特征向量
  const rentFeature = calcRentFeature(input)
  const commuteFeature = calcCommuteFeature(input)
  const liveFeature = calcLiveFeature(input)
  const lifeFeature = calcLifeFeature(input)
  const stressFeature = calcStressFeature({ rentRatio, input })
  const happinessFeature = calcHappinessFeature(input)

  // 3) 价值 / 成本聚合（D10）
  const value =
    liveFeature.mainScore * VALUE_WEIGHTS.live +
    lifeFeature.mainScore * VALUE_WEIGHTS.life +
    happinessFeature.mainScore * VALUE_WEIGHTS.happiness

  const cost =
    (100 - rentFeature.mainScore) * COST_WEIGHTS.rent +
    (100 - commuteFeature.mainScore) * COST_WEIGHTS.commute +
    stressFeature.mainScore * COST_WEIGHTS.stress

  // 4) 基础分（价值主导，0.65/0.35）
  const baseScore = value * VALUE_DOMINANCE + (100 - cost) * COST_INFLUENCE

  // 5) 短板惩罚：4 客观维度任一 < 30 → 按差距扣分
  const shortfallPenalty = calcShortfallPenalty([
    rentFeature,
    commuteFeature,
    liveFeature,
    lifeFeature,
  ])

  const totalScore = clamp(baseScore + shortfallPenalty)

  return {
    totalScore: Math.round(totalScore),
    rentRatio: Math.round(rentRatio * 10) / 10,
    rentFeature,
    commuteFeature,
    liveFeature,
    lifeFeature,
    stressFeature,
    happinessFeature,
    persona: pickPersona(totalScore).label,
    housingType: input.housingType,
  }
}

/**
 * 短板惩罚：每个客观维度 mainScore < SHORTFALL_THRESHOLD（30）时，
 * 按 (30 - score) × SHORTFALL_PENALTY_FACTOR（0.3）扣分。
 *
 * 例：维度 0 分 → -9；维度 20 分 → -3；维度 30+ 分 → 0
 */
function calcShortfallPenalty(features: DimensionFeature[]): number {
  let penalty = 0
  for (const f of features) {
    if (f.mainScore < SHORTFALL_THRESHOLD) {
      penalty -= (SHORTFALL_THRESHOLD - f.mainScore) * SHORTFALL_PENALTY_FACTOR
    }
  }
  return penalty
}

// ============================================================
// 重新导出，保持外部 API 稳定
// ============================================================

export { normalizeInput } from './normalize'
export {
  TAG_DICTIONARY,
  CITY_MODIFIER,
  CITY_BURDEN,
  CITY_BENEFIT,
  CONTRACT_BENEFIT,
  CONTRACT_TERM_DICT,
  FLOOR_TAG_MIGRATION,
  RENT_BASELINE_WHOLE,
  RENT_BASELINE_SHARED,
  RENT_DECAY,
  COMMUTE_BASE_DECAY,
  COMMUTE_FATIGUE_COEFFICIENT,
  COMMUTE_TOTAL_BONUS,
  COMMUTE_POSITION_WEIGHTS,
  HOUSING_WEIGHTS,
  LIFE_WEIGHTS,
  STRESS_WEIGHTS,
  HAPPINESS_WEIGHTS,
  VALUE_WEIGHTS,
  COST_WEIGHTS,
  VALUE_DOMINANCE,
  COST_INFLUENCE,
  SHORTFALL_THRESHOLD,
  SHORTFALL_PENALTY_FACTOR,
  getCityModifier,
  getCityBurden,
  getCityBenefit,
} from './constants'
export { calcRentFeature, calcRentRatio } from './rent'
export { calcCommuteFeature, calcCommuteTotalBonus } from './commute'
export { calcLiveFeature } from './housing'
export { calcLifeFeature } from './life'
export { calcStressFeature } from './stress'
export { calcHappinessFeature } from './happiness'
export type {
  HousingType,
  RawScoreInput,
  ScoreInput,
  ScoreResult,
  ScoreField,
  DimensionFeature,
  DimensionSubItem,
} from './types'
