import Redis from 'ioredis'

// 全局单例，避免热重载时创建多个连接
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined
  // eslint-disable-next-line no-var
  var __redisLastErrorAt: number | undefined
}

const ERROR_LOG_INTERVAL_MS = 5 * 60 * 1000

/**
 * 获取 Redis 客户端单例。
 * 未配置 REDIS_URL 时返回 null，调用方需降级处理。
 *
 * 环境变量：
 *   REDIS_URL=redis://localhost:6379         （本地或同机部署）
 *   REDIS_URL=redis://:password@host:6379    （带密码）
 */
export function getRedis(): Redis | null {
  if (globalThis.__redis !== undefined) return globalThis.__redis

  const url = process.env.REDIS_URL
  if (!url) {
    globalThis.__redis = null
    return null
  }

  try {
    const client = new Redis(url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    })
    client.on('error', (err) => {
      // 节流：每 5 分钟最多打印一次，避免日志刷屏但不静默
      const now = Date.now()
      const last = globalThis.__redisLastErrorAt ?? 0
      if (now - last >= ERROR_LOG_INTERVAL_MS) {
        globalThis.__redisLastErrorAt = now
        console.error('[redis] connection error:', err?.message ?? err)
      }
    })
    // 连接关闭时清空单例，下次 getClient() 会重新建立
    const reset = () => {
      if (globalThis.__redis === client) {
        globalThis.__redis = undefined
      }
    }
    client.on('end', reset)
    client.on('close', reset)
    globalThis.__redis = client
    return client
  } catch {
    globalThis.__redis = null
    return null
  }
}
