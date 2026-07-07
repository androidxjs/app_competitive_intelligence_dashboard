import {
  buildActionRecommendations,
  buildAsoKeywordOpportunities,
  buildCompetitiveAlerts,
  buildEvidenceDiffs,
  buildFeatureGapDetails,
  buildLaunchSignals,
  buildPriceSignals,
  buildRatingSentimentSignals,
  buildStoreMetadataSignals,
  buildTrendTimeline,
  createId,
  getScopedState,
  isoNow
} from "@aci/domain";
import type {
  ActionRecommendation,
  AppSnapshot,
  AsoKeywordOpportunity,
  Channel,
  Competitor,
  CompetitorModuleAnalysis,
  CompetitiveAlert,
  CompetitiveTimelineEvent,
  DashboardState,
  Evidence,
  EvidenceDiff,
  Feature,
  FeatureGapDetail,
  Insight,
  LaunchSignal,
  ModuleAnalysisType,
  PriceSignal,
  RatingSentimentSignal,
  Report,
  ReportPeriod,
  Review,
  SocialPlatform,
  SocialSample,
  SocialSignalType,
  StoreMetadataSignal
} from "@aci/domain";

type StorePlatform = "ios" | "android";
const moduleAnalysisTypes: ModuleAnalysisType[] = ["growth", "traffic", "social", "product_performance", "ai_insight"];
const moduleAnalysisLabels: Record<ModuleAnalysisType, string> = {
  growth: "增长",
  traffic: "流量",
  social: "社媒",
  product_performance: "产品表现",
  ai_insight: "AI 洞察"
};

interface ModuleAnalysisOutput {
  summary: string;
  signals: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  evidenceIds: string[];
  confidence: number;
  dataCoverage: string[];
}

function formatEvidence(ids: string[]): string {
  return ids.length === 0 ? "无" : ids.map((id) => `\`${id}\``).join(", ");
}

function normalizeFeatures(features: Feature[]): Feature[] {
  const byName = new Map<string, Feature>();
  features.forEach((feature) => {
    const existing = byName.get(feature.name);
    if (!existing) {
      byName.set(feature.name, feature);
      return;
    }
    const manualExisting = existing.source === "user_confirmed" || existing.source === "user_edited";
    const manualIncoming = feature.source === "user_confirmed" || feature.source === "user_edited";
    byName.set(feature.name, {
      ...(manualExisting && !manualIncoming ? existing : feature),
      competitorSupport: { ...existing.competitorSupport, ...feature.competitorSupport },
      demandScore: Math.max(existing.demandScore, feature.demandScore),
      updatedAt: existing.updatedAt > feature.updatedAt ? existing.updatedAt : feature.updatedAt
    });
  });
  return Array.from(byName.values()).sort((left, right) => right.demandScore - left.demandScore);
}

function platformForChannel(channel: Channel): StorePlatform | undefined {
  if (channel.channelName === "App Store China") {
    return "ios";
  }
  if (["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channel.channelName)) {
    return "android";
  }
  return undefined;
}

function crawlStatusLabel(status: Channel["crawlStatus"]): string {
  const map: Record<Channel["crawlStatus"], string> = {
    Ready: "待采集",
    ManualOnly: "手动样本",
    Skipped: "已跳过",
    Failed: "失败",
    Succeeded: "成功"
  };
  return map[status];
}

function channelsForPlatform(channels: Channel[], competitorId: string | undefined, platform: StorePlatform): Channel[] {
  return channels.filter((channel) => {
    const ownerMatches = competitorId ? channel.ownerType === "competitor" && channel.ownerId === competitorId : channel.ownerType === "owned_app";
    return ownerMatches && platformForChannel(channel) === platform;
  });
}

function platformChannelSummary(channels: Channel[], competitorId: string | undefined, platform: StorePlatform): string {
  const platformChannels = channelsForPlatform(channels, competitorId, platform);
  if (platformChannels.length === 0) {
    return "未配置";
  }
  return platformChannels.map((channel) => `${channel.channelName}/${crawlStatusLabel(channel.crawlStatus)}`).join("；");
}

function latestSnapshotForPlatform(
  snapshots: AppSnapshot[],
  channels: Channel[],
  competitorId: string | undefined,
  platform: StorePlatform
): AppSnapshot | undefined {
  const channelIds = new Set(channelsForPlatform(channels, competitorId, platform).map((channel) => channel.id));
  return snapshots
    .filter((snapshot) => channelIds.has(snapshot.channelId))
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
}

function snapshotVersionRating(snapshot: AppSnapshot | undefined): string {
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

function featureDecision(feature: Feature): "明显差距" | "待补强" | "当前优势" | "继续观察" {
  const competitorOwnedCount = Object.values(feature.competitorSupport).filter((value) => value === "owned" || value === "advantage").length;
  if (feature.currentAppSupport === "missing" && competitorOwnedCount > 0) {
    return "明显差距";
  }
  if (feature.currentAppSupport === "partial" && competitorOwnedCount >= 2) {
    return "待补强";
  }
  if (feature.currentAppSupport === "advantage") {
    return "当前优势";
  }
  return "继续观察";
}

function featureAction(feature: Feature): string {
  const decision = featureDecision(feature);
  if (decision === "明显差距") {
    return feature.demandScore >= 80 ? "进入候选需求，优先做方案和成本评估" : "继续补证据，确认是否进入排期";
  }
  if (decision === "待补强") {
    return "拆解竞品入口、表达和用户反馈，做小范围优化实验";
  }
  if (decision === "当前优势") {
    return "强化为商店页、周报和版本卖点";
  }
  return "持续监控评论与版本变化";
}

function membershipPriceForName(name: string, priceText?: string, platform?: StorePlatform): string {
  if (priceText && /[¥￥]\s?\d|\d+\s*元/.test(priceText)) {
    return priceText;
  }
  if (platform === "android") {
    if (name.includes("B612")) {
      return "Android 样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥118";
    }
    if (name.includes("美图")) {
      return "Android 样本价：月卡 ¥25，连续包月 ¥18/月，年卡 ¥198";
    }
    if (name.includes("醒图")) {
      return "Android 样本价：月卡 ¥18，连续包月 ¥15/月，年卡 ¥128";
    }
    if (name.includes("轻颜")) {
      return "Android 样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥128";
    }
    return "待采集具体价格";
  }
  if (name.includes("B612")) {
    return platform === "ios" ? "iOS 样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥118" : "样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥118";
  }
  if (name.includes("美图")) {
    return platform === "ios" ? "iOS 样本价：月卡 ¥25，季卡 ¥68，年卡 ¥198" : "样本价：月卡 ¥25，季卡 ¥68，年卡 ¥198";
  }
  if (name.includes("醒图")) {
    return platform === "ios" ? "iOS 样本价：月卡 ¥18，连续包月 ¥15/月，年卡 ¥128" : "样本价：月卡 ¥18，连续包月 ¥15/月，年卡 ¥128";
  }
  if (name.includes("轻颜")) {
    return platform === "ios" ? "iOS 样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥128" : "样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥128";
  }
  return priceText ?? "待采集具体价格";
}

function relatedInsightsForCompetitor(competitor: Competitor, insights: Insight[], evidence: Evidence[], snapshots: AppSnapshot[]): Insight[] {
  const competitorEvidenceIds = new Set(
    snapshots
      .filter((snapshot) => snapshot.competitorId === competitor.id)
      .map((snapshot) => snapshot.evidenceId)
  );
  evidence.forEach((item) => {
    if (item.rawExcerpt.includes(competitor.name)) {
      competitorEvidenceIds.add(item.id);
    }
  });
  return insights.filter((insight) => insight.evidenceIds.some((id) => competitorEvidenceIds.has(id)));
}

function latestModuleAnalysis(
  analyses: CompetitorModuleAnalysis[],
  competitor: Competitor,
  moduleType: ModuleAnalysisType
): CompetitorModuleAnalysis | undefined {
  return analyses
    .filter((analysis) => analysis.competitorId === competitor.id && analysis.moduleType === moduleType)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

function fallbackModuleAnalysis(
  competitor: Competitor,
  moduleType: ModuleAnalysisType,
  insights: Insight[],
  evidence: Evidence[],
  snapshots: AppSnapshot[],
  reviews: Review[],
  channels: Channel[],
  features: Feature[]
): ModuleAnalysisOutput {
  const relatedInsights = relatedInsightsForCompetitor(competitor, insights, evidence, snapshots);
  const competitorSnapshots = snapshots.filter((snapshot) => snapshot.competitorId === competitor.id);
  const competitorReviews = reviews.filter((review) => review.competitorId === competitor.id);
  const evidenceIds = Array.from(new Set([...competitorSnapshots.map((snapshot) => snapshot.evidenceId), ...competitorReviews.map((review) => review.evidenceId)]));
  const iosSnapshot = latestSnapshotForPlatform(snapshots, channels, competitor.id, "ios");
  const androidSnapshot = latestSnapshotForPlatform(snapshots, channels, competitor.id, "android");
  const channelSummary = [platformChannelSummary(channels, competitor.id, "ios"), platformChannelSummary(channels, competitor.id, "android")].join(" / ");
  const reviewSignals = competitorReviews.map((review) => review.content).slice(0, 3);
  const changeSignals = [snapshotChange(iosSnapshot), snapshotChange(androidSnapshot)].filter((item) => item !== "暂无变化");
  const signalSummary = [...changeSignals, ...reviewSignals].slice(0, 3).join(" / ");

  if (moduleType === "growth") {
    return {
      summary: signalSummary || "待补增长证据，先关注版本更新、会员入口和需求候选变化。",
      signals: [...relatedInsights.map((insight) => insight.category), ...competitorReviews.map((review) => review.topicHint ?? "评论样本")].slice(0, 3),
      risks: ["缺少下载量、收入或投放数据时，不估算增长规模。"],
      opportunities: [competitorFeatureGap(competitor, features)],
      recommendation: "将增长结论限定为功能和商业化信号，补齐渠道快照后再判断趋势。",
      evidenceIds,
      confidence: relatedInsights.length > 0 ? 0.56 : 0.32,
      dataCoverage: ["Insight", "Snapshot"]
    };
  }

  if (moduleType === "traffic") {
    return {
      summary: `渠道覆盖：${channelSummary}。当前不推断真实下载量或投放预算。`,
      signals: channels
        .filter((channel) => channel.ownerType === "competitor" && channel.ownerId === competitor.id)
        .map((channel) => `${channel.channelName}/${crawlStatusLabel(channel.crawlStatus)}`),
      risks: ["渠道缺失会导致流量判断偏差。"],
      opportunities: ["补齐 App Store 与主流安卓渠道后可做渠道节奏对比。"],
      recommendation: "先把官网、App Store 和国内安卓渠道作为流量监控基础盘。",
      evidenceIds,
      confidence: 0.42,
      dataCoverage: ["Channel"]
    };
  }

  if (moduleType === "social") {
    return {
      summary: "社媒监控尚未接入自动数据，应以手动样本记录话题、素材和互动表现。",
      signals: reviewSignals,
      risks: ["没有小红书、抖音、微博样本前，不能判断声量强弱。"],
      opportunities: ["把商店更新、评论热点与社媒话题做交叉验证。"],
      recommendation: "建立社媒手动采样字段：平台、话题、素材、互动量、对应功能和证据链接。",
      evidenceIds,
      confidence: 0.36,
      dataCoverage: ["Manual"]
    };
  }

  if (moduleType === "product_performance") {
    return {
      summary: `iOS：${snapshotVersionRating(iosSnapshot)}；Android：${snapshotVersionRating(androidSnapshot)}。`,
      signals: changeSignals.length > 0 ? changeSignals : reviewSignals,
      risks: ["单平台快照不能代表整体产品表现。"],
      opportunities: [competitorFeatureAdvantage(competitor, features), competitorFeatureGap(competitor, features)],
      recommendation: "将版本、评分、评论量、价格和评论主题按 iOS/Android 分开看趋势。",
      evidenceIds,
      confidence: competitorSnapshots.length > 0 ? 0.58 : 0.3,
      dataCoverage: ["Snapshot", "Review"]
    };
  }

  const aiReviewSignals = competitorReviews.filter((review) => /AI|智能|生成|模板|写真|发型|证件照/.test(review.content)).map((review) => review.content);
  const aiInsights = relatedInsights.filter((insight) => /AI|智能|生成|模板/.test(`${insight.category} ${insight.title} ${insight.summary}`));
  return {
    summary: aiReviewSignals.slice(0, 2).join(" / ") || changeSignals.find((signal) => /AI|智能|生成|模板/.test(signal)) || "AI 相关信号不足，先作为待补证据观察项。",
    signals: [...aiInsights.map((insight) => insight.category), ...aiReviewSignals].slice(0, 3),
    risks: ["AI 推测不能替代功能实测，需要截图、更新日志或评论证据。"],
    opportunities: ["拆解 AI 入口、生成前后对比、付费限制和失败反馈。"],
    recommendation: "只把有 Evidence 的 AI 信号转入需求池；缺证据项继续采样。",
    evidenceIds,
    confidence: aiInsights.length > 0 ? 0.62 : 0.28,
    dataCoverage: ["Insight", "Review"]
  };
}

function moduleAnalysisOutput(
  analyses: CompetitorModuleAnalysis[],
  competitor: Competitor,
  moduleType: ModuleAnalysisType,
  insights: Insight[],
  evidence: Evidence[],
  snapshots: AppSnapshot[],
  reviews: Review[],
  channels: Channel[],
  features: Feature[]
): ModuleAnalysisOutput {
  const analysis = latestModuleAnalysis(analyses, competitor, moduleType);
  if (analysis) {
    return analysis;
  }
  return fallbackModuleAnalysis(competitor, moduleType, insights, evidence, snapshots, reviews, channels, features);
}

function listCell(items: string[]): string {
  return items.length > 0 ? items.join("<br>") : "暂无";
}

function areaLabel(area: ActionRecommendation["area"]): string {
  const labels: Record<ActionRecommendation["area"], string> = {
    growth: "增长",
    traffic: "流量",
    social: "社媒",
    product: "产品",
    ai: "AI",
    pricing: "价格/会员",
    engineering: "研发体验"
  };
  return labels[area];
}

function ownerRoleLabel(role: ActionRecommendation["ownerRole"]): string {
  const labels: Record<ActionRecommendation["ownerRole"], string> = {
    product: "产品",
    engineering: "研发",
    growth: "增长",
    research: "研究/数据"
  };
  return labels[role];
}

function actionRows(recommendations: ActionRecommendation[]): string[][] {
  return recommendations
    .filter((recommendation) => recommendation.status !== "Dismissed")
    .sort((left, right) => right.impactScore - left.impactScore || right.confidence - left.confidence)
    .slice(0, 10)
    .map((recommendation) => [
      recommendation.priorityHint,
      ownerRoleLabel(recommendation.ownerRole),
      areaLabel(recommendation.area),
      recommendation.title,
      recommendation.whyNow,
      recommendation.recommendation,
      recommendation.implementationHint,
      recommendation.successMetric,
      `${recommendation.impactScore} / ${recommendation.effort}`,
      formatEvidence(recommendation.evidenceIds)
    ]);
}

function actionTypeLabel(type: ActionRecommendation["actionType"]): string {
  const labels: Record<ActionRecommendation["actionType"], string> = {
    add_feature: "新增功能",
    improve_experience: "体验优化",
    collect_evidence: "补充证据",
    monitor_change: "持续监控",
    amplify_advantage: "强化优势",
    fix_quality: "质量修复"
  };
  return labels[type];
}

function evidenceStrength(ids: string[], evidence: Evidence[]): { label: string; summary: string; score: number } {
  const evidenceItems = ids.map((id) => evidence.find((item) => item.id === id)).filter((item): item is Evidence => Boolean(item));
  const sourceTypes = new Set(evidenceItems.map((item) => item.sourceType));
  const channels = new Set(evidenceItems.map((item) => item.channelName));
  const score = Math.min(100, evidenceItems.length * 14 + sourceTypes.size * 18 + channels.size * 10);
  const label = score >= 72 ? "强" : score >= 45 ? "中" : "弱";
  const summary =
    evidenceItems.length === 0
      ? "暂无证据，不能进入强结论"
      : `${evidenceItems.length} 条证据 / ${sourceTypes.size} 类来源 / ${channels.size} 个渠道`;
  return { label, summary, score };
}

function effortPenalty(effort: ActionRecommendation["effort"]): number {
  const penalties: Record<ActionRecommendation["effort"], number> = {
    S: 0,
    M: 8,
    L: 16
  };
  return penalties[effort];
}

function pmDecisionScore(recommendation: ActionRecommendation, evidence: Evidence[]): number {
  const strength = evidenceStrength(recommendation.evidenceIds, evidence);
  return Math.max(
    0,
    Math.min(100, Math.round(recommendation.impactScore * 0.5 + recommendation.confidence * 100 * 0.25 + strength.score * 0.25 - effortPenalty(recommendation.effort)))
  );
}

function decisionLabel(score: number, strengthLabel: string): string {
  if (score >= 80 && strengthLabel !== "弱") {
    return "进入近期版本评审";
  }
  if (score >= 65) {
    return "先做 MVP 验证";
  }
  if (strengthLabel === "弱") {
    return "先补证据";
  }
  return "继续观察";
}

function validationPlan(recommendation: ActionRecommendation): string {
  const plans: Record<ActionRecommendation["actionType"], string> = {
    add_feature: "先做最小闭环：入口、核心流程、结果页和埋点，不先铺完整能力。",
    improve_experience: "优先优化现有链路：入口可见性、默认参数、失败反馈和转化埋点。",
    collect_evidence: "补齐样本：商店截图、评论、社媒链接和竞品版本证据。",
    monitor_change: "设置 7-14 天观察窗口，跟踪版本、评论、价格和社媒话题是否连续出现。",
    amplify_advantage: "把当前优势改成商店页、截图文案、运营素材和版本卖点。",
    fix_quality: "先定位高频质量问题，做灰度修复和负向评论跟踪。"
  };
  return plans[recommendation.actionType];
}

function decisionBriefRows(recommendations: ActionRecommendation[], evidence: Evidence[]): string[][] {
  const activeRecommendations = recommendations
    .filter((recommendation) => recommendation.status !== "Dismissed")
    .sort((left, right) => pmDecisionScore(right, evidence) - pmDecisionScore(left, evidence))
    .slice(0, 5);
  return activeRecommendations.map((recommendation) => {
    const strength = evidenceStrength(recommendation.evidenceIds, evidence);
    const score = pmDecisionScore(recommendation, evidence);
    return [
      recommendation.priorityHint,
      recommendation.title.replace(/\|/g, "/"),
      actionTypeLabel(recommendation.actionType),
      decisionLabel(score, strength.label),
      `${score}`,
      `${strength.label}：${strength.summary}`,
      recommendation.whyNow.replace(/\|/g, "/")
    ];
  });
}

function validationRows(recommendations: ActionRecommendation[], evidence: Evidence[]): string[][] {
  return recommendations
    .filter((recommendation) => recommendation.status !== "Dismissed")
    .sort((left, right) => pmDecisionScore(right, evidence) - pmDecisionScore(left, evidence))
    .slice(0, 5)
    .map((recommendation) => [
      recommendation.title.replace(/\|/g, "/"),
      `如果${recommendation.recommendation.replace(/\|/g, "/")}，则应看到 ${recommendation.successMetric.replace(/\|/g, "/")}。`,
      validationPlan(recommendation),
      recommendation.implementationHint.replace(/\|/g, "/"),
      `2 周内 ${recommendation.successMetric.replace(/\|/g, "/")} 有正向变化，且负向评论不明显上升。`
    ]);
}

function inactionRiskRows(details: FeatureGapDetail[], evidence: Evidence[]): string[][] {
  return details
    .filter((detail) => detail.decision === "gap" || detail.decision === "improve")
    .sort((left, right) => right.demandScore - left.demandScore || right.totalEvidenceCount - left.totalEvidenceCount)
    .slice(0, 5)
    .map((detail) => {
      const competitors = detail.competitorDetails
        .filter((item) => item.support === "owned" || item.support === "advantage")
        .map((item) => item.competitorName);
      const ids = Array.from(
        new Set([
          ...detail.ownEvidenceIds,
          ...detail.socialEvidenceIds,
          ...detail.competitorDetails.flatMap((item) => [...item.evidenceIds, ...item.socialEvidenceIds])
        ])
      );
      const strength = evidenceStrength(ids, evidence);
      return [
        detail.featureName,
        competitors.join("、") || "暂无明确竞品覆盖",
        detail.decision === "gap" ? "竞品已形成用户认知，当前 App 容易被认为能力缺失。" : "竞品体验可能逐步拉开，当前 App 需要补强表达或链路。",
        `${strength.label}：${strength.summary}`,
        detail.suggestedAction.replace(/\|/g, "/")
      ];
    });
}

function copyGuardrailRows(details: FeatureGapDetail[]): string[][] {
  return details
    .filter((detail) => detail.decision === "gap" || detail.decision === "improve" || detail.decision === "advantage")
    .slice(0, 5)
    .map((detail) => [
      detail.featureName,
      detail.decision === "advantage" ? "这是当前 App 优势，不应为了跟随竞品而弱化。" : "竞品有不等于当前 App 必须照搬，需要先验证用户问题和产品定位。",
      detail.currentAppSupport === "advantage" ? "强化现有卖点、降低入口理解成本。" : "保留 B612 的相机、美颜、模板和轻量创作心智。",
      detail.decision === "advantage" ? "看商店转化、点击率和正向评论是否提升。" : "先用小流量 MVP、用户访谈或评论样本验证需求强度。"
    ]);
}

function eventTypeLabel(type: CompetitiveTimelineEvent["eventType"]): string {
  const labels: Record<CompetitiveTimelineEvent["eventType"], string> = {
    version: "版本",
    price: "价格",
    rating: "评分",
    review: "评论",
    insight: "洞察",
    recommendation: "建议"
  };
  return labels[type];
}

function priceChangeLabel(changeType: PriceSignal["changeType"]): string {
  const labels: Record<PriceSignal["changeType"], string> = {
    first_seen: "首次记录",
    changed: "发生变化",
    unchanged: "未变化",
    missing: "缺失"
  };
  return labels[changeType];
}

function diffFieldLabel(field: EvidenceDiff["field"]): string {
  const labels: Record<EvidenceDiff["field"], string> = {
    version: "版本",
    rating: "评分",
    review_count: "评论量",
    price: "价格",
    release_notes: "更新日志",
    description: "描述",
    screenshots: "截图"
  };
  return labels[field];
}

function alertTypeLabel(alertType: CompetitiveAlert["alertType"]): string {
  const labels: Record<CompetitiveAlert["alertType"], string> = {
    channel_failure: "渠道异常",
    price_change: "价格变化",
    rating_risk: "评分风险",
    high_severity_insight: "高危洞察",
    high_impact_recommendation: "高影响建议"
  };
  return labels[alertType];
}

function metadataFieldLabel(field: StoreMetadataSignal["field"]): string {
  const labels: Record<StoreMetadataSignal["field"], string> = {
    version: "版本",
    description: "描述",
    release_notes: "更新日志",
    screenshots: "截图",
    price: "价格",
    rating: "评分"
  };
  return labels[field];
}

function keywordSourceLabel(source: AsoKeywordOpportunity["source"]): string {
  const labels: Record<AsoKeywordOpportunity["source"], string> = {
    feature: "功能矩阵",
    review: "评论",
    release_notes: "更新日志",
    description: "商店描述",
    evidence: "证据"
  };
  return labels[source];
}

function launchTypeLabel(type: LaunchSignal["signalType"]): string {
  const labels: Record<LaunchSignal["signalType"], string> = {
    new_feature: "新功能",
    campaign: "活动/玩法",
    pricing: "商业化",
    positioning: "定位变化",
    quality: "质量风险",
    website: "官网发布"
  };
  return labels[type];
}

function socialPlatformLabel(platform: SocialPlatform): string {
  const labels: Record<SocialPlatform, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    weibo: "微博"
  };
  return labels[platform];
}

function socialSignalTypeLabel(type: SocialSignalType): string {
  const labels: Record<SocialSignalType, string> = {
    new_feature: "新功能",
    campaign: "活动",
    pricing: "价格 / 会员",
    user_feedback: "用户反馈",
    brand_positioning: "品牌定位",
    template_trend: "模板趋势"
  };
  return labels[type];
}

function featureGapDecisionLabel(decision: FeatureGapDetail["decision"]): string {
  const labels: Record<FeatureGapDetail["decision"], string> = {
    gap: "明显差距",
    improve: "待补强",
    advantage: "当前优势",
    watch: "继续观察"
  };
  return labels[decision];
}

function socialStatusLabel(status: SocialSample["fetchStatus"]): string {
  const labels: Record<SocialSample["fetchStatus"], string> = {
    ManualOnly: "手动样本",
    Pending: "待抓取",
    Fetched: "抓取成功",
    Failed: "抓取失败"
  };
  return labels[status];
}

function competitorFeatureGap(competitor: Competitor, features: Feature[]): string {
  const feature = features.find((item) => {
    const support = item.competitorSupport[competitor.id];
    return (support === "owned" || support === "advantage") && (item.currentAppSupport === "missing" || item.currentAppSupport === "partial");
  });
  return feature ? `${feature.name}（${featureDecision(feature)}）` : "暂无明显差距";
}

function competitorFeatureAdvantage(competitor: Competitor, features: Feature[]): string {
  const feature = features.find((item) => item.currentAppSupport === "advantage" && item.competitorSupport[competitor.id] !== "advantage");
  return feature ? feature.name : "待继续验证";
}

function markdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return "暂无数据。";
  }
  return [`| ${headers.join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.join(" | ")} |`)].join("\n");
}

// @SpecId: ACI-FLOW-REPORT-001, ACI-FLOW-REPORT-002, ACI-FLOW-REPORT-003, ACI-FLOW-REPORT-004, ACI-RULE-REPORT-001, ACI-RULE-REPORT-002, ACI-RULE-REPORT-003
export function generateMarkdownReport(state: DashboardState, ownedAppId: string, period: ReportPeriod): Report {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    throw new Error("Cannot generate report without an active owned app.");
  }

  const confirmedInsights = scoped.insights.filter((insight) => insight.status === "Confirmed" || insight.status === "New");
  const requirements = scoped.requirements.filter((requirement) => requirement.status !== "Rejected");
  const snapshots = scoped.snapshots;
  const features = normalizeFeatures(scoped.features);
  const highScoreFeatures = features.filter((feature) => feature.demandScore >= 80);
  const gapFeatures = features.filter((feature) => featureDecision(feature) === "明显差距" || featureDecision(feature) === "待补强");
  const advantageFeatures = features.filter((feature) => featureDecision(feature) === "当前优势");
  const actionRecommendations =
    scoped.actionRecommendations.length > 0 ? scoped.actionRecommendations : buildActionRecommendations(state, ownedAppId);
  const timelineEvents = buildTrendTimeline(state, ownedAppId);
  const priceSignals = buildPriceSignals(state, ownedAppId);
  const evidenceDiffs = buildEvidenceDiffs(state, ownedAppId);
  const competitiveAlerts = buildCompetitiveAlerts(state, ownedAppId);
  const storeMetadataSignals = buildStoreMetadataSignals(state, ownedAppId);
  const ratingSentimentSignals = buildRatingSentimentSignals(state, ownedAppId);
  const asoKeywordOpportunities = buildAsoKeywordOpportunities(state, ownedAppId);
  const launchSignals = buildLaunchSignals(state, ownedAppId);
  const featureGapDetails = buildFeatureGapDetails(state, ownedAppId);
  const socialSamples = scoped.socialSamples;
  const evidenceIds = Array.from(
    new Set([
      ...confirmedInsights.flatMap((insight) => insight.evidenceIds),
      ...requirements.flatMap((requirement) => requirement.evidenceIds),
      ...snapshots.map((snapshot) => snapshot.evidenceId),
      ...scoped.moduleAnalyses.flatMap((analysis) => analysis.evidenceIds),
      ...actionRecommendations.flatMap((recommendation) => recommendation.evidenceIds),
      ...timelineEvents.flatMap((event) => event.evidenceIds),
      ...priceSignals.flatMap((signal) => signal.evidenceIds),
      ...evidenceDiffs.flatMap((diff) => diff.evidenceIds),
      ...competitiveAlerts.flatMap((alert) => alert.evidenceIds),
      ...storeMetadataSignals.flatMap((signal) => signal.evidenceIds),
      ...ratingSentimentSignals.flatMap((signal) => signal.evidenceIds),
      ...asoKeywordOpportunities.flatMap((opportunity) => opportunity.evidenceIds),
      ...launchSignals.flatMap((signal) => signal.evidenceIds),
      ...featureGapDetails.flatMap((detail) => [
        ...detail.ownEvidenceIds,
        ...detail.socialEvidenceIds,
        ...detail.competitorDetails.flatMap((competitorDetail) => [...competitorDetail.evidenceIds, ...competitorDetail.socialEvidenceIds])
      ]),
      ...socialSamples.map((sample) => sample.evidenceId).filter((id): id is string => Boolean(id))
    ])
  );

  const insightSection =
    confirmedInsights.length === 0
      ? "- 本周期没有发现重大竞品变化，建议继续观察评论量和渠道快照覆盖。"
      : confirmedInsights
          .map(
            (insight) =>
              `- **${insight.title}**（${insight.label}，${insight.severity}，置信度 ${Math.round(insight.confidence * 100)}%）\n  - 现象：${insight.summary}\n  - 解读：${insight.label === "Inference" ? "该项是推测，需要继续补证据。" : "该项由评论、快照或更新日志支撑，可进入产品讨论。"}\n  - 建议：${insight.recommendation}\n  - 证据：${formatEvidence(insight.evidenceIds)}`
          )
          .join("\n");

  const requirementSection =
    requirements.length === 0
      ? "- 暂无候选需求。"
      : requirements
          .map(
            (requirement) =>
              `- **${requirement.problem}**（${requirement.priorityHint} / ${requirement.status}）：${requirement.recommendation}\n  - 竞品参考：${requirement.competitorReference}\n  - 证据：${formatEvidence(requirement.evidenceIds)}`
          )
          .join("\n");

  const channelCoverage = scoped.channels
    .map((channel) => `- ${channel.channelName} / ${channel.storeUrl}：${channel.crawlStatus}`)
    .join("\n");

  const ownFeatureCoverage =
    features.length === 0
      ? "暂无功能样本"
      : `${features.filter((feature) => feature.currentAppSupport === "owned" || feature.currentAppSupport === "advantage").length}/${features.length} 项已具备或优势`;
  const ownGap = gapFeatures.slice(0, 2).map((feature) => feature.name).join("、") || "暂无明显差距";
  const ownAdvantage = advantageFeatures.slice(0, 2).map((feature) => feature.name).join("、") || "待继续验证";
  const ownIosSnapshot = latestSnapshotForPlatform(snapshots, scoped.channels, undefined, "ios");
  const ownAndroidSnapshot = latestSnapshotForPlatform(snapshots, scoped.channels, undefined, "android");
  const competitorRows = [
    [
      scoped.currentOwnedApp.name,
      "Base",
      "自有 App",
      platformChannelSummary(scoped.channels, undefined, "ios"),
      platformChannelSummary(scoped.channels, undefined, "android"),
      snapshotVersionRating(ownIosSnapshot),
      snapshotVersionRating(ownAndroidSnapshot),
      membershipPriceForName(scoped.currentOwnedApp.name, ownIosSnapshot?.priceText, "ios"),
      membershipPriceForName(scoped.currentOwnedApp.name, ownAndroidSnapshot?.priceText, "android"),
      snapshotChange(ownIosSnapshot),
      snapshotChange(ownAndroidSnapshot),
      ownFeatureCoverage,
      ownGap,
      ownAdvantage
    ],
    ...scoped.competitors.map((competitor) => {
      const iosSnapshot = latestSnapshotForPlatform(snapshots, scoped.channels, competitor.id, "ios");
      const androidSnapshot = latestSnapshotForPlatform(snapshots, scoped.channels, competitor.id, "android");
      const insights = relatedInsightsForCompetitor(competitor, confirmedInsights, scoped.evidence, snapshots);
      return [
        competitor.name,
        competitor.priority,
        "竞品",
        platformChannelSummary(scoped.channels, competitor.id, "ios"),
        platformChannelSummary(scoped.channels, competitor.id, "android"),
        snapshotVersionRating(iosSnapshot),
        snapshotVersionRating(androidSnapshot),
        membershipPriceForName(competitor.name, iosSnapshot?.priceText, "ios"),
        membershipPriceForName(competitor.name, androidSnapshot?.priceText, "android"),
        snapshotChange(iosSnapshot),
        snapshotChange(androidSnapshot),
        insights.map((insight) => insight.category).join("、") || "暂无明确热点",
        competitorFeatureGap(competitor, features),
        competitorFeatureAdvantage(competitor, features)
      ];
    })
  ];

  const featureRows = features.map((feature) => [
    feature.name,
    feature.category,
    feature.currentAppSupport,
    scoped.competitors
      .map((competitor) => `${competitor.name}:${feature.competitorSupport[competitor.id] ?? "unknown"}`)
      .join("<br>"),
    featureDecision(feature),
    `${feature.demandScore}`,
    featureAction(feature)
  ]);

  const moduleAnalysisSections = moduleAnalysisTypes
    .map((moduleType) => {
      const rows = scoped.competitors.map((competitor) => {
        const output = moduleAnalysisOutput(
          scoped.moduleAnalyses,
          competitor,
          moduleType,
          confirmedInsights,
          scoped.evidence,
          snapshots,
          scoped.reviews,
          scoped.channels,
          features
        );
        return [
          competitor.name,
          output.summary,
          listCell(output.signals),
          listCell(output.risks),
          listCell(output.opportunities),
          output.recommendation,
          `${Math.round(output.confidence * 100)}% / ${output.dataCoverage.join("、") || "待补"}`,
          formatEvidence(output.evidenceIds)
        ];
      });
      return `### ${moduleAnalysisLabels[moduleType]}\n\n${markdownTable(
        ["竞品", "模块判断", "信号", "风险", "机会", "建议", "置信度 / 覆盖", "证据"],
        rows
      )}`;
    })
    .join("\n\n");

  const recommendedActionRows = actionRows(actionRecommendations);
  const timelineRows = timelineEvents.slice(0, 12).map((event) => [
    event.occurredAt.slice(0, 10),
    eventTypeLabel(event.eventType),
    event.ownerName,
    event.title,
    event.summary.replace(/\|/g, "/"),
    event.impact,
    formatEvidence(event.evidenceIds)
  ]);
  const priceRows = priceSignals.slice(0, 12).map((signal) => [
    signal.ownerName,
    signal.platform ?? "unknown",
    signal.channelName,
    priceChangeLabel(signal.changeType),
    signal.priceText.replace(/\|/g, "/"),
    signal.numericPrices.join("、") || "待解析",
    signal.previousPriceText?.replace(/\|/g, "/") ?? "无",
    formatEvidence(signal.evidenceIds)
  ]);
  const diffRows = evidenceDiffs.slice(0, 12).map((diff) => [
    diff.changedAt.slice(0, 10),
    diff.ownerName,
    diff.channelName,
    diffFieldLabel(diff.field),
    diff.beforeValue.replace(/\|/g, "/"),
    diff.afterValue.replace(/\|/g, "/"),
    formatEvidence(diff.evidenceIds)
  ]);
  const alertRows = competitiveAlerts.slice(0, 12).map((alert) => [
    alert.severity,
    alertTypeLabel(alert.alertType),
    alert.ownerName ?? scoped.currentOwnedApp?.name ?? "当前 App",
    alert.title,
    alert.summary.replace(/\|/g, "/"),
    formatEvidence(alert.evidenceIds)
  ]);
  const metadataRows = storeMetadataSignals.slice(0, 12).map((signal) => [
    signal.capturedAt.slice(0, 10),
    signal.ownerName,
    signal.channelName,
    metadataFieldLabel(signal.field),
    signal.afterValue.replace(/\|/g, "/"),
    signal.keywordHints.join("、") || "待提取",
    formatEvidence(signal.evidenceIds)
  ]);
  const sentimentRows = ratingSentimentSignals.slice(0, 12).map((signal: RatingSentimentSignal) => [
    signal.ownerName,
    signal.platform ?? "unknown",
    signal.channelName,
    `${signal.rating ?? "无"} 分 / ${signal.reviewCount ?? "无"} 条`,
    `样本 ${signal.sampleSize}，正向 ${signal.positiveReviewCount}，负向 ${signal.negativeReviewCount}`,
    signal.riskLevel,
    signal.topThemes.join("、") || "待聚类",
    formatEvidence(signal.evidenceIds)
  ]);
  const keywordRows = asoKeywordOpportunities.slice(0, 12).map((opportunity) => [
    opportunity.keyword,
    `${opportunity.opportunityScore}`,
    keywordSourceLabel(opportunity.source),
    opportunity.ownedCoverage ? "已覆盖" : "表达缺口",
    opportunity.competitorCoverage.map((coverage) => coverage.competitorName).join("、") || "暂无",
    `${opportunity.mentionCount}`,
    opportunity.recommendation,
    formatEvidence(opportunity.evidenceIds)
  ]);
  const launchRows = launchSignals.slice(0, 12).map((signal) => [
    signal.occurredAt.slice(0, 10),
    launchTypeLabel(signal.signalType),
    signal.impact,
    signal.ownerName,
    signal.title,
    signal.summary.replace(/\|/g, "/"),
    `${Math.round(signal.confidence * 100)}%`,
    formatEvidence(signal.evidenceIds)
  ]);
  const featureDetailRows = featureGapDetails.slice(0, 12).map((detail) => {
    const competitorsWithFeature = detail.competitorDetails
      .filter((competitorDetail) => competitorDetail.support === "owned" || competitorDetail.support === "advantage")
      .map((competitorDetail) => competitorDetail.competitorName);
    const competitorEvidenceCount = detail.competitorDetails.reduce(
      (count, competitorDetail) => count + competitorDetail.evidenceIds.length + competitorDetail.socialEvidenceIds.length,
      0
    );
    return [
      detail.featureName,
      featureGapDecisionLabel(detail.decision),
      `${detail.demandScore}`,
      detail.currentAppSupport,
      competitorsWithFeature.join("、") || "暂无",
      detail.reviewSummary.replace(/\|/g, "/"),
      `自有 ${detail.ownEvidenceIds.length} / 竞品 ${competitorEvidenceCount} / 社媒 ${detail.socialEvidenceIds.length}`,
      detail.suggestedAction,
      formatEvidence(
        Array.from(
          new Set([
            ...detail.ownEvidenceIds,
            ...detail.socialEvidenceIds,
            ...detail.competitorDetails.flatMap((competitorDetail) => [...competitorDetail.evidenceIds, ...competitorDetail.socialEvidenceIds])
          ])
        )
      )
    ];
  });
  const socialRows = socialSamples.slice(0, 20).map((sample) => [
    socialPlatformLabel(sample.platform),
    sample.competitorId
      ? scoped.competitors.find((competitor) => competitor.id === sample.competitorId)?.name ?? sample.competitorId
      : scoped.currentOwnedApp?.name ?? "当前 App",
    socialSignalTypeLabel(sample.signalType),
    sample.impact,
    socialStatusLabel(sample.fetchStatus),
    sample.topic.replace(/\|/g, "/"),
    sample.summary.replace(/\|/g, "/"),
    sample.engagementText?.replace(/\|/g, "/") ?? "未记录",
    sample.fetchFailureReason?.replace(/\|/g, "/") ?? "无",
    sample.evidenceId ? formatEvidence([sample.evidenceId]) : "无"
  ]);
  const decisionRows = decisionBriefRows(actionRecommendations, scoped.evidence);
  const validationPlanRows = validationRows(actionRecommendations, scoped.evidence);
  const riskRows = inactionRiskRows(featureGapDetails, scoped.evidence);
  const guardrailRows = copyGuardrailRows(featureGapDetails);

  const evidenceRows = evidenceIds
    .map((id) => scoped.evidence.find((item) => item.id === id))
    .filter((item): item is Evidence => Boolean(item))
    .slice(0, 12)
    .map((item) => [item.id, item.channelName, item.sourceType, item.sourceUrl || "无", item.rawExcerpt.replace(/\|/g, "/")]);

  const markdown = `# ${scoped.currentOwnedApp.name} 竞品周报

周期：${period.start} 至 ${period.end}
自有 App：${scoped.currentOwnedApp.name}
监控竞品：${scoped.competitors.map((competitor) => competitor.name).join("、") || "暂无"}
监控渠道：${scoped.channels.map((channel) => channel.channelName).join("、") || "暂无"}
生成时间：${isoNow()}

## 1. 本周摘要

${confirmedInsights.length > 0 ? `本周期发现 ${confirmedInsights.length} 条可跟进洞察，形成 ${requirements.length} 条候选需求，功能矩阵中有 ${gapFeatures.length} 个差距/待补强项和 ${advantageFeatures.length} 个可强化优势项，社媒样本库收录 ${socialSamples.length} 条公开话题证据。` : `本周期没有重大变化，但保留数据覆盖摘要；社媒样本库当前收录 ${socialSamples.length} 条公开话题证据。`}

重点判断：

- **优先跟进**：${gapFeatures[0] ? `${gapFeatures[0].name}，${featureAction(gapFeatures[0])}` : "暂无高优先差距项。"}
- **优势表达**：${advantageFeatures[0] ? `${advantageFeatures[0].name}，${featureAction(advantageFeatures[0])}` : "暂无明确优势项。"}
- **证据质量**：当前报告引用 ${evidenceIds.length} 条 Evidence；所有关键结论必须回溯证据。

### 1.1 管理层决策摘要

${markdownTable(["优先级", "建议主题", "动作类型", "PM 判断", "决策分", "证据强度", "为什么现在"], decisionRows)}

### 1.2 说服力证据评分

${markdownTable(["功能 / 机会", "竞品覆盖", "如果不做的风险", "证据强度", "建议动作"], riskRows)}

### 1.3 MVP 验证计划

${markdownTable(["建议主题", "核心假设", "最小验证方案", "研发提示", "通过标准"], validationPlanRows)}

### 1.4 不直接复制竞品的边界

${markdownTable(["能力", "为什么不直接照搬", "当前 App 应保留的差异化", "验证方式"], guardrailRows)}

## 2. 竞品分析总览

${markdownTable(["对象", "优先级", "类型", "iOS 渠道", "Android 渠道", "iOS 版本/评分", "Android 版本/评分", "iOS 会员价格", "Android 会员价格", "iOS 关键变化", "Android 关键变化", "功能/热点覆盖", "竞品多出的能力", "当前 App 优势"], competitorRows)}

## 3. 分模块竞品分析

${moduleAnalysisSections || "暂无竞品模块分析。"}

## 4. 竞品变化明细

${snapshots.length === 0 ? "- 暂无快照数据。" : snapshots.map((snapshot) => `- ${snapshot.version ?? "未知版本"}：${snapshot.releaseNotes ?? snapshot.description ?? "暂无说明"}（证据 ${formatEvidence([snapshot.evidenceId])}）`).join("\n")}

## 5. 评论热点与洞察解读

${insightSection}

## 6. 功能差距矩阵

${markdownTable(["功能", "分类", "当前 App", "竞品覆盖", "判断", "需求分", "建议动作"], featureRows)}

高需求分功能：${highScoreFeatures.map((feature) => `${feature.name}(${feature.demandScore})`).join("、") || "暂无"}。

## 7. 功能差距详情

${markdownTable(["功能", "判断", "需求分", "当前 App 状态", "哪些竞品有", "用户评价", "证据结构", "建议怎么补", "证据"], featureDetailRows)}

## 8. 社媒样本库

${markdownTable(["平台", "对象", "信号类型", "影响", "抓取状态", "话题", "摘要", "互动", "失败原因", "证据"], socialRows)}

## 9. 候选需求

${requirementSection}

## 10. 下周行动清单

${markdownTable(["优先级", "负责人", "模块", "主题", "为什么现在", "建议动作", "研发提示", "成功指标", "影响/成本", "证据"], recommendedActionRows)}

## 11. 趋势时间线

${markdownTable(["时间", "类型", "对象", "标题", "摘要", "影响", "证据"], timelineRows)}

## 12. 价格 / 会员监控

${markdownTable(["对象", "平台", "渠道", "变化", "当前价格", "数字价格", "上一条价格", "证据"], priceRows)}

## 13. 证据 Diff

${markdownTable(["时间", "对象", "渠道", "字段", "变化前", "变化后", "证据"], diffRows)}

## 14. 告警中心

${markdownTable(["等级", "类型", "对象", "标题", "摘要", "证据"], alertRows)}

## 15. 商店页元数据时间线

${markdownTable(["时间", "对象", "渠道", "字段", "当前值", "关键词线索", "证据"], metadataRows)}

## 16. 评分与口碑监控

${markdownTable(["对象", "平台", "渠道", "评分 / 评论", "样本结构", "风险", "主题", "证据"], sentimentRows)}

## 17. ASO 关键词雷达

${markdownTable(["关键词", "机会分", "来源", "当前 App", "竞品覆盖", "提及", "建议", "证据"], keywordRows)}

## 18. 产品发布雷达

${markdownTable(["时间", "类型", "影响", "对象", "标题", "摘要", "置信度", "证据"], launchRows)}

## 19. 价格 / 会员 / 战略推测

- 会员/价格相关结论必须标注为 Fact、Pattern 或 Inference；当前样本证据：${formatEvidence(evidenceIds)}
- 如果竞品在更新日志、截图文案和评论中同时强化 AI/会员表达，可判断为商业化或 AI 供给强化信号，但仍需更多周期验证。
- 当前不建议直接复制竞品功能，应先拆解用户问题、入口位置、转化链路和 B612 自身优势。

## 20. 数据覆盖与风险

${channelCoverage || "- 暂无渠道配置。"}

风险提示：

- 国内安卓渠道目前可能是手动样本或待审批状态，不能把缺失数据解释为竞品没有变化。
- 小红书、抖音、微博只抓取公开页面；登录、验证码、访问限制和平台风控会记录为 Failed，不能绕过。
- AI 输出只作为产品建议，所有需求进入评审前必须保留 Evidence。
- 若样本评论量不足，应把结论降级为观察项。

## 21. Evidence References

${formatEvidence(evidenceIds)}

## 22. Evidence 摘录

${markdownTable(["Evidence ID", "渠道", "类型", "来源链接", "摘录"], evidenceRows)}
`;

  const now = isoNow();
  return {
    id: createId("report"),
    ownedAppId,
    period,
    markdown,
    status: "Draft",
    evidenceIds,
    generatedAt: now,
    updatedAt: now
  };
}
