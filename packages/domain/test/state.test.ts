import { describe, expect, it } from "vitest";
import {
  buildActionRecommendations,
  buildCompetitiveAlerts,
  buildEvidenceDiffs,
  buildAsoKeywordOpportunities,
  buildFeatureGapDetails,
  buildSocialAuthUrl,
  buildLaunchSignals,
  buildPriceSignals,
  buildRatingSentimentSignals,
  buildStoreMetadataSignals,
  createEvidenceFromSocialSample,
  createSocialAuthConfig,
  buildTrendTimeline,
  createSocialSample,
  createRequirementFromInsight,
  createRequirementFromRecommendation,
  createSeedState,
  getScopedState,
  removeOwnedApp
} from "../src";

describe("domain state", () => {
  it("scopes competitors, insights, requirements, and reports by owned app", () => {
    const state = createSeedState();
    const b612 = getScopedState(state, "app_b612");
    const foodie = getScopedState(state, "app_foodie_demo");

    expect(b612.competitors.map((item) => item.name)).toContain("美图秀秀");
    expect(b612.moduleAnalyses.map((item) => item.moduleType)).toContain("growth");
    expect(b612.socialAuthConfigs.map((item) => item.platform)).toContain("xiaohongshu");
    expect(b612.actionRecommendations).toHaveLength(0);
    expect(foodie.competitors).toHaveLength(0);
    expect(foodie.moduleAnalyses).toHaveLength(0);
    expect(foodie.actionRecommendations).toHaveLength(0);
    expect(foodie.insights).toHaveLength(0);
    expect(foodie.reports).toHaveLength(0);
  });

  it("archives app history when retention is requested", () => {
    const state = createSeedState();
    const archived = removeOwnedApp(state, "app_b612", true);

    expect(archived.ownedApps.find((app) => app.id === "app_b612")?.status).toBe("Archived");
    expect(archived.evidence.length).toBeGreaterThan(0);
    expect(archived.channels.find((channel) => channel.ownedAppId === "app_b612")?.collectionMode).toBe("disabled");
  });

  it("removes scoped module analyses when app history is deleted", () => {
    const state = createSeedState();
    const removed = removeOwnedApp(state, "app_b612", false);

    expect(removed.moduleAnalyses.filter((analysis) => analysis.ownedAppId === "app_b612")).toHaveLength(0);
    expect(removed.actionRecommendations.filter((recommendation) => recommendation.ownedAppId === "app_b612")).toHaveLength(0);
    expect(removed.competitors.filter((competitor) => competitor.ownedAppId === "app_b612")).toHaveLength(0);
  });

  it("builds prioritized action recommendations from gaps, modules, and insights", () => {
    const recommendations = buildActionRecommendations(createSeedState(), "app_b612");

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations[0].impactScore).toBeGreaterThanOrEqual(recommendations[recommendations.length - 1].impactScore);
    expect(recommendations.some((recommendation) => recommendation.ownerRole === "engineering" || recommendation.implementationHint.includes("研发"))).toBe(true);
    expect(recommendations.some((recommendation) => recommendation.evidenceIds.length > 0)).toBe(true);
  });

  it("creates requirement candidates from evidence-backed insights", () => {
    const state = createSeedState();
    const requirement = createRequirementFromInsight(state.insights[0], "美图秀秀");

    expect(requirement.evidenceIds).toEqual(state.insights[0].evidenceIds);
    expect(requirement.priorityHint).toBe("P0");
    expect(requirement.prdNotes).toContain("验收");
  });

  it("builds P0 decision intelligence from existing evidence", () => {
    const state = createSeedState();

    expect(buildTrendTimeline(state, "app_b612").length).toBeGreaterThan(0);
    expect(buildPriceSignals(state, "app_b612").some((signal) => signal.numericPrices.length > 0)).toBe(true);
    expect(buildCompetitiveAlerts(state, "app_b612").some((alert) => alert.evidenceIds.length > 0)).toBe(true);
    expect(Array.isArray(buildEvidenceDiffs(state, "app_b612"))).toBe(true);
  });

  it("creates requirement candidates from action recommendations with engineering context", () => {
    const recommendation = buildActionRecommendations(createSeedState(), "app_b612")[0];
    const requirement = createRequirementFromRecommendation(recommendation, "美图秀秀");

    expect(requirement.evidenceIds).toEqual(recommendation.evidenceIds);
    expect(requirement.priorityHint).toBe(recommendation.priorityHint);
    expect(requirement.prdNotes).toContain("研发提示");
    expect(requirement.prdNotes).toContain("成功指标");
  });

  it("builds P1 market intelligence from store, review, keyword, and launch evidence", () => {
    const state = createSeedState();
    const metadataSignals = buildStoreMetadataSignals(state, "app_b612");
    const sentimentSignals = buildRatingSentimentSignals(state, "app_b612");
    const keywordOpportunities = buildAsoKeywordOpportunities(state, "app_b612");
    const launchSignals = buildLaunchSignals(state, "app_b612");

    expect(metadataSignals.some((signal) => signal.evidenceIds.length > 0)).toBe(true);
    expect(sentimentSignals.some((signal) => signal.sampleSize > 0 && signal.evidenceIds.length > 0)).toBe(true);
    expect(keywordOpportunities.some((opportunity) => opportunity.keyword.includes("AI") && opportunity.competitorCoverage.length > 0)).toBe(true);
    expect(launchSignals.some((signal) => signal.evidenceIds.length > 0 && signal.confidence > 0)).toBe(true);
  });

  it("builds feature gap details with competitor review and social evidence", () => {
    const details = buildFeatureGapDetails(createSeedState(), "app_b612");
    const aiDetail = details.find((detail) => detail.featureName.includes("AI"));

    expect(aiDetail).toBeDefined();
    expect(aiDetail?.competitorDetails.some((detail) => detail.evidenceIds.length > 0 || detail.socialEvidenceIds.length > 0)).toBe(true);
    expect(aiDetail?.suggestedAction.length).toBeGreaterThan(0);
  });

  it("creates social samples and auditable social evidence", () => {
    const sample = createSocialSample({
      ownedAppId: "app_b612",
      competitorId: "cmp_xingtu",
      platform: "xiaohongshu",
      url: "https://www.xiaohongshu.com/explore/example",
      topic: "AI 写真模板",
      summary: "用户在小红书讨论 AI 写真模板效果。",
      tags: ["AI", "写真", "模板"],
      signalType: "template_trend",
      impact: "high"
    });
    const evidence = createEvidenceFromSocialSample(sample);

    expect(sample.fetchStatus).toBe("ManualOnly");
    expect(evidence.sourceType).toBe("social");
    expect(evidence.channelName).toBe("Xiaohongshu");
    expect(evidence.rawExcerpt).toContain("AI 写真模板");
  });

  it("creates social auth configs and official authorization URLs", () => {
    const config = createSocialAuthConfig({
      ownedAppId: "app_b612",
      platform: "douyin",
      clientKey: "demo_client_key",
      clientSecret: "demo_secret",
      redirectUri: "http://localhost:4310/api/social-auth/callback/douyin",
      scopes: ["user_info"],
      dailyQuota: 50
    });
    const result = buildSocialAuthUrl(config);

    expect(config.clientSecretConfigured).toBe(true);
    expect(result.missingFields).toHaveLength(0);
    expect(result.authorizationUrl).toContain("open.douyin.com");
    expect(result.authorizationUrl).toContain("client_key=demo_client_key");
  });
});
