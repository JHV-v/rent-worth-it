// ============================================================
// 幸福指数（v1.6.3 新增，D7）
// 3 子项加权：生活小细节 / 合同期 / 城市好处
// ============================================================

import {
  CONTRACT_BENEFIT,
  HAPPINESS_WEIGHTS,
  getCityBenefit,
} from './constants'
import type { DimensionFeature, ScoreInput } from './types'
import {
  type ContributingSubItem,
  clamp,
  pickStrongest,
  pickWeakest,
} from './utils'

/**
 * 幸福指数：
 *   - lifeDetails  (0.40)  生活小细节勾选数量 0-12 → count × 100/12
 *   - contractBenefit (0.30) 半年→0 / 1年→50 / 2年+→100
 *   - cityBenefit  (0.30)  一线→100 / 新一线→67 / 二线→33 / 三线及以下→0
 *
 * 正向维度：strongest = 最大幸福源 / weakest = 最少幸福源
 */
export function calcHappinessFeature(input: ScoreInput): DimensionFeature {
  const lifeDetailsCount = clamp(input.lifeDetails ?? 0, 0, 12)
  const lifeDetailsScore = clamp((lifeDetailsCount * 100) / 12)

  const contractTerm = input.contractTerm ?? 0
  const contractBenefitScore = clamp(CONTRACT_BENEFIT[contractTerm] ?? 0)

  const cityBenefitScore = clamp(getCityBenefit(input.cityType))

  const items: ContributingSubItem[] = [
    {
      key: 'lifeDetails',
      label: '生活小细节',
      score: lifeDetailsScore,
      contribution: lifeDetailsScore * HAPPINESS_WEIGHTS.lifeDetails,
    },
    {
      key: 'contractBenefit',
      label: '合同期',
      score: contractBenefitScore,
      contribution: contractBenefitScore * HAPPINESS_WEIGHTS.contractBenefit,
    },
    {
      key: 'cityBenefit',
      label: '城市好处',
      score: cityBenefitScore,
      contribution: cityBenefitScore * HAPPINESS_WEIGHTS.cityBenefit,
    },
  ]

  const mainScore = clamp(items.reduce((sum, it) => sum + it.contribution, 0))

  return {
    mainScore,
    weakest: pickWeakest(items),
    strongest: pickStrongest(items),
  }
}
