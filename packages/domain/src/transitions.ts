import { createId, isoNow } from "./ids";
import type {
  ActionRecommendation,
  Competitor,
  DashboardState,
  Feature,
  Insight,
  InsightStatus,
  Job,
  JobState,
  OwnedApp,
  OwnedAppStatus,
  Priority,
  Report,
  ReportStatus,
  RequirementCandidate,
  RequirementStatus
} from "./types";

export interface CreateOwnedAppInput {
  projectId: string;
  name: string;
  category: string;
  owner: string;
  platforms: OwnedApp["platforms"];
  featureTemplate: string;
  websiteUrl?: string;
  appStoreUrl?: string;
  androidStoreUrls?: string[];
}

// @SpecId: ACI-FLOW-APP-001, ACI-RULE-APP-001
export function createOwnedApp(input: CreateOwnedAppInput): OwnedApp {
  const now = isoNow();
  return {
    id: createId("app"),
    projectId: input.projectId,
    name: input.name.trim(),
    category: input.category.trim() || "未分类",
    owner: input.owner.trim() || "产品团队",
    platforms: input.platforms.length > 0 ? input.platforms : ["ios", "android"],
    status: "Active",
    featureTemplate: input.featureTemplate || "通用 App",
    websiteUrl: input.websiteUrl,
    appStoreUrl: input.appStoreUrl,
    androidStoreUrls: input.androidStoreUrls ?? [],
    createdAt: now,
    updatedAt: now
  };
}

// @SpecId: ACI-FLOW-APP-002
export function updateOwnedApp(existing: OwnedApp, patch: Partial<CreateOwnedAppInput>): OwnedApp {
  return {
    ...existing,
    name: patch.name?.trim() ?? existing.name,
    category: patch.category?.trim() ?? existing.category,
    owner: patch.owner?.trim() ?? existing.owner,
    platforms: patch.platforms ?? existing.platforms,
    featureTemplate: patch.featureTemplate ?? existing.featureTemplate,
    websiteUrl: patch.websiteUrl ?? existing.websiteUrl,
    appStoreUrl: patch.appStoreUrl ?? existing.appStoreUrl,
    androidStoreUrls: patch.androidStoreUrls ?? existing.androidStoreUrls,
    updatedAt: isoNow()
  };
}

// @SpecId: ACI-FLOW-APP-003, ACI-RULE-APP-003
export function transitionOwnedAppStatus(existing: OwnedApp, nextStatus: OwnedAppStatus): OwnedApp {
  if (existing.status === "Deleted") {
    throw new Error("Deleted apps cannot transition to another state.");
  }
  if (nextStatus === "Incomplete" && existing.status !== "Incomplete") {
    throw new Error("Active app cannot return to incomplete state.");
  }
  return { ...existing, status: nextStatus, updatedAt: isoNow() };
}

// @SpecId: ACI-FLOW-APP-004
export function removeOwnedApp(state: DashboardState, ownedAppId: string, retainHistory: boolean): DashboardState {
  const now = isoNow();
  const removedStatus: OwnedAppStatus = retainHistory ? "Archived" : "Deleted";
  const ownedApps = state.ownedApps.map((app) => (app.id === ownedAppId ? { ...app, status: removedStatus, updatedAt: now } : app));
  const channels = state.channels.map((channel) =>
    channel.ownedAppId === ownedAppId ? { ...channel, collectionMode: "disabled" as const, crawlStatus: "Skipped" as const, updatedAt: now } : channel
  );

  if (retainHistory) {
    return { ...state, ownedApps, channels };
  }

  return {
    ...state,
    ownedApps,
    channels: channels.filter((channel) => channel.ownedAppId !== ownedAppId),
    competitors: state.competitors.filter((competitor) => competitor.ownedAppId !== ownedAppId),
    snapshots: state.snapshots.filter((snapshot) => snapshot.ownedAppId !== ownedAppId),
    reviews: state.reviews.filter((review) => review.ownedAppId !== ownedAppId),
    evidence: state.evidence.filter((evidence) => evidence.ownedAppId !== ownedAppId),
    insights: state.insights.filter((insight) => insight.ownedAppId !== ownedAppId),
    features: state.features.filter((feature) => feature.ownedAppId !== ownedAppId),
    moduleAnalyses: state.moduleAnalyses.filter((analysis) => analysis.ownedAppId !== ownedAppId),
    actionRecommendations: state.actionRecommendations.filter((recommendation) => recommendation.ownedAppId !== ownedAppId),
    socialSamples: state.socialSamples.filter((sample) => sample.ownedAppId !== ownedAppId),
    socialAuthConfigs: state.socialAuthConfigs.filter((config) => config.ownedAppId !== ownedAppId),
    requirements: state.requirements.filter((requirement) => requirement.ownedAppId !== ownedAppId),
    reports: state.reports.filter((report) => report.ownedAppId !== ownedAppId),
    jobs: state.jobs.filter((job) => job.ownedAppId !== ownedAppId)
  };
}

export function createCompetitor(input: Omit<Competitor, "id" | "status" | "createdAt" | "updatedAt">): Competitor {
  const now = isoNow();
  return { ...input, id: createId("cmp"), status: "Active", createdAt: now, updatedAt: now };
}

// @SpecId: ACI-FLOW-INSIGHT-004
export function updateInsightStatus(insight: Insight, status: InsightStatus): Insight {
  if (insight.status === "Archived" && status !== "Archived") {
    throw new Error("Archived insights cannot be reopened in MVP.");
  }
  return { ...insight, status, updatedAt: isoNow() };
}

export function updateRequirementStatus(requirement: RequirementCandidate, status: RequirementStatus): RequirementCandidate {
  return { ...requirement, status, updatedAt: isoNow() };
}

export function updateReportStatus(report: Report, status: ReportStatus): Report {
  return { ...report, status, updatedAt: isoNow() };
}

// @SpecId: ACI-FLOW-REQ-001, ACI-FLOW-REQUIREMENT-001, ACI-RULE-REQ-001
export function createRequirementFromInsight(insight: Insight, competitorName = "竞品"): RequirementCandidate {
  const now = isoNow();
  const priority: Priority = insight.severity === "high" ? "P0" : insight.severity === "medium" ? "P1" : "P2";
  return {
    id: createId("req"),
    ownedAppId: insight.ownedAppId,
    insightIds: [insight.id],
    problem: insight.title,
    evidenceIds: insight.evidenceIds,
    competitorReference: competitorName,
    appGapOrAdvantage: insight.category.includes("优势") ? "可强化为当前 App 卖点" : "需要评估当前 App 是否存在能力差距",
    recommendation: insight.recommendation,
    priorityHint: priority,
    prdNotes: `问题：${insight.summary}\n目标：验证该机会是否能提升核心用户体验。\n验收：方案必须引用证据 ${insight.evidenceIds.join(", ")}。`,
    status: "Draft",
    createdAt: now,
    updatedAt: now
  };
}

// @SpecId: ACI-FLOW-REQ-001, ACI-FLOW-REQUIREMENT-001, ACI-RULE-REQ-001
export function createRequirementFromRecommendation(recommendation: ActionRecommendation, competitorName = "竞品"): RequirementCandidate {
  const now = isoNow();
  return {
    id: createId("req"),
    ownedAppId: recommendation.ownedAppId,
    insightIds: recommendation.insightIds,
    problem: recommendation.title,
    evidenceIds: recommendation.evidenceIds,
    competitorReference: competitorName,
    appGapOrAdvantage:
      recommendation.actionType === "amplify_advantage"
        ? "当前 App 优势项，需要强化为卖点或商店页表达"
        : "来自机会雷达的竞品差距或体验优化项，需要评估实现成本",
    recommendation: recommendation.recommendation,
    priorityHint: recommendation.priorityHint,
    prdNotes: [
      `问题：${recommendation.problem}`,
      `为什么现在：${recommendation.whyNow}`,
      `研发提示：${recommendation.implementationHint}`,
      `成功指标：${recommendation.successMetric}`,
      `证据：${recommendation.evidenceIds.join(", ") || "待补证据"}`
    ].join("\n"),
    status: "Draft",
    createdAt: now,
    updatedAt: now
  };
}

export function preserveManualFeatureEdits(existing: Feature[], incoming: Feature[]): Feature[] {
  const manualByName = new Map(
    existing
      .filter((feature) => feature.source === "user_confirmed" || feature.source === "user_edited")
      .map((feature) => [feature.name, feature])
  );
  return incoming.map((feature) => manualByName.get(feature.name) ?? feature);
}

export function createJob(ownedAppId: string, type: Job["type"], idempotencyKey: string): Job {
  return {
    id: createId("job"),
    ownedAppId,
    type,
    state: "Queued",
    idempotencyKey,
    progress: 0,
    userMessage: "任务已排队",
    createdAt: isoNow()
  };
}

export function transitionJob(job: Job, state: JobState, progress: number, userMessage: string, errorCode?: string): Job {
  const now = isoNow();
  return {
    ...job,
    state,
    progress,
    userMessage,
    errorCode,
    startedAt: job.startedAt ?? (state === "Running" ? now : job.startedAt),
    finishedAt: state === "Succeeded" || state === "PartialSucceeded" || state === "Failed" || state === "Canceled" ? now : job.finishedAt
  };
}
