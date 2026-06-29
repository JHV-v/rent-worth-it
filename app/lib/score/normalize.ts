// ============================================================
// 输入标准化层（v1.6.3）
// 楼层标签：先过 FLOOR_TAG_MIGRATION 把旧"低层步梯/高层步梯"迁移到新 4 档
// ============================================================

import {
  CONTRACT_TERM_DICT,
  DEFAULT_SCORE,
  FLOOR_TAG_MIGRATION,
  TAG_DICTIONARY,
} from './constants'
import type { RawScoreInput, ScoreInput } from './types'
import { clamp, tagToScore, toNumber } from './utils'

export function normalizeInput(rawInput: RawScoreInput | null | undefined): ScoreInput {
  const safe = rawInput ?? {}

  // 楼层：旧标签先迁移到新 4 档（'低层步梯' → '低层步梯(1-3)' 等），再过字典
  const floorRaw = safe.floor
  const floorTag =
    typeof floorRaw === 'string' && FLOOR_TAG_MIGRATION[floorRaw]
      ? FLOOR_TAG_MIGRATION[floorRaw]
      : floorRaw

  // 合同期：中文标签 → 1/2/3；若是数字直接 clamp 到 1-3
  const contractTermRaw = safe.contractTerm
  let contractTerm: number | undefined
  if (typeof contractTermRaw === 'number') {
    contractTerm = clamp(contractTermRaw, 1, 3)
  } else if (typeof contractTermRaw === 'string') {
    contractTerm = CONTRACT_TERM_DICT[contractTermRaw]
  }

  // 生活小细节：string[] → 勾选数量（0-12）；undefined → 0
  const lifeDetails = Array.isArray(safe.lifeDetails)
    ? clamp(safe.lifeDetails.length, 0, 12)
    : 0

  return {
    rent: Math.max(0, toNumber(safe.rent, 0)),
    income: Math.max(1, toNumber(safe.income, 1)), // 防止除零
    sunlight: tagToScore(safe.sunlight, TAG_DICTIONARY.sunlight),
    noise: tagToScore(safe.noise, TAG_DICTIONARY.noise),
    space: tagToScore(safe.space, TAG_DICTIONARY.space),
    condition: tagToScore(safe.condition, TAG_DICTIONARY.condition),
    convenience: clamp(toNumber(safe.convenience, DEFAULT_SCORE), 1, 5),
    dining: clamp(toNumber(safe.dining, DEFAULT_SCORE), 1, 5),
    medical: clamp(toNumber(safe.medical, DEFAULT_SCORE), 1, 5),
    contractTerm,
    lifeDetails,
    housingType: safe.housingType ?? 'unknown',
    cityType: tagToScore(safe.cityType, TAG_DICTIONARY.cityType),
    utility: tagToScore(safe.utility, TAG_DICTIONARY.utility),
    floor: tagToScore(floorTag, TAG_DICTIONARY.floor),
    bathroom: tagToScore(safe.bathroom, TAG_DICTIONARY.bathroom),
    kitchen: tagToScore(safe.kitchen, TAG_DICTIONARY.kitchen),
    commuteWeighted: Math.max(0, toNumber(safe.commuteWeighted, 0)),
    commuteTotalMinutes: Math.max(0, toNumber(safe.commuteTotalMinutes, 0)),
  }
}
