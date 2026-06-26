// 日期工具函数：统一的日期格式化逻辑，避免重复实现。

const SHANGHAI_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * 获取当前日期的 YYYY-MM-DD 格式字符串（固定使用 Asia/Shanghai 时区）。
 * 无论服务端 / 客户端时区如何，都返回上海的当天日期。
 * @returns 格式化的日期字符串，例如 "2024-01-15"
 */
export function getTodayDateString(date: Date = new Date()): string {
  // en-CA locale 默认输出 YYYY-MM-DD
  return SHANGHAI_DATE_FORMATTER.format(date)
}
