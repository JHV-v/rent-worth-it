// ============================================================
// 通用工具函数
// ============================================================

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, Math.min(max, value))
}

export function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// 把单个标签转成 1-5 分数；数字则裁剪到 1-5
export function tagToScore(tag: unknown, dict: Record<string, number>): number {
  if (typeof tag === 'number') {
    return clamp(tag, 1, 5)
  }
  if (typeof tag === 'string' && dict[tag] != null) {
    return dict[tag]
  }
  return 3
}

// 1-5 → 0-100（正向）
export function scaleFromFive(value: number): number {
  return clamp(((value - 1) / 4) * 100)
}

// 1-5 → 0-100（反向，给 noise 用）
export function reverseFromFive(value: number): number {
  return clamp(((5 - value) / 4) * 100)
}
