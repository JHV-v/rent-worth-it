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

### 设计 / UI 层（v1.6.4 沉淀，必读）

**配色 — 用户审美偏好**：
- 当前 `primary = #4f46e5`（indigo-600，Tailwind / Stripe / Notion 同款）是**用户多轮迭代后确认的**：
  - ❌ 不要：偏冷的深蓝（#0058be，被评"重"）/ 灰调（slate-600 被评"死气沉沉"）/ 鲜艳玫粉（rose-700 被评"太亮"）/ 暗灰（stone-700 被评"没活力"）/ 偏老气的 sky-700（被评"土气"）
  - ✅ 选定理由：素雅 + 有活力 + 实用辨识度 三者并存
- **如果用户再说"不好看"**：先问偏好（素雅 / 活力 / 商务 / 复古 / 年轻），不要盲目换色相。常见冲突：
  - "素雅" + "有活力" → 不能用纯灰，需要"有色相的中间色"
  - "美观优雅" ≠ "克制极简" → 优雅意味着"有品味的色彩选择"，不是"无色"
- **段落式按钮**（segmented）**不要堆多种语义色**，会显乱。多色差异化只在 grid 卡片（独立按钮、间距大）里做，例如 [采光通风 3 档](file:///e:/Vibe%20Coding/%E7%A7%9F%E6%88%BFver1.0.0/app/components/RentForm.tsx)（暖琥珀 / 中性 / 深夜靛蓝 + icon 适配色）
- 选中态保持**实心填充 + medium 阴影**（`shadow-md shadow-primary/25`），不要走"10% 透明底"路线（用户评"看不到选中"）

**生活小细节 12 项设计原则**：
- **数量恒为 12**：[happiness.ts](file:///e:/Vibe%20Coding/%E7%A7%9F%E6%88%BFver1.0.0/app/lib/score/happiness.ts) `lifeDetailsScore = count × 100 / 12`，clamp 上限 12，**改数量需重校 9 场景集成基线**
- **必须避开已有维度**：采光 / 通风 / 隔音 / 商超 / 餐饮 / 医疗 / 家电 / 楼层 / 卫浴 / 厨房 / 通勤 / 合同 — 这些都已经独立打分，不要在生活细节里重复
- **看房或签约阶段可验证**：不依赖入住后体验（押金退回 / 邻居关系等不算）
- **不个性化**：不要"可养宠物"、"可同住朋友/情侣"这类只对部分人群有意义的
- **不基本要求**：不要"门窗能正常关"这类房子本来就该有的
- **不政策不普及**：不要"智能门锁"、"电动车充电"这类不普及或太具体的
- 当前 12 项（v1.6.4 v10 终稿）：房东沟通顺畅 / 报修响应及时 / 网速够用 / 手机信号稳定 / 储物空间够 / 小区秩序好 / 快递站点方便 / 房屋无异味虫害 / 视野开阔不压抑 / 周边夜间安全 / 小区有绿化空间 / 卫生间布局合理

**交互手感**：
- **@dnd-kit TouchSensor 用 `distance: 5` 不用 `delay`**（v1.6.4）：移动端按下立即响应，避免 200ms 延迟感。配合 `touch-action: pan-y` + `will-change: transform` 让拖拽走 GPU 合成层
- **section 提示文案**：放在 section 标题右边、用 `items-baseline` 对齐基线，**不要单独成一个卡片**（用户评"糊在那里不美观"）。示例见 [RentForm 生活小细节 section](file:///e:/Vibe%20Coding/%E7%A7%9F%E6%88%BFver1.0.0/app/components/RentForm.tsx)
- **段落式按钮的 `accents` prop 已支持但不要乱用**：除非有强语义需求（如三色信号灯），否则保持紫主调一致性

## 六、常用命令

> **环境提示**：本地是 **Windows PowerShell**。不支持 heredoc / `&&`，多命令用 `;` 串联；长输出用 `2>&1 | Select-Object -Last N` 截取。

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
2. **改动跨多文件时，先列出待改文件清单交给用户拍板**，再动手
3. score/* 任何改动跑 `npm test`
4. 涉及 API 跑 `npm run typecheck`
5. UI 改动尽量在 dev server 上看一眼

### 改代码后必做
1. 类型检查 + 测试通过
2. **更新 CHANGELOG `[Unreleased]`**（重要！避免发布前还要翻 git log）
3. 写 commit message 时说"为什么"（why），别只说"什么"（what）

### 主动行为边界（谁掌舵）
- ✅ 用户没指令时，**默认沉默**，不主动列方向、不主动跑 git log
- ✅ 改完代码后，**不要自动 commit**，等用户明确说"commit / 提交"
- ✅ 改完 commit 后，**不要自动 push**，等用户明确说"push / 推送"
- ✅ **不要主动起 dev server**，等用户明确说"跑一下 / dev / 启动 / 自测"
- ✅ 大任务做完后，可以**用一两句话**报告完成状态 + 提一个"下一步可选"，但不强推

### 不要做的事
- ❌ 不要主动写 README / 文档文件（除非用户明说）
- ❌ 不要在不知道改动影响时直接 `git push`
- ❌ 不要给 score 算法加"为了过测试而存在"的特例
- ❌ 不要在通勤/居住区加重复角标（用户对 UI 重复非常敏感）
- ❌ 不要在 segmented 按钮组里堆 3 种以上语义色（v1.6.4 教训，用户评"混乱"）
- ❌ 不要把"看不见的好坏"作为 lifeDetails 选项（如押金能否退回 / 邻居关系等），用户**当下能否验证**才是底线
- ❌ 不要为了"克制简约"把选中态做成 10% 透明底 — 失去辨识度（v1.6.4 教训）

## 八、当前路线图（v1.6.3 之后）

- **v1.6.4**（已完成）：UI 抛光 —— 通勤拖动手感 / 生活细节 12 项重设 / 采光通风 grid 语义色 / primary 改 `#4f46e5` 靛紫蓝
- **v1.7.0**（中）：`DiagnosticsModal` —— 结果页消费 `*Feature.weakest` / `strongest` 数据，展示各维度短板/亮点详情；方法论页 `/methodology`、AI 辣评扩充、persona 个性化标签、一句日记
- **v1.8.0**（中）：分享预览模态框、海报差异化模板
- **v2.0.0**（大，远期）：接入真实房价数据（贝壳/链家 API）

## 九、与 AI 协作时的偏好

### 用户特点
- **学生开发者**，作品集向 / 不是商业产品
- 中文沟通，技术名词可以保留英文
- 审美偏好详见第五节"设计 / UI 层"

### 沟通风格
- 喜欢"先讨论再动手"的工程师风格，**不喜欢盲目实现**
- 重视"为什么这么做"的根因解释，不只是"我改了什么"
- 决策点用 `AskUserQuestion` 列选项 + 推荐项（推荐项放第一个），比开放式问题更省事
- 服务器调试时给具体命令 + 预期输出 + 失败时分支决策

### 协作节奏
- **用户掌舵，AI 是副驾驶**，不抢方向盘（详见第七节"主动行为边界"）
- 用户常用"继续"驱动下一阶段推进，**不要**问"我要做什么"——直接看 plan 推进到下一节
- 大型重构走"P1 类型 → P2 测试 → P3 输入 → P4 UI → P5 清理"分阶段实施，每阶段独立验证（v1.6.3 已验证可行，详见 [docs/v1.6.3-algorithm-refactor.md](./docs/v1.6.3-algorithm-refactor.md)）

## 十、用户开局只说"读 AGENTS.md"时，你应该做什么

**默认行为（推荐）**：

- 用 2-3 句话报告读完后的项目状态总结（当前版本 / 最近 1-2 个 commit / 路线图下一步）
- **然后停下来等用户开口**，不要列方向、不要 AskUserQuestion、不要跑 git log

参考默认回复模板：

> 看完 AGENTS.md，项目现在 v1.6.3 + v1.6.4 已落地（算法重构 + UI 抛光），路线图下一步是 v1.7 DiagnosticsModal。我准备好了，听你安排。

**触发主动列方向模板（仅当用户明确请求）**：

只有当用户说出类似 **"给我几个方向 / 推荐做什么 / 列几个选项 / 不知道做啥"** 这种**主动请求建议**的话时，才启用下面的"列 3 切入点 + AskUserQuestion"完整模板：

1. 跑 `git log --oneline -5` 和 `git status`，看最近痕迹
2. 基于路线图给 3 个"今晚就能开始"的最小切入点，每个写清楚：
   - 改哪些文件
   - 预计改动量
   - 验收标准
3. 用 `AskUserQuestion` 列 3 个方向，推荐项第一

参考主动模板：

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
- ❌ 用户只说"读 AGENTS.md"就直接抛 AskUserQuestion 给一堆选项（v1.6.4 教训：用户评"抢控制权、不舒服"）
- ❌ 自己挑一个直接开干（不尊重用户决策权）
- ❌ 列一堆开放式问题（"你想做什么呢？" 是最差的开局）
