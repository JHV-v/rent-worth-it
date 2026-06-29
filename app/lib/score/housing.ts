// ============================================================
// 居住维度（v1.6.3 D12a：7 子项加权，权重候选 C 温和折中）
// ============================================================

import { HOUSING_WEIGHTS } from './constants'
import type { DimensionFeature, ScoreInput } from './types'
import {
  type ContributingSubItem,
  clamp,
  pickStrongest,
  pickWeakest,
  reverseFromFive,
  scaleFromFive,
} from './utils'

/**
 * 居住维度特征向量（D12a）：
 *
 *   采光  sunlight  × 0.20  (正向)
 *   噪音  noise     × 0.18  (反向：数值越大越吵 → reverseFromFive)
 *   卫浴  bathroom  × 0.16
 *   房况  condition × 0.15
 *   厨房  kitchen   × 0.13
 *   楼层  floor     × 0.10
 *   水电  utility   × 0.08
 *   合计 1.00
 *
 * 正向维度：strongest = 用户最得意的方面 / weakest = 居住短板
 */
export function calcLiveFeature(input: ScoreInput): DimensionFeature {
  const sunlightScore = scaleFromFive(input.sunlight)
  const noiseScore = reverseFromFive(input.noise)
  const bathroomScore = scaleFromFive(input.bathroom)
  const conditionScore = scaleFromFive(input.condition)
  const kitchenScore = scaleFromFive(input.kitchen)
  const floorScore = scaleFromFive(input.floor)
  const utilityScore = scaleFromFive(input.utility)

  const items: ContributingSubItem[] = [
    {
      key: 'sunlight',
      label: '采光',
      score: sunlightScore,
      contribution: sunlightScore * HOUSING_WEIGHTS.sunlight,
    },
    {
      key: 'noise',
      label: '噪音',
      score: noiseScore,
      contribution: noiseScore * HOUSING_WEIGHTS.noise,
    },
    {
      key: 'bathroom',
      label: '卫浴',
      score: bathroomScore,
      contribution: bathroomScore * HOUSING_WEIGHTS.bathroom,
    },
    {
      key: 'condition',
      label: '房况',
      score: conditionScore,
      contribution: conditionScore * HOUSING_WEIGHTS.condition,
    },
    {
      key: 'kitchen',
      label: '厨房',
      score: kitchenScore,
      contribution: kitchenScore * HOUSING_WEIGHTS.kitchen,
    },
    {
      key: 'floor',
      label: '楼层',
      score: floorScore,
      contribution: floorScore * HOUSING_WEIGHTS.floor,
    },
    {
      key: 'utility',
      label: '水电',
      score: utilityScore,
      contribution: utilityScore * HOUSING_WEIGHTS.utility,
    },
  ]

  const mainScore = clamp(items.reduce((sum, it) => sum + it.contribution, 0))

  return {
    mainScore,
    weakest: pickWeakest(items),
    strongest: pickStrongest(items),
  }
}
