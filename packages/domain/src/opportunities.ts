import { isoNow } from "./ids.js";
import { getScopedState } from "./state.js";
import type {
  ActionRecommendation,
  Competitor,
  CompetitorModuleAnalysis,
  DashboardState,
  Feature,
  Insight,
  ModuleAnalysisType,
  Priority,
  RecommendationActionType,
  RecommendationArea,
  RecommendationEffort,
  RecommendationOwnerRole,
  ScopedDashboardState
} from "./types.js";

type RecommendationDraft = Omit<ActionRecommendation, "id" | "ownedAppId" | "status" | "createdAt" | "updatedAt">;

const moduleLabels: Record<ModuleAnalysisType, string> = {
  growth: "增长",
  traffic: "流量",
  social: "社媒",
  product_performance: "产品表现",
  ai_insight: "AI 洞察"
};

function stableRecommendationId(sourceKey: string): string {
  let hash = 0;
  for (let index = 0; index < sourceKey.length; index += 1) {
    hash = Math.imul(hash, 31) + sourceKey.charCodeAt(index);
    hash >>>= 0;
  }
  return `rec_${hash.toString(36)}`;
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function priorityFromScore(score: number): Priority {
  if (score >= 85) {
    return "P0";
  }
  if (score >= 65) {
    return "P1";
  }
  return "P2";
}

function competitorPriorityBoost(competitor?: Competitor): number {
  if (!competitor) {
    return 0;
  }
  return competitor.priority === "P0" ? 8 : competitor.priority === "P1" ? 4 : 1;
}

function supportLabel(support: Feature["currentAppSupport"]): string {
  const labels: Record<Feature["currentAppSupport"], string> = {
    owned: "已具备",
    missing: "缺失",
    partial: "部分具备",
    advantage: "优势",
    unknown: "未知"
  };
  return labels[support];
}

function featureDecision(feature: Feature): "gap" | "improve" | "advantage" | "watch" {
  const competitorValues = Object.values(feature.competitorSupport);
  const competitorOwnedCount = competitorValues.filter((value) => value === "owned" || value === "advantage").length;
  if (feature.currentAppSupport === "missing" && competitorOwnedCount > 0) {
    return "gap";
  }
  if (feature.currentAppSupport === "partial" && competitorOwnedCount >= 1) {
    return "improve";
  }
  if (feature.currentAppSupport === "advantage") {
    return "advantage";
  }
  return "watch";
}

function areaFromText(text: string): RecommendationArea {
  if (/AI|智能|生成|模板|写真|发型|证件照/.test(text)) {
    return "ai";
  }
  if (/会员|价格|付费|订阅|商业化/.test(text)) {
    return "pricing";
  }
  if (/启动|性能|崩溃|卡顿|导出|质量|夜景|评分/.test(text)) {
    return "engineering";
  }
  if (/增长|转化|留存|入口/.test(text)) {
    return "growth";
  }
  return "product";
}

function ownerRoleFromText(text: string): RecommendationOwnerRole {
  if (/启动|性能|崩溃|卡顿|导出|质量|夜景|稳定/.test(text)) {
    return "engineering";
  }
  if (/渠道|社媒|小红书|抖音|微博|采样|证据/.test(text)) {
    return "research";
  }
  if (/增长|会员|价格|转化|订阅|商业化/.test(text)) {
    return "growth";
  }
  return "product";
}

function actionTypeForArea(area: RecommendationArea): RecommendationActionType {
  if (area === "traffic" || area === "social") {
    return "collect_evidence";
  }
  if (area === "engineering") {
    return "fix_quality";
  }
  if (area === "growth" || area === "pricing") {
    return "monitor_change";
  }
  if (area === "ai") {
    return "add_feature";
  }
  return "improve_experience";
}

function effortForFeature(feature: Feature): RecommendationEffort {
  if (feature.currentAppSupport === "missing" && feature.demandScore >= 85) {
    return "L";
  }
  if (feature.currentAppSupport === "missing" || feature.currentAppSupport === "partial") {
    return "M";
  }
  return "S";
}

function competitorsForFeature(scoped: ScopedDashboardState, feature: Feature): Competitor[] {
  const competitors = scoped.competitors.filter((competitor) => {
    const support = feature.competitorSupport[competitor.id];
    return support === "owned" || support === "advantage";
  });
  return competitors.length > 0 ? competitors : scoped.competitors;
}

function evidenceIdsForCompetitors(scoped: ScopedDashboardState, competitorIds: string[]): string[] {
  const targetIds = new Set(competitorIds);
  const evidenceIds = new Set<string>();

  scoped.snapshots.forEach((snapshot) => {
    if (snapshot.competitorId && targetIds.has(snapshot.competitorId)) {
      evidenceIds.add(snapshot.evidenceId);
    }
  });
  scoped.reviews.forEach((review) => {
    if (review.competitorId && targetIds.has(review.competitorId)) {
      evidenceIds.add(review.evidenceId);
    }
  });
  scoped.moduleAnalyses.forEach((analysis) => {
    if (targetIds.has(analysis.competitorId)) {
      analysis.evidenceIds.forEach((id) => evidenceIds.add(id));
    }
  });

  return Array.from(evidenceIds);
}

function relatedInsights(scoped: ScopedDashboardState, evidenceIds: string[]): Insight[] {
  const evidenceSet = new Set(evidenceIds);
  return scoped.insights.filter((insight) => insight.evidenceIds.some((id) => evidenceSet.has(id)));
}

function sourceModulesForFeature(scoped: ScopedDashboardState, competitorIds: string[], feature: Feature): ModuleAnalysisType[] {
  const featureArea = areaFromText(`${feature.name} ${feature.category}`);
  const modules = scoped.moduleAnalyses
    .filter((analysis) => competitorIds.includes(analysis.competitorId))
    .filter((analysis) => {
      if (featureArea === "ai") {
        return analysis.moduleType === "ai_insight" || analysis.moduleType === "product_performance";
      }
      if (featureArea === "pricing" || featureArea === "growth") {
        return analysis.moduleType === "growth";
      }
      if (featureArea === "engineering") {
        return analysis.moduleType === "product_performance";
      }
      return analysis.moduleType === "product_performance" || analysis.moduleType === "growth";
    })
    .map((analysis) => analysis.moduleType);
  return unique(modules.length > 0 ? modules : ["product_performance"]);
}

function buildFeatureRecommendations(scoped: ScopedDashboardState): RecommendationDraft[] {
  return scoped.features
    .filter((feature) => featureDecision(feature) !== "watch")
    .sort((left, right) => right.demandScore - left.demandScore)
    .slice(0, 8)
    .map((feature) => {
      const decision = featureDecision(feature);
      const competitors = competitorsForFeature(scoped, feature);
      const competitorIds = competitors.map((competitor) => competitor.id);
      const evidenceIds = evidenceIdsForCompetitors(scoped, competitorIds);
      const insightIds = relatedInsights(scoped, evidenceIds).map((insight) => insight.id);
      const competitorNames = competitors.map((competitor) => competitor.name).slice(0, 3).join("、") || "竞品";
      const area = areaFromText(`${feature.name} ${feature.category}`);
      const actionType: RecommendationActionType =
        decision === "advantage" ? "amplify_advantage" : decision === "gap" ? "add_feature" : actionTypeForArea(area);
      const impactScore = clampScore(feature.demandScore + competitorIds.length * 3 + (decision === "gap" ? 6 : decision === "advantage" ? -4 : 2));
      const statusText = supportLabel(feature.currentAppSupport);

      return {
        sourceKey: `feature:${feature.id}:${decision}`,
        title: decision === "advantage" ? `强化「${feature.name}」优势表达` : `评估「${feature.name}」${decision === "gap" ? "补齐" : "体验优化"}`,
        area,
        actionType,
        ownerRole: ownerRoleFromText(`${feature.name} ${feature.category}`),
        priorityHint: priorityFromScore(impactScore),
        impactScore,
        effort: effortForFeature(feature),
        confidence: feature.source === "user_confirmed" || feature.source === "user_edited" ? 0.82 : 0.62,
        problem:
          decision === "advantage"
            ? `当前 App 在该能力上有优势，${competitorNames} 尚未形成同等优势。`
            : `${competitorNames} 已具备相关能力，当前 App 状态为${statusText}。`,
        whyNow: `功能矩阵需求分 ${feature.demandScore}，当前判断为${decision === "gap" ? "明显差距" : decision === "improve" ? "待补强" : "优势强化"}。`,
        recommendation:
          decision === "advantage"
            ? "将该能力进入商店素材、版本卖点和周报优势表达，并继续监控竞品是否追赶。"
            : "先拆解竞品入口、核心链路、付费限制和用户问题，再进入需求评审。",
        implementationHint:
          decision === "gap"
            ? "研发侧先评估端能力、素材/模型依赖、埋点口径和灰度实验方案。"
            : "研发侧优先做小范围体验优化或素材配置实验，避免一次性重做主流程。",
        successMetric: decision === "advantage" ? "商店页点击、功能入口点击、版本卖点转化提升。" : "功能使用率、生成完成率、导出转化或相关负向评论占比改善。",
        competitorIds,
        featureIds: [feature.id],
        insightIds,
        evidenceIds,
        sourceModules: sourceModulesForFeature(scoped, competitorIds, feature)
      };
    });
}

function moduleArea(moduleType: ModuleAnalysisType): RecommendationArea {
  if (moduleType === "traffic") {
    return "traffic";
  }
  if (moduleType === "social") {
    return "social";
  }
  if (moduleType === "growth") {
    return "growth";
  }
  if (moduleType === "ai_insight") {
    return "ai";
  }
  return "product";
}

function buildModuleRecommendation(scoped: ScopedDashboardState, analysis: CompetitorModuleAnalysis): RecommendationDraft | undefined {
  const competitor = scoped.competitors.find((item) => item.id === analysis.competitorId);
  if (!competitor) {
    return undefined;
  }
  const area = moduleArea(analysis.moduleType);
  const evidenceIds = unique(analysis.evidenceIds);
  const insights = relatedInsights(scoped, evidenceIds);
  const impactScore = clampScore(48 + analysis.confidence * 30 + competitorPriorityBoost(competitor));
  const firstOpportunity = analysis.opportunities.find(Boolean) ?? analysis.recommendation;
  return {
    sourceKey: `module:${analysis.competitorId}:${analysis.moduleType}`,
    title: `${competitor.name} ${moduleLabels[analysis.moduleType]}：${firstOpportunity}`,
    area,
    actionType: actionTypeForArea(area),
    ownerRole: ownerRoleFromText(`${moduleLabels[analysis.moduleType]} ${analysis.summary} ${analysis.recommendation}`),
    priorityHint: priorityFromScore(impactScore),
    impactScore,
    effort: area === "traffic" || area === "social" ? "S" : area === "ai" ? "M" : "M",
    confidence: analysis.confidence,
    problem: analysis.summary,
    whyNow: `信号：${analysis.signals.slice(0, 2).join("、") || "待补"}；风险：${analysis.risks[0] ?? "暂无明确风险"}。`,
    recommendation: analysis.recommendation,
    implementationHint:
      area === "traffic" || area === "social"
        ? "先补监控源配置、采样字段和证据链接，再进入功能或增长判断。"
        : "产品先明确用户问题和竞品链路，研发同步评估数据、端能力和实验埋点。",
    successMetric: area === "traffic" || area === "social" ? "新增可用监控源、每周样本覆盖率、证据链接完整率。" : "需求评审通过率、实验指标改善、证据覆盖率。",
    competitorIds: [competitor.id],
    featureIds: [],
    insightIds: insights.map((insight) => insight.id),
    evidenceIds,
    sourceModules: [analysis.moduleType]
  };
}

function buildInsightRecommendations(scoped: ScopedDashboardState): RecommendationDraft[] {
  return scoped.insights
    .filter((insight) => (insight.status === "New" || insight.status === "Confirmed") && insight.severity !== "low")
    .sort((left, right) => {
      const severityScore = (value: Insight) => (value.severity === "high" ? 3 : value.severity === "medium" ? 2 : 1);
      return severityScore(right) - severityScore(left) || right.confidence - left.confidence;
    })
    .slice(0, 5)
    .map((insight) => {
      const area = areaFromText(`${insight.category} ${insight.title} ${insight.summary}`);
      const competitorIds = scoped.competitors
        .filter((competitor) => {
          const competitorEvidenceIds = evidenceIdsForCompetitors(scoped, [competitor.id]);
          return insight.evidenceIds.some((id) => competitorEvidenceIds.includes(id));
        })
        .map((competitor) => competitor.id);
      const impactScore = clampScore((insight.severity === "high" ? 78 : 64) + insight.confidence * 16 + competitorIds.length * 3);
      return {
        sourceKey: `insight:${insight.id}`,
        title: `跟进洞察：${insight.title}`,
        area,
        actionType: actionTypeForArea(area),
        ownerRole: ownerRoleFromText(`${insight.category} ${insight.summary} ${insight.recommendation}`),
        priorityHint: priorityFromScore(impactScore),
        impactScore,
        effort: insight.severity === "high" ? "M" : "S",
        confidence: insight.confidence,
        problem: insight.summary,
        whyNow: `${insight.label} / ${insight.severity}，来自 ${insight.sourceChannels.join("、") || "未知渠道"}。`,
        recommendation: insight.recommendation,
        implementationHint: "产品确认问题定义和目标用户，研发评估最小可验证方案、埋点和灰度边界。",
        successMetric: "对应评论主题占比下降，功能使用率或转化指标提升。",
        competitorIds,
        featureIds: [],
        insightIds: [insight.id],
        evidenceIds: insight.evidenceIds,
        sourceModules: area === "ai" ? ["ai_insight"] : area === "growth" || area === "pricing" ? ["growth"] : ["product_performance"]
      };
    });
}

export function buildActionRecommendations(state: DashboardState, ownedAppId: string): ActionRecommendation[] {
  const scoped = getScopedState(state, ownedAppId);
  if (!scoped.currentOwnedApp) {
    return [];
  }

  const now = isoNow();
  const drafts = [
    ...buildFeatureRecommendations(scoped),
    ...scoped.moduleAnalyses.map((analysis) => buildModuleRecommendation(scoped, analysis)).filter((item): item is RecommendationDraft => Boolean(item)),
    ...buildInsightRecommendations(scoped)
  ];

  const bySource = new Map<string, RecommendationDraft>();
  drafts.forEach((draft) => {
    const existing = bySource.get(draft.sourceKey);
    if (!existing || draft.impactScore > existing.impactScore) {
      bySource.set(draft.sourceKey, draft);
    }
  });

  return Array.from(bySource.values())
    .sort((left, right) => right.impactScore - left.impactScore || right.confidence - left.confidence)
    .slice(0, 18)
    .map((draft) => ({
      ...draft,
      id: stableRecommendationId(`${ownedAppId}:${draft.sourceKey}`),
      ownedAppId,
      status: "Open",
      createdAt: now,
      updatedAt: now
    }));
}
