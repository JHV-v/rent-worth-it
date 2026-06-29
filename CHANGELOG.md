# Changelog

本文件记录"房租值不值"的版本演进。  
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### Planned
- v1.7.0：`DiagnosticsModal`（结果页消费 `*Feature.weakest`/`strongest` 展示短板/亮点详情）
- v1.7.0+：方法论页 `/methodology`、AI 辣评扩充、persona 个性化标签、一句日记
- v1.8.0：分享预览模态框、海报差异化模板

---

## [1.6.3] - 2026-06-29

### Changed (算法重构，破坏性更新)
- **总分公式重构**：从"4 维加权 + 城市加成 - 压力扣分"改为 **价值/成本** 公式：`baseScore = value × 0.65 + (100 - cost) × 0.35`
- **6 维特征向量**：原 4 个数值字段 `commuteScore`/`liveScore`/`lifeScore`/`stress` 升级为 6 个 `DimensionFeature`（`rentFeature`/`commuteFeature`/`liveFeature`/`lifeFeature`/`stressFeature`/`happinessFeature`），每个含 `mainScore + weakest + strongest`，为 v1.7 DiagnosticsModal 奠基
- **短板惩罚**：任一维度 `mainScore < 30` 时按 `(30 - score) × 0.3` 扣总分，极端贫困场景可归零
- **D1 city 拆分**：原 `cityModifier` 拆为 `cityBenefit`（进 value）/ `cityBurden`（进 cost），更贴近"一线 = 高溢价 + 高成本"现实
- **D5/D12b 便利度拆分**：原"周边便利度"单字段拆为 **商超便利 / 餐饮便利 / 医疗便利** 3 个独立子项
- **D12a 楼层 4 档**：`电梯房 / 低层步梯(1-3) / 中层步梯(4-5) / 高层步梯(6+)`
- **D12c 房租 exp 衰减**：`RENT_DECAY = 15`
- **D12d 通勤对称 bonus**：`+10 / 0 / -10 / -20` 四档奖惩
- **合同期 contractTerm**：`半年 / 1年 / 2年+`，进 happiness 维度
- **lifeDetails**：0-12 项生活细节多选，进 happiness 维度

### Added
- 新增 `app/lib/score/happiness.ts` 幸福维度计算（合同期 + lifeDetails）
- 新增 `app/lib/score/integration.test.ts` 9 场景集成测试，锁定 `expectedTotal ± 2` 调参基线
- `sessionStorage` 版本机制升级 `2 → 3`，旧楼层 3 档自动迁移到新 4 档

### Removed
- 删除所有 `@deprecated` 兼容字段：`commuteScore` / `liveScore` / `lifeScore` / `stress` / `subway` / `food` / `facilities`
- 删除 `WEIGHTS` / `RENT_SEGMENTS` 常量与对应 re-export
- 删除 `adapter.ts` 中无用的 `APPLIANCE_MAP` / `mapAppliance` / `hasSubwayAccess`

### Internal
- 5 阶段实施（P1 类型 → P2 测试重写 → P3 输入层 → P4 UI 层 → P5 清理），每阶段独立验证
- 测试覆盖：**140 passed / 1 skipped**（从 123 个升级）
- 完整 plan + 16 个 ADR 见 [docs/v1.6.3-algorithm-refactor.md](./docs/v1.6.3-algorithm-refactor.md)（1399 行）

---

## [1.6.1] - 2026-06-27

### Fixed
- 访问计数：新增 `GET /api/visit-count/health` 自检接口（暴露 Redis / Origin 配置状态）
- 访问计数：API 加 Redis ping 预检 + 1.5s 操作超时 + phase 标签日志
- 访问计数：前端失败时自动重试一次（间隔 500ms）；状态条加 loading 态，3s 兜底切 empty
- 访问计数：修复 Redis 冷启动 race condition —— `enableOfflineQueue` 由 `false` 改为 `true`，避免首次请求时 TCP 未就绪导致 "Stream isn't writeable" 报错并卡住单例
- UI：通勤区移除重复的"长按 ↕ 排序权重"提示，改为紧凑 inline hint
- UI：主页加小红书 / B 站 / 抖音 占位入口，未来挂链接零成本
- 文档：新增 [docs/VISIT-COUNTER.md](./docs/VISIT-COUNTER.md) 服务器配置 / 排查 checklist

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
