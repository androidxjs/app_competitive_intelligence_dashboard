import { createId, dateOnly, getScopedState, isoNow } from "@aci/domain";
import type {
  AppSnapshot,
  Channel,
  Competitor,
  CompetitorModuleAnalysis,
  DashboardState,
  Feature,
  Insight,
  ModuleAnalysisType,
  ReportPeriod,
  Review
} from "@aci/domain";

type StorePlatform = "ios" | "android";

const moduleTypes: ModuleAnalysisType[] = ["growth", "traffic", "social", "product_performance", "ai_insight"];

function platformForChannel(channel: Channel): StorePlatform | undefined {
  if (channel.channelName === "App Store China") {
    return "ios";
  }
  if (["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channel.channelName)) {
    return "android";
  }
  return undefined;
}

function channelsFor(channels: Channel[], competitor: Competitor, platform?: StorePlatform): Channel[] {
  return channels.filter(
    (channel) =>
      channel.ownerType === "competitor" &&
      channel.ownerId === competitor.id &&
      (!platform || platformForChannel(channel) === platform)
  );
}

function channelSummary(channels: Channel[], competitor: Competitor, platform: StorePlatform): string {
  const matches = channelsFor(channels, competitor, platform);
  if (matches.length === 0) {
    return "未配置";
  }
  return matches.map((channel) => `${channel.channelName}/${channel.crawlStatus}`).join("；");
}

function latestSnapshot(snapshots: AppSnapshot[], channels: Channel[], competitor: Competitor, platform: StorePlatform): AppSnapshot | undefined {
  const channelIds = new Set(channelsFor(channels, competitor, platform).map((channel) => channel.id));
  return snapshots
    .filter((snapshot) => snapshot.competitorId === competitor.id && channelIds.has(snapshot.channelId))
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
}

function snapshotSummary(snapshot: AppSnapshot | undefined): string {
  if (!snapshot) {
    return "暂无快照";
  }
  const rating = snapshot.rating ? `${snapshot.rating} 分` : "无评分";
  const reviewCount = snapshot.reviewCount ? `${snapshot.reviewCount} 条评论` : "无评论量";
  return `${snapshot.version ?? "未知版本"} / ${rating} / ${reviewCount}`;
}

function snapshotChange(snapshot: AppSnapshot | undefined): string {
  return snapshot?.releaseNotes ?? snapshot?.description ?? "暂无变化";
}

function insightsForCompetitor(competitor: Competitor, insights: Insight[], snapshots: AppSnapshot[], reviews: Review[]): Insight[] {
  const evidenceIds = new Set([
    ...snapshots.filter((snapshot) => snapshot.competitorId === competitor.id).map((snapshot) => snapshot.evidenceId),
    ...reviews.filter((review) => review.competitorId === competitor.id).map((review) => review.evidenceId)
  ]);
  return insights.filter((insight) => insight.evidenceIds.some((id) => evidenceIds.has(id)));
}

function featureGap(competitor: Competitor, features: Feature[]): string {
  const feature = features.find((item) => {
    const support = item.competitorSupport[competitor.id];
    return (support === "owned" || support === "advantage") && (item.currentAppSupport === "missing" || item.currentAppSupport === "partial");
  });
  return feature?.name ?? "暂无明显差距";
}

function featureAdvantage(competitor: Competitor, features: Feature[]): string {
  const feature = features.find((item) => item.currentAppSupport === "advantage" && item.competitorSupport[competitor.id] !== "advantage");
  return feature?.name ?? "待继续验证";
}

function buildAnalysisFields(
  moduleType: ModuleAnalysisType,
  competitor: Competitor,
  insights: Insight[],
  snapshots: AppSnapshot[],
  reviews: Review[],
  channels: Channel[],
  features: Feature[]
): Omit<CompetitorModuleAnalysis, "id" | "ownedAppId" | "competitorId" | "period" | "moduleType" | "updatedAt"> {
  const competitorInsights = insightsForCompetitor(competitor, insights, snapshots, reviews);
  const competitorSnapshots = snapshots.filter((snapshot) => snapshot.competitorId === competitor.id);
  const competitorReviews = reviews.filter((review) => review.competitorId === competitor.id);
  const evidenceIds = Array.from(new Set([...competitorSnapshots.map((snapshot) => snapshot.evidenceId), ...competitorReviews.map((review) => review.evidenceId)]));
  const iosSnapshot = latestSnapshot(snapshots, channels, competitor, "ios");
  const androidSnapshot = latestSnapshot(snapshots, channels, competitor, "android");
  const competitorReviewSignals = competitorReviews.map((review) => review.content).slice(0, 3);
  const competitorChangeSignals = [snapshotChange(iosSnapshot), snapshotChange(androidSnapshot)].filter((item) => item !== "暂无变化");
  const competitorSignalSummary = [...competitorChangeSignals, ...competitorReviewSignals].slice(0, 3).join(" / ");

  if (moduleType === "growth") {
    return {
      summary: competitorSignalSummary || "待补增长证据，先关注版本更新、会员入口和需求候选变化。",
      signals: [...competitorInsights.map((insight) => insight.category), ...competitorReviews.map((review) => review.topicHint ?? "评论样本")].slice(0, 3),
      risks: ["缺少下载量、收入或投放数据时，不估算增长规模。"],
      opportunities: [featureGap(competitor, features)],
      recommendation: "将增长结论限定为功能、会员和渠道信号，补齐快照后再判断趋势。",
      evidenceIds,
      confidence: competitorInsights.length > 0 ? 0.56 : 0.3,
      dataCoverage: ["Insight", "Snapshot"]
    };
  }

  if (moduleType === "traffic") {
    return {
      summary: `iOS：${channelSummary(channels, competitor, "ios")}；Android：${channelSummary(channels, competitor, "android")}。`,
      signals: channelsFor(channels, competitor).map((channel) => `${channel.channelName}/${channel.crawlStatus}`),
      risks: ["渠道缺失会导致流量判断偏差。"],
      opportunities: ["补齐 App Store、官网和国内安卓渠道后再判断渠道趋势。"],
      recommendation: "先把流量分析限定为渠道覆盖、渠道状态和渠道素材变化。",
      evidenceIds,
      confidence: channelsFor(channels, competitor).length > 0 ? 0.44 : 0.25,
      dataCoverage: ["Channel"]
    };
  }

  if (moduleType === "social") {
    return {
      summary: "社媒监控尚未接入自动数据，应以手动样本记录话题、素材和互动表现。",
      signals: competitorReviewSignals,
      risks: ["没有小红书、抖音、微博样本前，不能判断声量强弱。"],
      opportunities: ["把商店更新、评论热点与社媒话题做交叉验证。"],
      recommendation: "建立社媒手动采样字段：平台、话题、素材、互动量、对应功能和证据链接。",
      evidenceIds,
      confidence: 0.34,
      dataCoverage: ["Manual"]
    };
  }

  if (moduleType === "product_performance") {
    return {
      summary: `iOS：${snapshotSummary(iosSnapshot)}；Android：${snapshotSummary(androidSnapshot)}。`,
      signals: competitorChangeSignals.length > 0 ? competitorChangeSignals : competitorReviewSignals,
      risks: ["单平台快照不能代表整体产品表现。"],
      opportunities: [featureAdvantage(competitor, features), featureGap(competitor, features)],
      recommendation: "按 iOS/Android 分开看版本、评分、评论量、价格和核心体验。",
      evidenceIds,
      confidence: competitorSnapshots.length > 0 ? 0.58 : 0.28,
      dataCoverage: ["Snapshot", "Review"]
    };
  }

  const aiReviewSignals = competitorReviews.filter((review) => /AI|智能|生成|模板|写真|发型|证件照/.test(review.content)).map((review) => review.content);
  const aiInsights = competitorInsights.filter((insight) => /AI|智能|生成|模板/.test(`${insight.category} ${insight.title} ${insight.summary}`));
  return {
    summary: aiReviewSignals.slice(0, 2).join(" / ") || competitorChangeSignals.find((signal) => /AI|智能|生成|模板/.test(signal)) || "AI 相关信号不足，先作为待补证据观察项。",
    signals: [...aiInsights.map((insight) => insight.category), ...aiReviewSignals].slice(0, 3),
    risks: ["AI 推测不能替代功能实测，需要截图、更新日志或评论证据。"],
    opportunities: ["拆解 AI 入口、生成前后对比、付费限制和失败反馈。"],
    recommendation: "只把有 Evidence 的 AI 信号转入需求池；缺证据项继续采样。",
    evidenceIds,
    confidence: aiInsights.length > 0 ? 0.62 : 0.28,
    dataCoverage: ["Insight", "Review"]
  };
}

export function buildModuleAnalyses(state: DashboardState, ownedAppId: string): CompetitorModuleAnalysis[] {
  const scoped = getScopedState(state, ownedAppId);
  const now = isoNow();
  const period: ReportPeriod = {
    start: dateOnly(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    end: dateOnly()
  };

  return scoped.competitors.flatMap((competitor) =>
    moduleTypes.map((moduleType) => ({
      id: createId("mod"),
      ownedAppId,
      competitorId: competitor.id,
      period,
      moduleType,
      ...buildAnalysisFields(moduleType, competitor, scoped.insights, scoped.snapshots, scoped.reviews, scoped.channels, scoped.features),
      updatedAt: now
    }))
  );
}
