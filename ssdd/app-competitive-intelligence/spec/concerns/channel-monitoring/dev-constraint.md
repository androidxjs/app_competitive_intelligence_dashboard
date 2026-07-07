# Dev Constraints — Channel Monitoring

- Channel adapters should expose a common interface and return structured parse results plus raw evidence.
- Crawling jobs must be idempotent by `owner_type + owner_id + channel + captured_date` or a stronger source-specific key.
- Raw snapshots and normalized records must be stored separately.
- Diff generation must compare snapshots from the same channel unless explicitly doing cross-channel comparison.
- Rate limiting and retry policy must be configurable per channel.
