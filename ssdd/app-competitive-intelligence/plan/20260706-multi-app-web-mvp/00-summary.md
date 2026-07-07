---
plan-status: draft
architecture-contracts-required: yes
architecture-contracts-triggers:
  - Cross-module registration / DI / event wiring
  - Thread confinement
  - Multi-owner lifecycle
---

# Multi-App Competitive Intelligence Web MVP Plan

## 计划目标

将 `PRODUCT_DOCUMENT.md` 和 `ssdd/app-competitive-intelligence/spec/` 中的产品规格转换为可实现的 Web MVP 计划。第一版目标是支持多自有 App 管理、中国区渠道竞品监控、评论洞察、功能差距、候选需求和 Markdown 周报。

## 完成标准

- [x] 用户可以新增、编辑、归档、删除和切换自有 App。
- [x] 每个自有 App 可以维护独立竞品、渠道、洞察、需求池和报告。
- [x] 系统可以采集或手动录入 App Store 中国区与国内安卓渠道快照。
- [x] 系统可以生成证据驱动的评论洞察、功能矩阵和候选需求。
- [x] 系统可以导出当前自有 App 的 Markdown 竞品周报。
- [x] 关键结论都能追溯到 Evidence。

## 输入证据

| Source | Path / Description |
| --- | --- |
| Product Document | `PRODUCT_DOCUMENT.md` |
| Spec Hub | `ssdd/app-competitive-intelligence/spec/spec.md` |
| App Portfolio Spec | `ssdd/app-competitive-intelligence/spec/concerns/app-portfolio/spec.md` |
| Channel Monitoring Spec | `ssdd/app-competitive-intelligence/spec/concerns/channel-monitoring/spec.md` |
| Insight Requirement Spec | `ssdd/app-competitive-intelligence/spec/concerns/insight-requirement/spec.md` |
| Reporting Spec | `ssdd/app-competitive-intelligence/spec/concerns/reporting/spec.md` |
| Decision Log | `ssdd/app-competitive-intelligence/spec/decision-log.md` |
| Glossary | `ssdd/app-competitive-intelligence/glossary.md` |

## 推荐阅读顺序

1. `00-summary.md`
2. `06-quickstart.md`
3. `10-scope-impact-and-assumptions.md`
4. `15-architecture-contracts.md`
5. `20-implementation-plan.md`
6. `30-verification-and-risks.md`
7. `40-spec-feedback.md`

## 计划快照

本计划从零搭建 Web MVP，建议采用 Next.js + API service + PostgreSQL + Redis queue 的可替换架构。计划包含 8 个实现工作、2 个点检工作、6 个跨模块集成点和 11 个核心组件。主要风险是国内安卓渠道字段不稳定、AI 输出可信度、以及正式技术栈尚未最终确认。

## 计划状态

implemented-local-mvp — 本地 Web MVP 已实现并通过构建、测试、规格追踪和浏览器烟测。真实生产前仍需确认渠道抓取合规、LLM Provider、部署方式和第一批真实竞品名单。

## 评估结果摘要

已完成本地实现验证：Web/API/Worker 可编译，核心领域逻辑有单元测试，周报生成保留 Evidence References，浏览器烟测确认页面可加载并可生成 Markdown 周报。

## Next Steps

| Step | Action | Condition |
| --- | --- | --- |
| 生产化确认 | 回答 `40-spec-feedback.md` 的高优先级问题 | 接真实渠道和真实 LLM 前 |
| 数据库替换 | 将本地 JSON store 替换为 PostgreSQL 或内部标准 DB | 准备多人使用前 |
| 队列替换 | 将 API 内同步任务替换为 Redis / BullMQ / 内部队列 | 需要定时监控前 |
| 渠道验证 | 为国内渠道逐一做合规审批与真实适配器 Spike | 进入生产采集前 |
