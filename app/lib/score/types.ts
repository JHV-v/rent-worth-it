// ============================================================
// v1.6.0 类型定义
// ============================================================

import type { TAG_DICTIONARY } from './constants'

export type ScoreField = keyof typeof TAG_DICTIONARY

// 户型类型：影响评分中的若干权重
export type HousingType = 'whole' | 'shared' | 'unknown'

// 原始输入：标签可以是中文字符串、1-5 数字，或 undefined
export type RawScoreInput = {
  rent?: number | string
  income?: number | string
  commuteTime?: number | string
  sunlight?: string | number
  noise?: string | number
  space?: string | number
  condition?: string | number
  subway?: boolean
  food?: number | string
  facilities?: number | string
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
  commuteTime: number
  sunlight: number
  noise: number
  space: number
  condition: number
  subway: boolean
  food: number
  facilities: number
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
  commuteScore: number
  liveScore: number
  lifeScore: number
  stress: number
  persona: string
  housingType: HousingType
}
