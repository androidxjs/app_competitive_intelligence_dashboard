# Scope, Impact, and Assumptions

## In-Scope

- 多自有 App 管理：新增、编辑、归档、删除、切换。
- 每个自有 App 独立维护竞品集合、渠道配置、洞察、需求池和报告。
- App Store 中国区和国内安卓核心渠道的快照模型、适配器接口和失败记录。
- 手动录入或样本导入作为第一版渠道数据兜底。
- 评论主题聚类、功能提取、证据驱动洞察、候选需求。
- Feature Matrix 和 Markdown 周报导出。
- Web Dashboard 第一版页面骨架。

## Out-of-Scope

- 移动端 App。
- 下载量、收入、广告投放预算估算。
- 绕过登录、验证码、付费墙或反爬机制。
- 全量社媒舆情监控。
- Jira / Linear / 内部需求系统自动写入。
- 多租户商业化、计费、公开 SaaS。
- 覆盖所有国内安卓渠道。

## Assumptions

- 技术栈默认使用 Next.js + API service + PostgreSQL + Redis queue；可替换，但计划按此拆分。
- MVP 可以先支持手动导入/录入渠道快照和评论样本，再逐步替换为自动抓取。
- 每个渠道字段不同，Snapshot 需要支持 nullable 字段和 parse confidence。
- LLM 输出只作为建议；正式报告和需求必须引用 Evidence。
- B612 咔叽仅作为默认示例自有 App，系统必须允许继续添加其他 App。
- 第一版权限可以轻量化，先满足内部产品经理使用。

## Touched Candidates

| File / Module | Change Type | Reason |
| --- | --- | --- |
| `apps/web/` | New | Web Dashboard 页面和交互 |
| `apps/api/` | New | OwnedApp、Competitor、Channel、Insight、Report API |
| `apps/worker/` | New | 采集、diff、AI 分析、周报生成任务 |
| `packages/domain/` | New | 领域模型、状态机、评分、导出核心逻辑 |
| `packages/connectors/` | New | App Store 和国内安卓渠道适配器 |
| `packages/ai/` | New | LLM Provider 和洞察/需求生成 |
| `packages/reporting/` | New | Markdown 周报模板和导出 |
| `db/` or `prisma/` | New | PostgreSQL schema 和 migration |
| `tests/` | New | 单元、集成、API、UI 测试 |

## Verification Targets

当前仓库没有已实现代码，因此没有“已实现但需验证”的代码目标。所有规格主题均按新增实现工作处理。

## Behavioral Contract Risks

| Contract | Risk | Impact |
| --- | --- | --- |
| OwnedApp scope isolation | 数据未按 `owned_app_id` 过滤导致多个 App 的竞品、洞察、报告混在一起 | 产品经理看到错误竞品结论 |
| Evidence traceability | Insight / Report 未引用 Evidence | 需求建议不可审计，AI 结论可信度下降 |
| Channel missing fields | 一个渠道字段缺失时用其他渠道数据填充 | 误导渠道差异判断 |
| AI classification | 推测被当成事实展示 | 产品决策风险 |
| Job idempotency | 重试采集任务产生重复快照或重复洞察 | 周报和趋势统计失真 |

## Flavor / Deployment Impact

Web MVP common deployment — no mobile flavor split. Deployment profile should distinguish local dev, internal staging, and internal production.
