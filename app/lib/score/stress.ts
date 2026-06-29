// ============================================================
// 压力指数（v1.6.3 D8：5 子项各自映射 0-100 后加权）
// ============================================================

import { STRESS_WEIGHTS, getCityBurden } from './constants'
import type { DimensionFeature, HousingType, ScoreInput } from './types'
import {
  type ContributingSubItem,
  clamp,
  pickStrongest,
  pickWeakest,
} from './utils'

/**
 * 压力指数特征向量（D8）：
 *
 *   rentBurden    (0.30)  (rentRatio - 20) × 3，clamp [0,100]
 *   commuteBurden (0.30)  (fatigue - 30) × 1，clamp [0,100]
 *   incomeBurden  (0.15)  (15000 - income) / 150，clamp [0,100]
 *   sharedBurden  (0.10)  整租→0 / 合租→60 / unknown→0（unknown 按整租宽松）
 *   cityBurden    (0.15)  一线→80 / 新一线→50 / 二线→20 / 三线及以下→0
 *
 * 负向维度：
 *   - strongest = 最大压力源（贡献值最高的子项）
 *   - weakest   = 最小压力源（贡献值最低的子项）
 *
 * 注意：本函数签名改为接受完整 input；rentRatio 由 index.ts 用
 *       calcRentRatio(input) 算好再传入（避免在压力维度重新算一遍）。
 */
export function calcStressFeature(args: {
  rentRatio: number
  input: ScoreInput
}): DimensionFeature {
  const { rentRatio, input } = args

  const rentBurdenScore = clamp((rentRatio - 20) * 3)
  const commuteBurdenScore = clamp((input.commuteWeighted - 30) * 1)
  const incomeBurdenScore = clamp((15000 - input.income) / 150)
  const sharedBurdenScore = mapSharedBurden(input.housingType)
  const cityBurdenScore = clamp(getCityBurden(input.cityType))

  const items: ContributingSubItem[] = [
    {
      key: 'rentBurden',
      label: '高房租',
      score: rentBurdenScore,
      contribution: rentBurdenScore * STRESS_WEIGHTS.rentBurden,
    },
    {
      key: 'commuteBurden',
      label: '长通勤',
      score: commuteBurdenScore,
      contribution: commuteBurdenScore * STRESS_WEIGHTS.commuteBurden,
    },
    {
      key: 'incomeBurden',
      label: '低收入',
      score: incomeBurdenScore,
      contribution: incomeBurdenScore * STRESS_WEIGHTS.incomeBurden,
    },
    {
      key: 'sharedBurden',
      label: '合租',
      score: sharedBurdenScore,
      contribution: sharedBurdenScore * STRESS_WEIGHTS.sharedBurden,
    },
    {
      key: 'cityBurden',
      label: '城市压力',
      score: cityBurdenScore,
      contribution: cityBurdenScore * STRESS_WEIGHTS.cityBurden,
    },
  ]

  const mainScore = clamp(items.reduce((sum, it) => sum + it.contribution, 0))

  return {
    mainScore,
    // 负向维度：strongest = 最大压力源 / weakest = 最小压力源
    weakest: pickWeakest(items),
    strongest: pickStrongest(items),
  }
}

function mapSharedBurden(housingType: HousingType): number {
  if (housingType === 'shared') return 60
  return 0 // 'whole' / 'unknown' 都按整租宽松处理
}
