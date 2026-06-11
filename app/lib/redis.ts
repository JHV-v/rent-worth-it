import Redis from 'ioredis'

// 全局单例，避免热重载时创建多个连接
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | null | undefined
}

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
    client.on('error', () => {
      // 静默：避免日志刷屏；调用方会捕获错误并降级
    })
    globalThis.__redis = client
    return client
  } catch {
    globalThis.__redis = null
    return null
  }
}
