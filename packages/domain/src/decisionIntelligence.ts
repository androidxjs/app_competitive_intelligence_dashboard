import { getScopedState } from "./state.js";
import type {
  ActionRecommendation,
  AppSnapshot,
  Channel,
  CompetitiveAlert,
  CompetitiveAlertSeverity,
  CompetitiveTimelineEvent,
  DashboardState,
  EvidenceDiff,
  EvidenceDiffField,
  Insight,
  OwnerType,
  Platform,
  PriceChangeType,
  PriceSignal,
  Review,
  ScopedDashboardState
} from "./types.js";

type StorePlatform = Exclude<Platform, "web">;

function platformForChannel(channel?: Channel): StorePlatform | undefined {
  if (!channel) {
    return undefined;
  }
  if (channel.channelName === "App Store China") {
    return "ios";
  }
  if (["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channel.channelName)) {
    return "android";
  }
  return undefined;
}

function ownerInfo(scoped: ScopedDashboardState, snapshot: AppSnapshot): { ownerType: OwnerType; ownerId: string; ownerName: string } {
  if (snapshot.competitorId) {
    const competitor = scoped.competitors.find((item) => item.id === snapshot.competitorId);
    return {
      ownerType: "competitor",
      ownerId: snapshot.competitorId,
      ownerName: competitor?.name ?? snapshot.competitorId
    };
  }
  return {
    ownerType: "owned_app",
    ownerId: scoped.currentOwnedApp?.id ?? snapshot.ownedAppId,
    ownerName: scoped.currentOwnedApp?.name ?? "自有 App"
  };
}

function channelFor(scoped: ScopedDashboardState, channelId: string): Channel | undefined {
  return scoped.channels.find((channel) => channel.id === channelId);
}

function stableId(prefix: string, parts: Array<string | number | undefined>): string {
  const source = parts.filter((part) => part !== undefined && part !== "").join(":");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash, 31) + source.charCodeAt(index);
    hash >>>= 0;
  }
  return `${prefix}_${hash.toString(36)}`;
}

function priceNumbers(priceText: string): string[] {
  return Array.from(new Set(priceText.match(/(?:¥|￥)\s?\d+(?:\.\d+)?|\d+(?:\.\d+)?\s*元/g) ?? []));
}

function snapshotsByOwnerChannel(scoped: ScopedDashboardState): Map<string, AppSnapshot[]> {
  const groups = new Map<string, AppSnapshot[]>();
  scoped.snapshots.forEach((snapshot) => {
    const owner = ownerInfo(scoped, snapshot);
    const key = `${owner.ownerType}:${owner.ownerId}:${snapshot.channelId}`;
    groups.set(key, [...(groups.get(key) ?? []), snapshot]);
  });
  groups.forEach((items, key) => {
    groups.set(key, [...items].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt)));
  });
  return groups;
}

function previousSnapshot(scoped: ScopedDashboardState, snapshot: AppSnapshot): AppSnapshot | undefined {
  const owner = ownerInfo(scoped, snapshot);
  const group = snapshotsByOwnerChannel(scoped).get(`${owner.ownerType}:${owner.ownerId}:${snapshot.channelId}`) ?? [];
  const index = group.findIndex((item) => item.id === snapshot.id);
  return index >= 0 ? group[index + 1] : undefined;
}

function eventImpact(snapshot: AppSnapshot): CompetitiveAlertSeverity {
  if ((snapshot.rating ?? 5) < 4.3) {
    return "high";
  }
  if (snapshot.priceText || snapshot.releaseNotes) {
    return "medium";
  }
  return "low";
}

function insightImpact(insight: Insight): CompetitiveAlertSeverity {
  return insight.severity === "high" ? "high" : insight.severity === "medium" ? "medium" : "low";
}

function recommendationImpact(recommendation: ActionRecommendation): CompetitiveAlertSeverity {
  if (recommendation.priorityHint === "P0" || recommendation.impactScore >= 85) {
    return "high";
  }
  if (recommendation.priorityHint === "P1" || recommendation.impactScore >= 65) {
    return "medium";
  }
  return "low";
}

export function buildPriceSignals(state: DashboardState, ownedAppId: string): PriceSignal[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  return scoped.snapshots
    .filter((snapshot) => Boolean(snapshot.priceText))
    .map((snapshot) => {
      const channel = channelFor(scoped, snapshot.channelId);
      const owner = ownerInfo(scoped, snapshot);
      const previous = previousSnapshot(scoped, snapshot);
      const previousPriceText = previous?.priceText;
      const priceText = snapshot.priceText ?? "";
      const changeType: PriceChangeType = !priceText ? "missing" : !previousPriceText ? "first_seen" : previousPriceText === priceText ? "unchanged" : "changed";
      return {
        id: stableId("price", [ownedAppId, owner.ownerType, owner.ownerId, snapshot.channelId, snapshot.capturedAt]),
        ownedAppId,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        channelName: channel?.channelName ?? "Manual",
        platform: platformForChannel(channel),
        priceText,
        numericPrices: priceNumbers(priceText),
        changeType,
        previousPriceText,
        evidenceIds: [snapshot.evidenceId],
        capturedAt: snapshot.capturedAt
      };
    })
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

function diffValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length === 0 ? "无" : value.join("；");
  }
  if (value === undefined || value === null || value === "") {
    return "无";
  }
  return String(value);
}

function snapshotFieldDiffs(scoped: ScopedDashboardState, snapshot: AppSnapshot, previous: AppSnapshot): EvidenceDiff[] {
  const channel = channelFor(scoped, snapshot.channelId);
  const owner = ownerInfo(scoped, snapshot);
  const fieldPairs: Array<{ field: EvidenceDiffField; beforeValue: unknown; afterValue: unknown }> = [
    { field: "version", beforeValue: previous.version, afterValue: snapshot.version },
    { field: "rating", beforeValue: previous.rating, afterValue: snapshot.rating },
    { field: "review_count", beforeValue: previous.reviewCount, afterValue: snapshot.reviewCount },
    { field: "price", beforeValue: previous.priceText, afterValue: snapshot.priceText },
    { field: "release_notes", beforeValue: previous.releaseNotes, afterValue: snapshot.releaseNotes },
    { field: "description", beforeValue: previous.description, afterValue: snapshot.description },
    { field: "screenshots", beforeValue: previous.screenshots, afterValue: snapshot.screenshots }
  ];

  return fieldPairs
    .map((item) => ({
      ...item,
      beforeValue: diffValue(item.beforeValue),
      afterValue: diffValue(item.afterValue)
    }))
    .filter((item) => item.beforeValue !== item.afterValue)
    .map((item) => ({
      id: stableId("diff", [snapshot.id, previous.id, item.field]),
      ownedAppId: snapshot.ownedAppId,
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      ownerName: owner.ownerName,
      competitorId: snapshot.competitorId,
      channelName: channel?.channelName ?? "Manual",
      platform: platformForChannel(channel),
      field: item.field,
      beforeValue: item.beforeValue,
      afterValue: item.afterValue,
      screenshotUrls: [...previous.screenshots, ...snapshot.screenshots],
      evidenceIds: [previous.evidenceId, snapshot.evidenceId],
      changedAt: snapshot.capturedAt
    }));
}

export function buildEvidenceDiffs(state: DashboardState, ownedAppId: string): EvidenceDiff[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }
  return scoped.snapshots
    .flatMap((snapshot) => {
      const previous = previousSnapshot(scoped, snapshot);
      return previous ? snapshotFieldDiffs(scoped, snapshot, previous) : [];
    })
    .sort((left, right) => right.changedAt.localeCompare(left.changedAt));
}

function reviewsForSnapshot(scoped: ScopedDashboardState, snapshot: AppSnapshot): Review[] {
  return scoped.reviews.filter((review) => review.channelId === snapshot.channelId && review.competitorId === snapshot.competitorId);
}

export function buildTrendTimeline(state: DashboardState, ownedAppId: string): CompetitiveTimelineEvent[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  const snapshotEvents = scoped.snapshots.flatMap((snapshot): CompetitiveTimelineEvent[] => {
    const channel = channelFor(scoped, snapshot.channelId);
    const owner = ownerInfo(scoped, snapshot);
    const evidenceIds = [snapshot.evidenceId];
    const events: CompetitiveTimelineEvent[] = [
      {
        id: stableId("event", [snapshot.id, "version"]),
        ownedAppId,
        eventType: "version",
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        channelName: channel?.channelName,
        platform: platformForChannel(channel),
        title: `${owner.ownerName} 版本快照 ${snapshot.version ?? "未知版本"}`,
        summary: snapshot.releaseNotes ?? snapshot.description ?? "记录版本、描述、截图和评分快照。",
        impact: eventImpact(snapshot),
        evidenceIds,
        occurredAt: snapshot.capturedAt
      }
    ];
    if (snapshot.priceText) {
      events.push({
        id: stableId("event", [snapshot.id, "price"]),
        ownedAppId,
        eventType: "price",
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        channelName: channel?.channelName,
        platform: platformForChannel(channel),
        title: `${owner.ownerName} 价格 / 会员信号`,
        summary: snapshot.priceText,
        impact: "medium",
        evidenceIds,
        occurredAt: snapshot.capturedAt
      });
    }
    if (snapshot.rating || snapshot.reviewCount) {
      const reviewCount = reviewsForSnapshot(scoped, snapshot).length;
      events.push({
        id: stableId("event", [snapshot.id, "rating"]),
        ownedAppId,
        eventType: reviewCount > 0 ? "review" : "rating",
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        channelName: channel?.channelName,
        platform: platformForChannel(channel),
        title: `${owner.ownerName} 评分 / 评论变化`,
        summary: `${snapshot.rating ?? "无评分"} 分 / ${snapshot.reviewCount ?? "无评论量"} 条评论；本地评论样本 ${reviewCount} 条。`,
        impact: eventImpact(snapshot),
        evidenceIds,
        occurredAt: snapshot.capturedAt
      });
    }
    return events;
  });

  const insightEvents = scoped.insights
    .filter((insight) => insight.status === "New" || insight.status === "Confirmed")
    .map((insight): CompetitiveTimelineEvent => ({
      id: stableId("event", [insight.id, "insight"]),
      ownedAppId,
      eventType: "insight",
      ownerType: "owned_app",
      ownerId: ownedAppId,
      ownerName: scoped.currentOwnedApp?.name ?? "当前 App",
      title: insight.title,
      summary: insight.summary,
      impact: insightImpact(insight),
      evidenceIds: insight.evidenceIds,
      occurredAt: insight.createdAt
    }));

  const recommendationEvents = scoped.actionRecommendations
    .filter((recommendation) => recommendation.status === "Open" || recommendation.status === "Planned")
    .map((recommendation): CompetitiveTimelineEvent => ({
      id: stableId("event", [recommendation.id, "recommendation"]),
      ownedAppId,
      eventType: "recommendation",
      ownerType: "owned_app",
      ownerId: ownedAppId,
      ownerName: scoped.currentOwnedApp?.name ?? "当前 App",
      title: recommendation.title,
      summary: `${recommendation.whyNow} ${recommendation.recommendation}`,
      impact: recommendationImpact(recommendation),
      evidenceIds: recommendation.evidenceIds,
      occurredAt: recommendation.updatedAt
    }));

  return [...snapshotEvents, ...insightEvents, ...recommendationEvents].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

export function buildCompetitiveAlerts(state: DashboardState, ownedAppId: string): CompetitiveAlert[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }
  const priceSignals = buildPriceSignals(state, ownedAppId);
  const channelAlerts: CompetitiveAlert[] = scoped.channels
    .filter((channel) => channel.crawlStatus === "Failed" || channel.crawlStatus === "Skipped")
    .map((channel) => ({
      id: stableId("alert", [ownedAppId, "channel", channel.id, channel.crawlStatus]),
      ownedAppId,
      alertType: "channel_failure",
      severity: channel.crawlStatus === "Failed" ? "high" : "medium",
      title: `${channel.channelName} 采集异常`,
      summary: channel.lastFailureReason ?? "渠道被跳过或暂不可采集。",
      ownerType: channel.ownerType,
      ownerId: channel.ownerId,
      ownerName: channel.ownerType === "owned_app" ? scoped.currentOwnedApp?.name : scoped.competitors.find((item) => item.id === channel.ownerId)?.name,
      competitorId: channel.ownerType === "competitor" ? channel.ownerId : undefined,
      evidenceIds: [],
      recommendationIds: [],
      createdAt: channel.updatedAt
    }));

  const priceAlerts: CompetitiveAlert[] = priceSignals
    .filter((signal) => signal.changeType === "changed" || signal.changeType === "first_seen")
    .map((signal) => ({
      id: stableId("alert", [ownedAppId, "price", signal.id]),
      ownedAppId,
      alertType: "price_change",
      severity: signal.changeType === "changed" ? "high" : "medium",
      title: `${signal.ownerName} ${signal.platform ?? "渠道"} 价格信号`,
      summary: signal.previousPriceText ? `${signal.previousPriceText} -> ${signal.priceText}` : signal.priceText,
      ownerType: signal.ownerType,
      ownerId: signal.ownerId,
      ownerName: signal.ownerName,
      competitorId: signal.competitorId,
      evidenceIds: signal.evidenceIds,
      recommendationIds: [],
      createdAt: signal.capturedAt
    }));

  const ratingAlerts: CompetitiveAlert[] = scoped.snapshots
    .filter((snapshot) => (snapshot.rating ?? 5) < 4.3)
    .map((snapshot) => {
      const owner = ownerInfo(scoped, snapshot);
      return {
        id: stableId("alert", [ownedAppId, "rating", snapshot.id]),
        ownedAppId,
        alertType: "rating_risk",
        severity: "high",
        title: `${owner.ownerName} 评分风险`,
        summary: `${snapshot.rating} 分，低于 4.3，需要查看评论原因。`,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        evidenceIds: [snapshot.evidenceId],
        recommendationIds: [],
        createdAt: snapshot.capturedAt
      };
    });

  const insightAlerts: CompetitiveAlert[] = scoped.insights
    .filter((insight) => insight.severity === "high" && (insight.status === "New" || insight.status === "Confirmed"))
    .map((insight) => ({
      id: stableId("alert", [ownedAppId, "insight", insight.id]),
      ownedAppId,
      alertType: "high_severity_insight",
      severity: "high",
      title: insight.title,
      summary: insight.summary,
      ownerType: "owned_app",
      ownerId: ownedAppId,
      ownerName: scoped.currentOwnedApp?.name,
      evidenceIds: insight.evidenceIds,
      recommendationIds: [],
      createdAt: insight.createdAt
    }));

  const recommendationAlerts: CompetitiveAlert[] = scoped.actionRecommendations
    .filter((recommendation) => (recommendation.priorityHint === "P0" || recommendation.impactScore >= 85) && recommendation.status !== "Dismissed")
    .map((recommendation) => ({
      id: stableId("alert", [ownedAppId, "recommendation", recommendation.id]),
      ownedAppId,
      alertType: "high_impact_recommendation",
      severity: "medium",
      title: recommendation.title,
      summary: recommendation.whyNow,
      ownerType: "owned_app",
      ownerId: ownedAppId,
      ownerName: scoped.currentOwnedApp?.name,
      evidenceIds: recommendation.evidenceIds,
      recommendationIds: [recommendation.id],
      createdAt: recommendation.updatedAt
    }));

  return [...channelAlerts, ...priceAlerts, ...ratingAlerts, ...insightAlerts, ...recommendationAlerts].sort((left, right) => {
    const severityScore: Record<CompetitiveAlertSeverity, number> = { high: 3, medium: 2, low: 1 };
    return severityScore[right.severity] - severityScore[left.severity] || right.createdAt.localeCompare(left.createdAt);
  });
}
