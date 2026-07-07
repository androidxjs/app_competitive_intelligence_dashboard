# Quickstart — multi-app-web-mvp

## 概要

本计划实现一个多自有 App 的中国区竞品雷达 Web MVP。先搭建数据模型、App 管理和渠道快照，再接评论洞察、功能矩阵、候选需求和 Markdown 周报。

## 核心文件

| Type | File | Description |
| --- | --- | --- |
| New | `apps/web/` | Next.js Web Dashboard：App Portfolio、Overview、Channel Monitor、Requirement Pool、Reports |
| New | `apps/api/` | API service：OwnedApp、Competitor、Channel、Insight、Report 等 REST/JSON API |
| New | `apps/worker/` | 采集、diff、AI 分析、报告生成后台任务 |
| New | `packages/domain/` | 共享领域类型、状态机、评分与导出逻辑 |
| New | `packages/connectors/` | App Store 和国内安卓渠道适配器 |
| New | `packages/ai/` | LLMProvider、洞察生成、需求卡片生成 |
| New | `prisma/schema.prisma` 或 `db/schema.sql` | PostgreSQL 数据模型 |
| Ref | `PRODUCT_DOCUMENT.md` | 产品范围和页面定义 |
| Ref | `ssdd/app-competitive-intelligence/spec/` | 规格来源 |

## 依赖流

OwnedApp → Competitor → Channel → Snapshot / Review / Evidence → Insight / Feature → RequirementCandidate → Report

## 快速验证

1. `npm test` 或等价命令 — 验证领域模型、状态机、diff 和导出逻辑。
2. `npm run lint` — 验证 Web/API/worker 代码质量。
3. `npm run build` — 验证 Web 和 API 构建。
4. 手动创建 B612 咔叽和另一个自有 App，分别添加竞品，确认数据隔离。
5. 手动导入一批评论样本，确认洞察可转成候选需求并进入周报。

## 开始前检查

- [ ] 已确认第一批自有 App 与竞品名单。
- [ ] 已确认第一批国内安卓渠道接入顺序。
- [ ] 已确认 MVP 技术栈或接受本计划假设。
- [ ] 已读取 `15-architecture-contracts.md` 的边界约束。
- [ ] 已从第 1 个实现工作开始，而不是直接做爬虫全量覆盖。
