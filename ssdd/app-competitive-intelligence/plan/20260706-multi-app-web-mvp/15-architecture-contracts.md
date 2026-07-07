# Architecture Contracts

## Trigger Record

| Trigger | Applies | Evidence |
| --- | --- | --- |
| Cross-module registration / DI / event wiring | Yes | Web, API, worker, DB, connector, AI provider, notifier boundaries |
| Native/GL/JNI ownership | No | Web MVP has no native resource ownership |
| Thread confinement | Yes | HTTP request flow and background worker / queue execution are separate contexts |
| Multi-owner lifecycle | Yes | Snapshots, Evidence, Insight, RequirementCandidate, Report are shared by API and worker |
| Existing structural replacement | No | No existing implementation to replace |

## §1. Class / Component Inventory (C-#)

| ID | Component | Module | New / Modified | Responsibility | Thread Context | Lifecycle Owner |
| --- | --- | --- | --- | --- | --- | --- |
| C-1 | App Portfolio UI | `apps/web` | New | Manage and switch Owned Apps | Browser main | Web app |
| C-2 | Competitor & Channel UI | `apps/web` | New | Configure competitors and channels | Browser main | Web app |
| C-3 | Review Insights UI | `apps/web` | New | Display clusters, evidence, and conversion actions | Browser main | Web app |
| C-4 | Requirement Pool UI | `apps/web` | New | Manage candidate requirements | Browser main | Web app |
| C-5 | Reports UI | `apps/web` | New | Generate, edit, and export reports | Browser main | Web app |
| C-6 | Dashboard API | `apps/api` | New | OwnedApp / Competitor / Channel / Insight / Report endpoints | HTTP request | API service |
| C-7 | Worker Service | `apps/worker` | New | Run crawl, diff, AI, report jobs | Queue worker | Worker process |
| C-8 | Domain Model | `packages/domain` | New | Entity types, state transitions, scoring contracts | Shared | API + worker |
| C-9 | Channel Adapter Registry | `packages/connectors` | New | Route channel URLs to concrete adapters | Worker | Worker process |
| C-10 | LLM Provider | `packages/ai` | New | AI classification and generation abstraction | Worker | Worker process |
| C-11 | Report Exporter | `packages/reporting` | New | Markdown report generation | API / worker | API + worker |

## §2. Boundary Contracts (B-#)

| ID | Boundary | Source | Target | Mechanism | Failure Symptom | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| B-1 | Web -> API | `apps/web` | `apps/api` | JSON HTTP API | UI cannot create apps or load scoped data | API contract tests + UI smoke test |
| B-2 | API -> DB | `apps/api` | PostgreSQL | ORM / SQL repository | Writes not persisted or scope leaks | Repository integration tests |
| B-3 | Worker -> DB | `apps/worker` | PostgreSQL | ORM / SQL repository | Jobs cannot save snapshots/evidence | Worker integration tests |
| B-4 | API -> Queue | `apps/api` | Redis queue | enqueue job | User actions do not trigger crawl/report jobs | Queue enqueue test |
| B-5 | Worker -> Channel Adapter | `apps/worker` | `packages/connectors` | adapter interface | Channel parsing fails silently | Adapter contract tests |
| B-6 | Worker -> LLM Provider | `apps/worker` | `packages/ai` | provider interface | Insights lack category/evidence/confidence | Provider fake tests |
| B-7 | API/Worker -> Report Exporter | `apps/api`, `apps/worker` | `packages/reporting` | function call / service | Markdown missing required sections | Report snapshot tests |

## §3. Resource Contracts (R-#)

No explicit native/GL/file descriptor resource ownership in MVP. Database and queue connections are owned by framework/runtime clients and validated through integration tests.

## §4. Threading Boundaries

| From | To | Mechanism | Related C-# |
| --- | --- | --- | --- |
| Browser main | API request | HTTP fetch | C-1, C-2, C-3, C-4, C-5, C-6 |
| API request | Queue worker | Redis queue job | C-6, C-7 |
| Worker | External source | Channel adapter HTTP fetch | C-7, C-9 |
| Worker | LLM provider | LLM API call | C-7, C-10 |

## §5. Dependency Map

| Source | Target | Relationship | Note |
| --- | --- | --- | --- |
| C-1..C-5 | B-1 | Web uses API only | No direct DB access from Web |
| C-6 | B-2 | API persists user-driven state | Must apply OwnedApp scope |
| C-7 | B-3 | Worker persists collected/derived state | Jobs must be idempotent |
| C-7 | B-5 | Worker calls channel adapters | Adapter failures must be recorded |
| C-7 | B-6 | Worker calls AI provider | Provider must be replaceable |
| C-6/C-7 | B-7 | API or worker generates reports | Reports must cite Evidence |

## §6. Design Decisions

| # | Decision | Evidence | Rejected Alternative |
| --- | --- | --- | --- |
| 1 | Use `OwnedApp` as first-class aggregate root for analysis scope. | Product requirement to manage multiple apps. | Global competitor-only model would mix contexts. |
| 2 | Use channel adapter abstraction. | Domestic Android stores have inconsistent fields and page structures. | One scraper for all stores would be brittle. |
| 3 | Store raw snapshots and normalized data separately. | Evidence traceability requirement. | Normalized-only storage loses auditability. |
| 4 | Use LLM provider abstraction. | Model choice is not fixed and may change. | Direct provider calls from business logic create lock-in. |
| 5 | Generate reports from stored data, not live pages. | Report evidence must remain stable after source changes. | Live report generation breaks historical reproducibility. |
