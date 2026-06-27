// ============================================================
// v1.6.0 常量
// ============================================================

export const DEFAULT_SCORE = 3 as const

// 标签字典：UI 中文标签 → 1-5 数值；未匹配时回落到 DEFAULT_SCORE
export const TAG_DICTIONARY = {
  // 采光（正向）
  sunlight: {
    阳光充足: 5,
    南北通透: 5,
    全天采光: 5,
    南向充足: 4,
    采光良好: 4,
    半天采光: 3,
    一般: 3,
    采光较差: 2,
    几乎无光: 1,
    无窗: 1,
  } as Record<string, number>,

  // 噪音（反向：数值越大越吵）
  noise: {
    极其安静: 1,
    安静: 1,
    偶尔噪音: 2,
    一般: 3,
    略吵: 4,
    隔音较差: 4,
    隔音极差: 5,
    非常吵: 5,
  } as Record<string, number>,

  // 空间感（正向）
  space: {
    宽敞: 5,
    刚好: 4,
    适中: 4,
    偏小: 2,
    狭小: 2,
    拥挤: 1,
  } as Record<string, number>,

  // 新旧程度（正向）
  condition: {
    全新精装: 5,
    齐全且新: 5,
    较新: 4,
    刚好够用: 3,
    一般: 3,
    略旧: 2,
    破旧老化: 2,
    破败: 1,
    纯毛坯房: 1,
  } as Record<string, number>,

  cityType: {
    一线: 5,
    新一线: 4,
    二线: 3,
    '三线及以下': 2,
  } as Record<string, number>,

  utility: {
    民水民电: 5,
    商水商电: 2,
  } as Record<string, number>,

  floor: {
    电梯房: 5,
    低层步梯: 3,
    高层步梯: 1,
  } as Record<string, number>,

  bathroom: {
    独立卫浴: 5,
    双人共卫: 3,
    多人共卫: 1,
  } as Record<string, number>,

  kitchen: {
    不做饭: 4,
    偶尔排队: 3,
    经常排队: 1,
    开放厨房: 2,
  } as Record<string, number>,
} as const

// 城市等级修正系数：集中管理 rent / bonus / stress 三处差异化数值
// key 是 cityType 取值（1-5），高线城市租金更包容、生活体验加成更高、但压力也略增
export const CITY_MODIFIER: Record<
  5 | 4 | 3 | 2 | 1,
  { rent: number; bonus: number; stress: number }
> = {
  5: { rent: 8, bonus: 5, stress: 5 }, // 一线
  4: { rent: 4, bonus: 3, stress: 2 }, // 新一线
  3: { rent: 0, bonus: 0, stress: 0 }, // 二线
  2: { rent: -4, bonus: -3, stress: -2 }, // 三线及以下
  1: { rent: -6, bonus: -3, stress: -3 }, // 兜底
}

// 总分权重：四维加权 − 压力轻度拉低
// v1.6.0：通勤痛苦权重 0.20 → 0.25；居住 0.30 → 0.25
export const WEIGHTS = {
  rent: 0.3,
  commute: 0.25,
  live: 0.25,
  life: 0.2,
  stress: 0.1,
} as const

// 房租分段：基准 + 偏移
export const RENT_BASELINE_WHOLE = 30
export const RENT_BASELINE_SHARED = 35

export const RENT_SEGMENTS: ReadonlyArray<{ offset: number; score: number }> = [
  { offset: -10, score: 100 },
  { offset: -5, score: 95 },
  { offset: 0, score: 85 },
  { offset: 5, score: 70 },
  { offset: 10, score: 55 },
  { offset: 20, score: 30 },
  { offset: 30, score: 15 },
  { offset: Infinity, score: 0 },
]

// 通勤疲惫度系数（按出行方式）
export const COMMUTE_FATIGUE_COEFFICIENT: Record<string, number> = {
  '步行': 1.0,
  '骑行': 0.95,
  '公共交通': 1.05,
  '驾车': 1.1,
}

// 通勤总时长加成/惩罚（按"总实际通勤时长"分段）
export const COMMUTE_TOTAL_BONUS = {
  short: { max: 30, bonus: 5 },
  normal: { max: 60, bonus: 0 },
  long: { max: 90, bonus: -10 },
  extreme: { max: Infinity, bonus: -25 },
} as const

// 拖拽位置权重（adapter 计算疲惫度时使用）
export const COMMUTE_POSITION_WEIGHTS: ReadonlyArray<number> = [1.0, 0.7, 0.4, 0.2]

// 居住分内部权重（合计 1.00）
export const HOUSING_WEIGHTS = {
  sunlight: 0.22,
  noise: 0.2,
  bathroom: 0.16,
  condition: 0.15,
  kitchen: 0.12,
  floor: 0.1,
  utility: 0.05,
} as const

// 生活分内部权重（合计 1.00）
export const LIFE_WEIGHTS = {
  space: 0.4,
  food: 0.3,
  facilities: 0.3,
} as const

export function getCityModifier(cityType: number): {
  rent: number
  bonus: number
  stress: number
} {
  if (cityType >= 5) return CITY_MODIFIER[5]
  if (cityType >= 4) return CITY_MODIFIER[4]
  if (cityType >= 3) return CITY_MODIFIER[3]
  if (cityType >= 2) return CITY_MODIFIER[2]
  return CITY_MODIFIER[1]
}
