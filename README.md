# 🏠 房租值不值 · Rent Worth It

> 一个把租房性价比量化成可分享分数卡的小工具 · 中文用户优先 · AI 风格辣评

[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](https://github.com/JHV-v/rent-worth-it/releases)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-57%20passed-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](#license)

## 这是什么

一个回答**"我现在租的房子到底值不值"**的小工具。

输入你的月薪、租金、通勤、居住条件，算法会从**房租、通勤、居住、生活**四个维度加权打分，再加上城市级别的修正和压力扣分，最后输出一个 0-100 的性价比分数 + AI 风格的辣评 + 可分享的精美海报。

不是房价数据库，不预测涨跌。**它是一面镜子**：帮你把"住得舒不舒服"这件主观的事系统化反思一遍。

## 在线体验

- 🚧 域名审核中：`https://jhx1ng.me`（备案完成后启用）
- 临时入口：`http://117.72.219.13:3000`

## 核心功能

- 📊 **四维加权评分**：房租 / 通勤 / 居住 / 生活，每个维度可单独配置权重
- 🚌 **多通勤方式**：公共交通 / 自驾 / 步行 / 骑行，每种方式独立计时 + 权重排序
- 🎭 **persona 文案**：根据分数与城市层级动态切换 "佛系打工人 / 体面青年 / 都市精英 / 都市梦想家"
- 🎨 **可分享海报**：基于结果页生成 PNG 卡片，二维码 + slogan + 一键保存
- 🤖 **AI 风格辣评**：根据评分自动生成生活吐槽，不刻意暖
- 💾 **本地存储 + 远程访问计数**：sessionStorage 保留填写记录、Redis 统计独立访客
- 📱 **响应式设计**：移动端 / 桌面端均可用，触屏拖拽排序通勤方式

## 技术栈

| 类型 | 选型 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 交互 | @dnd-kit（拖拽排序）|
| 图片导出 | html2canvas + qrcode |
| 数据 | Redis（ioredis）+ localStorage 降级 |
| 测试 | Vitest |
| 部署 | PM2 + Nginx + 京东云 ECS |
| CI/CD | GitHub Actions + Gitee 国内镜像 |

## 项目结构

```
app/
├── page.tsx                    # 输入页
├── result/page.tsx             # 结果页
├── components/                 # 输入页组件
│   ├── RentForm.tsx
│   ├── HeaderSection.tsx
│   ├── BasicInfoFields.tsx
│   ├── TagSelectGroup.tsx
│   ├── CommuteInput.tsx
│   └── ...
├── result/components/          # 结果页组件
│   ├── HeroSection.tsx
│   ├── EvaluationSection.tsx
│   ├── ProsConsSection.tsx
│   ├── AIRoastSection.tsx
│   ├── SharePoster.tsx         # 分享海报
│   └── ...
├── lib/
│   ├── score.ts                # 评分算法
│   ├── adapter.ts              # 表单 → 评分输入
│   ├── personas.ts             # persona 切换
│   ├── resultText.ts           # 结果页文案
│   ├── storage.ts              # sessionStorage 封装
│   ├── visitCounter.ts         # 访问计数客户端
│   └── redis.ts                # Redis 单例
└── api/
    └── visit-count/route.ts    # 访问计数 API
```

## 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 3000，被占用会自动找空端口）
npm run dev

# 运行测试
npm run test

# 类型检查
npm run typecheck

# 生产构建
npm run build
npm run start
```

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `REDIS_URL` | 否 | Redis 连接串。不配则降级到 localStorage |
| `NEXT_PUBLIC_SITE_ORIGIN` | 否 | 用于 `/api/visit-count` 的 Origin 校验，多个用逗号分隔 |

详见 [.env.example](./.env.example)。

## 发版

版本号语义化管理，**由开发者决定大中小**：

```bash
npm run release:patch    # 1.0.1 → 1.0.2（bug 修复）
npm run release:minor    # 1.0.2 → 1.1.0（新功能）
npm run release:major    # 1.1.0 → 2.0.0（破坏性变更）
```

会自动同步 `package.json` 与 `HeaderSection.tsx` 的版本号、commit、打 tag。

## 部署

详见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

`git push` 到 `main` 触发 GitHub Actions：

1. 调用 Gitee API 强制同步 GitHub 最新代码
2. SSH 到京东云服务器
3. 执行 `git pull && npm install && npm run build && pm2 restart`

约 2-3 分钟后线上自动更新。

## 评分算法简介

```
总分 = 房租分 × 0.30
     + 通勤分 × 0.25
     + 居住分 × 0.25
     + 生活分 × 0.20
     + 城市加成
     - 压力扣分
```

- **房租分**：基于 (月租 / 月薪) 比值，行业拐点 30%、警戒线 50%
- **通勤分**：按多种通勤方式加权计算综合时长，超过 60 分钟开始扣分
- **居住分**：采光、隔音、楼层、家电、卫浴、厨房等具体维度评估
- **生活分**：周边便利度 + 生活小细节
- **城市加成**：一线 / 新一线 / 二线 / 三线及以下 分级调整
- **压力扣分**：通勤压力 + 合租摩擦的隐性成本

详细公式见 [app/lib/score.ts](./app/lib/score.ts) 与 [测试用例](./app/lib/__tests__/)。

## 路线图

- [x] v1.0.0 — 评分算法 + Stitch HTML 原型
- [x] v1.0.1 — Stitch → JSX 重构 + UI 修复 + Redis 适配
- [x] v1.1.0 — 分享海报 + GitHub Actions 自动部署
- [x] v1.1.1 — 移动端适配（拖拽触屏、按钮缩放、布局紧凑）
- [x] v1.5.0 — **质量大升级**：访问计数限流、时区统一、a11y、字体本地化、Redis 单例容错、CI 加测试 / 类型检查、安全 headers、SharePoster 延迟挂载
- [ ] v1.6.0 — 城市选择（具体城市而非分级）
- [ ] v1.7.0 — 留言吐槽墙 / 城市榜单
- [ ] v2.0.0 — 接入真实房价数据（贝壳/链家 API）

## License

MIT © [JHV-v](https://github.com/JHV-v)
