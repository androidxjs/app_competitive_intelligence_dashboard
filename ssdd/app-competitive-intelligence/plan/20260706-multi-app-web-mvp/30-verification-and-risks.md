# Verification and Risks

## Acceptance Traceability Matrix

| Acceptance ID | Description | Slice | Verification |
| --- | --- | --- | --- |
| ACI-RULE-SCOPE-001 | Multi-app isolation for competitors, insights, requirements, reports | I-2, I-3, V-1 | Repository/API tests, UI switch test |
| ACI-FLOW-SETUP-001 | Create Owned App and attach competitors/channels | I-3, I-8, V-2 | API + UI scenario |
| ACI-FLOW-COLLECT-001 | Collect channel snapshots and evidence | I-4, I-8, V-2 | Worker integration with sample adapter |
| ACI-FLOW-ANALYZE-001 | Generate evidence-backed analysis | I-5, I-8, V-2 | Fake LLM + DB inspection |
| ACI-FLOW-REQUIREMENT-001 | Convert insight to candidate requirement | I-6, V-2 | UI/API conversion test |
| ACI-FLOW-REPORT-001 | Generate weekly report | I-7, I-8, V-2 | Markdown export snapshot |
| ACI-FLOW-APP-001 | Create Owned App | I-3 | API + UI test |
| ACI-FLOW-APP-002 | Edit Owned App | I-3 | API + UI test |
| ACI-FLOW-APP-003 | Archive Owned App | I-3 | State transition test |
| ACI-FLOW-APP-004 | Delete Owned App with retention choice | I-3 | API + UI confirmation test |
| ACI-FLOW-APP-005 | Switch current Owned App scope | I-3 | UI and API scoping test |
| ACI-RULE-APP-001 | B612 is default example, not unique target | I-3 | Seed and create-second-app test |
| ACI-RULE-APP-002 | Competitors reusable but insights scoped | I-2, I-3 | Repository isolation test |
| ACI-RULE-APP-003 | Deleting app stops future collection jobs | I-3, I-8 | Job enqueue test |
| ACI-RULE-APP-004 | No active app returns empty state | I-3, I-8 | UI empty state test |
| ACI-FLOW-CHANNEL-001 | Add channel URLs | I-3, I-4 | API + UI test |
| ACI-FLOW-CHANNEL-002 | Record channel snapshot | I-4 | Worker integration test |
| ACI-FLOW-CHANNEL-003 | Compare snapshots | I-4 | Diff unit test |
| ACI-FLOW-CHANNEL-004 | Show cross-channel differences | I-4, I-8 | UI/API test |
| ACI-RULE-CHANNEL-001 | Missing fields not backfilled from other channels | I-4 | Diff/adapter unit test |
| ACI-RULE-CHANNEL-002 | Crawl failure records reason and last success | I-4, I-8 | Worker failure test |
| ACI-RULE-CHANNEL-003 | Adapter obeys compliance constraints | I-4 | Adapter policy test + manual review |
| ACI-FLOW-INSIGHT-001 | Cluster reviews into topics | I-5 | Fake LLM / rule test |
| ACI-FLOW-INSIGHT-002 | Extract feature candidates | I-5 | Extraction test |
| ACI-FLOW-INSIGHT-003 | Build feature matrix | I-6 | Matrix unit/API test |
| ACI-FLOW-INSIGHT-004 | Confirm/dismiss/archive/convert insight | I-5, I-6 | State transition test |
| ACI-FLOW-REQ-001 | Convert insight to requirement | I-6 | API + UI test |
| ACI-RULE-INSIGHT-001 | Insight includes evidence/confidence/severity/channel/recommendation | I-5 | DB assertion |
| ACI-RULE-INSIGHT-002 | AI labels Fact/Pattern/Inference/Recommendation | I-5 | Fake provider output test |
| ACI-RULE-REQ-001 | Requirement has required PRD fields | I-6 | Schema/API test |
| ACI-FLOW-REPORT-001 | Generate weekly report | I-7 | Report generation test |
| ACI-FLOW-REPORT-002 | Report includes required sections | I-7 | Markdown snapshot |
| ACI-FLOW-REPORT-003 | Markdown export | I-7 | Export test |
| ACI-FLOW-REPORT-004 | Report status transitions | I-7 | State transition test |
| ACI-RULE-REPORT-001 | Report scoped to one Owned App and period | I-7 | Repository/API test |
| ACI-RULE-REPORT-002 | Report conclusions cite insight/evidence | I-7 | Markdown evidence assertion |
| ACI-RULE-REPORT-003 | Light report when no major changes | I-7 | Empty-period report test |
| ACI-RULE-EVIDENCE-001 | Every reportable insight references evidence | I-5, I-7, V-2 | DB and report tests |
| ACI-RULE-COMPLIANCE-001 | No bypassing protected sources | I-4 | Manual review + adapter policy |
| ACI-RULE-AI-001 | AI output distinguishes evidence level | I-5 | Provider output test |
| ACI-RULE-EXPORT-001 | Markdown export includes required metadata | I-7 | Markdown snapshot |

**Coverage**: 42 / 42 planned acceptance and active spec IDs are covered.

## Verification Matrix

| Target | Type | Method | Confidence |
| --- | --- | --- | --- |
| Domain state transitions | Unit | Test OwnedApp, Insight, RequirementCandidate, Report state machines | Invalid transitions rejected |
| OwnedApp scope isolation | Integration | Create two apps with shared competitor; query insights/reports separately | No cross-app leakage |
| Channel adapter parsing | Unit | Run sample fixtures for App Store and one Android adapter | Raw and normalized output saved |
| Snapshot diff | Unit | Compare two snapshots with version/description/screenshot/rating changes | Expected diff records created |
| Job idempotency | Integration | Run same crawl/report job twice with same idempotency key | No duplicate snapshots/reports |
| LLMProvider abstraction | Unit | Use fake provider for deterministic output | Insight fields persist correctly |
| Evidence traceability | Integration | Generate insight and report from sample evidence | Every conclusion cites evidence |
| Feature Matrix | Integration | Compare OwnedApp features vs competitor features | Gap/advantage classifications correct |
| Requirement conversion | UI/API | Convert insight to requirement from UI | Required fields populated |
| Markdown report | Snapshot | Generate report for seeded data | Required sections and metadata present |
| Empty states | UI | No app, no competitor, failed channel, no major changes | User sees actionable empty states |

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Domestic Android store pages are unstable or block crawling | High | Channel monitoring unreliable | Start with manual/sample adapter + one channel spike; record failure reasons; do not bypass protections |
| Tech stack not finalized | Medium | Plan paths may change | Keep domain/connectors/AI/reporting boundaries stable |
| AI outputs generic or wrong recommendations | Medium | PM trust decreases | Require Evidence, confidence, Fact/Pattern/Inference labels, and user feedback loop |
| Multi-app scope leakage | Medium | Wrong app gets wrong insight/report | Enforce `owned_app_id` at repository/API level and test isolation |
| Report becomes verbose but not actionable | Medium | PM cannot use it in review | Require candidate requirements and PRD notes in report |
| Missing real competitor list | Medium | MVP validation weak | Use B612 plus 3-5 real app projects before implementation acceptance |

## Blockers

None blocking implementation planning. The unresolved items in `40-spec-feedback.md` should be confirmed before or during the first two implementation slices.

## Dependencies

- PostgreSQL or equivalent relational DB.
- Redis or equivalent queue for background jobs.
- LLM provider with API compatibility.
- Confirmed first-batch competitor and channel list.
- Legal/compliance review for public page collection policy.

## Rollback / Safety Notes

- Keep raw snapshots immutable; if parsing logic is wrong, regenerate normalized records from raw evidence.
- Gate new channel adapters behind per-channel enable flags.
- Keep fake/manual adapter available for deterministic demos and tests.
- Do not delete historical reports when an Owned App is archived.

## Architecture Contract Verification

### Boundary Verification

| Boundary | Target | Type | Method | Pass Condition |
| --- | --- | --- | --- | --- |
| B-1 | Web -> API | Integration/UI | Create app, switch app, load dashboard | UI only sees selected app data |
| B-2 | API -> DB | Integration | Repository tests with two OwnedApps | Queries are scoped |
| B-3 | Worker -> DB | Integration | Worker saves snapshot/evidence | Records persist once |
| B-4 | API -> Queue | Integration | Enqueue crawl/report jobs | Job created with idempotency key |
| B-5 | Worker -> Channel Adapter | Unit/Integration | Run adapter fixtures | Parse result or failure reason returned |
| B-6 | Worker -> LLM Provider | Unit | Fake provider output | Insight includes evidence/confidence/category |
| B-7 | API/Worker -> Report Exporter | Snapshot | Generate Markdown | Required sections and evidence refs present |

### Resource Verification

No explicit resource contracts.
