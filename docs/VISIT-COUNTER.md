# 访问计数 · 服务器配置 / 排查 Checklist

> 让 `今日访问 / 总访问` 真实可见。  
> 整套链路：浏览器 → `/api/visit-count` → Redis → 显示。

---

## 一次性配置（部署后做一次）

### 1. 安装并启用 Redis

```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

验证：

```bash
redis-cli ping
# 应输出：PONG
```

### 2. 配置项目环境变量

编辑 `/var/www/rent-app/.env`（没有就 `cp .env.example .env`）：

```env
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_SITE_ORIGIN=http://117.72.219.13:3000
```

> `NEXT_PUBLIC_SITE_ORIGIN` 必须与用户实际访问的地址（协议 + 域名 + 端口）一致。  
> 备案下来换 `https://jhx1ng.me` 时记得改这里。

### 3. PM2 加载新环境

```bash
cd /var/www/rent-app
pm2 restart rent-app --update-env
```

`--update-env` 是关键，否则 PM2 不会重读 `.env`。

### 4. 验证服务端自检

```bash
curl -s http://localhost:3000/api/visit-count/health | python3 -m json.tool
```

预期输出：

```json
{
  "redis": "ok",
  "origin": "configured",
  "currentOrigin": "(empty)",
  "allowedOriginConfigured": true,
  "todayKey": "2026-06-27",
  "ts": 1782546000000
}
```

也可以在浏览器直接打开 `http://你的域名/api/visit-count/health` 查看。  
此时 `currentOrigin` 会显示你浏览器实际带的来源，方便和 `NEXT_PUBLIC_SITE_ORIGIN` 对比。

### 5. 验证主页

刷新主页 → 状态条应显示 `今日访问: 1 · 总访问: 1`（首次）。  
5 分钟内连续刷新 → 数字不变（IP 限流，正常行为）。  
等 5 分钟以上或换 IP 再刷 → 数字 +1。

---

## 故障对照表

打开 `/api/visit-count/health`，对照下表：

| health 字段 / 现象 | 原因 | 修复 |
|---|---|---|
| `redis: "not_configured"` | `.env` 里没 `REDIS_URL`，或 PM2 没 `--update-env` | 检查 `.env` 行有没写错；重跑 `pm2 restart rent-app --update-env` |
| `redis: "connect_failed"` | Redis 进程没起 | `sudo systemctl start redis-server`，再 `redis-cli ping` 确认 |
| `redis: "ping_failed"` | Redis 假活（内存爆 / 卡死） | `sudo systemctl restart redis-server`；检查 `free -m` 内存 |
| `origin: "not_configured"` | `.env` 里没 `NEXT_PUBLIC_SITE_ORIGIN` | 配置 + pm2 --update-env |
| `currentOrigin` 与 `NEXT_PUBLIC_SITE_ORIGIN` 不一致 | 用户用了非配置地址（如 IP vs 域名） | 改 `NEXT_PUBLIC_SITE_ORIGIN` 或让用户走配置的地址 |
| 主页状态条一直显示 `--` | API 慢响应 / 服务端日志看 phase 标签 | `pm2 logs rent-app --lines 50` 看 `[visit-count]` 日志 |
| 主页状态条不显示（隐藏） | API 返回 fallback，3 秒兜底切到 empty | 同上排查 |

---

## 看 PM2 日志快速定位

```bash
pm2 logs rent-app --lines 30 --nostream | grep visit-count
```

日志会带标签：
- `[visit-count][ping] failed` → Redis 健康检查挂了
- `[visit-count][GET] timeout` → 读统计超时
- `[visit-count][POST] failed` → 写入失败
- `[visit-count][throttle] timeout` → 限流分支也超时

---

## 后续：备案完成 / 域名换了

```bash
# 1. 改 .env
sed -i 's|^NEXT_PUBLIC_SITE_ORIGIN=.*|NEXT_PUBLIC_SITE_ORIGIN=https://jhx1ng.me|' /var/www/rent-app/.env

# 2. 重启 PM2 加载新环境
cd /var/www/rent-app
pm2 restart rent-app --update-env

# 3. 验证
curl -s http://localhost:3000/api/visit-count/health
```

---

## 数据导出 / 清理（可选，应急）

```bash
# 看当前总数
redis-cli get visit:total

# 看今日数（按 YYYY-MM-DD 哈希）
redis-cli hgetall visit:today

# 看某 IP 是否在限流窗口里
redis-cli keys 'visited:*'

# 清空所有计数（谨慎！）
redis-cli del visit:total visit:today
```
