// ============================================================
// 生活维度（v1.6.3 D12b：4 子项加权，D5 扩源 + 重命名）
// ============================================================

import { LIFE_WEIGHTS } from './constants'
import type { DimensionFeature, ScoreInput } from './types'
import {
  type ContributingSubItem,
  clamp,
  pickStrongest,
  pickWeakest,
  scaleFromFive,
} from './utils'

/**
 * 生活维度特征向量（D12b）：
 *
 *   空间感  space        × 0.30  (4 档：拥挤/偏小/刚好/宽敞)
 *   商超便利 convenience × 0.25  (3 档：差/中/好)
 *   餐饮便利 dining      × 0.25  (3 档：差/中/好)
 *   医疗便利 medical     × 0.20  (3 档：差/中/好)
 *   合计 1.00
 *
 * 正向维度：strongest = 生活强项 / weakest = 生活短板
 */
export function calcLifeFeature(input: ScoreInput): DimensionFeature {
  const spaceScore = scaleFromFive(input.space)
  const convenienceScore = scaleFromFive(input.convenience)
  const diningScore = scaleFromFive(input.dining)
  const medicalScore = scaleFromFive(input.medical)

  const items: ContributingSubItem[] = [
    {
      key: 'space',
      label: '空间感',
      score: spaceScore,
      contribution: spaceScore * LIFE_WEIGHTS.space,
    },
    {
      key: 'convenience',
      label: '商超便利',
      score: convenienceScore,
      contribution: convenienceScore * LIFE_WEIGHTS.convenience,
    },
    {
      key: 'dining',
      label: '餐饮便利',
      score: diningScore,
      contribution: diningScore * LIFE_WEIGHTS.dining,
    },
    {
      key: 'medical',
      label: '医疗便利',
      score: medicalScore,
      contribution: medicalScore * LIFE_WEIGHTS.medical,
    },
  ]

  const mainScore = clamp(items.reduce((sum, it) => sum + it.contribution, 0))

  return {
    mainScore,
    weakest: pickWeakest(items),
    strongest: pickStrongest(items),
  }
}
