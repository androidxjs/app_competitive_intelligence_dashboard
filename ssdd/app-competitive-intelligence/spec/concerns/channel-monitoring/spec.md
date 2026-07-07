# Concern — Channel Monitoring

## Behavior

- **ACI-FLOW-CHANNEL-001**: User can add App Store China URLs and domestic Android channel URLs or manual placeholders for an Owned App or Competitor.
- **ACI-FLOW-CHANNEL-002**: System can record a Channel Snapshot with source URL, channel name, crawl status, captured time, and parsed fields.
- **ACI-FLOW-CHANNEL-003**: System can compare snapshots and identify version, description, screenshot, rating, review count, and price/member changes.
- **ACI-FLOW-CHANNEL-004**: System can show differences across App Store, Huawei, Xiaomi, OPPO, vivo, and Tencent MyApp for the same app.
- **ACI-RULE-CHANNEL-001**: Missing fields from one channel MUST be marked missing and MUST NOT be filled with another channel's data.
- **ACI-RULE-CHANNEL-002**: Crawl failure MUST record failure reason and last successful crawl time.
- **ACI-RULE-CHANNEL-003**: Channel adapters MUST obey compliance constraints and MUST NOT bypass login, captcha, paywall, or anti-scraping restrictions.

## Constraints

- First batch channels: App Store China, Huawei, Xiaomi, OPPO, vivo, Tencent MyApp.
- Channels that require login or captcha must be skipped or handled by manual entry.
- Snapshot retention must preserve evidence used by reports even if the source page changes later.

## Non-Goals

- Full coverage of every domestic Android store is not required for MVP.
- Download/revenue estimation is not required.

## Dependencies

- Scheduler / job queue.
- Store connectors and channel adapters.
- Evidence store.

## Boundaries

- Channel Monitoring collects and diffs data.
- AI classification and requirement conversion belong to Insight Requirement.

## Verification

spec_ids:
- ACI-FLOW-CHANNEL-001
- ACI-FLOW-CHANNEL-002
- ACI-FLOW-CHANNEL-003
- ACI-FLOW-CHANNEL-004
- ACI-RULE-CHANNEL-001
- ACI-RULE-CHANNEL-002
- ACI-RULE-CHANNEL-003
