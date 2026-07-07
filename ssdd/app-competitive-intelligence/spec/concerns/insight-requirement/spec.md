# Concern — Insight Requirement

## Behavior

- **ACI-FLOW-INSIGHT-001**: System can cluster reviews into topics such as bug, performance, pricing, membership, UX, AI, template, filter, and editing.
- **ACI-FLOW-INSIGHT-002**: System can extract feature candidates from descriptions, release notes, reviews, screenshots, and website text.
- **ACI-FLOW-INSIGHT-003**: System can build a Feature Matrix between current Owned App and selected competitors.
- **ACI-FLOW-INSIGHT-004**: User can confirm, dismiss, archive, or convert an Insight.
- **ACI-FLOW-REQ-001**: User can convert a valuable Insight into a Requirement Candidate.
- **ACI-RULE-INSIGHT-001**: Every reportable Insight MUST include evidence IDs, confidence, severity, source channels, and recommendation.
- **ACI-RULE-INSIGHT-002**: AI analysis MUST label outputs as Fact, Pattern, Inference, or Recommendation.
- **ACI-RULE-REQ-001**: A Requirement Candidate MUST include problem, evidence, competitor reference, current app gap/advantage, recommendation, priority hint, and PRD notes.

## Constraints

- Sample size limitations must be visible to users.
- Strategic changes must be marked as inference, not fact.
- User feedback must affect future ranking but must not rewrite historical facts.

## Non-Goals

- Direct Jira / Linear / internal demand-system writeback is not required for MVP.
- Fully automated product decisions are not supported.

## Dependencies

- Evidence from Channel Monitoring and Website Watcher.
- LLM provider abstraction.
- Feature template selected by Owned App.

## Boundaries

- Insight Requirement owns AI analysis, Feature Matrix, and Requirement Candidates.
- It does not own crawling or report delivery.

## Verification

spec_ids:
- ACI-FLOW-INSIGHT-001
- ACI-FLOW-INSIGHT-002
- ACI-FLOW-INSIGHT-003
- ACI-FLOW-INSIGHT-004
- ACI-FLOW-REQ-001
- ACI-RULE-INSIGHT-001
- ACI-RULE-INSIGHT-002
- ACI-RULE-REQ-001
