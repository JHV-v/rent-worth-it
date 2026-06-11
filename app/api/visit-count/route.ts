import { NextResponse } from 'next/server'
import { getRedis } from '../../lib/redis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOTAL_KEY = 'visit:total'
const TODAY_KEY = 'visit:today'

function getTodayDate(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET() {
  const redis = getRedis()
  if (!redis) {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }

  try {
    const todayDate = getTodayDate()
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
    const todayDate = getTodayDate()
    const [total, todayCount] = await Promise.all([
      redis.incr(TOTAL_KEY),
      redis.hincrby(TODAY_KEY, todayDate, 1),
    ])
    return NextResponse.json({ today: todayCount, total })
  } catch {
    return NextResponse.json({ today: 0, total: 0, fallback: true })
  }
}
