# Implementation Plan

## Data Model Changes

### New Entities

| Entity | Location | Key Fields | Note |
| --- | --- | --- | --- |
| `Project` | `packages/domain`, DB | name, market, languages, default_watch_frequency | Workspace/project root |
| `OwnedApp` | `packages/domain`, DB | project_id, name, category, platforms, status, feature_template | First-class analysis scope |
| `Competitor` | `packages/domain`, DB | owned_app_id, name, category, priority, status | Scoped by OwnedApp |
| `Channel` | `packages/domain`, DB | owner_type, owner_id, channel_name, store_url, crawl_status | For OwnedApp or Competitor |
| `AppSnapshot` | `packages/domain`, DB | competitor_id, channel_id, version, rating, description, captured_at | Time-series channel state |
| `Review` | `packages/domain`, DB | competitor_id, channel_id, rating, version, content | Review source data |
| `Evidence` | `packages/domain`, DB | source_type, source_url, channel_name, raw_excerpt, captured_at | Auditable source |
| `Insight` | `packages/domain`, DB | owned_app_id, category, confidence, severity, evidence_ids | AI or rule-derived insight |
| `Feature` | `packages/domain`, DB | owned_app_id, name, category, demand_score | Feature matrix item |
| `RequirementCandidate` | `packages/domain`, DB | owned_app_id, insight_ids, problem, priority_hint, status | PRD-ready candidate |
| `Report` | `packages/domain`, DB | owned_app_id, period, markdown, status | Generated report |

### State Transitions

- OwnedApp: `Incomplete -> Active -> Archived -> Deleted`
- Insight: `New -> Confirmed -> Dismissed -> Converted -> Archived`
- RequirementCandidate: `Draft -> ToReview -> Accepted | Deferred | Rejected`
- Report: `Draft -> Reviewed -> Sent | Failed`

## Interface Contract / DI Changes

| Interface | Module | Change | Affected Callers |
| --- | --- | --- | --- |
| `StoreConnector` | `packages/connectors` | parse channel URL and collect snapshot/reviews | Worker |
| `ChannelAdapterRegistry` | `packages/connectors` | resolve adapter by channel type | Worker |
| `LLMProvider` | `packages/ai` | classify reviews, extract features, generate recommendations | Worker |
| `ReportExporter` | `packages/reporting` | generate Markdown from stored data | API / Worker |
| `Repository` interfaces | `packages/domain` or API | persist scoped entities | API / Worker |

## Slice Overview

8 implementation slices build the MVP from domain foundation to Web flows. 2 verification slices validate product document/spec consistency and end-to-end evidence traceability.

## Implementation Slices

### Slice I-1: Bootstrap web monorepo and shared domain foundation

**Touched Areas**: `apps/web`, `apps/api`, `apps/worker`, `packages/domain`, `package.json`, build config
**Related Contracts**: C-6, C-7, C-8, B-1, B-2, B-3
**SpecIDs**: ACI-RULE-SCOPE-001
**Prerequisite**: None
**Done Criteria**: Web, API, worker, and shared domain packages compile with a minimal health check.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Create monorepo structure for `apps/web`, `apps/api`, `apps/worker`, and shared packages.
- [x] Add shared TypeScript domain types for Project, OwnedApp, Competitor, Channel, Snapshot, Evidence, Insight, RequirementCandidate, and Report.
- [x] Add initial build, lint, and test commands.
- [x] Add API health endpoint and Web health page.

#### Notes

- **Reference Pattern**: None; new repository.
- **Legacy Migration**: None.

---

### Slice I-2: Implement persistence and scope-safe repositories

**Touched Areas**: DB schema, repository layer, API service
**Related Contracts**: C-6, C-8, B-2, B-3
**SpecIDs**: ACI-RULE-SCOPE-001, ACI-FLOW-APP-001, ACI-FLOW-APP-002, ACI-FLOW-APP-003, ACI-FLOW-APP-004, ACI-FLOW-APP-005, ACI-RULE-APP-002, ACI-RULE-APP-003, ACI-RULE-APP-004
**Prerequisite**: Slice I-1
**Done Criteria**: Repositories persist and retrieve all MVP entities with `owned_app_id` scoping enforced.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Create database schema and migrations for all MVP entities.
- [x] Implement repositories with required `owned_app_id` filtering.
- [x] Add state transition helpers for OwnedApp, Insight, RequirementCandidate, and Report.
- [x] Add repository tests proving cross-app data isolation.

---

### Slice I-3: Build App Portfolio and competitor/channel configuration APIs

**Touched Areas**: `apps/api`, `apps/web`, `packages/domain`
**Related Contracts**: C-1, C-2, C-6, B-1, B-2
**SpecIDs**: ACI-FLOW-APP-001, ACI-FLOW-APP-002, ACI-FLOW-APP-003, ACI-FLOW-APP-004, ACI-FLOW-APP-005, ACI-RULE-APP-001, ACI-RULE-APP-002, ACI-RULE-APP-003, ACI-RULE-APP-004, ACI-FLOW-SETUP-001
**Prerequisite**: Slice I-2
**Done Criteria**: User can create, edit, archive, delete, and switch Owned Apps; each app can bind competitors and channels.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Implement OwnedApp CRUD API.
- [x] Implement Competitor and Channel CRUD API scoped by OwnedApp.
- [x] Implement App Portfolio UI with current app switcher.
- [x] Add delete / archive confirmation behavior.
- [x] Seed B612 咔叽 as example app without making it mandatory.

---

### Slice I-4: Implement channel adapter abstraction and snapshot ingestion

**Touched Areas**: `apps/worker`, `packages/connectors`, DB schema/repositories
**Related Contracts**: C-7, C-9, B-3, B-4, B-5
**SpecIDs**: ACI-FLOW-COLLECT-001, ACI-FLOW-CHANNEL-001, ACI-FLOW-CHANNEL-002, ACI-FLOW-CHANNEL-003, ACI-FLOW-CHANNEL-004, ACI-RULE-CHANNEL-001, ACI-RULE-CHANNEL-002, ACI-RULE-CHANNEL-003, ACI-RULE-COMPLIANCE-001
**Prerequisite**: Slice I-2
**Done Criteria**: Worker can ingest manual/sample channel data and one real adapter spike, storing snapshots and evidence idempotently.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Define `StoreConnector` result schema with raw and normalized fields.
- [x] Implement manual/sample adapter for deterministic MVP testing.
- [x] Implement App Store China adapter or one domestic Android channel spike.
- [x] Store snapshot, evidence, crawl status, failure reason, and last success time.
- [x] Add diff service for version, description, screenshot, rating, review count, and price/member changes.

---

### Slice I-5: Implement review insight and feature extraction pipeline

**Touched Areas**: `apps/worker`, `packages/ai`, `packages/domain`, repositories
**Related Contracts**: C-7, C-10, B-3, B-6
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-INSIGHT-001, ACI-FLOW-INSIGHT-002, ACI-FLOW-INSIGHT-004, ACI-RULE-INSIGHT-001, ACI-RULE-INSIGHT-002, ACI-RULE-AI-001, ACI-RULE-EVIDENCE-001
**Prerequisite**: Slice I-4
**Done Criteria**: Worker generates evidence-backed insights with category, confidence, severity, source channel, and recommendation.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Define `LLMProvider` interface and fake provider for tests.
- [x] Implement review normalization and topic clustering entry point.
- [x] Implement feature extraction from descriptions, release notes, reviews, and screenshot OCR text placeholders.
- [x] Persist Insight records linked to Evidence.
- [x] Add user actions for Confirmed / Dismissed / Converted / Archived.

---

### Slice I-6: Implement Feature Matrix and Requirement Candidate flows

**Touched Areas**: `apps/web`, `apps/api`, `packages/domain`, `packages/ai`
**Related Contracts**: C-3, C-4, C-6, C-10, B-1, B-2, B-6
**SpecIDs**: ACI-FLOW-INSIGHT-003, ACI-FLOW-REQ-001, ACI-RULE-REQ-001
**Prerequisite**: Slice I-5
**Done Criteria**: User can compare current Owned App vs competitors and convert insights into editable requirement candidates.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Implement Feature Matrix API and UI.
- [x] Implement manual feature edit preservation.
- [x] Implement Requirement Candidate creation from Insight.
- [x] Add fields for problem, evidence, competitor reference, app gap/advantage, recommendation, priority hint, and PRD notes.
- [x] Add Requirement Pool UI with status transitions.

---

### Slice I-7: Implement Markdown report generation

**Touched Areas**: `apps/web`, `apps/api`, `apps/worker`, `packages/reporting`
**Related Contracts**: C-5, C-6, C-7, C-11, B-1, B-2, B-7
**SpecIDs**: ACI-FLOW-REPORT-001, ACI-FLOW-REPORT-002, ACI-FLOW-REPORT-003, ACI-FLOW-REPORT-004, ACI-RULE-REPORT-001, ACI-RULE-REPORT-002, ACI-RULE-REPORT-003, ACI-RULE-EXPORT-001
**Prerequisite**: Slice I-6
**Done Criteria**: User can generate, edit, status-mark, and export a Markdown report scoped to one Owned App and period.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Implement `ReportExporter` Markdown template.
- [x] Compose report from stored Insight, RequirementCandidate, Snapshot, and Evidence data.
- [x] Add report status transitions.
- [x] Add report editor / preview UI.
- [x] Add Markdown export action.

---

### Slice I-8: Implement dashboard overview and job orchestration

**Touched Areas**: `apps/web`, `apps/api`, `apps/worker`, queue config
**Related Contracts**: C-1, C-6, C-7, B-1, B-4
**SpecIDs**: ACI-FLOW-SETUP-001, ACI-FLOW-COLLECT-001, ACI-FLOW-ANALYZE-001, ACI-FLOW-REPORT-001
**Prerequisite**: Slice I-3, Slice I-4, Slice I-5, Slice I-7
**Done Criteria**: Dashboard shows current app overview and can trigger collection, analysis, and report generation jobs safely.
**Evaluation Tier**: FULL

#### Sprint Contract

> Filled during implementation.

#### Task Breakdown

- [x] Implement overview metrics for current Owned App.
- [x] Add job enqueue endpoints for crawl, analyze, and report generation.
- [x] Add job status and failure display.
- [x] Add empty states for missing Owned App, missing competitors, and failed channels.
- [x] Add idempotency keys for enqueue and worker execution.

---

### Slice I-9: Add modular competitive analysis output

**Touched Areas**: `packages/domain`, `packages/reporting`, `apps/api`, `apps/web`, `db/schema.sql`
**Related Contracts**: C-3, C-5, C-6, C-10, B-1, B-2, B-7
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001, ACI-RULE-SCOPE-001
**Prerequisite**: Slice I-5, Slice I-7, Slice I-8
**Done Criteria**: Dashboard and Markdown report show growth, traffic, social, product performance, and AI insight analysis for current app competitors, scoped by OwnedApp.
**Evaluation Tier**: FULL

#### Sprint Contract

- DashboardState has a first-class modular competitor analysis collection scoped by `ownedAppId`.
- Existing JSON state files without the new collection load safely.
- Markdown weekly report includes the five module analysis sections and references evidence when available.
- Overview page exposes the five modules in a horizontally comparable table for all current competitors.
- `npm run lint`, `npm run test`, `npm run build`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add domain model, state scoping, seed data, and schema shape for modular competitor analysis.
- [x] Update API store normalization so older local JSON data remains compatible.
- [x] Update Markdown report generation to include five module analysis sections.
- [x] Update Web overview to show growth, traffic, social, product performance, and AI insight comparison.
- [x] Run automated checks and browser smoke verification.

---

### Slice I-10: Add evidence center and competitor detail views

**Touched Areas**: `apps/web`
**Related Contracts**: C-1, C-3, C-5, B-1, B-7
**SpecIDs**: ACI-RULE-EVIDENCE-001, ACI-FLOW-CHANNEL-004, ACI-FLOW-INSIGHT-003, ACI-FLOW-REPORT-001
**Prerequisite**: Slice I-4, Slice I-5, Slice I-6, Slice I-9
**Done Criteria**: Product managers can browse all Evidence with filters and inspect one competitor's channels, snapshots, reviews, module analyses, and feature gaps in a dedicated Web view.
**Evaluation Tier**: FULL

#### Sprint Contract

- Navigation exposes an Evidence Center and a Competitor Detail view.
- Evidence Center supports keyword, object, source type, and channel filtering.
- Evidence cards show source links, excerpts, associated snapshots, reviews, and screenshot chips or image thumbnails.
- Competitor Detail shows selected competitor profile, channel coverage, snapshots, reviews, module analyses, and feature gaps.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add Evidence Center view and derived evidence records.
- [x] Add Competitor Detail view and selected competitor state.
- [x] Add styles for evidence filters, evidence cards, and competitor detail sections.
- [x] Run automated checks and browser smoke verification.

---

### Slice I-11: Add opportunity radar and action recommendation backlog

**Touched Areas**: `packages/domain`, `packages/reporting`, `apps/api`, `apps/web`, `db/schema.sql`
**Related Contracts**: C-3, C-4, C-5, C-6, C-10, B-1, B-2, B-6, B-7
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-INSIGHT-003, ACI-FLOW-REQ-001, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001
**Prerequisite**: Slice I-6, Slice I-9, Slice I-10
**Done Criteria**: Product and engineering users can see prioritized, evidence-backed next actions with owner role, impact score, implementation hint, success metric, and status workflow.
**Evaluation Tier**: FULL

#### Sprint Contract

- DashboardState has first-class action recommendations scoped by OwnedApp.
- Analyze job derives recommendations from feature gaps, module analyses, and evidence-backed insights.
- Web exposes an Opportunity Radar view with filters for owner, module, priority, status, and keyword.
- Recommendation rows show product action, engineering hint, success metric, competitor/feature context, and Evidence.
- Recommendation status can be updated to Planned, Accepted, or Dismissed when persisted by analysis.
- Markdown weekly report includes a detailed next-week action table with evidence references.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add domain model, state scoping, schema shape, and deterministic recommendation generation.
- [x] Connect analyze job and API normalization/status update flow.
- [x] Update Markdown report generation to include detailed action recommendations.
- [x] Add Web Opportunity Radar filters, metrics, table, evidence display, and status actions.
- [x] Run automated checks and browser smoke verification.

---

### Slice I-12: Implement P0 decision workflow enhancements

**Touched Areas**: `packages/domain`, `packages/reporting`, `apps/api`, `apps/web`, `db/schema.sql`, `PRODUCT_DOCUMENT.md`
**Related Contracts**: C-3, C-4, C-5, C-6, C-8, B-1, B-2, B-7
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-INSIGHT-003, ACI-FLOW-REQ-001, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001, ACI-RULE-SCOPE-001
**Prerequisite**: Slice I-11
**Done Criteria**: P0 workflow lets product and engineering convert recommendations into requirements, inspect trend timelines, monitor membership prices, compare evidence diffs, and review alerts with evidence references.
**Evaluation Tier**: FULL

#### Sprint Contract

- Opportunity Radar can create a RequirementCandidate from a persisted ActionRecommendation.
- Derived trend timeline shows version, price, rating/review, insight, and recommendation events scoped by OwnedApp.
- Price / membership monitor shows iOS and Android price text, extracted numeric prices, change status, and evidence.
- Evidence diff view compares latest and previous snapshots for version, rating, review count, price, release notes, description, and screenshots.
- Alert center surfaces failed channels, price changes, rating risks, high-severity insights, and high-impact open recommendations.
- Markdown report includes trend, price, diff, and alert sections with Evidence references.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add derived P0 intelligence models and builders.
- [x] Add recommendation-to-requirement API flow.
- [x] Add Web pages for timeline, pricing, evidence diff, and alerts.
- [x] Update Markdown report, product document, schema draft, and tests.
- [x] Run automated checks and browser smoke verification.

---

### Slice I-13: Implement P1 market and launch intelligence views

**Touched Areas**: `packages/domain`, `packages/reporting`, `apps/web`, `db/schema.sql`, `PRODUCT_DOCUMENT.md`
**Related Contracts**: C-3, C-5, C-8, B-1, B-7
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-INSIGHT-003, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001, ACI-RULE-SCOPE-001
**Prerequisite**: Slice I-12
**Done Criteria**: P1 workflow lets product, ASO, and growth users inspect store metadata changes, rating / sentiment risks, ASO keyword opportunities, and launch / strategy signals with evidence references.
**Evaluation Tier**: FULL

#### Sprint Contract

- Derived store metadata timeline shows description, release note, screenshot, price, and version metadata changes scoped by OwnedApp.
- Rating / sentiment monitor shows latest rating, review count, review sentiment mix, risk level, and evidence by competitor/platform.
- ASO keyword radar derives keyword coverage and opportunity scores from owned app, competitors, features, reviews, release notes, and evidence.
- Launch radar consolidates new feature, campaign, pricing, positioning, quality, and website/release signals with confidence and impact.
- Web exposes P1 pages with filters, tables/cards, evidence links, and concrete next-action hints.
- Markdown report includes P1 market intelligence sections with Evidence references.
- Product document and schema draft define P1 derived objects and page behavior.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add P1 derived market intelligence models and builders.
- [x] Add Web pages for store metadata, rating sentiment, ASO keywords, and launch radar.
- [x] Update Markdown report generation to include P1 market intelligence sections.
- [x] Update product document, schema draft, and tests.
- [x] Run automated checks and browser smoke verification.

---

### Slice I-14: Implement feature gap detail and social evidence library

**Touched Areas**: `packages/domain`, `packages/reporting`, `apps/api`, `apps/web`, `db/schema.sql`, `PRODUCT_DOCUMENT.md`
**Related Contracts**: C-3, C-5, C-6, C-8, B-1, B-2, B-7
**SpecIDs**: ACI-FLOW-ANALYZE-001, ACI-FLOW-INSIGHT-003, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001, ACI-RULE-SCOPE-001, ACI-RULE-COMPLIANCE-001
**Prerequisite**: Slice I-13
**Done Criteria**: Product and engineering users can drill into one feature gap to see competitor coverage, evidence, review feedback, current app state, and suggested action; users can add or publicly fetch Xiaohongshu, Douyin, and Weibo social evidence samples that enter Evidence and downstream reports.
**Evaluation Tier**: FULL

#### Sprint Contract

- Feature Matrix rows can open a feature gap detail page.
- Feature gap detail shows current app support, feature decision, demand score, suggested action, competitor support, related evidence, related reviews, and social evidence.
- Social sample library supports manual creation for Xiaohongshu, Douyin, and Weibo links with competitor, topic, tags, engagement text, summary, signal type, and impact.
- Social sample public fetch endpoint only requests allowlisted public social domains, follows safe redirects, extracts title/description/body excerpt when accessible, and records failure reason when blocked, login-required, captcha, or inaccessible.
- Social samples create Evidence records with `sourceType=social`, so Evidence Center, Launch Radar, ASO Keyword Radar, and Markdown reports can cite them.
- Web exposes Social Samples page with filters, add form, public fetch form, evidence links, status, and failure reason.
- Product document and schema draft define feature gap detail and social evidence library behavior.
- `npm run lint`, `npm run test`, `npm run build`, `git diff --check`, and browser smoke checks pass.

#### Task Breakdown

- [x] Add social sample and feature gap detail domain models/builders.
- [x] Add API endpoints for manual social sample creation and public social link fetch.
- [x] Add Web feature gap detail and social sample library pages.
- [x] Update Markdown report, product document, schema draft, and tests.
- [x] Run automated checks and browser smoke verification.

## Verification Slices

### Slice V-1: Spec coverage and ID attachment verification

- [x] **Verification complete**

**SpecIDs**: ACI-RULE-SCOPE-001, ACI-RULE-EVIDENCE-001, ACI-RULE-COMPLIANCE-001, ACI-RULE-AI-001, ACI-RULE-EXPORT-001
**Verification Target**: `ssdd/app-competitive-intelligence/spec/`, final implementation code
**Done Criteria**: Every active SpecID has corresponding implementation reference or documented justified exception.

#### Verification Method

1. Run `rg "<SpecID>"` for each listed SpecID.
2. Code match >= 1 and spec definition >= 1 -> OK.
3. Code match 0 and spec definition exists -> MISSING.
4. Code match exists and spec definition missing -> ORPHAN.

### Slice V-2: End-to-end evidence traceability verification

- [x] **Verification complete**

**SpecIDs**: ACI-FLOW-SETUP-001, ACI-FLOW-COLLECT-001, ACI-FLOW-ANALYZE-001, ACI-FLOW-REQUIREMENT-001, ACI-FLOW-REPORT-001, ACI-RULE-EVIDENCE-001
**Verification Target**: Web UI, API, worker, DB records, exported Markdown
**Done Criteria**: A sample Owned App can be created, competitor data imported, insight generated, requirement converted, report exported, and every conclusion traces to Evidence.

#### Verification Method

1. Run `rg "<SpecID>"` for each listed SpecID.
2. Execute seeded end-to-end scenario with manual/sample adapter.
3. Inspect exported Markdown for evidence references.

## Execution Order

```text
I-1 -> I-2 -> I-3
      -> I-4 -> I-5 -> I-6 -> I-7
                         \-> I-8

V-1 after I-2 and at final sweep
V-2 after I-7/I-8
I-13 after I-12 for P1 market intelligence
I-14 after I-13 for feature detail and social evidence
```

## Existing Work Reuse Notes

No production implementation exists. Reuse `PRODUCT_DOCUMENT.md` and `ssdd/app-competitive-intelligence/spec/` as product intent and scope.
