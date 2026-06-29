// ============================================================
// v1.6.3 类型定义
// 特征向量架构：DimensionFeature / DimensionSubItem
// ============================================================

import type { TAG_DICTIONARY } from './constants'

export type ScoreField = keyof typeof TAG_DICTIONARY

// 户型类型：影响评分中的若干权重
export type HousingType = 'whole' | 'shared' | 'unknown'

// 维度特征向量
// - mainScore：维度主分（0-100）
// - weakest：贡献值最低的子项（用于诊断 / 文案）
// - strongest：贡献值最高的子项（用于诊断 / 文案）
// 房租 / 通勤维度只有 mainScore；居住 / 生活 / 压力 / 幸福有完整三元组。
export type DimensionSubItem = {
  key: string
  label: string
  score: number // 0-100
}

export type DimensionFeature = {
  mainScore: number
  weakest?: DimensionSubItem | null
  strongest?: DimensionSubItem | null
}

// 原始输入：标签可以是中文字符串、1-5 数字，或 undefined
export type RawScoreInput = {
  rent?: number | string
  income?: number | string
  sunlight?: string | number
  noise?: string | number
  space?: string | number
  condition?: string | number
  /** 商超便利度 */
  convenience?: number | string
  /** 餐饮便利度 */
  dining?: number | string
  /** 医疗便利度 */
  medical?: number | string
  /** 合同期（半年 / 1年 / 2年+） */
  contractTerm?: string | number
  /** 生活小细节多选（0-12 项） */
  lifeDetails?: string[]
  housingType?: HousingType
  cityType?: string | number
  utility?: string | number
  floor?: string | number
  bathroom?: string | number
  kitchen?: string | number
  /** 等效疲惫度时长（分钟） */
  commuteWeighted?: number
  /** 所有方式总通勤时长（分钟，不加权） */
  commuteTotalMinutes?: number
}

// 标准化后的输入：全部是确定的数值
export type ScoreInput = {
  rent: number
  income: number
  sunlight: number
  noise: number
  space: number
  condition: number
  /** 商超便利 1-5 */
  convenience: number
  /** 餐饮便利 1-5 */
  dining: number
  /** 医疗便利 1-5 */
  medical: number
  /** 合同期 1/2/3 ↔ 半年/1年/2年+；未填 → undefined（happiness 内 ?? 0 兜底） */
  contractTerm?: number
  /** 生活小细节勾选数量 0-12 */
  lifeDetails: number
  housingType: HousingType
  cityType: number
  utility: number
  floor: number
  bathroom: number
  kitchen: number
  commuteWeighted: number
  commuteTotalMinutes: number
}

export type ScoreResult = {
  totalScore: number
  rentRatio: number
  // 6 维度特征向量
  rentFeature: DimensionFeature
  commuteFeature: DimensionFeature
  liveFeature: DimensionFeature
  lifeFeature: DimensionFeature
  stressFeature: DimensionFeature
  happinessFeature: DimensionFeature
  persona: string
  housingType: HousingType
}
