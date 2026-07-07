import { getScopedState } from "./state";
import type {
  CompetitiveAlertSeverity,
  DashboardState,
  Evidence,
  Feature,
  FeatureGapDetail,
  FeatureSupport,
  Review,
  ScopedDashboardState,
  SocialSample
} from "./types";

function featureDecision(feature: Feature): FeatureGapDetail["decision"] {
  const competitorOwnedCount = Object.values(feature.competitorSupport).filter((value) => value === "owned" || value === "advantage").length;
  if (feature.currentAppSupport === "missing" && competitorOwnedCount > 0) {
    return "gap";
  }
  if (feature.currentAppSupport === "partial" && competitorOwnedCount >= 2) {
    return "improve";
  }
  if (feature.currentAppSupport === "advantage") {
    return "advantage";
  }
  return "watch";
}

function suggestedAction(feature: Feature): string {
  const decision = featureDecision(feature);
  if (decision === "gap") {
    return feature.demandScore >= 80 ? "进入需求池，先做方案评估和研发成本拆解。" : "补充竞品证据后再判断是否排期。";
  }
  if (decision === "improve") {
    return "对比竞品入口、链路、付费边界和用户反馈，做小范围优化实验。";
  }
  if (decision === "advantage") {
    return "强化为商店页、社媒传播和版本周报卖点。";
  }
  return "持续监控版本、评论和社媒话题，暂不进入排期。";
}

function keywordParts(feature: Feature): string[] {
  return Array.from(
    new Set(
      [feature.name, feature.category, ...feature.name.split(/[\/,，、\s]+/), ...feature.category.split(/[\/,，、\s]+/)]
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  );
}

function containsFeature(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function evidenceForFeature(scoped: ScopedDashboardState, feature: Feature, competitorId?: string): Evidence[] {
  const keywords = keywordParts(feature);
  const snapshotEvidenceIds = scoped.snapshots
    .filter((snapshot) => snapshot.competitorId === competitorId)
    .filter((snapshot) => containsFeature([snapshot.description, snapshot.releaseNotes, snapshot.priceText, snapshot.screenshots.join(" ")].filter(Boolean).join(" "), keywords))
    .map((snapshot) => snapshot.evidenceId);
  const reviewEvidenceIds = scoped.reviews
    .filter((review) => review.competitorId === competitorId)
    .filter((review) => containsFeature(`${review.topicHint ?? ""} ${review.content}`, keywords))
    .map((review) => review.evidenceId);
  const socialEvidenceIds = scoped.socialSamples
    .filter((sample) => sample.competitorId === competitorId)
    .filter((sample) => containsFeature(`${sample.topic} ${sample.summary} ${sample.tags.join(" ")}`, keywords))
    .map((sample) => sample.evidenceId)
    .filter((id): id is string => Boolean(id));
  const ids = unique([...snapshotEvidenceIds, ...reviewEvidenceIds, ...socialEvidenceIds]);
  return ids.map((id) => scoped.evidence.find((evidence) => evidence.id === id)).filter((item): item is Evidence => Boolean(item));
}

function reviewsForFeature(scoped: ScopedDashboardState, feature: Feature, competitorId?: string): Review[] {
  const keywords = keywordParts(feature);
  return scoped.reviews
    .filter((review) => review.competitorId === competitorId)
    .filter((review) => containsFeature(`${review.topicHint ?? ""} ${review.content}`, keywords));
}

function socialSamplesForFeature(scoped: ScopedDashboardState, feature: Feature, competitorId?: string): SocialSample[] {
  const keywords = keywordParts(feature);
  return scoped.socialSamples
    .filter((sample) => sample.competitorId === competitorId)
    .filter((sample) => containsFeature(`${sample.topic} ${sample.summary} ${sample.tags.join(" ")}`, keywords));
}

function sentiment(reviews: Review[]): CompetitiveAlertSeverity {
  if (reviews.some((review) => review.rating <= 2)) {
    return "high";
  }
  if (reviews.some((review) => review.rating === 3)) {
    return "medium";
  }
  return "low";
}

function supportValue(feature: Feature, competitorId: string): FeatureSupport {
  return feature.competitorSupport[competitorId] ?? "unknown";
}

function reviewSummary(reviews: Review[]): string {
  if (reviews.length === 0) {
    return "暂无直接评论样本，需要继续补充评论或社媒证据。";
  }
  const negative = reviews.filter((review) => review.rating <= 2).length;
  const positive = reviews.filter((review) => review.rating >= 4).length;
  return `关联评论 ${reviews.length} 条，其中正向 ${positive} 条、负向 ${negative} 条。`;
}

export function buildFeatureGapDetails(state: DashboardState, ownedAppId: string): FeatureGapDetail[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  return scoped.features
    .map((feature) => {
      const ownEvidence = evidenceForFeature(scoped, feature);
      const competitorDetails = scoped.competitors.map((competitor) => {
        const evidence = evidenceForFeature(scoped, feature, competitor.id);
        const reviews = reviewsForFeature(scoped, feature, competitor.id);
        const socialSamples = socialSamplesForFeature(scoped, feature, competitor.id);
        const socialEvidenceIds = socialSamples.map((sample) => sample.evidenceId).filter((id): id is string => Boolean(id));
        return {
          competitorId: competitor.id,
          competitorName: competitor.name,
          support: supportValue(feature, competitor.id),
          evidenceIds: evidence.map((item) => item.id),
          reviewQuotes: reviews.slice(0, 3).map((review) => review.content),
          reviewSentiment: sentiment(reviews),
          socialEvidenceIds,
          lastSignalAt: [...evidence.map((item) => item.capturedAt), ...socialSamples.map((sample) => sample.updatedAt)].sort().reverse()[0]
        };
      });
      const relatedReviews = scoped.competitors.flatMap((competitor) => reviewsForFeature(scoped, feature, competitor.id));
      const socialEvidenceIds = scoped.competitors.flatMap((competitor) =>
        socialSamplesForFeature(scoped, feature, competitor.id)
          .map((sample) => sample.evidenceId)
          .filter((id): id is string => Boolean(id))
      );
      const totalEvidenceIds = unique([
        ...ownEvidence.map((item) => item.id),
        ...competitorDetails.flatMap((detail) => detail.evidenceIds),
        ...socialEvidenceIds
      ]);
      return {
        featureId: feature.id,
        ownedAppId,
        featureName: feature.name,
        category: feature.category,
        currentAppSupport: feature.currentAppSupport,
        decision: featureDecision(feature),
        demandScore: feature.demandScore,
        suggestedAction: suggestedAction(feature),
        ownEvidenceIds: ownEvidence.map((item) => item.id),
        competitorDetails,
        socialEvidenceIds,
        reviewSummary: reviewSummary(relatedReviews),
        totalEvidenceCount: totalEvidenceIds.length
      };
    })
    .sort((left, right) => right.demandScore - left.demandScore || right.totalEvidenceCount - left.totalEvidenceCount);
}
