# AGENTS.md · AI 协作速读

> 这是给 AI 协作助手（Claude / Cursor / Trae 等）的项目快速上手指南。  
> 人类读者请优先看 [README.md](./README.md)。

---

## 一、项目身份证

| 字段 | 值 |
|---|---|
| 名称 | 这房值不值 · Rent Worth It |
| 仓库 | https://github.com/JHV-v/rent-worth-it |
| 当前版本 | **v1.6.3**（见 [CHANGELOG.md](./CHANGELOG.md)） |
| 线上 | http://117.72.219.13:3000（备案中域名：jhx1ng.me） |
| 部署 | 京东云 ECS（Ubuntu 22.04） + PM2 + Nginx + Redis |
| 阶段 | 学生个人项目 / 作品集向，**不是商业产品** |

## 二、一句话价值主张

> 用 6 维特征向量（房租 / 通勤 / 居住 / 生活 / 压力 / 幸福）+ value/cost 公式（`baseScore = value × 0.65 + (100 - cost) × 0.35`）+ 短板惩罚，给一套租房方案算 0-100 分，配 10 档 persona 文案和 AI 风格辣评。  
> **不预测房价、不替用户做决定，只做"住得舒不舒服"的体检报告。**

## 三、技术栈

```
Next.js 14 (App Router) + TypeScript 5 + Tailwind CSS 3
ioredis（访问计数）+ @dnd-kit（拖拽排序）+ html2canvas（海报）
Vitest（140 个测试，1 个 skipped 调参打印）+ ESLint + Prettier
PM2 + Nginx + GitHub Actions（CI: lint/typecheck/test）
```

## 四、目录速查

```
app/
├── page.tsx                        输入页
├── result/page.tsx                 结果页
├── components/                     全局共享组件（表单 + Header + ContractSelectGroup + TagSelectGroup ...）
├── result/components/              结果页专属组件（Hero/Eval/Pros/Roast/Share）
├── lib/
│   ├── score/                      ⭐ 评分算法 v1.6.3 子模块（6 维 DimensionFeature + value/cost）
│   │   ├── index.ts                  主入口（calculateScore：合成 value/cost + 短板惩罚）
│   │   ├── types.ts                  类型定义（DimensionFeature / ScoreResult / RawScoreInput）
│   │   ├── constants.ts              城市修正 / 楼层 4 档 / RENT_DECAY 等
│   │   ├── utils.ts                  buildFeature 等公共工具
│   │   ├── rent.ts                   房租 exp 衰减
│   │   ├── commute.ts                通勤双层判断 + 对称 bonus
│   │   ├── housing.ts                居住 7 维加权
│   │   ├── life.ts                   生活（商超 / 餐饮 / 医疗 3 子项 + 空间）
│   │   ├── stress.ts                 压力维度
│   │   ├── happiness.ts              幸福维度（合同期 + lifeDetails）
│   │   ├── integration.test.ts       ⭐ 9 场景集成测试（基线锁定，±2 容差）
│   │   └── *.test.ts                 单元测试就近
│   ├── adapter.ts                  表单 → 评分输入（CITY_TYPE_MIGRATION 等迁移）
│   ├── personas.ts                 10 档 persona
│   ├── resultText.ts               文案 / 辣评生成（读 *Feature.mainScore）
│   ├── storage.ts                  sessionStorage 续填（VERSION 3，FLOOR_TAG_MIGRATION）
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
├── v1.6.3-algorithm-refactor.md    ⭐ v1.6.3 算法重构 plan + 16 个 ADR（1399 行）
├── design/                         Stitch 设计稿历史
└── 初步设计.md                     最初构思

scripts/sync-version.mjs            package.json → HeaderSection.tsx badge 同步
```

## 五、关键决策与坑（必读）

### 算法层（v1.6.3 重构后）
- **总分公式 = 价值/成本**：`baseScore = value × 0.65 + (100 - cost) × 0.35`，再减短板惩罚得 `totalScore`
- **短板惩罚**：任一维度 `mainScore < 30` 时按 `(30 - score) × 0.3` 扣分，极端贫困场景可归零
- **6 维 DimensionFeature**：每个维度（rent / commute / live / life / stress / happiness）输出 `{ mainScore, weakest, strongest }`，为 v1.7 DiagnosticsModal 奠基。**禁止再用旧字段** `commuteScore` / `liveScore` / `lifeScore` / `stress`（已删除）
- **D1 city 拆分**：`cityBenefit` 进 value、`cityBurden` 进 cost，一线 `cityBurden = 80` 无法清零，**真·完美总分理论上限 ≈ 99**（不要再期望 100）
- **D5/D12b 便利度 3 子项**：商超 / 餐饮 / 医疗 独立打分，不再有单一"周边便利度"字段
- **D12a 楼层 4 档**：`电梯房 / 低层步梯(1-3) / 中层步梯(4-5) / 高层步梯(6+)`，旧 3 档数据由 `FLOOR_TAG_MIGRATION` 自动迁移
- **D12c 房租 exp 衰减**：`RENT_DECAY = 15`，租金占比超基线时分数指数下滑
- **D12d 通勤对称 bonus**：`+10 / 0 / -10 / -20` 四档（旧版只罚不奖）
- **合同期 + lifeDetails**：进 happiness 维度（半年 / 1年 / 2年+；0-12 项）
- **9 场景集成基线**：[integration.test.ts](./app/lib/score/integration.test.ts) 锁定 `expectedTotal ± 2`，**调参导致总分变化超过 2 分会立即被捕获**，先看是否合理再决定要不要更新基线
- 改 `app/lib/score/` 下任何文件 **必须跑 `npm test`**（140 个用例 / 1 skipped，0 容忍回归）

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
npm test                  # 跑 140 个测试
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

## 八、当前路线图（v1.6.3 之后）

- **v1.7.0**（中）：`DiagnosticsModal` —— 结果页消费 `*Feature.weakest` / `strongest` 数据，展示各维度短板/亮点详情；方法论页 `/methodology`、AI 辣评扩充、persona 个性化标签、一句日记
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
- 大型重构走"P1 类型 → P2 测试 → P3 输入 → P4 UI → P5 清理"分阶段实施，每阶段独立验证（v1.6.3 已验证可行，详见 [docs/v1.6.3-algorithm-refactor.md](./docs/v1.6.3-algorithm-refactor.md)）
- 用户常用"继续"驱动下一阶段推进，**不要**问"我要做什么"——直接看 plan 推进到下一节
- PowerShell 不支持 heredoc / `&&`，多命令用 `;` 串联；长输出用 `2>&1 | Select-Object -Last N` 截取

## 十、用户开局只说"读 AGENTS.md"时，你应该做什么

如果用户没给具体任务，**不要傻问"我能做什么"**。按以下顺序主动产出，把球抛回给用户：

1. **用 2-3 句话总结你读到的项目状态**（当前版本、最近做完什么、下一步是什么），证明你真的读懂了
2. **跑 `git log --oneline -5` 和 `git status`**，看看有没有未提交改动或最近的工作痕迹
3. **基于路线图给出 3 个"今晚就能开始"的最小切入点**，每个写清楚：
   - 改哪些文件
   - 预计改动量
   - 验收标准
4. **用 AskUserQuestion 把这 3 个方向列出来让用户选**，推荐项放第一个

参考模板：

> 看完 AGENTS.md，项目现在在 v1.6.3，刚把算法重构的 P1-P5 全跑完（6 维特征向量 + value/cost 公式 + 短板惩罚），下一步路线图列了 v1.7.0 DiagnosticsModal 和方法论页等。
> 
> 想做小一点的（一晚上）还是大一点的（多天）？给你三个选项：
> 
> A. **v1.7 - DiagnosticsModal**（推荐，最小闭环）：消费 v1.6.3 已经准备好的 `*Feature.weakest` / `strongest` 数据，结果页加一个折叠/弹窗展示各维度短板亮点。
> 
> B. **v1.7 - 方法论页 /methodology**：新建静态路由展示算法说明，可以直接引用 [docs/v1.6.3-algorithm-refactor.md](./docs/v1.6.3-algorithm-refactor.md) 的核心段落。
> 
> C. **小红书/B 站文案 + 截图素材**：不写代码，帮你产出推广物料。
> 
> 你想做哪个？或者今天就想休息也行，告诉我。

**绝对不要**：
- ❌ 自己挑一个直接开干（不尊重用户决策权）
- ❌ 只说"我读完了，请下达指令"（浪费对话轮次）
- ❌ 列一堆开放式问题（"你想做什么呢？" 是最差的开局）
