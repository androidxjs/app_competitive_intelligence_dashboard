# Spec Feedback

## Summary

5 ambiguity items: blocking 0, high 2, medium 3, low 0.

## Ambiguity Items

### First-batch domestic channel order is not fully fixed

- **Type**: underspecified
- **Severity**: high
- **Detail**: Spec lists App Store China, Huawei, Xiaomi, OPPO, vivo, and Tencent MyApp, but implementation order can materially change MVP scope.
- **Source**: `PRODUCT_DOCUMENT.md` §21, `spec/concerns/channel-monitoring/spec.md`
- **Proposal**: Confirm whether MVP must include all first-batch channels or whether App Store + one Android channel spike is acceptable for first delivery.

### Legal/compliance policy for domestic store collection needs explicit approval

- **Type**: implicit
- **Severity**: high
- **Detail**: Spec says not to bypass login/captcha/paywall/anti-scraping, but does not define review/approval ownership for channel adapters.
- **Source**: `spec/spec.md`, `spec/concerns/channel-monitoring/spec.md`
- **Proposal**: Add an explicit channel approval checklist before enabling real crawling in production.

### Technology stack is suggested but not final

- **Type**: implicit
- **Severity**: medium
- **Detail**: Product doc suggests Next.js/FastAPI or Node, while this plan assumes Next.js + API service + PostgreSQL + Redis queue.
- **Source**: `PRODUCT_DOCUMENT.md` §15
- **Proposal**: Confirm final backend choice before implementation starts.

### LLM provider and data retention policy are not fully specified

- **Type**: underspecified
- **Severity**: medium
- **Detail**: The spec requires replaceable LLM provider and evidence retention, but does not define provider, token budget, retention duration, or redaction rules.
- **Source**: `PRODUCT_DOCUMENT.md` §10, §16, §17
- **Proposal**: Add LLM provider config and evidence retention requirements.

### Requirement export destination is still open

- **Type**: underspecified
- **Severity**: medium
- **Detail**: MVP supports Markdown/CSV/Excel export, but whether requirement candidates should map to an internal PRD or demand system is deferred.
- **Source**: `PRODUCT_DOCUMENT.md` §11 and §21
- **Proposal**: Keep MVP as Markdown/table export; define writeback later.

## Missing Acceptance Details

- Performance targets are not defined: project initialization time is mentioned in product doc, but API latency and worker SLAs are not specified.
- User permission roles are conceptual only; exact role matrix and auth provider are not specified.
- Screenshot OCR is P1; no acceptance criteria for OCR accuracy in MVP.

## Weak Contracts

- Channel adapter compliance is policy-level; implementation needs a concrete checklist.
- AI scoring model is explainable-rule based in MVP, but exact scoring thresholds are unspecified.
- Report delivery is Markdown-first; Feishu/email delivery is not yet an implementation contract.

## Questions To Resolve Before Implementation

1. Should MVP implement all first-batch Android channels, or start with App Store China + one domestic Android channel?
2. Which backend stack should be final: Node API, FastAPI, or another internal standard?
3. Who approves each channel adapter for compliance before production crawling?
4. Which LLM provider should be used for MVP, and what data redaction rules apply?
5. Should candidate requirements export only as Markdown/table, or also target an internal PRD/demand system?

## Suggested Spec Patch Topics

- Add `ChannelApprovalPolicy` to Channel Monitoring spec.
- Add `AuthRoleMatrix` to App Portfolio spec.
- Add `LLMProviderConfig` and data retention policy to Insight Requirement spec.
- Add report and requirement export acceptance criteria.
