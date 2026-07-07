# App Competitive Intelligence Spec

## Goal

构建一个面向产品经理的中国区多 App 竞品监控 Web Dashboard。用户可以管理多个自有 App，为每个 App 配置竞品和渠道，持续分析商店页、评论、版本、截图、价格、官网和发布变化，并将高价值洞察转成候选需求与周报。

## Source

- `PRODUCT_DOCUMENT.md` v0.4 Draft

## Assumptions

- 第一版只做 Web Dashboard。
- B612 咔叽是默认示例自有 App，但系统必须支持多个自有 App。
- 第一版优先接入 App Store 中国区和国内安卓核心渠道：华为、小米、OPPO、vivo、应用宝。
- 第一版以公开页面和合规抓取为主，不绕过登录、验证码、付费墙或反爬限制。
- 第一版不提供下载量、收入、广告投放预算等估算。

## Concern Index

| Concern | Path | Scope |
| --- | --- | --- |
| App Portfolio | `concerns/app-portfolio/spec.md` | 自有 App 新增、编辑、删除、归档、切换和竞品分组 |
| Channel Monitoring | `concerns/channel-monitoring/spec.md` | App Store 与国内安卓渠道抓取、快照、差异与失败处理 |
| Insight Requirement | `concerns/insight-requirement/spec.md` | 评论洞察、功能矩阵、证据、候选需求 |
| Reporting | `concerns/reporting/spec.md` | 竞品周报生成、导出、证据引用和状态 |

## Cross-Cutting Rules

- **ACI-RULE-EVIDENCE-001**: Every reportable insight MUST reference at least one Evidence item.
- **ACI-RULE-SCOPE-001**: Each Owned App MUST have isolated competitors, feature matrix, requirement pool, and reports.
- **ACI-RULE-COMPLIANCE-001**: Crawlers MUST NOT bypass login, captcha, paywall, or explicit anti-scraping restrictions.
- **ACI-RULE-AI-001**: AI output MUST distinguish Fact, Pattern, Inference, and Recommendation.
- **ACI-RULE-EXPORT-001**: Markdown export MUST include report period, owned app name, monitored competitors, monitored channels, and evidence references.

## High-Level Flow

- **ACI-FLOW-SETUP-001**: User creates or selects an Owned App, configures channels, competitors, watch period, and focus topics.
- **ACI-FLOW-COLLECT-001**: System collects channel snapshots, comments, release notes, screenshots, price/member information, and website changes.
- **ACI-FLOW-ANALYZE-001**: System extracts features, clusters comments, scores opportunities, and generates evidence-backed insights.
- **ACI-FLOW-REQUIREMENT-001**: User converts valuable insights into Requirement Candidates.
- **ACI-FLOW-REPORT-001**: System generates a weekly report from confirmed insights, channel changes, and requirement candidates.

## Acceptance

| ID | Criterion |
| --- | --- |
| ACI-RULE-SCOPE-001 | A user can manage more than one Owned App, and switching App changes competitors, insights, requirements, and reports. |
| ACI-FLOW-SETUP-001 | A user can create an Owned App and attach up to 10 competitors with channel links or manual channel placeholders. |
| ACI-FLOW-COLLECT-001 | A channel snapshot records channel name, source URL, captured time, version, description, rating, screenshots, and crawl status when available. |
| ACI-FLOW-ANALYZE-001 | Review insights show topic, frequency, evidence samples, severity, recommendation, and confidence. |
| ACI-FLOW-REQUIREMENT-001 | A converted requirement includes problem, evidence, competitor reference, current app gap/advantage, recommendation, priority hint, and PRD notes. |
| ACI-FLOW-REPORT-001 | A generated report includes summary, competitor changes, review hotspots, feature opportunities, candidate requirements, price/member changes, strategic inferences, and evidence references. |

## Open Questions

- **OQ-001** — MVP 是否必须一次性接入所有第一批安卓渠道
  - 유형: 모호
  - 발견: plan
  - 블로킹: no
  - 근거 위치: PRODUCT_DOCUMENT.md §21 / concerns/channel-monitoring/spec.md
  - 상태: open
- **OQ-002** — 国内渠道采集合规审批归属未定义
  - 유형: 기타
  - 발견: plan
  - 블로킹: no
  - 근거 위치: spec.md Cross-Cutting Rules / concerns/channel-monitoring/spec.md
  - 상태: open
- **OQ-003** — MVP 后端技术栈未最终确认
  - 유형: 모호
  - 발견: plan
  - 블로킹: no
  - 근거 위치: PRODUCT_DOCUMENT.md §15 / plan assumptions
  - 상태: open
- **OQ-004** — LLM Provider 与数据脱敏规则未定义
  - 유형: 모호
  - 발견: plan
  - 블로킹: no
  - 근거 위치: PRODUCT_DOCUMENT.md §10 / concerns/insight-requirement/dev-constraint.md
  - 상태: open
- **OQ-005** — 候选需求是否需要写入内部需求系统未定义
  - 유형: 모호
  - 발견: plan
  - 블로킹: no
  - 근거 위치: PRODUCT_DOCUMENT.md §11 / concerns/insight-requirement/spec.md
  - 상태: open
