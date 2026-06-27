import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getRedis } from '../../../lib/redis'
import { getTodayDateString } from '../../../lib/dateUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RedisStatus = 'ok' | 'not_configured' | 'connect_failed' | 'ping_failed'

const PING_TIMEOUT_MS = 1500

async function pingWithTimeout(): Promise<RedisStatus> {
  const redis = getRedis()
  if (!redis) return 'not_configured'

  try {
    const pong = await Promise.race<string | null>([
      redis.ping(),
      new Promise<string | null>((resolve) =>
        setTimeout(() => resolve(null), PING_TIMEOUT_MS),
      ),
    ])
    if (pong === 'PONG') return 'ok'
    if (pong === null) return 'ping_failed'
    return 'ping_failed'
  } catch {
    return 'connect_failed'
  }
}

export async function GET(req: NextRequest) {
  const redisStatus = await pingWithTimeout()

  const allowedOriginConfigured = !!process.env.NEXT_PUBLIC_SITE_ORIGIN
  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''

  return NextResponse.json(
    {
      redis: redisStatus,
      origin: allowedOriginConfigured ? 'configured' : 'not_configured',
      currentOrigin: origin || '(empty)',
      allowedOriginConfigured,
      todayKey: getTodayDateString(),
      ts: Date.now(),
    },
    {
      // 不缓存：每次都返回最新自检结果
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
