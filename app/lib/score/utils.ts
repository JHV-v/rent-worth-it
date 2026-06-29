// ============================================================
// 通用工具函数
// ============================================================

import type { DimensionSubItem } from './types'

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

// ============================================================
// v1.6.3 特征向量公共工具：weakest / strongest 选取（D11）
// ============================================================

export type ContributingSubItem = DimensionSubItem & {
  /** 贡献值 = 子项分 × 子项权重，用于决定 weakest/strongest 排序 */
  contribution: number
}

/**
 * 选取 weakest：贡献值最低的子项。
 * 阈值过滤：所有子项 score ≥ 80 时返回 null（没有"短板"展示价值）。
 * 并列：按 key 字母序取靠前的。
 *
 * 注：阈值规则对正/负向维度通用——score 自身的语义已经反映"分高=好/分高=压大"。
 */
export function pickWeakest(
  items: ContributingSubItem[],
): DimensionSubItem | null {
  if (items.length === 0) return null
  if (items.every((it) => it.score >= 80)) return null
  const sorted = [...items].sort(
    (a, b) => a.contribution - b.contribution || a.key.localeCompare(b.key),
  )
  const it = sorted[0]
  return { key: it.key, label: it.label, score: it.score }
}

/**
 * 选取 strongest：贡献值最高的子项。
 * 阈值过滤：所有子项 score ≤ 30 时返回 null（没有"强项"展示价值）。
 * 并列：按 key 字母序取靠前的。
 */
export function pickStrongest(
  items: ContributingSubItem[],
): DimensionSubItem | null {
  if (items.length === 0) return null
  if (items.every((it) => it.score <= 30)) return null
  const sorted = [...items].sort(
    (a, b) => b.contribution - a.contribution || a.key.localeCompare(b.key),
  )
  const it = sorted[0]
  return { key: it.key, label: it.label, score: it.score }
}
