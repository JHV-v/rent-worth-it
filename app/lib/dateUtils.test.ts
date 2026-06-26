import { describe, expect, it } from 'vitest'
import { getTodayDateString } from './dateUtils'

describe('getTodayDateString', () => {
  it('返回的日期字符串符合 YYYY-MM-DD 格式', () => {
    const today = getTodayDateString()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('对同一个 Date 输入，始终返回 Asia/Shanghai 时区的日期', () => {
    // UTC 2024-01-14 22:00:00Z 在上海是 2024-01-15 06:00:00
    const utcDate = new Date('2024-01-14T22:00:00Z')
    expect(getTodayDateString(utcDate)).toBe('2024-01-15')
  })

  it('上海跨日边界：UTC 2024-01-15 15:59:59Z 仍是上海 01-15', () => {
    const utcDate = new Date('2024-01-15T15:59:59Z')
    expect(getTodayDateString(utcDate)).toBe('2024-01-15')
  })

  it('上海跨日边界：UTC 2024-01-15 16:00:00Z 已是上海 01-16', () => {
    const utcDate = new Date('2024-01-15T16:00:00Z')
    expect(getTodayDateString(utcDate)).toBe('2024-01-16')
  })

  it('跨时区不变：传入的 Date 表示的瞬时时间确定后，上海日期固定', () => {
    // 同一瞬时时间在 UTC、上海、纽约不同时区写法
    const instant = new Date('2024-06-15T08:00:00Z')
    // 任意时区下创建同一个时刻的 Date，输出仍是上海日期
    expect(getTodayDateString(instant)).toBe('2024-06-15')
  })
})
