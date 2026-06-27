# AGENTS.md · AI 协作速读

> 这是给 AI 协作助手（Claude / Cursor / Trae 等）的项目快速上手指南。  
> 人类读者请优先看 [README.md](./README.md)。

---

## 一、项目身份证

| 字段 | 值 |
|---|---|
| 名称 | 这房值不值 · Rent Worth It |
| 仓库 | https://github.com/JHV-v/rent-worth-it |
| 当前版本 | **v1.6.1**（见 [CHANGELOG.md](./CHANGELOG.md)） |
| 线上 | http://117.72.219.13:3000（备案中域名：jhx1ng.me） |
| 部署 | 京东云 ECS（Ubuntu 22.04） + PM2 + Nginx + Redis |
| 阶段 | 学生个人项目 / 作品集向，**不是商业产品** |

## 二、一句话价值主张

> 用 4 个客观维度（房租 / 通勤 / 居住 / 生活）+ 城市修正 + 压力扣分，给一套租房方案算 0-100 分，配 10 档 persona 文案和 AI 风格辣评。  
> **不预测房价、不替用户做决定，只做"住得舒不舒服"的体检报告。**

## 三、技术栈

```
Next.js 14 (App Router) + TypeScript 5 + Tailwind CSS 3
ioredis（访问计数）+ @dnd-kit（拖拽排序）+ html2canvas（海报）
Vitest（123 个测试）+ ESLint + Prettier
PM2 + Nginx + GitHub Actions（CI: lint/typecheck/test）
```

## 四、目录速查

```
app/
├── page.tsx                        输入页
├── result/page.tsx                 结果页
├── components/                     全局共享组件（表单 + Header）
├── result/components/              结果页专属组件（Hero/Eval/Pros/Roast/Share）
├── lib/
│   ├── score/                      ⭐ 评分算法 v1.6.0 子模块
│   │   ├── index.ts                  主入口（导出 calcScore）
│   │   ├── constants.ts              权重 / 城市修正 / 分段
│   │   ├── rent.ts                   房租分段函数
│   │   ├── commute.ts                通勤双层判断
│   │   ├── housing.ts                居住 7 维加权
│   │   ├── life.ts                   生活 3 维加权
│   │   ├── stress.ts                 压力扣分
│   │   └── *.test.ts                 测试就近放置
│   ├── adapter.ts                  表单 → 评分输入
│   ├── personas.ts                 10 档 persona
│   ├── resultText.ts               文案 / 辣评生成
│   ├── storage.ts                  sessionStorage 续填
│   ├── visitCounter.ts             访问计数客户端（含重试）
│   ├── redis.ts                    Redis 单例（enableOfflineQueue:true）
│   └── dateUtils.ts                Asia/Shanghai 时区
└── api/
    └── visit-count/
        ├── route.ts                GET/POST 计数（IP 限流 5min / Origin 校验 / 1.5s 超时）
        └── health/route.ts         GET 健康自检（v1.6.1 新增）

docs/
├── DEPLOYMENT.md                   部署流程
├── VISIT-COUNTER.md                ⭐ 访问计数服务器配置 + 故障排查 checklist
├── design/                         Stitch 设计稿历史
└── 初步设计.md                     最初构思

scripts/sync-version.mjs            package.json → HeaderSection.tsx badge 同步
```

## 五、关键决策与坑（必读）

### 算法层
- **房租分段，不是线性**：基准 30%（整租）/ 35%（合租），叠加城市修正（一线 +8 / 新一线 +4 / 二线 0 / 三线及以下 -4）
- **通勤双层判断**：基础分 `100 × exp(-fatigue/60)` + 总时长奖惩（短通勤 +5 / 长通勤 -10 / 极端 -25）
- **疲惫度按出行方式叠加**：步行/骑行/公交/驾车各有独立系数
- **WEIGHTS 已重平衡**：通勤 0.25 / 居住 0.25 / 房租 0.30 / 生活 0.20（v1.6.0 起）
- 改 `app/lib/score/` 下任何文件 **必须跑 `npm test`**（123 个用例，0 容忍回归）

### 工程层
- **Redis 必须 `enableOfflineQueue: true`**（v1.6.1 修复）  
  原因：Next.js 单例 + `enableOfflineQueue:false` + 首次冷启动调用 ping → 同步 reject "Stream isn't writeable"，不触发 error 事件，单例不会重置，永久卡死返回 fallback:true。  
  详见 commit `4d14dcd`。
- **访问计数的"零数据"策略**：宁可整块隐藏，绝不显示 0/0 假数据（[HeaderSection.tsx](./app/components/HeaderSection.tsx) 三态 UI：loading/ready/empty）
- **生产环境必须显式传环境变量给 PM2**：`next start` 不读 .env，要用 `REDIS_URL=... NEXT_PUBLIC_SITE_ORIGIN=... pm2 start npm --name rent-app -- start`
- **服务器调试遇到 fallback:true 时**：先 curl `/api/visit-count/health` 看 redis 字段是 `ok` / `not_configured` / `connect_failed` / `ping_failed`，对应排查见 [docs/VISIT-COUNTER.md](./docs/VISIT-COUNTER.md)
- **时区强制 Asia/Shanghai**：日期相关用 [`app/lib/dateUtils.ts`](./app/lib/dateUtils.ts) 而不是 `new Date()` 直接拿

## 六、常用命令

```bash
# 本地开发
npm run dev               # 启动 dev server（3000）
npm test                  # 跑 123 个测试
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
npm run build             # 生产构建

# 版本发布
# 1) 改 package.json version
# 2) node scripts/sync-version.mjs   把版本号同步到 HeaderSection badge
# 3) 改 README badge + 路线图
# 4) CHANGELOG [Unreleased] -> [x.y.z]
# 5) git commit + git tag v$VERSION + git push --follow-tags

# 服务器（京东云）
ssh root@117.72.219.13
cd /var/www/rent-app
git pull
npm run build
pm2 restart rent-app --update-env
curl http://localhost:3000/api/visit-count/health  # ⭐ 验证关键
```

## 七、工作规范

### Commit 风格
- `feat(scope): ...` 新功能
- `fix(scope): ...` bug 修复
- `docs: ...` 文档
- `refactor: ...` 重构（无行为改变）
- `chore: ...` 工程化
- `release: vX.Y.Z` 版本发布

### 改代码前必做
1. **读相关文件**，不要瞎改
2. score/* 任何改动跑 `npm test`
3. 涉及 API 跑 `npm run typecheck`
4. UI 改动尽量在 dev server 上看一眼

### 改代码后必做
1. 类型检查 + 测试通过
2. **更新 CHANGELOG `[Unreleased]`**（重要！避免发布前还要翻 git log）
3. 写 commit message 时说"为什么"（why），别只说"什么"（what）

### 不要做的事
- ❌ 不要主动写 README / 文档文件（除非用户明说）
- ❌ 不要在不知道改动影响时直接 `git push`
- ❌ 不要给 score 算法加"为了过测试而存在"的特例
- ❌ 不要在通勤/居住区加重复角标（用户对 UI 重复非常敏感）

## 八、当前路线图（v1.6.1 之后）

- **v1.6.2**（小，可选）：`ScoreResult.diagnostics` 字段（结果页展示各维度命中规则）、合同期加成、楼层内在评分映射
- **v1.7.0**（中）：方法论页 `/methodology`、AI 辣评扩充、persona 个性化标签、一句日记
- **v1.8.0**（中）：分享预览模态框、海报差异化模板
- **v2.0.0**（大，远期）：接入真实房价数据（贝壳/链家 API）

## 九、与 AI 协作时的偏好

用户是**学生开发者**，沟通偏好：
- 喜欢"先讨论再动手"的工程师风格，不喜欢盲目实现
- 中文沟通，技术名词可以保留英文
- 重视"为什么这么做"的根因解释，不只是"我改了什么"
- 决策点用 AskUserQuestion 列选项 + 推荐项，比开放式问题更省事
- 提交前先列出待改文件清单 → 用户拍板 → 再动手
- 服务器调试时给具体命令 + 预期输出 + 失败时分支决策
