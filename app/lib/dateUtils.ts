// 日期工具函数：统一的日期格式化逻辑，避免重复实现。

/**
 * 获取当前日期的 YYYY-MM-DD 格式字符串
 * @returns 格式化的日期字符串，例如 "2024-01-15"
 */
export function getTodayDateString(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
