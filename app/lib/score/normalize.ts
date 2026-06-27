// ============================================================
// 输入标准化层
// ============================================================

import { DEFAULT_SCORE, TAG_DICTIONARY } from './constants'
import type { RawScoreInput, ScoreInput } from './types'
import { clamp, tagToScore, toNumber } from './utils'

export function normalizeInput(rawInput: RawScoreInput | null | undefined): ScoreInput {
  const safe = rawInput ?? {}
  return {
    rent: Math.max(0, toNumber(safe.rent, 0)),
    income: Math.max(1, toNumber(safe.income, 1)), // 防止除零
    commuteTime: Math.max(0, toNumber(safe.commuteTime, 0)),
    sunlight: tagToScore(safe.sunlight, TAG_DICTIONARY.sunlight),
    noise: tagToScore(safe.noise, TAG_DICTIONARY.noise),
    space: tagToScore(safe.space, TAG_DICTIONARY.space),
    condition: tagToScore(safe.condition, TAG_DICTIONARY.condition),
    subway: Boolean(safe.subway),
    food: clamp(toNumber(safe.food, DEFAULT_SCORE), 1, 5),
    facilities: clamp(toNumber(safe.facilities, DEFAULT_SCORE), 1, 5),
    housingType: safe.housingType ?? 'unknown',
    cityType: tagToScore(safe.cityType, TAG_DICTIONARY.cityType),
    utility: tagToScore(safe.utility, TAG_DICTIONARY.utility),
    floor: tagToScore(safe.floor, TAG_DICTIONARY.floor),
    bathroom: tagToScore(safe.bathroom, TAG_DICTIONARY.bathroom),
    kitchen: tagToScore(safe.kitchen, TAG_DICTIONARY.kitchen),
    commuteWeighted: Math.max(0, toNumber(safe.commuteWeighted, 0)),
    commuteTotalMinutes: Math.max(0, toNumber(safe.commuteTotalMinutes, 0)),
  }
}
