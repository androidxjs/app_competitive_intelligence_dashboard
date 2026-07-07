# Web Dev Review — App Competitive Intelligence Dashboard

## Review Scope

| Item | Value |
| --- | --- |
| Review date | 2026-07-06 |
| Product | App Competitive Intelligence Dashboard / App 竞品雷达 |
| Review perspective | Web Dashboard, API, worker, database, crawler/AI integration |
| Source spec | [spec.md](./spec.md) |
| Product document | [PRODUCT_DOCUMENT.md](../../../PRODUCT_DOCUMENT.md) |
| Implementation plan | [../plan/20260706-multi-app-web-mvp/20-implementation-plan.md](../plan/20260706-multi-app-web-mvp/20-implementation-plan.md) |
| Code comparison | Not performed. The repository currently contains product/spec/plan documents, not a Web implementation. |
| Android-specific review | Not applicable. This review intentionally uses Web development criteria. |

This file is an implementation-readiness review. It does not replace the product spec and does not modify the source spec. Issues are written as Web delivery risks that should be resolved before or during the first implementation slices.

## Processing Summary

| Category | Count |
| --- | ---: |
| High priority open items | 5 |
| Medium priority open items | 6 |
| Low priority open items | 4 |
| Product confirmation needed | 7 |
| Data / compliance confirmation needed | 2 |
| Web/API implementation defaults can be adopted | 6 |
| Android-only concerns skipped | 100% |

## Issue Index

| ID | Priority | Processing | Issue | Status |
| --- | --- | --- | --- | --- |
| WDR-H1 | High | Product + Engineering confirmation | MVP real channel adapter scope is broader than the implementation plan spike. | Open |
| WDR-H2 | High | Product + Web/API confirmation | Authentication, roles, and app visibility rules are not specified. | Open |
| WDR-H3 | High | Product + Data/Compliance + Engineering confirmation | Domestic channel collection approval and fallback policy are not operationalized. | Open |
| WDR-H4 | High | Product confirmation | Owned App deletion may conflict with evidence retention and report reproducibility. | Open |
| WDR-H5 | High | Web/API/Worker implementation confirmation | Long-running crawl/analyze/report jobs need explicit state, retry, and idempotency contracts. | Open |
| WDR-M1 | Medium | Web implementation default | Current Owned App selection needs a URL and refresh-safe routing model. | Open |
| WDR-M2 | Medium | Product + Web confirmation | Partial data, empty states, and failed-channel display rules need page-level definitions. | Open |
| WDR-M3 | Medium | Data/Engineering confirmation | LLM provider, prompt logging, redaction, and retention rules are not defined. | Open |
| WDR-M4 | Medium | Product confirmation | Feature Matrix merge rules between AI extraction and manual edits are underspecified. | Open |
| WDR-M5 | Medium | Product confirmation | Report edit/regenerate behavior is not specified. | Open |
| WDR-M6 | Medium | Web/API implementation default | Review/comment-heavy pages need pagination, filtering, and sampling contracts. | Open |
| WDR-L1 | Low | Web implementation default | Export file naming and metadata conventions are not defined. | Open |
| WDR-L2 | Low | Web implementation default | Accessibility and desktop-first responsive minimums are not defined. | Open |
| WDR-L3 | Low | Engineering implementation default | Admin/debug visibility for adapter failures is not specified. | Open |
| WDR-L4 | Low | Product + Web confirmation | Shareable report/filter URLs are not explicitly required or excluded. | Open |

## High Priority

### WDR-H1 — MVP real channel adapter scope is broader than the implementation plan spike

**Source**

- [spec.md — Assumptions](./spec.md#assumptions)
- [Channel Monitoring — Constraints](./concerns/channel-monitoring/spec.md#constraints)
- [Implementation Plan — Slice I-4](../plan/20260706-multi-app-web-mvp/20-implementation-plan.md#slice-i-4-implement-channel-adapter-abstraction-and-snapshot-ingestion)

**Issue**

The spec lists App Store China, Huawei, Xiaomi, OPPO, vivo, and Tencent MyApp as first-batch channels. The implementation plan for Slice I-4 says the worker should support manual/sample channel data and one real adapter spike. These are not the same launch promise.

If product expects all six real store adapters in v1, the Web UI, job state model, adapter registry, parsing tests, and compliance review scope will expand significantly. If engineering ships only one real adapter plus manual/sample data, the product page must avoid implying full automated support.

**Web impact**

- Channel configuration forms need per-channel capability labels: automated, manual entry, planned, blocked by login/captcha, or failed.
- Channel comparison tables need to distinguish missing data from unsupported data.
- Dashboard health indicators need to show partial coverage without treating it as a system failure.
- Acceptance tests need to match the staged adapter promise.

**Recommended default**

Treat the six channels as target coverage, not guaranteed automated v1 coverage. For v1 implementation, use:

| Channel | v1 recommendation |
| --- | --- |
| App Store China | One real adapter candidate |
| One domestic Android channel | Optional spike after App Store adapter |
| Other domestic channels | Manual/sample entry or planned status until adapter is validated |

**Required confirmation**

Product and engineering should confirm whether the first released version must automatically collect all six channels, or whether staged adapter rollout is acceptable.

### WDR-H2 — Authentication, roles, and app visibility rules are not specified

**Source**

- [spec.md — Goal](./spec.md#goal)
- [App Portfolio — Behavior](./concerns/app-portfolio/spec.md#behavior)
- [Architecture Contracts — Web -> API](../plan/20260706-multi-app-web-mvp/15-architecture-contracts.md#2-boundary-contracts-b-)

**Issue**

The spec describes multiple self-owned Apps and product-manager workflows, but it does not define login, user identity, roles, or visibility boundaries. Even an internal-only Web Dashboard needs a minimum access model because app portfolios, reports, requirement candidates, and competitive evidence can be sensitive.

**Web impact**

- The app cannot safely define "current user's apps" without a user/session model.
- Delete/archive/report actions need permission checks.
- API endpoints must scope queries by both `owned_app_id` and the authenticated principal or workspace.
- Frontend navigation should not expose inaccessible app IDs through direct URLs.

**Recommended default**

For MVP, define one internal workspace with authenticated users and two roles:

| Role | Permissions |
| --- | --- |
| Viewer | Read apps, competitors, insights, requirements, reports, and evidence |
| Editor | Viewer permissions plus create/edit/archive/delete apps, trigger jobs, convert requirements, and generate reports |

**Required confirmation**

Product should confirm whether MVP is single-user local/internal, internal multi-user, or public SaaS. Engineering should then attach the corresponding auth and authorization contract to Slice I-1/I-2.

### WDR-H3 — Domestic channel collection approval and fallback policy are not operationalized

**Source**

- [spec.md — ACI-RULE-COMPLIANCE-001](./spec.md#cross-cutting-rules)
- [Channel Monitoring — ACI-RULE-CHANNEL-003](./concerns/channel-monitoring/spec.md#behavior)
- [Open Questions — OQ-002](./spec.md#open-questions)

**Issue**

The spec correctly says crawlers must not bypass login, captcha, paywall, or anti-scraping restrictions. It does not define who approves each adapter, how a blocked source is represented in the UI, or what the user should do when automated collection is not allowed.

**Web impact**

- Store URL validation cannot simply accept every URL as automatically collectible.
- The UI needs a source status such as `Ready`, `ManualOnly`, `BlockedByCaptcha`, `LoginRequired`, `Unsupported`, `AdapterFailed`.
- The worker must record compliance-related skip reasons separately from technical failures.
- Reports must avoid presenting unavailable data as "no competitor change."

**Recommended default**

Add an adapter approval field to channel configuration:

| Field | Purpose |
| --- | --- |
| `collection_mode` | `automatic`, `manual`, `disabled` |
| `compliance_status` | `approved`, `pending`, `blocked`, `unknown` |
| `last_skip_reason` | Human-readable skip reason for product managers |
| `approved_by` / `approved_at` | Audit trail when an adapter is enabled |

**Required confirmation**

Product, data/compliance owner, and engineering should confirm the adapter approval owner and whether manual entry is the official fallback for blocked channels.

### WDR-H4 — Owned App deletion may conflict with evidence retention and report reproducibility

**Source**

- [App Portfolio — ACI-FLOW-APP-004](./concerns/app-portfolio/spec.md#behavior)
- [Channel Monitoring — Constraints](./concerns/channel-monitoring/spec.md#constraints)
- [Reporting — Constraints](./concerns/reporting/spec.md#constraints)

**Issue**

The spec allows deleting an Owned App after choosing whether to retain or remove historical reports, evidence, and requirement candidates. At the same time, reports and insights must preserve evidence references even when source pages change later.

If hard delete removes evidence used by exported or internal reports, the product breaks evidence traceability. If data is retained, the UI and API need a clear archived/deleted state model.

**Web impact**

- Delete confirmation cannot be a simple destructive action.
- API repositories need soft-delete/archive behavior and retention flags.
- Report pages need to keep evidence snapshots readable even when an app is archived.
- Search/list pages need to hide deleted apps while preserving historical records when retention is selected.

**Recommended default**

Use archive as the default user-facing action. For MVP, hard delete should be limited to apps with no retained reports/evidence, or to an admin-only maintenance operation.

**Required confirmation**

Product should confirm whether "delete" means soft delete with retained evidence by default, or true deletion. If true deletion is required, the spec must state how report reproducibility is intentionally sacrificed.

### WDR-H5 — Long-running crawl/analyze/report jobs need explicit state, retry, and idempotency contracts

**Source**

- [Architecture Contracts — API -> Queue](../plan/20260706-multi-app-web-mvp/15-architecture-contracts.md#2-boundary-contracts-b-)
- [Implementation Plan — Slice I-8](../plan/20260706-multi-app-web-mvp/20-implementation-plan.md#slice-i-8-implement-dashboard-overview-and-job-orchestration)
- [Channel Monitoring — ACI-RULE-CHANNEL-002](./concerns/channel-monitoring/spec.md#behavior)

**Issue**

The dashboard will trigger crawl, analysis, and report generation jobs that can fail partially or take time. The plan mentions job status and idempotency keys, but the spec does not define the job state machine or user-visible behavior.

**Web impact**

- Buttons need disabled/loading/retry states tied to real backend job status.
- Users need to know whether a report is stale, generating, failed, or ready.
- Duplicate clicks must not create duplicate snapshots or duplicate reports.
- Partial job success must be visible by channel and competitor.

**Recommended default**

Define a shared job model:

| State | Meaning |
| --- | --- |
| `Queued` | API accepted the request and created one job |
| `Running` | Worker started execution |
| `Succeeded` | All required work completed |
| `PartialSucceeded` | Some channels/items completed, some failed or skipped |
| `Failed` | No useful output was produced |
| `Canceled` | User/admin canceled or app was archived/deleted |

Each job should include `owned_app_id`, `job_type`, `target_ids`, `idempotency_key`, `started_at`, `finished_at`, `progress`, `error_code`, and `user_message`.

**Required confirmation**

Engineering can adopt this as the default unless product wants a simpler MVP with manual refresh only. If simplified, the spec should explicitly remove background monitoring expectations from v1.

## Medium Priority

### WDR-M1 — Current Owned App selection needs a URL and refresh-safe routing model

**Source**

- [App Portfolio — ACI-FLOW-APP-005](./concerns/app-portfolio/spec.md#behavior)
- [App Portfolio — ACI-RULE-APP-004](./concerns/app-portfolio/spec.md#constraints)

**Issue**

The spec says users can switch the current Owned App and every view is scoped to that app. It does not define whether current app state lives in URL, browser storage, or backend session.

**Recommended default**

Use URL-scoped routing as the source of truth:

| View | Route pattern |
| --- | --- |
| Dashboard | `/apps/:ownedAppId/dashboard` |
| Competitors | `/apps/:ownedAppId/competitors` |
| Insights | `/apps/:ownedAppId/insights` |
| Feature Matrix | `/apps/:ownedAppId/features` |
| Requirements | `/apps/:ownedAppId/requirements` |
| Reports | `/apps/:ownedAppId/reports/:reportId?` |

If no app is selected, route to `/apps` and show the empty/select app state. API requests must always include `owned_app_id` through route context or endpoint path.

### WDR-M2 — Partial data, empty states, and failed-channel display rules need page-level definitions

**Source**

- [spec.md — Acceptance](./spec.md#acceptance)
- [Channel Monitoring — ACI-RULE-CHANNEL-001](./concerns/channel-monitoring/spec.md#behavior)
- [Reporting — ACI-RULE-REPORT-003](./concerns/reporting/spec.md#behavior)

**Issue**

The spec defines missing fields and crawl failures, but it does not describe page-level UI states. For a Web dashboard, partial data is normal because stores differ by field availability and crawlability.

**Recommended default**

Each major page should support:

- No Owned App selected
- Owned App exists but no competitors
- Competitors exist but no channel data
- Some channels succeeded and some failed
- No meaningful changes in the selected period
- Stale data warning when last successful crawl is outside the selected watch period

Product should confirm the wording and severity for failed/partial states because it affects trust in generated insights.

### WDR-M3 — LLM provider, prompt logging, redaction, and retention rules are not defined

**Source**

- [spec.md — ACI-RULE-AI-001](./spec.md#cross-cutting-rules)
- [Insight Requirement — Dependencies](./concerns/insight-requirement/spec.md#dependencies)
- [Open Questions — OQ-004](./spec.md#open-questions)

**Issue**

The spec requires AI output quality labels, but does not define model provider, data sent to the provider, whether raw reviews are logged, or how prompt/output traces are retained.

**Web impact**

- Insight details may need to show AI confidence and source evidence, but not sensitive raw prompt metadata.
- API/worker must separate public evidence, internal generated text, and provider request logs.
- Users need a clear re-run behavior when the provider changes.

**Recommended default**

Define a provider abstraction with fake provider tests. Store AI output, evidence IDs, model/provider version, and prompt template version. Avoid storing full provider request payloads unless explicitly enabled for debugging.

**Required confirmation**

Data/engineering should confirm whether public app reviews and store text can be sent to the chosen LLM provider, and whether any internal self-app fields must be redacted.

### WDR-M4 — Feature Matrix merge rules between AI extraction and manual edits are underspecified

**Source**

- [Insight Requirement — ACI-FLOW-INSIGHT-003](./concerns/insight-requirement/spec.md#behavior)
- [Implementation Plan — Slice I-6](../plan/20260706-multi-app-web-mvp/20-implementation-plan.md#slice-i-6-implement-feature-matrix-and-requirement-candidate-flows)

**Issue**

Feature Matrix is both AI-generated and product-manager-editable. The spec says manual feature edits should be preserved, but does not define conflict rules when later analysis changes the same feature.

**Recommended default**

Track feature fields by source:

| Source | Behavior |
| --- | --- |
| AI extracted | Can be refreshed/replaced by future runs |
| User confirmed | Survives re-analysis unless user resets it |
| User edited | Takes precedence and records editor/time |
| User dismissed | Hidden from default matrix but retained for audit |

Product should confirm whether user-edited features can be overwritten by a "regenerate all" action.

### WDR-M5 — Report edit/regenerate behavior is not specified

**Source**

- [Reporting — ACI-FLOW-REPORT-001..004](./concerns/reporting/spec.md#behavior)
- [Implementation Plan — Slice I-7](../plan/20260706-multi-app-web-mvp/20-implementation-plan.md#slice-i-7-implement-markdown-report-generation)

**Issue**

The spec supports report generation, editing, status changes, and Markdown export. It does not define what happens when a user edits a generated report and then regenerates the report for the same period.

**Recommended default**

Use immutable generation snapshots plus editable drafts:

| Action | Behavior |
| --- | --- |
| Generate first report | Creates a report draft with source data version references |
| Edit draft | Stores user-edited Markdown separately from generated Markdown |
| Regenerate | Creates a new generated version and warns before replacing edited content |
| Export | Exports the currently selected edited draft or generated version |

Product should confirm whether reports need version history in MVP or only last draft.

### WDR-M6 — Review/comment-heavy pages need pagination, filtering, and sampling contracts

**Source**

- [Insight Requirement — ACI-FLOW-INSIGHT-001](./concerns/insight-requirement/spec.md#behavior)
- [spec.md — Acceptance](./spec.md#acceptance)

**Issue**

Review insight pages can contain many comments and evidence samples. The spec defines insight fields but not list behavior, sampling size, filters, or sorting.

**Recommended default**

API and Web should support:

- Pagination for raw reviews and evidence items
- Filters by competitor, channel, rating, version, topic, severity, and period
- Default evidence sample size per insight
- Explicit sample-size disclaimer when analysis is based on limited data

This can be an engineering default unless product wants specific PM workflow filters in v1.

## Low Priority

### WDR-L1 — Export file naming and metadata conventions are not defined

**Source**

- [spec.md — ACI-RULE-EXPORT-001](./spec.md#cross-cutting-rules)
- [Reporting — ACI-FLOW-REPORT-003](./concerns/reporting/spec.md#behavior)

**Recommended default**

Export Markdown as:

`{owned_app_slug}_competitive_weekly_{period_start}_{period_end}_{report_id}.md`

The file should include generated time, exported time, report status, owned app, competitors, channels, period, and evidence references.

### WDR-L2 — Accessibility and desktop-first responsive minimums are not defined

**Issue**

The product is a Web Dashboard for product managers, so desktop table-heavy workflows are likely primary. The spec does not state minimum viewport, keyboard accessibility, focus behavior, or chart/table alternatives.

**Recommended default**

Use desktop-first responsive design with a minimum supported width around 1280px for full productivity views. Maintain readable fallback layouts for tablet/mobile review, but do not optimize dense matrix editing for small screens in MVP. Forms, tables, tabs, menus, and dialogs should be keyboard accessible.

### WDR-L3 — Admin/debug visibility for adapter failures is not specified

**Issue**

Product managers need human-readable failure reasons, while engineers need adapter-level diagnostics. The spec only requires failure reason and last successful crawl time.

**Recommended default**

Expose user-safe failure messages in the dashboard and keep technical details in server logs or an internal admin/debug view. Avoid showing stack traces or raw provider errors to product users.

### WDR-L4 — Shareable report/filter URLs are not explicitly required or excluded

**Issue**

Product managers will likely share a specific report, insight, or filtered comparison in meetings. The spec does not state whether URLs should preserve selected period, competitors, channels, filters, and sort order.

**Recommended default**

Support shareable URLs for report detail pages and preserve core filters in query parameters on insights and feature matrix pages. Product should confirm whether this is required in MVP or acceptable as a follow-up.

## Required Web/API Contracts Before Implementation

These contracts should be attached to the implementation slices before coding begins.

| Contract | Required decisions |
| --- | --- |
| Auth/session | MVP access mode, roles, workspace model, unauthorized route behavior |
| App scope | URL route model, active app fallback, archived/deleted app visibility |
| Channel capability | Supported channels, collection mode, compliance status, skip/failure reasons |
| Job orchestration | Job states, idempotency key, retry policy, partial success display |
| Evidence retention | Archive/delete semantics, report reproducibility, evidence snapshot visibility |
| AI provider | Provider abstraction, allowed data, prompt/output retention, redaction rules |
| Report lifecycle | Generated version vs edited draft, regeneration behavior, export source |
| Feature Matrix lifecycle | AI/manual merge rules, conflict handling, source attribution |

## Recommended Spec Additions

The following additions should be made to the formal spec or concern files before implementation starts:

1. Add an Auth / Access Control concern or cross-cutting rule for authenticated users, roles, and app visibility.
2. Add a channel capability matrix that separates target coverage from automated v1 support.
3. Add a compliance approval workflow for domestic channel adapters and manual-entry fallback.
4. Add explicit Owned App archive/delete retention behavior for evidence, reports, and requirement candidates.
5. Add a job state machine for crawl, analyze, and report generation.
6. Add route and app-scope rules for Web navigation.
7. Add LLM provider data-handling rules, including redaction and retention.
8. Add Feature Matrix merge rules for AI-generated, user-confirmed, user-edited, and dismissed features.
9. Add Report versioning/regeneration rules.
10. Add page-level empty/partial/error states for dashboard, channel comparison, insights, feature matrix, requirements, and reports.

## Web Implementation Readiness Verdict

The spec is directionally ready for Web MVP planning, but not yet ready for low-risk implementation without the confirmations above.

Minimum decisions needed before coding Slice I-1 through Slice I-3:

1. MVP access mode and role model.
2. URL-based Owned App routing and active-app fallback.
3. Archive/delete retention default.
4. Channel capability wording shown in the Web UI.

Minimum decisions needed before coding Slice I-4 through Slice I-8:

1. Which real adapters are automated in v1.
2. Domestic channel compliance owner and fallback behavior.
3. Job state machine and retry/idempotency rules.
4. LLM provider data-handling policy.
5. Feature Matrix and Report regeneration conflict rules.

## Document History

| Date | Version | Notes |
| --- | --- | --- |
| 2026-07-06 | v0.1 | Initial Web development review created from product/spec/plan documents. |
