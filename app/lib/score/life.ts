// ============================================================
// 生活分（v1.6.0，加权版）
// ============================================================

import { LIFE_WEIGHTS } from './constants'
import type { ScoreInput } from './types'
import { clamp, scaleFromFive } from './utils'

/**
 * 生活分：
 *   空间感 space     × 0.40
 *   周边便利 food    × 0.30
 *   生活细节 facilities × 0.30
 *
 * 注意：v1.6.0 删除 subway 的额外 +30 加成；subway 字段在 ScoreInput
 *       中保留供其他诊断用途，但不再参与生活分计算。
 */
export function calcLifeScore(input: ScoreInput): number {
  return clamp(
    scaleFromFive(input.space) * LIFE_WEIGHTS.space +
      scaleFromFive(input.food) * LIFE_WEIGHTS.food +
      scaleFromFive(input.facilities) * LIFE_WEIGHTS.facilities,
  )
}
