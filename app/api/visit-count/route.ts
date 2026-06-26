import { NextResponse } from 'next/server'
import { getRedis } from '../../lib/redis'
import { getTodayDateString } from '../../lib/dateUtils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOTAL_KEY = 'visit:total'
const TODAY_KEY = 'visit:today'

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

export async function POST() {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }

  try {
    const todayDate = getTodayDateString()
    const [total, todayCount] = await Promise.all([
      redis.incr(TOTAL_KEY),
      redis.hincrby(TODAY_KEY, todayDate, 1),
    ])
    return NextResponse.json({ today: todayCount, total })
  } catch {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }
}
