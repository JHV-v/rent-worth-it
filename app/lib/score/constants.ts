// ============================================================
// v1.6.0 常量
// v1.6.3：特征推理架构常量
//   - 替换：HOUSING_WEIGHTS / LIFE_WEIGHTS / TAG_DICTIONARY.floor / TAG_DICTIONARY.space
//   - 新增：STRESS_WEIGHTS / HAPPINESS_WEIGHTS / VALUE_WEIGHTS / COST_WEIGHTS
//          CITY_BURDEN / CITY_BENEFIT / CONTRACT_BENEFIT / CONTRACT_TERM_DICT
//          RENT_DECAY / COMMUTE_BASE_DECAY / SHORTFALL_THRESHOLD / SHORTFALL_PENALTY_FACTOR
//          VALUE_DOMINANCE / COST_INFLUENCE / FLOOR_TAG_MIGRATION / getCityBurden / getCityBenefit
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

  // 空间感（正向，v1.6.3 D5：4 档，无中性 3 档；旧 sessionStorage 传入 3 走 scaleFromFive 得 50）
  space: {
    宽敞: 5,
    刚好: 4,
    偏小: 2,
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

  // 楼层（v1.6.3 D12a：4 档替换旧 3 档）
  floor: {
    '电梯房': 5,
    '低层步梯(1-3)': 4,
    '中层步梯(4-5)': 2,
    '高层步梯(6+)': 1,
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

// 旧楼层标签兼容迁移（防御旧 sessionStorage / 旧分享链接）
// 在 normalize 层先做迁移：拿到字符串 → 先过 FLOOR_TAG_MIGRATION → 再过 TAG_DICTIONARY.floor
export const FLOOR_TAG_MIGRATION: Record<string, string> = {
  '低层步梯': '低层步梯(1-3)',
  '高层步梯': '高层步梯(6+)',
}

// 城市等级修正系数：v1.6.3 D1 后只保留 rent 字段；bonus/stress 由 CITY_BENEFIT / CITY_BURDEN 接管
export const CITY_MODIFIER: Record<5 | 4 | 3 | 2 | 1, { rent: number }> = {
  5: { rent: 8 }, // 一线
  4: { rent: 4 }, // 新一线
  3: { rent: 0 }, // 二线
  2: { rent: -4 }, // 三线及以下
  1: { rent: -6 }, // 兜底
}

// 压力指数里的城市坏处档（D8）
export const CITY_BURDEN: Record<number, number> = {
  5: 80,
  4: 50,
  3: 20,
  2: 0,
  1: 0,
}

// 幸福指数里的城市好处档（D7）
export const CITY_BENEFIT: Record<number, number> = {
  5: 100,
  4: 67,
  3: 33,
  2: 0,
  1: 0,
}

// 合同期幸福映射（D6/D7）
// 索引：1=半年 / 2=1年 / 3=2年+；与 CONTRACT_TERM_DICT 对齐
export const CONTRACT_BENEFIT: Record<number, number> = {
  1: 0, // 半年 = 无加成
  2: 50, // 1 年
  3: 100, // 2 年+
}

// 合同期标签字典（normalize 用，把"半年/1年/2年+"中文字符串映射到 1/2/3）
export const CONTRACT_TERM_DICT: Record<string, number> = {
  '半年': 1,
  '1年': 2,
  '2年+': 3,
}

// 房租基准
export const RENT_BASELINE_WHOLE = 30
export const RENT_BASELINE_SHARED = 35

/** v1.6.3 D12c：高占比段 exp 衰减系数 */
export const RENT_DECAY = 15

// 通勤疲惫度系数（按出行方式，adapter 用）
export const COMMUTE_FATIGUE_COEFFICIENT: Record<string, number> = {
  '步行': 1.0,
  '骑行': 0.95,
  '公共交通': 1.05,
  '驾车': 1.1,
}

// 通勤总时长加成/惩罚（v1.6.3 D12d：对称 bonus +10/0/-10/-20）
export const COMMUTE_TOTAL_BONUS = {
  short: { max: 30, bonus: 10 }, // v1.6.3：+5 → +10（对称化）
  normal: { max: 60, bonus: 0 },
  long: { max: 90, bonus: -10 },
  extreme: { max: Infinity, bonus: -20 }, // v1.6.3：-25 → -20（对称化）
} as const

/** v1.6.3 D12d：exp 衰减系数 60 → 100（更平缓，短通勤获得合理高分） */
export const COMMUTE_BASE_DECAY = 100

// 拖拽位置权重（adapter 计算疲惫度时使用）
export const COMMUTE_POSITION_WEIGHTS: ReadonlyArray<number> = [1.0, 0.7, 0.4, 0.2]

// 居住分内部权重（v1.6.3 D12a 候选 C 温和折中，合计 1.00）
export const HOUSING_WEIGHTS = {
  sunlight: 0.2, // 旧 0.22
  noise: 0.18, // 旧 0.20
  bathroom: 0.16,
  condition: 0.15,
  kitchen: 0.13, // 旧 0.12
  floor: 0.1,
  utility: 0.08, // 旧 0.05
} as const

// 生活分内部权重（v1.6.3 D5/D12b：4 子项 space/convenience/dining/medical，合计 1.00）
export const LIFE_WEIGHTS = {
  space: 0.3, // 旧 0.40
  convenience: 0.25, // 旧 food 0.30 → 重命名 + 调权
  dining: 0.25, // 新增
  medical: 0.2, // 新增
} as const

// 压力指数内部权重（v1.6.3 D8 候选 B，合计 1.00）
export const STRESS_WEIGHTS = {
  rentBurden: 0.3,
  commuteBurden: 0.3,
  incomeBurden: 0.15,
  sharedBurden: 0.1,
  cityBurden: 0.15,
} as const

// 幸福指数内部权重（v1.6.3 D7 候选 2 三足鼎立，合计 1.00）
export const HAPPINESS_WEIGHTS = {
  lifeDetails: 0.4,
  contractBenefit: 0.3,
  cityBenefit: 0.3,
} as const

// 价值 / 成本外部权重（v1.6.3 D10 修订：价值内 0.45/0.35/0.20，让幸福传导 19.5 → 13.0）
export const VALUE_WEIGHTS = {
  live: 0.45,
  life: 0.35,
  happiness: 0.2,
} as const

export const COST_WEIGHTS = {
  rent: 0.4,
  commute: 0.3,
  stress: 0.3,
} as const

// 总分公式：基础分 = 价值 × 0.65 + (100 - 成本) × 0.35（D10）
export const VALUE_DOMINANCE = 0.65
export const COST_INFLUENCE = 0.35

// 短板惩罚（D10 第 4 步）：客观维度 < 30 时按 (30 - score) × 0.3 扣分
export const SHORTFALL_THRESHOLD = 30
export const SHORTFALL_PENALTY_FACTOR = 0.3

// ============================================================
// 兜底工具函数
// ============================================================

// 城市修正 rent
export function getCityModifier(cityType: number): { rent: number } {
  if (cityType >= 5) return CITY_MODIFIER[5]
  if (cityType >= 4) return CITY_MODIFIER[4]
  if (cityType >= 3) return CITY_MODIFIER[3]
  if (cityType >= 2) return CITY_MODIFIER[2]
  return CITY_MODIFIER[1]
}

// 压力侧城市坏处（D8）
export function getCityBurden(cityType: number): number {
  const key =
    cityType >= 5 ? 5 : cityType >= 4 ? 4 : cityType >= 3 ? 3 : cityType >= 2 ? 2 : 1
  return CITY_BURDEN[key]
}

// 幸福侧城市好处（D7）
export function getCityBenefit(cityType: number): number {
  const key =
    cityType >= 5 ? 5 : cityType >= 4 ? 4 : cityType >= 3 ? 3 : cityType >= 2 ? 2 : 1
  return CITY_BENEFIT[key]
}
