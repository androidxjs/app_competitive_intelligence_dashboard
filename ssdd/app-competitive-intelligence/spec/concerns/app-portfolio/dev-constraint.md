# Dev Constraints — App Portfolio

- OwnedApp must be a first-class persisted entity.
- Competitor, Insight, Feature, Report, and RequirementCandidate records must include `owned_app_id` or equivalent scoping.
- Deletion must use an explicit confirmation flow because historical evidence may be required by exported reports.
- App switching must not rely only on client-side state; API requests must carry or infer the active Owned App safely.
