import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '../../lib/redis'
import { getTodayDateString } from '../../lib/dateUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOTAL_KEY = 'visit:total'
const TODAY_KEY = 'visit:today'

// 从请求头解析客户端 IP（兼容反向代理）
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}

// 校验请求来源：必须匹配 NEXT_PUBLIC_SITE_ORIGIN 或本机来源
function isAllowedOrigin(req: NextRequest): boolean {
  const allowed = process.env.NEXT_PUBLIC_SITE_ORIGIN
  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''
  if (!origin) return false

  // 本机来源允许（开发环境）
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(origin)) return true

  if (!allowed) {
    // 未配置时，仅允许本机；其它一律拒绝
    return false
  }
  return origin.startsWith(allowed)
}

export async function GET() {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }

  try {
    const todayDate = getTodayDateString()
    const [totalRaw, todayRaw] = await Promise.all([
      redis.get(TOTAL_KEY),
      redis.hget(TODAY_KEY, todayDate),
    ])
    return NextResponse.json({
      today: Number(todayRaw) || 0,
      total: Number(totalRaw) || 0,
    })
  } catch {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }
}

export async function POST(req: NextRequest) {
  // Origin 校验
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }

  try {
    const todayDate = getTodayDateString()
    const ip = getClientIp(req)

    // IP 维度限流：每个 IP 每 5 分钟最多 +1
    // SET key value EX 300 NX，返回 OK 表示首次，返回 null 表示已限流
    const rateKey = `visited:${ip}:${todayDate}`
    const setRes = await redis.set(rateKey, '1', 'EX', 300, 'NX')
    if (setRes === null) {
      // 限流：跳过 INCR，返回当前值
      const [totalRaw, todayRaw] = await Promise.all([
        redis.get(TOTAL_KEY),
        redis.hget(TODAY_KEY, todayDate),
      ])
      return NextResponse.json({
        today: Number(todayRaw) || 0,
        total: Number(totalRaw) || 0,
        throttled: true,
      })
    }

    const [total, todayCount] = await Promise.all([
      redis.incr(TOTAL_KEY),
      redis.hincrby(TODAY_KEY, todayDate, 1),
    ])
    return NextResponse.json({ today: todayCount, total })
  } catch {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }
}
