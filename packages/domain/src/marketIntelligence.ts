import { getScopedState } from "./state";
import type {
  AppSnapshot,
  AsoKeywordOpportunity,
  Channel,
  ChannelName,
  CompetitiveAlertSeverity,
  DashboardState,
  Feature,
  KeywordOpportunitySource,
  LaunchSignal,
  LaunchSignalType,
  OwnerType,
  Platform,
  RatingSentimentSignal,
  Review,
  ScopedDashboardState,
  StoreMetadataField,
  StoreMetadataSignal
} from "./types";

type StorePlatform = Exclude<Platform, "web">;

const keywordSeeds = [
  "AI",
  "模板",
  "写真",
  "发型",
  "证件照",
  "会员",
  "VIP",
  "SVIP",
  "高清",
  "导出",
  "美颜",
  "滤镜",
  "修图",
  "自然",
  "高级感",
  "贴纸",
  "AR",
  "拍照",
  "一键出片",
  "试用",
  "折扣"
];

function stableId(prefix: string, parts: Array<string | number | undefined>): string {
  const source = parts.filter((part) => part !== undefined && part !== "").join(":");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = Math.imul(hash, 31) + source.charCodeAt(index);
    hash >>>= 0;
  }
  return `${prefix}_${hash.toString(36)}`;
}

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

function channelFor(scoped: ScopedDashboardState, channelId: string): Channel | undefined {
  return scoped.channels.find((channel) => channel.id === channelId);
}

function ownerForSnapshot(scoped: ScopedDashboardState, snapshot: AppSnapshot): { ownerType: OwnerType; ownerId: string; ownerName: string } {
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

function snapshotsByOwnerChannel(scoped: ScopedDashboardState): Map<string, AppSnapshot[]> {
  const groups = new Map<string, AppSnapshot[]>();
  scoped.snapshots.forEach((snapshot) => {
    const owner = ownerForSnapshot(scoped, snapshot);
    const key = `${owner.ownerType}:${owner.ownerId}:${snapshot.channelId}`;
    groups.set(key, [...(groups.get(key) ?? []), snapshot]);
  });
  groups.forEach((items, key) => {
    groups.set(key, [...items].sort((left, right) => right.capturedAt.localeCompare(left.capturedAt)));
  });
  return groups;
}

function previousSnapshot(scoped: ScopedDashboardState, snapshot: AppSnapshot): AppSnapshot | undefined {
  const owner = ownerForSnapshot(scoped, snapshot);
  const group = snapshotsByOwnerChannel(scoped).get(`${owner.ownerType}:${owner.ownerId}:${snapshot.channelId}`) ?? [];
  const index = group.findIndex((item) => item.id === snapshot.id);
  return index >= 0 ? group[index + 1] : undefined;
}

function valueText(value: unknown): string {
  if (Array.isArray(value)) {
    return value.length === 0 ? "无" : value.join("；");
  }
  if (value === undefined || value === null || value === "") {
    return "无";
  }
  return String(value);
}

function includesKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

function extractKeywordHints(...texts: string[]): string[] {
  const source = texts.join(" ");
  return keywordSeeds.filter((keyword) => includesKeyword(source, keyword)).slice(0, 8);
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function ownerReviews(scoped: ScopedDashboardState, snapshot: AppSnapshot): Review[] {
  return scoped.reviews.filter((review) => review.channelId === snapshot.channelId && review.competitorId === snapshot.competitorId);
}

function topThemes(reviews: Review[]): string[] {
  const counts = new Map<string, number>();
  reviews.forEach((review) => {
    const theme = review.topicHint ?? (review.content.includes("会员") ? "会员反馈" : review.content.includes("AI") ? "AI 体验" : "评论样本");
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([theme]) => theme);
}

function averageRating(reviews: Review[]): number | undefined {
  if (reviews.length === 0) {
    return undefined;
  }
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

function sentimentRisk(snapshot: AppSnapshot, reviews: Review[]): CompetitiveAlertSeverity {
  const negativeCount = reviews.filter((review) => review.rating <= 2).length;
  const negativeRatio = reviews.length > 0 ? negativeCount / reviews.length : 0;
  if ((snapshot.rating ?? 5) < 4.3 || negativeRatio >= 0.4) {
    return "high";
  }
  if ((snapshot.rating ?? 5) < 4.6 || negativeRatio >= 0.25) {
    return "medium";
  }
  return "low";
}

function featureKeywords(features: Feature[]): string[] {
  const tokens = features.flatMap((feature) =>
    feature.name
      .split(/[\/,，、\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length >= 2)
  );
  return unique([...keywordSeeds, ...features.map((feature) => feature.name), ...tokens]).slice(0, 80);
}

interface KeywordDoc {
  ownerType: OwnerType;
  ownerId: string;
  ownerName: string;
  competitorId?: string;
  channelName: ChannelName;
  text: string;
  evidenceIds: string[];
  source: KeywordOpportunitySource;
}

function keywordDocs(scoped: ScopedDashboardState): KeywordDoc[] {
  const snapshotDocs = scoped.snapshots.flatMap((snapshot): KeywordDoc[] => {
    const owner = ownerForSnapshot(scoped, snapshot);
    const channel = channelFor(scoped, snapshot.channelId);
    const channelName = channel?.channelName ?? "Manual";
    const docs: KeywordDoc[] = [];
    if (snapshot.description) {
      docs.push({
        ...owner,
        competitorId: snapshot.competitorId,
        channelName,
        text: snapshot.description,
        evidenceIds: [snapshot.evidenceId],
        source: "description"
      });
    }
    if (snapshot.releaseNotes) {
      docs.push({
        ...owner,
        competitorId: snapshot.competitorId,
        channelName,
        text: snapshot.releaseNotes,
        evidenceIds: [snapshot.evidenceId],
        source: "release_notes"
      });
    }
    if (snapshot.priceText) {
      docs.push({
        ...owner,
        competitorId: snapshot.competitorId,
        channelName,
        text: snapshot.priceText,
        evidenceIds: [snapshot.evidenceId],
        source: "evidence"
      });
    }
    return docs;
  });

  const reviewDocs = scoped.reviews.map((review): KeywordDoc => {
    const competitor = review.competitorId ? scoped.competitors.find((item) => item.id === review.competitorId) : undefined;
    const channel = channelFor(scoped, review.channelId);
    return {
      ownerType: review.competitorId ? "competitor" : "owned_app",
      ownerId: review.competitorId ?? review.ownedAppId,
      ownerName: competitor?.name ?? scoped.currentOwnedApp?.name ?? "自有 App",
      competitorId: review.competitorId,
      channelName: channel?.channelName ?? "Manual",
      text: `${review.topicHint ?? ""} ${review.content}`,
      evidenceIds: [review.evidenceId],
      source: "review"
    };
  });

  const socialDocs = scoped.socialSamples.map((sample): KeywordDoc => {
    const competitor = sample.competitorId ? scoped.competitors.find((item) => item.id === sample.competitorId) : undefined;
    return {
      ownerType: sample.competitorId ? "competitor" : "owned_app",
      ownerId: sample.competitorId ?? sample.ownedAppId,
      ownerName: competitor?.name ?? scoped.currentOwnedApp?.name ?? "自有 App",
      competitorId: sample.competitorId,
      channelName: sample.platform === "xiaohongshu" ? "Xiaohongshu" : sample.platform === "douyin" ? "Douyin" : "Weibo",
      text: `${sample.topic} ${sample.summary} ${sample.fetchedTitle ?? ""} ${sample.fetchedExcerpt ?? ""} ${sample.tags.join(" ")}`,
      evidenceIds: sample.evidenceId ? [sample.evidenceId] : [],
      source: "evidence"
    };
  });

  return [...snapshotDocs, ...reviewDocs, ...socialDocs];
}

function featureCoversOwned(feature: Feature): boolean {
  return feature.currentAppSupport === "owned" || feature.currentAppSupport === "advantage" || feature.currentAppSupport === "partial";
}

function featureCoversCompetitor(feature: Feature, competitorId: string): boolean {
  const support = feature.competitorSupport[competitorId];
  return support === "owned" || support === "advantage" || support === "partial";
}

function sourceRank(source: KeywordOpportunitySource): number {
  const rank: Record<KeywordOpportunitySource, number> = {
    feature: 5,
    review: 4,
    release_notes: 3,
    description: 2,
    evidence: 1
  };
  return rank[source];
}

function inferKeywordSource(keyword: string, docs: KeywordDoc[], features: Feature[]): KeywordOpportunitySource {
  if (features.some((feature) => includesKeyword(feature.name, keyword))) {
    return "feature";
  }
  const sources = docs.filter((doc) => includesKeyword(doc.text, keyword)).map((doc) => doc.source);
  return sources.sort((left, right) => sourceRank(right) - sourceRank(left))[0] ?? "evidence";
}

export function buildStoreMetadataSignals(state: DashboardState, ownedAppId: string): StoreMetadataSignal[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  return scoped.snapshots
    .flatMap((snapshot): StoreMetadataSignal[] => {
      const previous = previousSnapshot(scoped, snapshot);
      const channel = channelFor(scoped, snapshot.channelId);
      const owner = ownerForSnapshot(scoped, snapshot);
      const pairs: Array<{ field: StoreMetadataField; beforeValue?: string; afterValue: string; screenshots?: string[] }> = [
        { field: "version", beforeValue: previous ? valueText(previous.version) : undefined, afterValue: valueText(snapshot.version) },
        { field: "description", beforeValue: previous ? valueText(previous.description) : undefined, afterValue: valueText(snapshot.description) },
        { field: "release_notes", beforeValue: previous ? valueText(previous.releaseNotes) : undefined, afterValue: valueText(snapshot.releaseNotes) },
        { field: "screenshots", beforeValue: previous ? valueText(previous.screenshots) : undefined, afterValue: valueText(snapshot.screenshots), screenshots: snapshot.screenshots },
        { field: "price", beforeValue: previous ? valueText(previous.priceText) : undefined, afterValue: valueText(snapshot.priceText) },
        { field: "rating", beforeValue: previous ? valueText(previous.rating) : undefined, afterValue: valueText(snapshot.rating) }
      ];

      return pairs
        .filter((pair) => pair.afterValue !== "无")
        .filter((pair) => !previous || pair.beforeValue !== pair.afterValue)
        .map((pair) => ({
          id: stableId("metadata", [snapshot.id, pair.field, pair.afterValue]),
          ownedAppId,
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          ownerName: owner.ownerName,
          competitorId: snapshot.competitorId,
          channelName: channel?.channelName ?? "Manual",
          platform: platformForChannel(channel),
          field: pair.field,
          beforeValue: pair.beforeValue,
          afterValue: pair.afterValue,
          keywordHints: extractKeywordHints(pair.afterValue),
          screenshotUrls: pair.screenshots ?? snapshot.screenshots,
          evidenceIds: [snapshot.evidenceId],
          capturedAt: snapshot.capturedAt
        }));
    })
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

export function buildRatingSentimentSignals(state: DashboardState, ownedAppId: string): RatingSentimentSignal[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  const latestSnapshots = Array.from(snapshotsByOwnerChannel(scoped).values()).flatMap((items) => items.slice(0, 1));
  return latestSnapshots
    .map((snapshot) => {
      const channel = channelFor(scoped, snapshot.channelId);
      const owner = ownerForSnapshot(scoped, snapshot);
      const reviews = ownerReviews(scoped, snapshot);
      const positiveReviewCount = reviews.filter((review) => review.rating >= 4).length;
      const negativeReviewCount = reviews.filter((review) => review.rating <= 2).length;
      const averageReviewRating = averageRating(reviews);
      const riskLevel = sentimentRisk(snapshot, reviews);
      const evidenceIds = unique([snapshot.evidenceId, ...reviews.slice(0, 6).map((review) => review.evidenceId)]);
      return {
        id: stableId("sentiment", [ownedAppId, owner.ownerType, owner.ownerId, snapshot.channelId]),
        ownedAppId,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        channelName: channel?.channelName ?? "Manual",
        platform: platformForChannel(channel),
        rating: snapshot.rating,
        reviewCount: snapshot.reviewCount,
        sampleSize: reviews.length,
        averageReviewRating,
        positiveReviewCount,
        negativeReviewCount,
        riskLevel,
        topThemes: topThemes(reviews),
        summary: `${snapshot.rating ?? "无评分"} 分 / ${snapshot.reviewCount ?? "无评论量"} 条评论；样本均分 ${
          averageReviewRating ?? "无"
        }，负向样本 ${negativeReviewCount} 条。`,
        evidenceIds,
        capturedAt: snapshot.capturedAt
      };
    })
    .sort((left, right) => {
      const riskOrder: Record<CompetitiveAlertSeverity, number> = { high: 3, medium: 2, low: 1 };
      return riskOrder[right.riskLevel] - riskOrder[left.riskLevel] || right.capturedAt.localeCompare(left.capturedAt);
    });
}

export function buildAsoKeywordOpportunities(state: DashboardState, ownedAppId: string): AsoKeywordOpportunity[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }
  const currentOwnedApp = scoped.currentOwnedApp;
  const docs = keywordDocs(scoped);
  const keywords = featureKeywords(scoped.features);

  return keywords
    .map((keyword): AsoKeywordOpportunity | undefined => {
      const featureMatches = scoped.features.filter((feature) => includesKeyword(feature.name, keyword));
      const docsWithKeyword = docs.filter((doc) => includesKeyword(doc.text, keyword));
      const ownedCoverage =
        docsWithKeyword.some((doc) => doc.ownerType === "owned_app") || featureMatches.some((feature) => featureCoversOwned(feature));
      const competitorCoverage = scoped.competitors
        .map((competitor) => {
          const competitorDocs = docsWithKeyword.filter((doc) => doc.competitorId === competitor.id);
          const featureEvidence = featureMatches.some((feature) => featureCoversCompetitor(feature, competitor.id));
          const evidenceIds = unique(competitorDocs.flatMap((doc) => doc.evidenceIds));
          if (competitorDocs.length === 0 && !featureEvidence) {
            return undefined;
          }
          return {
            competitorId: competitor.id,
            competitorName: competitor.name,
            channels: unique(competitorDocs.map((doc) => doc.channelName).concat(featureEvidence ? ["Manual" as ChannelName] : [])),
            evidenceIds
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      const mentionCount = docsWithKeyword.length + featureMatches.length;
      if (mentionCount === 0 && competitorCoverage.length === 0) {
        return undefined;
      }
      const opportunityScore = Math.min(100, competitorCoverage.length * 22 + mentionCount * 4 + (ownedCoverage ? 0 : 24));
      const evidenceIds = unique(docsWithKeyword.flatMap((doc) => doc.evidenceIds));
      return {
        id: stableId("keyword", [ownedAppId, keyword]),
        ownedAppId,
        keyword,
        source: inferKeywordSource(keyword, docsWithKeyword, scoped.features),
        ownedCoverage,
        competitorCoverage,
        mentionCount,
        opportunityScore,
        recommendation: ownedCoverage
          ? "当前 App 已覆盖该关键词，建议强化商店页表达、截图文案和评论证据。"
          : "竞品已覆盖但当前 App 表达不足，建议评估是否补齐能力或加入商店页卖点。",
        evidenceIds,
        updatedAt: currentOwnedApp.updatedAt
      };
    })
    .filter((item): item is AsoKeywordOpportunity => Boolean(item))
    .sort((left, right) => right.opportunityScore - left.opportunityScore || right.mentionCount - left.mentionCount);
}

function classifyLaunchSignal(text: string, channelName?: ChannelName): LaunchSignalType {
  if (channelName === "Website") {
    return "website";
  }
  if (/[¥￥]|会员|VIP|SVIP|价格|订阅|试用|折扣|连续包月|AI 点数/.test(text)) {
    return "pricing";
  }
  if (/活动|节日|同款|模板|贴纸|玩法|挑战|限时/.test(text)) {
    return "campaign";
  }
  if (/定位|品牌|高级感|自然|一键出片|专业|协作|工作流/.test(text)) {
    return "positioning";
  }
  if (/崩溃|失败|卡顿|差评|退款|太贵|扣费|负向/.test(text)) {
    return "quality";
  }
  return "new_feature";
}

function launchImpact(type: LaunchSignalType, text: string): CompetitiveAlertSeverity {
  if (type === "quality" || (type === "new_feature" && /AI|写真|证件照|会员/.test(text))) {
    return "high";
  }
  if (type === "pricing" || type === "campaign" || type === "positioning") {
    return "medium";
  }
  return "low";
}

export function buildLaunchSignals(state: DashboardState, ownedAppId: string): LaunchSignal[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  const snapshotSignals = scoped.snapshots
    .filter((snapshot) => Boolean(snapshot.releaseNotes || snapshot.description || snapshot.priceText))
    .map((snapshot): LaunchSignal => {
      const channel = channelFor(scoped, snapshot.channelId);
      const owner = ownerForSnapshot(scoped, snapshot);
      const text = [snapshot.releaseNotes, snapshot.description, snapshot.priceText].filter(Boolean).join(" ");
      const signalType = classifyLaunchSignal(text, channel?.channelName);
      return {
        id: stableId("launch", [snapshot.id, signalType]),
        ownedAppId,
        signalType,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        ownerName: owner.ownerName,
        competitorId: snapshot.competitorId,
        title: `${owner.ownerName} ${snapshot.version ? `v${snapshot.version} ` : ""}${signalType === "website" ? "官网信号" : "发布信号"}`,
        summary: text,
        impact: launchImpact(signalType, text),
        confidence: snapshot.releaseNotes ? 0.72 : 0.58,
        sourceChannels: [channel?.channelName ?? "Manual"],
        evidenceIds: [snapshot.evidenceId],
        occurredAt: snapshot.capturedAt
      };
    });

  const insightSignals = scoped.insights
    .filter((insight) => insight.severity === "high" || /AI|会员|价格|模板|质量|差评/.test(`${insight.title} ${insight.summary}`))
    .map((insight): LaunchSignal => {
      const text = `${insight.title} ${insight.summary} ${insight.recommendation}`;
      const signalType = classifyLaunchSignal(text);
      return {
        id: stableId("launch", [insight.id, signalType]),
        ownedAppId,
        signalType,
        ownerType: "owned_app",
        ownerId: ownedAppId,
        ownerName: scoped.currentOwnedApp?.name ?? "当前 App",
        title: insight.title,
        summary: insight.summary,
        impact: insight.severity,
        confidence: insight.confidence,
        sourceChannels: insight.sourceChannels,
        evidenceIds: insight.evidenceIds,
        occurredAt: insight.updatedAt
      };
    });

  const websiteSignals = scoped.evidence
    .filter((evidence) => evidence.sourceType === "website" || evidence.sourceType === "release")
    .map((evidence): LaunchSignal => {
      const competitor = scoped.competitors.find((item) => evidence.rawExcerpt.includes(item.name));
      const signalType = classifyLaunchSignal(evidence.rawExcerpt, evidence.channelName);
      return {
        id: stableId("launch", [evidence.id, signalType]),
        ownedAppId,
        signalType,
        ownerType: competitor ? "competitor" : "owned_app",
        ownerId: competitor?.id ?? ownedAppId,
        ownerName: competitor?.name ?? scoped.currentOwnedApp?.name ?? "当前 App",
        competitorId: competitor?.id,
        title: `${competitor?.name ?? scoped.currentOwnedApp?.name ?? "当前 App"} ${evidence.channelName} 信号`,
        summary: evidence.rawExcerpt,
        impact: launchImpact(signalType, evidence.rawExcerpt),
        confidence: 0.66,
        sourceChannels: [evidence.channelName],
        evidenceIds: [evidence.id],
        occurredAt: evidence.capturedAt
      };
    });

  const socialSignals = scoped.socialSamples
    .filter((sample) => sample.evidenceId)
    .map((sample): LaunchSignal => {
      const competitor = sample.competitorId ? scoped.competitors.find((item) => item.id === sample.competitorId) : undefined;
      const summary = [sample.summary, sample.engagementText, sample.fetchedExcerpt].filter(Boolean).join(" / ");
      const signalType: LaunchSignalType =
        sample.signalType === "pricing"
          ? "pricing"
          : sample.signalType === "campaign" || sample.signalType === "template_trend"
            ? "campaign"
            : sample.signalType === "brand_positioning"
              ? "positioning"
              : sample.signalType === "user_feedback"
                ? "quality"
                : "new_feature";
      return {
        id: stableId("launch", [sample.id, signalType]),
        ownedAppId,
        signalType,
        ownerType: sample.competitorId ? "competitor" : "owned_app",
        ownerId: sample.competitorId ?? ownedAppId,
        ownerName: competitor?.name ?? scoped.currentOwnedApp?.name ?? "当前 App",
        competitorId: sample.competitorId,
        title: `${competitor?.name ?? scoped.currentOwnedApp?.name ?? "当前 App"} 社媒话题：${sample.topic}`,
        summary,
        impact: sample.impact,
        confidence: sample.fetchStatus === "Fetched" ? 0.72 : 0.58,
        sourceChannels: [sample.platform === "xiaohongshu" ? "Xiaohongshu" : sample.platform === "douyin" ? "Douyin" : "Weibo"],
        evidenceIds: sample.evidenceId ? [sample.evidenceId] : [],
        occurredAt: sample.publishedAt ?? sample.updatedAt
      };
    });

  return [...snapshotSignals, ...insightSignals, ...websiteSignals, ...socialSignals].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}
