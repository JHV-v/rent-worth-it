// ============================================================
// v1.6.0 主入口
// ============================================================

import { pickPersona } from '../personas'
import { WEIGHTS, getCityModifier } from './constants'
import { calcCommuteScore } from './commute'
import { calcLifeScore } from './life'
import { calcLiveScore } from './housing'
import { normalizeInput } from './normalize'
import { calcRentScore } from './rent'
import { calcStress } from './stress'
import type { RawScoreInput, ScoreResult } from './types'
import { clamp } from './utils'

export function calculateScore(rawInput: RawScoreInput | null | undefined): ScoreResult {
  const input = normalizeInput(rawInput)

  const rentRatio = clamp((input.rent / input.income) * 100, 0, 999)
  const rentScore = calcRentScore(rentRatio, input.cityType, input.housingType)
  const commuteScore = calcCommuteScore({
    totalMinutes: input.commuteTotalMinutes,
    fatigueWeightedMinutes: input.commuteWeighted,
  })
  const liveScore = calcLiveScore(input)
  const lifeScore = calcLifeScore(input)
  const stress = calcStress(
    rentRatio,
    input.commuteWeighted,
    input.income,
    input.housingType,
    input.cityType,
  )

  const cityBonus = getCityModifier(input.cityType).bonus

  const totalScore = clamp(
    rentScore * WEIGHTS.rent +
      commuteScore * WEIGHTS.commute +
      liveScore * WEIGHTS.live +
      lifeScore * WEIGHTS.life -
      stress * WEIGHTS.stress +
      cityBonus,
  )

  return {
    totalScore: Math.round(totalScore),
    rentRatio: Math.round(rentRatio * 10) / 10,
    commuteScore: Math.round(commuteScore),
    liveScore: Math.round(liveScore),
    lifeScore: Math.round(lifeScore),
    stress: Math.round(stress),
    persona: pickPersona(totalScore).label,
    housingType: input.housingType,
  }
}

// ============================================================
// 重新导出，保持外部 API 稳定
// ============================================================

export { normalizeInput } from './normalize'
export {
  TAG_DICTIONARY,
  CITY_MODIFIER,
  WEIGHTS,
  RENT_BASELINE_WHOLE,
  RENT_BASELINE_SHARED,
  RENT_SEGMENTS,
  COMMUTE_FATIGUE_COEFFICIENT,
  COMMUTE_TOTAL_BONUS,
  COMMUTE_POSITION_WEIGHTS,
  HOUSING_WEIGHTS,
  LIFE_WEIGHTS,
  getCityModifier,
} from './constants'
export { calcRentScore } from './rent'
export { calcCommuteScore, calcCommuteTotalBonus } from './commute'
export { calcLiveScore } from './housing'
export { calcLifeScore } from './life'
export { calcStress } from './stress'
export type {
  HousingType,
  RawScoreInput,
  ScoreInput,
  ScoreResult,
  ScoreField,
} from './types'
