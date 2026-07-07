# Dev Constraints — Insight Requirement

- Insight generation must persist prompt input references and output evidence links for auditability.
- LLMProvider must be replaceable and should not leak provider-specific fields into core domain models.
- RequirementCandidate must reference source Insight and Evidence records.
- Feature Matrix should preserve manual edits from users and not overwrite them blindly on re-analysis.
- Confidence and severity scoring should be deterministic or explainable in MVP.
