# Concern — Reporting

## Behavior

- **ACI-FLOW-REPORT-001**: User can generate a weekly report for the selected Owned App.
- **ACI-FLOW-REPORT-002**: Report includes summary, competitor changes, review hotspots, feature opportunities, candidate requirements, price/member changes, strategic inferences, and evidence references.
- **ACI-FLOW-REPORT-003**: User can export report as Markdown in MVP.
- **ACI-FLOW-REPORT-004**: User can mark report status as draft, reviewed, sent, or failed.
- **ACI-RULE-REPORT-001**: Report generation MUST be scoped to one Owned App and one report period.
- **ACI-RULE-REPORT-002**: Every key report conclusion MUST cite an Insight or Evidence item.
- **ACI-RULE-REPORT-003**: If no major changes happened in the period, the report MUST still show a light summary and data coverage.

## Constraints

- MVP exports Markdown first; PDF/HTML/Notion can be later.
- Report must preserve evidence references even if source pages later change.
- Delivery channels are Markdown export and optionally email/Feishu later.

## Non-Goals

- Fully automated external publishing is not required for MVP.

## Dependencies

- Insight Requirement.
- Evidence store.
- OwnedApp and Competitor scope.

## Boundaries

- Reporting composes confirmed insights and generated evidence into a report.
- It does not perform crawling or raw AI classification.

## Verification

spec_ids:
- ACI-FLOW-REPORT-001
- ACI-FLOW-REPORT-002
- ACI-FLOW-REPORT-003
- ACI-FLOW-REPORT-004
- ACI-RULE-REPORT-001
- ACI-RULE-REPORT-002
- ACI-RULE-REPORT-003
