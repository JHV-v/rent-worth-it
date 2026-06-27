# Changelog

本文件记录"房租值不值"的版本演进。  
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### Planned
- v1.6.1：`ScoreResult.diagnostics` 字段、合同期加成、楼层内在评分映射
- v1.7.0：方法论页 `/methodology`、AI 辣评扩充、persona 个性化标签、一句日记
- v1.8.0：分享预览模态框、海报差异化模板

---

## [1.6.0] - 2026-06-27

### Changed (算法核心升级)
- **房租分段函数**：基准 30%（整租）/ 35%（合租），叠加城市修正，做线性插值
- **通勤双层判断**：`100 * exp(-fatigue/60)` 基础分 + 总时长奖惩（短通勤 +5 / 长通勤 -10 / 极端 -25）
- **居住分加权**：7 维统一加权（采光 0.22 / 噪音 0.20 / 卫浴 0.16 / 房况 0.15 / 厨房 0.12 / 楼层 0.10 / 水电 0.05）
- **生活分加权**：空间 0.40 + 食 0.30 + 设施 0.30
- **WEIGHTS 重平衡**：通勤 0.20 → 0.25，居住 0.30 → 0.25
- **合租路径差异化**：基准 35%（更宽容），压力指数 +6

### Removed
- 删除地铁 `subway` 字段的额外 +30 加成（字段保留供"离地铁近"标签使用）
- 删除已废弃的 `commuteTime` 字段（被 `commuteWeighted` + `commuteTotalMinutes` 替代）

### Internal
- `app/lib/score.ts` 单文件拆分为 `app/lib/score/` 子模块（types / constants / utils / normalize / rent / commute / housing / life / stress / index）
- 测试文件就近放置，废除 `__tests__/` 子目录
- 文档统一进 `docs/`，设计稿挪入 `docs/design/`
- 新增 123 个测试覆盖核心评分逻辑

---

## [1.5.0] - 2026 早些时候

### Added
- IP 限流 + Origin 校验（`app/api/visit-count`）
- `next/font` 自托管 Inter 字体
- 安全 headers（`next.config.mjs`）
- 海报截图分享（html2canvas）

### Fixed
- 强制 Asia/Shanghai 时区（`dateUtils.ts`）
- StrictMode 双执行防护（`HeaderSection.tsx`）
- Redis 单例容错（`redis.ts`）
- a11y 优化（30+ 项体检报告问题修复）

---

## [1.1.x] - 早期版本

### Added
- 自动版本同步脚本（`scripts/sync-version.mjs`）
- Gitee 镜像同步
- GitHub Actions 自动部署到京东云

---

## [1.0.0] - 项目首发

- Next.js 14 + TypeScript 基础框架
- 表单输入 + 结果展示页
- 核心评分算法 v1.0
