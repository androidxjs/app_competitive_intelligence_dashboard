import type {
  AppSnapshot,
  ActionRecommendation,
  Channel,
  Competitor,
  CompetitorModuleAnalysis,
  DashboardState,
  Evidence,
  Feature,
  Insight,
  Job,
  OwnedApp,
  OverviewMetrics,
  Report,
  RequirementCandidate,
  Review,
  SocialAuthConfig,
  SocialSample,
  ScopedDashboardState
} from "./types.js";

export function createEmptyState(): DashboardState {
  return {
    projects: [],
    ownedApps: [],
    competitors: [],
    channels: [],
    snapshots: [],
    reviews: [],
    evidence: [],
    insights: [],
    features: [],
    moduleAnalyses: [],
    actionRecommendations: [],
    socialSamples: [],
    socialAuthConfigs: [],
    requirements: [],
    reports: [],
    jobs: []
  };
}

// @SpecId: ACI-RULE-SCOPE-001, ACI-RULE-APP-002, ACI-RULE-APP-004
export function getScopedState(state: DashboardState, ownedAppId?: string): ScopedDashboardState {
  if (!ownedAppId) {
    return { ...createEmptyState(), projects: state.projects };
  }

  const currentOwnedApp = state.ownedApps.find((app) => app.id === ownedAppId && app.status !== "Deleted");
  if (!currentOwnedApp) {
    return { ...createEmptyState(), projects: state.projects };
  }

  const competitors = state.competitors.filter((competitor) => competitor.ownedAppId === ownedAppId);
  const competitorIds = new Set(competitors.map((competitor) => competitor.id));
  const channels = state.channels.filter((channel) => channel.ownedAppId === ownedAppId);
  const channelIds = new Set(channels.map((channel) => channel.id));

  return {
    projects: state.projects,
    ownedApps: state.ownedApps.filter((app) => app.status !== "Deleted"),
    competitors,
    channels,
    snapshots: state.snapshots.filter((snapshot) => snapshot.ownedAppId === ownedAppId && channelIds.has(snapshot.channelId)),
    reviews: state.reviews.filter((review) => review.ownedAppId === ownedAppId && channelIds.has(review.channelId)),
    evidence: state.evidence.filter((evidence) => evidence.ownedAppId === ownedAppId),
    insights: state.insights.filter((insight) => insight.ownedAppId === ownedAppId),
    features: state.features.filter((feature) => feature.ownedAppId === ownedAppId),
    moduleAnalyses: state.moduleAnalyses.filter(
      (analysis) => analysis.ownedAppId === ownedAppId && competitorIds.has(analysis.competitorId)
    ),
    actionRecommendations: state.actionRecommendations.filter((recommendation) => recommendation.ownedAppId === ownedAppId),
    socialSamples: state.socialSamples.filter((sample) => sample.ownedAppId === ownedAppId),
    socialAuthConfigs: state.socialAuthConfigs.filter((config) => config.ownedAppId === ownedAppId),
    requirements: state.requirements.filter((requirement) => requirement.ownedAppId === ownedAppId),
    reports: state.reports.filter((report) => report.ownedAppId === ownedAppId),
    jobs: state.jobs.filter((job) => job.ownedAppId === ownedAppId),
    currentOwnedApp
  };
}

export function replaceOwnedApp(state: DashboardState, ownedApp: OwnedApp): DashboardState {
  return {
    ...state,
    ownedApps: state.ownedApps.map((item) => (item.id === ownedApp.id ? ownedApp : item))
  };
}

export function upsertOwnedApp(state: DashboardState, ownedApp: OwnedApp): DashboardState {
  const exists = state.ownedApps.some((item) => item.id === ownedApp.id);
  return exists ? replaceOwnedApp(state, ownedApp) : { ...state, ownedApps: [...state.ownedApps, ownedApp] };
}

export function upsertCompetitor(state: DashboardState, competitor: Competitor): DashboardState {
  const exists = state.competitors.some((item) => item.id === competitor.id);
  return {
    ...state,
    competitors: exists
      ? state.competitors.map((item) => (item.id === competitor.id ? competitor : item))
      : [...state.competitors, competitor]
  };
}

export function upsertChannel(state: DashboardState, channel: Channel): DashboardState {
  const exists = state.channels.some((item) => item.id === channel.id);
  return {
    ...state,
    channels: exists ? state.channels.map((item) => (item.id === channel.id ? channel : item)) : [...state.channels, channel]
  };
}

export function appendEvidence(state: DashboardState, evidence: Evidence[]): DashboardState {
  const known = new Set(state.evidence.map((item) => item.id));
  return { ...state, evidence: [...state.evidence, ...evidence.filter((item) => !known.has(item.id))] };
}

export function appendSnapshots(state: DashboardState, snapshots: AppSnapshot[]): DashboardState {
  const known = new Set(state.snapshots.map((item) => item.id));
  return { ...state, snapshots: [...state.snapshots, ...snapshots.filter((item) => !known.has(item.id))] };
}

export function appendReviews(state: DashboardState, reviews: Review[]): DashboardState {
  const known = new Set(state.reviews.map((item) => item.id));
  return { ...state, reviews: [...state.reviews, ...reviews.filter((item) => !known.has(item.id))] };
}

export function appendInsights(state: DashboardState, insights: Insight[]): DashboardState {
  const known = new Set(state.insights.map((item) => item.id));
  return { ...state, insights: [...state.insights, ...insights.filter((item) => !known.has(item.id))] };
}

export function upsertFeatures(state: DashboardState, features: Feature[]): DashboardState {
  const incoming = new Map(features.map((feature) => [`${feature.ownedAppId}:${feature.name}`, feature]));
  const retained = state.features.filter((feature) => !incoming.has(`${feature.ownedAppId}:${feature.name}`));
  const merged = features.map((feature) => {
    const existing = state.features.find((item) => item.ownedAppId === feature.ownedAppId && item.name === feature.name);
    if (!existing) {
      return feature;
    }
    if (existing.source === "user_confirmed" || existing.source === "user_edited") {
      return {
        ...feature,
        id: existing.id,
        currentAppSupport: existing.currentAppSupport,
        competitorSupport: { ...feature.competitorSupport, ...existing.competitorSupport },
        source: existing.source,
        updatedAt: feature.updatedAt
      };
    }
    return { ...feature, id: existing.id };
  });
  return { ...state, features: [...retained, ...merged] };
}

export function upsertModuleAnalyses(state: DashboardState, analyses: CompetitorModuleAnalysis[]): DashboardState {
  const incoming = new Map(analyses.map((analysis) => [`${analysis.ownedAppId}:${analysis.competitorId}:${analysis.moduleType}`, analysis]));
  const retained = state.moduleAnalyses.filter(
    (analysis) => !incoming.has(`${analysis.ownedAppId}:${analysis.competitorId}:${analysis.moduleType}`)
  );
  return { ...state, moduleAnalyses: [...retained, ...analyses] };
}

export function upsertActionRecommendations(state: DashboardState, recommendations: ActionRecommendation[]): DashboardState {
  const incoming = new Map(recommendations.map((recommendation) => [`${recommendation.ownedAppId}:${recommendation.sourceKey}`, recommendation]));
  const retained = state.actionRecommendations.filter(
    (recommendation) => !incoming.has(`${recommendation.ownedAppId}:${recommendation.sourceKey}`)
  );
  const merged = recommendations.map((recommendation) => {
    const existing = state.actionRecommendations.find(
      (item) => item.ownedAppId === recommendation.ownedAppId && item.sourceKey === recommendation.sourceKey
    );
    if (!existing) {
      return recommendation;
    }
    return {
      ...recommendation,
      id: existing.id,
      status: existing.status,
      createdAt: existing.createdAt
    };
  });
  return { ...state, actionRecommendations: [...retained, ...merged] };
}

export function upsertSocialSample(state: DashboardState, sample: SocialSample): DashboardState {
  const exists = state.socialSamples.some((item) => item.id === sample.id);
  return {
    ...state,
    socialSamples: exists ? state.socialSamples.map((item) => (item.id === sample.id ? sample : item)) : [...state.socialSamples, sample]
  };
}

export function upsertSocialAuthConfig(state: DashboardState, config: SocialAuthConfig): DashboardState {
  const exists = state.socialAuthConfigs.some((item) => item.id === config.id);
  return {
    ...state,
    socialAuthConfigs: exists
      ? state.socialAuthConfigs.map((item) => (item.id === config.id ? config : item))
      : [...state.socialAuthConfigs, config]
  };
}

export function appendRequirements(state: DashboardState, requirements: RequirementCandidate[]): DashboardState {
  const known = new Set(state.requirements.map((item) => item.id));
  return { ...state, requirements: [...state.requirements, ...requirements.filter((item) => !known.has(item.id))] };
}

export function upsertReport(state: DashboardState, report: Report): DashboardState {
  const exists = state.reports.some((item) => item.id === report.id);
  return {
    ...state,
    reports: exists ? state.reports.map((item) => (item.id === report.id ? report : item)) : [...state.reports, report]
  };
}

export function upsertJob(state: DashboardState, job: Job): DashboardState {
  const exists = state.jobs.some((item) => item.id === job.id);
  return {
    ...state,
    jobs: exists ? state.jobs.map((item) => (item.id === job.id ? job : item)) : [...state.jobs, job]
  };
}

export function buildOverviewMetrics(state: DashboardState, ownedAppId: string): OverviewMetrics {
  const scoped = getScopedState(state, ownedAppId);
  return {
    competitors: scoped.competitors.filter((competitor) => competitor.status === "Active").length,
    channels: scoped.channels.length,
    activeInsights: scoped.insights.filter((insight) => insight.status === "New" || insight.status === "Confirmed").length,
    recommendations: scoped.actionRecommendations.filter((recommendation) => recommendation.status === "Open" || recommendation.status === "Planned").length,
    requirements: scoped.requirements.length,
    reports: scoped.reports.length,
    failedChannels: scoped.channels.filter((channel) => channel.crawlStatus === "Failed" || channel.crawlStatus === "Skipped").length
  };
}
