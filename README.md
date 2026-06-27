# 🏠 这房值不值 · Rent Worth It

> 给你的房子打分，不是给你的人生打分。专业算法 + 一点温度。

[![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)](https://github.com/JHV-v/rent-worth-it/releases)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-123%20passed-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

<!-- TODO: v1.6.x 域名上线后补充
     建议放 2 张：主页输入截图（移动端竖屏） + 结果页核心区截图（桌面端横屏） -->
<p align="center"><i>📸 截图占位 — 域名上线后补充</i></p>

## 为什么有它

每个租房的人都问过自己同一个问题：**这房住着到底值不值？**

但"值"这个字太软了 —— 朋友说便宜，自己觉得通勤累，房东讲你看采光多好。情绪和数据搅在一起，最后只能凭感觉硬扛。

这个工具想做一件事：把"住得舒不舒服"系统化一次。  
**它不是房价数据库，不预测涨跌，也不替你做决定**。  
它是一面镜子——你把房租、通勤、居住条件填进去，它从五个维度给你一份带温度的体检报告，然后你自己看着办。

## 它能给你什么

- 📊 **四维加权评分**：房租 / 通勤 / 居住 / 生活，再叠加城市修正和压力扣分，0-100 分一目了然
- 🚌 **多通勤方式 + 疲惫度计算**：步行 / 骑行 / 公共交通 / 驾车独立计时，按出行方式叠加疲惫度系数
- 🎭 **10 档 persona 文案**：从"天选之房"到"人间不值得"，根据总分给出一句调皮但不刻薄的总结（顺手附一段 AI 风的辣评）
- 🎨 **可分享海报**：基于结果页生成 PNG 卡片，二维码 + slogan，一键保存发朋友圈
- 💾 **sessionStorage 续填 + Redis 访问统计**：刷新不丢数据，独立访客有据可查
- 📱 **响应式设计**：移动端 / 桌面端均可用，触屏拖拽排序通勤方式

## 在线试一下

- 🚧 域名审核中：`https://jhx1ng.me`（备案完成后启用）
- 临时入口：`http://117.72.219.13:3000`

## 技术栈

| 类型 | 选型 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 交互 | @dnd-kit（拖拽排序）|
| 图片导出 | html2canvas + qrcode |
| 数据 | Redis（ioredis）+ sessionStorage 续填 |
| 测试 | Vitest（123 个用例） |
| 部署 | PM2 + Nginx + 京东云 ECS |
| CI/CD | GitHub Actions + Gitee 国内镜像 |

## 项目结构

```
app/
├── page.tsx                    # 输入页
├── layout.tsx                  # 根布局 / metadata
├── result/
│   ├── page.tsx                # 结果页
│   └── components/             # 结果页专属组件
│       ├── HeroSection.tsx
│       ├── EvaluationSection.tsx
│       ├── ProsConsSection.tsx
│       ├── AIRoastSection.tsx
│       ├── SharePoster.tsx     # 分享海报
│       └── ...
├── components/                 # 全局共享组件
│   ├── RentForm.tsx
│   ├── HeaderSection.tsx
│   ├── CommuteInput.tsx
│   └── ...
├── lib/                        # 业务逻辑（测试就近放置）
│   ├── score/                  # v1.6.0 评分子模块
│   │   ├── index.ts            #   主入口
│   │   ├── types.ts            #   类型定义
│   │   ├── constants.ts        #   权重 / 城市修正 / 分段
│   │   ├── normalize.ts        #   输入标准化
│   │   ├── rent.ts             #   房租分段函数
│   │   ├── commute.ts          #   通勤双层判断
│   │   ├── housing.ts          #   居住分 7 维加权
│   │   ├── life.ts             #   生活分 3 维加权
│   │   ├── stress.ts           #   压力扣分
│   │   └── *.test.ts           #   单元测试就近
│   ├── adapter.ts              # 表单 → 评分输入
│   ├── personas.ts             # 10 档 persona
│   ├── resultText.ts           # 结果页文案 / 辣评生成
│   ├── storage.ts              # sessionStorage 续填
│   ├── visitCounter.ts         # 访问计数客户端
│   └── redis.ts                # Redis 单例
└── api/
    └── visit-count/route.ts    # 访问计数 API（含 IP 限流）

docs/                           # 文档归档
├── DEPLOYMENT.md
└── design/                     # 设计稿

scripts/
└── sync-version.mjs            # 版本号自动同步
```

## 本地跑起来

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器（默认 3000）
npm run test         # 跑 123 个测试
npm run typecheck    # 类型检查
npm run build        # 生产构建
```

## 评分算法简介

```
总分 = 房租分 × 0.30
     + 通勤分 × 0.25
     + 居住分 × 0.25
     + 生活分 × 0.20
     + 城市加成
     - 压力扣分 × 0.10
```

- **房租分**：分段函数 + 城市修正。整租基准 30%、合租基准 35%，一线 / 新一线 / 二线 / 三线及以下分别叠加 +8 / +4 / 0 / -4 的容忍度
- **通勤分**：双层判断。基础分 `100 × exp(-疲惫度 / 60)`（按出行方式叠加疲惫度系数），再叠加总时长奖惩（短通勤 +5 / 长通勤 -10 / 极端 -25）
- **居住分**：7 维加权（采光 0.22 / 噪音 0.20 / 卫浴 0.16 / 房况 0.15 / 厨房 0.12 / 楼层 0.10 / 水电 0.05）
- **生活分**：3 维加权（空间 0.40 / 食 0.30 / 设施 0.30）
- **压力扣分**：房租超 20% 部分 × 1.5、通勤超 30 分钟部分 × 0.4、低收入惩罚、合租摩擦、城市等级修正

详细公式见 [app/lib/score/](./app/lib/score/) 与就近的测试文件（`*.test.ts`）。

## 路线图

- [x] v1.0.0 — 评分算法 + Stitch HTML 原型
- [x] v1.0.1 — Stitch → JSX 重构 + UI 修复 + Redis 适配
- [x] v1.1.0 — 分享海报 + GitHub Actions 自动部署
- [x] v1.1.1 — 移动端适配（拖拽触屏、按钮缩放、布局紧凑）
- [x] v1.5.0 — **质量大升级**：访问计数限流、时区统一、a11y、字体本地化、Redis 单例容错、CI 加测试 / 类型检查、安全 headers、SharePoster 延迟挂载
- [x] v1.6.0 — **算法核心升级**：房租分段函数、通勤双层判断、居住分 7 维加权、生活分 3 维加权
- [ ] v1.6.1 — `ScoreResult.diagnostics` 字段 / 合同期加成 / 楼层评分映射
- [ ] v1.7.0 — 方法论页 `/methodology` / AI 辣评扩充 / persona 个性化标签 / 一句日记
- [ ] v1.8.0 — 分享预览模态框 / 海报差异化模板
- [ ] v2.0.0 — 接入真实房价数据（贝壳/链家 API）

## 工程参考

- 📝 [变更记录 CHANGELOG.md](./CHANGELOG.md)
- 🚀 [部署说明 docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- ⚙️ [环境变量 .env.example](./.env.example)
- 🐛 [报告 bug](./.github/ISSUE_TEMPLATE/bug_report.md) / 💡 [建议功能](./.github/ISSUE_TEMPLATE/feature_request.md) / 🔀 [提交 PR](./.github/pull_request_template.md)

## License

MIT © [JHV-v](https://github.com/JHV-v)
