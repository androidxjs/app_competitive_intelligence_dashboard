# Concern — App Portfolio

## Behavior

- **ACI-FLOW-APP-001**: User can create an Owned App with name, category, owner, platforms, website URL, feature template, and channel links.
- **ACI-FLOW-APP-002**: User can edit Owned App metadata without deleting historical snapshots, reports, or requirement candidates.
- **ACI-FLOW-APP-003**: User can archive an Owned App; archived apps stop default monitoring but preserve historical reports and evidence.
- **ACI-FLOW-APP-004**: User can delete an Owned App only after choosing whether to retain or remove historical reports, evidence, and requirement candidates.
- **ACI-FLOW-APP-005**: User can switch current Owned App from the dashboard, and all competitor, insight, report, and requirement views are scoped to that app.
- **ACI-RULE-APP-001**: B612 咔叽 MUST be available as a default example Owned App, but the system MUST NOT restrict analysis to B612 only.

## Constraints

- **ACI-RULE-APP-002**: Competitors MAY be reused across Owned Apps, but insights and requirement recommendations MUST remain scoped by Owned App.
- **ACI-RULE-APP-003**: Deleting an Owned App MUST stop future collection jobs for that app.
- **ACI-RULE-APP-004**: A dashboard request without an active Owned App MUST return an empty state asking the user to create or select an app.

## Non-Goals

- Multi-tenant enterprise billing is not part of MVP.
- Mobile app clients are not part of MVP.

## Dependencies

- Channel Monitoring for channel status.
- Insight Requirement for scoped insights and requirements.
- Reporting for scoped reports.

## Boundaries

- App Portfolio owns OwnedApp lifecycle and current app selection.
- It does not own channel crawling, AI analysis, or report generation internals.

## Verification

spec_ids:
- ACI-FLOW-APP-001
- ACI-FLOW-APP-002
- ACI-FLOW-APP-003
- ACI-FLOW-APP-004
- ACI-FLOW-APP-005
- ACI-RULE-APP-001
- ACI-RULE-APP-002
- ACI-RULE-APP-003
- ACI-RULE-APP-004
