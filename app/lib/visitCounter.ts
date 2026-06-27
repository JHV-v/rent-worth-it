// 访问计数：仅展示来自 Redis 的真实计数（通过 /api/visit-count）。
// Redis 不可用时返回 {0,0}，由调用方决定是否隐藏，不再走 localStorage 兜底
// 以避免"本设备访问次数"被误读为"全网访问次数"。

export type VisitStats = {
  today: number
  total: number
}

const RETRY_DELAY_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---- 远程计数（Redis via /api/visit-count） ----

async function postOnce(): Promise<VisitStats | null> {
  try {
    const res = await fetch('/api/visit-count', { method: 'POST' })
    if (!res.ok) return null
    const data: VisitStats & { fallback?: boolean } = await res.json()
    if (data.fallback) return null
    return { today: data.today, total: data.total }
  } catch {
    return null
  }
}

async function getOnce(): Promise<VisitStats | null> {
  try {
    const res = await fetch('/api/visit-count', { method: 'GET' })
    if (!res.ok) return null
    const data: VisitStats & { fallback?: boolean } = await res.json()
    if (data.fallback) return null
    return { today: data.today, total: data.total }
  } catch {
    return null
  }
}

// 失败时自动重试一次（间隔 500ms），仍失败则返回 {0,0}
export async function incrementVisitRemote(): Promise<VisitStats> {
  const first = await postOnce()
  if (first) return first
  await sleep(RETRY_DELAY_MS)
  const retry = await postOnce()
  return retry ?? { today: 0, total: 0 }
}

export async function getVisitStatsRemote(): Promise<VisitStats> {
  const first = await getOnce()
  if (first) return first
  await sleep(RETRY_DELAY_MS)
  const retry = await getOnce()
  return retry ?? { today: 0, total: 0 }
}

// 千分位格式化：1284 → "1,284"
export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}
