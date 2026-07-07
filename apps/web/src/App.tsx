import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  Check,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  GitCompare,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings2,
  Star,
  Tags,
  Target,
  Trash2,
  X
} from "lucide-react";
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
  buildTrendTimeline
} from "@aci/domain";
import type {
  ActionRecommendation,
  AsoKeywordOpportunity,
  Channel,
  ChannelName,
  Competitor,
  CompetitorModuleAnalysis,
  CompetitiveAlert,
  CompetitiveTimelineEvent,
  EvidenceDiff,
  Feature,
  FeatureGapDetail,
  Insight,
  Job,
  JobType,
  LaunchSignal,
  ModuleAnalysisType,
  OwnedApp,
  PriceSignal,
  Priority,
  RatingSentimentSignal,
  Report,
  RequirementCandidate,
  SocialAuthConfig,
  SocialAuthPlatform,
  SocialAuthStatus,
  SocialPlatform,
  SocialSample,
  SocialSignalType,
  StoreMetadataSignal
} from "@aci/domain";
import { deletePath, fetchDashboardState, patchJson, postJson, triggerJob, type ApiStateResponse } from "./api";

type ViewKey =
  | "overview"
  | "portfolio"
  | "priorityRoadmap"
  | "opportunities"
  | "timeline"
  | "pricing"
  | "diffs"
  | "alerts"
  | "notificationRules"
  | "changeImpact"
  | "riskRegister"
  | "evidenceGraph"
  | "storeMetadata"
  | "ratingSentiment"
  | "asoKeywords"
  | "launchRadar"
  | "competitorRoadmap"
  | "strategyRadar"
  | "agentTasks"
  | "featureGapDetail"
  | "socialSamples"
  | "platformAuth"
  | "reviewAgenda"
  | "decisionBoard"
  | "prioritySimulator"
  | "executionBacklog"
  | "metricDictionary"
  | "evidenceQueue"
  | "knowledgeBase"
  | "competitorDetail"
  | "evidence"
  | "channels"
  | "coverageMap"
  | "insights"
  | "painRadar"
  | "features"
  | "requirementReview"
  | "roadmap"
  | "validation"
  | "engineeringReadiness"
  | "reportGate"
  | "deepReviewLab"
  | "marketMetrics"
  | "creativeAds"
  | "audienceSdk"
  | "integrations"
  | "requirements"
  | "reports";

type NavItem = { key: ViewKey; label: string; icon: typeof BarChart3 };

interface NavGroup {
  id: string;
  label: string;
  icon: typeof BarChart3;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: "workspace",
    label: "总览资产",
    icon: BarChart3,
    items: [
      { key: "overview", label: "概览", icon: BarChart3 },
      { key: "portfolio", label: "App 与竞品", icon: Settings2 },
      { key: "competitorDetail", label: "竞品详情", icon: Layers },
      { key: "channels", label: "渠道监控", icon: Search },
      { key: "coverageMap", label: "覆盖地图", icon: GitCompare }
    ]
  },
  {
    id: "monitor",
    label: "市场监控",
    icon: Clock,
    items: [
      { key: "timeline", label: "趋势时间线", icon: Clock },
      { key: "pricing", label: "价格会员", icon: CreditCard },
      { key: "diffs", label: "证据 Diff", icon: GitCompare },
      { key: "alerts", label: "告警中心", icon: Bell },
      { key: "notificationRules", label: "通知规则", icon: Bell },
      { key: "storeMetadata", label: "商店页", icon: Search },
      { key: "ratingSentiment", label: "评分口碑", icon: Star },
      { key: "asoKeywords", label: "ASO 关键词", icon: Tags },
      { key: "launchRadar", label: "发布雷达", icon: Rocket }
    ]
  },
  {
    id: "insight",
    label: "洞察证据",
    icon: MessageCircle,
    items: [
      { key: "insights", label: "评论洞察", icon: Layers },
      { key: "painRadar", label: "痛点雷达", icon: MessageCircle },
      { key: "features", label: "功能矩阵", icon: BarChart3 },
      { key: "featureGapDetail", label: "功能详情", icon: GitCompare },
      { key: "socialSamples", label: "社媒样本", icon: MessageCircle },
      { key: "platformAuth", label: "平台授权", icon: Settings2 },
      { key: "evidence", label: "证据中心", icon: ImageIcon },
      { key: "evidenceGraph", label: "引用图谱", icon: Search },
      { key: "knowledgeBase", label: "知识库问答", icon: Search }
    ]
  },
  {
    id: "strategy",
    label: "战略智能",
    icon: Target,
    items: [
      { key: "changeImpact", label: "影响链", icon: GitCompare },
      { key: "riskRegister", label: "风险登记", icon: Info },
      { key: "competitorRoadmap", label: "路线推测", icon: Rocket },
      { key: "strategyRadar", label: "战略雷达", icon: Target },
      { key: "agentTasks", label: "Agent 任务", icon: RefreshCw }
    ]
  },
  {
    id: "priority-expansion",
    label: "P0-P2 扩展",
    icon: Rocket,
    items: [
      { key: "deepReviewLab", label: "深度评审", icon: GitCompare },
      { key: "priorityRoadmap", label: "优先级蓝图", icon: Target },
      { key: "marketMetrics", label: "市场指标", icon: BarChart3 },
      { key: "creativeAds", label: "广告素材", icon: ImageIcon },
      { key: "audienceSdk", label: "受众 SDK", icon: Layers },
      { key: "integrations", label: "集成设置", icon: Settings2 }
    ]
  },
  {
    id: "execution",
    label: "决策执行",
    icon: Check,
    items: [
      { key: "opportunities", label: "机会雷达", icon: Target },
      { key: "reviewAgenda", label: "评审议程", icon: FileText },
      { key: "decisionBoard", label: "决策工作台", icon: Check },
      { key: "prioritySimulator", label: "优先级模拟", icon: BarChart3 },
      { key: "executionBacklog", label: "执行任务墙", icon: Check },
      { key: "metricDictionary", label: "指标字典", icon: BarChart3 },
      { key: "evidenceQueue", label: "补证队列", icon: Search },
      { key: "requirementReview", label: "需求评审", icon: Target },
      { key: "roadmap", label: "版本规划", icon: Rocket },
      { key: "validation", label: "上线验证", icon: Check },
      { key: "engineeringReadiness", label: "研发准备", icon: Layers },
      { key: "reportGate", label: "报告门禁", icon: FileText }
    ]
  },
  {
    id: "delivery",
    label: "交付沉淀",
    icon: FileText,
    items: [
      { key: "requirements", label: "需求池", icon: Check },
      { key: "reports", label: "周报", icon: FileText }
    ]
  }
];

const channelOptions: ChannelName[] = ["App Store China", "Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp", "Website", "Xiaohongshu", "Douyin", "Weibo", "Manual"];
const priorityOptions: Priority[] = ["P0", "P1", "P2"];
const socialPlatforms: SocialPlatform[] = ["xiaohongshu", "douyin", "weibo"];
const socialAuthPlatforms: SocialAuthPlatform[] = ["xiaohongshu", "douyin", "weibo"];
const socialSignalTypes: SocialSignalType[] = ["new_feature", "campaign", "pricing", "user_feedback", "brand_positioning", "template_trend"];
type StorePlatform = "ios" | "android";
const moduleAnalysisTypes: ModuleAnalysisType[] = ["growth", "traffic", "social", "product_performance", "ai_insight"];
const moduleAnalysisLabels: Record<ModuleAnalysisType, string> = {
  growth: "增长",
  traffic: "流量",
  social: "社媒",
  product_performance: "产品表现",
  ai_insight: "AI 洞察"
};

interface ModuleAnalysisView {
  summary: string;
  signals: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  evidenceIds: string[];
  confidence: number;
  dataCoverage: string[];
  source: "structured" | "fallback";
}

interface EvidenceRecord {
  id: string;
  ownerId: string;
  ownerName: string;
  sourceType: string;
  channelName: string;
  sourceUrl: string;
  rawExcerpt: string;
  capturedAt: string;
  screenshots: string[];
  snapshotCount: number;
  reviewCount: number;
}

type EvidenceCredibilityGrade = "strong" | "reviewable" | "weak" | "insufficient";
type EvidenceCredibilityDimensionKey = "source" | "traceability" | "visual" | "userSignal" | "crossCoverage" | "recency";

interface EvidenceCredibilityDimension {
  key: EvidenceCredibilityDimensionKey;
  label: string;
  score: number;
  summary: string;
}

interface EvidenceCredibilityProfile {
  evidenceId: string;
  score: number;
  grade: EvidenceCredibilityGrade;
  gradeLabel: string;
  verdict: string;
  dimensions: EvidenceCredibilityDimension[];
  missingEvidence: string[];
  usageAdvice: string;
}

interface EvidenceCoverageAudit {
  total: number;
  averageScore: number;
  strongCount: number;
  reviewableCount: number;
  weakCount: number;
  insufficientCount: number;
  iosCount: number;
  androidCount: number;
  reviewCount: number;
  socialCount: number;
  websiteCount: number;
  screenshotCount: number;
  sourceTypeCount: number;
  channelCount: number;
  gaps: string[];
}

interface KnowledgeEvidenceHit {
  record: EvidenceRecord;
  score: number;
  matchedTerms: string[];
}

interface KnowledgeAnswer {
  question: string;
  confidence: number;
  answer: string;
  findings: string[];
  risks: string[];
  nextActions: string[];
  evidenceHits: KnowledgeEvidenceHit[];
  missingEvidence: string[];
  reportSnippet: string;
}

type StrategicTheme = "ai_acceleration" | "monetization" | "content_growth" | "quality_experience" | "store_positioning" | "platform_channel";

interface StrategicSignal {
  id: string;
  sourceType: string;
  label: string;
  summary: string;
  evidenceIds: string[];
  capturedAt: string;
}

interface StrategicInference {
  id: string;
  ownerId: string;
  ownerName: string;
  theme: StrategicTheme;
  themeLabel: string;
  hypothesis: string;
  confidence: number;
  impact: "low" | "medium" | "high";
  stage: "observation" | "pattern" | "strategic_inference";
  sourceTypes: string[];
  evidenceIds: string[];
  signals: StrategicSignal[];
  counterSignals: string[];
  missingEvidence: string[];
  productImplication: string;
  recommendation: string;
  nextActions: string[];
  reportSnippet: string;
}

interface ExecutiveDecisionRow {
  priority: Priority;
  title: string;
  outcome: string;
  score: number;
  evidenceStrength: string;
  whyNow: string;
}

interface ExecutiveValidationRow {
  title: string;
  hypothesis: string;
  validation: string;
  engineeringHint: string;
  successMetric: string;
}

interface ExecutiveNoCopyRow {
  feature: string;
  reason: string;
  differentiation: string;
  validation: string;
}

interface ExecutiveReportBrief {
  title: string;
  summary: string[];
  decisionRows: ExecutiveDecisionRow[];
  strategyRows: StrategicInference[];
  validationRows: ExecutiveValidationRow[];
  noCopyRows: ExecutiveNoCopyRow[];
  evidenceIds: string[];
  evidenceScore: number;
  evidenceGaps: string[];
  markdown: string;
}

type AgentTaskCategory = "collection" | "analysis" | "reporting";
type AgentTaskHealth = "healthy" | "warning" | "blocked";

interface ResearchAgentTask {
  id: string;
  name: string;
  category: AgentTaskCategory;
  description: string;
  schedule: string;
  status: string;
  health: AgentTaskHealth;
  readinessScore: number;
  coverage: string;
  lastRunAt?: string;
  nextRunText: string;
  linkedJobType: JobType;
  blockers: string[];
  outputs: string[];
  evidenceIds: string[];
}

type NotificationRuleTrigger =
  | "channel_failure"
  | "price_change"
  | "rating_risk"
  | "high_impact_decision"
  | "strategy_shift"
  | "evidence_gap"
  | "agent_blocked"
  | "report_risk"
  | "social_fetch_failure"
  | "launch_signal";

type NotificationRuleChannel = "in_app" | "email" | "feishu" | "webhook";

interface NotificationRuleMatch {
  id: string;
  ruleId: string;
  title: string;
  summary: string;
  severity: CompetitiveAlert["severity"];
  source: string;
  evidenceIds: string[];
  createdAt: string;
  recommendedAction: string;
}

interface NotificationRule {
  id: string;
  name: string;
  trigger: NotificationRuleTrigger;
  description: string;
  enabled: boolean;
  severity: CompetitiveAlert["severity"];
  threshold: string;
  channels: NotificationRuleChannel[];
  ownerRole: ActionRecommendation["ownerRole"];
  cadence: string;
  matches: NotificationRuleMatch[];
  evidenceIds: string[];
  lastMatchedAt?: string;
}

type PriorityImplementationStatus = "ready" | "partial" | "blocked";

interface PriorityImplementationSection {
  priority: Priority;
  title: string;
  summary: string;
  status: PriorityImplementationStatus;
  score: number;
  owner: ActionRecommendation["ownerRole"];
  coreViews: string[];
  evidenceIds: string[];
  blockers: string[];
  nextActions: string[];
  acceptance: string[];
}

interface MarketMetricRow {
  id: string;
  ownerId: string;
  ownerName: string;
  priority: Priority;
  rating?: number;
  reviewCount: number;
  priceText: string;
  channelCoverage: string;
  proxyScore: number;
  dataStatus: "available" | "manual" | "missing";
  nextData: string;
  pmUse: string;
  limitation: string;
  evidenceIds: string[];
}

interface CreativeAdSignal {
  id: string;
  ownerName: string;
  theme: string;
  source: string;
  angle: string;
  confidence: number;
  status: "evidence" | "candidate" | "missing";
  gap: string;
  pmAction: string;
  evidenceIds: string[];
}

interface AudienceSdkSignal {
  id: string;
  category: "audience" | "retention" | "sdk" | "privacy";
  title: string;
  ownerName: string;
  confidence: number;
  currentStatus: "supported" | "partial" | "needs_source";
  dataNeeded: string;
  pmUse: string;
  risk: string;
  evidenceIds: string[];
}

interface IntegrationCapability {
  id: string;
  name: string;
  priority: Priority;
  owner: ActionRecommendation["ownerRole"];
  status: "ready" | "mocked" | "blocked";
  trigger: string;
  payload: string[];
  downstream: string;
  nextStep: string;
  evidenceIds: string[];
}

type FlowStepKey = "entry" | "steps" | "login" | "payment" | "example" | "undo" | "save" | "failure";
type StandardTestAssetId = "portrait" | "night" | "passerby" | "product" | "id_photo" | "group_photo";

interface FeatureFlowCell {
  ownerId: string;
  ownerName: string;
  ownerType: "owned_app" | "competitor";
  support: Feature["currentAppSupport"];
  entryPosition: string;
  clickSteps: number;
  loginRequired: string;
  paymentRule: string;
  hasExample: string;
  undoSupport: string;
  saveExport: string;
  failurePrompt: string;
  score: number;
  verdict: string;
  screenshots: string[];
  evidenceIds: string[];
}

interface StandardTestAsset {
  id: StandardTestAssetId;
  name: string;
  scenario: string;
  imageBrief: string;
  checks: string[];
}

interface StandardTestResult {
  assetId: StandardTestAssetId;
  ownerName: string;
  effectScore: number;
  latencyText: string;
  paymentText: string;
  exportQuality: string;
  failureRisk: string;
  verdict: string;
  evidenceIds: string[];
}

interface FeaturePriorityDetail {
  feature: Feature;
  record: FeatureComparisonRecord;
  userValue: number;
  competitorCoverage: number;
  appGap: number;
  engineeringCost: number;
  monetizationPotential: number;
  evidenceStrength: number;
  totalScore: number;
  nextVersionAdvice: string;
}

interface PaymentExperienceRow {
  ownerName: string;
  entry: string;
  price: string;
  creditName: string;
  quota: string;
  consumption: string;
  refund: string;
  failureCompensation: string;
  clarityScore: number;
  evidenceIds: string[];
}

interface ReviewDeviceCrossCheck {
  id: string;
  topic: string;
  userQuote: string;
  deviceEvidence: string;
  linkedFeature: string;
  conclusion: string;
  risk: "low" | "medium" | "high";
  action: string;
  evidenceIds: string[];
}

interface OwnBehaviorIntegrationSignal {
  id: string;
  eventName: string;
  question: string;
  currentStatus: "missing" | "defined" | "needs_backend";
  funnelDropHypothesis: string;
  dataNeeded: string[];
  owner: ActionRecommendation["ownerRole"];
}

interface VersionBattleReport {
  title: string;
  summary: string[];
  rows: Array<{
    ownerName: string;
    change: string;
    missingForOwnApp: string;
    hypeOrWorth: string;
    suggestedSchedule: string;
    evidenceIds: string[];
  }>;
  markdown: string;
  evidenceIds: string[];
}

interface RunActionOptions {
  successMessage?: (response: ApiStateResponse) => string;
}

interface ActionNotice {
  text: string;
  tone: "success" | "info";
}

type MaturityLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";

interface FeatureDecisionInsight {
  maturityLevel: MaturityLevel;
  competitorMaturityLevel: MaturityLevel;
  maturityGap: number;
  persuasivenessScore: number;
  evidenceStrength: string;
  journey: string;
  monetizationBoundary: string;
  ifDo: string;
  ifNotDo: string;
  whyNotCopy: string;
  mvpScope: string;
  validationPlan: string;
}

type RequirementReadiness = "ready" | "needs_evidence" | "needs_scope" | "observe";
type RequirementReviewSource = "requirement" | "recommendation";
type RoadmapLane = "this_week" | "next_version" | "evidence_needed" | "watch";
type ProductDecisionOutcome = "commit" | "scope" | "evidence" | "watch";
type ReleaseValidationStage = "instrumentation" | "gray_release" | "success_review" | "blocked";
type ValidationChecklistStatus = "ready" | "required" | "missing";
type EngineeringReadinessStage = "ready_to_scope" | "needs_design" | "needs_data" | "needs_risk_review" | "blocked";
type EngineeringDomain = "client" | "server" | "ai" | "data" | "qa" | "design" | "content" | "compliance";
type EngineeringDependencyStatus = "ready" | "needs_review" | "blocked";
type PriorityWeightKey =
  | "competitorPressure"
  | "userDemand"
  | "evidenceConfidence"
  | "businessImpact"
  | "engineeringEfficiency"
  | "strategicFit"
  | "monetizationPotential";
type RiskRegisterArea = "evidence" | "engineering" | "market" | "channel" | "social" | "report" | "strategy" | "validation";
type RiskRegisterStatus = "open" | "mitigating" | "watch";
type UserPainCategory = "quality" | "pricing" | "ai" | "template" | "usability" | "performance" | "content" | "other";
type ReviewAgendaSection = "decision" | "risk" | "pain" | "engineering" | "evidence" | "followup";
type CoverageDimension = "ios" | "android" | "website" | "reviews" | "social" | "price" | "feature" | "report";
type CoverageStatus = "strong" | "partial" | "missing";

interface RequirementReviewPackage {
  id: string;
  source: RequirementReviewSource;
  sourceId: string;
  title: string;
  priorityHint: Priority;
  score: number;
  readiness: RequirementReadiness;
  status: string;
  evidenceIds: string[];
  competitorText: string;
  featureText: string;
  problem: string;
  whyNow: string;
  recommendation: string;
  implementationHint: string;
  successMetric: string;
  mvpScope: string;
  validationPlan: string;
  prdNotes: string;
  ownerRole?: ActionRecommendation["ownerRole"];
  area?: ActionRecommendation["area"];
  actionType?: ActionRecommendation["actionType"];
}

interface RoadmapItem {
  packageItem: RequirementReviewPackage;
  lane: RoadmapLane;
  releaseFitScore: number;
  engineeringRisk: "low" | "medium" | "high";
  decisionReason: string;
  entryCondition: string;
}

interface DecisionEvidenceCoverage {
  total: number;
  ios: number;
  android: number;
  social: number;
  review: number;
  website: number;
  screenshots: number;
}

interface DecisionEvidenceGap {
  title: string;
  detail: string;
  action: string;
  owner: ActionRecommendation["ownerRole"];
  severity: "low" | "medium" | "high";
}

interface DecisionExperimentItem {
  metric: string;
  eventName: string;
  successDefinition: string;
  owner: ActionRecommendation["ownerRole"];
}

interface ProductDecisionBrief {
  id: string;
  packageItem: RequirementReviewPackage;
  roadmapItem: RoadmapItem;
  featureRecord?: FeatureComparisonRecord;
  outcome: ProductDecisionOutcome;
  outcomeLabel: string;
  decisionTitle: string;
  targetUser: string;
  evidenceCoverage: DecisionEvidenceCoverage;
  evidenceGaps: DecisionEvidenceGap[];
  experiments: DecisionExperimentItem[];
  prdMarkdown: string;
  reportSnippet: string;
  releaseGate: string;
}

interface ReleaseValidationMetricPlan extends DecisionExperimentItem {
  baseline: string;
  target: string;
  reviewWindow: string;
  risk: "low" | "medium" | "high";
}

interface ReleaseValidationChecklistItem {
  id: string;
  title: string;
  owner: ActionRecommendation["ownerRole"];
  status: ValidationChecklistStatus;
  detail: string;
}

interface ReleaseValidationPlan {
  id: string;
  brief: ProductDecisionBrief;
  stage: ReleaseValidationStage;
  confidenceScore: number;
  releaseWindow: string;
  hypothesis: string;
  decisionGate: string;
  stageReason: string;
  metrics: ReleaseValidationMetricPlan[];
  checklist: ReleaseValidationChecklistItem[];
  risks: DecisionEvidenceGap[];
  evidenceIds: string[];
}

interface EngineeringDependency {
  id: string;
  domain: EngineeringDomain;
  title: string;
  owner: ActionRecommendation["ownerRole"];
  status: EngineeringDependencyStatus;
  detail: string;
}

interface EngineeringQaCheck {
  id: string;
  title: string;
  risk: "low" | "medium" | "high";
  acceptance: string;
}

interface EngineeringReadinessPlan {
  id: string;
  validationPlan: ReleaseValidationPlan;
  stage: EngineeringReadinessStage;
  readinessScore: number;
  devStartGate: string;
  implementationSummary: string;
  dependencyMap: EngineeringDependency[];
  dataContracts: EngineeringDependency[];
  qaChecks: EngineeringQaCheck[];
  openQuestions: string[];
  rolloutPlan: string[];
  evidenceIds: string[];
}

type PrioritySimulationWeights = Record<PriorityWeightKey, number>;

interface PrioritySimulationResult {
  id: string;
  brief: ProductDecisionBrief;
  totalScore: number;
  componentScores: Record<PriorityWeightKey, number>;
  recommendation: string;
  tradeoffs: string[];
  nextStep: string;
}

interface RiskRegisterItem {
  id: string;
  area: RiskRegisterArea;
  title: string;
  severity: "low" | "medium" | "high";
  status: RiskRegisterStatus;
  owner: ActionRecommendation["ownerRole"];
  source: string;
  summary: string;
  mitigation: string;
  nextCheck: string;
  evidenceIds: string[];
}

interface UserPainTheme {
  id: string;
  category: UserPainCategory;
  title: string;
  severity: "low" | "medium" | "high";
  frequencyScore: number;
  sentimentScore: number;
  impactedOwners: string[];
  summary: string;
  userQuotes: string[];
  socialSignals: string[];
  relatedFeatures: string[];
  recommendation: string;
  owner: ActionRecommendation["ownerRole"];
  evidenceIds: string[];
}

interface ReviewAgendaItem {
  id: string;
  section: ReviewAgendaSection;
  title: string;
  priority: Priority;
  owner: ActionRecommendation["ownerRole"];
  timeboxMinutes: number;
  decisionNeeded: string;
  preRead: string;
  action: string;
  evidenceIds: string[];
}

interface CoverageCell {
  dimension: CoverageDimension;
  label: string;
  status: CoverageStatus;
  score: number;
  detail: string;
  nextAction: string;
  evidenceIds: string[];
}

interface CoverageOwnerRow {
  ownerId: string;
  ownerName: string;
  ownerType: "owned_app" | "competitor";
  priority?: Priority;
  cells: CoverageCell[];
  totalScore: number;
  blockers: string[];
}

type ChangeImpactSource = "launch" | "price" | "metadata" | "rating" | "strategy" | "risk";
type ChangeImpactStage = "execute" | "review" | "monitor" | "blocked";

interface ChangeImpactTrace {
  id: string;
  sourceType: ChangeImpactSource;
  sourceLabel: string;
  ownerId: string;
  ownerName: string;
  title: string;
  summary: string;
  severity: "low" | "medium" | "high";
  stage: ChangeImpactStage;
  impactScore: number;
  confidenceScore: number;
  capturedAt: string;
  evidenceIds: string[];
  relatedFeatures: FeatureComparisonRecord[];
  relatedDecisions: ProductDecisionBrief[];
  relatedValidationPlans: ReleaseValidationPlan[];
  relatedEngineeringPlans: EngineeringReadinessPlan[];
  relatedRisks: RiskRegisterItem[];
  nextActions: string[];
  missingEvidence: string[];
  reportSnippet: string;
}

type CitationClaimSource = "decision" | "strategy" | "risk" | "feature" | "validation" | "report";
type CitationClaimStatus = "ready" | "reviewable" | "weak" | "unsupported";

interface EvidenceCitationClaim {
  id: string;
  source: CitationClaimSource;
  title: string;
  claim: string;
  owner: ActionRecommendation["ownerRole"];
  supportScore: number;
  status: CitationClaimStatus;
  evidenceIds: string[];
  sourceCount: number;
  platformCount: number;
  screenshotCount: number;
  reviewCount: number;
  staleCount: number;
  missingEvidence: string[];
  nextAction: string;
}

type RoadmapHorizon = "now" | "next" | "later";

interface CompetitorRoadmapBet {
  id: string;
  theme: StrategicTheme;
  themeLabel: string;
  title: string;
  horizon: RoadmapHorizon;
  confidence: number;
  reason: string;
  likelyMoves: string[];
  productResponse: string;
  evidenceIds: string[];
  missingEvidence: string[];
}

interface CompetitorRoadmapHypothesis {
  ownerId: string;
  ownerName: string;
  priority?: Priority;
  confidence: number;
  summary: string;
  bets: CompetitorRoadmapBet[];
  responsePlan: string[];
  blockers: string[];
  evidenceIds: string[];
}

type ReportGateStatus = "pass" | "review" | "blocked";

interface ReportQualityCheck {
  id: string;
  title: string;
  status: ReportGateStatus;
  score: number;
  detail: string;
  owner: ActionRecommendation["ownerRole"];
  action: string;
  evidenceIds: string[];
}

interface ReportQualityGate {
  score: number;
  status: ReportGateStatus;
  verdict: string;
  checks: ReportQualityCheck[];
  blockers: string[];
  exportChecklist: string[];
  evidenceIds: string[];
  reportSnippet: string;
}

type ExecutionBacklogSource = "opportunity" | "feature" | "decision" | "validation" | "engineering" | "risk" | "impact" | "pain" | "report_gate";
type ExecutionBacklogLane = "this_week" | "next_version" | "needs_evidence" | "needs_scope" | "blocked" | "watch";

interface ExecutionBacklogItem {
  id: string;
  source: ExecutionBacklogSource;
  sourceLabel: string;
  title: string;
  owner: ActionRecommendation["ownerRole"];
  priority: Priority;
  lane: ExecutionBacklogLane;
  score: number;
  readiness: RequirementReadiness | "blocked";
  reason: string;
  nextStep: string;
  scope: string;
  acceptance: string[];
  risk: "low" | "medium" | "high";
  evidenceIds: string[];
}

interface MetricDictionaryItem {
  id: string;
  title: string;
  eventName: string;
  owner: ActionRecommendation["ownerRole"];
  source: string;
  priority: Priority;
  risk: "low" | "medium" | "high";
  baseline: string;
  target: string;
  reviewWindow: string;
  successDefinition: string;
  implementationNote: string;
  missingFields: string[];
  evidenceIds: string[];
}

type EvidenceCollectionStatus = "missing" | "weak" | "stale" | "manual";

interface EvidenceCollectionTask {
  id: string;
  title: string;
  owner: ActionRecommendation["ownerRole"];
  priority: Priority;
  status: EvidenceCollectionStatus;
  score: number;
  source: string;
  reason: string;
  platform: string;
  evidenceType: string;
  nextAction: string;
  relatedObject: string;
  evidenceIds: string[];
}

type FeatureComparisonDimension =
  | "competitorPressure"
  | "currentGap"
  | "userDemand"
  | "evidenceConfidence"
  | "businessImpact"
  | "implementationRisk";

interface FeatureDimensionScore {
  key: FeatureComparisonDimension;
  label: string;
  score: number;
  summary: string;
}

interface FeatureCapabilitySnapshot {
  ownerId: string;
  ownerName: string;
  support: Feature["currentAppSupport"];
  maturityLevel: MaturityLevel;
  capabilityScore: number;
  evidenceCount: number;
  reviewQuoteCount: number;
  socialEvidenceCount: number;
  channelCount: number;
  verdict: string;
  copyableParts: string;
  riskNotes: string;
  nextEvidence: string;
}

interface FeatureExecutionTask {
  id: string;
  title: string;
  priorityHint: Priority;
  ownerRole: ActionRecommendation["ownerRole"];
  score: number;
  readiness: RequirementReadiness;
  objective: string;
  whyNow: string;
  scope: string;
  implementationSteps: string[];
  acceptance: string[];
  evidenceIds: string[];
  risk: "low" | "medium" | "high";
}

interface FeatureComparisonRecord {
  feature: Feature;
  detail?: FeatureGapDetail;
  insight: FeatureDecisionInsight;
  ownSnapshot: FeatureCapabilitySnapshot;
  competitorSnapshots: FeatureCapabilitySnapshot[];
  bestCompetitor?: FeatureCapabilitySnapshot;
  dimensionScores: FeatureDimensionScore[];
  decisionGrade: string;
  modelScore: number;
  modelSummary: string;
  taskCards: FeatureExecutionTask[];
}

function competitorName(data: ApiStateResponse, competitorId?: string): string {
  if (!competitorId) {
    return data.state.currentOwnedApp?.name ?? "自有 App";
  }
  return data.state.competitors.find((competitor) => competitor.id === competitorId)?.name ?? competitorId;
}

function ownerLabel(data: ApiStateResponse, channel: Channel): string {
  if (channel.ownerType === "owned_app") {
    return data.state.currentOwnedApp?.name ?? "自有 App";
  }
  return competitorName(data, channel.ownerId);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Queued: "排队中",
    Running: "执行中",
    Active: "启用",
    Archived: "归档",
    Deleted: "删除",
    Incomplete: "未完成",
    New: "新洞察",
    Confirmed: "已确认",
    Dismissed: "已忽略",
    Converted: "已转需求",
    Draft: "草稿",
    ToReview: "待评审",
    Accepted: "已采纳",
    Deferred: "暂缓",
    Rejected: "已拒绝",
    Reviewed: "已审阅",
    Sent: "已发送",
    Failed: "失败",
    Succeeded: "成功",
    PartialSucceeded: "部分成功",
    Canceled: "已取消",
    ManualOnly: "手动样本",
    NotConfigured: "未配置",
    Configured: "已配置",
    AuthorizationUrlReady: "授权链接已生成",
    PendingTokenExchange: "待换取 token",
    Authorized: "已授权",
    TokenExpired: "token 过期",
    Open: "待处理",
    Planned: "已计划"
  };
  return map[status] ?? status;
}

function jobTypeLabel(type: JobType): string {
  const map: Record<JobType, string> = {
    crawl: "采集",
    analyze: "分析",
    report: "周报"
  };
  return map[type];
}

function actionLabel(label: string): string {
  const map: Record<string, string> = {
    crawl: "采集",
    analyze: "分析",
    report: "周报"
  };
  return map[label] ?? label;
}

function jobTimestamp(job: Job): string {
  return job.finishedAt ?? job.startedAt ?? job.createdAt;
}

function latestJobForType(data: ApiStateResponse, type: JobType): Job | undefined {
  return [...data.state.jobs]
    .filter((job) => job.type === type)
    .sort((left, right) => jobTimestamp(right).localeCompare(jobTimestamp(left)))[0];
}

function jobResultMessage(data: ApiStateResponse, type: JobType): string {
  const job = latestJobForType(data, type);
  if (!job) {
    return `${jobTypeLabel(type)}任务已提交`;
  }
  return `${jobTypeLabel(type)}${statusLabel(job.state)}：${job.userMessage}`;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function splitUrlList(value: string): string[] {
  return value
    .split(/[\n,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function channelRequiresUrl(channelName: ChannelName): boolean {
  return channelName === "App Store China" || channelName === "Website";
}

function channelCollectionMode(channelName: ChannelName): Channel["collectionMode"] {
  return channelName === "App Store China" ? "automatic" : "manual";
}

function channelComplianceStatus(channelName: ChannelName): Channel["complianceStatus"] {
  return channelName === "App Store China" ? "approved" : "pending";
}

function channelOwnerOptions(data: ApiStateResponse): Array<{ id: string; type: Channel["ownerType"]; label: string }> {
  const activeApp = data.state.currentOwnedApp;
  return activeApp
    ? [
        { id: activeApp.id, type: "owned_app", label: activeApp.name },
        ...data.state.competitors.map((competitor) => ({ id: competitor.id, type: "competitor" as const, label: competitor.name }))
      ]
    : [];
}

function channelLink(channel: Channel): JSX.Element | string {
  if (!channel.storeUrl) {
    return channel.channelName;
  }
  return (
    <a href={channel.storeUrl} target="_blank" rel="noreferrer">
      {channel.channelName}
    </a>
  );
}

function channelsForOwner(data: ApiStateResponse, ownerId?: string): Channel[] {
  return ownerId ? data.state.channels.filter((channel) => channel.ownerId === ownerId) : [];
}

function supportLabel(support: Feature["currentAppSupport"]): string {
  const map: Record<Feature["currentAppSupport"], string> = {
    owned: "已具备",
    missing: "缺失",
    partial: "部分具备",
    advantage: "优势",
    unknown: "未知"
  };
  return map[support];
}

function normalizeFeatures(features: Feature[]): Feature[] {
  const byName = new Map<string, Feature>();
  features.forEach((feature) => {
    const existing = byName.get(feature.name);
    if (!existing) {
      byName.set(feature.name, feature);
      return;
    }
    const keepExistingManual = existing.source === "user_confirmed" || existing.source === "user_edited";
    const keepIncomingManual = feature.source === "user_confirmed" || feature.source === "user_edited";
    byName.set(feature.name, {
      ...(keepExistingManual && !keepIncomingManual ? existing : feature),
      competitorSupport: { ...existing.competitorSupport, ...feature.competitorSupport },
      demandScore: Math.max(existing.demandScore, feature.demandScore),
      updatedAt: existing.updatedAt > feature.updatedAt ? existing.updatedAt : feature.updatedAt
    });
  });
  return Array.from(byName.values()).sort((left, right) => right.demandScore - left.demandScore);
}

function featureDecision(feature: Feature): "gap" | "advantage" | "watch" | "improve" {
  const competitorValues = Object.values(feature.competitorSupport);
  const competitorOwnedCount = competitorValues.filter((value) => value === "owned" || value === "advantage").length;
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

function featureDecisionLabel(feature: Feature): string {
  const decision = featureDecision(feature);
  if (decision === "gap") {
    return "明显差距";
  }
  if (decision === "improve") {
    return "待补强";
  }
  if (decision === "advantage") {
    return "当前优势";
  }
  return "继续观察";
}

function featureAction(feature: Feature): string {
  const decision = featureDecision(feature);
  if (decision === "gap") {
    return feature.demandScore >= 80 ? "进入需求池，先做方案评估" : "补充证据后再排期";
  }
  if (decision === "improve") {
    return "对比竞品入口和表达，做小范围优化";
  }
  if (decision === "advantage") {
    return "强化商店页和周报卖点表达";
  }
  return "持续监控评论和版本变化";
}

function maturityLevelScore(level: MaturityLevel): number {
  return Number(level.slice(1));
}

function maturityLabel(level: MaturityLevel): string {
  const labels: Record<MaturityLevel, string> = {
    L0: "L0 未发现",
    L1: "L1 功能点",
    L2: "L2 有入口",
    L3: "L3 闭环体验",
    L4: "L4 商业化包装",
    L5: "L5 运营增长闭环"
  };
  return labels[level];
}

function maturityLevelForSupport(support: Feature["currentAppSupport"], evidenceCount = 0, reviewQuoteCount = 0, socialEvidenceCount = 0): MaturityLevel {
  let base = 0;
  if (support === "partial") {
    base = 2;
  } else if (support === "owned") {
    base = 3;
  } else if (support === "advantage") {
    base = 4;
  } else if (support === "unknown" && evidenceCount > 0) {
    base = 1;
  }
  if (base > 0 && evidenceCount >= 3 && reviewQuoteCount > 0) {
    base += 1;
  }
  if (base > 0 && socialEvidenceCount > 0) {
    base += 1;
  }
  return `L${Math.min(base, 5)}` as MaturityLevel;
}

function featureJourney(featureName: string, category: string): string {
  const text = `${featureName} ${category}`;
  if (/会员|订阅|价格|权益|付费/.test(text)) {
    return "触发权益 -> 解释价值 -> 支付 / 试用 -> 导出结果";
  }
  if (/AI|智能|生成|写真|头像|模板/.test(text)) {
    return "发现入口 -> 选择风格 -> 生成结果 -> 保存 / 分享";
  }
  if (/拍照|相机|美颜|夜景|启动/.test(text)) {
    return "启动相机 -> 拍摄 -> 美化 -> 保存";
  }
  if (/导出|分享|保存|高清|水印/.test(text)) {
    return "完成作品 -> 选择清晰度 -> 导出 -> 分享";
  }
  return "发现入口 -> 使用功能 -> 看到结果 -> 复用";
}

function featureMonetizationBoundary(featureName: string, category: string): string {
  const text = `${featureName} ${category}`;
  if (/会员|订阅|价格|权益/.test(text)) {
    return "会员权益、试用、连续包月和价格解释";
  }
  if (/AI|写真|生成|模板/.test(text)) {
    return "免费次数、AI 点数、会员模板和高清导出";
  }
  if (/导出|高清|水印/.test(text)) {
    return "高清导出、水印、保存质量和会员触发点";
  }
  return "免费边界、会员专属能力和结果页转化点";
}

function featureWhyNotCopy(feature: Feature): string {
  const text = `${feature.name} ${feature.category}`;
  if (/AI|模板|写真/.test(text)) {
    return "模板数量不是唯一壁垒，直接复制会带来内容供给、质量审核和生成成本压力。";
  }
  if (/会员|订阅|价格|导出/.test(text)) {
    return "竞品付费墙触发时机不一定适合当前 App，需要先验证用户是价格敏感还是权益理解不足。";
  }
  if (/拍照|美颜|滤镜/.test(text)) {
    return "影像风格和用户审美差异明显，应保留当前 App 的美颜调性和拍照效率优势。";
  }
  return "竞品方案只能作为证据输入，最终范围必须匹配当前 App 定位、用户路径和研发成本。";
}

function featureMvpScope(feature: Feature): string {
  const decision = featureDecision(feature);
  if (decision === "gap") {
    return "先补入口、核心流程、结果页和基础埋点，不一次性复制全部高级能力。";
  }
  if (decision === "improve") {
    return "保留现有能力，优先优化入口曝光、路径步骤、权益说明和异常状态。";
  }
  if (decision === "advantage") {
    return "不扩功能范围，优先强化商店页表达、首日引导和周报卖点。";
  }
  return "先补截图、评论和渠道证据，再决定是否进入需求池。";
}

function featureValidationPlan(feature: Feature): string {
  const text = `${feature.name} ${feature.category}`;
  if (/AI|模板|写真/.test(text)) {
    return "观察入口点击率、生成完成率、保存 / 分享率、会员页点击率和 AI 相关负评变化。";
  }
  if (/会员|订阅|价格|导出/.test(text)) {
    return "观察权益页点击、试用转化、支付页退出、高清导出完成率和付费负评占比。";
  }
  if (/拍照|相机|美颜/.test(text)) {
    return "观察冷启动耗时、首张照片完成率、保存率和拍照体验负评占比。";
  }
  return "观察功能入口点击、核心流程完成、保存 / 复用行为和相关评论主题变化。";
}

function featureDecisionInsight(feature: Feature, detail?: FeatureGapDetail): FeatureDecisionInsight {
  const competitorDetails = detail?.competitorDetails ?? [];
  const ownEvidenceCount = detail?.ownEvidenceIds.length ?? 0;
  const ownMaturity = maturityLevelForSupport(feature.currentAppSupport, ownEvidenceCount, 0, detail?.socialEvidenceIds.length ?? 0);
  const competitorMaturity = competitorDetails.reduce<MaturityLevel>((highest, competitorDetail) => {
    const level = maturityLevelForSupport(
      competitorDetail.support,
      competitorDetail.evidenceIds.length,
      competitorDetail.reviewQuotes.length,
      competitorDetail.socialEvidenceIds.length
    );
    return maturityLevelScore(level) > maturityLevelScore(highest) ? level : highest;
  }, "L0");
  const competitorCoveredCount = Object.values(feature.competitorSupport).filter((support) => support === "owned" || support === "advantage" || support === "partial").length;
  const evidenceCount = detail?.totalEvidenceCount ?? ownEvidenceCount + competitorDetails.reduce((sum, item) => sum + item.evidenceIds.length + item.socialEvidenceIds.length, 0);
  const reviewQuoteCount = competitorDetails.reduce((sum, item) => sum + item.reviewQuotes.length, 0);
  const competitorCoverageScore = dataSafeRatio(competitorCoveredCount, Math.max(Object.keys(feature.competitorSupport).length, 1)) * 15;
  const evidenceScore = Math.min(25, evidenceCount * 4 + reviewQuoteCount * 2);
  const demandScore = Math.min(20, feature.demandScore * 0.2);
  const appGapScore = feature.currentAppSupport === "missing" ? 15 : feature.currentAppSupport === "partial" ? 11 : feature.currentAppSupport === "advantage" ? 8 : 5;
  const strategicScore = /AI|模板|会员|拍照|美颜|导出/.test(`${feature.name} ${feature.category}`) ? 10 : 7;
  const businessScore = /会员|价格|导出|AI|分享|模板/.test(`${feature.name} ${feature.category}`) ? 9 : 6;
  const riskScore = feature.source === "ai" ? 3 : 5;
  const persuasivenessScore = Math.round(evidenceScore + demandScore + competitorCoverageScore + appGapScore + strategicScore + businessScore + riskScore);
  const maturityGap = Math.max(0, maturityLevelScore(competitorMaturity) - maturityLevelScore(ownMaturity));

  return {
    maturityLevel: ownMaturity,
    competitorMaturityLevel: competitorMaturity,
    maturityGap,
    persuasivenessScore: Math.min(100, persuasivenessScore),
    evidenceStrength: evidenceCount >= 8 ? "强证据" : evidenceCount >= 4 ? "中证据" : evidenceCount > 0 ? "弱证据" : "待补证据",
    journey: featureJourney(feature.name, feature.category),
    monetizationBoundary: featureMonetizationBoundary(feature.name, feature.category),
    ifDo: featureDecision(feature) === "advantage" ? "能把现有优势转成更清晰的商店页和首日体验卖点。" : "能缩小竞品成熟度差距，并为下个版本提供可验证的体验改进。",
    ifNotDo: maturityGap >= 2 ? "竞品会继续扩大入口、体验和商业化包装差距，后续补齐成本更高。" : "短期风险可控，但需要继续观察评论和渠道证据。",
    whyNotCopy: featureWhyNotCopy(feature),
    mvpScope: featureMvpScope(feature),
    validationPlan: featureValidationPlan(feature)
  };
}

function supportScore(support: Feature["currentAppSupport"]): number {
  const scores: Record<Feature["currentAppSupport"], number> = {
    advantage: 90,
    owned: 76,
    partial: 48,
    unknown: 22,
    missing: 0
  };
  return scores[support];
}

function capabilityScoreFor(
  support: Feature["currentAppSupport"],
  maturityLevel: MaturityLevel,
  evidenceCount: number,
  reviewQuoteCount: number,
  socialEvidenceCount: number
): number {
  return Math.min(
    100,
    Math.round(
      supportScore(support) * 0.46 +
        maturityLevelScore(maturityLevel) * 9 +
        Math.min(18, evidenceCount * 4) +
        Math.min(10, reviewQuoteCount * 2) +
        Math.min(8, socialEvidenceCount * 3)
    )
  );
}

function featureCopyableParts(feature: Feature): string {
  const text = `${feature.name} ${feature.category}`;
  if (/AI|模板|写真|生成/.test(text)) {
    return "入口位置、风格分类、生成后保存 / 分享路径、失败态说明。";
  }
  if (/会员|订阅|价格|权益|导出/.test(text)) {
    return "权益解释、付费墙触发时机、试用表达、高清导出提示。";
  }
  if (/拍照|相机|美颜|滤镜/.test(text)) {
    return "入口效率、默认参数、前后对比表达、保存路径。";
  }
  return "入口表达、流程步骤、结果态、帮助文案和埋点口径。";
}

function featureRiskNotes(feature: Feature): string {
  const text = `${feature.name} ${feature.category}`;
  if (/AI|生成|写真|模板/.test(text)) {
    return "重点确认生成质量、成本、审核和失败兜底，避免只补入口。";
  }
  if (/会员|订阅|价格|导出/.test(text)) {
    return "重点确认商业化收益、用户反感和价格解释，避免直接降价或强弹窗。";
  }
  if (/同步|账号|跨端|云/.test(text)) {
    return "重点确认账号、数据一致性、恢复能力和跨端兼容成本。";
  }
  return "重点确认入口优先级、研发成本和是否符合当前 App 定位。";
}

function nextEvidenceForSnapshot(snapshot: FeatureCapabilitySnapshot): string {
  if (snapshot.evidenceCount < 2) {
    return "补商店页截图、更新日志或官网链接";
  }
  if (snapshot.reviewQuoteCount === 0) {
    return "补用户评论样本";
  }
  if (snapshot.socialEvidenceCount === 0) {
    return "补小红书 / 抖音 / 微博样本";
  }
  return "证据可进入评审，后续补实测截图";
}

function buildFeatureCapabilitySnapshot(input: {
  ownerId: string;
  ownerName: string;
  support: Feature["currentAppSupport"];
  maturityLevel: MaturityLevel;
  evidenceCount: number;
  reviewQuoteCount: number;
  socialEvidenceCount: number;
  channelCount: number;
  feature: Feature;
}): FeatureCapabilitySnapshot {
  const capabilityScore = capabilityScoreFor(
    input.support,
    input.maturityLevel,
    input.evidenceCount,
    input.reviewQuoteCount,
    input.socialEvidenceCount
  );
  const snapshot: FeatureCapabilitySnapshot = {
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    support: input.support,
    maturityLevel: input.maturityLevel,
    capabilityScore,
    evidenceCount: input.evidenceCount,
    reviewQuoteCount: input.reviewQuoteCount,
    socialEvidenceCount: input.socialEvidenceCount,
    channelCount: input.channelCount,
    verdict:
      input.support === "advantage"
        ? "优势明显"
        : input.support === "owned"
          ? "能力完整"
          : input.support === "partial"
            ? "体验不完整"
            : input.support === "missing"
              ? "公开证据缺失"
              : "待确认",
    copyableParts: featureCopyableParts(input.feature),
    riskNotes: featureRiskNotes(input.feature),
    nextEvidence: ""
  };
  return { ...snapshot, nextEvidence: nextEvidenceForSnapshot(snapshot) };
}

function dimensionTone(score: number, inverse = false): "low" | "medium" | "high" {
  const normalized = inverse ? 100 - score : score;
  return persuasivenessTone(normalized);
}

function featureComparisonDecisionGrade(feature: Feature, insight: FeatureDecisionInsight, dimensions: FeatureDimensionScore[]): string {
  const evidence = dimensions.find((item) => item.key === "evidenceConfidence")?.score ?? 0;
  const pressure = dimensions.find((item) => item.key === "competitorPressure")?.score ?? 0;
  const currentGap = dimensions.find((item) => item.key === "currentGap")?.score ?? 0;
  if (feature.currentAppSupport === "advantage") {
    return "P1 强化优势";
  }
  if (evidence < 45) {
    return "P1 先补证据";
  }
  if (insight.persuasivenessScore >= 82 && pressure >= 70 && currentGap >= 60) {
    return "P0 进入评审";
  }
  if (feature.currentAppSupport === "partial") {
    return "P1 体验补强";
  }
  return "P2 持续观察";
}

function buildFeatureExecutionTasks(record: Omit<FeatureComparisonRecord, "taskCards">): FeatureExecutionTask[] {
  const feature = record.feature;
  const evidenceIds = uniqueValues([
    ...(record.detail?.ownEvidenceIds ?? []),
    ...(record.detail?.socialEvidenceIds ?? []),
    ...(record.detail?.competitorDetails.flatMap((detail) => [...detail.evidenceIds, ...detail.socialEvidenceIds]) ?? [])
  ]);
  const primaryPriority: Priority = record.decisionGrade.startsWith("P0") ? "P0" : record.decisionGrade.startsWith("P1") ? "P1" : "P2";
  const mainVerb = feature.currentAppSupport === "missing" ? "补齐" : feature.currentAppSupport === "partial" ? "优化" : feature.currentAppSupport === "advantage" ? "强化" : "验证";
  const implementationRiskScore = record.dimensionScores.find((item) => item.key === "implementationRisk")?.score ?? 0;
  return [
    {
      id: `${feature.id}:main`,
      title: `${mainVerb}${feature.name}体验闭环`,
      priorityHint: primaryPriority,
      ownerRole: "product",
      score: record.modelScore,
      readiness: record.insight.evidenceStrength === "待补证据" ? "needs_evidence" : primaryPriority === "P2" ? "observe" : record.modelScore >= 80 ? "ready" : "needs_scope",
      objective: record.insight.ifDo,
      whyNow: record.modelSummary,
      scope: record.insight.mvpScope,
      implementationSteps: [
        "明确入口、核心流程、结果态和失败态",
        "补齐埋点：入口点击、流程完成、保存/分享、退出",
        "与竞品 Benchmark 对齐可借鉴部分，不照搬风险部分"
      ],
      acceptance: [
        record.insight.validationPlan,
        `上线评审必须引用 ${Math.max(2, Math.min(evidenceIds.length, 4))} 条 Evidence。`,
        "灰度后复盘相关评论主题和负向反馈占比。"
      ],
      evidenceIds,
      risk: implementationRiskScore >= 70 ? "high" : "medium"
    },
    {
      id: `${feature.id}:evidence`,
      title: `补齐${feature.name}跨渠道证据`,
      priorityHint: record.insight.evidenceStrength === "强证据" ? "P2" : "P1",
      ownerRole: "research",
      score: Math.min(100, 55 + evidenceIds.length * 6),
      readiness: record.insight.evidenceStrength === "强证据" ? "observe" : "needs_evidence",
      objective: "把线索升级成可评审事实，避免单点样本误判。",
      whyNow: record.insight.evidenceStrength === "强证据" ? "当前证据较完整，可作为补充任务。" : "当前证据不足会影响需求评审说服力。",
      scope: "优先补 iOS / Android 商店页截图、评论原文、社媒链接和竞品官网证据。",
      implementationSteps: ["补齐至少 2 个竞品样本", "补齐 iOS / Android 渠道差异", "标注每条证据来源、时间和截图"],
      acceptance: ["证据中心可打开来源链接。", "功能详情页证据强度至少达到中证据。", "评论样本能覆盖正向和负向反馈。"],
      evidenceIds,
      risk: "low"
    },
    {
      id: `${feature.id}:validation`,
      title: `设计${feature.name}上线验证方案`,
      priorityHint: primaryPriority === "P0" ? "P1" : "P2",
      ownerRole: "engineering",
      score: Math.min(100, record.modelScore - 4),
      readiness: record.modelScore >= 75 ? "needs_scope" : "observe",
      objective: "让研发和产品在开发前确认指标、灰度和复盘口径。",
      whyNow: "功能补齐不能只看上线，需要提前定义是否真的改善体验。",
      scope: "定义实验指标、灰度范围、异常兜底和周报复盘字段。",
      implementationSteps: ["定义埋点事件和漏斗", "配置灰度和回滚口径", "上线后关联评论主题、评分和转化指标"],
      acceptance: ["PRD 包含入口、流程、结果、失败四类埋点。", "周报能展示上线前后关键指标变化。", "若负评上升，能定位到功能路径。"],
      evidenceIds,
      risk: "medium"
    }
  ];
}

function buildFeatureComparisonRecord(data: ApiStateResponse, feature: Feature, detail?: FeatureGapDetail): FeatureComparisonRecord {
  const insight = featureDecisionInsight(feature, detail);
  const ownSnapshot = buildFeatureCapabilitySnapshot({
    ownerId: data.state.currentOwnedApp?.id ?? feature.ownedAppId,
    ownerName: data.state.currentOwnedApp?.name ?? "当前 App",
    support: feature.currentAppSupport,
    maturityLevel: insight.maturityLevel,
    evidenceCount: detail?.ownEvidenceIds.length ?? 0,
    reviewQuoteCount: 0,
    socialEvidenceCount: detail?.socialEvidenceIds.length ?? 0,
    channelCount: channelsFor(data).length,
    feature
  });
  const competitorSnapshots = data.state.competitors.map((competitor) => {
    const competitorDetail = detail?.competitorDetails.find((item) => item.competitorId === competitor.id);
    const support = competitorDetail?.support ?? feature.competitorSupport[competitor.id] ?? "unknown";
    const maturityLevel = maturityLevelForSupport(
      support,
      competitorDetail?.evidenceIds.length ?? 0,
      competitorDetail?.reviewQuotes.length ?? 0,
      competitorDetail?.socialEvidenceIds.length ?? 0
    );
    return buildFeatureCapabilitySnapshot({
      ownerId: competitor.id,
      ownerName: competitor.name,
      support,
      maturityLevel,
      evidenceCount: competitorDetail?.evidenceIds.length ?? 0,
      reviewQuoteCount: competitorDetail?.reviewQuotes.length ?? 0,
      socialEvidenceCount: competitorDetail?.socialEvidenceIds.length ?? 0,
      channelCount: channelsFor(data, competitor).length,
      feature
    });
  });
  const bestCompetitor = [...competitorSnapshots].sort((left, right) => right.capabilityScore - left.capabilityScore)[0];
  const competitorCovered = competitorSnapshots.filter((snapshot) => snapshot.support === "owned" || snapshot.support === "advantage" || snapshot.support === "partial").length;
  const totalCompetitors = Math.max(competitorSnapshots.length, 1);
  const totalEvidence = detail?.totalEvidenceCount ?? competitorSnapshots.reduce((sum, item) => sum + item.evidenceCount + item.socialEvidenceCount, 0) + ownSnapshot.evidenceCount;
  const reviewQuotes = competitorSnapshots.reduce((sum, item) => sum + item.reviewQuoteCount, 0);
  const dimensionScores: FeatureDimensionScore[] = [
    {
      key: "competitorPressure",
      label: "竞品压力",
      score: Math.min(100, Math.round((competitorCovered / totalCompetitors) * 55 + maturityLevelScore(insight.competitorMaturityLevel) * 9)),
      summary: `${competitorCovered}/${totalCompetitors} 个竞品有公开能力证据，最高 ${maturityLabel(insight.competitorMaturityLevel)}。`
    },
    {
      key: "currentGap",
      label: "当前差距",
      score: Math.min(100, Math.max(0, (bestCompetitor?.capabilityScore ?? 0) - ownSnapshot.capabilityScore + insight.maturityGap * 12 + 28)),
      summary: `当前 App ${maturityLabel(insight.maturityLevel)}，最佳竞品 ${bestCompetitor?.ownerName ?? "暂无"} 分数 ${bestCompetitor?.capabilityScore ?? 0}。`
    },
    {
      key: "userDemand",
      label: "用户需求",
      score: Math.min(100, Math.round(feature.demandScore * 0.75 + reviewQuotes * 5 + (detail?.socialEvidenceIds.length ?? 0) * 4)),
      summary: `需求分 ${feature.demandScore}，评论样本 ${reviewQuotes} 条，社媒证据 ${detail?.socialEvidenceIds.length ?? 0} 条。`
    },
    {
      key: "evidenceConfidence",
      label: "证据可信",
      score: Math.min(100, Math.round(totalEvidence * 9 + reviewQuotes * 4 + competitorSnapshots.filter((item) => item.evidenceCount > 0).length * 8)),
      summary: `${insight.evidenceStrength}，总证据 ${totalEvidence} 条，覆盖 ${competitorSnapshots.filter((item) => item.evidenceCount > 0).length} 个竞品。`
    },
    {
      key: "businessImpact",
      label: "商业影响",
      score: /会员|价格|导出|AI|分享|模板|写真/.test(`${feature.name} ${feature.category}`) ? 84 : 58,
      summary: insight.monetizationBoundary
    },
    {
      key: "implementationRisk",
      label: "研发风险",
      score: /AI|生成|支付|订阅|同步|账号|高清|导出/.test(`${feature.name} ${feature.category}`) ? 78 : feature.currentAppSupport === "missing" ? 64 : 45,
      summary: featureRiskNotes(feature)
    }
  ];
  const modelScore = Math.round(
    (dimensionScores[0].score * 0.2 +
      dimensionScores[1].score * 0.22 +
      dimensionScores[2].score * 0.18 +
      dimensionScores[3].score * 0.16 +
      dimensionScores[4].score * 0.14 +
      (100 - dimensionScores[5].score) * 0.1)
  );
  const decisionGrade = featureComparisonDecisionGrade(feature, insight, dimensionScores);
  const baseRecord: Omit<FeatureComparisonRecord, "taskCards"> = {
    feature,
    detail,
    insight,
    ownSnapshot,
    competitorSnapshots,
    bestCompetitor,
    dimensionScores,
    decisionGrade,
    modelScore,
    modelSummary:
      decisionGrade === "P0 进入评审"
        ? `${feature.name} 已形成竞品压力和当前差距，建议进入本周需求评审。`
        : decisionGrade === "P1 先补证据"
          ? `${feature.name} 方向有价值，但证据不足，先补样本再排期。`
          : decisionGrade === "P1 强化优势"
            ? `${feature.name} 是当前 App 可强化卖点，适合进入商店页和首日体验优化。`
            : `${feature.name} 需要继续观察版本、评论和社媒信号。`
  };
  return { ...baseRecord, taskCards: buildFeatureExecutionTasks(baseRecord) };
}

function dataSafeRatio(value: number, total: number): number {
  return total <= 0 ? 0 : value / total;
}

function persuasivenessTone(score: number): "low" | "medium" | "high" {
  if (score >= 80) {
    return "high";
  }
  if (score >= 60) {
    return "medium";
  }
  return "low";
}

function recommendationPersuasiveness(recommendation: ActionRecommendation): number {
  const evidenceScore = Math.min(25, recommendation.evidenceIds.length * 5);
  const confidenceScore = Math.min(20, recommendation.confidence * 20);
  const impactScore = Math.min(20, recommendation.impactScore * 0.2);
  const coverageScore = Math.min(15, recommendation.competitorIds.length * 5 + recommendation.featureIds.length * 3);
  const priorityScore = recommendation.priorityHint === "P0" ? 10 : recommendation.priorityHint === "P1" ? 7 : 4;
  const actionScore = recommendation.actionType === "collect_evidence" || recommendation.actionType === "monitor_change" ? 4 : 8;
  return Math.round(Math.min(100, evidenceScore + confidenceScore + impactScore + coverageScore + priorityScore + actionScore));
}

function recommendationWhyNotCopy(recommendation: ActionRecommendation): string {
  if (recommendation.actionType === "amplify_advantage") {
    return "这是当前 App 的优势，不需要复制竞品，应把优势转成更强表达和更低使用阻力。";
  }
  if (recommendation.area === "pricing") {
    return "价格和权益不能照搬竞品，必须先验证用户对权益解释、触发时机和价格的真实敏感度。";
  }
  if (recommendation.area === "ai") {
    return "AI 功能需要控制生成质量、成本、内容审核和结果页转化，不能只复制入口。";
  }
  return "竞品方案只证明存在机会，最终范围要按当前 App 用户旅程、定位和研发成本裁剪。";
}

function recommendationMvpScope(recommendation: ActionRecommendation): string {
  if (recommendation.actionType === "collect_evidence") {
    return "先补齐截图、链接、评论和渠道样本，不进入正式开发排期。";
  }
  if (recommendation.actionType === "improve_experience") {
    return "先做入口、流程、文案和埋点优化，不扩大后端或算法范围。";
  }
  if (recommendation.actionType === "add_feature") {
    return "先做最短闭环：入口、核心流程、结果态、失败态和指标验证。";
  }
  return "以一周内可评审的轻量方案为边界，保留后续扩展空间。";
}

function priorityScore(priority: Priority): number {
  return priority === "P0" ? 30 : priority === "P1" ? 22 : 14;
}

function lineAfterPrefix(text: string, prefix: string): string | undefined {
  return text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith(prefix))
    ?.slice(prefix.length)
    .trim();
}

function requirementEvidenceStrength(evidenceCount: number): string {
  if (evidenceCount >= 6) {
    return "强证据";
  }
  if (evidenceCount >= 3) {
    return "中证据";
  }
  if (evidenceCount > 0) {
    return "弱证据";
  }
  return "待补证据";
}

function requirementReadinessLabel(readiness: RequirementReadiness): string {
  const labels: Record<RequirementReadiness, string> = {
    ready: "可进评审",
    needs_evidence: "待补证据",
    needs_scope: "待收敛范围",
    observe: "观察池"
  };
  return labels[readiness];
}

function requirementReadinessTone(readiness: RequirementReadiness): "low" | "medium" | "high" {
  if (readiness === "ready") {
    return "high";
  }
  if (readiness === "observe") {
    return "low";
  }
  return "medium";
}

function requirementReviewReadiness(score: number, evidenceCount: number, priority: Priority, effort?: ActionRecommendation["effort"]): RequirementReadiness {
  if (evidenceCount < 2) {
    return "needs_evidence";
  }
  if (priority === "P2" && score < 70) {
    return "observe";
  }
  if (effort === "L" || score < 80) {
    return "needs_scope";
  }
  return "ready";
}

function requirementAcceptanceLines(packageItem: RequirementReviewPackage): string[] {
  const explicitMetric = packageItem.successMetric || lineAfterPrefix(packageItem.prdNotes, "成功指标：") || lineAfterPrefix(packageItem.prdNotes, "验收：");
  return [
    explicitMetric || "核心流程能被完整使用，并能在埋点中看到入口点击、完成和失败状态。",
    `证据回溯完整：至少引用 ${Math.max(2, Math.min(packageItem.evidenceIds.length, 4))} 条 Evidence，评审材料能打开来源。`,
    packageItem.readiness === "needs_evidence" ? "补齐跨平台或竞品样本后再进入正式排期。" : "上线后在周报里复盘指标和相关评论变化。"
  ];
}

function requirementNextStep(packageItem: RequirementReviewPackage): string {
  if (packageItem.readiness === "ready") {
    return packageItem.source === "requirement" ? "进入需求评审，明确排期、埋点和验收口径。" : "先转入需求池，再进入需求评审。";
  }
  if (packageItem.readiness === "needs_evidence") {
    return "补充截图、链接、评论或社媒样本，避免单点证据直接变需求。";
  }
  if (packageItem.readiness === "needs_scope") {
    return "收敛 MVP 范围和不做范围，先评估研发成本。";
  }
  return "继续观察下个版本、评论和渠道变化，不进入本轮排期。";
}

function requirementScoreFromRequirement(requirement: RequirementCandidate): number {
  const evidenceScore = Math.min(25, requirement.evidenceIds.length * 5);
  const statusScore = requirement.status === "Accepted" ? 25 : requirement.status === "ToReview" ? 20 : requirement.status === "Draft" ? 12 : requirement.status === "Deferred" ? 6 : 0;
  const prdScore = /验收|成功指标|目标|为什么现在|研发提示/.test(requirement.prdNotes) ? 20 : 10;
  const competitorScore = requirement.competitorReference && requirement.competitorReference !== "竞品" ? 10 : 6;
  return Math.min(100, evidenceScore + statusScore + prdScore + competitorScore + priorityScore(requirement.priorityHint));
}

function requirementPackageFromRequirement(requirement: RequirementCandidate): RequirementReviewPackage {
  const score = requirementScoreFromRequirement(requirement);
  const readiness = requirementReviewReadiness(score, requirement.evidenceIds.length, requirement.priorityHint);
  const successMetric = lineAfterPrefix(requirement.prdNotes, "成功指标：") ?? lineAfterPrefix(requirement.prdNotes, "验收：") ?? "入口点击率、核心流程完成率、相关负评占比和需求复盘结论。";
  return {
    id: `requirement:${requirement.id}`,
    source: "requirement",
    sourceId: requirement.id,
    title: requirement.problem,
    priorityHint: requirement.priorityHint,
    score,
    readiness,
    status: statusLabel(requirement.status),
    evidenceIds: requirement.evidenceIds,
    competitorText: requirement.competitorReference,
    featureText: requirement.appGapOrAdvantage,
    problem: lineAfterPrefix(requirement.prdNotes, "问题：") ?? requirement.problem,
    whyNow: lineAfterPrefix(requirement.prdNotes, "为什么现在：") ?? "已进入候选需求池，需要产品和研发补齐评审判断。",
    recommendation: requirement.recommendation,
    implementationHint: lineAfterPrefix(requirement.prdNotes, "研发提示：") ?? "先评估入口、状态、埋点、失败兜底和灰度发布成本。",
    successMetric,
    mvpScope: "先完成最短体验闭环、关键状态、基础埋点和证据回溯，不扩展到复杂自动化。",
    validationPlan: successMetric,
    prdNotes: requirement.prdNotes
  };
}

function requirementPackageFromRecommendation(data: ApiStateResponse, recommendation: ActionRecommendation): RequirementReviewPackage {
  const score = recommendationPersuasiveness(recommendation);
  const readiness = requirementReviewReadiness(score, recommendation.evidenceIds.length, recommendation.priorityHint, recommendation.effort);
  return {
    id: `recommendation:${recommendation.id}`,
    source: "recommendation",
    sourceId: recommendation.id,
    title: recommendation.title,
    priorityHint: recommendation.priorityHint,
    score,
    readiness,
    status: statusLabel(recommendation.status),
    evidenceIds: recommendation.evidenceIds,
    competitorText: recommendationCompetitorNames(data, recommendation),
    featureText: recommendationFeatureNames(data, recommendation),
    problem: recommendation.problem,
    whyNow: recommendation.whyNow,
    recommendation: recommendation.recommendation,
    implementationHint: recommendation.implementationHint,
    successMetric: recommendation.successMetric,
    mvpScope: recommendationMvpScope(recommendation),
    validationPlan: recommendation.successMetric,
    prdNotes: [
      `问题：${recommendation.problem}`,
      `为什么现在：${recommendation.whyNow}`,
      `产品动作：${recommendation.recommendation}`,
      `MVP 范围：${recommendationMvpScope(recommendation)}`,
      `研发提示：${recommendation.implementationHint}`,
      `成功指标：${recommendation.successMetric}`
    ].join("\n"),
    ownerRole: recommendation.ownerRole,
    area: recommendation.area,
    actionType: recommendation.actionType
  };
}

function requirementMatchesRecommendation(requirement: RequirementCandidate, recommendation: ActionRecommendation): boolean {
  if (requirement.problem === recommendation.title) {
    return true;
  }
  const requirementEvidence = new Set(requirement.evidenceIds);
  return recommendation.evidenceIds.some((id) => requirementEvidence.has(id)) && requirement.recommendation === recommendation.recommendation;
}

function buildRequirementReviewPackages(data: ApiStateResponse): RequirementReviewPackage[] {
  const ownedAppId = data.state.currentOwnedApp?.id;
  const requirements = data.state.requirements.filter((requirement) => !ownedAppId || requirement.ownedAppId === ownedAppId);
  const recommendations = actionRecommendationsFor(data).filter(
    (recommendation) => !requirements.some((requirement) => requirementMatchesRecommendation(requirement, recommendation))
  );
  return [
    ...requirements.map((requirement) => requirementPackageFromRequirement(requirement)),
    ...recommendations.map((recommendation) => requirementPackageFromRecommendation(data, recommendation))
  ].sort((left, right) => right.score - left.score || priorityScore(right.priorityHint) - priorityScore(left.priorityHint));
}

function roadmapLaneLabel(lane: RoadmapLane): string {
  const labels: Record<RoadmapLane, string> = {
    this_week: "本周评审",
    next_version: "下个版本",
    evidence_needed: "补证据",
    watch: "观察池"
  };
  return labels[lane];
}

function roadmapLaneHint(lane: RoadmapLane): string {
  const hints: Record<RoadmapLane, string> = {
    this_week: "证据和范围相对清楚，适合进入需求评审。",
    next_version: "方向有价值，但需要先收敛版本范围或研发成本。",
    evidence_needed: "证据不足，先补截图、评论、社媒或渠道样本。",
    watch: "暂不排期，继续观察竞品和评论变化。"
  };
  return hints[lane];
}

function roadmapLaneForPackage(packageItem: RequirementReviewPackage): RoadmapLane {
  if (packageItem.readiness === "needs_evidence") {
    return "evidence_needed";
  }
  if (packageItem.readiness === "observe" || packageItem.priorityHint === "P2") {
    return "watch";
  }
  if (packageItem.readiness === "ready" && packageItem.score >= 82) {
    return "this_week";
  }
  return "next_version";
}

function engineeringRiskForPackage(packageItem: RequirementReviewPackage): RoadmapItem["engineeringRisk"] {
  const text = `${packageItem.title} ${packageItem.problem} ${packageItem.implementationHint} ${packageItem.mvpScope}`;
  if (/算法|后端|支付|订阅|权限|账号|同步|跨端|生成质量|审核|成本/.test(text) || packageItem.score < 65) {
    return "high";
  }
  if (/AI|生成|导出|埋点|灰度|入口|会员|价格|模板|截图/.test(text) || packageItem.readiness === "needs_scope") {
    return "medium";
  }
  return "low";
}

function releaseFitScore(packageItem: RequirementReviewPackage): number {
  const readinessBoost = packageItem.readiness === "ready" ? 12 : packageItem.readiness === "needs_scope" ? 6 : packageItem.readiness === "needs_evidence" ? -8 : -12;
  const sourceBoost = packageItem.source === "requirement" ? 5 : 0;
  const priorityBoost = packageItem.priorityHint === "P0" ? 8 : packageItem.priorityHint === "P1" ? 4 : -4;
  return Math.max(0, Math.min(100, Math.round(packageItem.score + readinessBoost + sourceBoost + priorityBoost)));
}

function roadmapDecisionReason(packageItem: RequirementReviewPackage, lane: RoadmapLane, risk: RoadmapItem["engineeringRisk"]): string {
  if (lane === "this_week") {
    return `评审分 ${packageItem.score}，${requirementEvidenceStrength(packageItem.evidenceIds.length)}，范围可控，适合本周明确排期。`;
  }
  if (lane === "next_version") {
    return risk === "high" ? "方向值得跟进，但研发风险偏高，需要先做方案拆解和成本评估。" : "机会成立，但还需要收敛 MVP 或等待需求评审确认。";
  }
  if (lane === "evidence_needed") {
    return `当前只有 ${packageItem.evidenceIds.length} 条证据，不能直接把线索变成正式需求。`;
  }
  return "优先级或说服力不足，保留观察，避免抢占本轮版本资源。";
}

function roadmapEntryCondition(packageItem: RequirementReviewPackage, lane: RoadmapLane): string {
  if (lane === "this_week") {
    return "补齐埋点口径、灰度范围和负责人后即可进入版本评审。";
  }
  if (lane === "next_version") {
    return `先完成范围收敛：${packageItem.mvpScope}`;
  }
  if (lane === "evidence_needed") {
    return "至少补齐两个来源的证据，并包含截图/链接/评论原文之一。";
  }
  return "只有当竞品持续投入、评论样本增长或出现价格/版本变化时再重新评估。";
}

function buildRoadmapItems(data: ApiStateResponse): RoadmapItem[] {
  return buildRequirementReviewPackages(data)
    .map((packageItem) => {
      const lane = roadmapLaneForPackage(packageItem);
      const engineeringRisk = engineeringRiskForPackage(packageItem);
      return {
        packageItem,
        lane,
        engineeringRisk,
        releaseFitScore: releaseFitScore(packageItem),
        decisionReason: roadmapDecisionReason(packageItem, lane, engineeringRisk),
        entryCondition: roadmapEntryCondition(packageItem, lane)
      };
    })
    .sort((left, right) => right.releaseFitScore - left.releaseFitScore || right.packageItem.score - left.packageItem.score);
}

function decisionOutcomeForRoadmap(lane: RoadmapLane): ProductDecisionOutcome {
  if (lane === "this_week") {
    return "commit";
  }
  if (lane === "next_version") {
    return "scope";
  }
  if (lane === "evidence_needed") {
    return "evidence";
  }
  return "watch";
}

function decisionOutcomeLabel(outcome: ProductDecisionOutcome): string {
  const labels: Record<ProductDecisionOutcome, string> = {
    commit: "本周评审",
    scope: "先收敛范围",
    evidence: "先补证据",
    watch: "继续观察"
  };
  return labels[outcome];
}

function decisionOutcomeTone(outcome: ProductDecisionOutcome): "low" | "medium" | "high" {
  if (outcome === "commit") {
    return "high";
  }
  if (outcome === "watch") {
    return "low";
  }
  return "medium";
}

function evidenceCoverageForPackage(data: ApiStateResponse, evidenceIds: string[]): DecisionEvidenceCoverage {
  const evidenceItems = evidenceIds
    .map((id) => data.state.evidence.find((evidence) => evidence.id === id))
    .filter(Boolean);
  const screenshotCount = data.state.snapshots.filter((snapshot) => evidenceIds.includes(snapshot.evidenceId) && snapshot.screenshots.length > 0).length;
  return {
    total: evidenceItems.length,
    ios: evidenceItems.filter((evidence) => evidence?.channelName === "App Store China").length,
    android: evidenceItems.filter((evidence) => evidence && ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(evidence.channelName)).length,
    social: evidenceItems.filter((evidence) => evidence?.sourceType === "social").length,
    review: evidenceItems.filter((evidence) => evidence?.sourceType === "review").length,
    website: evidenceItems.filter((evidence) => evidence?.sourceType === "website" || evidence?.channelName === "Website").length,
    screenshots: screenshotCount
  };
}

function featureRecordForPackage(data: ApiStateResponse, packageItem: RequirementReviewPackage): FeatureComparisonRecord | undefined {
  const detailMap = new Map(buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "").map((detail) => [detail.featureId, detail]));
  if (packageItem.source === "recommendation") {
    const recommendation = actionRecommendationsFor(data).find((item) => item.id === packageItem.sourceId);
    const feature = data.state.features.find((item) => recommendation?.featureIds.includes(item.id));
    return feature ? buildFeatureComparisonRecord(data, feature, detailMap.get(feature.id)) : undefined;
  }
  const text = `${packageItem.title} ${packageItem.problem} ${packageItem.recommendation} ${packageItem.featureText} ${packageItem.prdNotes}`;
  const feature = data.state.features.find((item) => text.includes(item.name));
  return feature ? buildFeatureComparisonRecord(data, feature, detailMap.get(feature.id)) : undefined;
}

function targetUserForPackage(packageItem: RequirementReviewPackage, featureRecord?: FeatureComparisonRecord): string {
  const text = `${packageItem.title} ${packageItem.problem} ${featureRecord?.feature.category ?? ""}`;
  if (/会员|价格|订阅|付费|高清|导出/.test(text)) {
    return "会员潜在用户、付费犹豫用户和高清导出高频用户。";
  }
  if (/AI|写真|生成|模板|头像/.test(text)) {
    return "AI 玩法尝鲜用户、模板高频用户和需要快速出片的新用户。";
  }
  if (/拍照|相机|美颜|滤镜|弱光/.test(text)) {
    return "拍照高频用户、新用户首日用户和对自然美颜敏感的用户。";
  }
  return "当前 App 的核心使用用户，以及在评论中明确表达相关需求的用户。";
}

function buildDecisionEvidenceGaps(
  packageItem: RequirementReviewPackage,
  coverage: DecisionEvidenceCoverage,
  featureRecord?: FeatureComparisonRecord
): DecisionEvidenceGap[] {
  const gaps: DecisionEvidenceGap[] = [];
  if (coverage.total < 2) {
    gaps.push({
      title: "证据数量不足",
      detail: `当前只有 ${coverage.total} 条 Evidence，评审时容易被质疑样本不足。`,
      action: "至少补齐 2 条来源不同的截图、评论、链接或社媒样本。",
      owner: "research",
      severity: "high"
    });
  }
  if (coverage.ios === 0) {
    gaps.push({
      title: "缺 iOS 证据",
      detail: "无法判断 App Store 中国区是否已经出现同类信号。",
      action: "补 App Store 截图、版本日志、评论或价格证据。",
      owner: "research",
      severity: packageItem.priorityHint === "P0" ? "high" : "medium"
    });
  }
  if (coverage.android === 0) {
    gaps.push({
      title: "缺 Android 渠道证据",
      detail: "国内安卓渠道差异无法支撑排期判断。",
      action: "优先补小米、OPPO、vivo、华为或应用宝中的至少一个渠道。",
      owner: "research",
      severity: "medium"
    });
  }
  if (coverage.review === 0) {
    gaps.push({
      title: "缺用户评论原文",
      detail: "当前判断更像竞品观察，缺少真实用户动机。",
      action: "补正向、负向和功能请求各至少 1 条评论样本。",
      owner: "research",
      severity: "medium"
    });
  }
  if (coverage.social === 0 && /模板|AI|写真|活动|社媒|小红书|抖音|微博/.test(`${packageItem.title} ${packageItem.problem}`)) {
    gaps.push({
      title: "缺社媒样本",
      detail: "玩法、模板和活动类机会需要证明是否有传播或讨论。",
      action: "补小红书、抖音或微博公开链接，并归档为 Evidence。",
      owner: "growth",
      severity: "medium"
    });
  }
  if (coverage.screenshots === 0) {
    gaps.push({
      title: "缺截图证据",
      detail: "研发和设计很难判断入口、页面和状态差异。",
      action: "补商店截图、功能入口截图或竞品流程截图。",
      owner: "product",
      severity: "medium"
    });
  }
  if (packageItem.readiness === "needs_scope") {
    gaps.push({
      title: "MVP 范围未收敛",
      detail: "方向成立，但还没明确第一版做什么、不做什么。",
      action: "把范围收敛到入口、核心流程、结果态、失败态和埋点。",
      owner: "product",
      severity: "high"
    });
  }
  if (featureRecord?.decisionGrade === "P1 先补证据") {
    gaps.push({
      title: "模型要求先补证据",
      detail: featureRecord.modelSummary,
      action: "优先补 Benchmark 竞品证据和当前 App 自身证据。",
      owner: "research",
      severity: "high"
    });
  }
  return gaps.slice(0, 6);
}

function experimentPlanForPackage(packageItem: RequirementReviewPackage, featureRecord?: FeatureComparisonRecord): DecisionExperimentItem[] {
  const text = `${packageItem.title} ${packageItem.problem} ${packageItem.recommendation} ${featureRecord?.feature.category ?? ""}`;
  const base: DecisionExperimentItem[] = [
    {
      metric: "入口点击率",
      eventName: "feature_entry_click",
      successDefinition: "入口曝光后点击率提升，且新入口不挤压核心路径。",
      owner: "product"
    },
    {
      metric: "核心流程完成率",
      eventName: "feature_flow_complete",
      successDefinition: "用户从入口到结果页的完成率达到评审目标，失败率可解释。",
      owner: "engineering"
    },
    {
      metric: "保存 / 分享率",
      eventName: "feature_result_save_share",
      successDefinition: "结果页保存或分享行为提升，证明功能产生可见价值。",
      owner: "product"
    },
    {
      metric: "相关负评占比",
      eventName: "review_theme_negative_rate",
      successDefinition: "上线后相关差评占比不升高，核心抱怨可定位到具体路径。",
      owner: "research"
    }
  ];
  if (/AI|生成|写真|模板/.test(text)) {
    base.splice(2, 0, {
      metric: "生成成功率",
      eventName: "ai_generation_success",
      successDefinition: "生成完成、失败、取消和等待超时都能被记录。",
      owner: "engineering"
    });
  }
  if (/会员|价格|订阅|付费|高清|导出/.test(text)) {
    base.push({
      metric: "会员页点击与退出",
      eventName: "paywall_view_click_exit",
      successDefinition: "能区分主动了解权益、误触付费墙和支付页退出。",
      owner: "product"
    });
  }
  return base.slice(0, 6);
}

function buildDecisionPrdMarkdown(brief: Omit<ProductDecisionBrief, "prdMarkdown" | "reportSnippet">): string {
  const packageItem = brief.packageItem;
  const benchmark = brief.featureRecord?.bestCompetitor?.ownerName ?? packageItem.competitorText;
  return [
    `# ${packageItem.title}`,
    "",
    `## 1. 决策结论`,
    `- 建议：${brief.outcomeLabel}`,
    `- 理由：${brief.roadmapItem.decisionReason}`,
    `- 进入条件：${brief.roadmapItem.entryCondition}`,
    "",
    "## 2. 背景问题",
    `- 问题：${packageItem.problem}`,
    `- 为什么现在：${packageItem.whyNow}`,
    `- 目标用户：${brief.targetUser}`,
    "",
    "## 3. 竞品与当前 App 判断",
    `- 竞品参考：${benchmark}`,
    `- 当前差距 / 优势：${packageItem.featureText}`,
    `- 不能照搬：${brief.featureRecord?.insight.whyNotCopy ?? "需要结合当前 App 定位、用户反馈和实现成本裁剪范围。"}`,
    "",
    "## 4. MVP 范围",
    `- 做：${packageItem.mvpScope}`,
    "- 不做：不在第一版扩展复杂自动化、重运营体系或无证据支撑的竞品复制。",
    "",
    "## 5. 研发拆分",
    `- ${packageItem.implementationHint}`,
    "- 补齐入口、核心流程、结果态、失败态、空态和埋点。",
    "- 需要灰度、回滚和异常监控口径。",
    "",
    "## 6. 埋点与验收",
    ...brief.experiments.map((item) => `- ${item.metric}：${item.eventName}，${item.successDefinition}`),
    "",
    "## 7. 证据与缺口",
    `- Evidence：${packageItem.evidenceIds.join(", ") || "待补证据"}`,
    ...(brief.evidenceGaps.length === 0 ? ["- 证据闭环暂可进入评审。"] : brief.evidenceGaps.map((gap) => `- ${gap.title}：${gap.action}`))
  ].join("\n");
}

function buildDecisionReportSnippet(brief: Omit<ProductDecisionBrief, "prdMarkdown" | "reportSnippet">): string {
  const packageItem = brief.packageItem;
  return [
    `### ${packageItem.priorityHint} ${packageItem.title}`,
    "",
    `- 决策：${brief.outcomeLabel}`,
    `- 为什么现在：${packageItem.whyNow}`,
    `- 建议动作：${packageItem.recommendation}`,
    `- 研发提示：${packageItem.implementationHint}`,
    `- 验收指标：${packageItem.successMetric}`,
    `- 证据：${packageItem.evidenceIds.join(", ") || "待补"}`
  ].join("\n");
}

function releaseGateForBrief(roadmapItem: RoadmapItem, gaps: DecisionEvidenceGap[]): string {
  if (roadmapItem.lane === "this_week" && gaps.every((gap) => gap.severity !== "high")) {
    return "可进入本周评审，评审前补齐负责人、埋点和灰度范围。";
  }
  if (roadmapItem.lane === "next_version") {
    return "进入下个版本候选，先完成成本评估和范围收敛。";
  }
  if (roadmapItem.lane === "evidence_needed") {
    return "不得直接排期，先补齐证据缺口后重新评分。";
  }
  return "留在观察池，等待竞品持续投入或评论信号增强。";
}

function buildProductDecisionBriefs(data: ApiStateResponse): ProductDecisionBrief[] {
  return buildRoadmapItems(data).map((roadmapItem) => {
    const packageItem = roadmapItem.packageItem;
    const featureRecord = featureRecordForPackage(data, packageItem);
    const outcome = decisionOutcomeForRoadmap(roadmapItem.lane);
    const evidenceCoverage = evidenceCoverageForPackage(data, packageItem.evidenceIds);
    const evidenceGaps = buildDecisionEvidenceGaps(packageItem, evidenceCoverage, featureRecord);
    const experiments = experimentPlanForPackage(packageItem, featureRecord);
    const briefBase = {
      id: `decision:${packageItem.id}`,
      packageItem,
      roadmapItem,
      featureRecord,
      outcome,
      outcomeLabel: decisionOutcomeLabel(outcome),
      decisionTitle: `${packageItem.priorityHint} / ${decisionOutcomeLabel(outcome)} / ${packageItem.title}`,
      targetUser: targetUserForPackage(packageItem, featureRecord),
      evidenceCoverage,
      evidenceGaps,
      experiments,
      releaseGate: releaseGateForBrief(roadmapItem, evidenceGaps)
    };
    return {
      ...briefBase,
      prdMarkdown: buildDecisionPrdMarkdown(briefBase),
      reportSnippet: buildDecisionReportSnippet(briefBase)
    };
  });
}

function releaseValidationStageLabel(stage: ReleaseValidationStage): string {
  const labels: Record<ReleaseValidationStage, string> = {
    instrumentation: "先补埋点",
    gray_release: "可进灰度",
    success_review: "上线复盘",
    blocked: "阻塞待补"
  };
  return labels[stage];
}

function validationChecklistStatusLabel(status: ValidationChecklistStatus): string {
  const labels: Record<ValidationChecklistStatus, string> = {
    ready: "已具备",
    required: "需确认",
    missing: "缺失"
  };
  return labels[status];
}

function releaseValidationStageForBrief(brief: ProductDecisionBrief): ReleaseValidationStage {
  const hasHighGap = brief.evidenceGaps.some((gap) => gap.severity === "high");
  if (brief.outcome === "evidence" || hasHighGap) {
    return "blocked";
  }
  if (brief.outcome === "commit" && brief.roadmapItem.engineeringRisk !== "high") {
    return "gray_release";
  }
  if (brief.outcome === "watch") {
    return "success_review";
  }
  return "instrumentation";
}

function releaseValidationStageReason(brief: ProductDecisionBrief, stage: ReleaseValidationStage): string {
  if (stage === "blocked") {
    return brief.evidenceGaps.find((gap) => gap.severity === "high")?.action ?? "证据或范围不足，暂不建议进入灰度。";
  }
  if (stage === "gray_release") {
    return "评审结论和证据基本可用，先以小流量灰度验证关键指标。";
  }
  if (stage === "instrumentation") {
    return "方向成立但研发风险或范围仍需收敛，先完成埋点、灰度和回滚方案。";
  }
  return "暂不进入排期，保留为上线后或竞品继续投入时的观察指标。";
}

function validationMetricPlan(experiment: DecisionExperimentItem, brief: ProductDecisionBrief): ReleaseValidationMetricPlan {
  const metricText = `${experiment.metric} ${experiment.eventName}`;
  const isRisky = brief.roadmapItem.engineeringRisk === "high" || /失败|负评|退出|生成/.test(metricText);
  const baseline = /负评/.test(metricText)
    ? "当前版本同主题评论负向占比"
    : /会员|paywall|退出/.test(metricText)
      ? "当前会员页曝光、点击、退出漏斗"
      : /生成/.test(metricText)
        ? "当前生成成功、失败、超时和取消分布"
        : "当前入口或相近功能 7 日均值";
  const target = /负评/.test(metricText)
    ? "灰度后相关负评占比不高于当前版本"
    : /保存|分享/.test(metricText)
      ? "保存或分享率较对照组提升 5% 以上"
      : /完成/.test(metricText)
        ? "核心流程完成率不低于对照组，且异常可定位"
        : /点击/.test(metricText)
          ? "入口点击率较对照组提升 8% 以上"
          : "关键成功事件达到评审目标，失败事件有明确归因";
  return {
    ...experiment,
    baseline,
    target,
    reviewWindow: brief.packageItem.priorityHint === "P0" ? "灰度 3 天 + 上线 7 天复盘" : "灰度 7 天 + 上线 14 天复盘",
    risk: isRisky ? "high" : brief.outcome === "scope" ? "medium" : "low"
  };
}

function validationChecklistForBrief(brief: ProductDecisionBrief, stage: ReleaseValidationStage): ReleaseValidationChecklistItem[] {
  const hasHighGap = brief.evidenceGaps.some((gap) => gap.severity === "high");
  return [
    {
      id: "evidence",
      title: "证据包",
      owner: "research",
      status: brief.evidenceCoverage.total >= 2 && !hasHighGap ? "ready" : "missing",
      detail: `Evidence ${brief.evidenceCoverage.total} 条，iOS ${brief.evidenceCoverage.ios}，Android ${brief.evidenceCoverage.android}，评论 ${brief.evidenceCoverage.review}。`
    },
    {
      id: "event-spec",
      title: "埋点事件定义",
      owner: "engineering",
      status: brief.experiments.length >= 4 ? "ready" : "required",
      detail: `${brief.experiments.length} 个事件待研发确认字段、触发时机、失败态和去重口径。`
    },
    {
      id: "gray-scope",
      title: "灰度范围",
      owner: "product",
      status: stage === "gray_release" ? "ready" : "required",
      detail: stage === "gray_release" ? "建议 5% -> 20% -> 50% 分阶段放量。" : "需要先确认目标人群、渠道、版本和回滚阈值。"
    },
    {
      id: "rollback",
      title: "回滚阈值",
      owner: "engineering",
      status: brief.roadmapItem.engineeringRisk === "high" ? "required" : "ready",
      detail: "需要定义崩溃、失败率、负评、会员页退出或生成超时的停发阈值。"
    },
    {
      id: "review-samples",
      title: "评论复盘样本",
      owner: "research",
      status: brief.evidenceCoverage.review > 0 ? "ready" : "missing",
      detail: brief.evidenceCoverage.review > 0 ? "已有评论证据，可对比上线后同主题反馈。" : "缺少评论基线，上线后很难判断真实用户影响。"
    },
    {
      id: "reporting",
      title: "复盘写入周报",
      owner: "product",
      status: brief.outcome === "watch" ? "required" : "ready",
      detail: "上线结论需要回写周报和需求池，保留 Evidence ID 和关键指标。"
    }
  ];
}

function releaseValidationConfidence(brief: ProductDecisionBrief, metrics: ReleaseValidationMetricPlan[], checklist: ReleaseValidationChecklistItem[]): number {
  const readyCount = checklist.filter((item) => item.status === "ready").length;
  const missingPenalty = checklist.filter((item) => item.status === "missing").length * 10;
  const riskPenalty = brief.evidenceGaps.filter((gap) => gap.severity === "high").length * 14 + (brief.roadmapItem.engineeringRisk === "high" ? 10 : 0);
  const metricBoost = Math.min(16, metrics.length * 3);
  return Math.max(0, Math.min(100, Math.round(brief.packageItem.score * 0.56 + readyCount * 7 + metricBoost - missingPenalty - riskPenalty)));
}

function releaseWindowForBrief(brief: ProductDecisionBrief, stage: ReleaseValidationStage): string {
  if (stage === "blocked") {
    return "补证据后重新评估";
  }
  if (stage === "gray_release") {
    return brief.packageItem.priorityHint === "P0" ? "本周灰度" : "下个版本灰度";
  }
  if (stage === "instrumentation") {
    return "先完成埋点评审";
  }
  return "上线后复盘观察";
}

function releaseDecisionGate(brief: ProductDecisionBrief, stage: ReleaseValidationStage): string {
  if (stage === "blocked") {
    return "不得进入灰度，先补齐高风险证据缺口或收敛 MVP。";
  }
  if (stage === "gray_release") {
    return "入口点击、流程完成、保存分享和负评占比全部达标后，再扩大流量。";
  }
  if (stage === "instrumentation") {
    return "埋点 PRD、失败态、灰度范围和回滚阈值评审通过后才进入开发。";
  }
  return "竞品继续投入、评论样本增长或现有版本指标异常时重新进入评审。";
}

function releaseValidationHypothesis(brief: ProductDecisionBrief): string {
  const benchmark = brief.featureRecord?.bestCompetitor?.ownerName ?? brief.packageItem.competitorText;
  return `如果围绕「${brief.packageItem.title}」补齐 ${benchmark} 已验证的核心价值，并按 ${brief.packageItem.mvpScope} 控制范围，预计能改善 ${brief.packageItem.successMetric}。`;
}

function buildReleaseValidationPlans(data: ApiStateResponse): ReleaseValidationPlan[] {
  return buildProductDecisionBriefs(data)
    .map((brief) => {
      const stage = releaseValidationStageForBrief(brief);
      const metrics = brief.experiments.map((experiment) => validationMetricPlan(experiment, brief));
      const checklist = validationChecklistForBrief(brief, stage);
      return {
        id: `validation:${brief.id}`,
        brief,
        stage,
        confidenceScore: releaseValidationConfidence(brief, metrics, checklist),
        releaseWindow: releaseWindowForBrief(brief, stage),
        hypothesis: releaseValidationHypothesis(brief),
        decisionGate: releaseDecisionGate(brief, stage),
        stageReason: releaseValidationStageReason(brief, stage),
        metrics,
        checklist,
        risks: brief.evidenceGaps,
        evidenceIds: brief.packageItem.evidenceIds
      };
    })
    .sort((left, right) => severityWeight(right.stage === "blocked" ? "high" : right.stage === "gray_release" ? "medium" : "low") - severityWeight(left.stage === "blocked" ? "high" : left.stage === "gray_release" ? "medium" : "low") || right.confidenceScore - left.confidenceScore);
}

function engineeringReadinessStageLabel(stage: EngineeringReadinessStage): string {
  const labels: Record<EngineeringReadinessStage, string> = {
    ready_to_scope: "可进技术方案",
    needs_design: "先补设计/交互",
    needs_data: "先补数据契约",
    needs_risk_review: "先做风险评审",
    blocked: "阻塞不可开工"
  };
  return labels[stage];
}

function engineeringDomainLabel(domain: EngineeringDomain): string {
  const labels: Record<EngineeringDomain, string> = {
    client: "客户端",
    server: "服务端",
    ai: "AI / 算法",
    data: "数据 / 埋点",
    qa: "QA",
    design: "设计 / 交互",
    content: "内容 / 素材",
    compliance: "合规 / 风控"
  };
  return labels[domain];
}

function engineeringDependencyStatusLabel(status: EngineeringDependencyStatus): string {
  const labels: Record<EngineeringDependencyStatus, string> = {
    ready: "已具备",
    needs_review: "需评审",
    blocked: "阻塞"
  };
  return labels[status];
}

function dependencyFromInput(input: Omit<EngineeringDependency, "id">, plan: ReleaseValidationPlan, index: number): EngineeringDependency {
  return {
    ...input,
    id: `${plan.id}:dependency:${input.domain}:${index}`
  };
}

function engineeringDependencyMapForPlan(plan: ReleaseValidationPlan): EngineeringDependency[] {
  const text = `${plan.brief.packageItem.title} ${plan.brief.packageItem.problem} ${plan.brief.packageItem.mvpScope} ${plan.brief.packageItem.implementationHint}`;
  const blockedByEvidence = plan.stage === "blocked";
  const checklistById = new Map(plan.checklist.map((item) => [item.id, item]));
  const eventSpec = checklistById.get("event-spec");
  const grayScope = checklistById.get("gray-scope");
  const rollback = checklistById.get("rollback");
  const dependencies: Array<Omit<EngineeringDependency, "id">> = [
    {
      domain: "client",
      title: "入口、核心流程、结果态和失败态",
      owner: "engineering",
      status: blockedByEvidence ? "needs_review" : "ready",
      detail: `按 MVP 范围拆客户端路径：${plan.brief.packageItem.mvpScope}`
    },
    {
      domain: "data",
      title: "埋点事件和指标口径",
      owner: "engineering",
      status: eventSpec?.status === "ready" ? "ready" : eventSpec?.status === "missing" ? "blocked" : "needs_review",
      detail: `需要确认 ${plan.metrics.map((metric) => metric.eventName).join("、")} 的触发时机、字段和失败态。`
    },
    {
      domain: "qa",
      title: "灰度、回滚和回归用例",
      owner: "engineering",
      status: rollback?.status === "ready" && grayScope?.status === "ready" ? "ready" : "needs_review",
      detail: `${plan.decisionGate} QA 需要覆盖异常、取消、低端机、弱网和版本兼容。`
    }
  ];

  if (/入口|页面|流程|截图|UI|交互|模板|拍照|滤镜|会员页|结果页/.test(text)) {
    dependencies.push({
      domain: "design",
      title: "交互稿和关键状态",
      owner: "product",
      status: plan.brief.evidenceCoverage.screenshots > 0 ? "needs_review" : "blocked",
      detail: "需要补齐入口、空态、失败态、加载态、结果态和会员边界；截图证据不足时先补竞品流程图。"
    });
  }
  if (/后端|账号|同步|支付|订阅|权限|API|服务|价格|会员|导出/.test(text)) {
    dependencies.push({
      domain: "server",
      title: "服务端接口和配置开关",
      owner: "engineering",
      status: plan.brief.roadmapItem.engineeringRisk === "high" ? "needs_review" : "ready",
      detail: "需要确认接口契约、灰度开关、会员权益判断、失败码和回滚策略。"
    });
  }
  if (/AI|生成|模型|写真|算法|推荐|识别|OCR/.test(text)) {
    dependencies.push({
      domain: "ai",
      title: "模型能力和生成质量兜底",
      owner: "engineering",
      status: plan.metrics.some((metric) => metric.eventName === "ai_generation_success") ? "needs_review" : "blocked",
      detail: "需要确认模型版本、生成成本、失败重试、超时、内容安全和质量评估样本。"
    });
  }
  if (/模板|素材|活动|话题|社媒|小红书|抖音|微博|内容/.test(text)) {
    dependencies.push({
      domain: "content",
      title: "素材供给和运营口径",
      owner: "growth",
      status: plan.brief.evidenceCoverage.social > 0 ? "ready" : "needs_review",
      detail: "需要确认模板/素材供给、活动节奏、话题证据和上线后内容消耗指标。"
    });
  }
  if (/价格|会员|订阅|支付|权限|审核|风控|合规|隐私/.test(text)) {
    dependencies.push({
      domain: "compliance",
      title: "会员、支付、权限和合规风险",
      owner: "product",
      status: plan.brief.roadmapItem.engineeringRisk === "high" ? "needs_review" : "ready",
      detail: "需要检查订阅文案、付费墙触发、权限说明、用户告知和负反馈处理。"
    });
  }

  return dependencies.map((dependency, index) => dependencyFromInput(dependency, plan, index));
}

function engineeringDataContractsForPlan(plan: ReleaseValidationPlan): EngineeringDependency[] {
  return plan.metrics.map((metric, index) =>
    dependencyFromInput(
      {
        domain: "data",
        title: metric.eventName,
        owner: metric.owner,
        status: metric.risk === "high" ? "needs_review" : "ready",
        detail: `${metric.metric}：基线「${metric.baseline}」，目标「${metric.target}」，复盘窗口「${metric.reviewWindow}」。`
      },
      plan,
      index
    )
  );
}

function engineeringQaChecksForPlan(plan: ReleaseValidationPlan): EngineeringQaCheck[] {
  const text = `${plan.brief.packageItem.title} ${plan.brief.packageItem.mvpScope} ${plan.brief.packageItem.implementationHint}`;
  const checks: EngineeringQaCheck[] = [
    {
      id: `${plan.id}:qa:entry`,
      title: "入口曝光和点击",
      risk: "medium",
      acceptance: "入口曝光、点击、关闭和误触路径都有事件，灰度组和对照组可区分。"
    },
    {
      id: `${plan.id}:qa:flow`,
      title: "核心流程完成",
      risk: plan.brief.roadmapItem.engineeringRisk,
      acceptance: "完成、失败、取消、返回、网络错误和低端机异常均可复现并记录。"
    },
    {
      id: `${plan.id}:qa:rollback`,
      title: "灰度与回滚",
      risk: plan.stage === "gray_release" ? "medium" : "high",
      acceptance: "支持按版本、渠道或人群关闭入口，回滚后不会留下不可用状态。"
    },
    {
      id: `${plan.id}:qa:review`,
      title: "上线后评论复盘",
      risk: plan.brief.evidenceCoverage.review > 0 ? "low" : "medium",
      acceptance: "上线后能按关键词、版本和渠道追踪相关正负向评论。"
    }
  ];
  if (/AI|生成|模型|写真/.test(text)) {
    checks.push({
      id: `${plan.id}:qa:ai`,
      title: "生成质量和失败兜底",
      risk: "high",
      acceptance: "生成成功、排队、超时、失败、违规和重试均有明确状态和提示。"
    });
  }
  if (/会员|价格|订阅|支付|导出/.test(text)) {
    checks.push({
      id: `${plan.id}:qa:paywall`,
      title: "付费边界和退出路径",
      risk: "high",
      acceptance: "权益说明、支付页退出、恢复购买、未登录、弱网和价格展示都可验证。"
    });
  }
  return checks;
}

function engineeringOpenQuestionsForPlan(plan: ReleaseValidationPlan, dependencies: EngineeringDependency[]): string[] {
  const questions = [
    ...plan.risks.slice(0, 3).map((risk) => `${risk.title}：${risk.action}`),
    ...dependencies
      .filter((dependency) => dependency.status !== "ready")
      .slice(0, 4)
      .map((dependency) => `${engineeringDomainLabel(dependency.domain)} 需确认：${dependency.detail}`)
  ];
  if (plan.brief.roadmapItem.engineeringRisk === "high") {
    questions.push("研发风险高：需要先做技术方案评审、成本拆分和回滚预案。");
  }
  if (plan.brief.evidenceCoverage.review === 0) {
    questions.push("缺少评论基线：上线后口碑变化难以归因，建议补评论样本。");
  }
  return uniqueValues(questions).slice(0, 8);
}

function engineeringReadinessStageForPlan(
  plan: ReleaseValidationPlan,
  dependencies: EngineeringDependency[],
  qaChecks: EngineeringQaCheck[]
): EngineeringReadinessStage {
  if (plan.stage === "blocked" || dependencies.some((dependency) => dependency.status === "blocked")) {
    return "blocked";
  }
  if (dependencies.some((dependency) => dependency.domain === "data" && dependency.status !== "ready")) {
    return "needs_data";
  }
  if (dependencies.some((dependency) => dependency.domain === "design" && dependency.status !== "ready")) {
    return "needs_design";
  }
  if (plan.brief.roadmapItem.engineeringRisk === "high" || qaChecks.some((check) => check.risk === "high")) {
    return "needs_risk_review";
  }
  return "ready_to_scope";
}

function engineeringReadinessScore(
  plan: ReleaseValidationPlan,
  dependencies: EngineeringDependency[],
  qaChecks: EngineeringQaCheck[]
): number {
  const readyRatio = dependencies.length === 0 ? 1 : dependencies.filter((dependency) => dependency.status === "ready").length / dependencies.length;
  const blockedPenalty = dependencies.filter((dependency) => dependency.status === "blocked").length * 15;
  const reviewPenalty = dependencies.filter((dependency) => dependency.status === "needs_review").length * 5;
  const qaPenalty = qaChecks.filter((check) => check.risk === "high").length * 4;
  return Math.max(0, Math.min(100, Math.round(plan.confidenceScore * 0.52 + readyRatio * 38 + plan.metrics.length * 2 - blockedPenalty - reviewPenalty - qaPenalty)));
}

function engineeringDevStartGate(stage: EngineeringReadinessStage): string {
  if (stage === "ready_to_scope") {
    return "可以进入技术方案评审，确认排期、负责人和灰度范围。";
  }
  if (stage === "needs_data") {
    return "先完成埋点字段、触发时机、基线和目标值评审。";
  }
  if (stage === "needs_design") {
    return "先补齐交互稿、关键状态和竞品截图证据，再进入研发估时。";
  }
  if (stage === "needs_risk_review") {
    return "先做高风险技术方案、回滚策略和 QA 评审。";
  }
  return "当前不可开工，必须先解除证据、数据或设计阻塞。";
}

function engineeringRolloutPlan(plan: ReleaseValidationPlan, stage: EngineeringReadinessStage): string[] {
  if (stage === "blocked") {
    return ["暂停排期", "补齐阻塞证据或范围", "重新生成上线验证计划"];
  }
  if (stage === "needs_data") {
    return ["埋点评审", "灰度字段联调", "小流量验证", "指标复盘后放量"];
  }
  if (stage === "needs_design") {
    return ["补交互稿", "确认端状态", "研发方案评审", "灰度验证"];
  }
  if (stage === "needs_risk_review") {
    return ["技术预研", "风险拆分", "回滚演练", "分渠道灰度"];
  }
  return plan.brief.packageItem.priorityHint === "P0"
    ? ["技术方案评审", "5% 灰度", "20% 放量", "50% 放量", "全量复盘"]
    : ["技术方案评审", "10% 灰度", "核心指标达标", "下个版本放量"];
}

function buildEngineeringReadinessPlans(data: ApiStateResponse): EngineeringReadinessPlan[] {
  return buildReleaseValidationPlans(data)
    .map((validationPlan) => {
      const dependencyMap = engineeringDependencyMapForPlan(validationPlan);
      const dataContracts = engineeringDataContractsForPlan(validationPlan);
      const qaChecks = engineeringQaChecksForPlan(validationPlan);
      const stage = engineeringReadinessStageForPlan(validationPlan, dependencyMap, qaChecks);
      const readinessScore = engineeringReadinessScore(validationPlan, dependencyMap, qaChecks);
      return {
        id: `engineering:${validationPlan.id}`,
        validationPlan,
        stage,
        readinessScore,
        devStartGate: engineeringDevStartGate(stage),
        implementationSummary: `${validationPlan.brief.packageItem.implementationHint} MVP：${validationPlan.brief.packageItem.mvpScope}`,
        dependencyMap,
        dataContracts,
        qaChecks,
        openQuestions: engineeringOpenQuestionsForPlan(validationPlan, dependencyMap),
        rolloutPlan: engineeringRolloutPlan(validationPlan, stage),
        evidenceIds: validationPlan.evidenceIds
      };
    })
    .sort((left, right) => right.readinessScore - left.readinessScore || right.validationPlan.brief.packageItem.score - left.validationPlan.brief.packageItem.score);
}

const priorityWeightLabels: Record<PriorityWeightKey, string> = {
  competitorPressure: "竞品压力",
  userDemand: "用户需求",
  evidenceConfidence: "证据强度",
  businessImpact: "业务影响",
  engineeringEfficiency: "研发效率",
  strategicFit: "战略匹配",
  monetizationPotential: "商业化潜力"
};

const defaultPriorityWeights: PrioritySimulationWeights = {
  competitorPressure: 16,
  userDemand: 18,
  evidenceConfidence: 18,
  businessImpact: 16,
  engineeringEfficiency: 12,
  strategicFit: 10,
  monetizationPotential: 10
};

function dimensionScore(record: FeatureComparisonRecord | undefined, key: FeatureComparisonDimension): number | undefined {
  return record?.dimensionScores.find((dimension) => dimension.key === key)?.score;
}

function strategicFitScoreForBrief(brief: ProductDecisionBrief): number {
  const text = `${brief.packageItem.title} ${brief.packageItem.problem} ${brief.packageItem.recommendation} ${brief.featureRecord?.feature.category ?? ""}`;
  let score = 48;
  if (/AI|生成|写真|模板|内容|社媒|增长|会员|商业化/.test(text)) {
    score += 22;
  }
  if (brief.outcome === "commit") {
    score += 12;
  }
  if (brief.packageItem.priorityHint === "P0") {
    score += 10;
  }
  if (brief.evidenceGaps.some((gap) => gap.severity === "high")) {
    score -= 12;
  }
  return Math.max(0, Math.min(100, score));
}

function monetizationPotentialForBrief(brief: ProductDecisionBrief): number {
  const text = `${brief.packageItem.title} ${brief.packageItem.problem} ${brief.packageItem.recommendation} ${brief.packageItem.mvpScope}`;
  let score = /会员|价格|订阅|付费|导出|高清|权益|AI 点数|商业化/.test(text) ? 82 : 44;
  if (/保存|分享|模板|AI|写真|生成/.test(text)) {
    score += 10;
  }
  if (brief.roadmapItem.engineeringRisk === "high") {
    score -= 8;
  }
  return Math.max(0, Math.min(100, score));
}

function componentScoresForBrief(brief: ProductDecisionBrief): Record<PriorityWeightKey, number> {
  const engineeringRisk = dimensionScore(brief.featureRecord, "implementationRisk") ?? (brief.roadmapItem.engineeringRisk === "high" ? 82 : brief.roadmapItem.engineeringRisk === "medium" ? 58 : 34);
  return {
    competitorPressure: dimensionScore(brief.featureRecord, "competitorPressure") ?? Math.min(100, brief.packageItem.score + 8),
    userDemand: dimensionScore(brief.featureRecord, "userDemand") ?? Math.min(100, brief.packageItem.score + brief.evidenceCoverage.review * 6),
    evidenceConfidence: dimensionScore(brief.featureRecord, "evidenceConfidence") ?? Math.min(100, brief.evidenceCoverage.total * 18 + brief.evidenceCoverage.screenshots * 8),
    businessImpact: dimensionScore(brief.featureRecord, "businessImpact") ?? Math.min(100, brief.packageItem.score + (brief.packageItem.priorityHint === "P0" ? 12 : 0)),
    engineeringEfficiency: Math.max(0, 100 - engineeringRisk),
    strategicFit: strategicFitScoreForBrief(brief),
    monetizationPotential: monetizationPotentialForBrief(brief)
  };
}

function weightedPriorityScore(scores: Record<PriorityWeightKey, number>, weights: PrioritySimulationWeights): number {
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const weighted = (Object.keys(weights) as PriorityWeightKey[]).reduce((sum, key) => sum + scores[key] * weights[key], 0);
  return Math.round(weighted / totalWeight);
}

function prioritySimulationRecommendation(brief: ProductDecisionBrief, totalScore: number, scores: Record<PriorityWeightKey, number>): string {
  if (brief.evidenceGaps.some((gap) => gap.severity === "high") || scores.evidenceConfidence < 45) {
    return "先补证据再排期";
  }
  if (scores.engineeringEfficiency < 35) {
    return "先做技术预研";
  }
  if (totalScore >= 82) {
    return "进入本周方案评审";
  }
  if (totalScore >= 68) {
    return "进入下个版本候选";
  }
  return "继续观察";
}

function prioritySimulationNextStep(recommendation: string): string {
  if (recommendation === "进入本周方案评审") {
    return "拉 PM、研发、QA 对齐 MVP、埋点和灰度范围。";
  }
  if (recommendation === "进入下个版本候选") {
    return "补成本评估和设计状态，下次版本会前重新评分。";
  }
  if (recommendation === "先做技术预研") {
    return "先拆 AI、服务端、支付或回滚风险，再决定范围。";
  }
  if (recommendation === "先补证据再排期") {
    return "补 iOS / Android / 评论 / 截图 / 社媒证据后重新模拟。";
  }
  return "保留观察，等待竞品持续投入或用户反馈增强。";
}

function prioritySimulationTradeoffs(brief: ProductDecisionBrief, scores: Record<PriorityWeightKey, number>): string[] {
  const tradeoffs: string[] = [];
  if (scores.competitorPressure >= 75) {
    tradeoffs.push("竞品压力高，继续观望可能扩大功能成熟度差距。");
  }
  if (scores.evidenceConfidence < 55) {
    tradeoffs.push("证据强度不足，评审时需要补来源链接、截图或评论原文。");
  }
  if (scores.engineeringEfficiency < 45) {
    tradeoffs.push("研发效率偏低，需要先拆风险和回滚方案。");
  }
  if (scores.monetizationPotential >= 70) {
    tradeoffs.push("商业化潜力较高，需要同步会员页、价格展示和负反馈监控。");
  }
  if (scores.strategicFit >= 70) {
    tradeoffs.push("战略匹配较高，适合进入管理层摘要或版本方向讨论。");
  }
  if (brief.outcome === "watch") {
    tradeoffs.push("当前决策仍为观察项，不应直接抢占 P0 排期资源。");
  }
  return tradeoffs.slice(0, 5);
}

function buildPrioritySimulationResults(data: ApiStateResponse, weights: PrioritySimulationWeights): PrioritySimulationResult[] {
  return buildProductDecisionBriefs(data)
    .map((brief) => {
      const componentScores = componentScoresForBrief(brief);
      const totalScore = weightedPriorityScore(componentScores, weights);
      const recommendation = prioritySimulationRecommendation(brief, totalScore, componentScores);
      return {
        id: `priority:${brief.id}`,
        brief,
        totalScore,
        componentScores,
        recommendation,
        tradeoffs: prioritySimulationTradeoffs(brief, componentScores),
        nextStep: prioritySimulationNextStep(recommendation)
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore || right.brief.packageItem.score - left.brief.packageItem.score);
}

function riskRegisterAreaLabel(area: RiskRegisterArea): string {
  const labels: Record<RiskRegisterArea, string> = {
    evidence: "证据",
    engineering: "研发",
    market: "市场",
    channel: "渠道",
    social: "社媒",
    report: "报告",
    strategy: "战略",
    validation: "验证"
  };
  return labels[area];
}

function riskRegisterStatusLabel(status: RiskRegisterStatus): string {
  const labels: Record<RiskRegisterStatus, string> = {
    open: "待处理",
    mitigating: "处理中",
    watch: "观察"
  };
  return labels[status];
}

function buildRiskRegister(data: ApiStateResponse): RiskRegisterItem[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const now = new Date().toISOString();
  const alerts = buildCompetitiveAlerts(data.state, ownedAppId);
  const coverageAudit = buildEvidenceCoverageAudit(data);
  const validationPlans = buildReleaseValidationPlans(data);
  const engineeringPlans = buildEngineeringReadinessPlans(data);
  const strategies = buildStrategicInferences(data);
  const executiveBrief = buildExecutiveReportBrief(data);
  const risks: RiskRegisterItem[] = [];

  alerts.forEach((alert) => {
    const area: RiskRegisterArea =
      alert.alertType === "channel_failure"
        ? "channel"
        : alert.alertType === "rating_risk"
          ? "market"
          : alert.alertType === "price_change"
            ? "market"
            : "validation";
    risks.push({
      id: `risk:alert:${alert.id}`,
      area,
      title: alert.title,
      severity: alert.severity,
      status: alert.severity === "high" ? "open" : "watch",
      owner: area === "channel" ? "engineering" : "product",
      source: `Alert Center / ${alertTypeLabel(alert.alertType)}`,
      summary: alert.summary,
      mitigation: alert.recommendationIds.length > 0 ? "进入机会雷达或产品决策工作台查看关联建议。" : "补齐证据、渠道配置或评论样本后重新分析。",
      nextCheck: alert.createdAt.slice(0, 10),
      evidenceIds: alert.evidenceIds
    });
  });

  coverageAudit.gaps.forEach((gap, index) => {
    risks.push({
      id: `risk:evidence:${index}`,
      area: "evidence",
      title: "证据覆盖风险",
      severity: coverageAudit.averageScore < 55 ? "high" : "medium",
      status: "open",
      owner: "research",
      source: "Evidence Credibility",
      summary: gap,
      mitigation: "补 iOS、Android、评论、截图、社媒或第二来源证据，避免强结论缺审计依据。",
      nextCheck: now.slice(0, 10),
      evidenceIds: []
    });
  });

  validationPlans
    .filter((plan) => plan.stage === "blocked" || plan.risks.some((risk) => risk.severity === "high"))
    .forEach((plan) => {
      risks.push({
        id: `risk:validation:${plan.id}`,
        area: "validation",
        title: plan.brief.packageItem.title,
        severity: plan.stage === "blocked" ? "high" : "medium",
        status: plan.stage === "blocked" ? "open" : "mitigating",
        owner: "product",
        source: "Release Validation",
        summary: plan.stageReason,
        mitigation: plan.decisionGate,
        nextCheck: plan.releaseWindow,
        evidenceIds: plan.evidenceIds
      });
    });

  engineeringPlans
    .filter((plan) => plan.stage !== "ready_to_scope")
    .forEach((plan) => {
      risks.push({
        id: `risk:engineering:${plan.id}`,
        area: "engineering",
        title: plan.validationPlan.brief.packageItem.title,
        severity: plan.stage === "blocked" || plan.stage === "needs_risk_review" ? "high" : "medium",
        status: plan.stage === "blocked" ? "open" : "mitigating",
        owner: "engineering",
        source: "Engineering Readiness",
        summary: plan.devStartGate,
        mitigation: plan.openQuestions[0] ?? "完成依赖评审、数据契约和 QA 验收矩阵后再进入技术方案。",
        nextCheck: plan.rolloutPlan[0] ?? "技术方案评审",
        evidenceIds: plan.evidenceIds
      });
    });

  strategies
    .filter((strategy) => strategy.impact === "high" || strategy.confidence >= 78)
    .forEach((strategy) => {
      risks.push({
        id: `risk:strategy:${strategy.id}`,
        area: "strategy",
        title: `${strategy.ownerName} / ${strategy.themeLabel}`,
        severity: strategy.impact,
        status: strategy.stage === "strategic_inference" ? "open" : "watch",
        owner: "product",
        source: "Strategy Radar",
        summary: strategy.hypothesis,
        mitigation: strategy.recommendation,
        nextCheck: strategy.signals[0]?.capturedAt.slice(0, 10) ?? now.slice(0, 10),
        evidenceIds: strategy.evidenceIds
      });
    });

  data.state.socialSamples
    .filter((sample) => sample.fetchStatus === "Failed")
    .forEach((sample) => {
      risks.push({
        id: `risk:social:${sample.id}`,
        area: "social",
        title: `${sample.platform} 样本采集失败`,
        severity: sample.impact === "high" ? "high" : "medium",
        status: "open",
        owner: "growth",
        source: "Social Sample Library",
        summary: sample.fetchFailureReason ?? `${sample.topic} 样本未能归档为可用 Evidence。`,
        mitigation: "检查授权状态、公开链接可访问性和平台限制；不能绕过登录、验证码或频控。",
        nextCheck: sample.updatedAt.slice(0, 10),
        evidenceIds: sample.evidenceId ? [sample.evidenceId] : []
      });
    });

  if (executiveBrief.evidenceScore < 68) {
    risks.push({
      id: "risk:report:evidence-score",
      area: "report",
      title: "报告证据覆盖不足",
      severity: executiveBrief.evidenceScore < 50 ? "high" : "medium",
      status: "open",
      owner: "product",
      source: "Executive Report Studio",
      summary: `当前管理层摘要证据覆盖分 ${executiveBrief.evidenceScore}，不建议直接发送强结论。`,
      mitigation: "优先补报告引用的 Evidence 缺口，再导出或发送周报。",
      nextCheck: now.slice(0, 10),
      evidenceIds: executiveBrief.evidenceIds
    });
  }

  return risks
    .filter((risk, index, array) => array.findIndex((item) => item.id === risk.id) === index)
    .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity) || left.status.localeCompare(right.status));
}

function userPainCategoryLabel(category: UserPainCategory): string {
  const labels: Record<UserPainCategory, string> = {
    quality: "质量 / 口碑",
    pricing: "价格 / 会员",
    ai: "AI 体验",
    template: "模板 / 玩法",
    usability: "易用性",
    performance: "性能 / 稳定",
    content: "内容 / 运营",
    other: "其他"
  };
  return labels[category];
}

function inferUserPainCategory(text: string): UserPainCategory {
  if (/会员|价格|订阅|付费|扣费|VIP|SVIP|权益|广告|试用/.test(text)) {
    return "pricing";
  }
  if (/AI|生成|写真|模型|头像|抠图|智能|识别/.test(text)) {
    return "ai";
  }
  if (/模板|滤镜|贴纸|素材|玩法|活动|热门|话题/.test(text)) {
    return "template";
  }
  if (/卡顿|闪退|崩溃|发热|慢|失败|打不开|加载|黑屏|bug|Bug/.test(text)) {
    return "performance";
  }
  if (/难用|找不到|入口|操作|流程|保存|导出|登录|权限|水印/.test(text)) {
    return "usability";
  }
  if (/内容|运营|推荐|社区|小红书|抖音|微博|分享/.test(text)) {
    return "content";
  }
  if (/差评|不好|不自然|质量|效果|投诉|退款/.test(text)) {
    return "quality";
  }
  return "other";
}

function userPainRecommendation(category: UserPainCategory): string {
  const recommendations: Record<UserPainCategory, string> = {
    quality: "优先定位负评来源版本和功能路径，补截图证据后进入质量修复或体验优化。",
    pricing: "对齐会员权益、价格展示和退出路径，补负反馈评论后再做商业化调整。",
    ai: "补生成成功率、失败态、等待时长和质量样本，先做小流量验证。",
    template: "对比竞品模板供给、入口和社媒传播证据，先做小范围玩法验证。",
    usability: "梳理入口、路径、空态和结果态，优先修复高频操作阻塞。",
    performance: "先做崩溃、失败率、加载和低端机复现，再决定是否进入版本热修。",
    content: "补社媒样本和活动节奏证据，判断是否需要运营资源跟进。",
    other: "补充评论原文和页面截图，确认是否为真实用户痛点。"
  };
  return recommendations[category];
}

function userPainOwner(category: UserPainCategory): ActionRecommendation["ownerRole"] {
  if (category === "performance") {
    return "engineering";
  }
  if (category === "content" || category === "template") {
    return "growth";
  }
  if (category === "quality") {
    return "research";
  }
  return "product";
}

function buildUserPainThemes(data: ApiStateResponse): UserPainTheme[] {
  const buckets = new Map<
    UserPainCategory,
    {
      evidenceIds: Set<string>;
      owners: Set<string>;
      quotes: string[];
      socialSignals: string[];
      features: string[];
      reviewRatings: number[];
      severityWeights: number[];
      signalCount: number;
    }
  >();

  const bucketFor = (category: UserPainCategory) => {
    const existing = buckets.get(category);
    if (existing) {
      return existing;
    }
    const created = {
      evidenceIds: new Set<string>(),
      owners: new Set<string>(),
      quotes: [] as string[],
      socialSignals: [] as string[],
      features: [] as string[],
      reviewRatings: [] as number[],
      severityWeights: [] as number[],
      signalCount: 0
    };
    buckets.set(category, created);
    return created;
  };

  data.state.reviews.forEach((review) => {
    const category = inferUserPainCategory(`${review.topicHint ?? ""} ${review.content}`);
    const bucket = bucketFor(category);
    bucket.signalCount += 1;
    bucket.reviewRatings.push(review.rating);
    bucket.evidenceIds.add(review.evidenceId);
    bucket.owners.add(review.competitorId ? competitorName(data, review.competitorId) : data.state.currentOwnedApp?.name ?? "当前 App");
    if (bucket.quotes.length < 5) {
      bucket.quotes.push(`「${review.content.slice(0, 80)}」`);
    }
  });

  data.state.insights.forEach((insight) => {
    const category = inferUserPainCategory(`${insight.category} ${insight.title} ${insight.summary} ${insight.recommendation}`);
    const bucket = bucketFor(category);
    bucket.signalCount += Math.max(1, Math.round(insight.confidence / 35));
    bucket.severityWeights.push(severityWeight(insight.severity));
    insight.evidenceIds.forEach((id) => bucket.evidenceIds.add(id));
    bucket.owners.add("洞察主题");
    if (bucket.quotes.length < 5) {
      bucket.quotes.push(insight.summary);
    }
  });

  data.state.socialSamples.forEach((sample) => {
    const category = inferUserPainCategory(`${sample.topic} ${sample.summary} ${sample.tags.join(" ")}`);
    const bucket = bucketFor(category);
    bucket.signalCount += sample.impact === "high" ? 3 : sample.impact === "medium" ? 2 : 1;
    bucket.severityWeights.push(severityWeight(sample.impact));
    if (sample.evidenceId) {
      bucket.evidenceIds.add(sample.evidenceId);
    }
    bucket.owners.add(sample.competitorId ? competitorName(data, sample.competitorId) : data.state.currentOwnedApp?.name ?? "当前 App");
    if (bucket.socialSignals.length < 5) {
      bucket.socialSignals.push(`${socialPlatformLabel(sample.platform)}：${sample.topic} / ${sample.summary}`);
    }
  });

  buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "")
    .filter((detail) => detail.decision === "gap" || detail.decision === "improve")
    .forEach((detail) => {
      const category = inferUserPainCategory(`${detail.category} ${detail.featureName} ${detail.reviewSummary} ${detail.suggestedAction}`);
      const bucket = bucketFor(category);
      bucket.signalCount += Math.max(1, Math.round(detail.demandScore / 35));
      bucket.features.push(`${detail.featureName}：${detail.suggestedAction}`);
      detail.competitorDetails.forEach((competitorDetail) => {
        competitorDetail.evidenceIds.forEach((id) => bucket.evidenceIds.add(id));
        competitorDetail.socialEvidenceIds.forEach((id) => bucket.evidenceIds.add(id));
      });
    });

  return Array.from(buckets.entries())
    .map(([category, bucket]) => {
      const averageRating = bucket.reviewRatings.length ? bucket.reviewRatings.reduce((sum, rating) => sum + rating, 0) / bucket.reviewRatings.length : 4;
      const severityAverage = bucket.severityWeights.length ? bucket.severityWeights.reduce((sum, weight) => sum + weight, 0) / bucket.severityWeights.length : 1;
      const frequencyScore = Math.min(100, bucket.signalCount * 12 + bucket.evidenceIds.size * 4);
      const sentimentScore = Math.max(0, Math.min(100, Math.round((5 - averageRating) * 18 + severityAverage * 18)));
      const severity: "low" | "medium" | "high" = frequencyScore >= 70 || sentimentScore >= 70 ? "high" : frequencyScore >= 42 || sentimentScore >= 45 ? "medium" : "low";
      return {
        id: `pain:${category}`,
        category,
        title: userPainCategoryLabel(category),
        severity,
        frequencyScore,
        sentimentScore,
        impactedOwners: uniqueValues(Array.from(bucket.owners)).slice(0, 6),
        summary: `聚合 ${bucket.signalCount} 个评论 / 洞察 / 社媒 / 功能差距信号，证据 ${bucket.evidenceIds.size} 条。`,
        userQuotes: bucket.quotes.slice(0, 5),
        socialSignals: bucket.socialSignals.slice(0, 5),
        relatedFeatures: uniqueValues(bucket.features).slice(0, 5),
        recommendation: userPainRecommendation(category),
        owner: userPainOwner(category),
        evidenceIds: Array.from(bucket.evidenceIds).filter((id) => data.state.evidence.some((evidence) => evidence.id === id))
      };
    })
    .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity) || right.frequencyScore - left.frequencyScore);
}

function reviewAgendaSectionLabel(section: ReviewAgendaSection): string {
  const labels: Record<ReviewAgendaSection, string> = {
    decision: "需要拍板",
    risk: "风险处理",
    pain: "用户痛点",
    engineering: "研发准备",
    evidence: "证据缺口",
    followup: "会后跟进"
  };
  return labels[section];
}

function reviewAgendaSectionHint(section: ReviewAgendaSection): string {
  const hints: Record<ReviewAgendaSection, string> = {
    decision: "会中必须明确做、不做、先补证据还是进下版。",
    risk: "阻碍排期、灰度或报告发送的风险。",
    pain: "需要用用户原话解释的核心问题。",
    engineering: "研发开工前必须补齐的输入。",
    evidence: "评审前会被质疑的证据缺口。",
    followup: "无需会中展开，但必须有人跟进。"
  };
  return hints[section];
}

function buildReviewAgenda(data: ApiStateResponse): ReviewAgendaItem[] {
  const decisions = buildProductDecisionBriefs(data);
  const risks = buildRiskRegister(data);
  const pains = buildUserPainThemes(data);
  const engineering = buildEngineeringReadinessPlans(data);
  const coverageAudit = buildEvidenceCoverageAudit(data);
  const items: ReviewAgendaItem[] = [];

  decisions
    .filter((brief) => brief.outcome !== "watch")
    .slice(0, 5)
    .forEach((brief) => {
      items.push({
        id: `agenda:decision:${brief.id}`,
        section: "decision",
        title: brief.packageItem.title,
        priority: brief.packageItem.priorityHint,
        owner: "product",
        timeboxMinutes: brief.outcome === "commit" ? 12 : 8,
        decisionNeeded: `${brief.outcomeLabel}：${brief.releaseGate}`,
        preRead: `PRD 草稿、证据覆盖和 Benchmark：${brief.featureRecord?.bestCompetitor?.ownerName ?? brief.packageItem.competitorText}`,
        action: brief.roadmapItem.entryCondition,
        evidenceIds: brief.packageItem.evidenceIds
      });
    });

  risks
    .filter((risk) => risk.severity === "high" || risk.status === "open")
    .slice(0, 5)
    .forEach((risk) => {
      items.push({
        id: `agenda:risk:${risk.id}`,
        section: "risk",
        title: risk.title,
        priority: risk.severity === "high" ? "P0" : "P1",
        owner: risk.owner,
        timeboxMinutes: risk.severity === "high" ? 8 : 5,
        decisionNeeded: `${riskRegisterAreaLabel(risk.area)} 风险是否阻塞本轮排期或报告发送？`,
        preRead: `${risk.source}：${risk.summary}`,
        action: risk.mitigation,
        evidenceIds: risk.evidenceIds
      });
    });

  pains
    .filter((theme) => theme.severity !== "low")
    .slice(0, 4)
    .forEach((theme) => {
      items.push({
        id: `agenda:pain:${theme.id}`,
        section: "pain",
        title: theme.title,
        priority: theme.severity === "high" ? "P0" : "P1",
        owner: theme.owner,
        timeboxMinutes: 6,
        decisionNeeded: "是否转成需求、补证据或进入观察？",
        preRead: `${theme.summary} 用户原话：${theme.userQuotes[0] ?? "待补"}`,
        action: theme.recommendation,
        evidenceIds: theme.evidenceIds
      });
    });

  engineering
    .filter((plan) => plan.stage !== "ready_to_scope")
    .slice(0, 4)
    .forEach((plan) => {
      items.push({
        id: `agenda:engineering:${plan.id}`,
        section: "engineering",
        title: plan.validationPlan.brief.packageItem.title,
        priority: plan.stage === "blocked" ? "P0" : "P1",
        owner: "engineering",
        timeboxMinutes: plan.stage === "blocked" ? 8 : 6,
        decisionNeeded: "是否先补研发输入，还是调整需求范围？",
        preRead: `${engineeringReadinessStageLabel(plan.stage)}：${plan.devStartGate}`,
        action: plan.openQuestions[0] ?? plan.devStartGate,
        evidenceIds: plan.evidenceIds
      });
    });

  coverageAudit.gaps.slice(0, 3).forEach((gap, index) => {
    items.push({
      id: `agenda:evidence:${index}`,
      section: "evidence",
      title: "证据缺口",
      priority: coverageAudit.averageScore < 55 ? "P0" : "P1",
      owner: "research",
      timeboxMinutes: 4,
      decisionNeeded: "是否阻塞强结论、PRD 或周报发送？",
      preRead: gap,
      action: "补齐来源链接、截图、评论、iOS / Android 或第二来源证据。",
      evidenceIds: []
    });
  });

  if (items.length === 0) {
    items.push({
      id: "agenda:followup:empty",
      section: "followup",
      title: "暂无必须评审项",
      priority: "P2",
      owner: "product",
      timeboxMinutes: 5,
      decisionNeeded: "确认本周是否继续采集和补证据。",
      preRead: "当前没有高优先级决策、风险或痛点。",
      action: "继续运行采集、分析和周报任务。",
      evidenceIds: []
    });
  }

  const sectionOrder: ReviewAgendaSection[] = ["decision", "risk", "pain", "engineering", "evidence", "followup"];
  return items.sort(
    (left, right) =>
      sectionOrder.indexOf(left.section) - sectionOrder.indexOf(right.section) ||
      priorityScore(right.priority) - priorityScore(left.priority) ||
      right.timeboxMinutes - left.timeboxMinutes
  );
}

function coverageStatusLabel(status: CoverageStatus): string {
  const labels: Record<CoverageStatus, string> = {
    strong: "完整",
    partial: "部分",
    missing: "缺失"
  };
  return labels[status];
}

function coverageDimensionLabel(dimension: CoverageDimension): string {
  const labels: Record<CoverageDimension, string> = {
    ios: "iOS",
    android: "Android",
    website: "官网",
    reviews: "评论",
    social: "社媒",
    price: "价格",
    feature: "功能",
    report: "报告"
  };
  return labels[dimension];
}

function coverageCell(input: {
  dimension: CoverageDimension;
  count: number;
  strongAt: number;
  partialAt?: number;
  detail: string;
  nextAction: string;
  evidenceIds: string[];
}): CoverageCell {
  const partialAt = input.partialAt ?? 1;
  const status: CoverageStatus = input.count >= input.strongAt ? "strong" : input.count >= partialAt ? "partial" : "missing";
  const score = status === "strong" ? 100 : status === "partial" ? 58 : 18;
  return {
    dimension: input.dimension,
    label: coverageDimensionLabel(input.dimension),
    status,
    score,
    detail: input.detail,
    nextAction: input.nextAction,
    evidenceIds: input.evidenceIds
  };
}

function buildCoverageMap(data: ApiStateResponse): CoverageOwnerRow[] {
  const ownedApp = data.state.currentOwnedApp;
  const owners = [
    ...(ownedApp ? [{ id: ownedApp.id, name: ownedApp.name, type: "owned_app" as const, priority: undefined as Priority | undefined, websiteUrl: ownedApp.websiteUrl }] : []),
    ...data.state.competitors.map((competitor) => ({
      id: competitor.id,
      name: competitor.name,
      type: "competitor" as const,
      priority: competitor.priority,
      websiteUrl: competitor.websiteUrl
    }))
  ];
  const priceSignals = ownedApp ? buildPriceSignals(data.state, ownedApp.id) : [];
  const activeReportEvidenceIds = data.state.reports.flatMap((report) => report.evidenceIds);

  return owners
    .map((owner) => {
      const ownerChannels = data.state.channels.filter((channel) => channel.ownerId === owner.id);
      const ownerSnapshots = data.state.snapshots.filter((snapshot) => (owner.type === "owned_app" ? !snapshot.competitorId : snapshot.competitorId === owner.id));
      const ownerReviews = data.state.reviews.filter((review) => (owner.type === "owned_app" ? !review.competitorId : review.competitorId === owner.id));
      const ownerSocial = data.state.socialSamples.filter((sample) => (owner.type === "owned_app" ? !sample.competitorId : sample.competitorId === owner.id));
      const ownerEvidence = data.state.evidence.filter((evidence) => {
        if (owner.type === "owned_app") {
          return !data.state.competitors.some((competitor) => evidence.rawExcerpt.includes(competitor.name));
        }
        return evidence.rawExcerpt.includes(owner.name);
      });
      const ownerPriceSignals = priceSignals.filter((signal) => signal.ownerId === owner.id);
      const ownerFeatureCount =
        owner.type === "owned_app"
          ? data.state.features.filter((feature) => feature.currentAppSupport !== "unknown").length
          : data.state.features.filter((feature) => feature.competitorSupport[owner.id] && feature.competitorSupport[owner.id] !== "unknown").length;
      const iosEvidenceIds = ownerSnapshots
        .filter((snapshot) => ownerChannels.find((channel) => channel.id === snapshot.channelId)?.channelName === "App Store China")
        .map((snapshot) => snapshot.evidenceId);
      const androidEvidenceIds = ownerSnapshots
        .filter((snapshot) => {
          const channelName = ownerChannels.find((channel) => channel.id === snapshot.channelId)?.channelName;
          return channelName ? ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channelName) : false;
        })
        .map((snapshot) => snapshot.evidenceId);
      const websiteEvidenceIds = ownerEvidence.filter((evidence) => evidence.channelName === "Website" || evidence.sourceType === "website").map((evidence) => evidence.id);
      const cells = [
        coverageCell({
          dimension: "ios",
          count: ownerChannels.filter((channel) => channel.channelName === "App Store China").length + iosEvidenceIds.length,
          strongAt: 2,
          detail: `App Store 渠道 ${ownerChannels.filter((channel) => channel.channelName === "App Store China").length}，快照 ${iosEvidenceIds.length}`,
          nextAction: "补 App Store 中国区链接、快照、评论和价格字段。",
          evidenceIds: iosEvidenceIds
        }),
        coverageCell({
          dimension: "android",
          count: ownerChannels.filter((channel) => ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channel.channelName)).length + androidEvidenceIds.length,
          strongAt: 3,
          detail: `国内安卓渠道 ${ownerChannels.filter((channel) => ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channel.channelName)).length}，快照 ${androidEvidenceIds.length}`,
          nextAction: "至少补小米、OPPO、vivo、华为或应用宝中的两个渠道。",
          evidenceIds: androidEvidenceIds
        }),
        coverageCell({
          dimension: "website",
          count: (owner.websiteUrl ? 1 : 0) + websiteEvidenceIds.length,
          strongAt: 2,
          detail: owner.websiteUrl ? `已配置官网，官网证据 ${websiteEvidenceIds.length}` : `未配置官网，官网证据 ${websiteEvidenceIds.length}`,
          nextAction: "补官网首页、价格页、Blog、Changelog 或活动页证据。",
          evidenceIds: websiteEvidenceIds
        }),
        coverageCell({
          dimension: "reviews",
          count: ownerReviews.length,
          strongAt: 5,
          partialAt: 1,
          detail: `评论样本 ${ownerReviews.length} 条`,
          nextAction: "补正向、负向和功能请求评论，覆盖 iOS / Android。",
          evidenceIds: ownerReviews.map((review) => review.evidenceId)
        }),
        coverageCell({
          dimension: "social",
          count: ownerSocial.length,
          strongAt: 3,
          partialAt: 1,
          detail: `社媒样本 ${ownerSocial.length} 条`,
          nextAction: "补小红书、抖音、微博公开链接，并记录抓取失败原因。",
          evidenceIds: ownerSocial.map((sample) => sample.evidenceId).filter(Boolean) as string[]
        }),
        coverageCell({
          dimension: "price",
          count: ownerPriceSignals.length,
          strongAt: 1,
          detail: `价格信号 ${ownerPriceSignals.length} 条`,
          nextAction: "补会员价格、订阅、试用、AI 点数和渠道价格差异。",
          evidenceIds: ownerPriceSignals.flatMap((signal) => signal.evidenceIds)
        }),
        coverageCell({
          dimension: "feature",
          count: ownerFeatureCount,
          strongAt: 5,
          partialAt: 1,
          detail: `功能覆盖 ${ownerFeatureCount} 项`,
          nextAction: "补功能矩阵状态、成熟度、入口路径和证据。",
          evidenceIds: []
        }),
        coverageCell({
          dimension: "report",
          count: owner.type === "owned_app" ? data.state.reports.length : activeReportEvidenceIds.filter((id) => ownerEvidence.some((evidence) => evidence.id === id)).length,
          strongAt: 1,
          detail: owner.type === "owned_app" ? `报告 ${data.state.reports.length} 份` : "竞品证据是否进入报告",
          nextAction: "把高价值证据、风险和决策片段写入周报。",
          evidenceIds: owner.type === "owned_app" ? activeReportEvidenceIds : activeReportEvidenceIds.filter((id) => ownerEvidence.some((evidence) => evidence.id === id))
        })
      ];
      const totalScore = Math.round(cells.reduce((sum, cell) => sum + cell.score, 0) / cells.length);
      return {
        ownerId: owner.id,
        ownerName: owner.name,
        ownerType: owner.type,
        priority: owner.priority,
        cells,
        totalScore,
        blockers: cells.filter((cell) => cell.status === "missing").map((cell) => `${cell.label}：${cell.nextAction}`)
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore || priorityScore(right.priority ?? "P2") - priorityScore(left.priority ?? "P2"));
}

function changeImpactSourceLabel(source: ChangeImpactSource): string {
  const labels: Record<ChangeImpactSource, string> = {
    launch: "发布变化",
    price: "价格变化",
    metadata: "商店页变化",
    rating: "评分口碑",
    strategy: "战略推测",
    risk: "风险信号"
  };
  return labels[source];
}

function changeImpactStageLabel(stage: ChangeImpactStage): string {
  const labels: Record<ChangeImpactStage, string> = {
    execute: "可进入执行",
    review: "需要评审",
    monitor: "继续观察",
    blocked: "证据 / 研发阻塞"
  };
  return labels[stage];
}

function citationSourceLabel(source: CitationClaimSource): string {
  const labels: Record<CitationClaimSource, string> = {
    decision: "产品决策",
    strategy: "战略推测",
    risk: "风险登记",
    feature: "功能模型",
    validation: "上线验证",
    report: "专题报告"
  };
  return labels[source];
}

function citationStatusLabel(status: CitationClaimStatus): string {
  const labels: Record<CitationClaimStatus, string> = {
    ready: "可直接引用",
    reviewable: "可评审",
    weak: "需补证据",
    unsupported: "不应引用"
  };
  return labels[status];
}

function roadmapHorizonLabel(horizon: RoadmapHorizon): string {
  const labels: Record<RoadmapHorizon, string> = {
    now: "1-2 周",
    next: "下个版本",
    later: "持续观察"
  };
  return labels[horizon];
}

function reportGateStatusLabel(status: ReportGateStatus): string {
  const labels: Record<ReportGateStatus, string> = {
    pass: "通过",
    review: "需复核",
    blocked: "阻塞"
  };
  return labels[status];
}

function reportGateStatusTone(status: ReportGateStatus): "low" | "medium" | "high" {
  if (status === "pass") {
    return "high";
  }
  if (status === "blocked") {
    return "low";
  }
  return "medium";
}

function evidenceRecordMap(data: ApiStateResponse): Map<string, EvidenceRecord> {
  return new Map(buildEvidenceRecords(data).map((record) => [record.id, record]));
}

function evidenceRecordsForIds(data: ApiStateResponse, evidenceIds: string[]): EvidenceRecord[] {
  const recordById = evidenceRecordMap(data);
  return uniqueValues(evidenceIds)
    .map((id) => recordById.get(id))
    .filter(Boolean) as EvidenceRecord[];
}

function intersectCount(left: string[], right: string[]): number {
  const rightSet = new Set(right);
  return uniqueValues(left).filter((item) => rightSet.has(item)).length;
}

function featureRecordEvidenceIds(record: FeatureComparisonRecord): string[] {
  return uniqueValues([
    ...(record.detail?.ownEvidenceIds ?? []),
    ...(record.detail?.socialEvidenceIds ?? []),
    ...(record.detail?.competitorDetails.flatMap((detail) => [...detail.evidenceIds, ...detail.socialEvidenceIds]) ?? []),
    ...record.taskCards.flatMap((task) => task.evidenceIds)
  ]);
}

function compactText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}

function keywordMatches(text: string, candidates: string[]): boolean {
  const compact = compactText(text);
  return candidates
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length >= 2)
    .some((candidate) => compact.includes(compactText(candidate)));
}

function featureKeywords(record: FeatureComparisonRecord): string[] {
  return uniqueValues([
    record.feature.name,
    record.feature.category,
    ...record.feature.category.split(/[\/\s,，、]+/),
    ...record.feature.name.split(/[\/\s,，、]+/),
    record.bestCompetitor?.ownerName ?? "",
    record.insight.journey,
    record.insight.monetizationBoundary
  ]).filter(Boolean);
}

function textEvidenceProfile(data: ApiStateResponse, evidenceIds: string[]): {
  averageScore: number;
  platformCount: number;
  sourceCount: number;
  screenshotCount: number;
  reviewCount: number;
  staleCount: number;
} {
  const records = evidenceRecordsForIds(data, evidenceIds);
  const quality = evidenceQualityForIds(data, evidenceIds);
  return {
    averageScore: quality.averageScore,
    platformCount: new Set(records.map((record) => evidencePlatformFromChannel(record.channelName))).size,
    sourceCount: new Set(records.map((record) => record.sourceType)).size,
    screenshotCount: records.reduce((sum, record) => sum + record.screenshots.length, 0),
    reviewCount: records.reduce((sum, record) => sum + record.reviewCount + (record.sourceType === "review" ? 1 : 0), 0),
    staleCount: records.filter((record) => daysSinceCaptured(record.capturedAt) > 90).length
  };
}

function impactMissingEvidence(data: ApiStateResponse, evidenceIds: string[], relatedFeatures: FeatureComparisonRecord[], relatedDecisions: ProductDecisionBrief[]): string[] {
  const records = evidenceRecordsForIds(data, evidenceIds);
  const platforms = records.map((record) => evidencePlatformFromChannel(record.channelName));
  const missing: string[] = [];
  if (evidenceIds.length === 0) {
    missing.push("缺原始 Evidence，不能解释竞品变化来源。");
  }
  if (!platforms.includes("ios")) {
    missing.push("缺 iOS / App Store 中国区证据，影响 iOS 判断。");
  }
  if (!platforms.includes("android")) {
    missing.push("缺国内 Android 渠道证据，影响安卓判断。");
  }
  if (records.every((record) => record.screenshots.length === 0)) {
    missing.push("缺截图或页面证据，设计和研发无法判断入口与状态。");
  }
  if (relatedFeatures.length === 0) {
    missing.push("未连接到功能模型，需要补功能矩阵映射。");
  }
  if (relatedDecisions.length === 0) {
    missing.push("未连接到产品决策包，需要判断是否只是观察信号。");
  }
  return uniqueValues(missing).slice(0, 6);
}

function changeImpactStage(input: {
  impactScore: number;
  relatedDecisions: ProductDecisionBrief[];
  relatedEngineeringPlans: EngineeringReadinessPlan[];
  relatedRisks: RiskRegisterItem[];
  missingEvidence: string[];
}): ChangeImpactStage {
  if (input.relatedEngineeringPlans.some((plan) => plan.stage === "blocked") || input.relatedRisks.some((risk) => risk.severity === "high" && risk.status === "open")) {
    return "blocked";
  }
  if (input.relatedDecisions.some((decision) => decision.outcome === "commit") && input.missingEvidence.length <= 2) {
    return "execute";
  }
  if (input.impactScore >= 68 || input.relatedDecisions.length > 0 || input.relatedEngineeringPlans.length > 0) {
    return "review";
  }
  return "monitor";
}

function changeImpactNextActions(trace: Omit<ChangeImpactTrace, "nextActions" | "reportSnippet">): string[] {
  const actions = [
    trace.stage === "execute"
      ? "进入本周方案评审，确认 MVP、埋点和灰度范围。"
      : trace.stage === "blocked"
        ? "先解除证据、数据或研发阻塞，再决定是否排期。"
        : trace.stage === "review"
          ? "拉 PM、研发、设计一起判断是否转需求或补证据。"
          : "保留观察，等待第二来源或用户信号增强。",
    trace.relatedFeatures[0] ? `打开功能详情核对「${trace.relatedFeatures[0].feature.name}」的当前状态、竞品成熟度和任务卡。` : "补功能映射，避免变化只停留在资讯层。",
    trace.missingEvidence[0] ?? "把本链路证据写入周报附录，保留来源链接。"
  ];
  if (trace.relatedEngineeringPlans.some((plan) => plan.stage === "needs_data")) {
    actions.push("先补数据契约和埋点事件，再进入研发估时。");
  }
  if (trace.relatedRisks.some((risk) => risk.area === "social")) {
    actions.push("检查社媒授权和样本链接，不绕过平台登录、验证码或频控。");
  }
  return uniqueValues(actions).slice(0, 5);
}

function buildChangeImpactReportSnippet(trace: Omit<ChangeImpactTrace, "reportSnippet">): string {
  return [
    `### 变更影响链：${trace.title}`,
    "",
    `- 来源：${trace.sourceLabel} / ${trace.ownerName}`,
    `- 阶段：${changeImpactStageLabel(trace.stage)}，影响分 ${trace.impactScore}，置信度 ${trace.confidenceScore}`,
    `- 摘要：${trace.summary}`,
    `- 关联功能：${trace.relatedFeatures.map((record) => record.feature.name).join("、") || "待映射"}`,
    `- 关联决策：${trace.relatedDecisions.map((decision) => decision.packageItem.title).join("、") || "待判断"}`,
    `- 下一步：${trace.nextActions.join("；")}`,
    `- 证据：${trace.evidenceIds.join(", ") || "待补"}`
  ].join("\n");
}

function buildChangeImpactTraces(data: ApiStateResponse): ChangeImpactTrace[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const featureDetails = buildFeatureGapDetails(data.state, ownedAppId);
  const featureRecords = normalizeFeatures(data.state.features).map((feature) =>
    buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id))
  );
  const decisions = buildProductDecisionBriefs(data);
  const validations = buildReleaseValidationPlans(data);
  const engineeringPlans = buildEngineeringReadinessPlans(data);
  const risks = buildRiskRegister(data);
  const events: Array<{
    id: string;
    sourceType: ChangeImpactSource;
    ownerId: string;
    ownerName: string;
    title: string;
    summary: string;
    severity: "low" | "medium" | "high";
    capturedAt: string;
    evidenceIds: string[];
    baseScore: number;
  }> = [];

  if (ownedAppId) {
    buildLaunchSignals(data.state, ownedAppId).forEach((signal) => {
      events.push({
        id: `impact:launch:${signal.id}`,
        sourceType: "launch",
        ownerId: signal.ownerId,
        ownerName: signal.ownerName,
        title: signal.title,
        summary: signal.summary,
        severity: signal.impact,
        capturedAt: signal.occurredAt,
        evidenceIds: signal.evidenceIds,
        baseScore: signal.impact === "high" ? 74 : signal.impact === "medium" ? 58 : 38
      });
    });
    buildPriceSignals(data.state, ownedAppId).forEach((signal) => {
      events.push({
        id: `impact:price:${signal.id}`,
        sourceType: "price",
        ownerId: signal.ownerId,
        ownerName: signal.ownerName,
        title: `${signal.ownerName} ${priceChangeLabel(signal.changeType)}`,
        summary: signal.changeType === "changed" ? `${signal.previousPriceText ?? "未知价格"} -> ${signal.priceText}` : signal.priceText,
        severity: signal.changeType === "changed" ? "high" : signal.numericPrices.length > 0 ? "medium" : "low",
        capturedAt: signal.capturedAt,
        evidenceIds: signal.evidenceIds,
        baseScore: signal.changeType === "changed" ? 80 : 48
      });
    });
    buildStoreMetadataSignals(data.state, ownedAppId).forEach((signal) => {
      const metadataSeverity: "low" | "medium" | "high" =
        signal.field === "screenshots" || signal.field === "price" || signal.field === "release_notes"
          ? "high"
          : signal.field === "description" || signal.field === "rating"
            ? "medium"
            : "low";
      events.push({
        id: `impact:metadata:${signal.id}`,
        sourceType: "metadata",
        ownerId: signal.ownerId,
        ownerName: signal.ownerName,
        title: `${signal.ownerName} ${metadataFieldLabel(signal.field)}变化`,
        summary: signal.beforeValue ? `${signal.beforeValue} -> ${signal.afterValue}` : signal.afterValue,
        severity: metadataSeverity,
        capturedAt: signal.capturedAt,
        evidenceIds: signal.evidenceIds,
        baseScore: metadataSeverity === "high" ? 72 : metadataSeverity === "medium" ? 56 : 36
      });
    });
    buildRatingSentimentSignals(data.state, ownedAppId).forEach((signal) => {
      events.push({
        id: `impact:rating:${signal.id}`,
        sourceType: "rating",
        ownerId: signal.ownerId,
        ownerName: signal.ownerName,
        title: `${signal.ownerName} 评分口碑 ${impactLabel(signal.riskLevel)}`,
        summary: signal.summary,
        severity: signal.riskLevel,
        capturedAt: signal.capturedAt,
        evidenceIds: signal.evidenceIds,
        baseScore: signal.riskLevel === "high" ? 78 : signal.riskLevel === "medium" ? 58 : 34
      });
    });
  }

  buildStrategicInferences(data)
    .filter((strategy) => strategy.stage !== "observation" || strategy.impact !== "low")
    .forEach((strategy) => {
      events.push({
        id: `impact:strategy:${strategy.id}`,
        sourceType: "strategy",
        ownerId: strategy.ownerId,
        ownerName: strategy.ownerName,
        title: `${strategy.ownerName} / ${strategy.themeLabel}`,
        summary: strategy.hypothesis,
        severity: strategy.impact,
        capturedAt: strategy.signals[0]?.capturedAt ?? new Date().toISOString(),
        evidenceIds: strategy.evidenceIds,
        baseScore: Math.round(strategy.confidence * 0.8)
      });
    });

  risks
    .filter((risk) => risk.severity !== "low")
    .slice(0, 12)
    .forEach((risk) => {
      events.push({
        id: `impact:risk:${risk.id}`,
        sourceType: "risk",
        ownerId: ownedAppId,
        ownerName: data.state.currentOwnedApp?.name ?? "当前 App",
        title: risk.title,
        summary: risk.summary,
        severity: risk.severity,
        capturedAt: risk.nextCheck,
        evidenceIds: risk.evidenceIds,
        baseScore: risk.severity === "high" ? 74 : 52
      });
    });

  return events
    .map((event) => {
      const eventText = `${event.title} ${event.summary} ${event.ownerName}`;
      const relatedFeatures = featureRecords
        .filter((record) => {
          const evidenceOverlap = intersectCount(event.evidenceIds, featureRecordEvidenceIds(record));
          return evidenceOverlap > 0 || keywordMatches(eventText, featureKeywords(record));
        })
        .sort((left, right) => right.modelScore - left.modelScore)
        .slice(0, 4);
      const relatedFeatureIds = new Set(relatedFeatures.map((record) => record.feature.id));
      const relatedDecisions = decisions
        .filter((decision) => {
          const decisionText = `${decision.packageItem.title} ${decision.packageItem.problem} ${decision.packageItem.recommendation}`;
          return (
            intersectCount(event.evidenceIds, decision.packageItem.evidenceIds) > 0 ||
            (decision.featureRecord && relatedFeatureIds.has(decision.featureRecord.feature.id)) ||
            keywordMatches(eventText, [decision.packageItem.title, decision.packageItem.featureText]) ||
            keywordMatches(decisionText, [event.title, event.ownerName])
          );
        })
        .sort((left, right) => priorityScore(right.packageItem.priorityHint) - priorityScore(left.packageItem.priorityHint) || right.packageItem.score - left.packageItem.score)
        .slice(0, 4);
      const relatedDecisionIds = new Set(relatedDecisions.map((decision) => decision.id));
      const relatedValidationPlans = validations
        .filter((plan) => relatedDecisionIds.has(plan.brief.id) || intersectCount(event.evidenceIds, plan.evidenceIds) > 0)
        .slice(0, 4);
      const relatedEngineeringPlans = engineeringPlans
        .filter((plan) => relatedDecisionIds.has(plan.validationPlan.brief.id) || intersectCount(event.evidenceIds, plan.evidenceIds) > 0)
        .slice(0, 4);
      const relatedRisks = risks
        .filter((risk) => risk.id !== event.id && (intersectCount(event.evidenceIds, risk.evidenceIds) > 0 || keywordMatches(`${risk.title} ${risk.summary}`, [event.title, event.ownerName])))
        .slice(0, 4);
      const missingEvidence = impactMissingEvidence(data, event.evidenceIds, relatedFeatures, relatedDecisions);
      const evidenceProfile = textEvidenceProfile(data, event.evidenceIds);
      const impactScore = Math.max(
        10,
        Math.min(
          100,
          Math.round(
            event.baseScore +
              relatedFeatures.length * 6 +
              relatedDecisions.length * 8 +
              relatedValidationPlans.length * 4 +
              relatedRisks.filter((risk) => risk.severity === "high").length * 6 -
              missingEvidence.length * 4
          )
        )
      );
      const confidenceScore = Math.max(
        10,
        Math.min(100, Math.round(evidenceProfile.averageScore * 0.65 + Math.min(20, event.evidenceIds.length * 5) + relatedFeatures.length * 4 + relatedDecisions.length * 5 - missingEvidence.length * 3))
      );
      const stage = changeImpactStage({ impactScore, relatedDecisions, relatedEngineeringPlans, relatedRisks, missingEvidence });
      const baseTrace = {
        id: event.id,
        sourceType: event.sourceType,
        sourceLabel: changeImpactSourceLabel(event.sourceType),
        ownerId: event.ownerId,
        ownerName: event.ownerName,
        title: event.title,
        summary: event.summary,
        severity: event.severity,
        stage,
        impactScore,
        confidenceScore,
        capturedAt: event.capturedAt,
        evidenceIds: uniqueValues(event.evidenceIds),
        relatedFeatures,
        relatedDecisions,
        relatedValidationPlans,
        relatedEngineeringPlans,
        relatedRisks,
        missingEvidence
      };
      const nextActions = changeImpactNextActions(baseTrace);
      return {
        ...baseTrace,
        nextActions,
        reportSnippet: buildChangeImpactReportSnippet({ ...baseTrace, nextActions })
      };
    })
    .sort((left, right) => right.impactScore - left.impactScore || right.confidenceScore - left.confidenceScore)
    .slice(0, 24);
}

function citationStatusFromScore(score: number, evidenceCount: number): CitationClaimStatus {
  if (evidenceCount === 0 || score < 35) {
    return "unsupported";
  }
  if (score >= 78) {
    return "ready";
  }
  if (score >= 58) {
    return "reviewable";
  }
  return "weak";
}

function citationMissingEvidence(data: ApiStateResponse, evidenceIds: string[]): string[] {
  const records = evidenceRecordsForIds(data, evidenceIds);
  const platforms = records.map((record) => evidencePlatformFromChannel(record.channelName));
  const sourceTypes = new Set(records.map((record) => record.sourceType));
  const missing: string[] = [];
  if (evidenceIds.length === 0) {
    missing.push("没有 Evidence ID，不能写入强结论。");
  }
  if (sourceTypes.size < 2) {
    missing.push("缺第二类来源，建议补截图、评论、官网或社媒样本。");
  }
  if (!platforms.includes("ios")) {
    missing.push("缺 iOS 证据。");
  }
  if (!platforms.includes("android")) {
    missing.push("缺国内 Android 渠道证据。");
  }
  if (records.every((record) => record.screenshots.length === 0)) {
    missing.push("缺截图证据。");
  }
  if (records.every((record) => record.reviewCount === 0 && record.sourceType !== "review")) {
    missing.push("缺用户评论原文。");
  }
  if (records.some((record) => daysSinceCaptured(record.capturedAt) > 90)) {
    missing.push("存在超过 90 天的旧证据。");
  }
  return uniqueValues(missing).slice(0, 6);
}

function buildCitationClaim(input: {
  data: ApiStateResponse;
  id: string;
  source: CitationClaimSource;
  title: string;
  claim: string;
  owner: ActionRecommendation["ownerRole"];
  evidenceIds: string[];
}): EvidenceCitationClaim {
  const evidenceIds = uniqueValues(input.evidenceIds);
  const profile = textEvidenceProfile(input.data, evidenceIds);
  const missingEvidence = citationMissingEvidence(input.data, evidenceIds);
  const supportScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        profile.averageScore * 0.62 +
          Math.min(16, evidenceIds.length * 3) +
          Math.min(10, profile.sourceCount * 3) +
          Math.min(8, profile.platformCount * 3) +
          Math.min(6, profile.screenshotCount * 2) +
          Math.min(6, profile.reviewCount * 2) -
          profile.staleCount * 5 -
          missingEvidence.length * 3
      )
    )
  );
  const status = citationStatusFromScore(supportScore, evidenceIds.length);
  return {
    id: input.id,
    source: input.source,
    title: input.title,
    claim: input.claim,
    owner: input.owner,
    supportScore,
    status,
    evidenceIds,
    sourceCount: profile.sourceCount,
    platformCount: profile.platformCount,
    screenshotCount: profile.screenshotCount,
    reviewCount: profile.reviewCount,
    staleCount: profile.staleCount,
    missingEvidence,
    nextAction:
      status === "ready"
        ? "可进入周报、PRD 或评审材料，但仍保留 Evidence ID。"
        : status === "reviewable"
          ? "可进入评审，同时标注待补证据。"
          : status === "weak"
            ? "先补来源、截图、评论或跨平台证据再做强判断。"
            : "不要直接引用为结论，先补原始证据。"
  };
}

function buildEvidenceCitationClaims(data: ApiStateResponse, latestReport?: Report): EvidenceCitationClaim[] {
  const decisions = buildProductDecisionBriefs(data);
  const strategies = buildStrategicInferences(data);
  const risks = buildRiskRegister(data);
  const validations = buildReleaseValidationPlans(data);
  const featureDetails = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const featureRecords = normalizeFeatures(data.state.features)
    .map((feature) => buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id)))
    .sort((left, right) => right.modelScore - left.modelScore)
    .slice(0, 8);
  const executiveBrief = buildExecutiveReportBrief(data);

  return [
    ...decisions.slice(0, 8).map((decision) =>
      buildCitationClaim({
        data,
        id: `claim:decision:${decision.id}`,
        source: "decision",
        title: decision.packageItem.title,
        claim: `${decision.outcomeLabel}：${decision.releaseGate}`,
        owner: "product",
        evidenceIds: decision.packageItem.evidenceIds
      })
    ),
    ...strategies.slice(0, 8).map((strategy) =>
      buildCitationClaim({
        data,
        id: `claim:strategy:${strategy.id}`,
        source: "strategy",
        title: `${strategy.ownerName} / ${strategy.themeLabel}`,
        claim: strategy.hypothesis,
        owner: "product",
        evidenceIds: strategy.evidenceIds
      })
    ),
    ...risks.slice(0, 8).map((risk) =>
      buildCitationClaim({
        data,
        id: `claim:risk:${risk.id}`,
        source: "risk",
        title: risk.title,
        claim: `${risk.summary} 建议：${risk.mitigation}`,
        owner: risk.owner,
        evidenceIds: risk.evidenceIds
      })
    ),
    ...featureRecords.map((record) =>
      buildCitationClaim({
        data,
        id: `claim:feature:${record.feature.id}`,
        source: "feature",
        title: record.feature.name,
        claim: record.modelSummary,
        owner: "product",
        evidenceIds: featureRecordEvidenceIds(record)
      })
    ),
    ...validations.slice(0, 6).map((plan) =>
      buildCitationClaim({
        data,
        id: `claim:validation:${plan.id}`,
        source: "validation",
        title: plan.brief.packageItem.title,
        claim: `${plan.hypothesis} 门槛：${plan.decisionGate}`,
        owner: "engineering",
        evidenceIds: plan.evidenceIds
      })
    ),
    buildCitationClaim({
      data,
      id: "claim:report:executive",
      source: "report",
      title: latestReport ? `周报 ${latestReport.period.start} - ${latestReport.period.end}` : executiveBrief.title,
      claim: executiveBrief.summary.join(" "),
      owner: "product",
      evidenceIds: latestReport?.evidenceIds.length ? latestReport.evidenceIds : executiveBrief.evidenceIds
    })
  ].sort((left, right) => {
    const statusOrder: Record<CitationClaimStatus, number> = { unsupported: 4, weak: 3, reviewable: 2, ready: 1 };
    return statusOrder[right.status] - statusOrder[left.status] || right.supportScore - left.supportScore;
  });
}

function strategicThemeForFeature(feature: Feature): StrategicTheme {
  const text = `${feature.name} ${feature.category}`;
  if (/AI|生成|写真|智能|识别/.test(text)) {
    return "ai_acceleration";
  }
  if (/会员|价格|订阅|导出|权益|付费/.test(text)) {
    return "monetization";
  }
  if (/模板|素材|活动|话题|分享|社媒/.test(text)) {
    return "content_growth";
  }
  if (/评分|评论|启动|稳定|质量|失败|卡顿|夜景/.test(text)) {
    return "quality_experience";
  }
  if (/商店|ASO|关键词|截图|定位|描述/.test(text)) {
    return "store_positioning";
  }
  return "platform_channel";
}

function likelyMovesForTheme(theme: StrategicTheme): string[] {
  const moves: Record<StrategicTheme, string[]> = {
    ai_acceleration: ["继续增加 AI 模板入口", "强化生成结果展示", "把 AI 能力包装成会员权益"],
    monetization: ["调整会员权益表达", "增加导出或 AI 点数付费触发", "测试连续包月和年卡组合"],
    content_growth: ["围绕节日和热点推模板", "加大社媒话题样本", "用模板活动带动分享"],
    quality_experience: ["修复评分口碑风险", "优化启动、失败态和低端机体验", "在更新日志强化稳定性表达"],
    store_positioning: ["更新商店截图和关键词", "突出主卖点和 AI 能力", "调整版本文案定位"],
    platform_channel: ["分 iOS / Android 渠道上新", "优先补国内厂商渠道曝光", "用渠道差异化测试卖点"]
  };
  return moves[theme];
}

function roadmapResponseForTheme(theme: StrategicTheme): string {
  const responses: Record<StrategicTheme, string> = {
    ai_acceleration: "用功能详情页确认当前 AI 能力差距，先做最短闭环和生成质量验证。",
    monetization: "补齐具体价格、付费负评和权益边界，再决定是否调整会员策略。",
    content_growth: "把社媒样本和模板表现拆开看，优先验证可复用内容供给。",
    quality_experience: "研发先看启动、失败、保存、导出和低端机路径，避免只做视觉优化。",
    store_positioning: "补商店截图和 ASO 关键词，对齐当前 App 卖点表达。",
    platform_channel: "按 iOS、Android、厂商渠道拆证据，不用单个平台结论代表全量。"
  };
  return responses[theme];
}

function roadmapBetFromStrategy(strategy: StrategicInference): CompetitorRoadmapBet {
  const horizon: RoadmapHorizon = strategy.stage === "strategic_inference" && strategy.confidence >= 74 ? "now" : strategy.stage === "pattern" ? "next" : "later";
  return {
    id: `roadmap-bet:${strategy.id}`,
    theme: strategy.theme,
    themeLabel: strategy.themeLabel,
    title: strategy.hypothesis,
    horizon,
    confidence: strategy.confidence,
    reason: `${strategy.sourceTypes.join("、")} 形成 ${strategy.signals.length} 个信号，影响 ${impactLabel(strategy.impact)}。`,
    likelyMoves: likelyMovesForTheme(strategy.theme),
    productResponse: strategy.recommendation,
    evidenceIds: strategy.evidenceIds,
    missingEvidence: strategy.missingEvidence
  };
}

function roadmapBetFromFeature(data: ApiStateResponse, competitor: Competitor, record: FeatureComparisonRecord): CompetitorRoadmapBet | undefined {
  const competitorSnapshot = record.competitorSnapshots.find((snapshot) => snapshot.ownerId === competitor.id);
  if (!competitorSnapshot || competitorSnapshot.support === "missing" || competitorSnapshot.support === "unknown") {
    return undefined;
  }
  if (record.ownSnapshot.support !== "missing" && record.ownSnapshot.support !== "partial") {
    return undefined;
  }
  const theme = strategicThemeForFeature(record.feature);
  const evidenceIds = featureRecordEvidenceIds(record);
  const confidence = Math.min(88, Math.round(record.modelScore * 0.55 + competitorSnapshot.capabilityScore * 0.35 + Math.min(10, evidenceIds.length * 2)));
  const horizon: RoadmapHorizon = confidence >= 74 ? "now" : confidence >= 58 ? "next" : "later";
  return {
    id: `roadmap-bet:${competitor.id}:${record.feature.id}`,
    theme,
    themeLabel: strategicThemeMeta[theme].label,
    title: `${competitor.name} 可能继续强化「${record.feature.name}」`,
    horizon,
    confidence,
    reason: `${competitor.name} 成熟度 ${maturityLabel(competitorSnapshot.maturityLevel)}，当前 App ${maturityLabel(record.ownSnapshot.maturityLevel)}。`,
    likelyMoves: likelyMovesForTheme(theme),
    productResponse: roadmapResponseForTheme(theme),
    evidenceIds,
    missingEvidence: record.taskCards[0]?.readiness === "needs_evidence" ? ["功能证据不足，先补截图、评论或社媒样本。"] : []
  };
}

function buildCompetitorRoadmapHypotheses(data: ApiStateResponse): CompetitorRoadmapHypothesis[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const strategies = buildStrategicInferences(data);
  const featureDetails = buildFeatureGapDetails(data.state, ownedAppId);
  const featureRecords = normalizeFeatures(data.state.features).map((feature) =>
    buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id))
  );

  return data.state.competitors
    .map((competitor) => {
      const strategyBets = strategies.filter((strategy) => strategy.ownerId === competitor.id).map(roadmapBetFromStrategy);
      const featureBets = featureRecords
        .map((record) => roadmapBetFromFeature(data, competitor, record))
        .filter(Boolean) as CompetitorRoadmapBet[];
      const bets = [...strategyBets, ...featureBets]
        .sort((left, right) => right.confidence - left.confidence || roadmapHorizonWeight(left.horizon) - roadmapHorizonWeight(right.horizon))
        .slice(0, 6);
      const evidenceIds = uniqueValues(bets.flatMap((bet) => bet.evidenceIds));
      const blockers = uniqueValues(bets.flatMap((bet) => bet.missingEvidence)).slice(0, 6);
      const confidence = bets.length ? Math.round(bets.reduce((sum, bet) => sum + bet.confidence, 0) / bets.length) : 0;
      const topBet = bets[0];
      return {
        ownerId: competitor.id,
        ownerName: competitor.name,
        priority: competitor.priority,
        confidence,
        summary: topBet ? `${competitor.name} 最可能的下一步是：${topBet.title}` : "暂无足够信号推测路线。",
        bets,
        responsePlan: uniqueValues([
          topBet ? `本周：围绕「${topBet.themeLabel}」补证据并进入专题讨论。` : "本周：先补渠道、版本和评论证据。",
          ...bets.slice(0, 3).map((bet) => `${roadmapHorizonLabel(bet.horizon)}：${bet.productResponse}`),
          blockers[0] ? `先补缺口：${blockers[0]}` : "把高置信路线推测写入周报，并保留反证。"
        ]).slice(0, 5),
        blockers,
        evidenceIds
      };
    })
    .sort((left, right) => priorityScore(right.priority ?? "P2") - priorityScore(left.priority ?? "P2") || right.confidence - left.confidence);
}

function roadmapHorizonWeight(horizon: RoadmapHorizon): number {
  const weights: Record<RoadmapHorizon, number> = { now: 1, next: 2, later: 3 };
  return weights[horizon];
}

function makeReportQualityCheck(input: Omit<ReportQualityCheck, "status">): ReportQualityCheck {
  const status: ReportGateStatus = input.score >= 78 ? "pass" : input.score >= 56 ? "review" : "blocked";
  return { ...input, status };
}

function buildReportGateSnippet(gate: Omit<ReportQualityGate, "reportSnippet">): string {
  return [
    "### 报告审核门禁",
    "",
    `- 状态：${reportGateStatusLabel(gate.status)}，总分 ${gate.score}`,
    `- 结论：${gate.verdict}`,
    `- 阻塞项：${gate.blockers.join("；") || "暂无"}`,
    `- 发布清单：${gate.exportChecklist.join("；")}`,
    `- Evidence：${gate.evidenceIds.join(", ") || "待补"}`
  ].join("\n");
}

function buildReportQualityGate(data: ApiStateResponse, latestReport?: Report): ReportQualityGate {
  const executiveBrief = buildExecutiveReportBrief(data);
  const claims = buildEvidenceCitationClaims(data, latestReport);
  const risks = buildRiskRegister(data);
  const validationPlans = buildReleaseValidationPlans(data);
  const engineeringPlans = buildEngineeringReadinessPlans(data);
  const evidenceIds = uniqueValues([...(latestReport?.evidenceIds ?? []), ...executiveBrief.evidenceIds]);
  const records = evidenceRecordsForIds(data, evidenceIds);
  const profile = textEvidenceProfile(data, evidenceIds);
  const platforms = records.map((record) => evidencePlatformFromChannel(record.channelName));
  const latestReportAge = latestReport ? daysSinceCaptured(latestReport.generatedAt) : 365;
  const openHighRisks = risks.filter((risk) => risk.severity === "high" && risk.status === "open");
  const weakClaims = claims.filter((claim) => claim.status === "weak" || claim.status === "unsupported");
  const checks: ReportQualityCheck[] = [
    makeReportQualityCheck({
      id: "gate:evidence-volume",
      title: "证据数量",
      score: Math.min(100, evidenceIds.length * 12),
      detail: `当前报告可引用 Evidence ${evidenceIds.length} 条。`,
      owner: "research",
      action: "管理层专题建议至少 8 条核心证据，周报至少 5 条。",
      evidenceIds
    }),
    makeReportQualityCheck({
      id: "gate:credibility",
      title: "证据可信度",
      score: profile.averageScore,
      detail: `平均证据分 ${profile.averageScore}，来源 ${profile.sourceCount} 类。`,
      owner: "research",
      action: "低于可评审线时补来源链接、截图、评论和第二来源。",
      evidenceIds
    }),
    makeReportQualityCheck({
      id: "gate:platform",
      title: "iOS / Android 覆盖",
      score: (platforms.includes("ios") ? 45 : 0) + (platforms.includes("android") ? 45 : 0) + Math.min(10, profile.platformCount * 2),
      detail: `平台覆盖：${uniqueValues(platforms).join("、") || "待补"}。`,
      owner: "research",
      action: "中国区 App 竞品结论必须区分 iOS 和国内 Android 渠道。",
      evidenceIds
    }),
    makeReportQualityCheck({
      id: "gate:screenshot",
      title: "截图 / 页面证据",
      score: Math.min(100, profile.screenshotCount * 25),
      detail: `截图或页面证据 ${profile.screenshotCount} 张。`,
      owner: "product",
      action: "补商店截图、功能入口、付费页或结果页，方便研发和设计判断。",
      evidenceIds
    }),
    makeReportQualityCheck({
      id: "gate:reviews",
      title: "用户原话",
      score: Math.min(100, profile.reviewCount * 22),
      detail: `评论原文和评论关联 ${profile.reviewCount} 条。`,
      owner: "product",
      action: "每个强需求至少带 1-2 条用户原话或社媒公开样本。",
      evidenceIds
    }),
    makeReportQualityCheck({
      id: "gate:social",
      title: "社媒样本",
      score: records.some((record) => record.sourceType === "social") ? 88 : 42,
      detail: records.some((record) => record.sourceType === "social") ? "已包含社媒证据。" : "缺小红书、抖音或微博样本。",
      owner: "growth",
      action: "AI、模板、活动、传播类结论必须补社媒链接。",
      evidenceIds: records.filter((record) => record.sourceType === "social").map((record) => record.id)
    }),
    makeReportQualityCheck({
      id: "gate:decisions",
      title: "决策可执行性",
      score: Math.min(100, buildProductDecisionBriefs(data).length * 18 + validationPlans.length * 8),
      detail: `决策包 ${buildProductDecisionBriefs(data).length} 个，上线验证 ${validationPlans.length} 个。`,
      owner: "product",
      action: "报告不能只写竞品动态，必须落到做 / 不做 / 补证据 / 观察。",
      evidenceIds: buildProductDecisionBriefs(data).flatMap((decision) => decision.packageItem.evidenceIds)
    }),
    makeReportQualityCheck({
      id: "gate:engineering",
      title: "研发可落地性",
      score: Math.max(0, Math.min(100, engineeringPlans.length * 18 - engineeringPlans.filter((plan) => plan.stage === "blocked").length * 25)),
      detail: `研发准备项 ${engineeringPlans.length} 个，阻塞 ${engineeringPlans.filter((plan) => plan.stage === "blocked").length} 个。`,
      owner: "engineering",
      action: "P0/P1 需求必须给出数据契约、QA 验收和灰度门槛。",
      evidenceIds: engineeringPlans.flatMap((plan) => plan.evidenceIds)
    }),
    makeReportQualityCheck({
      id: "gate:risk",
      title: "高风险处理",
      score: Math.max(0, 100 - openHighRisks.length * 24),
      detail: `开放高风险 ${openHighRisks.length} 个。`,
      owner: "product",
      action: "发送前处理证据、渠道、研发、报告类阻塞风险。",
      evidenceIds: openHighRisks.flatMap((risk) => risk.evidenceIds)
    }),
    makeReportQualityCheck({
      id: "gate:claims",
      title: "结论引用完整性",
      score: Math.max(0, 100 - weakClaims.length * 11),
      detail: `弱引用或无证据结论 ${weakClaims.length} 条。`,
      owner: "research",
      action: "进入引用图谱补证据，不要让强结论没有来源。",
      evidenceIds: weakClaims.flatMap((claim) => claim.evidenceIds)
    }),
    makeReportQualityCheck({
      id: "gate:freshness",
      title: "报告新鲜度",
      score: latestReportAge <= 7 ? 92 : latestReportAge <= 14 ? 70 : 35,
      detail: latestReport ? `最近报告 ${latestReportAge} 天前生成。` : "尚未生成周报。",
      owner: "product",
      action: "超过两周的报告必须重新生成或重新审核证据。",
      evidenceIds: latestReport?.evidenceIds ?? []
    })
  ];
  const averageScore = checks.length ? Math.round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length) : 0;
  const blockers = checks.filter((check) => check.status === "blocked").map((check) => `${check.title}：${check.action}`);
  const score = Math.max(0, Math.min(100, Math.round(averageScore - blockers.length * 2)));
  const status: ReportGateStatus = blockers.length > 0 || score < 58 ? "blocked" : score >= 78 ? "pass" : "review";
  const verdict =
    status === "pass"
      ? "可以进入周会、需求评审或管理层同步。"
      : status === "review"
        ? "可以内部评审，但发送前需要标注证据缺口。"
        : "不建议发送强结论，先补阻塞项。";
  const exportChecklist = [
    "所有强结论保留 Evidence ID 和来源链接。",
    "iOS、Android、社媒、评论、截图缺口在报告中显式标注。",
    "P0/P1 建议必须带 MVP、指标、灰度和回滚口径。",
    "战略推测必须区分事实、模式和推断，不写成确定结论。",
    "报告发送后把风险和任务回写到需求池或研发准备页。"
  ];
  const gateBase = { score, status, verdict, checks, blockers, exportChecklist, evidenceIds };
  return {
    ...gateBase,
    reportSnippet: buildReportGateSnippet(gateBase)
  };
}

function executionBacklogSourceLabel(source: ExecutionBacklogSource): string {
  const labels: Record<ExecutionBacklogSource, string> = {
    opportunity: "机会雷达",
    feature: "功能任务",
    decision: "产品决策",
    validation: "上线验证",
    engineering: "研发准备",
    risk: "风险缓解",
    impact: "影响链",
    pain: "痛点雷达",
    report_gate: "报告门禁"
  };
  return labels[source];
}

function executionBacklogLaneLabel(lane: ExecutionBacklogLane): string {
  const labels: Record<ExecutionBacklogLane, string> = {
    this_week: "本周处理",
    next_version: "下版候选",
    needs_evidence: "先补证据",
    needs_scope: "先收敛范围",
    blocked: "阻塞",
    watch: "继续观察"
  };
  return labels[lane];
}

function evidenceCollectionStatusLabel(status: EvidenceCollectionStatus): string {
  const labels: Record<EvidenceCollectionStatus, string> = {
    missing: "缺失",
    weak: "薄弱",
    stale: "过旧",
    manual: "手动补"
  };
  return labels[status];
}

function executionLaneFromInput(input: {
  priority: Priority;
  score: number;
  readiness: RequirementReadiness | "blocked";
  risk: "low" | "medium" | "high";
  evidenceIds: string[];
}): ExecutionBacklogLane {
  if (input.readiness === "blocked" || (input.risk === "high" && input.score < 65)) {
    return "blocked";
  }
  if (input.readiness === "needs_evidence" || input.evidenceIds.length === 0) {
    return "needs_evidence";
  }
  if (input.readiness === "needs_scope") {
    return "needs_scope";
  }
  if (input.priority === "P0" && input.score >= 72 && input.readiness === "ready") {
    return "this_week";
  }
  if (input.priority !== "P2" || input.score >= 58) {
    return "next_version";
  }
  return "watch";
}

function makeExecutionBacklogItem(input: Omit<ExecutionBacklogItem, "sourceLabel" | "lane"> & { lane?: ExecutionBacklogLane }): ExecutionBacklogItem {
  const lane = input.lane ?? executionLaneFromInput(input);
  return {
    ...input,
    lane,
    sourceLabel: executionBacklogSourceLabel(input.source)
  };
}

function buildExecutionBacklog(data: ApiStateResponse, latestReport?: Report): ExecutionBacklogItem[] {
  const recommendations = actionRecommendationsFor(data);
  const featureDetails = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const featureRecords = normalizeFeatures(data.state.features).map((feature) =>
    buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id))
  );
  const decisions = buildProductDecisionBriefs(data);
  const validations = buildReleaseValidationPlans(data);
  const engineeringPlans = buildEngineeringReadinessPlans(data);
  const risks = buildRiskRegister(data);
  const impacts = buildChangeImpactTraces(data);
  const pains = buildUserPainThemes(data);
  const reportGate = buildReportQualityGate(data, latestReport);
  const items: ExecutionBacklogItem[] = [];

  recommendations.forEach((recommendation) => {
    const readiness: RequirementReadiness = recommendation.evidenceIds.length === 0 ? "needs_evidence" : recommendation.status === "Planned" || recommendation.status === "Accepted" ? "ready" : "needs_scope";
    items.push(
      makeExecutionBacklogItem({
        id: `backlog:opportunity:${recommendation.id}`,
        source: "opportunity",
        title: recommendation.title,
        owner: recommendation.ownerRole,
        priority: recommendation.priorityHint,
        score: Math.round(recommendation.impactScore * 0.62 + recommendation.confidence * 0.38),
        readiness,
        reason: recommendation.whyNow,
        nextStep: recommendation.recommendation,
        scope: recommendation.implementationHint,
        acceptance: [recommendation.successMetric, `动作类型：${recommendationActionLabel(recommendation.actionType)}`, `成本：${effortLabel(recommendation.effort)}`],
        risk: recommendation.effort === "L" ? "high" : recommendation.effort === "M" ? "medium" : "low",
        evidenceIds: recommendation.evidenceIds
      })
    );
  });

  featureRecords
    .flatMap((record) => record.taskCards.map((task) => ({ record, task })))
    .forEach(({ record, task }) => {
      items.push(
        makeExecutionBacklogItem({
          id: `backlog:feature:${task.id}`,
          source: "feature",
          title: task.title,
          owner: task.ownerRole,
          priority: task.priorityHint,
          score: Math.round(task.score * 0.7 + record.modelScore * 0.3),
          readiness: task.readiness,
          reason: task.whyNow,
          nextStep: task.objective,
          scope: task.scope,
          acceptance: task.acceptance,
          risk: task.risk,
          evidenceIds: task.evidenceIds
        })
      );
    });

  decisions.forEach((decision) => {
    items.push(
      makeExecutionBacklogItem({
        id: `backlog:decision:${decision.id}`,
        source: "decision",
        title: decision.packageItem.title,
        owner: "product",
        priority: decision.packageItem.priorityHint,
        score: decision.packageItem.score,
        readiness: decision.evidenceGaps.some((gap) => gap.severity === "high") ? "needs_evidence" : decision.outcome === "commit" ? "ready" : "needs_scope",
        reason: decision.packageItem.whyNow,
        nextStep: decision.releaseGate,
        scope: decision.packageItem.mvpScope,
        acceptance: [decision.packageItem.successMetric, ...decision.experiments.slice(0, 2).map((experiment) => experiment.successDefinition)],
        risk: decision.roadmapItem.engineeringRisk,
        evidenceIds: decision.packageItem.evidenceIds
      })
    );
  });

  validations.forEach((plan) => {
    items.push(
      makeExecutionBacklogItem({
        id: `backlog:validation:${plan.id}`,
        source: "validation",
        title: `验证：${plan.brief.packageItem.title}`,
        owner: "engineering",
        priority: plan.brief.packageItem.priorityHint,
        score: plan.confidenceScore,
        readiness: plan.stage === "blocked" ? "blocked" : plan.stage === "instrumentation" ? "needs_scope" : "ready",
        reason: plan.stageReason,
        nextStep: plan.decisionGate,
        scope: plan.hypothesis,
        acceptance: plan.metrics.slice(0, 4).map((metric) => `${metric.metric}：${metric.target}`),
        risk: plan.metrics.some((metric) => metric.risk === "high") ? "high" : plan.stage === "gray_release" ? "medium" : "low",
        evidenceIds: plan.evidenceIds
      })
    );
  });

  engineeringPlans.forEach((plan) => {
    items.push(
      makeExecutionBacklogItem({
        id: `backlog:engineering:${plan.id}`,
        source: "engineering",
        title: `研发准备：${plan.validationPlan.brief.packageItem.title}`,
        owner: "engineering",
        priority: plan.validationPlan.brief.packageItem.priorityHint,
        score: plan.readinessScore,
        readiness: plan.stage === "blocked" ? "blocked" : plan.stage === "ready_to_scope" ? "ready" : "needs_scope",
        reason: plan.devStartGate,
        nextStep: plan.openQuestions[0] ?? plan.devStartGate,
        scope: plan.implementationSummary,
        acceptance: [...plan.qaChecks.slice(0, 3).map((check) => check.acceptance), ...plan.rolloutPlan.slice(0, 2)],
        risk: plan.qaChecks.some((check) => check.risk === "high") || plan.stage === "needs_risk_review" ? "high" : plan.stage === "ready_to_scope" ? "low" : "medium",
        evidenceIds: plan.evidenceIds
      })
    );
  });

  risks
    .filter((risk) => risk.severity !== "low")
    .forEach((risk) => {
      items.push(
        makeExecutionBacklogItem({
          id: `backlog:risk:${risk.id}`,
          source: "risk",
          title: `处理风险：${risk.title}`,
          owner: risk.owner,
          priority: risk.severity === "high" ? "P0" : "P1",
          score: risk.severity === "high" ? 86 : 66,
          readiness: risk.evidenceIds.length === 0 ? "needs_evidence" : risk.status === "open" ? "needs_scope" : "ready",
          reason: risk.summary,
          nextStep: risk.mitigation,
          scope: `${riskRegisterAreaLabel(risk.area)} / ${risk.source}`,
          acceptance: [`下次检查：${risk.nextCheck}`, `状态：${riskRegisterStatusLabel(risk.status)}`],
          risk: risk.severity,
          evidenceIds: risk.evidenceIds
        })
      );
    });

  impacts
    .filter((trace) => trace.impactScore >= 62 || trace.stage === "blocked")
    .forEach((trace) => {
      items.push(
        makeExecutionBacklogItem({
          id: `backlog:impact:${trace.id}`,
          source: "impact",
          title: `跟进变化：${trace.title}`,
          owner: trace.stage === "blocked" ? "research" : "product",
          priority: trace.impactScore >= 78 ? "P0" : "P1",
          score: trace.impactScore,
          readiness: trace.stage === "blocked" ? "blocked" : trace.missingEvidence.length > 0 ? "needs_evidence" : trace.stage === "execute" ? "ready" : "needs_scope",
          reason: trace.summary,
          nextStep: trace.nextActions[0],
          scope: `${trace.sourceLabel} / ${trace.ownerName}`,
          acceptance: trace.nextActions.slice(0, 4),
          risk: trace.severity,
          evidenceIds: trace.evidenceIds
        })
      );
    });

  pains
    .filter((theme) => theme.severity !== "low")
    .forEach((theme) => {
      items.push(
        makeExecutionBacklogItem({
          id: `backlog:pain:${theme.id}`,
          source: "pain",
          title: `改善痛点：${theme.title}`,
          owner: theme.owner,
          priority: theme.severity === "high" ? "P0" : "P1",
          score: Math.round(theme.frequencyScore * 0.55 + theme.sentimentScore * 0.45),
          readiness: theme.evidenceIds.length === 0 ? "needs_evidence" : theme.relatedFeatures.length === 0 ? "needs_scope" : "ready",
          reason: theme.summary,
          nextStep: theme.recommendation,
          scope: theme.relatedFeatures.join("；") || "先补功能映射",
          acceptance: [...theme.userQuotes.slice(0, 2), ...theme.socialSignals.slice(0, 2)],
          risk: theme.severity,
          evidenceIds: theme.evidenceIds
        })
      );
    });

  reportGate.checks
    .filter((check) => check.status !== "pass")
    .forEach((check) => {
      items.push(
        makeExecutionBacklogItem({
          id: `backlog:report-gate:${check.id}`,
          source: "report_gate",
          title: `报告门禁：${check.title}`,
          owner: check.owner,
          priority: check.status === "blocked" ? "P0" : "P1",
          score: 100 - check.score,
          readiness: check.status === "blocked" ? "blocked" : "needs_evidence",
          lane: check.status === "blocked" ? "blocked" : "needs_evidence",
          reason: check.detail,
          nextStep: check.action,
          scope: "发送前补齐报告证据和评审口径",
          acceptance: [reportGateStatusLabel(check.status), `检查分：${check.score}`],
          risk: check.status === "blocked" ? "high" : "medium",
          evidenceIds: check.evidenceIds
        })
      );
    });

  return items
    .sort((left, right) => {
      const laneOrder: Record<ExecutionBacklogLane, number> = { blocked: 6, this_week: 5, needs_evidence: 4, needs_scope: 3, next_version: 2, watch: 1 };
      return laneOrder[right.lane] - laneOrder[left.lane] || priorityScore(right.priority) - priorityScore(left.priority) || right.score - left.score;
    })
    .slice(0, 120);
}

function metricMissingFields(metric: ReleaseValidationMetricPlan): string[] {
  const missing: string[] = [];
  if (!metric.eventName || metric.eventName.includes("todo")) {
    missing.push("event_name 需要确认。");
  }
  if (/待|未知|暂无/.test(metric.baseline)) {
    missing.push("缺基线值。");
  }
  if (/待|未知|暂无/.test(metric.target)) {
    missing.push("缺目标值。");
  }
  if (/待|未知|暂无/.test(metric.reviewWindow)) {
    missing.push("缺复盘窗口。");
  }
  if (!metric.successDefinition) {
    missing.push("缺成功定义。");
  }
  return missing;
}

function buildMetricDictionary(data: ApiStateResponse): MetricDictionaryItem[] {
  const plans = buildReleaseValidationPlans(data);
  const items = plans.flatMap((plan) =>
    plan.metrics.map<MetricDictionaryItem>((metric) => ({
      id: `metric:${plan.id}:${metric.eventName}`,
      title: metric.metric,
      eventName: metric.eventName,
      owner: metric.owner,
      source: plan.brief.packageItem.title,
      priority: plan.brief.packageItem.priorityHint,
      risk: metric.risk,
      baseline: metric.baseline,
      target: metric.target,
      reviewWindow: metric.reviewWindow,
      successDefinition: metric.successDefinition,
      implementationNote: `${plan.decisionGate} 灰度窗口：${plan.releaseWindow}`,
      missingFields: metricMissingFields(metric),
      evidenceIds: plan.evidenceIds
    }))
  );
  const byEventName = new Map<string, MetricDictionaryItem>();
  items.forEach((item) => {
    const existing = byEventName.get(item.eventName);
    if (!existing || severityWeight(item.risk) > severityWeight(existing.risk) || priorityScore(item.priority) > priorityScore(existing.priority)) {
      byEventName.set(item.eventName, {
        ...item,
        evidenceIds: uniqueValues([...(existing?.evidenceIds ?? []), ...item.evidenceIds]),
        missingFields: uniqueValues([...(existing?.missingFields ?? []), ...item.missingFields])
      });
    }
  });
  return Array.from(byEventName.values()).sort((left, right) => severityWeight(right.risk) - severityWeight(left.risk) || priorityScore(right.priority) - priorityScore(left.priority));
}

function inferEvidenceCollectionPlatform(text: string): string {
  if (/iOS|App Store|苹果/.test(text)) {
    return "iOS";
  }
  if (/Android|安卓|华为|小米|OPPO|vivo|应用宝/.test(text)) {
    return "Android";
  }
  if (/小红书|抖音|微博|社媒/.test(text)) {
    return "社媒";
  }
  if (/截图|页面|商店页|官网/.test(text)) {
    return "页面 / 截图";
  }
  return "通用";
}

function inferEvidenceCollectionType(text: string): string {
  if (/截图|页面|入口|UI|商店页/.test(text)) {
    return "截图 / 页面";
  }
  if (/评论|用户原话|差评|口碑/.test(text)) {
    return "评论原文";
  }
  if (/价格|会员|订阅|付费/.test(text)) {
    return "价格 / 会员";
  }
  if (/社媒|小红书|抖音|微博/.test(text)) {
    return "社媒链接";
  }
  if (/来源|URL|链接|第二类/.test(text)) {
    return "来源链接";
  }
  return "Evidence";
}

function makeEvidenceCollectionTask(input: Omit<EvidenceCollectionTask, "platform" | "evidenceType"> & { platform?: string; evidenceType?: string }): EvidenceCollectionTask {
  return {
    ...input,
    platform: input.platform ?? inferEvidenceCollectionPlatform(`${input.title} ${input.reason} ${input.nextAction}`),
    evidenceType: input.evidenceType ?? inferEvidenceCollectionType(`${input.title} ${input.reason} ${input.nextAction}`)
  };
}

function buildEvidenceCollectionQueue(data: ApiStateResponse, latestReport?: Report): EvidenceCollectionTask[] {
  const tasks: EvidenceCollectionTask[] = [];
  const coverageRows = buildCoverageMap(data);
  coverageRows.forEach((row) => {
    row.cells
      .filter((cell) => cell.status !== "strong")
      .forEach((cell) => {
        tasks.push(
          makeEvidenceCollectionTask({
            id: `evidence-queue:coverage:${row.ownerId}:${cell.dimension}`,
            title: `${row.ownerName} 补 ${cell.label} 证据`,
            owner: cell.dimension === "feature" || cell.dimension === "report" ? "product" : "research",
            priority: row.priority ?? (row.ownerType === "owned_app" ? "P0" : "P1"),
            status: cell.status === "missing" ? "missing" : "weak",
            score: 100 - cell.score,
            source: "Coverage Map",
            reason: cell.detail,
            nextAction: cell.nextAction,
            relatedObject: row.ownerName,
            evidenceIds: cell.evidenceIds
          })
        );
      });
  });

  buildEvidenceCitationClaims(data, latestReport)
    .filter((claim) => claim.missingEvidence.length > 0)
    .forEach((claim) => {
      claim.missingEvidence.forEach((gap, index) => {
        tasks.push(
          makeEvidenceCollectionTask({
            id: `evidence-queue:claim:${claim.id}:${index}`,
            title: `补引用证据：${claim.title}`,
            owner: claim.owner,
            priority: claim.status === "unsupported" || claim.status === "weak" ? "P0" : "P1",
            status: claim.status === "unsupported" ? "missing" : "weak",
            score: 100 - claim.supportScore,
            source: "Evidence Citation Graph",
            reason: gap,
            nextAction: claim.nextAction,
            relatedObject: citationSourceLabel(claim.source),
            evidenceIds: claim.evidenceIds
          })
        );
      });
    });

  buildChangeImpactTraces(data)
    .filter((trace) => trace.missingEvidence.length > 0)
    .forEach((trace) => {
      trace.missingEvidence.forEach((gap, index) => {
        tasks.push(
          makeEvidenceCollectionTask({
            id: `evidence-queue:impact:${trace.id}:${index}`,
            title: `补影响链证据：${trace.title}`,
            owner: "research",
            priority: trace.impactScore >= 78 ? "P0" : "P1",
            status: "missing",
            score: Math.max(30, 100 - trace.confidenceScore),
            source: "Change Impact Trace",
            reason: gap,
            nextAction: trace.nextActions[0],
            relatedObject: trace.ownerName,
            evidenceIds: trace.evidenceIds
          })
        );
      });
    });

  buildStrategicInferences(data)
    .filter((strategy) => strategy.missingEvidence.length > 0)
    .forEach((strategy) => {
      strategy.missingEvidence.forEach((gap, index) => {
        tasks.push(
          makeEvidenceCollectionTask({
            id: `evidence-queue:strategy:${strategy.id}:${index}`,
            title: `补战略推测证据：${strategy.ownerName} / ${strategy.themeLabel}`,
            owner: "research",
            priority: strategy.impact === "high" ? "P0" : "P1",
            status: "missing",
            score: Math.max(20, 100 - strategy.confidence),
            source: "Strategy Radar",
            reason: gap,
            nextAction: strategy.nextActions[0],
            relatedObject: strategy.hypothesis,
            evidenceIds: strategy.evidenceIds
          })
        );
      });
    });

  buildReportQualityGate(data, latestReport).checks
    .filter((check) => check.status !== "pass")
    .forEach((check) => {
      tasks.push(
        makeEvidenceCollectionTask({
          id: `evidence-queue:report:${check.id}`,
          title: `报告发送前补证：${check.title}`,
          owner: check.owner,
          priority: check.status === "blocked" ? "P0" : "P1",
          status: check.status === "blocked" ? "missing" : "weak",
          score: 100 - check.score,
          source: "Report Quality Gate",
          reason: check.detail,
          nextAction: check.action,
          relatedObject: "报告门禁",
          evidenceIds: check.evidenceIds
        })
      );
    });

  buildEvidenceRecords(data)
    .filter((record) => daysSinceCaptured(record.capturedAt) > 90 || buildEvidenceCredibilityProfile(data, record).grade === "weak" || buildEvidenceCredibilityProfile(data, record).grade === "insufficient")
    .forEach((record) => {
      const profile = buildEvidenceCredibilityProfile(data, record);
      tasks.push(
        makeEvidenceCollectionTask({
          id: `evidence-queue:record:${record.id}`,
          title: `复核证据：${record.ownerName} / ${record.channelName}`,
          owner: "research",
          priority: profile.grade === "insufficient" ? "P0" : "P1",
          status: daysSinceCaptured(record.capturedAt) > 90 ? "stale" : "weak",
          score: 100 - profile.score,
          source: "Evidence Credibility",
          reason: profile.missingEvidence[0] ?? profile.verdict,
          nextAction: profile.usageAdvice,
          relatedObject: record.rawExcerpt.slice(0, 60),
          evidenceIds: [record.id]
        })
      );
    });

  const byKey = new Map<string, EvidenceCollectionTask>();
  tasks.forEach((task) => {
    const key = `${task.title}:${task.reason}`;
    const existing = byKey.get(key);
    if (!existing || task.score > existing.score || priorityScore(task.priority) > priorityScore(existing.priority)) {
      byKey.set(key, task);
    }
  });
  return Array.from(byKey.values()).sort((left, right) => priorityScore(right.priority) - priorityScore(left.priority) || right.score - left.score).slice(0, 120);
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

function channelsFor(data: ApiStateResponse, competitor?: Competitor, platform?: StorePlatform): Channel[] {
  return data.state.channels.filter((channel) => {
    const ownerMatches = competitor ? channel.ownerType === "competitor" && channel.ownerId === competitor.id : channel.ownerType === "owned_app";
    return ownerMatches && (!platform || platformForChannel(channel) === platform);
  });
}

function platformChannelSummary(data: ApiStateResponse, competitor?: Competitor, platform?: StorePlatform): string {
  const channels = channelsFor(data, competitor, platform);
  if (channels.length === 0) {
    return "未配置";
  }
  return channels.map((channel) => `${channel.channelName}/${statusLabel(channel.crawlStatus)}`).join("；");
}

function latestSnapshotFor(data: ApiStateResponse, competitor?: Competitor) {
  const snapshots = data.state.snapshots
    .filter((snapshot) => (competitor ? snapshot.competitorId === competitor.id : !snapshot.competitorId))
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
  return snapshots[0];
}

function latestSnapshotForPlatform(data: ApiStateResponse, competitor: Competitor | undefined, platform: StorePlatform) {
  const platformChannelIds = new Set(channelsFor(data, competitor, platform).map((channel) => channel.id));
  return data.state.snapshots
    .filter((snapshot) => platformChannelIds.has(snapshot.channelId))
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
}

function competitorInsights(data: ApiStateResponse, competitor: Competitor): Insight[] {
  const channels = data.state.channels.filter((channel) => channel.ownerType === "competitor" && channel.ownerId === competitor.id);
  const channelIds = new Set(channels.map((channel) => channel.id));
  const evidenceIds = new Set(
    data.state.reviews.filter((review) => channelIds.has(review.channelId)).map((review) => review.evidenceId)
  );
  data.state.snapshots.filter((snapshot) => snapshot.competitorId === competitor.id).forEach((snapshot) => evidenceIds.add(snapshot.evidenceId));
  data.state.evidence.forEach((item) => {
    if (item.rawExcerpt.includes(competitor.name)) {
      evidenceIds.add(item.id);
    }
  });
  return data.state.insights.filter((insight) => insight.evidenceIds.some((id) => evidenceIds.has(id)));
}

function competitorInsightSummary(data: ApiStateResponse, competitor: Competitor): string {
  const insights = competitorInsights(data, competitor);
  if (insights.length === 0) {
    return "暂无明确热点";
  }
  return insights
    .slice(0, 2)
    .map((insight) => insight.category)
    .join("、");
}

function competitorFeatureSummary(data: ApiStateResponse, competitor: Competitor): { gap: string; advantage: string; action: string } {
  const features = normalizeFeatures(data.state.features);
  const gap = features.find((feature) => {
    const support = feature.competitorSupport[competitor.id];
    return (support === "owned" || support === "advantage") && (feature.currentAppSupport === "missing" || feature.currentAppSupport === "partial");
  });
  const advantage = features.find((feature) => feature.currentAppSupport === "advantage" && feature.competitorSupport[competitor.id] !== "advantage");
  return {
    gap: gap ? gap.name : "暂无明显差距",
    advantage: advantage ? advantage.name : "待继续验证",
    action: gap ? featureAction(gap) : advantage ? featureAction(advantage) : "继续监控"
  };
}

function reviewCountForPlatform(data: ApiStateResponse, competitor: Competitor | undefined, platform: StorePlatform): number {
  const channelIds = new Set(channelsFor(data, competitor, platform).map((channel) => channel.id));
  return data.state.reviews.filter((review) => channelIds.has(review.channelId)).length;
}

function insightSummaryFor(data: ApiStateResponse, competitor?: Competitor): string {
  if (competitor) {
    return competitorInsightSummary(data, competitor);
  }
  const ownChannelIds = new Set(data.state.channels.filter((channel) => channel.ownerType === "owned_app").map((channel) => channel.id));
  const ownEvidenceIds = new Set(data.state.reviews.filter((review) => ownChannelIds.has(review.channelId)).map((review) => review.evidenceId));
  const insights = data.state.insights.filter((insight) => insight.evidenceIds.some((id) => ownEvidenceIds.has(id)));
  if (insights.length === 0) {
    return "基准能力样本较少";
  }
  return insights
    .slice(0, 2)
    .map((insight) => insight.category)
    .join("、");
}

function ownFeatureSummary(data: ApiStateResponse): { coverage: string; advantage: string; gap: string; action: string } {
  const features = normalizeFeatures(data.state.features);
  const advantage = features.filter((feature) => feature.currentAppSupport === "advantage").slice(0, 2);
  const gap = features
    .filter((feature) => featureDecision(feature) === "gap" || featureDecision(feature) === "improve")
    .slice(0, 2);
  const ownedCount = features.filter((feature) => feature.currentAppSupport === "owned" || feature.currentAppSupport === "advantage").length;
  return {
    coverage: features.length === 0 ? "暂无功能样本" : `${ownedCount}/${features.length} 项已具备或优势`,
    advantage: advantage.map((feature) => feature.name).join("、") || "待继续验证",
    gap: gap.map((feature) => feature.name).join("、") || "暂无明显差距",
    action: gap[0] ? featureAction(gap[0]) : advantage[0] ? featureAction(advantage[0]) : "先执行分析，补齐基准能力"
  };
}

function priceSignalFor(data: ApiStateResponse, competitor?: Competitor): string {
  const snapshot = latestSnapshotFor(data, competitor);
  const pricingInsight = data.state.insights.find((insight) => insight.category.includes("会员") || insight.category.includes("价格"));
  if (snapshot?.priceText && pricingInsight) {
    return `${snapshot.priceText}；${pricingInsight.category}`;
  }
  return snapshot?.priceText ?? pricingInsight?.category ?? "暂无价格信号";
}

function membershipPriceFor(data: ApiStateResponse, competitor?: Competitor): string {
  const name = competitor?.name ?? data.state.currentOwnedApp?.name ?? "";
  const snapshotPrice = latestSnapshotFor(data, competitor)?.priceText;
  if (snapshotPrice && /[¥￥]\s?\d|\d+\s*元/.test(snapshotPrice)) {
    return snapshotPrice;
  }
  if (name.includes("B612")) {
    return "样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥118";
  }
  if (name.includes("美图")) {
    return "样本价：月卡 ¥25，季卡 ¥68，年卡 ¥198";
  }
  if (name.includes("醒图")) {
    return "样本价：月卡 ¥18，连续包月 ¥15/月，年卡 ¥128";
  }
  if (name.includes("轻颜")) {
    return "样本价：月卡 ¥18，连续包月 ¥12/月，年卡 ¥128";
  }
  return snapshotPrice ?? "待采集具体价格";
}

function membershipPriceForPlatform(data: ApiStateResponse, competitor: Competitor | undefined, platform: StorePlatform): string {
  const name = competitor?.name ?? data.state.currentOwnedApp?.name ?? "";
  const snapshotPrice = latestSnapshotForPlatform(data, competitor, platform)?.priceText;
  if (snapshotPrice && /[¥￥]\s?\d|\d+\s*元/.test(snapshotPrice)) {
    return snapshotPrice;
  }
  if (platform === "ios") {
    return membershipPriceFor(data, competitor);
  }
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

function platformVersionRating(data: ApiStateResponse, competitor: Competitor | undefined, platform: StorePlatform): string {
  const snapshot = latestSnapshotForPlatform(data, competitor, platform);
  if (!snapshot) {
    return "暂无快照";
  }
  const rating = snapshot.rating ? `${snapshot.rating} 分` : "无评分";
  const reviewCount = snapshot.reviewCount ? `${snapshot.reviewCount} 条评论` : "无评论量";
  return `${snapshot.version ?? "未知版本"} / ${rating} / ${reviewCount}`;
}

function platformChange(data: ApiStateResponse, competitor: Competitor | undefined, platform: StorePlatform): string {
  const snapshot = latestSnapshotForPlatform(data, competitor, platform);
  return snapshot?.releaseNotes ?? snapshot?.description ?? "暂无变化";
}

function structuredModuleAnalysisToView(analysis: CompetitorModuleAnalysis): ModuleAnalysisView {
  return {
    summary: analysis.summary,
    signals: analysis.signals,
    risks: analysis.risks,
    opportunities: analysis.opportunities,
    recommendation: analysis.recommendation,
    evidenceIds: analysis.evidenceIds,
    confidence: analysis.confidence,
    dataCoverage: analysis.dataCoverage,
    source: "structured"
  };
}

function latestModuleAnalysisFor(data: ApiStateResponse, competitor: Competitor, moduleType: ModuleAnalysisType): CompetitorModuleAnalysis | undefined {
  return (data.state.moduleAnalyses ?? [])
    .filter((analysis) => analysis.competitorId === competitor.id && analysis.moduleType === moduleType)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

function ownModuleAnalysisFor(data: ApiStateResponse, moduleType: ModuleAnalysisType): ModuleAnalysisView {
  const featureSummary = ownFeatureSummary(data);
  const insights = data.state.insights;
  const evidenceIds = Array.from(new Set(insights.flatMap((insight) => insight.evidenceIds)));
  const aiSignals = normalizeFeatures(data.state.features)
    .filter((feature) => /AI|智能|生成|模板/.test(`${feature.name} ${feature.category}`))
    .map((feature) => `${feature.name}/${supportLabel(feature.currentAppSupport)}`);

  if (moduleType === "growth") {
    return {
      summary: `当前增长基准关注 ${priceSignalFor(data)}，功能覆盖为 ${featureSummary.coverage}。`,
      signals: [insightSummaryFor(data), featureSummary.gap].filter((item) => item && item !== "暂无明显差距"),
      risks: ["缺少下载量、收入和投放数据时，不做规模推断。"],
      opportunities: [featureSummary.advantage],
      recommendation: featureSummary.action,
      evidenceIds,
      confidence: insights.length > 0 ? 0.54 : 0.3,
      dataCoverage: ["Owned App", "Insight"],
      source: "fallback"
    };
  }

  if (moduleType === "traffic") {
    return {
      summary: `iOS：${platformChannelSummary(data, undefined, "ios")}；Android：${platformChannelSummary(data, undefined, "android")}。`,
      signals: channelsFor(data).map((channel) => `${channel.channelName}/${statusLabel(channel.crawlStatus)}`),
      risks: ["官网、社媒和投放来源尚未接入时，流量判断只看渠道覆盖。"],
      opportunities: ["补齐官网活动页和国内安卓渠道后，可与竞品做上新节奏对比。"],
      recommendation: "把自有 App 的渠道覆盖作为所有竞品流量判断的基准线。",
      evidenceIds,
      confidence: 0.46,
      dataCoverage: ["Channel"],
      source: "fallback"
    };
  }

  if (moduleType === "social") {
    return {
      summary: "自有 App 社媒样本尚未接入，先作为后续监控源配置项。",
      signals: ["待接入小红书、抖音、微博或手动样本"],
      risks: ["没有社媒证据时，不能把传播假设写成事实。"],
      opportunities: ["用竞品爆款模板和 B612 自有拍摄优势做内容对照。"],
      recommendation: "先建立手动采样字段：平台、话题、素材、互动量、对应功能。",
      evidenceIds: [],
      confidence: 0.25,
      dataCoverage: ["Manual"],
      source: "fallback"
    };
  }

  if (moduleType === "product_performance") {
    return {
      summary: `iOS：${platformVersionRating(data, undefined, "ios")}；Android：${platformVersionRating(data, undefined, "android")}。`,
      signals: [featureSummary.coverage, `优势：${featureSummary.advantage}`, `差距：${featureSummary.gap}`],
      risks: ["缺少平台快照时，不能比较评分、评论量和版本节奏。"],
      opportunities: [featureSummary.advantage],
      recommendation: "将 iOS 与 Android 的版本、评分、评论量和核心体验分开追踪。",
      evidenceIds,
      confidence: data.state.snapshots.some((snapshot) => !snapshot.competitorId) ? 0.5 : 0.28,
      dataCoverage: ["Snapshot", "Feature"],
      source: "fallback"
    };
  }

  return {
    summary: aiSignals.length > 0 ? `当前 AI 基准：${aiSignals.join("；")}` : "自有 App AI 信号较少，先以功能矩阵和评论洞察为准。",
    signals: aiSignals,
    risks: ["AI 能力需要实测入口、生成质量、失败率和付费限制。"],
    opportunities: [featureSummary.gap],
    recommendation: "只把有证据支撑的 AI 差距转入需求池，优势项用于版本卖点表达。",
    evidenceIds,
    confidence: aiSignals.length > 0 ? 0.58 : 0.32,
    dataCoverage: ["Feature", "Insight"],
    source: "fallback"
  };
}

function competitorModuleAnalysisFor(data: ApiStateResponse, competitor: Competitor, moduleType: ModuleAnalysisType): ModuleAnalysisView {
  const structured = latestModuleAnalysisFor(data, competitor, moduleType);
  if (structured) {
    return structuredModuleAnalysisToView(structured);
  }

  const insights = competitorInsights(data, competitor);
  const featureSummary = competitorFeatureSummary(data, competitor);
  const snapshots = data.state.snapshots.filter((snapshot) => snapshot.competitorId === competitor.id);
  const reviews = data.state.reviews.filter((review) => review.competitorId === competitor.id);
  const evidenceIds = Array.from(new Set([...snapshots.map((snapshot) => snapshot.evidenceId), ...reviews.map((review) => review.evidenceId)]));
  const reviewSignals = reviews.map((review) => review.content).slice(0, 3);
  const changeSignals = [platformChange(data, competitor, "ios"), platformChange(data, competitor, "android")].filter((item) => item !== "暂无变化");
  const signalSummary = [...changeSignals, ...reviewSignals].slice(0, 3).join(" / ");

  if (moduleType === "growth") {
    return {
      summary: signalSummary || "待补增长证据，先关注版本更新、会员入口和需求候选变化。",
      signals: [...insights.map((insight) => insight.category), ...reviews.map((review) => review.topicHint ?? "评论样本")].slice(0, 3),
      risks: ["缺少下载量、收入或投放数据时，不估算增长规模。"],
      opportunities: [featureSummary.gap],
      recommendation: featureSummary.action,
      evidenceIds,
      confidence: insights.length > 0 ? 0.52 : 0.3,
      dataCoverage: ["Insight", "Snapshot"],
      source: "fallback"
    };
  }

  if (moduleType === "traffic") {
    return {
      summary: `iOS：${platformChannelSummary(data, competitor, "ios")}；Android：${platformChannelSummary(data, competitor, "android")}。`,
      signals: channelsFor(data, competitor).map((channel) => `${channel.channelName}/${statusLabel(channel.crawlStatus)}`),
      risks: ["渠道缺失会导致流量判断偏差。"],
      opportunities: ["补齐 App Store、官网和国内安卓渠道后再判断渠道趋势。"],
      recommendation: "先将流量分析限定为渠道覆盖和渠道变更，不推断真实下载量。",
      evidenceIds,
      confidence: 0.4,
      dataCoverage: ["Channel"],
      source: "fallback"
    };
  }

  if (moduleType === "social") {
    return {
      summary: "社媒监控尚未接入自动数据，应以手动样本记录话题、素材和互动表现。",
      signals: reviewSignals,
      risks: ["没有社媒样本前，不能判断声量强弱。"],
      opportunities: ["把商店更新、评论热点与社媒话题做交叉验证。"],
      recommendation: "建立社媒手动采样字段，后续再接自动化监控。",
      evidenceIds,
      confidence: 0.34,
      dataCoverage: ["Manual"],
      source: "fallback"
    };
  }

  if (moduleType === "product_performance") {
    return {
      summary: `iOS：${platformVersionRating(data, competitor, "ios")}；Android：${platformVersionRating(data, competitor, "android")}。`,
      signals: changeSignals.length > 0 ? changeSignals : reviewSignals,
      risks: ["单平台快照不能代表整体产品表现。"],
      opportunities: [featureSummary.advantage, featureSummary.gap],
      recommendation: "按 iOS/Android 分开看版本、评分、评论量、价格和核心体验。",
      evidenceIds,
      confidence: snapshots.length > 0 ? 0.56 : 0.28,
      dataCoverage: ["Snapshot", "Review"],
      source: "fallback"
    };
  }

  const aiReviewSignals = reviews.filter((review) => /AI|智能|生成|模板|写真|发型|证件照/.test(review.content)).map((review) => review.content);
  const aiInsights = insights.filter((insight) => /AI|智能|生成|模板/.test(`${insight.category} ${insight.title} ${insight.summary}`));
  return {
    summary: aiReviewSignals.slice(0, 2).join(" / ") || changeSignals.find((signal) => /AI|智能|生成|模板/.test(signal)) || "AI 相关信号不足，先作为待补证据观察项。",
    signals: [...aiInsights.map((insight) => insight.category), ...aiReviewSignals].slice(0, 3),
    risks: ["AI 推测需要截图、更新日志或评论证据支撑。"],
    opportunities: ["拆解 AI 入口、生成前后对比、付费限制和失败反馈。"],
    recommendation: "只把有 Evidence 的 AI 信号转入需求池；缺证据项继续采样。",
    evidenceIds,
    confidence: aiInsights.length > 0 ? 0.6 : 0.28,
    dataCoverage: ["Insight", "Review"],
    source: "fallback"
  };
}

function moduleListText(items: string[], fallback = "待采集"): string {
  return items.filter(Boolean).slice(0, 3).join("；") || fallback;
}

function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/).+\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i.test(value);
}

function evidenceSnapshots(data: ApiStateResponse, evidenceId: string) {
  return data.state.snapshots.filter((snapshot) => snapshot.evidenceId === evidenceId);
}

function evidenceReviews(data: ApiStateResponse, evidenceId: string) {
  return data.state.reviews.filter((review) => review.evidenceId === evidenceId);
}

function buildEvidenceRecords(data: ApiStateResponse): EvidenceRecord[] {
  const ownAppId = data.state.currentOwnedApp?.id ?? "own";
  return data.state.evidence
    .map((evidence) => {
      const snapshots = evidenceSnapshots(data, evidence.id);
      const reviews = evidenceReviews(data, evidence.id);
      const relatedCompetitorId = snapshots[0]?.competitorId ?? reviews[0]?.competitorId;
      return {
        id: evidence.id,
        ownerId: relatedCompetitorId ?? ownAppId,
        ownerName: competitorName(data, relatedCompetitorId),
        sourceType: evidence.sourceType,
        channelName: evidence.channelName,
        sourceUrl: evidence.sourceUrl,
        rawExcerpt: evidence.rawExcerpt,
        capturedAt: evidence.capturedAt,
        screenshots: snapshots.flatMap((snapshot) => snapshot.screenshots),
        snapshotCount: snapshots.length,
        reviewCount: reviews.length
      };
    })
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
}

function evidencePlatformFromChannel(channelName: string): "ios" | "android" | "web" | "social" | "manual" {
  if (channelName === "App Store China") {
    return "ios";
  }
  if (["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].includes(channelName)) {
    return "android";
  }
  if (channelName === "Website") {
    return "web";
  }
  if (["Xiaohongshu", "Douyin", "Weibo"].includes(channelName)) {
    return "social";
  }
  return "manual";
}

function daysSinceCaptured(capturedAt: string): number {
  const capturedTime = new Date(capturedAt).getTime();
  if (Number.isNaN(capturedTime)) {
    return 365;
  }
  const diff = Date.now() - capturedTime;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

function evidenceCredibilityGrade(score: number): EvidenceCredibilityGrade {
  if (score >= 82) {
    return "strong";
  }
  if (score >= 68) {
    return "reviewable";
  }
  if (score >= 50) {
    return "weak";
  }
  return "insufficient";
}

function evidenceCredibilityGradeLabel(grade: EvidenceCredibilityGrade): string {
  const labels: Record<EvidenceCredibilityGrade, string> = {
    strong: "强证据",
    reviewable: "可评审",
    weak: "待补证据",
    insufficient: "证据不足"
  };
  return labels[grade];
}

function evidenceCredibilityTone(grade: EvidenceCredibilityGrade): "low" | "medium" | "high" {
  if (grade === "strong") {
    return "high";
  }
  if (grade === "insufficient") {
    return "low";
  }
  return "medium";
}

function evidenceSourceScore(sourceType: string): number {
  const scores: Record<string, number> = {
    snapshot: 17,
    review: 18,
    release: 16,
    price: 15,
    website: 14,
    social: 13,
    manual: 10
  };
  return scores[sourceType] ?? 9;
}

function buildEvidenceCredibilityProfile(data: ApiStateResponse, record: EvidenceRecord): EvidenceCredibilityProfile {
  const ownerRecords = buildEvidenceRecords(data).filter((item) => item.ownerId === record.ownerId);
  const ownerSourceTypes = new Set(ownerRecords.map((item) => item.sourceType));
  const ownerPlatforms = new Set(ownerRecords.map((item) => evidencePlatformFromChannel(item.channelName)));
  const days = daysSinceCaptured(record.capturedAt);
  const sourceScore = evidenceSourceScore(record.sourceType);
  const traceabilityScore = Math.min(18, (record.sourceUrl ? 8 : 0) + (record.rawExcerpt.length >= 40 ? 5 : 2) + (record.id ? 3 : 0) + (record.channelName ? 2 : 0));
  const visualScore = Math.min(16, record.screenshots.length > 0 ? 11 + Math.min(5, record.screenshots.length * 2) : record.snapshotCount > 0 ? 6 : 0);
  const userSignalScore = Math.min(16, record.reviewCount > 0 ? 10 + Math.min(6, record.reviewCount * 2) : record.sourceType === "review" ? 8 : /评论|差评|用户|反馈|评分/.test(record.rawExcerpt) ? 6 : 2);
  const crossCoverageScore = Math.min(18, ownerSourceTypes.size * 4 + ownerPlatforms.size * 4 + (ownerRecords.length >= 4 ? 3 : 0));
  const recencyScore = days <= 7 ? 15 : days <= 30 ? 12 : days <= 90 ? 8 : days <= 180 ? 5 : 2;
  const dimensions: EvidenceCredibilityDimension[] = [
    {
      key: "source",
      label: "来源强度",
      score: sourceScore,
      summary: `${record.sourceType} / ${record.channelName}`
    },
    {
      key: "traceability",
      label: "可追溯",
      score: traceabilityScore,
      summary: record.sourceUrl ? "有来源链接和原始摘录" : "缺来源链接，需补 URL 或截图"
    },
    {
      key: "visual",
      label: "截图证据",
      score: visualScore,
      summary: record.screenshots.length > 0 ? `${record.screenshots.length} 张截图` : "缺截图"
    },
    {
      key: "userSignal",
      label: "用户信号",
      score: userSignalScore,
      summary: record.reviewCount > 0 ? `${record.reviewCount} 条评论关联` : "缺评论原文"
    },
    {
      key: "crossCoverage",
      label: "交叉覆盖",
      score: crossCoverageScore,
      summary: `${ownerSourceTypes.size} 类来源 / ${ownerPlatforms.size} 类平台`
    },
    {
      key: "recency",
      label: "近期性",
      score: recencyScore,
      summary: days <= 30 ? `${days} 天内` : `${days} 天前`
    }
  ];
  const score = Math.min(100, Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0)));
  const grade = evidenceCredibilityGrade(score);
  const missingEvidence: string[] = [];
  if (!record.sourceUrl) {
    missingEvidence.push("补来源链接，避免报告引用无法回溯。");
  }
  if (record.screenshots.length === 0) {
    missingEvidence.push("补截图证据，便于研发和设计判断入口、页面和状态。");
  }
  if (record.reviewCount === 0 && /需求|体验|功能|会员|价格|质量|差评/.test(record.rawExcerpt)) {
    missingEvidence.push("补评论原文，证明用户是否真的有需求或抱怨。");
  }
  if (!ownerPlatforms.has("ios")) {
    missingEvidence.push("补 App Store 中国区证据，避免 iOS 判断缺失。");
  }
  if (!ownerPlatforms.has("android")) {
    missingEvidence.push("补国内 Android 渠道证据，避免渠道差异误判。");
  }
  if (ownerSourceTypes.size < 2) {
    missingEvidence.push("补第二类来源，避免单点样本过度解读。");
  }
  if (days > 90) {
    missingEvidence.push("证据超过 90 天，建议补近期样本。");
  }
  const verdict =
    grade === "strong"
      ? "可作为报告和需求评审的核心证据。"
      : grade === "reviewable"
        ? "可进入评审，但建议补齐缺口后再作为强结论。"
        : grade === "weak"
          ? "适合作为线索，暂不建议单独支撑排期。"
          : "只能作为待补证据，不能支撑强结论。";
  const usageAdvice =
    grade === "strong"
      ? "可用于管理层摘要、需求评审和周报主结论。"
      : grade === "reviewable"
        ? "可用于评审材料，但需要在证据缺口中标注待补项。"
        : grade === "weak"
          ? "用于观察池或补证据任务，不默认转需求。"
          : "先补来源、截图、评论或跨平台样本后再使用。";
  return {
    evidenceId: record.id,
    score,
    grade,
    gradeLabel: evidenceCredibilityGradeLabel(grade),
    verdict,
    dimensions,
    missingEvidence: uniqueValues(missingEvidence).slice(0, 5),
    usageAdvice
  };
}

function buildEvidenceCoverageAudit(data: ApiStateResponse, records = buildEvidenceRecords(data)): EvidenceCoverageAudit {
  const profiles = records.map((record) => buildEvidenceCredibilityProfile(data, record));
  const averageScore = profiles.length ? Math.round(profiles.reduce((sum, profile) => sum + profile.score, 0) / profiles.length) : 0;
  const platforms = records.map((record) => evidencePlatformFromChannel(record.channelName));
  const gaps: string[] = [];
  if (records.length === 0) {
    gaps.push("暂无证据，先执行采集任务或手动添加样本。");
  }
  if (!platforms.includes("ios")) {
    gaps.push("缺 App Store 中国区证据。");
  }
  if (!platforms.includes("android")) {
    gaps.push("缺国内 Android 渠道证据。");
  }
  if (records.every((record) => record.reviewCount === 0 && record.sourceType !== "review")) {
    gaps.push("缺评论原文，需求判断说服力不足。");
  }
  if (records.every((record) => record.screenshots.length === 0)) {
    gaps.push("缺截图证据，无法支撑 UI / 入口 / 商店页判断。");
  }
  if (!records.some((record) => record.sourceType === "social")) {
    gaps.push("缺社媒样本，AI / 模板 / 活动传播判断不足。");
  }
  if (averageScore > 0 && averageScore < 65) {
    gaps.push("平均证据分低于可评审线，报告应优先补证据。");
  }
  return {
    total: records.length,
    averageScore,
    strongCount: profiles.filter((profile) => profile.grade === "strong").length,
    reviewableCount: profiles.filter((profile) => profile.grade === "reviewable").length,
    weakCount: profiles.filter((profile) => profile.grade === "weak").length,
    insufficientCount: profiles.filter((profile) => profile.grade === "insufficient").length,
    iosCount: platforms.filter((platform) => platform === "ios").length,
    androidCount: platforms.filter((platform) => platform === "android").length,
    reviewCount: records.filter((record) => record.reviewCount > 0 || record.sourceType === "review").length,
    socialCount: records.filter((record) => record.sourceType === "social" || evidencePlatformFromChannel(record.channelName) === "social").length,
    websiteCount: records.filter((record) => record.sourceType === "website" || record.channelName === "Website").length,
    screenshotCount: records.filter((record) => record.screenshots.length > 0).length,
    sourceTypeCount: uniqueValues(records.map((record) => record.sourceType)).length,
    channelCount: uniqueValues(records.map((record) => record.channelName)).length,
    gaps: uniqueValues(gaps).slice(0, 6)
  };
}

function knowledgeQuestionTemplates(data: ApiStateResponse): string[] {
  const competitorNames = data.state.competitors.map((competitor) => competitor.name).slice(0, 2);
  return [
    "最近哪些竞品在强化 AI 或模板？",
    "当前 App 最应该补哪几个功能？",
    "哪些结论缺 iOS 或 Android 证据？",
    "会员价格和付费反馈有什么风险？",
    competitorNames[0] ? `${competitorNames[0]} 最近有什么值得跟进的变化？` : "哪个竞品最近变化最大？",
    "哪些机会可以进入本周需求评审？"
  ];
}

function knowledgeTerms(question: string): string[] {
  const normalized = question.toLowerCase();
  const dictionary = [
    "ai",
    "AI",
    "智能",
    "生成",
    "写真",
    "模板",
    "美颜",
    "滤镜",
    "贴纸",
    "拍照",
    "相机",
    "修图",
    "会员",
    "价格",
    "订阅",
    "付费",
    "导出",
    "高清",
    "截图",
    "版本",
    "更新",
    "发布",
    "活动",
    "官网",
    "评论",
    "差评",
    "评分",
    "社媒",
    "小红书",
    "抖音",
    "微博",
    "功能",
    "差距",
    "优势",
    "证据",
    "Android",
    "安卓",
    "iOS",
    "App Store",
    "需求",
    "评审",
    "风险"
  ];
  const splitTerms = normalized
    .split(/[\s,，。；;:：/|、()（）]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
  const matchedDictionary = dictionary.filter((term) => normalized.includes(term.toLowerCase()));
  return uniqueValues([...splitTerms, ...matchedDictionary]).slice(0, 18);
}

function knowledgeScoreRecord(record: EvidenceRecord, question: string, terms: string[], selectedOwnerId: string): KnowledgeEvidenceHit {
  const haystack = [record.id, record.ownerName, record.sourceType, record.channelName, record.rawExcerpt].join(" ").toLowerCase();
  const questionLower = question.toLowerCase();
  const matchedTerms = terms.filter((term) => haystack.includes(term.toLowerCase()));
  let score = matchedTerms.length * 12;
  if (selectedOwnerId !== "all" && record.ownerId === selectedOwnerId) {
    score += 18;
  }
  if (questionLower.includes(record.ownerName.toLowerCase())) {
    score += 20;
  }
  if (/评论|用户|差评|反馈/.test(question) && record.reviewCount > 0) {
    score += 14;
  }
  if (/截图|入口|页面|商店/.test(question) && record.screenshots.length > 0) {
    score += 12;
  }
  if (/社媒|小红书|抖音|微博|活动|传播/.test(question) && record.sourceType === "social") {
    score += 14;
  }
  if (/版本|更新|发布/.test(question) && (record.sourceType === "release" || record.sourceType === "snapshot")) {
    score += 10;
  }
  if (/官网|战略|定位/.test(question) && (record.sourceType === "website" || record.channelName === "Website")) {
    score += 10;
  }
  return { record, score, matchedTerms };
}

function knowledgeMissingEvidence(question: string, hits: KnowledgeEvidenceHit[]): string[] {
  const evidenceTypes = new Set(hits.map((hit) => hit.record.sourceType));
  const channels = new Set(hits.map((hit) => hit.record.channelName));
  const missing: string[] = [];
  if (!channels.has("App Store China")) {
    missing.push("缺 App Store 中国区截图、评论或版本证据。");
  }
  if (!["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"].some((channel) => channels.has(channel))) {
    missing.push("缺国内 Android 渠道证据，无法判断渠道差异。");
  }
  if (/社媒|小红书|抖音|微博|活动|传播|模板/.test(question) && !evidenceTypes.has("social")) {
    missing.push("缺社媒样本，玩法或活动类判断需要小红书 / 抖音 / 微博链接。");
  }
  if (/评论|用户|差评|反馈|需求/.test(question) && !evidenceTypes.has("review")) {
    missing.push("缺用户评论原文，无法证明真实用户需求。");
  }
  if (/截图|入口|页面|流程/.test(question) && hits.every((hit) => hit.record.screenshots.length === 0)) {
    missing.push("缺截图证据，无法判断入口、流程和页面表达。");
  }
  if (hits.length < 3) {
    missing.push("命中证据少于 3 条，建议继续补充来源后再进入强结论。");
  }
  return uniqueValues(missing).slice(0, 5);
}

function knowledgeFindings(question: string, hits: KnowledgeEvidenceHit[], decisions: ProductDecisionBrief[]): string[] {
  const topOwners = uniqueValues(hits.map((hit) => hit.record.ownerName)).slice(0, 3);
  const topTypes = uniqueValues(hits.map((hit) => hit.record.sourceType)).slice(0, 3);
  const relatedDecisions = decisions
    .filter((brief) => hits.some((hit) => brief.packageItem.evidenceIds.includes(hit.record.id)))
    .slice(0, 2);
  const findings = [
    hits.length > 0
      ? `当前命中 ${hits.length} 条证据，主要来自 ${topOwners.join("、") || "当前 App / 竞品"}，证据类型为 ${topTypes.join("、") || "未分类"}。`
      : "当前没有命中足够证据，不能形成明确结论。",
    relatedDecisions.length > 0
      ? `这些证据已关联到 ${relatedDecisions.map((brief) => brief.packageItem.title).join("、")}，可继续进入决策工作台判断。`
      : "暂未发现已入决策包的强关联需求，可先作为证据线索继续补样本。"
  ];
  if (/AI|智能|生成|写真|模板/i.test(question)) {
    findings.push("AI / 模板相关判断应同时看入口、生成质量、失败兜底、付费边界和社媒传播，不应只看功能标题。");
  }
  if (/会员|价格|订阅|付费/.test(question)) {
    findings.push("会员和价格判断必须结合具体数字、权益解释和付费负评，不能只看竞品价格文案。");
  }
  if (/功能|差距|优势|需求/.test(question)) {
    findings.push("功能判断应优先进入 Feature Matrix 和 Product Decision Board，确认当前 App 是缺失、部分具备还是优势强化。");
  }
  return findings.slice(0, 5);
}

function knowledgeRisks(question: string, hits: KnowledgeEvidenceHit[], missing: string[]): string[] {
  const risks = [];
  if (missing.length > 0) {
    risks.push("证据缺口仍然存在，当前回答不能作为最终排期依据。");
  }
  if (hits.length > 0 && hits.every((hit) => hit.record.ownerName === hits[0].record.ownerName)) {
    risks.push("命中证据集中在单一对象，可能无法代表整个竞品格局。");
  }
  if (/战略|定位|转向|方向/.test(question)) {
    risks.push("战略变化属于推断，必须展示多信号和置信度，不能当作确定事实。");
  }
  if (/AI|生成|模板|写真/i.test(question)) {
    risks.push("AI 类机会存在生成质量、内容审核、成本和失败体验风险。");
  }
  if (/会员|价格|订阅|付费/.test(question)) {
    risks.push("商业化动作可能提升收入，也可能带来付费诱导感和差评风险。");
  }
  return uniqueValues(risks).slice(0, 5);
}

function knowledgeNextActions(question: string, hits: KnowledgeEvidenceHit[], decisions: ProductDecisionBrief[], missing: string[]): string[] {
  const relatedDecision = decisions.find((brief) => hits.some((hit) => brief.packageItem.evidenceIds.includes(hit.record.id)));
  const actions = [];
  if (relatedDecision) {
    actions.push(`进入决策工作台查看「${relatedDecision.packageItem.title}」，当前建议为：${relatedDecision.outcomeLabel}。`);
  }
  if (missing.length > 0) {
    actions.push(`先补证据：${missing[0]}`);
  }
  if (/需求|评审|功能|差距|优势/.test(question)) {
    actions.push("把命中证据关联到功能详情页，确认 MVP 范围、验收口径和研发风险。");
  }
  if (/周报|汇报|老板/.test(question)) {
    actions.push("将回答片段写入周报，并保留 Evidence ID 作为附录。");
  }
  if (actions.length === 0) {
    actions.push("继续补充跨渠道证据，再重新提问或进入证据中心筛选。");
  }
  return actions.slice(0, 4);
}

function buildKnowledgeAnswer(data: ApiStateResponse, question: string, selectedOwnerId = "all", selectedSourceType = "all"): KnowledgeAnswer {
  const records = buildEvidenceRecords(data).filter(
    (record) => (selectedOwnerId === "all" || record.ownerId === selectedOwnerId) && (selectedSourceType === "all" || record.sourceType === selectedSourceType)
  );
  const terms = knowledgeTerms(question);
  const rawHits = records
    .map((record) => knowledgeScoreRecord(record, question, terms, selectedOwnerId))
    .filter((hit) => hit.score > 0 || terms.length === 0)
    .sort((left, right) => right.score - left.score || right.record.capturedAt.localeCompare(left.record.capturedAt))
    .slice(0, 8);
  const hits = rawHits.length > 0 ? rawHits : records.slice(0, 5).map((record) => ({ record, score: 1, matchedTerms: [] }));
  const decisions = buildProductDecisionBriefs(data);
  const missingEvidence = knowledgeMissingEvidence(question, hits);
  const findings = knowledgeFindings(question, hits, decisions);
  const risks = knowledgeRisks(question, hits, missingEvidence);
  const nextActions = knowledgeNextActions(question, hits, decisions, missingEvidence);
  const confidence = Math.min(95, Math.max(20, Math.round(hits.length * 9 + Math.min(35, hits.reduce((sum, hit) => sum + hit.matchedTerms.length, 0) * 4) - missingEvidence.length * 8)));
  const answer =
    hits.length === 0 || (hits.length <= 1 && missingEvidence.length > 0)
      ? "当前证据不足，不能形成强结论。建议先补跨渠道截图、评论原文或社媒链接。"
      : `基于当前证据，${findings[0]} ${confidence >= 70 ? "可以作为评审前参考。" : "仍需补证后再进入强结论。"}`;
  const reportSnippet = [
    `### 知识库问答：${question}`,
    "",
    `- 结论：${answer}`,
    `- 置信度：${confidence}%`,
    ...findings.map((finding) => `- 发现：${finding}`),
    ...risks.map((risk) => `- 风险：${risk}`),
    ...nextActions.map((action) => `- 下一步：${action}`),
    `- Evidence：${hits.map((hit) => hit.record.id).join(", ") || "待补"}`
  ].join("\n");
  return { question, confidence, answer, findings, risks, nextActions, evidenceHits: hits, missingEvidence, reportSnippet };
}

const strategicThemeMeta: Record<
  StrategicTheme,
  {
    label: string;
    terms: string[];
    implication: string;
    recommendation: string;
  }
> = {
  ai_acceleration: {
    label: "AI 化加速",
    terms: ["AI", "智能", "生成", "写真", "模板", "头像", "发型", "证件照", "修图", "滤镜", "自动"],
    implication: "说明竞品可能正在把影像工具从编辑能力包装成 AI 结果生产能力，当前 App 需要判断入口、生成质量、成本和会员边界。",
    recommendation: "拆解竞品 AI 入口、生成前后对比、失败态和付费限制，优先把高需求且低成本的能力进入功能详情页。"
  },
  monetization: {
    label: "商业化强化",
    terms: ["会员", "价格", "订阅", "付费", "权益", "SVIP", "试用", "折扣", "连续包月", "AI 点数", "高清", "导出"],
    implication: "说明竞品可能在提高付费解释、权益包装或价格测试强度，当前 App 需要同时评估收入机会和口碑风险。",
    recommendation: "把价格数字、权益差异和付费负评放在一起看，先做权益表达和触发点优化，不直接跟随降价或强付费墙。"
  },
  content_growth: {
    label: "内容增长 / 传播",
    terms: ["活动", "话题", "挑战", "小红书", "抖音", "微博", "分享", "KOL", "素材", "爆款", "运营", "模板", "节日"],
    implication: "说明竞品可能在用模板、活动或社媒内容扩大传播，当前 App 需要判断这是短期活动还是可复用的内容供给能力。",
    recommendation: "把商店页卖点、社媒样本和评论反馈交叉验证，优先补可复用模板供给、分享路径和内容运营证据。"
  },
  quality_experience: {
    label: "体验质量风险",
    terms: ["差评", "评分", "卡顿", "崩溃", "失败", "慢", "闪退", "广告", "误触", "退款", "发热", "质量"],
    implication: "说明竞品或当前 App 的增长动作可能带来体验代价，产品和研发需要提前确认灰度、异常兜底和口碑监控。",
    recommendation: "把评分趋势、差评主题和版本更新绑定分析，优先修复会直接影响保存、生成、拍摄和支付链路的问题。"
  },
  store_positioning: {
    label: "商店页定位变化",
    terms: ["截图", "描述", "标题", "关键词", "商店页", "定位", "品牌", "文案", "卖点", "App Store", "元数据"],
    implication: "说明竞品可能调整对外主卖点或 ASO 表达，当前 App 需要判断是否影响搜索转化、首屏理解和品牌差异化。",
    recommendation: "把商店页文案、截图顺序和关键词变化加入时间线，结合功能矩阵决定是跟进表达还是强化自有差异化。"
  },
  platform_channel: {
    label: "平台 / 渠道策略",
    terms: ["Android", "安卓", "iOS", "App Store", "华为", "小米", "OPPO", "vivo", "应用宝", "渠道", "灰度", "版本"],
    implication: "说明竞品可能在不同平台采取不同版本、价格或上新节奏，当前 App 不能把 iOS 与 Android 混成一个结论。",
    recommendation: "按 iOS / Android / 国内厂商渠道分开展示版本、价格、评分和截图，先补缺失渠道后再判断策略差异。"
  }
};

function strategyThemeLabel(theme: StrategicTheme): string {
  return strategicThemeMeta[theme].label;
}

function strategyStageLabel(stage: StrategicInference["stage"]): string {
  const labels: Record<StrategicInference["stage"], string> = {
    observation: "观察项",
    pattern: "多信号模式",
    strategic_inference: "战略推测"
  };
  return labels[stage];
}

function strategicTextMatches(theme: StrategicTheme, text: string): boolean {
  const normalized = text.toLowerCase();
  return strategicThemeMeta[theme].terms.some((term) => normalized.includes(term.toLowerCase()));
}

function strategicOwnerOptions(data: ApiStateResponse): Array<{ id: string; name: string; type: "owned" | "competitor" }> {
  const ownApp = data.state.currentOwnedApp;
  return [
    ...(ownApp ? [{ id: ownApp.id, name: ownApp.name, type: "owned" as const }] : []),
    ...data.state.competitors.map((competitor) => ({ id: competitor.id, name: competitor.name, type: "competitor" as const }))
  ];
}

function strategicSignal(
  sourceType: string,
  label: string,
  summary: string,
  evidenceIds: string[],
  capturedAt: string,
  idSeed: string
): StrategicSignal {
  return {
    id: `${sourceType}:${idSeed}`,
    sourceType,
    label,
    summary,
    evidenceIds: uniqueValues(evidenceIds),
    capturedAt
  };
}

function featureEvidenceIdsForOwner(detail: FeatureGapDetail | undefined, ownerId: string, ownAppId?: string): string[] {
  if (!detail) {
    return [];
  }
  if (ownerId === ownAppId) {
    return [...detail.ownEvidenceIds, ...detail.socialEvidenceIds];
  }
  const competitorDetail = detail.competitorDetails.find((item) => item.competitorId === ownerId);
  return competitorDetail ? [...competitorDetail.evidenceIds, ...competitorDetail.socialEvidenceIds] : [];
}

function supportForStrategicOwner(feature: Feature, ownerId: string, ownAppId?: string): Feature["currentAppSupport"] {
  return ownerId === ownAppId ? feature.currentAppSupport : feature.competitorSupport[ownerId] ?? "unknown";
}

function strategicSignalsForTheme(data: ApiStateResponse, ownerId: string, theme: StrategicTheme): StrategicSignal[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const signals: StrategicSignal[] = [];
  const launchSignals = ownedAppId ? buildLaunchSignals(data.state, ownedAppId) : [];
  const priceSignals = ownedAppId ? buildPriceSignals(data.state, ownedAppId) : [];
  const metadataSignals = ownedAppId ? buildStoreMetadataSignals(data.state, ownedAppId) : [];
  const ratingSignals = ownedAppId ? buildRatingSentimentSignals(data.state, ownedAppId) : [];
  const detailMap = new Map(buildFeatureGapDetails(data.state, ownedAppId).map((detail) => [detail.featureId, detail]));

  launchSignals
    .filter((signal) => signal.ownerId === ownerId && strategicTextMatches(theme, `${signal.title} ${signal.summary} ${signal.sourceChannels.join(" ")}`))
    .forEach((signal) => {
      signals.push(strategicSignal("发布", signal.title, signal.summary, signal.evidenceIds, signal.occurredAt, signal.id));
    });

  priceSignals
    .filter((signal) => signal.ownerId === ownerId && (theme === "monetization" || strategicTextMatches(theme, signal.priceText)))
    .forEach((signal) => {
      const changeText = signal.changeType === "changed" ? `价格变化：${signal.previousPriceText ?? "未知"} -> ${signal.priceText}` : signal.priceText;
      signals.push(strategicSignal("价格", signal.channelName, changeText, signal.evidenceIds, signal.capturedAt, signal.id));
    });

  metadataSignals
    .filter((signal) => signal.ownerId === ownerId && strategicTextMatches(theme, `${signal.field} ${signal.afterValue} ${signal.keywordHints.join(" ")}`))
    .forEach((signal) => {
      signals.push(
        strategicSignal(
          "商店页",
          `${signal.channelName}/${signal.field}`,
          signal.beforeValue ? `${signal.beforeValue} -> ${signal.afterValue}` : signal.afterValue,
          signal.evidenceIds,
          signal.capturedAt,
          signal.id
        )
      );
    });

  ratingSignals
    .filter((signal) => signal.ownerId === ownerId && (theme === "quality_experience" || strategicTextMatches(theme, `${signal.summary} ${signal.topThemes.join(" ")}`)))
    .forEach((signal) => {
      signals.push(
        strategicSignal(
          "评分口碑",
          `${signal.channelName}/${impactLabel(signal.riskLevel)}`,
          `${signal.summary}；样本 ${signal.sampleSize}，负向 ${signal.negativeReviewCount}`,
          signal.evidenceIds,
          signal.capturedAt,
          signal.id
        )
      );
    });

  data.state.socialSamples
    .filter((sample) => (sample.competitorId ?? ownedAppId) === ownerId && strategicTextMatches(theme, `${sample.topic} ${sample.summary} ${sample.tags.join(" ")} ${sample.fetchedExcerpt ?? ""}`))
    .forEach((sample) => {
      signals.push(
        strategicSignal(
          "社媒",
          `${sample.platform}/${sample.topic}`,
          sample.fetchedExcerpt ?? sample.summary,
          sample.evidenceId ? [sample.evidenceId] : [],
          sample.publishedAt ?? sample.updatedAt,
          sample.id
        )
      );
    });

  buildEvidenceRecords(data)
    .filter((record) => record.ownerId === ownerId && strategicTextMatches(theme, `${record.channelName} ${record.sourceType} ${record.rawExcerpt}`))
    .slice(0, 5)
    .forEach((record) => {
      signals.push(strategicSignal("Evidence", `${record.channelName}/${record.sourceType}`, record.rawExcerpt, [record.id], record.capturedAt, record.id));
    });

  normalizeFeatures(data.state.features)
    .filter((feature) => strategicTextMatches(theme, `${feature.name} ${feature.category}`))
    .forEach((feature) => {
      const support = supportForStrategicOwner(feature, ownerId, ownedAppId);
      if (support === "unknown" || (support === "missing" && ownerId !== ownedAppId)) {
        return;
      }
      const detail = detailMap.get(feature.id);
      const evidenceIds = featureEvidenceIdsForOwner(detail, ownerId, ownedAppId);
      signals.push(
        strategicSignal(
          "功能模型",
          feature.name,
          `${supportLabel(support)}，需求分 ${feature.demandScore}，${featureAction(feature)}`,
          evidenceIds,
          feature.updatedAt,
          `${ownerId}:${feature.id}`
        )
      );
    });

  const uniqueBySummary = new Map<string, StrategicSignal>();
  signals
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))
    .forEach((signal) => {
      const key = `${signal.sourceType}:${signal.label}:${signal.summary}`;
      if (!uniqueBySummary.has(key)) {
        uniqueBySummary.set(key, signal);
      }
    });
  return Array.from(uniqueBySummary.values()).slice(0, 10);
}

function strategicMissingEvidence(data: ApiStateResponse, theme: StrategicTheme, ownerId: string, signals: StrategicSignal[]): string[] {
  const sourceTypes = new Set(signals.map((signal) => signal.sourceType));
  const evidenceIds = uniqueValues(signals.flatMap((signal) => signal.evidenceIds));
  const evidenceItems = evidenceIds.map((id) => data.state.evidence.find((evidence) => evidence.id === id)).filter(Boolean);
  const channels = new Set(evidenceItems.map((evidence) => evidence?.channelName));
  const hasScreenshot = data.state.snapshots.some((snapshot) => evidenceIds.includes(snapshot.evidenceId) && snapshot.screenshots.length > 0);
  const missing: string[] = [];

  if (sourceTypes.size < 2) {
    missing.push("至少需要两类独立信号，才能从观察项升级为战略推测。");
  }
  if (!channels.has("App Store China")) {
    missing.push("缺 iOS / App Store 中国区证据，不能判断 iOS 策略。");
  }
  const androidChannels: ChannelName[] = ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"];
  if (!androidChannels.some((channel) => channels.has(channel))) {
    missing.push("缺国内 Android 厂商渠道证据，不能判断安卓渠道策略。");
  }
  if ((theme === "ai_acceleration" || theme === "content_growth") && !sourceTypes.has("社媒")) {
    missing.push("缺小红书 / 抖音 / 微博社媒样本，传播和玩法判断不够硬。");
  }
  if ((theme === "monetization" || theme === "quality_experience") && !sourceTypes.has("评分口碑") && !evidenceItems.some((evidence) => evidence?.sourceType === "review")) {
    missing.push("缺用户评论原文，无法证明用户是否买账或反感。");
  }
  if (theme === "store_positioning" && !hasScreenshot) {
    missing.push("缺商店截图或页面截图，无法判断主卖点和入口表达变化。");
  }
  if (theme === "monetization") {
    const ownerPriceSignals = data.state.currentOwnedApp?.id ? buildPriceSignals(data.state, data.state.currentOwnedApp.id).filter((signal) => signal.ownerId === ownerId) : [];
    if (ownerPriceSignals.every((signal) => signal.numericPrices.length === 0)) {
      missing.push("缺具体价格数字，会员策略不能只看文案。");
    }
  }
  return uniqueValues(missing).slice(0, 5);
}

function strategicCounterSignals(data: ApiStateResponse, theme: StrategicTheme, ownerId: string, signals: StrategicSignal[], missing: string[]): string[] {
  const ownedAppId = data.state.currentOwnedApp?.id;
  const counters: string[] = [];
  if (missing.length > 0) {
    counters.push("当前仍有证据缺口，结论应作为评审前假设而非事实。");
  }
  if (new Set(signals.map((signal) => signal.sourceType)).size === 1) {
    counters.push("信号集中在单一来源，可能只是一次文案或版本变化。");
  }
  if (theme === "quality_experience" && signals.some((signal) => signal.sourceType === "评分口碑" && /风险：低|低/.test(signal.label))) {
    counters.push("口碑风险未显著恶化，质量问题可能只影响局部渠道或小样本。");
  }
  if (theme === "ai_acceleration" && ownedAppId && ownerId !== ownedAppId) {
    const ownAiAdvantage = normalizeFeatures(data.state.features).find(
      (feature) => strategicTextMatches("ai_acceleration", `${feature.name} ${feature.category}`) && feature.currentAppSupport === "advantage"
    );
    if (ownAiAdvantage) {
      counters.push(`当前 App 已有「${ownAiAdvantage.name}」优势，跟进竞品时应强化差异化而不是照搬。`);
    }
  }
  if (theme === "monetization" && signals.every((signal) => !/[¥￥]\s?\d|\d+\s*元/.test(signal.summary))) {
    counters.push("没有明确价格数字，无法判断是真正调价还是权益包装变化。");
  }
  return uniqueValues(counters).slice(0, 4);
}

function strategicNextActions(data: ApiStateResponse, inference: Omit<StrategicInference, "nextActions" | "reportSnippet">): string[] {
  const relatedRecommendations = actionRecommendationsFor(data).filter((recommendation) =>
    recommendation.evidenceIds.some((id) => inference.evidenceIds.includes(id))
  );
  const actions = [
    inference.stage === "strategic_inference"
      ? "发起专题分析：把版本、商店页、价格、评论和社媒样本按时间线复盘。"
      : "先补证据：把缺失平台、评论原文和截图补齐后重新评分。",
    inference.theme === "platform_channel" ? "按 iOS / Android / 国内厂商渠道拆表，不要跨平台填补空值。" : "在功能详情页确认当前 App 状态、竞品成熟度和 MVP 范围。",
    relatedRecommendations[0] ? `关联行动建议「${relatedRecommendations[0].title}」，进入需求评审或观察池。` : "将证据写入周报附录，避免战略判断没有来源。"
  ];
  if (inference.theme === "monetization") {
    actions.push("补齐月卡、年卡、连续包月、试用和 AI 点数价格，关联付费负评。");
  }
  if (inference.theme === "ai_acceleration") {
    actions.push("补竞品 AI 入口截图、生成结果样本、失败态和会员限制。");
  }
  return uniqueValues(actions).slice(0, 5);
}

function strategicHypothesis(ownerName: string, theme: StrategicTheme, stage: StrategicInference["stage"]): string {
  const prefix = stage === "strategic_inference" ? "疑似正在" : stage === "pattern" ? "出现持续信号，可能在" : "出现单点信号，需验证是否在";
  const actions: Record<StrategicTheme, string> = {
    ai_acceleration: "强化 AI 结果生产和模板玩法",
    monetization: "强化会员权益、价格包装或付费触发",
    content_growth: "通过内容话题、模板活动和社媒传播拉动增长",
    quality_experience: "暴露体验质量或版本稳定性风险",
    store_positioning: "调整商店页定位、卖点表达和 ASO 方向",
    platform_channel: "按平台或安卓厂商渠道做差异化上新"
  };
  return `${ownerName} ${prefix}${actions[theme]}。`;
}

function buildStrategicInferenceReportSnippet(inference: Omit<StrategicInference, "reportSnippet">): string {
  return [
    `### 战略雷达：${inference.ownerName} / ${inference.themeLabel}`,
    "",
    `- 推测级别：${strategyStageLabel(inference.stage)}`,
    `- 结论：${inference.hypothesis}`,
    `- 置信度：${inference.confidence}% / 影响：${impactLabel(inference.impact)}`,
    `- 对当前 App 的影响：${inference.productImplication}`,
    `- 建议：${inference.recommendation}`,
    ...inference.nextActions.map((action) => `- 下一步：${action}`),
    `- 证据：${inference.evidenceIds.join(", ") || "待补"}`
  ].join("\n");
}

function buildStrategicInferences(data: ApiStateResponse): StrategicInference[] {
  const owners = strategicOwnerOptions(data);
  const themes = Object.keys(strategicThemeMeta) as StrategicTheme[];
  return owners
    .flatMap((owner) =>
      themes.map((theme) => {
        const signals = strategicSignalsForTheme(data, owner.id, theme);
        const sourceTypes = uniqueValues(signals.map((signal) => signal.sourceType));
        const evidenceIds = uniqueValues(signals.flatMap((signal) => signal.evidenceIds));
        const missingEvidence = strategicMissingEvidence(data, theme, owner.id, signals);
        const rawConfidence = Math.round(
          24 +
            Math.min(30, sourceTypes.length * 11) +
            Math.min(28, evidenceIds.length * 5) +
            Math.min(10, signals.filter((signal) => signal.sourceType === "发布" || signal.sourceType === "商店页").length * 4) -
            missingEvidence.length * 5
        );
        const confidence = Math.max(18, Math.min(sourceTypes.length < 2 ? 58 : 94, rawConfidence));
        const stage: StrategicInference["stage"] =
          sourceTypes.length >= 3 && confidence >= 70 ? "strategic_inference" : sourceTypes.length >= 2 ? "pattern" : "observation";
        const impact: StrategicInference["impact"] =
          confidence >= 76 || signals.some((signal) => /高|changed|价格变化|负向/.test(signal.summary))
            ? "high"
            : confidence >= 55
              ? "medium"
              : "low";
        const themeMeta = strategicThemeMeta[theme];
        const base = {
          id: `strategy:${owner.id}:${theme}`,
          ownerId: owner.id,
          ownerName: owner.name,
          theme,
          themeLabel: themeMeta.label,
          hypothesis: strategicHypothesis(owner.name, theme, stage),
          confidence,
          impact,
          stage,
          sourceTypes,
          evidenceIds,
          signals,
          counterSignals: strategicCounterSignals(data, theme, owner.id, signals, missingEvidence),
          missingEvidence,
          productImplication: themeMeta.implication,
          recommendation: confidence >= 70 ? themeMeta.recommendation : `先补证据后再判断。${themeMeta.recommendation}`,
          nextActions: []
        };
        const nextActions = strategicNextActions(data, base);
        return {
          ...base,
          nextActions,
          reportSnippet: buildStrategicInferenceReportSnippet({ ...base, nextActions })
        };
      })
    )
    .filter((inference) => inference.signals.length > 0)
    .sort((left, right) => right.confidence - left.confidence || right.evidenceIds.length - left.evidenceIds.length || left.ownerName.localeCompare(right.ownerName));
}

function evidenceStrengthText(count: number): string {
  if (count >= 6) {
    return "强";
  }
  if (count >= 3) {
    return "中";
  }
  if (count > 0) {
    return "弱";
  }
  return "待补";
}

function evidenceQualityForIds(data: ApiStateResponse, evidenceIds: string[]): { averageScore: number; label: string } {
  const recordById = new Map(buildEvidenceRecords(data).map((record) => [record.id, record]));
  const profiles = uniqueValues(evidenceIds)
    .map((id) => recordById.get(id))
    .filter(Boolean)
    .map((record) => buildEvidenceCredibilityProfile(data, record as EvidenceRecord));
  if (profiles.length === 0) {
    return { averageScore: 0, label: "待补" };
  }
  const averageScore = Math.round(profiles.reduce((sum, profile) => sum + profile.score, 0) / profiles.length);
  const label = evidenceCredibilityGradeLabel(evidenceCredibilityGrade(averageScore));
  return { averageScore, label: `${label} ${averageScore}` };
}

function executiveEvidenceGaps(data: ApiStateResponse, evidenceIds: string[], strategies: StrategicInference[]): string[] {
  const evidenceItems = evidenceIds.map((id) => data.state.evidence.find((evidence) => evidence.id === id)).filter(Boolean);
  const channels = new Set(evidenceItems.map((evidence) => evidence?.channelName));
  const sourceTypes = new Set(evidenceItems.map((evidence) => evidence?.sourceType));
  const hasScreenshot = data.state.snapshots.some((snapshot) => evidenceIds.includes(snapshot.evidenceId) && snapshot.screenshots.length > 0);
  const gaps: string[] = [];
  if (evidenceIds.length < 8) {
    gaps.push("报告核心结论证据少于 8 条，建议补更多截图、评论和渠道样本。");
  }
  if (!channels.has("App Store China")) {
    gaps.push("缺 App Store 中国区证据，管理层报告中 iOS 判断说服力不足。");
  }
  const androidChannels: ChannelName[] = ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"];
  if (!androidChannels.some((channel) => channels.has(channel))) {
    gaps.push("缺国内 Android 渠道证据，无法支撑中国区安卓策略判断。");
  }
  if (!sourceTypes.has("review")) {
    gaps.push("缺评论原文，需求和口碑判断容易被认为只是竞品观察。");
  }
  if (!sourceTypes.has("social") && strategies.some((strategy) => strategy.theme === "ai_acceleration" || strategy.theme === "content_growth")) {
    gaps.push("AI / 内容增长推测缺社媒样本，传播判断需要小红书、抖音或微博链接。");
  }
  if (!hasScreenshot) {
    gaps.push("缺截图证据，设计、研发和管理层难以判断入口与页面差异。");
  }
  strategies.flatMap((strategy) => strategy.missingEvidence).forEach((gap) => gaps.push(gap));
  return uniqueValues(gaps).slice(0, 6);
}

function executiveEvidenceScore(data: ApiStateResponse, evidenceIds: string[], gaps: string[]): number {
  const quality = evidenceQualityForIds(data, evidenceIds);
  const volumeBoost = Math.min(12, uniqueValues(evidenceIds).length * 2);
  return Math.max(10, Math.min(100, Math.round(quality.averageScore + volumeBoost - gaps.length * 5)));
}

function buildExecutiveReportMarkdown(brief: Omit<ExecutiveReportBrief, "markdown">, data: ApiStateResponse): string {
  const appName = data.state.currentOwnedApp?.name ?? "当前 App";
  const competitorNames = data.state.competitors.map((competitor) => competitor.name).join("、") || "待配置";
  return [
    `# ${brief.title}`,
    "",
    `项目：${appName}`,
    `监控竞品：${competitorNames}`,
    `生成时间：${new Date().toISOString().slice(0, 10)}`,
    "",
    "## 1. 管理层摘要",
    ...brief.summary.map((item) => `- ${item}`),
    "",
    "## 2. 本周决策建议",
    "| 优先级 | 建议主题 | PM 判断 | 决策分 | 证据强度 | 为什么现在 |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...(brief.decisionRows.length === 0
      ? ["| 待补 | 暂无可评审决策 | 先补证据 | 0 | 待补 | 先执行分析和采集 |"]
      : brief.decisionRows.map((row) => `| ${row.priority} | ${row.title} | ${row.outcome} | ${row.score} | ${row.evidenceStrength} | ${row.whyNow} |`)),
    "",
    "## 3. 战略变化推测",
    "| 对象 | 主题 | 推测级别 | 置信度 | 对当前 App 的影响 | 建议 | 证据 |",
    "| --- | --- | --- | ---: | --- | --- | --- |",
    ...(brief.strategyRows.length === 0
      ? ["| 待补 | 待补 | 观察项 | 0 | 暂无足够多信号 | 先补官网、截图、评论和社媒证据 | 待补 |"]
      : brief.strategyRows.map(
          (row) =>
            `| ${row.ownerName} | ${row.themeLabel} | ${strategyStageLabel(row.stage)} | ${row.confidence}% | ${row.productImplication} | ${row.recommendation} | ${row.evidenceIds.join(", ") || "待补"} |`
        )),
    "",
    "## 4. MVP 验证计划",
    "| 建议主题 | 核心假设 | 最小验证方案 | 研发提示 | 通过标准 |",
    "| --- | --- | --- | --- | --- |",
    ...(brief.validationRows.length === 0
      ? ["| 待补 | 暂无可验证假设 | 先补需求和证据 | 待补 | 待补 |"]
      : brief.validationRows.map((row) => `| ${row.title} | ${row.hypothesis} | ${row.validation} | ${row.engineeringHint} | ${row.successMetric} |`)),
    "",
    "## 5. 不直接复制竞品的边界",
    "| 能力 | 为什么不直接照搬 | 当前 App 应保留的差异化 | 验证方式 |",
    "| --- | --- | --- | --- |",
    ...(brief.noCopyRows.length === 0
      ? ["| 待补 | 暂无功能差距样本 | 先补功能矩阵 | 待补 |"]
      : brief.noCopyRows.map((row) => `| ${row.feature} | ${row.reason} | ${row.differentiation} | ${row.validation} |`)),
    "",
    "## 6. 证据覆盖检查",
    `- 证据覆盖分：${brief.evidenceScore}`,
    `- Evidence：${brief.evidenceIds.join(", ") || "待补"}`,
    ...(brief.evidenceGaps.length === 0 ? ["- 证据闭环较完整，可以进入周报讨论。"] : brief.evidenceGaps.map((gap) => `- 缺口：${gap}`))
  ].join("\n");
}

function buildExecutiveReportBrief(data: ApiStateResponse): ExecutiveReportBrief {
  const appName = data.state.currentOwnedApp?.name ?? "当前 App";
  const decisions = buildProductDecisionBriefs(data).slice(0, 6);
  const strategies = buildStrategicInferences(data).slice(0, 5);
  const featureDetails = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const featureRecords = normalizeFeatures(data.state.features)
    .map((feature) => buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id)))
    .sort((left, right) => right.modelScore - left.modelScore)
    .slice(0, 5);
  const evidenceIds = uniqueValues([
    ...decisions.flatMap((decision) => decision.packageItem.evidenceIds),
    ...strategies.flatMap((strategy) => strategy.evidenceIds),
    ...featureRecords.flatMap((record) => record.taskCards[0]?.evidenceIds ?? [])
  ]);
  const evidenceGaps = executiveEvidenceGaps(data, evidenceIds, strategies);
  const evidenceScore = executiveEvidenceScore(data, evidenceIds, evidenceGaps);
  const p0Count = decisions.filter((decision) => decision.packageItem.priorityHint === "P0").length;
  const highStrategy = strategies.find((strategy) => strategy.stage === "strategic_inference") ?? strategies[0];
  const topDecision = decisions[0];
  const summary = [
    topDecision ? `本期最值得讨论的产品动作是「${topDecision.packageItem.title}」，建议为「${topDecision.outcomeLabel}」。` : "当前暂无可直接评审的需求，优先补采集和分析证据。",
    highStrategy ? `最强战略信号来自 ${highStrategy.ownerName}：${highStrategy.hypothesis}` : "暂未形成多信号战略推测。",
    `当前有 ${p0Count} 个 P0 决策项、${decisions.length} 个候选决策包，证据覆盖分 ${evidenceScore}。`,
    evidenceGaps.length > 0 ? `报告最大风险是：${evidenceGaps[0]}` : "关键证据覆盖较完整，可以进入周会或需求评审讨论。"
  ];
  const decisionRows = decisions.map<ExecutiveDecisionRow>((decision) => ({
    priority: decision.packageItem.priorityHint,
    title: decision.packageItem.title,
    outcome: decision.outcomeLabel,
    score: decision.packageItem.score,
    evidenceStrength:
      decision.packageItem.evidenceIds.length > 0
        ? evidenceQualityForIds(data, decision.packageItem.evidenceIds).label
        : evidenceStrengthText(decision.packageItem.evidenceIds.length),
    whyNow: decision.packageItem.whyNow
  }));
  const validationRows = decisions.slice(0, 5).map<ExecutiveValidationRow>((decision) => ({
    title: decision.packageItem.title,
    hypothesis: decision.packageItem.problem,
    validation: decision.packageItem.validationPlan,
    engineeringHint: decision.packageItem.implementationHint,
    successMetric: decision.packageItem.successMetric
  }));
  const noCopyRows = featureRecords.map<ExecutiveNoCopyRow>((record) => ({
    feature: record.feature.name,
    reason: record.insight.whyNotCopy,
    differentiation:
      record.feature.currentAppSupport === "advantage"
        ? "保留当前优势并强化商店页、首日体验和结果页表达。"
        : record.ownSnapshot.verdict === "公开证据缺失"
          ? "先确认是否真的缺失，再决定是否补齐。"
          : "保留当前影像调性、入口效率和用户熟悉路径，只补最短体验闭环。",
    validation: record.insight.validationPlan
  }));
  const briefBase = {
    title: `${appName} 竞品专题报告`,
    summary,
    decisionRows,
    strategyRows: strategies,
    validationRows,
    noCopyRows,
    evidenceIds,
    evidenceScore,
    evidenceGaps
  };
  return {
    ...briefBase,
    markdown: buildExecutiveReportMarkdown(briefBase, data)
  };
}

function agentCategoryLabel(category: AgentTaskCategory): string {
  const labels: Record<AgentTaskCategory, string> = {
    collection: "采集",
    analysis: "分析",
    reporting: "报告"
  };
  return labels[category];
}

function agentHealthLabel(health: AgentTaskHealth): string {
  const labels: Record<AgentTaskHealth, string> = {
    healthy: "健康",
    warning: "需关注",
    blocked: "阻塞"
  };
  return labels[health];
}

function agentHealthTone(health: AgentTaskHealth): "low" | "medium" | "high" {
  if (health === "healthy") {
    return "high";
  }
  if (health === "blocked") {
    return "low";
  }
  return "medium";
}

function taskHealth(blockers: string[], readinessScore: number, latestJob?: Job): AgentTaskHealth {
  if (blockers.length > 0 && readinessScore < 45) {
    return "blocked";
  }
  if (latestJob?.state === "Failed" || latestJob?.state === "PartialSucceeded" || blockers.length > 0 || readinessScore < 72) {
    return "warning";
  }
  return "healthy";
}

function taskStatus(blockers: string[], readinessScore: number, latestJob?: Job): string {
  if (latestJob?.state === "Running" || latestJob?.state === "Queued") {
    return statusLabel(latestJob.state);
  }
  if (blockers.length > 0 && readinessScore < 45) {
    return "待配置";
  }
  if (latestJob) {
    return statusLabel(latestJob.state);
  }
  return "待首次运行";
}

function scoreFromCoverage(readyCount: number, totalCount: number, evidenceCount: number, blockerCount: number): number {
  const coverageScore = totalCount <= 0 ? 20 : Math.round((readyCount / totalCount) * 56);
  return Math.max(8, Math.min(100, coverageScore + Math.min(32, evidenceCount * 4) - blockerCount * 8 + 12));
}

function makeResearchAgentTask(input: {
  data: ApiStateResponse;
  id: string;
  name: string;
  category: AgentTaskCategory;
  description: string;
  schedule: string;
  nextRunText: string;
  linkedJobType: JobType;
  readyCount: number;
  totalCount: number;
  coverageUnit: string;
  blockers: string[];
  outputs: string[];
  evidenceIds: string[];
}): ResearchAgentTask {
  const latestJob = latestJobForType(input.data, input.linkedJobType);
  const readinessScore = scoreFromCoverage(input.readyCount, input.totalCount, input.evidenceIds.length, input.blockers.length);
  const health = taskHealth(input.blockers, readinessScore, latestJob);
  return {
    id: input.id,
    name: input.name,
    category: input.category,
    description: input.description,
    schedule: input.schedule,
    status: taskStatus(input.blockers, readinessScore, latestJob),
    health,
    readinessScore,
    coverage: `${input.readyCount}/${Math.max(input.totalCount, 1)} ${input.coverageUnit}`,
    lastRunAt: latestJob ? jobTimestamp(latestJob) : undefined,
    nextRunText: input.nextRunText,
    linkedJobType: input.linkedJobType,
    blockers: input.blockers,
    outputs: input.outputs,
    evidenceIds: input.evidenceIds
  };
}

function evidenceIdsByChannel(data: ApiStateResponse, channels: ChannelName[]): string[] {
  return data.state.evidence.filter((evidence) => channels.includes(evidence.channelName)).map((evidence) => evidence.id);
}

function buildResearchAgentTasks(data: ApiStateResponse): ResearchAgentTask[] {
  const owners = strategicOwnerOptions(data);
  const ownerCount = Math.max(owners.length, 1);
  const appStoreChannels = data.state.channels.filter((channel) => channel.channelName === "App Store China");
  const androidChannels: ChannelName[] = ["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"];
  const domesticChannels = data.state.channels.filter((channel) => androidChannels.includes(channel.channelName));
  const websiteChannels = data.state.channels.filter((channel) => channel.channelName === "Website");
  const websiteOwners = owners.filter((owner) => {
    const competitor = data.state.competitors.find((item) => item.id === owner.id);
    return owner.id === data.state.currentOwnedApp?.id ? Boolean(data.state.currentOwnedApp?.websiteUrl) : Boolean(competitor?.websiteUrl);
  });
  const priceSignals = data.state.currentOwnedApp ? buildPriceSignals(data.state, data.state.currentOwnedApp.id) : [];
  const launchSignals = data.state.currentOwnedApp ? buildLaunchSignals(data.state, data.state.currentOwnedApp.id) : [];
  const strategySignals = buildStrategicInferences(data);
  const featureDetails = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const featureRecords = normalizeFeatures(data.state.features).map((feature) =>
    buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id))
  );
  const decisionPackages = buildProductDecisionBriefs(data);
  const recommendations = actionRecommendationsFor(data);
  const reportEvidenceIds = uniqueValues(data.state.reports.flatMap((report) => report.evidenceIds));
  const websiteEvidenceIds = data.state.evidence
    .filter((evidence) => evidence.channelName === "Website" || evidence.sourceType === "website")
    .map((evidence) => evidence.id);
  const priceEvidenceIds = uniqueValues([...priceSignals.flatMap((signal) => signal.evidenceIds), ...data.state.evidence.filter((evidence) => evidence.sourceType === "price").map((evidence) => evidence.id)]);
  const featureEvidenceIds = uniqueValues(featureRecords.flatMap((record) => record.taskCards.flatMap((task) => task.evidenceIds)));
  const requirementEvidenceIds = uniqueValues([...data.state.requirements.flatMap((requirement) => requirement.evidenceIds), ...recommendations.flatMap((recommendation) => recommendation.evidenceIds)]);

  return [
    makeResearchAgentTask({
      data,
      id: "app-store-agent",
      name: "App Store Agent",
      category: "collection",
      description: "检查 App Store 中国区页面、版本、评分、评论、截图和内购信息。",
      schedule: "每日 09:00",
      nextRunText: "下一周期按每日监控执行，可手动采集",
      linkedJobType: "crawl",
      readyCount: appStoreChannels.length,
      totalCount: ownerCount,
      coverageUnit: "对象已配置",
      blockers: appStoreChannels.length === 0 ? ["未配置 App Store 中国区渠道。"] : [],
      outputs: [`快照 ${data.state.snapshots.filter((snapshot) => appStoreChannels.some((channel) => channel.id === snapshot.channelId)).length} 条`, `评论 ${data.state.reviews.filter((review) => appStoreChannels.some((channel) => channel.id === review.channelId)).length} 条`],
      evidenceIds: evidenceIdsByChannel(data, ["App Store China"])
    }),
    makeResearchAgentTask({
      data,
      id: "domestic-android-agent",
      name: "Domestic Android Store Agent",
      category: "collection",
      description: "检查华为、小米、OPPO、vivo、应用宝等国内安卓渠道。",
      schedule: "每日 10:00",
      nextRunText: "优先补 OPPO / vivo / 小米缺口",
      linkedJobType: "crawl",
      readyCount: domesticChannels.length,
      totalCount: ownerCount,
      coverageUnit: "渠道已配置",
      blockers: domesticChannels.length === 0 ? ["未配置国内 Android 渠道。"] : [],
      outputs: [`安卓渠道 ${uniqueValues(domesticChannels.map((channel) => channel.channelName)).join("、") || "待补"}`, `成功渠道 ${domesticChannels.filter((channel) => channel.crawlStatus === "Succeeded" || channel.crawlStatus === "Ready").length}`],
      evidenceIds: evidenceIdsByChannel(data, androidChannels)
    }),
    makeResearchAgentTask({
      data,
      id: "website-watcher-agent",
      name: "Website Watcher Agent",
      category: "collection",
      description: "跟踪竞品官网、价格页、博客、帮助中心和 changelog。",
      schedule: "每日 11:00",
      nextRunText: "官网变化进入发布雷达和战略雷达",
      linkedJobType: "crawl",
      readyCount: Math.max(websiteChannels.length, websiteOwners.length),
      totalCount: ownerCount,
      coverageUnit: "对象有官网",
      blockers: websiteChannels.length === 0 && websiteOwners.length === 0 ? ["未配置官网 URL 或 Website 渠道。"] : [],
      outputs: [`官网证据 ${websiteEvidenceIds.length} 条`, `Website 渠道 ${websiteChannels.length} 个`],
      evidenceIds: websiteEvidenceIds
    }),
    makeResearchAgentTask({
      data,
      id: "pricing-agent",
      name: "Pricing Agent",
      category: "analysis",
      description: "监控会员价格、试用、AI 点数、高清导出和渠道价格差异。",
      schedule: "每日 12:00",
      nextRunText: "价格变化触发告警和专题报告",
      linkedJobType: "analyze",
      readyCount: priceSignals.length,
      totalCount: ownerCount,
      coverageUnit: "价格信号",
      blockers: priceEvidenceIds.length === 0 ? ["缺价格快照或会员价格字段。"] : [],
      outputs: [`价格信号 ${priceSignals.length} 条`, `含数字价格 ${priceSignals.filter((signal) => signal.numericPrices.length > 0).length} 条`],
      evidenceIds: priceEvidenceIds
    }),
    makeResearchAgentTask({
      data,
      id: "launch-monitor-agent",
      name: "Launch Monitor Agent",
      category: "analysis",
      description: "识别新功能、新玩法、活动、商业化、定位和官网发布。",
      schedule: "每日 13:00",
      nextRunText: "发布信号进入趋势时间线",
      linkedJobType: "analyze",
      readyCount: launchSignals.length,
      totalCount: Math.max(ownerCount, 1),
      coverageUnit: "发布信号",
      blockers: launchSignals.length === 0 ? ["缺版本、官网或发布证据。"] : [],
      outputs: [`发布信号 ${launchSignals.length} 条`, `高影响 ${launchSignals.filter((signal) => signal.impact === "high").length} 条`],
      evidenceIds: uniqueValues(launchSignals.flatMap((signal) => signal.evidenceIds))
    }),
    makeResearchAgentTask({
      data,
      id: "strategy-signal-agent",
      name: "Strategy Signal Agent",
      category: "analysis",
      description: "从商店页、官网、价格、评论、社媒和功能模型推断战略变化。",
      schedule: "每日 14:00",
      nextRunText: "多信号推测写入战略雷达",
      linkedJobType: "analyze",
      readyCount: strategySignals.filter((signal) => signal.stage !== "observation").length,
      totalCount: Math.max(strategySignals.length, 1),
      coverageUnit: "多信号推测",
      blockers: strategySignals.length === 0 ? ["缺多来源战略信号。"] : strategySignals.every((signal) => signal.stage === "observation") ? ["当前多为单来源观察项，暂不能升级为战略推测。"] : [],
      outputs: [`战略信号 ${strategySignals.length} 条`, `高置信 ${strategySignals.filter((signal) => signal.confidence >= 70).length} 条`],
      evidenceIds: uniqueValues(strategySignals.flatMap((signal) => signal.evidenceIds))
    }),
    makeResearchAgentTask({
      data,
      id: "feature-gap-agent",
      name: "Feature Gap Agent",
      category: "analysis",
      description: "对比当前 App 和竞品功能成熟度，生成差距、优势和任务卡。",
      schedule: "每日 15:00",
      nextRunText: "高分功能进入功能详情页和决策工作台",
      linkedJobType: "analyze",
      readyCount: featureRecords.filter((record) => record.modelScore >= 70).length,
      totalCount: Math.max(featureRecords.length, 1),
      coverageUnit: "功能已建模",
      blockers: featureRecords.length === 0 ? ["缺功能矩阵，无法生成差距模型。"] : [],
      outputs: [`功能模型 ${featureRecords.length} 项`, `P0/P1 ${featureRecords.filter((record) => !record.decisionGrade.startsWith("P2")).length} 项`],
      evidenceIds: featureEvidenceIds
    }),
    makeResearchAgentTask({
      data,
      id: "requirement-agent",
      name: "Requirement Agent",
      category: "analysis",
      description: "把高价值洞察、战略信号和功能差距转成候选需求和评审包。",
      schedule: "每日 16:00",
      nextRunText: "候选需求进入需求评审和版本规划",
      linkedJobType: "analyze",
      readyCount: decisionPackages.length,
      totalCount: Math.max(recommendations.length + data.state.requirements.length, 1),
      coverageUnit: "决策包",
      blockers: decisionPackages.length === 0 ? ["缺行动建议或候选需求。"] : [],
      outputs: [`决策包 ${decisionPackages.length} 个`, `本周评审 ${decisionPackages.filter((decision) => decision.outcome === "commit").length} 个`],
      evidenceIds: requirementEvidenceIds
    }),
    makeResearchAgentTask({
      data,
      id: "report-agent",
      name: "Report Agent",
      category: "reporting",
      description: "生成周报、专题报告、证据附录和管理层摘要。",
      schedule: "每周一 09:30",
      nextRunText: "下次周报周期自动生成，可手动触发",
      linkedJobType: "report",
      readyCount: data.state.reports.length,
      totalCount: 1,
      coverageUnit: "报告已生成",
      blockers: data.state.reports.length === 0 ? ["尚未生成周报。"] : reportEvidenceIds.length === 0 ? ["报告缺 Evidence 引用。"] : [],
      outputs: [`周报 ${data.state.reports.length} 份`, `报告证据 ${reportEvidenceIds.length} 条`],
      evidenceIds: reportEvidenceIds
    })
  ].sort((left, right) => {
    const healthOrder: Record<AgentTaskHealth, number> = { blocked: 3, warning: 2, healthy: 1 };
    return healthOrder[right.health] - healthOrder[left.health] || right.readinessScore - left.readinessScore;
  });
}

function priorityImplementationStatusLabel(status: PriorityImplementationStatus): string {
  const labels: Record<PriorityImplementationStatus, string> = {
    ready: "可进入日常使用",
    partial: "可用但需补证据",
    blocked: "依赖外部接入"
  };
  return labels[status];
}

function priorityImplementationStatusTone(status: PriorityImplementationStatus): "low" | "medium" | "high" {
  if (status === "ready") {
    return "high";
  }
  if (status === "blocked") {
    return "low";
  }
  return "medium";
}

function marketMetricDataStatusLabel(status: MarketMetricRow["dataStatus"]): string {
  const labels: Record<MarketMetricRow["dataStatus"], string> = {
    available: "已有代理指标",
    manual: "需手动导入",
    missing: "缺数据源"
  };
  return labels[status];
}

function integrationStatusLabel(status: IntegrationCapability["status"]): string {
  const labels: Record<IntegrationCapability["status"], string> = {
    ready: "可用",
    mocked: "前端已建模",
    blocked: "待接入"
  };
  return labels[status];
}

function creativeStatusLabel(status: CreativeAdSignal["status"]): string {
  const labels: Record<CreativeAdSignal["status"], string> = {
    evidence: "有证据",
    candidate: "候选信号",
    missing: "待补素材"
  };
  return labels[status];
}

function audienceSignalCategoryLabel(category: AudienceSdkSignal["category"]): string {
  const labels: Record<AudienceSdkSignal["category"], string> = {
    audience: "受众",
    retention: "留存 / 口碑",
    sdk: "SDK / 技术栈",
    privacy: "合规 / 隐私"
  };
  return labels[category];
}

function priorityImplementationMarkdown(sections: PriorityImplementationSection[]): string {
  return [
    "# P0 / P1 / P2 实施蓝图",
    "",
    "| 优先级 | 模块 | 状态 | 分数 | Owner | 下一步 |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...sections.map(
      (section) =>
        `| ${section.priority} | ${section.title} | ${priorityImplementationStatusLabel(section.status)} | ${section.score} | ${recommendationOwnerLabel(section.owner)} | ${section.nextActions[0] ?? "继续监控"} |`
    ),
    "",
    "## 验收口径",
    ...sections.flatMap((section) => [`### ${section.priority} ${section.title}`, ...section.acceptance.map((item) => `- ${item}`)])
  ].join("\n");
}

function buildPriorityImplementationSections(data: ApiStateResponse, latestReport?: Report): PriorityImplementationSection[] {
  const state = data.state;
  const collectIds = (ids: Array<string | undefined>) => uniqueValues(ids.filter((id): id is string => Boolean(id)));
  const androidChannels = new Set<ChannelName>(["Huawei", "Xiaomi", "OPPO", "vivo", "Tencent MyApp"]);
  const recommendations = [...(state.actionRecommendations ?? [])].sort((left, right) => right.impactScore - left.impactScore || right.confidence - left.confidence);
  const p0Recommendations = recommendations.filter((item) => item.priorityHint === "P0" || item.impactScore >= 80);
  const features = normalizeFeatures(state.features);
  const highGapFeatures = features.filter(
    (feature) =>
      (feature.currentAppSupport === "missing" || feature.currentAppSupport === "partial" || feature.currentAppSupport === "unknown") &&
      Object.values(feature.competitorSupport).some((support) => support === "owned" || support === "advantage")
  );
  const decisionReadyRequirements = state.requirements.filter((item) => item.status !== "Rejected");
  const screenshotsCount = state.snapshots.reduce((sum, snapshot) => sum + snapshot.screenshots.length, 0);
  const latestReportAge = latestReport ? daysSinceCaptured(latestReport.generatedAt) : 365;
  const evidenceSourceCount = new Set(state.evidence.map((item) => item.sourceType)).size;
  const ownChannels = state.channels.filter((channel) => channel.ownerType === "owned_app");
  const hasIos = ownChannels.some((channel) => channel.channelName === "App Store China");
  const hasAndroid = ownChannels.some((channel) => androidChannels.has(channel.channelName));
  const fetchedSocialSamples = state.socialSamples.filter((sample) => sample.fetchStatus === "Fetched" || sample.evidenceId);
  const configuredSocialAuth = state.socialAuthConfigs.filter((config) => config.enabled && config.status !== "NotConfigured");
  const authorizedSocialAuth = state.socialAuthConfigs.filter((config) => config.enabled && config.status === "Authorized");
  const succeededChannels = state.channels.filter((channel) => channel.crawlStatus === "Succeeded");
  const failedChannels = state.channels.filter((channel) => channel.crawlStatus === "Failed");
  const productModules = state.moduleAnalyses.filter((analysis) => analysis.moduleType === "product_performance" || analysis.moduleType === "ai_insight");
  const marketModules = state.moduleAnalyses.filter((analysis) => analysis.moduleType === "growth" || analysis.moduleType === "traffic" || analysis.moduleType === "social");

  const p0EvidenceIds = collectIds([
    ...p0Recommendations.flatMap((item) => item.evidenceIds),
    ...decisionReadyRequirements.flatMap((item) => item.evidenceIds),
    ...productModules.flatMap((analysis) => analysis.evidenceIds),
    ...(latestReport?.evidenceIds ?? [])
  ]);
  const p1EvidenceIds = collectIds([
    ...state.snapshots.map((snapshot) => snapshot.evidenceId),
    ...state.reviews.map((review) => review.evidenceId),
    ...state.socialSamples.map((sample) => sample.evidenceId),
    ...marketModules.flatMap((analysis) => analysis.evidenceIds)
  ]);
  const p2EvidenceIds = collectIds([
    ...state.evidence.filter((item) => item.sourceType === "website" || item.sourceType === "manual").map((item) => item.id),
    ...state.reports.flatMap((report) => report.evidenceIds),
    ...(latestReport?.evidenceIds ?? [])
  ]);

  const p0Score = Math.min(
    100,
    Math.round(
      Math.min(30, p0EvidenceIds.length * 4) +
        Math.min(22, p0Recommendations.length * 7) +
        Math.min(18, decisionReadyRequirements.length * 6) +
        Math.min(16, highGapFeatures.length * 3) +
        (screenshotsCount > 0 ? 8 : 0) +
        (latestReportAge <= 10 ? 6 : 0)
    )
  );
  const p1Score = Math.min(
    100,
    Math.round(
      (hasIos ? 14 : 0) +
        (hasAndroid ? 14 : 0) +
        Math.min(20, state.snapshots.length * 4) +
        Math.min(16, state.reviews.length * 3) +
        Math.min(18, fetchedSocialSamples.length * 6) +
        Math.min(12, marketModules.length * 4) +
        (evidenceSourceCount >= 4 ? 6 : 0)
    )
  );
  const p2Score = Math.min(
    100,
    Math.round(
      Math.min(24, succeededChannels.length * 4) +
        Math.min(18, configuredSocialAuth.length * 6) +
        Math.min(18, authorizedSocialAuth.length * 9) +
        Math.min(16, state.reports.length * 8) +
        Math.min(14, p2EvidenceIds.length * 2) +
        (failedChannels.length === 0 ? 10 : 0)
    )
  );
  const p0Blockers = [
    ...(p0EvidenceIds.length < 5 ? [`核心 Evidence 只有 ${p0EvidenceIds.length} 条，P0 需求进入评审前需要补截图、链接或评论原话。`] : []),
    ...(decisionReadyRequirements.length === 0 ? ["缺可直接进入需求池的功能差距 PRD 草案。"] : []),
    ...(highGapFeatures.length === 0 ? ["缺竞品已有、当前 App 缺失或偏弱的功能差距清单。"] : []),
    ...(latestReportAge > 10 ? ["最近周报超过 10 天未更新，蓝图判断可能滞后。"] : [])
  ];
  const p1Blockers = [
    ...(!hasIos ? ["缺 iOS / App Store 中国区证据，影响 iOS 版本判断。"] : []),
    ...(!hasAndroid ? ["缺国内 Android 渠道证据，影响 OPPO、vivo、华为、小米侧判断。"] : []),
    ...(fetchedSocialSamples.length === 0 ? ["缺小红书、抖音、微博公开样本。"] : []),
    ...(state.reviews.length === 0 ? ["缺评论原话，无法把市场变化转成用户问题。"] : [])
  ];
  const p2Blockers = [
    ...(configuredSocialAuth.length === 0 ? ["社媒授权未配置，只能使用手动链接样本。"] : []),
    ...(authorizedSocialAuth.length === 0 ? ["还没有可用授权，不能自动抓取公开社媒样本。"] : []),
    ...(failedChannels.length > 0 ? failedChannels.slice(0, 2).map((channel) => `${channel.channelName}：${channel.lastFailureReason ?? "最近采集失败"}`) : []),
    "下载量、收入、广告投放和 SDK 数据仍需第三方 CSV / API 接入。"
  ];

  return [
    {
      priority: "P0",
      title: "产品决策闭环",
      summary: "把功能差距、评论痛点、证据强度、需求评审、上线验证和研发准备串成可拍板的版本输入。",
      status: p0Score >= 70 && p0Blockers.length === 0 ? "ready" : p0EvidenceIds.length > 0 || p0Score >= 40 ? "partial" : "blocked",
      score: p0Score,
      owner: "product",
      coreViews: ["功能矩阵", "功能详情", "机会雷达", "决策工作台", "上线验证", "研发准备", "报告门禁"],
      evidenceIds: p0EvidenceIds,
      blockers: p0Blockers,
      nextActions: [
        "优先处理本周评审和阻塞待补项。",
        "把 P0/P1 决策写入周报并补齐 PRD 验收。",
        "研发准备页确认端、数据、QA 和灰度门槛。"
      ],
      acceptance: [
        "每个 P0 需求必须有 Evidence、MVP 范围、研发提示和成功指标。",
        "功能详情必须能解释竞品有什么、我们缺什么、为什么不能照搬。",
        "上线验证必须包含埋点、灰度、回滚和评论复盘口径。"
      ]
    },
    {
      priority: "P1",
      title: "市场与策略情报",
      summary: "补齐商店页、评分口碑、ASO、发布、社媒、战略推测和通知规则，让 PM 知道竞品为什么变。",
      status: p1Score >= 60 ? "ready" : p1EvidenceIds.length > 0 ? "partial" : "blocked",
      score: p1Score,
      owner: "research",
      coreViews: ["商店页", "评分口碑", "ASO 关键词", "发布雷达", "战略雷达", "竞品路线", "通知规则"],
      evidenceIds: p1EvidenceIds,
      blockers: p1Blockers,
      nextActions: [
        "把 P1 信号用于解释 P0 需求的为什么现在。",
        "社媒样本进入证据中心，不绕过平台登录、验证码或频控。",
        "高置信战略推测必须保留反证和缺口。"
      ],
      acceptance: [
        "P1 战略结论必须区分事实、模式和推断。",
        "商店页、评分、ASO、社媒至少两类来源交叉后再进入周报强结论。",
        "通知规则命中后要能回到证据、风险或任务。"
      ]
    },
    {
      priority: "P2",
      title: "外部数据与自动化接入",
      summary: "把下载收入、广告素材、受众、SDK、Webhook、Jira/飞书等外部能力做成可接入框架，先标注数据依赖。",
      status: p2Score >= 60 && authorizedSocialAuth.length > 0 ? "ready" : p2Score >= 35 || p2EvidenceIds.length > 0 ? "partial" : "blocked",
      score: p2Score,
      owner: "engineering",
      coreViews: ["市场指标", "广告素材", "受众 SDK", "集成设置", "Agent 任务"],
      evidenceIds: p2EvidenceIds,
      blockers: p2Blockers,
      nextActions: [
        "先定义 CSV / API 字段契约，再接第三方下载、收入、广告和 SDK 数据。",
        "P2 指标只能作为辅助解释，不能覆盖 P0 证据链。",
        "外部集成必须带权限、去重、失败重试和审计。"
      ],
      acceptance: [
        "下载、收入、广告、受众、SDK 默认显示为外部数据，不伪装成事实。",
        "每个集成必须有触发条件、payload 字段、下游目标和失败处理。",
        "P2 数据进入报告前必须经过报告门禁和 Evidence 引用检查。"
      ]
    }
  ];
}

function latestSnapshotForOwner(data: ApiStateResponse, owner: { id: string; type: "owned" | "competitor" }): ReturnType<typeof latestSnapshotFor> {
  const snapshots = data.state.snapshots
    .filter((snapshot) => (owner.type === "competitor" ? snapshot.competitorId === owner.id : !snapshot.competitorId))
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
  return snapshots[0];
}

function reviewsForOwner(data: ApiStateResponse, owner: { id: string; type: "owned" | "competitor" }) {
  return data.state.reviews.filter((review) => (owner.type === "competitor" ? review.competitorId === owner.id : !review.competitorId));
}

function channelsForStrategicOwner(data: ApiStateResponse, owner: { id: string; type: "owned" | "competitor" }): Channel[] {
  if (owner.type === "competitor") {
    const competitor = data.state.competitors.find((item) => item.id === owner.id);
    return competitor ? channelsFor(data, competitor) : [];
  }
  return channelsFor(data);
}

function buildMarketMetricRows(data: ApiStateResponse): MarketMetricRow[] {
  const owners = strategicOwnerOptions(data);
  return owners.map((owner) => {
    const competitor = owner.type === "competitor" ? data.state.competitors.find((item) => item.id === owner.id) : undefined;
    const snapshot = latestSnapshotForOwner(data, owner);
    const reviews = reviewsForOwner(data, owner);
    const channels = channelsForStrategicOwner(data, owner);
    const rating = snapshot?.rating;
    const reviewCount = snapshot?.reviewCount ?? reviews.length;
    const evidenceIds = uniqueValues([snapshot?.evidenceId, ...reviews.map((review) => review.evidenceId)].filter(Boolean) as string[]);
    const proxyScore = Math.min(100, Math.round((rating ? rating * 13 : 18) + Math.min(28, Math.log10(Math.max(reviewCount, 1)) * 9) + Math.min(22, channels.length * 5)));
    const hasSnapshot = Boolean(snapshot);
    return {
      id: `market:${owner.id}`,
      ownerId: owner.id,
      ownerName: owner.name,
      priority: competitor?.priority ?? "P0",
      rating,
      reviewCount,
      priceText: snapshot?.priceText ?? "待补会员 / IAP 价格",
      channelCoverage: channels.length ? channels.map((channel) => `${channel.channelName}/${statusLabel(channel.crawlStatus)}`).join("；") : "未配置渠道",
      proxyScore,
      dataStatus: hasSnapshot ? "available" : channels.length > 0 ? "manual" : "missing",
      nextData: hasSnapshot ? "接入下载、收入、排名或留存第三方数据后，可和当前代理指标交叉验证。" : "补最新商店快照、评论数、评分和价格；P2 再接下载收入估算。",
      pmUse: "用于判断竞品动作是否可能带来市场表现变化，辅助解释版本、价格和评论，不直接替代真实下载 / 收入数据。",
      limitation: "当前为公开商店页和评论代理指标；下载、收入、DAU、留存、市场份额需要第三方或内部授权数据源。",
      evidenceIds
    };
  });
}

function creativeThemeFromText(text: string): string {
  if (/AI|写真|生成|头像|智能/.test(text)) {
    return "AI 创作";
  }
  if (/模板|同款|热点|发型|证件照/.test(text)) {
    return "模板玩法";
  }
  if (/会员|VIP|SVIP|权益|价格|导出|高清/.test(text)) {
    return "会员转化";
  }
  if (/拍照|美颜|滤镜|自然|高级感/.test(text)) {
    return "影像效果";
  }
  return "品牌定位";
}

function creativeActionForTheme(theme: string): string {
  const actions: Record<string, string> = {
    "AI 创作": "对比入口、生成结果和分享链路，先做小样本玩法验证。",
    "模板玩法": "拆解模板供给、更新频率和社媒传播证据，避免只复制模板数量。",
    "会员转化": "补价格、权益和付费负评，先验证权益解释而不是直接改价。",
    "影像效果": "保留当前 App 调性，对比默认效果、路径步骤和保存体验。",
    "品牌定位": "看商店页、官网和社媒文案是否一致，再决定是否调整对外表达。"
  };
  return actions[theme] ?? actions["品牌定位"];
}

function buildCreativeAdSignals(data: ApiStateResponse): CreativeAdSignal[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const launchSignals = buildLaunchSignals(data.state, ownedAppId);
  const storeSignals = buildStoreMetadataSignals(data.state, ownedAppId);
  const socialSignals = data.state.socialSamples.map((sample): CreativeAdSignal => {
    const ownerName = sample.competitorId ? competitorName(data, sample.competitorId) : data.state.currentOwnedApp?.name ?? "当前 App";
    const text = `${sample.topic} ${sample.summary} ${sample.tags.join(" ")} ${sample.fetchedTitle ?? ""} ${sample.fetchedExcerpt ?? ""}`;
    const theme = creativeThemeFromText(text);
    return {
      id: `creative:social:${sample.id}`,
      ownerName,
      theme,
      source: sample.platform,
      angle: sample.summary || sample.topic,
      confidence: sample.evidenceId ? 78 : sample.fetchStatus === "Fetched" ? 66 : 48,
      status: sample.evidenceId ? "evidence" : sample.fetchStatus === "Failed" ? "missing" : "candidate",
      gap: sample.fetchStatus === "Failed" ? sample.fetchFailureReason ?? "公开页面不可访问，需要手动补证。" : "需要继续补截图、互动量和评论样本。",
      pmAction: creativeActionForTheme(theme),
      evidenceIds: sample.evidenceId ? [sample.evidenceId] : []
    };
  });
  const launchCreativeSignals = launchSignals.slice(0, 8).map((signal): CreativeAdSignal => {
    const theme = creativeThemeFromText(`${signal.title} ${signal.summary}`);
    return {
      id: `creative:launch:${signal.id}`,
      ownerName: signal.ownerName,
      theme,
      source: signal.sourceChannels.join("、"),
      angle: signal.summary,
      confidence: Math.round(signal.confidence * 100),
      status: signal.evidenceIds.length ? "candidate" : "missing",
      gap: "发布信号需要补广告素材、投放渠道或商店截图 OCR 才能升级为广告情报。",
      pmAction: creativeActionForTheme(theme),
      evidenceIds: signal.evidenceIds
    };
  });
  const storeCreativeSignals = storeSignals
    .filter((signal) => signal.field === "screenshots" || signal.field === "description")
    .slice(0, 8)
    .map((signal): CreativeAdSignal => {
      const theme = creativeThemeFromText(`${signal.afterValue} ${signal.keywordHints.join(" ")}`);
      return {
        id: `creative:store:${signal.id}`,
        ownerName: signal.ownerName,
        theme,
        source: `${signal.channelName}${signal.platform ? ` / ${signal.platform}` : ""}`,
        angle: signal.afterValue,
        confidence: signal.evidenceIds.length ? 72 : 52,
        status: signal.evidenceIds.length ? "candidate" : "missing",
        gap: "商店页素材不是广告投放事实，P2 需要接广告库或手动上传素材。",
        pmAction: creativeActionForTheme(theme),
        evidenceIds: signal.evidenceIds
      };
    });
  const missingCompetitorSignals = data.state.competitors
    .filter((competitor) => !socialSignals.some((signal) => signal.ownerName === competitor.name))
    .map((competitor): CreativeAdSignal => ({
      id: `creative:missing:${competitor.id}`,
      ownerName: competitor.name,
      theme: "待补素材",
      source: "P2 广告库 / 手动上传",
      angle: "缺广告素材、KOL 内容或投放关键词样本。",
      confidence: 20,
      status: "missing",
      gap: "无法判断竞品投放主题、素材迭代和投放渠道。",
      pmAction: "先补小红书、抖音、微博公开链接或第三方广告库导入。",
      evidenceIds: []
    }));
  return [...socialSignals, ...launchCreativeSignals, ...storeCreativeSignals, ...missingCompetitorSignals]
    .sort((left, right) => right.confidence - left.confidence || left.ownerName.localeCompare(right.ownerName))
    .slice(0, 40);
}

function buildAudienceSdkSignals(data: ApiStateResponse): AudienceSdkSignal[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const ratingSignals = buildRatingSentimentSignals(data.state, ownedAppId);
  const strategies = buildStrategicInferences(data);
  const featureDetails = buildFeatureGapDetails(data.state, ownedAppId);
  const featureRecords = normalizeFeatures(data.state.features).map((feature) =>
    buildFeatureComparisonRecord(data, feature, featureDetails.find((detail) => detail.featureId === feature.id))
  );
  const signals: AudienceSdkSignal[] = [
    ...ratingSignals.map((signal): AudienceSdkSignal => ({
      id: `audience:rating:${signal.id}`,
      category: "retention",
      title: `${signal.ownerName} 口碑留存代理信号`,
      ownerName: signal.ownerName,
      confidence: signal.sampleSize > 0 ? 72 : 46,
      currentStatus: signal.sampleSize > 0 ? "partial" : "needs_source",
      dataNeeded: "需要接入真实留存、活跃、卸载、版本后评分趋势或第三方 panel 数据。",
      pmUse: signal.summary,
      risk: signal.riskLevel === "high" ? "高口碑风险需要进入风险登记和版本复盘。" : "当前只能作为评论代理信号，不能代表真实留存。",
      evidenceIds: signal.evidenceIds
    })),
    ...strategies
      .filter((strategy) => strategy.theme === "ai_acceleration" || strategy.theme === "monetization" || strategy.theme === "platform_channel")
      .slice(0, 8)
      .map((strategy): AudienceSdkSignal => ({
        id: `sdk:strategy:${strategy.id}`,
        category: strategy.theme === "platform_channel" ? "sdk" : "audience",
        title: `${strategy.ownerName} ${strategy.themeLabel} 数据需求`,
        ownerName: strategy.ownerName,
        confidence: strategy.confidence,
        currentStatus: strategy.stage === "strategic_inference" ? "partial" : "needs_source",
        dataNeeded:
          strategy.theme === "ai_acceleration"
            ? "需要 AI 生成成功率、生成成本、内容审核、失败态和机型性能数据。"
            : strategy.theme === "monetization"
              ? "需要订阅转化、支付页退出、恢复购买、价格实验和退款数据。"
              : "需要渠道发布节奏、包体、SDK、权限、兼容和灰度数据。",
        pmUse: strategy.productImplication,
        risk: strategy.recommendation,
        evidenceIds: strategy.evidenceIds
      })),
    ...featureRecords
      .filter((record) => /AI|生成|支付|订阅|账号|同步|SDK|权限|隐私/.test(`${record.feature.name} ${record.feature.category}`))
      .slice(0, 10)
      .map((record): AudienceSdkSignal => ({
        id: `sdk:feature:${record.feature.id}`,
        category: /权限|隐私|账号/.test(`${record.feature.name} ${record.feature.category}`) ? "privacy" : "sdk",
        title: `${record.feature.name} 技术与数据依赖`,
        ownerName: data.state.currentOwnedApp?.name ?? "当前 App",
        confidence: record.modelScore,
        currentStatus: record.decisionGrade.startsWith("P2") ? "needs_source" : "partial",
        dataNeeded: record.taskCards.find((task) => task.ownerRole === "engineering")?.scope ?? "需要研发拆解 SDK、端能力、服务端、数据和 QA 依赖。",
        pmUse: record.modelSummary,
        risk: record.dimensionScores.find((dimension) => dimension.key === "implementationRisk")?.summary ?? record.insight.whyNotCopy,
        evidenceIds: featureRecordEvidenceIds(record)
      }))
  ];
  return signals.sort((left, right) => right.confidence - left.confidence).slice(0, 36);
}

function buildIntegrationCapabilities(data: ApiStateResponse, latestReport?: Report): IntegrationCapability[] {
  const reportGate = buildReportQualityGate(data, latestReport);
  const decisions = buildProductDecisionBriefs(data);
  const alerts = buildCompetitiveAlerts(data.state, data.state.currentOwnedApp?.id ?? "");
  const evidenceIds = uniqueValues(data.state.evidence.slice(0, 16).map((evidence) => evidence.id));
  return [
    {
      id: "integration-csv-import",
      name: "CSV / Excel 数据导入",
      priority: "P0",
      owner: "research",
      status: "ready",
      trigger: "手动上传竞品、渠道、评论、价格或第三方指标表。",
      payload: ["owned_app_id", "owner_name", "channel", "metric_name", "value", "captured_at", "source_url"],
      downstream: "证据中心、市场指标、周报、报告门禁",
      nextStep: "先提供模板并做字段校验，避免无来源数据进入强结论。",
      evidenceIds
    },
    {
      id: "integration-report-webhook",
      name: "飞书 / Slack 周报推送",
      priority: "P1",
      owner: "product",
      status: reportGate.status === "pass" || latestReport ? "mocked" : "blocked",
      trigger: "周报生成且报告门禁不阻塞。",
      payload: ["report_id", "period", "summary", "blocked_checks", "evidence_ids", "markdown_url"],
      downstream: "团队群、周会、产品负责人同步",
      nextStep: reportGate.status === "blocked" ? "先处理报告门禁阻塞，再允许推送强结论。" : "补真实 Webhook URL、签名、重试和发送审计。",
      evidenceIds: reportGate.evidenceIds
    },
    {
      id: "integration-jira-requirement",
      name: "Jira / Linear / BTS 需求同步",
      priority: "P1",
      owner: "product",
      status: decisions.length ? "mocked" : "blocked",
      trigger: "决策工作台输出本周评审或需求池 Accepted。",
      payload: ["title", "priority", "problem", "mvp_scope", "engineering_hint", "acceptance", "evidence_ids"],
      downstream: "研发排期、技术方案、QA 验收",
      nextStep: decisions.length ? "补项目映射、字段映射、去重规则和状态回写。" : "先生成决策包或候选需求。",
      evidenceIds: uniqueValues(decisions.flatMap((decision) => decision.packageItem.evidenceIds))
    },
    {
      id: "integration-alert-webhook",
      name: "告警 Webhook",
      priority: "P1",
      owner: "engineering",
      status: alerts.length ? "mocked" : "blocked",
      trigger: "渠道失败、价格变化、评分风险、高影响决策或 Agent 阻塞。",
      payload: ["alert_type", "severity", "owner_name", "summary", "recommended_action", "evidence_ids"],
      downstream: "飞书群、值班、站内通知、自动补证队列",
      nextStep: alerts.length ? "补签名校验、限流、重试和误报告警反馈。" : "先执行采集和分析生成告警。",
      evidenceIds: uniqueValues(alerts.flatMap((alert) => alert.evidenceIds))
    },
    {
      id: "integration-market-data",
      name: "下载 / 收入 / 排名第三方数据",
      priority: "P2",
      owner: "growth",
      status: "blocked",
      trigger: "第三方平台 API 或手动 CSV 导入。",
      payload: ["app_id", "country", "platform", "downloads", "revenue", "rank", "date", "provider"],
      downstream: "市场指标、优先级模拟、管理层摘要",
      nextStep: "确认供应商、字段授权、刷新频率、误差说明和报告免责声明。",
      evidenceIds: []
    },
    {
      id: "integration-ad-intel",
      name: "广告素材 / 投放关键词导入",
      priority: "P2",
      owner: "growth",
      status: "blocked",
      trigger: "第三方广告库、Apple Search Ads 或手动素材上传。",
      payload: ["owner_name", "creative_url", "network", "keyword", "first_seen", "theme", "screenshot_url"],
      downstream: "广告素材、社媒样本、ASO 关键词、战略雷达",
      nextStep: "先定义素材主题、截图存储和来源声明，不把商店截图当投放事实。",
      evidenceIds: []
    },
    {
      id: "integration-sdk-intel",
      name: "SDK / 技术栈情报导入",
      priority: "P2",
      owner: "engineering",
      status: "blocked",
      trigger: "第三方 SDK 检测、公开包体分析或人工录入。",
      payload: ["owner_name", "platform", "sdk_name", "sdk_category", "version", "first_seen", "source"],
      downstream: "受众 SDK、研发准备、风险登记",
      nextStep: "明确合法数据源和检测边界，避免绕过平台限制或逆向不合规数据。",
      evidenceIds: []
    }
  ];
}

const standardTestAssets: StandardTestAsset[] = [
  {
    id: "portrait",
    name: "人像",
    scenario: "单人自拍、肤色、发丝、五官、背景边缘。",
    imageBrief: "正面半身人像，发丝边缘清晰，背景有轻微纹理。",
    checks: ["肤色自然", "五官不变形", "边缘干净", "导出清晰"]
  },
  {
    id: "night",
    name: "夜景",
    scenario: "弱光、噪点、肤色偏色、生成失败率。",
    imageBrief: "夜间室外人像，有路灯和暗部噪点。",
    checks: ["暗部保留", "不糊脸", "噪点控制", "失败提示"]
  },
  {
    id: "passerby",
    name: "路人背景",
    scenario: "AI 消除、背景修复、边缘过渡和撤销。",
    imageBrief: "主体后方有 2-3 个路人，背景纹理复杂。",
    checks: ["消除干净", "背景不脏", "支持撤销", "可保存"]
  },
  {
    id: "product",
    name: "商品图",
    scenario: "商品边缘、阴影、背景替换、导出质量。",
    imageBrief: "桌面商品照片，带阴影和反光。",
    checks: ["边缘准确", "阴影合理", "颜色不偏", "高清导出"]
  },
  {
    id: "id_photo",
    name: "证件照",
    scenario: "尺寸、背景色、服装、付费边界、导出。",
    imageBrief: "标准半身证件照，纯色背景，头肩完整。",
    checks: ["规格选择", "背景色", "服装自然", "价格清晰"]
  },
  {
    id: "group_photo",
    name: "多人合照",
    scenario: "多人识别、一致性、局部失败、性能。",
    imageBrief: "3-5 人合照，人物距离和光照不同。",
    checks: ["多人一致", "不串脸", "耗时可接受", "失败可重试"]
  }
];

function ownerRowsForDeepReview(data: ApiStateResponse): Array<{ id: string; name: string; type: "owned_app" | "competitor"; competitor?: Competitor }> {
  return [
    ...(data.state.currentOwnedApp ? [{ id: data.state.currentOwnedApp.id, name: data.state.currentOwnedApp.name, type: "owned_app" as const }] : []),
    ...data.state.competitors.map((competitor) => ({ id: competitor.id, name: competitor.name, type: "competitor" as const, competitor }))
  ];
}

function evidenceIdsForOwner(data: ApiStateResponse, ownerId: string, ownerType: "owned_app" | "competitor"): string[] {
  const channelIds = new Set(
    data.state.channels
      .filter((channel) => channel.ownerType === ownerType && channel.ownerId === ownerId)
      .map((channel) => channel.id)
  );
  return uniqueValues([
    ...data.state.snapshots.filter((snapshot) => channelIds.has(snapshot.channelId)).map((snapshot) => snapshot.evidenceId),
    ...data.state.reviews.filter((review) => channelIds.has(review.channelId)).map((review) => review.evidenceId),
    ...data.state.socialSamples.filter((sample) => (ownerType === "competitor" ? sample.competitorId === ownerId : !sample.competitorId)).map((sample) => sample.evidenceId ?? "")
  ].filter(Boolean));
}

function screenshotsForEvidenceIds(data: ApiStateResponse, evidenceIds: string[]): string[] {
  const idSet = new Set(evidenceIds);
  return uniqueValues([
    ...data.state.snapshots.filter((snapshot) => idSet.has(snapshot.evidenceId)).flatMap((snapshot) => snapshot.screenshots),
    ...buildEvidenceRecords(data)
      .filter((record) => idSet.has(record.id))
      .flatMap((record) => record.screenshots)
  ]);
}

function latestPriceTextForOwner(data: ApiStateResponse, ownerId: string, ownerType: "owned_app" | "competitor"): string {
  const channelIds = new Set(
    data.state.channels
      .filter((channel) => channel.ownerType === ownerType && channel.ownerId === ownerId)
      .map((channel) => channel.id)
  );
  const snapshot = data.state.snapshots
    .filter((item) => channelIds.has(item.channelId) && item.priceText)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
  return snapshot?.priceText ?? "待补具体价格 / 权益";
}

function flowSupportForOwner(feature: Feature, owner: { id: string; type: "owned_app" | "competitor" }): Feature["currentAppSupport"] {
  if (owner.type === "owned_app") {
    return feature.currentAppSupport;
  }
  return feature.competitorSupport[owner.id] ?? "unknown";
}

function flowEntryPosition(ownerName: string, feature: Feature, support: Feature["currentAppSupport"]): string {
  const text = `${feature.name} ${feature.category}`;
  if (support === "missing" || support === "unknown") {
    return "未发现稳定入口，需补截图或真机证据";
  }
  if (/B612/.test(ownerName) && /AI|消除|写真|模板|证件照/.test(text)) {
    return "首页 AI / AI 页 / 拍摄后推荐，入口需要更集中";
  }
  if (/美图/.test(ownerName)) {
    return /会员|价格|导出/.test(text) ? "导出 / 会员中心 / AI 工具付费触点" : "首页修图 / AI 工具 / 一键精修";
  }
  if (/醒图/.test(ownerName)) {
    return /模板|证件照|发型|AI/.test(text) ? "首页模板 / 全部工具 / AI 工具集合" : "导入照片后工具栏";
  }
  if (/轻颜/.test(ownerName)) {
    return /拍照|美颜|滤镜/.test(text) ? "相机首页 / 风格面板 / 拍摄前调整" : "相机拍摄后编辑入口";
  }
  return "商店页或评论提及，入口待实测";
}

function flowPaymentRule(ownerName: string, feature: Feature, priceText: string): string {
  const text = `${feature.name} ${feature.category} ${priceText}`;
  if (/B612/.test(ownerName) && /AI|生成|写真|消除/.test(text)) {
    return priceText === "待补具体价格 / 权益" ? "可能关联 Credit，需要补消耗和失败返还规则" : `Credit / 会员：${priceText}`;
  }
  if (/美图/.test(ownerName)) {
    return priceText === "待补具体价格 / 权益" ? "美豆 / VIP 规则待补" : `美豆 / VIP：${priceText}`;
  }
  if (/会员|价格|导出|高清|AI|生成|写真|证件照/.test(text)) {
    return priceText;
  }
  return "未发现强付费限制，仍需补导出前付费验证";
}

function flowClickSteps(support: Feature["currentAppSupport"], ownerName: string, feature: Feature): number {
  if (support === "missing" || support === "unknown") {
    return 0;
  }
  const text = `${ownerName} ${feature.name} ${feature.category}`;
  let steps = /B612/.test(ownerName) ? 4 : /醒图|美图/.test(ownerName) ? 3 : 4;
  if (/首页|相机|拍照/.test(text)) {
    steps -= 1;
  }
  if (/会员|导出|支付|订阅/.test(text)) {
    steps += 1;
  }
  return Math.max(2, Math.min(6, steps));
}

function flowScore(cell: Omit<FeatureFlowCell, "score" | "verdict">): number {
  if (cell.support === "missing" || cell.support === "unknown") {
    return Math.max(12, cell.evidenceIds.length * 6);
  }
  const baseSupportScore = supportScore(cell.support);
  const stepScore = cell.clickSteps > 0 ? Math.max(0, 20 - cell.clickSteps * 2) : 0;
  const evidenceScore = Math.min(18, cell.evidenceIds.length * 5 + cell.screenshots.length * 4);
  const affordanceScore =
    (cell.hasExample.includes("有") ? 8 : 3) +
    (cell.undoSupport.includes("支持") ? 8 : 3) +
    (cell.saveExport.includes("可") ? 8 : 4) +
    (cell.failurePrompt.includes("明确") ? 8 : 3);
  return Math.min(100, Math.round(baseSupportScore * 0.36 + stepScore + evidenceScore + affordanceScore));
}

function buildFeatureFlowCells(data: ApiStateResponse, feature: Feature): FeatureFlowCell[] {
  return ownerRowsForDeepReview(data).map((owner) => {
    const support = flowSupportForOwner(feature, owner);
    const evidenceIds = evidenceIdsForOwner(data, owner.id, owner.type).filter((id) => {
      const evidence = data.state.evidence.find((item) => item.id === id);
      const text = `${feature.name} ${feature.category} ${evidence?.rawExcerpt ?? ""}`.toLowerCase();
      return text.includes(feature.name.toLowerCase()) || /AI|模板|会员|导出|拍照|美颜|滤镜|证件照|消除/.test(text);
    });
    const fallbackEvidenceIds = evidenceIds.length > 0 ? evidenceIds : evidenceIdsForOwner(data, owner.id, owner.type).slice(0, 3);
    const screenshots = screenshotsForEvidenceIds(data, fallbackEvidenceIds);
    const priceText = latestPriceTextForOwner(data, owner.id, owner.type);
    const clickSteps = flowClickSteps(support, owner.name, feature);
    const base: Omit<FeatureFlowCell, "score" | "verdict"> = {
      ownerId: owner.id,
      ownerName: owner.name,
      ownerType: owner.type,
      support,
      entryPosition: flowEntryPosition(owner.name, feature, support),
      clickSteps,
      loginRequired: support === "missing" || support === "unknown" ? "待验证" : /会员|支付|Credit|VIP|美豆/.test(priceText) ? "付费前可能需要登录" : "基础使用可先体验，账号状态待补",
      paymentRule: flowPaymentRule(owner.name, feature, priceText),
      hasExample: support === "missing" || support === "unknown" ? "待补示例" : /AI|模板|证件照|消除/.test(`${feature.name} ${feature.category}`) ? "应展示前后对比示例" : "可补效果示例",
      undoSupport: support === "missing" || support === "unknown" ? "待验证" : /消除|修图|编辑/.test(`${feature.name} ${feature.category}`) ? "必须支持撤销 / 重做" : "撤销要求中等",
      saveExport: /会员|高清|导出|证件照/.test(`${feature.name} ${feature.category}`) ? "需验证高清保存和付费限制" : "结果页应可保存 / 分享",
      failurePrompt: /AI|生成|消除|上传/.test(`${feature.name} ${feature.category}`) ? "需明确失败原因、重试和补偿" : "需明确空态和弱网提示",
      screenshots,
      evidenceIds: fallbackEvidenceIds
    };
    const score = flowScore(base);
    return {
      ...base,
      score,
      verdict:
        support === "missing"
          ? "当前缺失"
          : score >= 78
            ? "链路较完整"
            : score >= 58
              ? "可用但需补强"
              : "证据不足或体验不完整"
    };
  });
}

function featureFlowPrdMarkdown(data: ApiStateResponse, feature: Feature, detail: FeatureGapDetail | undefined, cells: FeatureFlowCell[]): string {
  const record = buildFeatureComparisonRecord(data, feature, detail);
  const benchmark = [...cells].filter((cell) => cell.ownerType === "competitor").sort((left, right) => right.score - left.score)[0];
  const own = cells.find((cell) => cell.ownerType === "owned_app");
  const evidenceIds = uniqueValues(cells.flatMap((cell) => cell.evidenceIds));
  const events = [
    "feature_entry_expose",
    "feature_entry_click",
    "asset_upload_success",
    "ai_process_start",
    "ai_process_success",
    "ai_process_fail",
    "result_save_click",
    "paywall_view",
    "credit_consume_result"
  ];
  return [
    `# ${feature.name} 功能差距 PRD 草稿`,
    "",
    "## 1. 背景",
    `当前 App 状态：${own ? supportLabel(own.support) : supportLabel(feature.currentAppSupport)}。竞品 Benchmark：${benchmark?.ownerName ?? "待补竞品"}，链路分 ${benchmark?.score ?? 0}。`,
    `模型判断：${record.decisionGrade}，${record.modelSummary}`,
    "",
    "## 2. 竞品证据",
    ...cells.map((cell) => `- ${cell.ownerName}：${supportLabel(cell.support)}，入口：${cell.entryPosition}，付费：${cell.paymentRule}，Evidence：${cell.evidenceIds.join(", ") || "待补"}`),
    "",
    "## 3. 用户场景",
    `用户希望在「${record.insight.journey}」中快速完成 ${feature.name}，并能理解是否登录、是否收费、失败后如何重试和结果能否保存。`,
    "",
    "## 4. MVP 范围",
    `- 做：${record.insight.mvpScope}`,
    "- 做：入口、上传 / 选择素材、处理中、结果页、撤销、保存、失败提示、付费 / Credit 说明。",
    "- 不做：不一次性复制竞品全部模板、复杂社区分发或无证据支撑的高级玩法。",
    "",
    "## 5. 交互草图说明",
    "- 首页 / AI 页展示入口卡片，包含示例前后对比和免费 / Credit 边界。",
    "- 点击后进入素材选择页，展示标准测试素材支持范围和失败限制。",
    "- 处理中展示预计耗时、取消入口和失败补偿说明。",
    "- 结果页展示撤销、重做、保存、分享和付费触发解释。",
    "",
    "## 6. 埋点",
    ...events.map((eventName) => `- ${eventName}`),
    "",
    "## 7. 验收标准",
    "- 入口点击到结果保存的关键路径可完整走通。",
    "- AI 失败、弱网、素材不合规、Credit 不足、登录态异常都有明确提示。",
    "- 同一组标准测试素材能横向记录效果、耗时、付费和导出质量。",
    `- 上线后验证：${record.insight.validationPlan}`,
    "",
    "## 8. 风险",
    `- 不照搬边界：${record.insight.whyNotCopy}`,
    "- AI 成本、内容审核、失败补偿、付费误解和低端机性能需要研发提前评审。",
    "",
    "## 9. Evidence",
    evidenceIds.join(", ") || "待补证据"
  ].join("\n");
}

function testEffectScore(ownerName: string, assetId: StandardTestAssetId, feature: Feature): number {
  const text = `${ownerName} ${assetId} ${feature.name} ${feature.category}`;
  let score = 56;
  if (/美图/.test(text) && /portrait|product|AI|修图|消除/.test(text)) {
    score += 24;
  }
  if (/醒图/.test(text) && /id_photo|passerby|模板|证件照|消除/.test(text)) {
    score += 22;
  }
  if (/轻颜/.test(text) && /portrait|night|group_photo|拍照|美颜/.test(text)) {
    score += 20;
  }
  if (/B612/.test(text) && /portrait|group_photo|拍照|滤镜|贴纸/.test(text)) {
    score += 18;
  }
  if (/night/.test(text)) {
    score -= /轻颜|B612/.test(ownerName) ? 2 : 8;
  }
  if (feature.currentAppSupport === "missing" && /B612/.test(ownerName)) {
    score -= 18;
  }
  return Math.max(18, Math.min(94, score));
}

function buildStandardTestResults(data: ApiStateResponse, feature: Feature): StandardTestResult[] {
  return standardTestAssets.flatMap((asset) =>
    ownerRowsForDeepReview(data).map((owner) => {
      const evidenceIds = evidenceIdsForOwner(data, owner.id, owner.type).slice(0, 4);
      const score = testEffectScore(owner.name, asset.id, feature);
      return {
        assetId: asset.id,
        ownerName: owner.name,
        effectScore: score,
        latencyText: score >= 78 ? "预计较快，需实测秒级耗时" : score >= 58 ? "耗时待实测，需记录 P50/P90" : "失败率或耗时风险高",
        paymentText: flowPaymentRule(owner.name, feature, latestPriceTextForOwner(data, owner.id, owner.type)),
        exportQuality: /id_photo|product/.test(asset.id) ? "必须验证高清 / 尺寸 / 水印" : "验证保存清晰度和社媒分享尺寸",
        failureRisk: /night|group_photo|passerby/.test(asset.id) ? "复杂场景，需检查失败提示和撤销" : "常规场景，需检查结果稳定性",
        verdict: score >= 78 ? "适合做 Benchmark" : score >= 58 ? "可作为补证样本" : "需要优先实测",
        evidenceIds
      };
    })
  );
}

function buildFeaturePriorityDetails(data: ApiStateResponse): FeaturePriorityDetail[] {
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const detailMap = new Map(buildFeatureGapDetails(data.state, ownedAppId).map((detail) => [detail.featureId, detail]));
  return normalizeFeatures(data.state.features)
    .map((feature) => {
      const record = buildFeatureComparisonRecord(data, feature, detailMap.get(feature.id));
      const dimension = (key: FeatureDimensionScore["key"]) => record.dimensionScores.find((item) => item.key === key)?.score ?? 0;
      const userValue = Math.min(100, Math.round(feature.demandScore * 0.74 + dimension("userDemand") * 0.26));
      const competitorCoverage = dimension("competitorPressure");
      const appGap = dimension("currentGap");
      const engineeringCost = dimension("implementationRisk");
      const monetizationPotential = dimension("businessImpact");
      const evidenceStrength = dimension("evidenceConfidence");
      const totalScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(userValue * 0.22 + competitorCoverage * 0.18 + appGap * 0.2 + monetizationPotential * 0.14 + evidenceStrength * 0.16 + (100 - engineeringCost) * 0.1)
        )
      );
      return {
        feature,
        record,
        userValue,
        competitorCoverage,
        appGap,
        engineeringCost,
        monetizationPotential,
        evidenceStrength,
        totalScore,
        nextVersionAdvice:
          totalScore >= 80
            ? "建议进入下个版本评审"
            : totalScore >= 65
              ? "先收敛 MVP 和研发成本"
              : evidenceStrength < 45
                ? "先补证据再判断"
                : "观察竞品和评论变化"
      };
    })
    .sort((left, right) => right.totalScore - left.totalScore);
}

function buildPaymentExperienceRows(data: ApiStateResponse): PaymentExperienceRow[] {
  return ownerRowsForDeepReview(data).map((owner) => {
    const price = latestPriceTextForOwner(data, owner.id, owner.type);
    const evidenceIds = evidenceIdsForOwner(data, owner.id, owner.type).slice(0, 5);
    const isB612 = /B612/.test(owner.name);
    const isMeitu = /美图/.test(owner.name);
    return {
      ownerName: owner.name,
      entry: isB612 ? "AI 页 / Credit 弹层 / 生成前后" : isMeitu ? "AI 工具 / 美豆 / VIP 权益页" : /醒图/.test(owner.name) ? "模板 / 工具 / 会员权益" : "相机 / 风格 / 会员权益",
      price,
      creditName: isB612 ? "Credit" : isMeitu ? "美豆 / VIP" : /醒图/.test(owner.name) ? "会员 / 模板权益" : "会员 / 滤镜权益",
      quota: isB612 ? "需展示剩余额度、单次消耗和失败返还" : "需补月度额度、试用次数和权益限制",
      consumption: /AI|Credit|美豆|会员|VIP/.test(price) ? "生成或高清导出时消耗，需记录触发点" : "待补消耗规则",
      refund: "失败、超时、取消、生成不满意是否返还需验证",
      failureCompensation: isB612 ? "Credit 失败返还必须在弹层和结果页解释清楚" : "需补失败补偿和客服路径",
      clarityScore: price === "待补具体价格 / 权益" ? 38 : isB612 ? 64 : isMeitu ? 72 : 58,
      evidenceIds
    };
  });
}

function buildReviewDeviceCrossChecks(data: ApiStateResponse, feature: Feature): ReviewDeviceCrossCheck[] {
  const records = buildEvidenceRecords(data);
  const visualRecords = records.filter((record) => record.screenshots.length > 0 || /device|截图|入口|弹层|结果|AI|Credit|会员|导出/.test(`${record.sourceUrl} ${record.rawExcerpt}`));
  const reviews = data.state.reviews.slice(0, 12);
  const checks = reviews.map((review) => {
    const keyword = review.topicHint ?? (review.content.match(/AI|会员|价格|夜景|模板|证件照|导出|美颜|滤镜|启动/)?.[0] ?? feature.name);
    const matchedRecord =
      visualRecords.find((record) => record.rawExcerpt.includes(keyword) || record.screenshots.some((screenshot) => screenshot.includes(keyword))) ??
      visualRecords[0];
    const evidenceIds = uniqueValues([review.evidenceId, matchedRecord?.id ?? ""].filter(Boolean));
    return {
      id: `cross:${review.id}`,
      topic: keyword,
      userQuote: review.content,
      deviceEvidence: matchedRecord ? `${matchedRecord.ownerName} / ${matchedRecord.channelName} / ${matchedRecord.rawExcerpt.slice(0, 60)}` : "缺真机或截图证据",
      linkedFeature: feature.name,
      conclusion: matchedRecord ? `评论「${keyword}」已找到页面或截图证据，可进入功能详情页做交叉验证。` : `评论「${keyword}」尚缺页面证据，不建议直接转需求。`,
      risk: matchedRecord ? (review.rating <= 2 ? "high" : "medium") : "high",
      action: matchedRecord ? "把评论和截图一起放入 PRD 背景，补充复现路径。" : "补真机截图、入口路径或付费弹层证据。",
      evidenceIds
    } satisfies ReviewDeviceCrossCheck;
  });
  if (checks.length > 0) {
    return checks;
  }
  return [
    {
      id: "cross:empty",
      topic: feature.name,
      userQuote: "暂无评论样本",
      deviceEvidence: visualRecords[0]?.rawExcerpt ?? "暂无截图证据",
      linkedFeature: feature.name,
      conclusion: "先补评论和真机截图，再做交叉验证。",
      risk: "high",
      action: "用标准素材库完成一次真机评测，并补评论样本。",
      evidenceIds: visualRecords[0] ? [visualRecords[0].id] : []
    }
  ];
}

function buildOwnBehaviorIntegrationSignals(feature: Feature): OwnBehaviorIntegrationSignal[] {
  const baseName = feature.name.toLowerCase().replace(/\s+/g, "_");
  return [
    {
      id: "behavior-entry",
      eventName: `${baseName}_entry_click`,
      question: "竞品有这个功能，我们用户是否真的会点入口？",
      currentStatus: "defined",
      funnelDropHypothesis: "入口曝光不足或入口文案不清会导致首步流失。",
      dataNeeded: ["入口曝光", "入口点击", "入口位置", "用户分层", "版本号"],
      owner: "product"
    },
    {
      id: "behavior-flow",
      eventName: `${baseName}_flow_complete`,
      question: "用户是否能从入口走到结果页？哪里掉得最多？",
      currentStatus: "needs_backend",
      funnelDropHypothesis: "上传、处理中、付费弹层和失败态可能是主要掉点。",
      dataNeeded: ["素材选择", "处理开始", "处理成功", "失败原因", "取消"],
      owner: "engineering"
    },
    {
      id: "behavior-value",
      eventName: `${baseName}_result_save_share`,
      question: "结果是否真的有价值，用户会保存或分享吗？",
      currentStatus: "defined",
      funnelDropHypothesis: "生成成功不等于有价值，保存 / 分享才是结果价值信号。",
      dataNeeded: ["保存", "分享", "导出清晰度", "水印状态", "社媒目的地"],
      owner: "product"
    },
    {
      id: "behavior-pay",
      eventName: `${baseName}_paywall_view_exit`,
      question: "如果收费，用户是因为贵、看不懂权益，还是误触付费墙？",
      currentStatus: "missing",
      funnelDropHypothesis: "付费解释不足会导致支付页退出和负评。",
      dataNeeded: ["付费弹层曝光", "权益点击", "支付点击", "支付退出", "Credit 消耗 / 返还"],
      owner: "growth"
    }
  ];
}

function buildVersionBattleReport(data: ApiStateResponse): VersionBattleReport {
  const ownedAppName = data.state.currentOwnedApp?.name ?? "当前 App";
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const launchSignals = buildLaunchSignals(data.state, ownedAppId);
  const priorityRows = buildFeaturePriorityDetails(data);
  const strategyRows = buildStrategicInferences(data);
  const rows = data.state.competitors.map((competitor) => {
    const competitorLaunch = launchSignals.find((signal) => signal.competitorId === competitor.id);
    const competitorStrategy = strategyRows.find((strategy) => strategy.ownerId === competitor.id);
    const gap = priorityRows.find((row) => {
      const support = row.feature.competitorSupport[competitor.id];
      return support === "owned" || support === "advantage" || support === "partial";
    });
    const evidenceIds = uniqueValues([
      ...(competitorLaunch?.evidenceIds ?? []),
      ...(competitorStrategy?.evidenceIds ?? []),
      ...(gap ? featureRecordEvidenceIds(gap.record) : [])
    ]);
    return {
      ownerName: competitor.name,
      change: competitorLaunch?.summary ?? competitorStrategy?.hypothesis ?? "暂无明确版本变化，先补渠道和截图证据。",
      missingForOwnApp: gap ? `${ownedAppName} 在「${gap.feature.name}」上${gap.record.decisionGrade}。` : "暂未发现明确功能差距。",
      hypeOrWorth:
        gap && gap.totalScore >= 78
          ? "值得跟：有竞品覆盖、用户价值和证据基础。"
          : competitorStrategy?.stage === "strategic_inference"
            ? "值得观察：战略信号较强，但需补功能实测。"
            : "可能是噱头：证据不足，不建议直接排期。",
      suggestedSchedule: gap?.nextVersionAdvice ?? "先补证据，不进入本周排期。",
      evidenceIds
    };
  });
  const evidenceIds = uniqueValues(rows.flatMap((row) => row.evidenceIds));
  const title = `${ownedAppName} 版本级竞品战报`;
  const summary = [
    `本周可评估竞品 ${rows.length} 个，Evidence ${evidenceIds.length} 条。`,
    priorityRows[0] ? `下个版本最值得讨论：${priorityRows[0].feature.name}，总分 ${priorityRows[0].totalScore}。` : "暂无足够功能评分，先补证据。",
    "战报区分“值得跟”和“可能是噱头”，避免只因竞品上线就复制。"
  ];
  const markdown = [
    `# ${title}`,
    "",
    "## 摘要",
    ...summary.map((item) => `- ${item}`),
    "",
    "## 竞品变化与排期建议",
    "| 竞品 | 新增 / 强化 | 我们缺什么 | 判断 | 建议排期 | Evidence |",
    "| --- | --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.ownerName} | ${row.change} | ${row.missingForOwnApp} | ${row.hypeOrWorth} | ${row.suggestedSchedule} | ${row.evidenceIds.join(", ") || "待补"} |`),
    "",
    "## 下周动作",
    "- P0：对最高分功能生成 PRD，并用标准测试素材完成一次横评。",
    "- P1：补截图链路回放、付费 / 积分体验和评论交叉验证。",
    "- P2：接入自有 App 埋点后，用真实漏斗验证是否值得做。"
  ].join("\n");
  return { title, summary, rows, markdown, evidenceIds };
}

function notificationTriggerLabel(trigger: NotificationRuleTrigger): string {
  const labels: Record<NotificationRuleTrigger, string> = {
    channel_failure: "渠道异常",
    price_change: "价格变化",
    rating_risk: "评分口碑风险",
    high_impact_decision: "高影响决策",
    strategy_shift: "战略变化",
    evidence_gap: "证据缺口",
    agent_blocked: "Agent 阻塞",
    report_risk: "报告风险",
    social_fetch_failure: "社媒抓取失败",
    launch_signal: "重大发布"
  };
  return labels[trigger];
}

function notificationChannelLabel(channel: NotificationRuleChannel): string {
  const labels: Record<NotificationRuleChannel, string> = {
    in_app: "站内",
    email: "邮件待接入",
    feishu: "飞书待接入",
    webhook: "Webhook 待接入"
  };
  return labels[channel];
}

function notificationOwnerLabel(role: ActionRecommendation["ownerRole"]): string {
  return recommendationOwnerLabel(role);
}

function severityWeight(severity: CompetitiveAlert["severity"]): number {
  const weights: Record<CompetitiveAlert["severity"], number> = { high: 3, medium: 2, low: 1 };
  return weights[severity];
}

function ruleEvidenceIds(matches: NotificationRuleMatch[]): string[] {
  return uniqueValues(matches.flatMap((match) => match.evidenceIds));
}

function latestMatchAt(matches: NotificationRuleMatch[]): string | undefined {
  return [...matches].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]?.createdAt;
}

function makeNotificationRule(input: {
  id: string;
  name: string;
  trigger: NotificationRuleTrigger;
  description: string;
  severity: CompetitiveAlert["severity"];
  threshold: string;
  channels: NotificationRuleChannel[];
  ownerRole: ActionRecommendation["ownerRole"];
  cadence: string;
  matches: NotificationRuleMatch[];
  disabledRuleIds: Set<string>;
}): NotificationRule {
  return {
    ...input,
    enabled: !input.disabledRuleIds.has(input.id),
    matches: input.matches.sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity) || right.createdAt.localeCompare(left.createdAt)),
    evidenceIds: ruleEvidenceIds(input.matches),
    lastMatchedAt: latestMatchAt(input.matches)
  };
}

function alertToNotificationMatch(ruleId: string, alert: CompetitiveAlert): NotificationRuleMatch {
  return {
    id: `${ruleId}:${alert.id}`,
    ruleId,
    title: alert.title,
    summary: alert.summary,
    severity: alert.severity,
    source: alertTypeLabel(alert.alertType),
    evidenceIds: alert.evidenceIds,
    createdAt: alert.createdAt,
    recommendedAction: alert.recommendationIds.length > 0 ? "进入机会雷达或决策工作台查看关联建议。" : "查看告警证据并补充渠道或评论样本。"
  };
}

function buildNotificationRules(data: ApiStateResponse, disabledRuleIds: string[] = []): NotificationRule[] {
  const disabled = new Set(disabledRuleIds);
  const ownedAppId = data.state.currentOwnedApp?.id ?? "";
  const now = new Date().toISOString();
  const alerts = buildCompetitiveAlerts(data.state, ownedAppId);
  const strategies = buildStrategicInferences(data);
  const agentTasks = buildResearchAgentTasks(data);
  const coverageAudit = buildEvidenceCoverageAudit(data);
  const executiveBrief = buildExecutiveReportBrief(data);
  const launchSignals = ownedAppId ? buildLaunchSignals(data.state, ownedAppId) : [];
  const decisionBriefs = buildProductDecisionBriefs(data);
  const failedSocialSamples = data.state.socialSamples.filter((sample) => sample.fetchStatus === "Failed");

  const channelFailureMatches = alerts
    .filter((alert) => alert.alertType === "channel_failure")
    .map((alert) => alertToNotificationMatch("rule-channel-failure", alert));
  const priceMatches = alerts
    .filter((alert) => alert.alertType === "price_change")
    .map((alert) => alertToNotificationMatch("rule-price-change", alert));
  const ratingMatches = alerts
    .filter((alert) => alert.alertType === "rating_risk")
    .map((alert) => alertToNotificationMatch("rule-rating-risk", alert));
  const decisionMatches: NotificationRuleMatch[] = decisionBriefs
    .filter((brief) => brief.outcome === "commit" || brief.packageItem.priorityHint === "P0" || brief.packageItem.score >= 82)
    .map((brief) => ({
      id: `rule-high-decision:${brief.id}`,
      ruleId: "rule-high-decision",
      title: brief.packageItem.title,
      summary: `${brief.outcomeLabel}，评审分 ${brief.packageItem.score}。${brief.releaseGate}`,
      severity: brief.outcome === "commit" ? "high" : "medium",
      source: "Product Decision Board",
      evidenceIds: brief.packageItem.evidenceIds,
      createdAt: data.state.requirements.find((requirement) => requirement.id === brief.packageItem.sourceId)?.updatedAt ?? now,
      recommendedAction: "进入产品决策工作台确认是否进入本周评审。"
    }));
  const strategyMatches: NotificationRuleMatch[] = strategies
    .filter((strategy) => strategy.stage === "strategic_inference" || strategy.confidence >= 72 || strategy.impact === "high")
    .map((strategy) => ({
      id: `rule-strategy:${strategy.id}`,
      ruleId: "rule-strategy",
      title: `${strategy.ownerName} / ${strategy.themeLabel}`,
      summary: `${strategy.hypothesis} 置信度 ${strategy.confidence}%`,
      severity: strategy.impact,
      source: "Strategy Radar",
      evidenceIds: strategy.evidenceIds,
      createdAt: strategy.signals[0]?.capturedAt ?? now,
      recommendedAction: "进入战略雷达查看支持信号、反证和证据缺口。"
    }));
  const evidenceGapMatches: NotificationRuleMatch[] = coverageAudit.gaps.map((gap, index) => ({
    id: `rule-evidence-gap:${index}`,
    ruleId: "rule-evidence-gap",
    title: "证据覆盖不足",
    summary: gap,
    severity: coverageAudit.averageScore < 55 ? "high" : "medium",
    source: "Evidence Credibility",
    evidenceIds: [],
    createdAt: now,
    recommendedAction: "进入证据中心补齐来源链接、截图、评论或跨平台样本。"
  }));
  const agentMatches: NotificationRuleMatch[] = agentTasks
    .filter((task) => task.health !== "healthy")
    .map((task) => ({
      id: `rule-agent:${task.id}`,
      ruleId: "rule-agent-blocked",
      title: task.name,
      summary: task.blockers[0] ?? `${agentHealthLabel(task.health)}，就绪分 ${task.readinessScore}`,
      severity: task.health === "blocked" ? "high" : "medium",
      source: "Agent Tasks",
      evidenceIds: task.evidenceIds,
      createdAt: task.lastRunAt ?? now,
      recommendedAction: "进入 Agent 任务中心查看阻塞项并补渠道或运行任务。"
    }));
  const reportMatches: NotificationRuleMatch[] = [
    ...(data.state.reports.length === 0
      ? [
          {
            id: "rule-report:no-report",
            ruleId: "rule-report-risk",
            title: "尚未生成周报",
            summary: "当前 App 没有可供团队讨论的周报。",
            severity: "medium" as const,
            source: "Reports",
            evidenceIds: [],
            createdAt: now,
            recommendedAction: "进入周报页生成首份报告。"
          }
        ]
      : []),
    ...(executiveBrief.evidenceScore < 68
      ? [
          {
            id: "rule-report:evidence-score",
            ruleId: "rule-report-risk",
            title: "专题报告证据覆盖不足",
            summary: `证据覆盖分 ${executiveBrief.evidenceScore}，不建议直接发送管理层报告。`,
            severity: executiveBrief.evidenceScore < 50 ? ("high" as const) : ("medium" as const),
            source: "Reports",
            evidenceIds: executiveBrief.evidenceIds,
            createdAt: now,
            recommendedAction: "先补证据中心缺口，再写入周报或导出专题。"
          }
        ]
      : [])
  ];
  const socialMatches: NotificationRuleMatch[] = failedSocialSamples.map((sample) => ({
    id: `rule-social:${sample.id}`,
    ruleId: "rule-social-failure",
    title: `${sample.platform} 抓取失败：${sample.topic}`,
    summary: sample.fetchFailureReason ?? "社媒公开样本抓取失败，需要人工补证据或检查授权状态。",
    severity: "medium",
    source: "Social Sample Library",
    evidenceIds: sample.evidenceId ? [sample.evidenceId] : [],
    createdAt: sample.updatedAt,
    recommendedAction: "进入社媒样本库查看失败原因，不绕过平台限制。"
  }));
  const launchMatches: NotificationRuleMatch[] = launchSignals
    .filter((signal) => signal.impact === "high" || signal.confidence >= 0.75)
    .map((signal) => ({
      id: `rule-launch:${signal.id}`,
      ruleId: "rule-launch-signal",
      title: signal.title,
      summary: signal.summary,
      severity: signal.impact,
      source: "Launch Radar",
      evidenceIds: signal.evidenceIds,
      createdAt: signal.occurredAt,
      recommendedAction: "进入发布雷达判断是否需要专题分析或需求跟进。"
    }));

  return [
    makeNotificationRule({
      id: "rule-channel-failure",
      name: "渠道采集失败提醒",
      trigger: "channel_failure",
      description: "当 App Store、国内安卓或官网渠道失败时提醒产品和研发补配置。",
      severity: "high",
      threshold: "任一渠道 Failed / Skipped",
      channels: ["in_app", "feishu"],
      ownerRole: "engineering",
      cadence: "实时",
      matches: channelFailureMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-price-change",
      name: "会员价格变化提醒",
      trigger: "price_change",
      description: "价格文本、数字价格或会员权益变化时提醒商业化产品。",
      severity: "high",
      threshold: "price changeType = changed",
      channels: ["in_app", "email"],
      ownerRole: "product",
      cadence: "每日汇总",
      matches: priceMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-rating-risk",
      name: "评分口碑风险提醒",
      trigger: "rating_risk",
      description: "评分下降、负评样本增加或口碑风险为高时提醒产品和研究同学。",
      severity: "high",
      threshold: "评分 < 4.2 或 risk = high",
      channels: ["in_app", "feishu"],
      ownerRole: "research",
      cadence: "每日汇总",
      matches: ratingMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-high-decision",
      name: "高影响需求评审提醒",
      trigger: "high_impact_decision",
      description: "当 Product Decision Board 生成 P0 或本周评审项时提醒 PM。",
      severity: "high",
      threshold: "P0 / 本周评审 / 评审分 >= 82",
      channels: ["in_app", "feishu"],
      ownerRole: "product",
      cadence: "每次分析后",
      matches: decisionMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-strategy",
      name: "战略变化高置信提醒",
      trigger: "strategy_shift",
      description: "多来源战略推测、AI 化或商业化强化出现高置信信号时提醒负责人。",
      severity: "medium",
      threshold: "战略推测 / 置信度 >= 72%",
      channels: ["in_app", "email"],
      ownerRole: "product",
      cadence: "每日汇总",
      matches: strategyMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-evidence-gap",
      name: "证据覆盖不足提醒",
      trigger: "evidence_gap",
      description: "报告或证据中心缺 iOS、Android、评论、社媒、截图时提醒补证据。",
      severity: "medium",
      threshold: "平均证据分 < 68 或存在覆盖缺口",
      channels: ["in_app"],
      ownerRole: "research",
      cadence: "每次分析后",
      matches: evidenceGapMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-agent-blocked",
      name: "Agent 阻塞提醒",
      trigger: "agent_blocked",
      description: "采集、分析、报告 Agent 出现阻塞或就绪分过低时提醒处理。",
      severity: "medium",
      threshold: "health != healthy",
      channels: ["in_app", "webhook"],
      ownerRole: "engineering",
      cadence: "实时",
      matches: agentMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-report-risk",
      name: "周报发送风险提醒",
      trigger: "report_risk",
      description: "没有周报或专题报告证据覆盖分低时阻止直接发送。",
      severity: "medium",
      threshold: "无报告 / 证据覆盖分 < 68",
      channels: ["in_app"],
      ownerRole: "product",
      cadence: "生成报告前",
      matches: reportMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-social-failure",
      name: "社媒样本抓取失败提醒",
      trigger: "social_fetch_failure",
      description: "小红书、抖音、微博公开样本抓取失败时提醒人工补证据。",
      severity: "medium",
      threshold: "SocialSample fetchStatus = Failed",
      channels: ["in_app"],
      ownerRole: "growth",
      cadence: "每日汇总",
      matches: socialMatches,
      disabledRuleIds: disabled
    }),
    makeNotificationRule({
      id: "rule-launch-signal",
      name: "重大发布信号提醒",
      trigger: "launch_signal",
      description: "新功能、商业化、定位、官网发布出现高影响信号时提醒 PM。",
      severity: "high",
      threshold: "impact = high 或 confidence >= 75%",
      channels: ["in_app", "email"],
      ownerRole: "product",
      cadence: "每日汇总",
      matches: launchMatches,
      disabledRuleIds: disabled
    })
  ].sort((left, right) => {
    const leftActiveMatches = left.enabled ? left.matches.length : 0;
    const rightActiveMatches = right.enabled ? right.matches.length : 0;
    return rightActiveMatches - leftActiveMatches || severityWeight(right.severity) - severityWeight(left.severity);
  });
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function actionRecommendationsFor(data: ApiStateResponse): ActionRecommendation[] {
  const existing = data.state.actionRecommendations ?? [];
  if (existing.length > 0) {
    return [...existing].sort((left, right) => right.impactScore - left.impactScore || right.confidence - left.confidence);
  }
  const ownedAppId = data.state.currentOwnedApp?.id;
  return ownedAppId ? buildActionRecommendations(data.state, ownedAppId) : [];
}

function recommendationAreaLabel(area: ActionRecommendation["area"]): string {
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

function recommendationOwnerLabel(role: ActionRecommendation["ownerRole"]): string {
  const labels: Record<ActionRecommendation["ownerRole"], string> = {
    product: "产品",
    engineering: "研发",
    growth: "增长",
    research: "研究/数据"
  };
  return labels[role];
}

function recommendationActionLabel(actionType: ActionRecommendation["actionType"]): string {
  const labels: Record<ActionRecommendation["actionType"], string> = {
    add_feature: "新增功能",
    improve_experience: "体验优化",
    collect_evidence: "补证据",
    monitor_change: "持续监控",
    amplify_advantage: "强化优势",
    fix_quality: "质量修复"
  };
  return labels[actionType];
}

function effortLabel(effort: ActionRecommendation["effort"]): string {
  const labels: Record<ActionRecommendation["effort"], string> = {
    S: "小",
    M: "中",
    L: "大"
  };
  return labels[effort];
}

function recommendationCompetitorNames(data: ApiStateResponse, recommendation: ActionRecommendation): string {
  const names = recommendation.competitorIds
    .map((id) => data.state.competitors.find((competitor) => competitor.id === id)?.name)
    .filter(Boolean);
  return names.join("、") || "当前 App";
}

function recommendationFeatureNames(data: ApiStateResponse, recommendation: ActionRecommendation): string {
  const names = recommendation.featureIds
    .map((id) => data.state.features.find((feature) => feature.id === id)?.name)
    .filter(Boolean);
  return names.join("、") || "非功能项";
}

function timelineEventLabel(type: CompetitiveTimelineEvent["eventType"]): string {
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

function impactLabel(impact: CompetitiveTimelineEvent["impact"]): string {
  const labels: Record<CompetitiveTimelineEvent["impact"], string> = {
    low: "低",
    medium: "中",
    high: "高"
  };
  return labels[impact];
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
    campaign: "活动/玩法",
    pricing: "商业化",
    user_feedback: "用户反馈",
    brand_positioning: "品牌定位",
    template_trend: "爆款模板"
  };
  return labels[type];
}

function socialAuthStatusTone(status: SocialAuthStatus): "low" | "medium" | "high" {
  if (status === "Authorized") {
    return "low";
  }
  if (status === "Failed" || status === "TokenExpired" || status === "PendingTokenExchange") {
    return "high";
  }
  return "medium";
}

function defaultSocialAuthRedirectUri(platform: SocialAuthPlatform): string {
  return `http://localhost:4310/api/social-auth/callback/${platform}`;
}

function defaultSocialAuthScopes(platform: SocialAuthPlatform): string {
  return platform === "weibo" ? "all" : "user_info";
}

function featureDetailDecisionLabel(decision: FeatureGapDetail["decision"]): string {
  const labels: Record<FeatureGapDetail["decision"], string> = {
    gap: "明显差距",
    improve: "待补强",
    advantage: "当前优势",
    watch: "继续观察"
  };
  return labels[decision];
}

function platformLabel(platform?: "ios" | "android"): string {
  if (platform === "ios") {
    return "iOS";
  }
  if (platform === "android") {
    return "Android";
  }
  return "未识别";
}

interface ComparisonColumn {
  id: string;
  name: string;
  values: Record<string, string>;
}

function buildOverviewComparison(data: ApiStateResponse): { rows: Array<{ key: string; label: string }>; columns: ComparisonColumn[] } {
  const rows = [
    { key: "type", label: "对象类型" },
    { key: "priority", label: "优先级" },
    { key: "category", label: "定位 / 分类" },
    { key: "iosChannel", label: "iOS 渠道覆盖" },
    { key: "androidChannel", label: "Android 渠道覆盖" },
    { key: "iosVersionRating", label: "iOS 版本 / 评分" },
    { key: "androidVersionRating", label: "Android 版本 / 评分" },
    { key: "iosReviewSamples", label: "iOS 评论样本" },
    { key: "androidReviewSamples", label: "Android 评论样本" },
    { key: "iosMembership", label: "iOS 会员价格" },
    { key: "androidMembership", label: "Android 会员价格" },
    { key: "iosChange", label: "iOS 关键变化" },
    { key: "androidChange", label: "Android 关键变化" },
    { key: "priceSignal", label: "整体价格 / 付费信号" },
    { key: "hotspot", label: "用户热点" },
    { key: "coverage", label: "功能覆盖" },
    { key: "gap", label: "竞品多出的能力" },
    { key: "advantage", label: "当前 App 优势" },
    { key: "action", label: "建议动作" }
  ];

  const columns: ComparisonColumn[] = [];
  const ownApp = data.state.currentOwnedApp;
  if (ownApp) {
    const featureSummary = ownFeatureSummary(data);
    columns.push({
      id: ownApp.id,
      name: ownApp.name,
      values: {
        type: "自有 App / 分析基准",
        priority: "Base",
        category: ownApp.category,
        iosChannel: platformChannelSummary(data, undefined, "ios"),
        androidChannel: platformChannelSummary(data, undefined, "android"),
        iosVersionRating: platformVersionRating(data, undefined, "ios"),
        androidVersionRating: platformVersionRating(data, undefined, "android"),
        iosReviewSamples: `${reviewCountForPlatform(data, undefined, "ios")} 条`,
        androidReviewSamples: `${reviewCountForPlatform(data, undefined, "android")} 条`,
        iosMembership: membershipPriceForPlatform(data, undefined, "ios"),
        androidMembership: membershipPriceForPlatform(data, undefined, "android"),
        iosChange: platformChange(data, undefined, "ios"),
        androidChange: platformChange(data, undefined, "android"),
        priceSignal: priceSignalFor(data),
        hotspot: insightSummaryFor(data),
        coverage: featureSummary.coverage,
        gap: featureSummary.gap,
        advantage: featureSummary.advantage,
        action: featureSummary.action
      }
    });
  }

  data.state.competitors.forEach((competitor) => {
    const featureSummary = competitorFeatureSummary(data, competitor);
    columns.push({
      id: competitor.id,
      name: competitor.name,
      values: {
        type: "竞品",
        priority: competitor.priority,
        category: competitor.category,
        iosChannel: platformChannelSummary(data, competitor, "ios"),
        androidChannel: platformChannelSummary(data, competitor, "android"),
        iosVersionRating: platformVersionRating(data, competitor, "ios"),
        androidVersionRating: platformVersionRating(data, competitor, "android"),
        iosReviewSamples: `${reviewCountForPlatform(data, competitor, "ios")} 条`,
        androidReviewSamples: `${reviewCountForPlatform(data, competitor, "android")} 条`,
        iosMembership: membershipPriceForPlatform(data, competitor, "ios"),
        androidMembership: membershipPriceForPlatform(data, competitor, "android"),
        iosChange: platformChange(data, competitor, "ios"),
        androidChange: platformChange(data, competitor, "android"),
        priceSignal: priceSignalFor(data, competitor),
        hotspot: competitorInsightSummary(data, competitor),
        coverage: featureSummary.gap === "暂无明显差距" ? "与当前 App 接近" : "竞品已具备关键能力",
        gap: featureSummary.gap,
        advantage: featureSummary.advantage,
        action: featureSummary.action
      }
    });
  });

  return { rows, columns };
}

function downloadMarkdownContent(markdown: string, filename: string): void {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadMarkdown(report: Report): void {
  downloadMarkdownContent(report.markdown, `competitive_weekly_${report.period.start}_${report.period.end}_${report.id}.md`);
}

// @SpecId: ACI-FLOW-APP-005
export function App() {
  const [data, setData] = useState<ApiStateResponse>();
  const [activeOwnedAppId, setActiveOwnedAppId] = useState<string>();
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string>();
  const [error, setError] = useState<string>();
  const [actionNotice, setActionNotice] = useState<ActionNotice>();
  const [openNavGroups, setOpenNavGroups] = useState<Record<string, boolean>>(() =>
    navGroups.reduce<Record<string, boolean>>((state, group) => {
      state[group.id] = group.id === "workspace";
      return state;
    }, {})
  );

  const activeApp = data?.state.currentOwnedApp;

  async function reload(nextOwnedAppId = activeOwnedAppId) {
    setLoading(true);
    const response = await fetchDashboardState(nextOwnedAppId);
    setData(response);
    setActiveOwnedAppId(response.activeOwnedAppId);
    setLoading(false);
  }

  async function runAction(label: string, action: () => Promise<ApiStateResponse>, options?: RunActionOptions) {
    try {
      setError(undefined);
      setActionNotice(undefined);
      setBusyAction(label);
      const response = await action();
      setData(response);
      setActiveOwnedAppId(response.activeOwnedAppId);
      if (options?.successMessage) {
        setActionNotice({ tone: "success", text: options.successMessage(response) });
      }
    } catch (actionError) {
      setActionNotice(undefined);
      setError(actionError instanceof Error ? actionError.message : String(actionError));
    } finally {
      setBusyAction(undefined);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    const activeGroup = navGroups.find((group) => group.items.some((item) => item.key === activeView));
    if (!activeGroup) {
      return;
    }
    setOpenNavGroups((current) => (current[activeGroup.id] ? current : { ...current, [activeGroup.id]: true }));
  }, [activeView]);

  const reportsByLatest = useMemo(
    () => [...(data?.state.reports ?? [])].sort((left, right) => right.generatedAt.localeCompare(left.generatedAt)),
    [data?.state.reports]
  );
  const latestReport = reportsByLatest[0];

  if (!data || loading) {
    return (
      <main className="boot">
        <Loader2 className="spin" size={28} />
        <span>正在加载 App 竞品雷达</span>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ACI</div>
          <div>
            <h1>App 竞品雷达</h1>
            <p>Competitive Intelligence</p>
          </div>
        </div>

        <label className="field-label" htmlFor="owned-app-select">
          当前自有 App
        </label>
        <select
          id="owned-app-select"
          value={activeOwnedAppId ?? ""}
          onChange={(event) => {
            setActiveOwnedAppId(event.target.value);
            void reload(event.target.value);
          }}
        >
          {data.state.ownedApps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>

        <nav className="nav-list" aria-label="主导航">
          {navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isActiveGroup = group.items.some((item) => item.key === activeView);
            const isOpen = Boolean(openNavGroups[group.id]);
            return (
              <div
                className={["nav-section", isActiveGroup ? "active" : "", isOpen ? "open" : ""].filter(Boolean).join(" ")}
                key={group.id}
              >
                <button
                  type="button"
                  className="nav-section-heading"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenNavGroups((current) => ({ ...current, [group.id]: !current[group.id] }));
                  }}
                >
                  <span>
                    <GroupIcon size={15} />
                    {group.label}
                  </span>
                  <em>{group.items.length}</em>
                </button>
                {isOpen ? (
                  <div className="nav-section-items">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.key} className={activeView === item.key ? "nav-item active" : "nav-item"} onClick={() => setActiveView(item.key)}>
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className={data.offline ? "status-dot warning" : "status-dot ok"} />
          <span>{data.offline ? "本地演示数据" : "API 已连接"}</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">中国区多 App 竞品监控</p>
            <h2>{activeApp ? activeApp.name : "请选择或创建自有 App"}</h2>
          </div>
          <div className="topbar-actions">
            <button className="icon-button" onClick={() => void reload()} title="刷新数据">
              <RefreshCw size={18} />
            </button>
            {activeApp ? (
              <>
                <button
                  className="primary"
                  disabled={Boolean(busyAction)}
                  onClick={() => void runAction("crawl", () => triggerJob(activeApp.id, "crawl"), { successMessage: (response) => jobResultMessage(response, "crawl") })}
                >
                  {busyAction === "crawl" ? <Loader2 className="spin" size={17} /> : <Search size={17} />}
                  {busyAction === "crawl" ? "采集中" : "采集"}
                </button>
                <button
                  className="secondary"
                  disabled={Boolean(busyAction)}
                  onClick={() => void runAction("analyze", () => triggerJob(activeApp.id, "analyze"), { successMessage: (response) => jobResultMessage(response, "analyze") })}
                >
                  {busyAction === "analyze" ? <Loader2 className="spin" size={17} /> : <Layers size={17} />}
                  {busyAction === "analyze" ? "分析中" : "分析"}
                </button>
                <button
                  className="secondary"
                  disabled={Boolean(busyAction)}
                  onClick={() => void runAction("report", () => triggerJob(activeApp.id, "report"), { successMessage: (response) => jobResultMessage(response, "report") })}
                >
                  {busyAction === "report" ? <Loader2 className="spin" size={17} /> : <FileText size={17} />}
                  {busyAction === "report" ? "生成中" : "周报"}
                </button>
              </>
            ) : null}
            {activeApp ? (
              <div className="task-trigger-hint" title="手动点击使用毫秒级任务 key；定时任务可按配置周期去重。">
                <Info size={14} />
                <span>手动点击每次新建任务，不按小时合并；定时任务按周期去重</span>
              </div>
            ) : null}
          </div>
        </header>

        {error ? (
          <section className="alert">
            <X size={16} />
            {error}
          </section>
        ) : null}

        {busyAction ? (
          <section className="notice">
            <Loader2 className="spin" size={16} />
            正在执行{actionLabel(busyAction)}，完成后会刷新当前视图。
          </section>
        ) : null}

        {actionNotice ? (
          <section className={`notice ${actionNotice.tone === "success" ? "success-notice" : ""}`}>
            <Check size={16} />
            {actionNotice.text}
          </section>
        ) : null}

        {activeView === "overview" && <OverviewView data={data} latestReport={latestReport} />}
        {activeView === "portfolio" && <PortfolioView data={data} runAction={runAction} />}
        {activeView === "priorityRoadmap" && <PriorityImplementationView data={data} latestReport={latestReport} />}
        {activeView === "opportunities" && <OpportunityRadarView data={data} runAction={runAction} />}
        {activeView === "timeline" && <TimelineView data={data} />}
        {activeView === "pricing" && <PricingMonitorView data={data} />}
        {activeView === "diffs" && <EvidenceDiffView data={data} />}
        {activeView === "alerts" && <AlertsView data={data} />}
        {activeView === "notificationRules" && <NotificationRulesView data={data} runAction={runAction} />}
        {activeView === "changeImpact" && <ChangeImpactView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "riskRegister" && <RiskRegisterView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "evidenceGraph" && <EvidenceCitationGraphView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "storeMetadata" && <StoreMetadataTimelineView data={data} />}
        {activeView === "ratingSentiment" && <RatingSentimentView data={data} />}
        {activeView === "asoKeywords" && <AsoKeywordRadarView data={data} />}
        {activeView === "launchRadar" && <LaunchRadarView data={data} />}
        {activeView === "competitorRoadmap" && <CompetitorRoadmapView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "strategyRadar" && <StrategyRadarView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "agentTasks" && <AgentTasksView data={data} runAction={runAction} />}
        {activeView === "featureGapDetail" && (
          <FeatureGapDetailView data={data} selectedFeatureId={selectedFeatureId} onSelectFeature={setSelectedFeatureId} runAction={runAction} />
        )}
        {activeView === "socialSamples" && <SocialSamplesView data={data} runAction={runAction} />}
        {activeView === "platformAuth" && <PlatformAuthView data={data} runAction={runAction} />}
        {activeView === "reviewAgenda" && <ReviewAgendaView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "decisionBoard" && <DecisionBoardView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "prioritySimulator" && <PrioritySimulatorView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "executionBacklog" && <ExecutionBacklogView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "metricDictionary" && <MetricDictionaryView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "evidenceQueue" && <EvidenceCollectionQueueView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "knowledgeBase" && <KnowledgeBaseView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "competitorDetail" && <CompetitorDetailView data={data} />}
        {activeView === "evidence" && <EvidenceCenterView data={data} />}
        {activeView === "channels" && <ChannelsView data={data} runAction={runAction} />}
        {activeView === "coverageMap" && <CoverageMapView data={data} />}
        {activeView === "insights" && <InsightsView data={data} runAction={runAction} />}
        {activeView === "painRadar" && <PainRadarView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "features" && (
          <FeaturesView
            data={data}
            onOpenDetail={(featureId) => {
              setSelectedFeatureId(featureId);
              setActiveView("featureGapDetail");
            }}
          />
        )}
        {activeView === "requirementReview" && <RequirementReviewView data={data} runAction={runAction} />}
        {activeView === "roadmap" && <RoadmapPlanningView data={data} runAction={runAction} />}
        {activeView === "validation" && <ReleaseValidationView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "engineeringReadiness" && <EngineeringReadinessView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "reportGate" && <ReportQualityGateView data={data} latestReport={latestReport} runAction={runAction} />}
        {activeView === "deepReviewLab" && <DeepReviewLabView data={data} latestReport={latestReport} />}
        {activeView === "marketMetrics" && <MarketMetricsView data={data} />}
        {activeView === "creativeAds" && <CreativeAdIntelligenceView data={data} />}
        {activeView === "audienceSdk" && <AudienceSdkIntelligenceView data={data} />}
        {activeView === "integrations" && <IntegrationsView data={data} latestReport={latestReport} />}
        {activeView === "requirements" && <RequirementsView data={data} runAction={runAction} />}
        {activeView === "reports" && <ReportsView data={data} reports={reportsByLatest} runAction={runAction} />}
      </main>
    </div>
  );
}

function OverviewView({ data, latestReport }: { data: ApiStateResponse; latestReport?: Report }) {
  const metrics = data.metrics;
  const recommendations = actionRecommendationsFor(data);
  const jobs = [...data.state.jobs].sort((left, right) => jobTimestamp(right).localeCompare(jobTimestamp(left))).slice(0, 5);
  const comparison = buildOverviewComparison(data);
  const moduleColumns = [
    ...(data.state.currentOwnedApp ? [{ id: data.state.currentOwnedApp.id, name: data.state.currentOwnedApp.name, isOwn: true, competitor: undefined }] : []),
    ...data.state.competitors.map((competitor) => ({ id: competitor.id, name: competitor.name, isOwn: false, competitor }))
  ];
  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="竞品" value={metrics?.competitors ?? 0} />
        <Metric label="渠道" value={metrics?.channels ?? 0} />
        <Metric label="活跃洞察" value={metrics?.activeInsights ?? 0} />
        <Metric label="行动建议" value={recommendations.length} />
        <Metric label="候选需求" value={metrics?.requirements ?? 0} />
        <Metric label="周报" value={metrics?.reports ?? 0} />
        <Metric label="异常渠道" value={metrics?.failedChannels ?? 0} tone={metrics?.failedChannels ? "warn" : "ok"} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>竞品分析总览</h3>
        </div>
        <div className="comparison-matrix">
          <table>
            <thead>
              <tr>
                <th>对比项</th>
                {comparison.columns.map((column, index) => (
                  <th key={column.id} className={index === 0 ? "own-col" : undefined}>
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.rows.map((row) => (
                <tr key={row.key}>
                  <th>{row.label}</th>
                  {comparison.columns.map((column, index) => (
                    <td key={`${row.key}-${column.id}`} className={index === 0 ? "own-col" : undefined}>
                      {column.values[row.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>分模块竞品分析</h3>
          <small>增长 / 流量 / 社媒 / 产品表现 / AI 洞察</small>
        </div>
        {moduleColumns.length === 0 ? (
          <EmptyState title="暂无分析对象" text="先创建自有 App 并添加竞品后，再执行采集和分析。" />
        ) : (
          <div className="module-analysis-table">
            <table>
              <thead>
                <tr>
                  <th>模块</th>
                  {moduleColumns.map((column) => (
                    <th key={column.id} className={column.isOwn ? "own-col" : undefined}>
                      {column.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {moduleAnalysisTypes.map((moduleType) => (
                  <tr key={moduleType}>
                    <th>{moduleAnalysisLabels[moduleType]}</th>
                    {moduleColumns.map((column) => {
                      const analysis = column.competitor
                        ? competitorModuleAnalysisFor(data, column.competitor, moduleType)
                        : ownModuleAnalysisFor(data, moduleType);
                      return (
                        <td key={`${moduleType}-${column.id}`} className={column.isOwn ? "own-col" : undefined}>
                          <div className="module-cell">
                            <strong>{analysis.summary}</strong>
                            <small>信号：{moduleListText(analysis.signals)}</small>
                            <small>建议：{analysis.recommendation}</small>
                            <small>
                              {analysis.source === "structured" ? "结构化分析" : "待补证据判断"} · 置信度 {Math.round(analysis.confidence * 100)}% ·{" "}
                              {analysis.dataCoverage.join("、") || "待补覆盖"}
                            </small>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>最新洞察</h3>
        </div>
        <div className="item-list">
          {data.state.insights.length === 0 ? (
            <EmptyState title="暂无洞察" text="先执行采集和分析，系统会生成带证据的评论洞察。" />
          ) : (
            data.state.insights.slice(0, 4).map((insight) => <InsightCard key={insight.id} data={data} insight={insight} compact />)
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>后台任务</h3>
        </div>
        <div className="job-list">
          {jobs.length === 0 ? (
            <EmptyState title="暂无任务" text="点击顶部采集、分析或周报按钮启动任务。" />
          ) : (
            jobs.map((job) => (
              <div className="job-row" key={job.id}>
                <span>{job.type}</span>
                <strong>{statusLabel(job.state)}</strong>
                <progress value={job.progress} max={100} />
                <small>{job.userMessage}</small>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>最新周报</h3>
          {latestReport ? (
            <button className="ghost" onClick={() => downloadMarkdown(latestReport)}>
              <Download size={16} />
              下载
            </button>
          ) : null}
        </div>
        <pre className="markdown-preview">{latestReport?.markdown ?? "暂无周报。生成后会显示 Markdown 预览。"}</pre>
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div className={`metric ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DeepReviewLabView({ data, latestReport }: { data: ApiStateResponse; latestReport?: Report }) {
  const details = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const features = normalizeFeatures(data.state.features);
  const priorityRows = buildFeaturePriorityDetails(data);
  const [selectedFeatureId, setSelectedFeatureId] = useState(priorityRows[0]?.feature.id ?? features[0]?.id ?? details[0]?.featureId ?? "");
  const selectedFeature =
    features.find((feature) => feature.id === selectedFeatureId) ??
    priorityRows[0]?.feature ??
    features[0] ??
    (details[0]
      ? ({
          id: details[0].featureId,
          ownedAppId: details[0].ownedAppId,
          name: details[0].featureName,
          category: details[0].category,
          currentAppSupport: details[0].currentAppSupport,
          competitorSupport: Object.fromEntries(details[0].competitorDetails.map((detail) => [detail.competitorId, detail.support])),
          demandScore: details[0].demandScore,
          source: "user_confirmed",
          updatedAt: new Date().toISOString()
        } satisfies Feature)
      : undefined);
  const selectedDetail = selectedFeature ? details.find((detail) => detail.featureId === selectedFeature.id) : undefined;
  const flowCells = selectedFeature ? buildFeatureFlowCells(data, selectedFeature) : [];
  const prdMarkdown = selectedFeature ? featureFlowPrdMarkdown(data, selectedFeature, selectedDetail, flowCells) : "";
  const testResults = selectedFeature ? buildStandardTestResults(data, selectedFeature) : [];
  const paymentRows = buildPaymentExperienceRows(data);
  const crossChecks = selectedFeature ? buildReviewDeviceCrossChecks(data, selectedFeature) : [];
  const ownBehaviorSignals = selectedFeature ? buildOwnBehaviorIntegrationSignals(selectedFeature) : [];
  const battleReport = buildVersionBattleReport(data);
  const storeSignals = data.state.currentOwnedApp ? buildStoreMetadataSignals(data.state, data.state.currentOwnedApp.id).slice(0, 8) : [];
  const strategyInferences = buildStrategicInferences(data).slice(0, 6);
  const qaQuestions = [
    `${data.state.currentOwnedApp?.name ?? "B612"} 下个版本最该补什么？`,
    "轻颜比 B612 强在哪里？",
    "哪些功能不建议抄？"
  ];
  const qaAnswers = qaQuestions.map((question) => buildKnowledgeAnswer(data, question, "all", "all"));
  const selectedPriority = selectedFeature ? priorityRows.find((row) => row.feature.id === selectedFeature.id) : undefined;

  useEffect(() => {
    if (selectedFeatureId || priorityRows.length === 0) {
      return;
    }
    setSelectedFeatureId(priorityRows[0].feature.id);
  }, [priorityRows, selectedFeatureId]);

  if (!selectedFeature) {
    return <EmptyState title="暂无深度评审数据" text="先执行分析，生成 Feature Matrix、Evidence 和竞品快照后再使用深度评审。" />;
  }

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="链路对象" value={flowCells.length} />
        <Metric label="PRD 证据" value={uniqueValues(flowCells.flatMap((cell) => cell.evidenceIds)).length} />
        <Metric label="测试素材" value={standardTestAssets.length} />
        <Metric label="优先级分" value={selectedPriority?.totalScore ?? 0} tone={(selectedPriority?.totalScore ?? 0) >= 75 ? "warn" : "ok"} />
        <Metric label="交叉验证" value={crossChecks.length} />
        <Metric label="战报证据" value={battleReport.evidenceIds.length} />
      </section>

      <section className="panel wide deep-review-hero">
        <div>
          <span className={`score-pill ${persuasivenessTone(selectedPriority?.totalScore ?? 0)}`}>
            {selectedPriority?.nextVersionAdvice ?? "待评分"}
          </span>
          <h3>{selectedFeature.name} 深度评审</h3>
          <p>以同一个功能为中心，连续查看链路对比、PRD、标准素材横评、优先级、截图回放、付费体验、评论交叉验证和版本战报。</p>
        </div>
        <div className="button-row compact-actions">
          <select className="inline-select" value={selectedFeature.id} onChange={(event) => setSelectedFeatureId(event.target.value)}>
            {priorityRows.map((row) => (
              <option key={row.feature.id} value={row.feature.id}>
                {row.feature.name} / {row.totalScore}
              </option>
            ))}
          </select>
          <button className="secondary" onClick={() => downloadMarkdownContent(prdMarkdown, `prd_${selectedFeature.id}.md`)}>
            <Download size={15} />
            导出 PRD
          </button>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P0 同功能链路对比</h3>
          <small>入口、步数、登录、收费、示例、撤销、保存、失败提示。</small>
        </div>
        <div className="table-wrap deep-flow-table">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>入口位置</th>
                <th>点击步数</th>
                <th>登录</th>
                <th>付费 / 积分</th>
                <th>示例</th>
                <th>撤销</th>
                <th>保存</th>
                <th>失败提示</th>
                <th>链路分</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {flowCells.map((cell) => (
                <tr key={cell.ownerId}>
                  <td>
                    <strong>{cell.ownerName}</strong>
                    <small>{supportLabel(cell.support)} / {cell.verdict}</small>
                  </td>
                  <td>{cell.entryPosition}</td>
                  <td>{cell.clickSteps > 0 ? `${cell.clickSteps} 步` : "待验证"}</td>
                  <td>{cell.loginRequired}</td>
                  <td>{cell.paymentRule}</td>
                  <td>{cell.hasExample}</td>
                  <td>{cell.undoSupport}</td>
                  <td>{cell.saveExport}</td>
                  <td>{cell.failurePrompt}</td>
                  <td>
                    <span className={`score-pill ${persuasivenessTone(cell.score)}`}>{cell.score}</span>
                  </td>
                  <td className="evidence-cell">
                    <EvidenceList data={data} evidenceIds={cell.evidenceIds.slice(0, 3)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide deep-review-two-col">
        <div>
          <div className="panel-heading nested-heading">
            <h3>功能差距 PRD 自动生成</h3>
            <small>背景、竞品证据、用户场景、MVP、草图说明、埋点、验收、风险。</small>
          </div>
          <pre className="decision-prd-preview deep-prd-preview">{prdMarkdown}</pre>
        </div>
        <div>
          <div className="panel-heading nested-heading">
            <h3>功能优先级评分</h3>
            <small>下个版本建议做什么。</small>
          </div>
          <div className="deep-score-grid">
            {selectedPriority
              ? [
                  ["用户价值", selectedPriority.userValue],
                  ["竞品覆盖", selectedPriority.competitorCoverage],
                  ["B612 差距", selectedPriority.appGap],
                  ["研发成本", selectedPriority.engineeringCost],
                  ["商业化潜力", selectedPriority.monetizationPotential],
                  ["证据强度", selectedPriority.evidenceStrength]
                ].map(([label, value]) => (
                  <article key={String(label)}>
                    <strong>{label}</strong>
                    <span className={`score-pill ${persuasivenessTone(Number(value))}`}>{value}</span>
                  </article>
                ))
              : null}
          </div>
          <div className="task-section">
            <strong>建议</strong>
            <small>{selectedPriority?.nextVersionAdvice ?? "待补功能评分"}</small>
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P0 标准测试素材库</h3>
          <small>同一组人像、夜景、路人背景、商品图、证件照、多人合照横向评测。</small>
        </div>
        <div className="standard-asset-grid">
          {standardTestAssets.map((asset) => (
            <article className="standard-asset-card" key={asset.id}>
              <div className="decision-card-top">
                <strong>{asset.name}</strong>
                <span className="tag">{asset.id}</span>
              </div>
              <p>{asset.scenario}</p>
              <small>{asset.imageBrief}</small>
              <div className="action-chip-grid">
                {asset.checks.map((check) => (
                  <span key={check}>{check}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="table-wrap deep-test-table">
          <table>
            <thead>
              <tr>
                <th>素材</th>
                <th>对象</th>
                <th>AI 效果</th>
                <th>耗时</th>
                <th>付费</th>
                <th>导出质量</th>
                <th>失败风险</th>
                <th>结论</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result) => (
                <tr key={`${result.assetId}-${result.ownerName}`}>
                  <td>{standardTestAssets.find((asset) => asset.id === result.assetId)?.name}</td>
                  <td>{result.ownerName}</td>
                  <td>
                    <span className={`score-pill ${persuasivenessTone(result.effectScore)}`}>{result.effectScore}</span>
                  </td>
                  <td>{result.latencyText}</td>
                  <td>{result.paymentText}</td>
                  <td>{result.exportQuality}</td>
                  <td>{result.failureRisk}</td>
                  <td>{result.verdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P1 截图链路回放</h3>
          <small>首页 → AI 页 → 工具页 → 付费弹层 → 结果页。</small>
        </div>
        <div className="flow-replay-grid">
          {flowCells.map((cell) => (
            <article className="flow-replay-card" key={`replay-${cell.ownerId}`}>
              <div className="decision-card-top">
                <strong>{cell.ownerName}</strong>
                <span className={`score-pill ${persuasivenessTone(cell.score)}`}>{cell.score}</span>
              </div>
              <div className="flow-step-strip">
                {["首页", "AI 页", "工具页", "付费弹层", "结果页"].map((step, index) => (
                  <span key={step} className={index < Math.max(1, Math.min(5, cell.clickSteps)) ? "active" : ""}>
                    {step}
                  </span>
                ))}
              </div>
              {cell.screenshots.length > 0 ? <ScreenshotStrip ownerName={cell.ownerName} screenshots={cell.screenshots.slice(0, 5)} /> : <div className="evidence-list empty">缺截图链路，需要补真机回放。</div>}
              <small>{cell.entryPosition}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P1 付费 / 积分体验对比</h3>
          <small>B612 Credit、美图美豆、会员权益、额度、消耗、退款、失败补偿。</small>
        </div>
        <div className="table-wrap payment-table">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>入口</th>
                <th>价格</th>
                <th>积分 / 权益名</th>
                <th>额度</th>
                <th>消耗</th>
                <th>退款 / 失败补偿</th>
                <th>清晰度</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {paymentRows.map((row) => (
                <tr key={row.ownerName}>
                  <td><strong>{row.ownerName}</strong></td>
                  <td>{row.entry}</td>
                  <td>{row.price}</td>
                  <td>{row.creditName}</td>
                  <td>{row.quota}</td>
                  <td>{row.consumption}</td>
                  <td>
                    <p className="table-copy">{row.refund}</p>
                    <small>{row.failureCompensation}</small>
                  </td>
                  <td><span className={`score-pill ${persuasivenessTone(row.clarityScore)}`}>{row.clarityScore}</span></td>
                  <td className="evidence-cell"><EvidenceList data={data} evidenceIds={row.evidenceIds.slice(0, 3)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P1 评论 + 真机证据交叉验证</h3>
          <small>把“AI 太贵”“夜景糊”“导出收费”等评论关联到截图或弹层证据。</small>
        </div>
        <div className="table-wrap cross-check-table">
          <table>
            <thead>
              <tr>
                <th>主题</th>
                <th>用户原话</th>
                <th>真机 / 截图证据</th>
                <th>关联功能</th>
                <th>结论</th>
                <th>风险</th>
                <th>动作</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {crossChecks.map((check) => (
                <tr key={check.id}>
                  <td>{check.topic}</td>
                  <td>{check.userQuote}</td>
                  <td>{check.deviceEvidence}</td>
                  <td>{check.linkedFeature}</td>
                  <td>{check.conclusion}</td>
                  <td><span className={`severity ${check.risk}`}>{impactLabel(check.risk)}</span></td>
                  <td>{check.action}</td>
                  <td className="evidence-cell"><EvidenceList data={data} evidenceIds={check.evidenceIds.slice(0, 3)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide deep-review-two-col">
        <div>
          <div className="panel-heading nested-heading">
            <h3>P1 ASO / 商店素材变化</h3>
            <small>标题、截图、版本说明、关键词和排名接入边界。</small>
          </div>
          <div className="report-plan-list">
            {storeSignals.length === 0 ? (
              <EmptyState title="暂无商店素材变化" text="先补快照、截图、描述或版本说明。" />
            ) : (
              storeSignals.map((signal) => (
                <article key={signal.id}>
                  <div className="decision-card-top">
                    <strong>{signal.ownerName} / {metadataFieldLabel(signal.field)}</strong>
                    <span className="tag">{signal.channelName}</span>
                  </div>
                  <p>{signal.afterValue}</p>
                  <small>关键词：{signal.keywordHints.join("、") || "待补"} / Evidence {signal.evidenceIds.length}</small>
                </article>
              ))
            )}
          </div>
        </div>
        <div>
          <div className="panel-heading nested-heading">
            <h3>P1 竞品策略变化说明</h3>
            <small>判断竞品最近押 AI 写真、修图工具、会员、社区内容、商业设计还是相机美颜。</small>
          </div>
          <div className="report-strategy-list">
            {strategyInferences.map((strategy) => (
              <article key={strategy.id}>
                <div className="decision-card-top">
                  <strong>{strategy.ownerName} / {strategy.themeLabel}</strong>
                  <span className={`score-pill ${persuasivenessTone(strategy.confidence)}`}>{strategy.confidence}</span>
                </div>
                <p>{strategy.hypothesis}</p>
                <small>{strategyStageLabel(strategy.stage)} / {strategy.recommendation}</small>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>P2 自有 App 行为数据接入</h3>
          <small>竞品有这个功能之后，验证我们用户是否真的需要、漏斗哪里掉。</small>
        </div>
        <div className="behavior-signal-grid">
          {ownBehaviorSignals.map((signal) => (
            <article className="decision-card" key={signal.id}>
              <div className="decision-card-top">
                <strong>{signal.eventName}</strong>
                <span className={`score-pill ${signal.currentStatus === "defined" ? "high" : signal.currentStatus === "needs_backend" ? "medium" : "low"}`}>
                  {signal.currentStatus === "defined" ? "已定义" : signal.currentStatus === "needs_backend" ? "待研发接入" : "待补"}
                </span>
              </div>
              <p>{signal.question}</p>
              <small>{signal.funnelDropHypothesis}</small>
              <div className="integration-payload">
                {signal.dataNeeded.map((field) => (
                  <code key={field}>{field}</code>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide deep-review-two-col">
        <div>
          <div className="panel-heading nested-heading">
            <h3>P2 AI 竞品问答助手</h3>
            <small>回答必须带证据和报告引用。</small>
          </div>
          <div className="report-plan-list">
            {qaAnswers.map((answer) => (
              <article key={answer.question}>
                <div className="decision-card-top">
                  <strong>{answer.question}</strong>
                  <span className={`score-pill ${persuasivenessTone(answer.confidence)}`}>{answer.confidence}</span>
                </div>
                <p>{answer.answer}</p>
                <small>证据 {answer.evidenceHits.length} / 缺口 {answer.missingEvidence.length}</small>
                <EvidenceList data={data} evidenceIds={answer.evidenceHits.slice(0, 3).map((hit) => hit.record.id)} />
              </article>
            ))}
          </div>
        </div>
        <div>
          <div className="panel-heading nested-heading">
            <h3>P2 版本级竞品战报</h3>
            <button className="secondary" onClick={() => downloadMarkdownContent(battleReport.markdown, `version_battle_${data.state.currentOwnedApp?.id ?? "app"}.md`)}>
              <Download size={15} />
              导出战报
            </button>
          </div>
          <div className="report-summary-card">
            <h4>{battleReport.title}</h4>
            <div className="report-summary-list">
              {battleReport.summary.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
          <pre className="decision-prd-preview deep-prd-preview">{battleReport.markdown}</pre>
        </div>
      </section>
    </div>
  );
}

function PriorityImplementationView({ data, latestReport }: { data: ApiStateResponse; latestReport?: Report }) {
  const sections = useMemo(() => buildPriorityImplementationSections(data, latestReport), [data, latestReport]);
  const p0 = sections.find((section) => section.priority === "P0");
  const p1 = sections.find((section) => section.priority === "P1");
  const p2 = sections.find((section) => section.priority === "P2");
  const totalEvidence = uniqueValues(sections.flatMap((section) => section.evidenceIds)).length;
  const blockerCount = sections.reduce((sum, section) => sum + section.blockers.length, 0);
  const averageScore = sections.length ? Math.round(sections.reduce((sum, section) => sum + section.score, 0) / sections.length) : 0;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="P0 分" value={p0?.score ?? 0} tone={(p0?.score ?? 0) >= 70 ? "ok" : "warn"} />
        <Metric label="P1 分" value={p1?.score ?? 0} tone={(p1?.score ?? 0) >= 60 ? "ok" : "warn"} />
        <Metric label="P2 分" value={p2?.score ?? 0} tone={(p2?.score ?? 0) >= 50 ? "ok" : "warn"} />
        <Metric label="平均成熟度" value={averageScore} />
        <Metric label="证据引用" value={totalEvidence} />
        <Metric label="阻塞项" value={blockerCount} tone={blockerCount ? "warn" : "ok"} />
      </section>

      <section className="panel wide priority-implementation-hero">
        <div>
          <span className={`score-pill ${persuasivenessTone(averageScore)}`}>实施成熟度 {averageScore}</span>
          <h3>P0 / P1 / P2 实施蓝图</h3>
          <p>把产品决策、市场情报和外部数据接入分层管理，明确哪些可以直接进入评审，哪些还只是待补证据或待接入数据源。</p>
        </div>
        <button
          className="secondary"
          onClick={() => downloadMarkdownContent(priorityImplementationMarkdown(sections), `priority_implementation_${data.state.currentOwnedApp?.id ?? "app"}.md`)}
        >
          <Download size={15} />
          导出蓝图
        </button>
      </section>

      <section className="panel wide priority-implementation-grid">
        {sections.map((section) => (
          <article className="priority-implementation-card" key={section.priority}>
            <div className="decision-card-top">
              <span className={`priority priority-${section.priority.toLowerCase()}`}>{section.priority}</span>
              <span className={`score-pill ${priorityImplementationStatusTone(section.status)}`}>{priorityImplementationStatusLabel(section.status)}</span>
            </div>
            <h4>{section.title}</h4>
            <p>{section.summary}</p>
            <div className="priority-progress">
              <span style={{ width: `${Math.max(8, section.score)}%` }} />
            </div>
            <div className="decision-meta">
              <span>{recommendationOwnerLabel(section.owner)}</span>
              <span>分数 {section.score}</span>
              <span>Evidence {section.evidenceIds.length}</span>
            </div>
            <div className="card-divider" />
            <strong>核心页面</strong>
            <div className="action-chip-grid">
              {section.coreViews.map((view) => (
                <span key={view}>{view}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="panel wide priority-two-col">
        <div>
          <div className="panel-heading nested-heading">
            <h3>阻塞项</h3>
            <small>{blockerCount} 条</small>
          </div>
          {blockerCount === 0 ? (
            <div className="evidence-list empty">当前没有关键阻塞，继续按周报和评审节奏推进。</div>
          ) : (
            <div className="impact-action-list warning">
              {sections.flatMap((section) => section.blockers.map((blocker) => `${section.priority}：${blocker}`)).map((blocker) => (
                <span key={blocker}>{blocker}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="panel-heading nested-heading">
            <h3>下一步动作</h3>
            <small>按优先级执行</small>
          </div>
          <div className="impact-action-list">
            {sections.flatMap((section) => section.nextActions.map((action) => `${section.priority}：${action}`)).map((action) => (
              <span key={action}>{action}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>验收口径</h3>
          <small>避免 P0/P1/P2 变成泛化愿望清单</small>
        </div>
        <div className="table-wrap compact-table">
          <table>
            <thead>
              <tr>
                <th>优先级</th>
                <th>验收要求</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr key={`acceptance-${section.priority}`}>
                  <td>
                    <span className={`priority priority-${section.priority.toLowerCase()}`}>{section.priority}</span>
                  </td>
                  <td>
                    <ul className="mini-list">
                      {section.acceptance.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="evidence-cell">
                    <EvidenceList data={data} evidenceIds={section.evidenceIds.slice(0, 5)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MarketMetricsView({ data }: { data: ApiStateResponse }) {
  const rows = buildMarketMetricRows(data);
  const availableCount = rows.filter((row) => row.dataStatus === "available").length;
  const missingCount = rows.filter((row) => row.dataStatus === "missing").length;
  const averageProxy = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.proxyScore, 0) / rows.length) : 0;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="对象" value={rows.length} />
        <Metric label="已有代理指标" value={availableCount} tone={availableCount ? "ok" : "warn"} />
        <Metric label="缺数据源" value={missingCount} tone={missingCount ? "warn" : "ok"} />
        <Metric label="平均代理分" value={averageProxy} />
        <Metric label="价格样本" value={rows.filter((row) => !row.priceText.includes("待补")).length} />
        <Metric label="证据引用" value={uniqueValues(rows.flatMap((row) => row.evidenceIds)).length} />
      </section>

      <section className="panel wide priority-implementation-hero">
        <div>
          <span className="score-pill medium">P2 外部数据</span>
          <h3>市场指标工作台</h3>
          <p>当前先用公开评分、评论数、价格和渠道覆盖作为代理指标；下载、收入、排名、DAU、留存和市场份额需要第三方或内部授权数据源。</p>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>市场表现代理指标</h3>
          <small>不把代理指标当成真实下载 / 收入事实</small>
        </div>
        <div className="table-wrap market-metrics-table">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>状态</th>
                <th>代理分</th>
                <th>评分 / 评论</th>
                <th>价格会员</th>
                <th>渠道覆盖</th>
                <th>PM 用途</th>
                <th>下一步数据</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.ownerName}</strong>
                    <small>{row.priority}</small>
                  </td>
                  <td>
                    <span className={`score-pill ${row.dataStatus === "available" ? "high" : row.dataStatus === "manual" ? "medium" : "low"}`}>
                      {marketMetricDataStatusLabel(row.dataStatus)}
                    </span>
                  </td>
                  <td>
                    <span className={`score-pill ${persuasivenessTone(row.proxyScore)}`}>{row.proxyScore}</span>
                    <small>{row.limitation}</small>
                  </td>
                  <td>
                    <strong>{row.rating ? `${row.rating.toFixed(1)} 分` : "待补评分"}</strong>
                    <small>{row.reviewCount.toLocaleString()} 条评论 / 评论样本</small>
                  </td>
                  <td>{row.priceText}</td>
                  <td>{row.channelCoverage}</td>
                  <td>
                    <p className="table-copy">{row.pmUse}</p>
                  </td>
                  <td>
                    <p className="table-copy">{row.nextData}</p>
                  </td>
                  <td className="evidence-cell">
                    <EvidenceList data={data} evidenceIds={row.evidenceIds.slice(0, 4)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CreativeAdIntelligenceView({ data }: { data: ApiStateResponse }) {
  const signals = buildCreativeAdSignals(data);
  const evidenceCount = signals.filter((signal) => signal.status === "evidence").length;
  const missingCount = signals.filter((signal) => signal.status === "missing").length;
  const themes = uniqueValues(signals.map((signal) => signal.theme));

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="素材信号" value={signals.length} />
        <Metric label="有证据" value={evidenceCount} tone={evidenceCount ? "ok" : "warn"} />
        <Metric label="待补素材" value={missingCount} tone={missingCount ? "warn" : "ok"} />
        <Metric label="主题" value={themes.length} />
        <Metric label="社媒样本" value={data.state.socialSamples.length} />
        <Metric label="证据引用" value={uniqueValues(signals.flatMap((signal) => signal.evidenceIds)).length} />
      </section>

      <section className="panel wide priority-implementation-hero">
        <div>
          <span className="score-pill medium">P2 广告素材</span>
          <h3>广告素材与创意情报</h3>
          <p>把社媒样本、商店截图和发布信号整理成创意方向；真实广告投放、关键词、SOV 和素材曝光需要外部广告库接入。</p>
        </div>
      </section>

      <section className="panel wide creative-theme-grid">
        {themes.map((theme) => {
          const themeSignals = signals.filter((signal) => signal.theme === theme);
          const topSignal = themeSignals[0];
          return (
            <article className="priority-implementation-card" key={theme}>
              <div className="decision-card-top">
                <strong>{theme}</strong>
                <span className={`score-pill ${persuasivenessTone(topSignal?.confidence ?? 0)}`}>{themeSignals.length} 条</span>
              </div>
              <p>{topSignal?.angle ?? "待补素材样本"}</p>
              <small>{creativeActionForTheme(theme)}</small>
            </article>
          );
        })}
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>素材信号列表</h3>
          <small>{signals.length} 条</small>
        </div>
        <div className="table-wrap market-metrics-table">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>主题</th>
                <th>来源</th>
                <th>状态</th>
                <th>创意角度</th>
                <th>缺口</th>
                <th>产品动作</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((signal) => (
                <tr key={signal.id}>
                  <td>
                    <strong>{signal.ownerName}</strong>
                    <small>置信度 {signal.confidence}</small>
                  </td>
                  <td>{signal.theme}</td>
                  <td>{signal.source}</td>
                  <td>
                    <span className={`score-pill ${signal.status === "evidence" ? "high" : signal.status === "candidate" ? "medium" : "low"}`}>
                      {creativeStatusLabel(signal.status)}
                    </span>
                  </td>
                  <td>
                    <p className="table-copy">{signal.angle}</p>
                  </td>
                  <td>
                    <p className="table-copy">{signal.gap}</p>
                  </td>
                  <td>
                    <p className="table-copy">{signal.pmAction}</p>
                  </td>
                  <td className="evidence-cell">
                    <EvidenceList data={data} evidenceIds={signal.evidenceIds.slice(0, 4)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function AudienceSdkIntelligenceView({ data }: { data: ApiStateResponse }) {
  const signals = buildAudienceSdkSignals(data);
  const supportedCount = signals.filter((signal) => signal.currentStatus === "supported" || signal.currentStatus === "partial").length;
  const sourceNeededCount = signals.filter((signal) => signal.currentStatus === "needs_source").length;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="信号" value={signals.length} />
        <Metric label="可参考" value={supportedCount} tone={supportedCount ? "ok" : "warn"} />
        <Metric label="待数据源" value={sourceNeededCount} tone={sourceNeededCount ? "warn" : "ok"} />
        <Metric label="SDK / 技术" value={signals.filter((signal) => signal.category === "sdk").length} />
        <Metric label="受众 / 留存" value={signals.filter((signal) => signal.category === "audience" || signal.category === "retention").length} />
        <Metric label="证据引用" value={uniqueValues(signals.flatMap((signal) => signal.evidenceIds)).length} />
      </section>

      <section className="panel wide priority-implementation-hero">
        <div>
          <span className="score-pill medium">P2 受众 / SDK</span>
          <h3>受众与技术栈情报</h3>
          <p>把评论、战略推测和功能模型转成受众、留存、SDK、支付、AI、隐私和研发依赖问题；真实用户画像、用户重叠和 SDK 检测需合法外部数据源。</p>
        </div>
      </section>

      <section className="panel wide audience-signal-grid">
        {signals.length === 0 ? (
          <EmptyState title="暂无受众或 SDK 信号" text="先执行采集和分析，或补评论、功能和战略证据。" />
        ) : (
          signals.map((signal) => (
            <article className="decision-card" key={signal.id}>
              <div className="decision-card-top">
                <span className="tag">{audienceSignalCategoryLabel(signal.category)}</span>
                <span className={`score-pill ${persuasivenessTone(signal.confidence)}`}>{signal.confidence}</span>
              </div>
              <h4>{signal.title}</h4>
              <p>{signal.pmUse}</p>
              <div className="task-section">
                <strong>需要的数据</strong>
                <small>{signal.dataNeeded}</small>
              </div>
              <div className="task-section">
                <strong>风险</strong>
                <small>{signal.risk}</small>
              </div>
              <EvidenceList data={data} evidenceIds={signal.evidenceIds.slice(0, 3)} />
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function IntegrationsView({ data, latestReport }: { data: ApiStateResponse; latestReport?: Report }) {
  const integrations = buildIntegrationCapabilities(data, latestReport);
  const readyCount = integrations.filter((item) => item.status === "ready").length;
  const blockedCount = integrations.filter((item) => item.status === "blocked").length;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="集成项" value={integrations.length} />
        <Metric label="可用" value={readyCount} tone={readyCount ? "ok" : "warn"} />
        <Metric label="待接入" value={blockedCount} tone={blockedCount ? "warn" : "ok"} />
        <Metric label="P0/P1" value={integrations.filter((item) => item.priority !== "P2").length} />
        <Metric label="P2" value={integrations.filter((item) => item.priority === "P2").length} />
        <Metric label="证据引用" value={uniqueValues(integrations.flatMap((item) => item.evidenceIds)).length} />
      </section>

      <section className="panel wide priority-implementation-hero">
        <div>
          <span className="score-pill medium">P1 / P2 集成</span>
          <h3>集成与数据接入设置</h3>
          <p>先把外部系统的触发条件、payload、下游目标和失败处理定义清楚，再接真实 API、Webhook、Jira、飞书、广告库或 SDK 数据。</p>
        </div>
      </section>

      <section className="panel wide integration-grid">
        {integrations.map((item) => (
          <article className="integration-card" key={item.id}>
            <div className="decision-card-top">
              <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
              <span className={`score-pill ${item.status === "ready" ? "high" : item.status === "mocked" ? "medium" : "low"}`}>{integrationStatusLabel(item.status)}</span>
            </div>
            <h4>{item.name}</h4>
            <p>{item.trigger}</p>
            <div className="integration-payload">
              {item.payload.map((field) => (
                <code key={field}>{field}</code>
              ))}
            </div>
            <div className="task-section">
              <strong>下游</strong>
              <small>{item.downstream}</small>
            </div>
            <div className="task-section">
              <strong>下一步</strong>
              <small>{item.nextStep}</small>
            </div>
            <EvidenceList data={data} evidenceIds={item.evidenceIds.slice(0, 3)} />
          </article>
        ))}
      </section>
    </div>
  );
}

function OpportunityRadarView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const recommendations = actionRecommendationsFor(data);
  const scoredRecommendations = recommendations.map((recommendation) => ({
    recommendation,
    persuasivenessScore: recommendationPersuasiveness(recommendation)
  }));
  const scoreByRecommendationId = new Map(scoredRecommendations.map((item) => [item.recommendation.id, item.persuasivenessScore]));
  const persistedRecommendationIds = new Set((data.state.actionRecommendations ?? []).map((recommendation) => recommendation.id));
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const normalizedQuery = query.trim().toLowerCase();
  const ownerOptions = uniqueValues(recommendations.map((recommendation) => recommendation.ownerRole));
  const areaOptions = uniqueValues(recommendations.map((recommendation) => recommendation.area));
  const priorityOptionsForRecommendations = uniqueValues(recommendations.map((recommendation) => recommendation.priorityHint));
  const statusOptions = uniqueValues(recommendations.map((recommendation) => recommendation.status));
  const filteredRecommendations = recommendations.filter((recommendation) => {
    const searchable = [
      recommendation.title,
      recommendation.problem,
      recommendation.whyNow,
      recommendation.recommendation,
      recommendation.implementationHint,
      recommendation.successMetric,
      recommendationCompetitorNames(data, recommendation),
      recommendationFeatureNames(data, recommendation)
    ]
      .join(" ")
      .toLowerCase();
    return (
      (!normalizedQuery || searchable.includes(normalizedQuery)) &&
      (ownerFilter === "all" || recommendation.ownerRole === ownerFilter) &&
      (areaFilter === "all" || recommendation.area === areaFilter) &&
      (priorityFilter === "all" || recommendation.priorityHint === priorityFilter) &&
      (statusFilter === "all" || recommendation.status === statusFilter)
    );
  });
  const topDecisionRecommendations = filteredRecommendations
    .map((recommendation) => ({ recommendation, persuasivenessScore: scoreByRecommendationId.get(recommendation.id) ?? 0 }))
    .sort((left, right) => right.persuasivenessScore - left.persuasivenessScore)
    .slice(0, 4);
  const productCount = recommendations.filter((recommendation) => recommendation.ownerRole === "product").length;
  const engineeringCount = recommendations.filter((recommendation) => recommendation.ownerRole === "engineering").length;
  const evidenceBacked = recommendations.filter((recommendation) => recommendation.evidenceIds.length > 0).length;
  const highImpact = recommendations.filter((recommendation) => recommendation.impactScore >= 80).length;
  const highPersuasiveness = scoredRecommendations.filter((item) => item.persuasivenessScore >= 80).length;
  const averagePersuasiveness =
    scoredRecommendations.length === 0
      ? 0
      : Math.round(scoredRecommendations.reduce((sum, item) => sum + item.persuasivenessScore, 0) / scoredRecommendations.length);

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="建议总数" value={recommendations.length} />
        <Metric label="高影响" value={highImpact} tone={highImpact ? "warn" : "ok"} />
        <Metric label="高说服力" value={highPersuasiveness} tone={highPersuasiveness ? "warn" : "ok"} />
        <Metric label="平均说服力" value={averagePersuasiveness} />
        <Metric label="P0" value={recommendations.filter((recommendation) => recommendation.priorityHint === "P0").length} tone="warn" />
        <Metric label="产品负责" value={productCount} />
        <Metric label="研发负责" value={engineeringCount} />
        <Metric label="带证据" value={evidenceBacked} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>机会筛选</h3>
          <small>按负责人、模块、优先级、状态定位下一步</small>
        </div>
        <div className="filter-bar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索建议、竞品、功能、研发提示" />
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部负责人</option>
            {ownerOptions.map((role) => (
              <option key={role} value={role}>
                {recommendationOwnerLabel(role as ActionRecommendation["ownerRole"])}
              </option>
            ))}
          </select>
          <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)}>
            <option value="all">全部模块</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {recommendationAreaLabel(area as ActionRecommendation["area"])}
              </option>
            ))}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">全部优先级</option>
            {priorityOptionsForRecommendations.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>高说服力任务卡</h3>
          <small>优先看能解释“为什么做、怎么做、怎么验证”的建议</small>
        </div>
        {topDecisionRecommendations.length === 0 ? (
          <EmptyState title="暂无高说服力任务" text="调整筛选条件，或先执行分析补齐证据。" />
        ) : (
          <div className="decision-card-grid">
            {topDecisionRecommendations.map(({ recommendation, persuasivenessScore }) => (
              <article className="decision-card spotlight-card" key={recommendation.id}>
                <div className="decision-card-top">
                  <span className={`priority priority-${recommendation.priorityHint.toLowerCase()}`}>{recommendation.priorityHint}</span>
                  <span className={`score-pill ${persuasivenessTone(persuasivenessScore)}`}>说服力 {persuasivenessScore}</span>
                </div>
                <h4>{recommendation.title}</h4>
                <p>{recommendation.whyNow}</p>
                <div className="decision-meta">
                  <span>{recommendationAreaLabel(recommendation.area)}</span>
                  <span>{recommendationOwnerLabel(recommendation.ownerRole)}</span>
                  <span>证据 {recommendation.evidenceIds.length}</span>
                </div>
                <div className="card-divider" />
                <small>不照搬：{recommendationWhyNotCopy(recommendation)}</small>
                <small>MVP：{recommendationMvpScope(recommendation)}</small>
                <small>验证：{recommendation.successMetric}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>行动建议表</h3>
          <small>{filteredRecommendations.length} 条</small>
        </div>
        {filteredRecommendations.length === 0 ? (
          <EmptyState title="暂无行动建议" text="先执行采集和分析，系统会从功能差距、模块分析和评论洞察生成建议。" />
        ) : (
          <div className="table-wrap opportunity-table">
            <table>
              <thead>
                <tr>
                  <th>优先级</th>
                  <th>说服力</th>
                  <th>建议</th>
                  <th>对象</th>
                  <th>为什么现在</th>
                  <th>产品动作</th>
                  <th>研发提示</th>
                  <th>成功指标</th>
                  <th>证据</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecommendations.map((recommendation) => (
                  <tr key={recommendation.id}>
                    <td>
                      <span className={`priority priority-${recommendation.priorityHint.toLowerCase()}`}>{recommendation.priorityHint}</span>
                      <small>影响 {recommendation.impactScore}</small>
                      <small>成本 {effortLabel(recommendation.effort)}</small>
                    </td>
                    <td>
                      <span className={`score-pill ${persuasivenessTone(scoreByRecommendationId.get(recommendation.id) ?? 0)}`}>
                        {scoreByRecommendationId.get(recommendation.id) ?? 0}
                      </span>
                      <small>{recommendationWhyNotCopy(recommendation)}</small>
                    </td>
                    <td>
                      <strong>{recommendation.title}</strong>
                      <small>
                        {recommendationAreaLabel(recommendation.area)} / {recommendationActionLabel(recommendation.actionType)} /{" "}
                        {recommendationOwnerLabel(recommendation.ownerRole)}
                      </small>
                      <small>
                        置信度 {Math.round(recommendation.confidence * 100)}% / {statusLabel(recommendation.status)}
                      </small>
                    </td>
                    <td>
                      <strong>{recommendationCompetitorNames(data, recommendation)}</strong>
                      <small>{recommendationFeatureNames(data, recommendation)}</small>
                    </td>
                    <td>
                      <p className="table-copy">{recommendation.whyNow}</p>
                      <small>{recommendation.problem}</small>
                    </td>
                    <td>
                      <p className="table-copy">{recommendation.recommendation}</p>
                    </td>
                    <td>
                      <p className="table-copy">{recommendation.implementationHint}</p>
                    </td>
                    <td>
                      <p className="table-copy">{recommendation.successMetric}</p>
                    </td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={recommendation.evidenceIds.slice(0, 4)} />
                    </td>
                    <td>
                      {persistedRecommendationIds.has(recommendation.id) ? (
                        <div className="button-row compact-actions">
                          <button
                            className="secondary"
                            data-testid={`recommendation-to-requirement-${recommendation.id}`}
                            aria-label={`转需求：${recommendation.title}`}
                            onClick={() =>
                              void runAction("convert-recommendation", () =>
                                postJson<ApiStateResponse>("/api/requirements/from-recommendation", {
                                  recommendationId: recommendation.id,
                                  ownedAppId: recommendation.ownedAppId
                                })
                              )
                            }
                          >
                            <Send size={15} />
                            转需求
                          </button>
                          <button
                            className="ghost"
                            onClick={() =>
                              void runAction("plan-recommendation", () =>
                                patchJson<ApiStateResponse>(`/api/action-recommendations/${recommendation.id}`, {
                                  ownedAppId: recommendation.ownedAppId,
                                  status: "Planned"
                                })
                              )
                            }
                          >
                            已计划
                          </button>
                          <button
                            className="primary"
                            onClick={() =>
                              void runAction("accept-recommendation", () =>
                                patchJson<ApiStateResponse>(`/api/action-recommendations/${recommendation.id}`, {
                                  ownedAppId: recommendation.ownedAppId,
                                  status: "Accepted"
                                })
                              )
                            }
                          >
                            采纳
                          </button>
                          <button
                            className="danger"
                            onClick={() =>
                              void runAction("dismiss-recommendation", () =>
                                patchJson<ApiStateResponse>(`/api/action-recommendations/${recommendation.id}`, {
                                  ownedAppId: recommendation.ownedAppId,
                                  status: "Dismissed"
                                })
                              )
                            }
                          >
                            忽略
                          </button>
                        </div>
                      ) : (
                        <small>执行分析后可流转</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TimelineView({ data }: { data: ApiStateResponse }) {
  const events = buildTrendTimeline(data.state, data.state.currentOwnedApp?.id ?? "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const typeOptions = uniqueValues(events.map((event) => event.eventType));
  const impactOptions = uniqueValues(events.map((event) => event.impact));
  const ownerOptions = uniqueValues(events.map((event) => event.ownerName));
  const filteredEvents = events.filter(
    (event) =>
      (typeFilter === "all" || event.eventType === typeFilter) &&
      (impactFilter === "all" || event.impact === impactFilter) &&
      (ownerFilter === "all" || event.ownerName === ownerFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="事件总数" value={events.length} />
        <Metric label="高影响" value={events.filter((event) => event.impact === "high").length} tone="warn" />
        <Metric label="版本事件" value={events.filter((event) => event.eventType === "version").length} />
        <Metric label="价格事件" value={events.filter((event) => event.eventType === "price").length} />
        <Metric label="洞察事件" value={events.filter((event) => event.eventType === "insight").length} />
        <Metric label="建议事件" value={events.filter((event) => event.eventType === "recommendation").length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>趋势筛选</h3>
          <small>按类型、影响和对象查看最近变化</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {timelineEventLabel(type as CompetitiveTimelineEvent["eventType"])}
              </option>
            ))}
          </select>
          <select value={impactFilter} onChange={(event) => setImpactFilter(event.target.value)}>
            <option value="all">全部影响</option>
            {impactOptions.map((impact) => (
              <option key={impact} value={impact}>
                {impactLabel(impact as CompetitiveTimelineEvent["impact"])}
              </option>
            ))}
          </select>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>趋势时间线</h3>
          <small>{filteredEvents.length} 条</small>
        </div>
        {filteredEvents.length === 0 ? (
          <EmptyState title="暂无趋势事件" text="执行采集和分析后，这里会按时间展示版本、价格、评论、洞察和建议。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>对象</th>
                  <th>标题</th>
                  <th>摘要</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.occurredAt.slice(0, 10)}</td>
                    <td>
                      <span className={`severity ${event.impact}`}>{impactLabel(event.impact)}</span>
                      <small>{timelineEventLabel(event.eventType)}</small>
                      <small>{platformLabel(event.platform)}</small>
                    </td>
                    <td>
                      <strong>{event.ownerName}</strong>
                      <small>{event.channelName ?? "全局"}</small>
                    </td>
                    <td>{event.title}</td>
                    <td>
                      <p className="table-copy">{event.summary}</p>
                    </td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={event.evidenceIds.slice(0, 3)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PricingMonitorView({ data }: { data: ApiStateResponse }) {
  const signals = buildPriceSignals(data.state, data.state.currentOwnedApp?.id ?? "");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [changeFilter, setChangeFilter] = useState("all");
  const filteredSignals = signals.filter(
    (signal) => (platformFilter === "all" || signal.platform === platformFilter) && (changeFilter === "all" || signal.changeType === changeFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="价格样本" value={signals.length} />
        <Metric label="发生变化" value={signals.filter((signal) => signal.changeType === "changed").length} tone="warn" />
        <Metric label="首次记录" value={signals.filter((signal) => signal.changeType === "first_seen").length} />
        <Metric label="iOS" value={signals.filter((signal) => signal.platform === "ios").length} />
        <Metric label="Android" value={signals.filter((signal) => signal.platform === "android").length} />
        <Metric label="含数字价格" value={signals.filter((signal) => signal.numericPrices.length > 0).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>价格筛选</h3>
          <small>iOS / Android 分平台查看会员价格</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
            <option value="all">全部平台</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <select value={changeFilter} onChange={(event) => setChangeFilter(event.target.value)}>
            <option value="all">全部变化</option>
            <option value="first_seen">首次记录</option>
            <option value="changed">发生变化</option>
            <option value="unchanged">未变化</option>
            <option value="missing">缺失</option>
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>价格 / 会员监控</h3>
          <small>{filteredSignals.length} 条</small>
        </div>
        {filteredSignals.length === 0 ? (
          <EmptyState title="暂无价格样本" text="采集快照后会展示会员价格、数字价格和变化状态。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>对象</th>
                  <th>平台 / 渠道</th>
                  <th>变化</th>
                  <th>当前价格</th>
                  <th>数字价格</th>
                  <th>上一条价格</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((signal) => (
                  <tr key={signal.id}>
                    <td>
                      <strong>{signal.ownerName}</strong>
                      <small>{signal.capturedAt.slice(0, 10)}</small>
                    </td>
                    <td>
                      {platformLabel(signal.platform)}
                      <small>{signal.channelName}</small>
                    </td>
                    <td>{priceChangeLabel(signal.changeType)}</td>
                    <td>{signal.priceText}</td>
                    <td>{signal.numericPrices.join("、") || "待解析"}</td>
                    <td>{signal.previousPriceText ?? "无"}</td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={signal.evidenceIds} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function EvidenceDiffView({ data }: { data: ApiStateResponse }) {
  const diffs = buildEvidenceDiffs(data.state, data.state.currentOwnedApp?.id ?? "");
  const [fieldFilter, setFieldFilter] = useState("all");
  const fieldOptions = uniqueValues(diffs.map((diff) => diff.field));
  const filteredDiffs = diffs.filter((diff) => fieldFilter === "all" || diff.field === fieldFilter);

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="Diff 总数" value={diffs.length} />
        <Metric label="价格 Diff" value={diffs.filter((diff) => diff.field === "price").length} />
        <Metric label="版本 Diff" value={diffs.filter((diff) => diff.field === "version").length} />
        <Metric label="截图 Diff" value={diffs.filter((diff) => diff.field === "screenshots").length} />
        <Metric label="描述 Diff" value={diffs.filter((diff) => diff.field === "description").length} />
        <Metric label="证据数" value={uniqueValues(diffs.flatMap((diff) => diff.evidenceIds)).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>Diff 筛选</h3>
          <small>比较同一对象同一渠道的前后快照</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)}>
            <option value="all">全部字段</option>
            {fieldOptions.map((field) => (
              <option key={field} value={field}>
                {diffFieldLabel(field as EvidenceDiff["field"])}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>证据 Diff</h3>
          <small>{filteredDiffs.length} 条</small>
        </div>
        {filteredDiffs.length === 0 ? (
          <EmptyState title="暂无 Diff" text="需要同一对象同一渠道至少两条快照后才能比较。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>对象</th>
                  <th>字段</th>
                  <th>变化前</th>
                  <th>变化后</th>
                  <th>截图</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiffs.map((diff) => (
                  <tr key={diff.id}>
                    <td>
                      <strong>{diff.ownerName}</strong>
                      <small>{platformLabel(diff.platform)} / {diff.channelName} / {diff.changedAt.slice(0, 10)}</small>
                    </td>
                    <td>{diffFieldLabel(diff.field)}</td>
                    <td>
                      <p className="table-copy">{diff.beforeValue}</p>
                    </td>
                    <td>
                      <p className="table-copy">{diff.afterValue}</p>
                    </td>
                    <td>{diff.screenshotUrls.length > 0 ? <ScreenshotStrip ownerName={diff.ownerName} screenshots={diff.screenshotUrls.slice(0, 4)} /> : "无"}</td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={diff.evidenceIds} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AlertsView({ data }: { data: ApiStateResponse }) {
  const alerts = buildCompetitiveAlerts(data.state, data.state.currentOwnedApp?.id ?? "");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const filteredAlerts = alerts.filter(
    (alert) => (severityFilter === "all" || alert.severity === severityFilter) && (typeFilter === "all" || alert.alertType === typeFilter)
  );
  const typeOptions = uniqueValues(alerts.map((alert) => alert.alertType));

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="告警总数" value={alerts.length} />
        <Metric label="高优先" value={alerts.filter((alert) => alert.severity === "high").length} tone="warn" />
        <Metric label="渠道异常" value={alerts.filter((alert) => alert.alertType === "channel_failure").length} />
        <Metric label="价格变化" value={alerts.filter((alert) => alert.alertType === "price_change").length} />
        <Metric label="高危洞察" value={alerts.filter((alert) => alert.alertType === "high_severity_insight").length} />
        <Metric label="高影响建议" value={alerts.filter((alert) => alert.alertType === "high_impact_recommendation").length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>告警筛选</h3>
          <small>优先处理高影响和有证据的变化</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option value="all">全部等级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {alertTypeLabel(type as CompetitiveAlert["alertType"])}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>告警中心</h3>
          <small>{filteredAlerts.length} 条</small>
        </div>
        {filteredAlerts.length === 0 ? (
          <EmptyState title="暂无告警" text="采集、分析或渠道失败后会自动生成告警。" />
        ) : (
          <div className="evidence-grid alert-grid">
            {filteredAlerts.map((alert) => (
              <article className="evidence-item evidence-card" key={alert.id}>
                <div className="evidence-title">
                  <span className={`severity ${alert.severity}`}>{impactLabel(alert.severity)}</span>
                  <span className="tag">{alertTypeLabel(alert.alertType)}</span>
                  <strong>{alert.title}</strong>
                </div>
                <p>{alert.summary}</p>
                <div className="evidence-meta">
                  <span>{alert.ownerName ?? "当前 App"}</span>
                  <span>{alert.createdAt.slice(0, 10)}</span>
                  <span>建议 {alert.recommendationIds.length}</span>
                </div>
                <EvidenceList data={data} evidenceIds={alert.evidenceIds.slice(0, 4)} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NotificationRulesView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>, options?: RunActionOptions) => Promise<void>;
}) {
  const [disabledRuleIds, setDisabledRuleIds] = useState<string[]>([]);
  const rules = buildNotificationRules(data, disabledRuleIds);
  const [triggerFilter, setTriggerFilter] = useState<NotificationRuleTrigger | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<CompetitiveAlert["severity"] | "all">("all");
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | undefined>(rules[0]?.id);
  const filteredRules = rules.filter(
    (rule) =>
      (triggerFilter === "all" || rule.trigger === triggerFilter) &&
      (severityFilter === "all" || rule.severity === severityFilter) &&
      (!showMatchedOnly || rule.matches.length > 0)
  );
  const selectedRule = filteredRules.find((rule) => rule.id === selectedRuleId) ?? filteredRules[0];
  const activeRules = rules.filter((rule) => rule.enabled);
  const activeMatches = activeRules.flatMap((rule) => rule.matches);
  const highMatches = activeMatches.filter((match) => match.severity === "high");
  const triggerOptions = uniqueValues(rules.map((rule) => rule.trigger));

  const toggleRule = (rule: NotificationRule) => {
    setDisabledRuleIds((current) => (current.includes(rule.id) ? current.filter((id) => id !== rule.id) : [...current, rule.id]));
  };

  const jobForRule = (rule: NotificationRule): JobType => {
    if (rule.trigger === "report_risk") {
      return "report";
    }
    if (rule.trigger === "channel_failure" || rule.trigger === "social_fetch_failure") {
      return "crawl";
    }
    return "analyze";
  };

  const runRelatedTask = (rule: NotificationRule) => {
    const ownedAppId = data.activeOwnedAppId;
    if (!ownedAppId) {
      return;
    }
    const jobType = jobForRule(rule);
    void runAction(jobType, () => triggerJob(ownedAppId, jobType), {
      successMessage: (response) => jobResultMessage(response, jobType)
    });
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="规则总数" value={rules.length} />
        <Metric label="已启用" value={activeRules.length} tone="ok" />
        <Metric label="命中规则" value={activeRules.filter((rule) => rule.matches.length > 0).length} tone="warn" />
        <Metric label="高优先命中" value={highMatches.length} tone={highMatches.length ? "warn" : "ok"} />
        <Metric label="待接入渠道" value={uniqueValues(rules.flatMap((rule) => rule.channels).filter((channel) => channel !== "in_app")).length} />
        <Metric label="关联证据" value={uniqueValues(activeMatches.flatMap((match) => match.evidenceIds)).length} />
      </section>

      <section className="panel wide notification-summary-panel">
        <div className="panel-heading">
          <h3>通知规则摘要</h3>
          <small>第一阶段只做站内规则预览，飞书 / 邮件 / Webhook 作为后续集成。</small>
        </div>
        <div className="notification-summary-grid">
          <article className="roadmap-summary-card">
            <strong>现在该看</strong>
            <p>{highMatches[0] ? `${highMatches[0].title}：${highMatches[0].recommendedAction}` : activeMatches[0]?.summary ?? "暂无高优先通知命中。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最吵规则</strong>
            <p>
              {rules
                .filter((rule) => rule.matches.length > 0)
                .sort((left, right) => right.matches.length - left.matches.length)[0]?.name ?? "暂无命中规则"}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>接入边界</strong>
            <p>当前只生成站内命中和通知文案；外部发送需要后续配置飞书、邮件或 Webhook。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>规则筛选</h3>
          <small>{filteredRules.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={triggerFilter} onChange={(event) => setTriggerFilter(event.target.value as NotificationRuleTrigger | "all")}>
            <option value="all">全部触发器</option>
            {triggerOptions.map((trigger) => (
              <option key={trigger} value={trigger}>
                {notificationTriggerLabel(trigger as NotificationRuleTrigger)}
              </option>
            ))}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as CompetitiveAlert["severity"] | "all")}>
            <option value="all">全部等级</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <label className="checkbox-filter">
            <input type="checkbox" checked={showMatchedOnly} onChange={(event) => setShowMatchedOnly(event.target.checked)} />
            只看命中
          </label>
        </div>
      </section>

      <section className="panel wide notification-board">
        <div className="notification-list-panel">
          <div className="panel-heading nested-heading">
            <h3>规则队列</h3>
          </div>
          {filteredRules.length === 0 ? (
            <EmptyState title="暂无匹配规则" text="调整筛选条件或开启更多规则。" />
          ) : (
            <div className="notification-rule-list">
              {filteredRules.map((rule) => (
                <button
                  key={rule.id}
                  className={selectedRule?.id === rule.id ? "notification-rule-card active" : "notification-rule-card"}
                  onClick={() => setSelectedRuleId(rule.id)}
                >
                  <div className="decision-card-top">
                    <span className={`severity ${rule.severity}`}>{impactLabel(rule.severity)}</span>
                    <span className={rule.enabled ? "tag enabled-tag" : "tag muted-tag"}>{rule.enabled ? "启用" : "停用"}</span>
                  </div>
                  <strong>{rule.name}</strong>
                  <p>{rule.description}</p>
                  <div className="notification-rule-meta">
                    <span>{notificationTriggerLabel(rule.trigger)}</span>
                    <span>{rule.matches.length} 命中</span>
                    <span>{rule.cadence}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="notification-detail-panel">
          {!selectedRule ? (
            <EmptyState title="未选择规则" text="从左侧选择一个通知规则查看命中详情。" />
          ) : (
            <>
              <div className="notification-detail-hero">
                <div>
                  <span className={`severity ${selectedRule.severity}`}>{impactLabel(selectedRule.severity)}</span>
                  <h3>{selectedRule.name}</h3>
                  <p>{selectedRule.description}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="ghost" onClick={() => toggleRule(selectedRule)}>
                    {selectedRule.enabled ? "停用" : "启用"}
                  </button>
                  <button className="primary" disabled={!data.activeOwnedAppId} onClick={() => runRelatedTask(selectedRule)}>
                    <RefreshCw size={15} />
                    运行{jobTypeLabel(jobForRule(selectedRule))}
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid notification-fact-grid">
                <article>
                  <strong>触发器</strong>
                  <p>{notificationTriggerLabel(selectedRule.trigger)}</p>
                </article>
                <article>
                  <strong>阈值</strong>
                  <p>{selectedRule.threshold}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{notificationOwnerLabel(selectedRule.ownerRole)}</p>
                </article>
                <article>
                  <strong>最近命中</strong>
                  <p>{selectedRule.lastMatchedAt ? selectedRule.lastMatchedAt.slice(0, 16).replace("T", " ") : "暂无"}</p>
                </article>
              </div>

              <section className="notification-section notification-two-col">
                <div>
                  <h3>通知渠道</h3>
                  <div className="action-chip-grid">
                    {selectedRule.channels.map((channel) => (
                      <span key={channel}>{notificationChannelLabel(channel)}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>规则说明</h3>
                  <div className="action-chip-grid">
                    <span>{selectedRule.enabled ? "启用后参与站内命中统计。" : "停用后不计入站内通知命中。"}</span>
                    <span>外部发送通道尚未真实发送，只展示建议路由。</span>
                  </div>
                </div>
              </section>

              <section className="notification-section">
                <div className="panel-heading nested-heading">
                  <h3>命中事件</h3>
                  <small>{selectedRule.enabled ? selectedRule.matches.length : 0} 条</small>
                </div>
                {!selectedRule.enabled ? (
                  <EmptyState title="规则已停用" text="启用后会重新计入站内通知命中。" />
                ) : selectedRule.matches.length === 0 ? (
                  <EmptyState title="暂无命中" text="当前数据没有触发这条规则。" />
                ) : (
                  <div className="notification-match-list">
                    {selectedRule.matches.map((match) => (
                      <article key={match.id}>
                        <div className="decision-card-top">
                          <strong>{match.title}</strong>
                          <span className={`severity ${match.severity}`}>{impactLabel(match.severity)}</span>
                        </div>
                        <p>{match.summary}</p>
                        <div className="evidence-meta">
                          <span>{match.source}</span>
                          <span>{match.createdAt.slice(0, 16).replace("T", " ")}</span>
                          <span>证据 {match.evidenceIds.length}</span>
                        </div>
                        <div className="notification-action-line">{match.recommendedAction}</div>
                        <EvidenceList data={data} evidenceIds={match.evidenceIds.slice(0, 6)} />
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function RiskRegisterView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>, options?: RunActionOptions) => Promise<void>;
}) {
  const risks = buildRiskRegister(data);
  const [areaFilter, setAreaFilter] = useState<RiskRegisterArea | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [statusFilter, setStatusFilter] = useState<RiskRegisterStatus | "all">("all");
  const [selectedRiskId, setSelectedRiskId] = useState<string | undefined>(risks[0]?.id);
  const areaOptions = uniqueValues(risks.map((risk) => risk.area)) as RiskRegisterArea[];
  const filteredRisks = risks.filter(
    (risk) =>
      (areaFilter === "all" || risk.area === areaFilter) &&
      (severityFilter === "all" || risk.severity === severityFilter) &&
      (statusFilter === "all" || risk.status === statusFilter)
  );
  const selectedRisk = filteredRisks.find((risk) => risk.id === selectedRiskId) ?? filteredRisks[0];
  const highRisks = risks.filter((risk) => risk.severity === "high");
  const openRisks = risks.filter((risk) => risk.status === "open");
  const evidenceRisks = risks.filter((risk) => risk.area === "evidence" || risk.evidenceIds.length === 0);

  const jobForRisk = (risk: RiskRegisterItem): JobType => {
    if (risk.area === "channel" || risk.area === "social") {
      return "crawl";
    }
    if (risk.area === "report") {
      return "report";
    }
    return "analyze";
  };

  const runRiskTask = (risk: RiskRegisterItem) => {
    if (!data.activeOwnedAppId) {
      return;
    }
    const jobType = jobForRisk(risk);
    void runAction(jobType, () => triggerJob(data.activeOwnedAppId ?? "", jobType), {
      successMessage: (response) => jobResultMessage(response, jobType)
    });
  };

  const appendRiskToReport = (risk: RiskRegisterItem) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 风险：${risk.title}`;
    const snippet = [
      marker,
      "",
      `- 风险域：${riskRegisterAreaLabel(risk.area)} / ${impactLabel(risk.severity)} / ${riskRegisterStatusLabel(risk.status)}`,
      `- 来源：${risk.source}`,
      `- 摘要：${risk.summary}`,
      `- 缓解动作：${risk.mitigation}`,
      `- 下次检查：${risk.nextCheck}`,
      `- 证据：${risk.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 风险登记补充\n\n${snippet}`;
    void runAction("risk-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="风险总数" value={risks.length} />
        <Metric label="高风险" value={highRisks.length} tone={highRisks.length ? "warn" : "ok"} />
        <Metric label="待处理" value={openRisks.length} tone={openRisks.length ? "warn" : "ok"} />
        <Metric label="证据风险" value={evidenceRisks.length} />
        <Metric label="研发风险" value={risks.filter((risk) => risk.area === "engineering").length} />
        <Metric label="可回溯证据" value={uniqueValues(risks.flatMap((risk) => risk.evidenceIds)).length} />
      </section>

      <section className="panel wide risk-summary-panel">
        <div className="panel-heading">
          <h3>风险摘要</h3>
          <small>把告警、证据、研发、验证、社媒和报告风险集中成一张台账。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最先处理</strong>
            <p>{highRisks[0] ? `${highRisks[0].title}：${highRisks[0].mitigation}` : "暂无高风险项。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>证据缺口</strong>
            <p>{evidenceRisks[0] ? `${evidenceRisks[0].title}：${evidenceRisks[0].summary}` : "当前关键风险基本有证据链。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>处理边界</strong>
            <p>本页是风险台账和缓解建议，不代表已创建真实研发或运营工单。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>风险筛选</h3>
          <small>{filteredRisks.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as RiskRegisterArea | "all")}>
            <option value="all">全部风险域</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {riskRegisterAreaLabel(area)}
              </option>
            ))}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as "all" | "high" | "medium" | "low")}>
            <option value="all">全部严重度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as RiskRegisterStatus | "all")}>
            <option value="all">全部状态</option>
            <option value="open">待处理</option>
            <option value="mitigating">处理中</option>
            <option value="watch">观察</option>
          </select>
        </div>
      </section>

      <section className="panel wide risk-register-workbench">
        <div className="risk-list-panel">
          <div className="panel-heading nested-heading">
            <h3>风险台账</h3>
          </div>
          {filteredRisks.length === 0 ? (
            <EmptyState title="暂无风险" text="调整筛选，或先执行采集和分析。" />
          ) : (
            <div className="risk-card-list">
              {filteredRisks.map((risk) => (
                <button
                  className={selectedRisk?.id === risk.id ? "risk-card active" : "risk-card"}
                  key={risk.id}
                  onClick={() => setSelectedRiskId(risk.id)}
                >
                  <div className="decision-card-top">
                    <span className={`severity ${risk.severity}`}>{impactLabel(risk.severity)}</span>
                    <span className="tag">{riskRegisterAreaLabel(risk.area)}</span>
                  </div>
                  <strong>{risk.title}</strong>
                  <p>{risk.summary}</p>
                  <div className="risk-card-meta">
                    <span>{riskRegisterStatusLabel(risk.status)}</span>
                    <span>{recommendationOwnerLabel(risk.owner)}</span>
                    <span>证据 {risk.evidenceIds.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="risk-detail-panel">
          {!selectedRisk ? (
            <EmptyState title="未选择风险" text="从左侧选择一个风险查看处理建议。" />
          ) : (
            <>
              <div className="risk-detail-hero">
                <div>
                  <span className={`severity ${selectedRisk.severity}`}>{impactLabel(selectedRisk.severity)}</span>
                  <h3>{selectedRisk.title}</h3>
                  <p>{selectedRisk.summary}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="primary" disabled={!data.activeOwnedAppId} onClick={() => runRiskTask(selectedRisk)}>
                    <RefreshCw size={15} />
                    运行{jobTypeLabel(jobForRisk(selectedRisk))}
                  </button>
                  <button className="secondary" disabled={!latestReport} onClick={() => appendRiskToReport(selectedRisk)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid risk-fact-grid">
                <article>
                  <strong>风险域</strong>
                  <p>{riskRegisterAreaLabel(selectedRisk.area)}</p>
                </article>
                <article>
                  <strong>状态</strong>
                  <p>{riskRegisterStatusLabel(selectedRisk.status)}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{recommendationOwnerLabel(selectedRisk.owner)}</p>
                </article>
                <article>
                  <strong>下次检查</strong>
                  <p>{selectedRisk.nextCheck}</p>
                </article>
              </div>

              <section className="risk-section risk-two-col">
                <div>
                  <h3>缓解动作</h3>
                  <div className="risk-action-card">{selectedRisk.mitigation}</div>
                </div>
                <div>
                  <h3>来源</h3>
                  <div className="risk-action-card">{selectedRisk.source}</div>
                </div>
              </section>

              <section className="risk-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedRisk.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedRisk.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function StoreMetadataTimelineView({ data }: { data: ApiStateResponse }) {
  const signals = buildStoreMetadataSignals(data.state, data.state.currentOwnedApp?.id ?? "");
  const [fieldFilter, setFieldFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const fieldOptions = uniqueValues(signals.map((signal) => signal.field));
  const ownerOptions = uniqueValues(signals.map((signal) => signal.ownerName));
  const filteredSignals = signals.filter(
    (signal) => (fieldFilter === "all" || signal.field === fieldFilter) && (ownerFilter === "all" || signal.ownerName === ownerFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="元数据变化" value={signals.length} />
        <Metric label="描述/日志" value={signals.filter((signal) => signal.field === "description" || signal.field === "release_notes").length} />
        <Metric label="截图变化" value={signals.filter((signal) => signal.field === "screenshots").length} />
        <Metric label="价格字段" value={signals.filter((signal) => signal.field === "price").length} />
        <Metric label="关键词线索" value={uniqueValues(signals.flatMap((signal) => signal.keywordHints)).length} />
        <Metric label="含证据" value={signals.filter((signal) => signal.evidenceIds.length > 0).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>商店页筛选</h3>
          <small>追踪描述、更新日志、截图、价格和评分变化</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={fieldFilter} onChange={(event) => setFieldFilter(event.target.value)}>
            <option value="all">全部字段</option>
            {fieldOptions.map((field) => (
              <option key={field} value={field}>
                {metadataFieldLabel(field as StoreMetadataSignal["field"])}
              </option>
            ))}
          </select>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>商店页元数据时间线</h3>
          <small>{filteredSignals.length} 条</small>
        </div>
        {filteredSignals.length === 0 ? (
          <EmptyState title="暂无商店页变化" text="需要快照、描述、截图或更新日志样本后才能形成时间线。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>对象</th>
                  <th>字段</th>
                  <th>当前值</th>
                  <th>关键词</th>
                  <th>截图</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((signal) => (
                  <tr key={signal.id}>
                    <td>
                      <strong>{signal.ownerName}</strong>
                      <small>{platformLabel(signal.platform)} / {signal.channelName} / {signal.capturedAt.slice(0, 10)}</small>
                    </td>
                    <td>
                      {metadataFieldLabel(signal.field)}
                      <small>{signal.beforeValue ? "有历史对比" : "首次记录"}</small>
                    </td>
                    <td>
                      <p className="table-copy">{signal.afterValue}</p>
                    </td>
                    <td>{signal.keywordHints.join("、") || "待提取"}</td>
                    <td>{signal.screenshotUrls.length > 0 ? <ScreenshotStrip ownerName={signal.ownerName} screenshots={signal.screenshotUrls.slice(0, 3)} /> : "无"}</td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={signal.evidenceIds} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RatingSentimentView({ data }: { data: ApiStateResponse }) {
  const signals = buildRatingSentimentSignals(data.state, data.state.currentOwnedApp?.id ?? "");
  const [riskFilter, setRiskFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const filteredSignals = signals.filter(
    (signal) => (riskFilter === "all" || signal.riskLevel === riskFilter) && (platformFilter === "all" || signal.platform === platformFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="口碑样本" value={signals.length} />
        <Metric label="高风险" value={signals.filter((signal) => signal.riskLevel === "high").length} tone="warn" />
        <Metric label="中风险" value={signals.filter((signal) => signal.riskLevel === "medium").length} />
        <Metric label="评论样本" value={signals.reduce((sum, signal) => sum + signal.sampleSize, 0)} />
        <Metric label="负向样本" value={signals.reduce((sum, signal) => sum + signal.negativeReviewCount, 0)} tone="warn" />
        <Metric label="正向样本" value={signals.reduce((sum, signal) => sum + signal.positiveReviewCount, 0)} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>口碑筛选</h3>
          <small>按风险和平台定位版本后的评分 / 评论问题</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="all">全部风险</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
            <option value="all">全部平台</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>评分与口碑监控</h3>
          <small>{filteredSignals.length} 条</small>
        </div>
        {filteredSignals.length === 0 ? (
          <EmptyState title="暂无口碑信号" text="采集评分和评论样本后，会展示风险等级、主题和证据。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>对象</th>
                  <th>风险</th>
                  <th>评分 / 评论</th>
                  <th>样本结构</th>
                  <th>主题</th>
                  <th>判断</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignals.map((signal) => (
                  <tr key={signal.id}>
                    <td>
                      <strong>{signal.ownerName}</strong>
                      <small>{platformLabel(signal.platform)} / {signal.channelName}</small>
                    </td>
                    <td>
                      <span className={`severity ${signal.riskLevel}`}>{impactLabel(signal.riskLevel)}</span>
                    </td>
                    <td>
                      {signal.rating ?? "无评分"} 分
                      <small>{signal.reviewCount ?? "无评论量"} 条商店评论</small>
                    </td>
                    <td>
                      样本 {signal.sampleSize}
                      <small>正向 {signal.positiveReviewCount} / 负向 {signal.negativeReviewCount} / 均分 {signal.averageReviewRating ?? "无"}</small>
                    </td>
                    <td>{signal.topThemes.join("、") || "待聚类"}</td>
                    <td>
                      <p className="table-copy">{signal.summary}</p>
                    </td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={signal.evidenceIds.slice(0, 4)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function AsoKeywordRadarView({ data }: { data: ApiStateResponse }) {
  const opportunities = buildAsoKeywordOpportunities(data.state, data.state.currentOwnedApp?.id ?? "");
  const [coverageFilter, setCoverageFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const sourceOptions = uniqueValues(opportunities.map((opportunity) => opportunity.source));
  const filteredOpportunities = opportunities.filter(
    (opportunity) =>
      (coverageFilter === "all" ||
        (coverageFilter === "gap" && !opportunity.ownedCoverage) ||
        (coverageFilter === "covered" && opportunity.ownedCoverage)) &&
      (sourceFilter === "all" || opportunity.source === sourceFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="关键词机会" value={opportunities.length} />
        <Metric label="表达缺口" value={opportunities.filter((opportunity) => !opportunity.ownedCoverage).length} tone="warn" />
        <Metric label="已覆盖" value={opportunities.filter((opportunity) => opportunity.ownedCoverage).length} />
        <Metric label="高机会分" value={opportunities.filter((opportunity) => opportunity.opportunityScore >= 80).length} tone="warn" />
        <Metric label="竞品覆盖" value={opportunities.reduce((sum, opportunity) => sum + opportunity.competitorCoverage.length, 0)} />
        <Metric label="证据数" value={uniqueValues(opportunities.flatMap((opportunity) => opportunity.evidenceIds)).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>关键词筛选</h3>
          <small>从功能矩阵、评论、更新日志和商店描述提取 ASO 线索</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={coverageFilter} onChange={(event) => setCoverageFilter(event.target.value)}>
            <option value="all">全部覆盖</option>
            <option value="gap">当前 App 表达缺口</option>
            <option value="covered">当前 App 已覆盖</option>
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">全部来源</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {keywordSourceLabel(source as AsoKeywordOpportunity["source"])}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>ASO 关键词雷达</h3>
          <small>{filteredOpportunities.length} 条</small>
        </div>
        {filteredOpportunities.length === 0 ? (
          <EmptyState title="暂无关键词机会" text="执行分析后，会从功能、评论和商店页中提取关键词覆盖差距。" />
        ) : (
          <div className="table-wrap decision-table">
            <table>
              <thead>
                <tr>
                  <th>关键词</th>
                  <th>机会分</th>
                  <th>来源</th>
                  <th>当前 App</th>
                  <th>竞品覆盖</th>
                  <th>建议</th>
                  <th>证据</th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td>
                      <strong>{opportunity.keyword}</strong>
                      <small>提及 {opportunity.mentionCount}</small>
                    </td>
                    <td>{opportunity.opportunityScore}</td>
                    <td>{keywordSourceLabel(opportunity.source)}</td>
                    <td>{opportunity.ownedCoverage ? "已覆盖" : "表达缺口"}</td>
                    <td>
                      {opportunity.competitorCoverage.map((coverage) => coverage.competitorName).join("、") || "暂无"}
                      <small>{uniqueValues(opportunity.competitorCoverage.flatMap((coverage) => coverage.channels)).join("、") || "无渠道"}</small>
                    </td>
                    <td>
                      <p className="table-copy">{opportunity.recommendation}</p>
                    </td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={opportunity.evidenceIds.slice(0, 4)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function LaunchRadarView({ data }: { data: ApiStateResponse }) {
  const signals = buildLaunchSignals(data.state, data.state.currentOwnedApp?.id ?? "");
  const [typeFilter, setTypeFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const typeOptions = uniqueValues(signals.map((signal) => signal.signalType));
  const filteredSignals = signals.filter(
    (signal) => (typeFilter === "all" || signal.signalType === typeFilter) && (impactFilter === "all" || signal.impact === impactFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="发布信号" value={signals.length} />
        <Metric label="高影响" value={signals.filter((signal) => signal.impact === "high").length} tone="warn" />
        <Metric label="新功能" value={signals.filter((signal) => signal.signalType === "new_feature").length} />
        <Metric label="商业化" value={signals.filter((signal) => signal.signalType === "pricing").length} />
        <Metric label="定位变化" value={signals.filter((signal) => signal.signalType === "positioning").length} />
        <Metric label="官网/发布" value={signals.filter((signal) => signal.signalType === "website").length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>发布筛选</h3>
          <small>汇总新功能、活动、商业化、定位和官网发布信号</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {launchTypeLabel(type as LaunchSignal["signalType"])}
              </option>
            ))}
          </select>
          <select value={impactFilter} onChange={(event) => setImpactFilter(event.target.value)}>
            <option value="all">全部影响</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>产品发布雷达</h3>
          <small>{filteredSignals.length} 条</small>
        </div>
        {filteredSignals.length === 0 ? (
          <EmptyState title="暂无发布信号" text="采集版本更新、官网或发布证据后，会形成发布雷达。" />
        ) : (
          <div className="evidence-grid alert-grid">
            {filteredSignals.map((signal) => (
              <article className="evidence-item evidence-card" key={signal.id}>
                <div className="evidence-title">
                  <span className={`severity ${signal.impact}`}>{impactLabel(signal.impact)}</span>
                  <span className="tag">{launchTypeLabel(signal.signalType)}</span>
                  <strong>{signal.title}</strong>
                </div>
                <p>{signal.summary}</p>
                <div className="evidence-meta">
                  <span>{signal.ownerName}</span>
                  <span>{signal.sourceChannels.join("、")}</span>
                  <span>置信度 {Math.round(signal.confidence * 100)}%</span>
                  <span>{signal.occurredAt.slice(0, 10)}</span>
                </div>
                <EvidenceList data={data} evidenceIds={signal.evidenceIds.slice(0, 4)} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StrategyRadarView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const inferences = buildStrategicInferences(data);
  const ownerOptions = strategicOwnerOptions(data);
  const themeOptions = Object.keys(strategicThemeMeta) as StrategicTheme[];
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [themeFilter, setThemeFilter] = useState<StrategicTheme | "all">("all");
  const [stageFilter, setStageFilter] = useState<StrategicInference["stage"] | "all">("all");
  const [selectedInferenceId, setSelectedInferenceId] = useState<string | undefined>(inferences[0]?.id);
  const filteredInferences = inferences.filter(
    (inference) =>
      (ownerFilter === "all" || inference.ownerId === ownerFilter) &&
      (themeFilter === "all" || inference.theme === themeFilter) &&
      (stageFilter === "all" || inference.stage === stageFilter)
  );
  const selectedInference = filteredInferences.find((inference) => inference.id === selectedInferenceId) ?? filteredInferences[0];
  const evidenceCount = uniqueValues(inferences.flatMap((inference) => inference.evidenceIds)).length;

  const appendStrategyToReport = (inference: StrategicInference) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 战略雷达：${inference.ownerName} / ${inference.themeLabel}`;
    const nextMarkdown = latestReport.markdown.includes(marker)
      ? latestReport.markdown
      : `${latestReport.markdown}\n\n## 战略雷达补充\n\n${inference.reportSnippet}`;
    void runAction("strategy-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="战略信号" value={inferences.length} />
        <Metric label="战略推测" value={inferences.filter((inference) => inference.stage === "strategic_inference").length} tone="warn" />
        <Metric label="高置信" value={inferences.filter((inference) => inference.confidence >= 70).length} />
        <Metric label="高影响" value={inferences.filter((inference) => inference.impact === "high").length} tone="warn" />
        <Metric label="证据缺口" value={inferences.filter((inference) => inference.missingEvidence.length > 0).length} tone="warn" />
        <Metric label="关联证据" value={evidenceCount} />
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>战略变化摘要</h3>
          <small>只把多来源信号升级为推测，单来源只作为观察项。</small>
        </div>
        <div className="strategy-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最强推测</strong>
            <p>{inferences[0] ? `${inferences[0].ownerName}：${inferences[0].hypothesis}` : "暂无足够战略信号，先补证据。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>需要补证</strong>
            <p>
              {inferences.find((inference) => inference.missingEvidence.length > 0)?.missingEvidence[0] ?? "当前高优先级战略判断已有基础证据，继续补截图和评论样本。"}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发关注</strong>
            <p>
              {inferences.find((inference) => inference.theme === "ai_acceleration" || inference.theme === "quality_experience")?.nextActions[0] ??
                "优先关注 AI 生成、保存导出、支付和版本稳定性相关信号。"}
            </p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>战略筛选</h3>
          <small>{filteredInferences.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <select value={themeFilter} onChange={(event) => setThemeFilter(event.target.value as StrategicTheme | "all")}>
            <option value="all">全部主题</option>
            {themeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {strategyThemeLabel(theme)}
              </option>
            ))}
          </select>
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as StrategicInference["stage"] | "all")}>
            <option value="all">全部级别</option>
            <option value="strategic_inference">战略推测</option>
            <option value="pattern">多信号模式</option>
            <option value="observation">观察项</option>
          </select>
        </div>
      </section>

      <section className="panel wide strategy-board">
        <div className="strategy-list-panel">
          <div className="panel-heading nested-heading">
            <h3>推测队列</h3>
            <small>{filteredInferences.length} 条</small>
          </div>
          {filteredInferences.length === 0 ? (
            <EmptyState title="暂无战略信号" text="先采集发布、价格、商店页、评论或社媒证据。" />
          ) : (
            <div className="strategy-card-list">
              {filteredInferences.map((inference) => (
                <button
                  key={inference.id}
                  className={selectedInference?.id === inference.id ? "strategy-card active" : "strategy-card"}
                  onClick={() => setSelectedInferenceId(inference.id)}
                >
                  <div className="decision-card-top">
                    <span className={`score-pill ${persuasivenessTone(inference.confidence)}`}>{inference.confidence}%</span>
                    <span className={`severity ${inference.impact}`}>{impactLabel(inference.impact)}</span>
                  </div>
                  <strong>{inference.ownerName}</strong>
                  <span>{inference.themeLabel} / {strategyStageLabel(inference.stage)}</span>
                  <p>{inference.hypothesis}</p>
                  <div className="strategy-source-row">
                    {inference.sourceTypes.slice(0, 4).map((sourceType) => (
                      <span className="tag" key={`${inference.id}-${sourceType}`}>
                        {sourceType}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="strategy-detail-panel">
          {!selectedInference ? (
            <EmptyState title="未选择战略信号" text="从左侧选择一个战略推测，查看证据链和下一步。" />
          ) : (
            <>
              <div className="strategy-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedInference.confidence)}`}>{strategyStageLabel(selectedInference.stage)}</span>
                  <h3>{selectedInference.hypothesis}</h3>
                  <p>{selectedInference.productImplication}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendStrategyToReport(selectedInference)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid strategy-fact-grid">
                <article>
                  <strong>主题</strong>
                  <p>{selectedInference.themeLabel}</p>
                </article>
                <article>
                  <strong>置信度</strong>
                  <p>{selectedInference.confidence}% / {impactLabel(selectedInference.impact)}影响</p>
                </article>
                <article>
                  <strong>信号来源</strong>
                  <p>{selectedInference.sourceTypes.join("、") || "待补"}</p>
                </article>
                <article>
                  <strong>证据数</strong>
                  <p>{selectedInference.evidenceIds.length} 条 Evidence</p>
                </article>
              </div>

              <section className="strategy-section">
                <div className="panel-heading nested-heading">
                  <h3>支持信号</h3>
                  <small>按来源和时间归档</small>
                </div>
                <div className="strategy-signal-list">
                  {selectedInference.signals.map((signal) => (
                    <article key={signal.id}>
                      <div className="decision-card-top">
                        <strong>{signal.label}</strong>
                        <span className="tag">{signal.sourceType}</span>
                      </div>
                      <p>{signal.summary}</p>
                      <small>{signal.capturedAt.slice(0, 10)} / Evidence {signal.evidenceIds.join(", ") || "待补"}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="strategy-section strategy-two-col">
                <div>
                  <h3>反证 / 注意</h3>
                  <div className="action-chip-grid">
                    {(selectedInference.counterSignals.length > 0 ? selectedInference.counterSignals : ["暂未发现明显反证，但仍需人工确认业务背景。"]).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>证据缺口</h3>
                  <div className="action-chip-grid">
                    {(selectedInference.missingEvidence.length > 0 ? selectedInference.missingEvidence : ["关键证据闭环较完整，可进入专题分析或周报引用。"]).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="strategy-section">
                <div className="panel-heading nested-heading">
                  <h3>建议动作</h3>
                  <small>{selectedInference.recommendation}</small>
                </div>
                <div className="action-chip-grid">
                  {selectedInference.nextActions.map((action) => (
                    <span key={action}>{action}</span>
                  ))}
                </div>
              </section>

              <section className="strategy-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedInference.evidenceIds.length} 条</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedInference.evidenceIds.slice(0, 10)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function AgentTasksView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>, options?: RunActionOptions) => Promise<void>;
}) {
  const tasks = buildResearchAgentTasks(data);
  const [categoryFilter, setCategoryFilter] = useState<AgentTaskCategory | "all">("all");
  const [healthFilter, setHealthFilter] = useState<AgentTaskHealth | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(tasks[0]?.id);
  const filteredTasks = tasks.filter(
    (task) => (categoryFilter === "all" || task.category === categoryFilter) && (healthFilter === "all" || task.health === healthFilter)
  );
  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0];
  const sortedJobs = [...data.state.jobs].sort((left, right) => jobTimestamp(right).localeCompare(jobTimestamp(left))).slice(0, 8);

  const runAgentTask = (task: ResearchAgentTask) => {
    const activeOwnedAppId = data.activeOwnedAppId;
    if (!activeOwnedAppId) {
      return;
    }
    void runAction(task.linkedJobType, () => triggerJob(activeOwnedAppId, task.linkedJobType), {
      successMessage: (response) => jobResultMessage(response, task.linkedJobType)
    });
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="Agent 总数" value={tasks.length} />
        <Metric label="健康" value={tasks.filter((task) => task.health === "healthy").length} tone="ok" />
        <Metric label="需关注" value={tasks.filter((task) => task.health === "warning").length} tone="warn" />
        <Metric label="阻塞" value={tasks.filter((task) => task.health === "blocked").length} tone="warn" />
        <Metric label="采集 Agent" value={tasks.filter((task) => task.category === "collection").length} />
        <Metric label="关联证据" value={uniqueValues(tasks.flatMap((task) => task.evidenceIds)).length} />
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>Agent 运行摘要</h3>
          <small>把定时采集、分析、战略推断、需求生成和周报产出串成可观测任务链。</small>
        </div>
        <div className="agent-summary-grid">
          <article className="roadmap-summary-card">
            <strong>优先处理</strong>
            <p>{tasks.find((task) => task.health !== "healthy")?.blockers[0] ?? "当前 Agent 没有硬阻塞，继续观察定时运行结果。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最近任务</strong>
            <p>{sortedJobs[0] ? `${jobTypeLabel(sortedJobs[0].type)} / ${statusLabel(sortedJobs[0].state)} / ${sortedJobs[0].userMessage}` : "暂无任务运行记录。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>下一步</strong>
            <p>{tasks.find((task) => task.health === "blocked")?.nextRunText ?? "继续按每日采集和分析节奏更新证据，周一生成周报。"}</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>任务筛选</h3>
          <small>{filteredTasks.length} 个 Agent</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as AgentTaskCategory | "all")}>
            <option value="all">全部类型</option>
            <option value="collection">采集</option>
            <option value="analysis">分析</option>
            <option value="reporting">报告</option>
          </select>
          <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as AgentTaskHealth | "all")}>
            <option value="all">全部健康度</option>
            <option value="blocked">阻塞</option>
            <option value="warning">需关注</option>
            <option value="healthy">健康</option>
          </select>
        </div>
      </section>

      <section className="panel wide agent-board">
        <div className="agent-list-panel">
          <div className="panel-heading nested-heading">
            <h3>Agent 队列</h3>
          </div>
          <div className="agent-card-list">
            {filteredTasks.map((task) => (
              <button key={task.id} className={selectedTask?.id === task.id ? "agent-card active" : "agent-card"} onClick={() => setSelectedTaskId(task.id)}>
                <div className="decision-card-top">
                  <span className={`score-pill ${agentHealthTone(task.health)}`}>{agentHealthLabel(task.health)}</span>
                  <span className="tag">{agentCategoryLabel(task.category)}</span>
                </div>
                <strong>{task.name}</strong>
                <p>{task.description}</p>
                <div className="agent-card-meta">
                  <span>就绪 {task.readinessScore}</span>
                  <span>{task.coverage}</span>
                  <span>{task.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="agent-detail-panel">
          {!selectedTask ? (
            <EmptyState title="未选择 Agent" text="从左侧选择一个任务查看运行状态。" />
          ) : (
            <>
              <div className="agent-detail-hero">
                <div>
                  <span className={`score-pill ${agentHealthTone(selectedTask.health)}`}>{agentHealthLabel(selectedTask.health)} / 就绪 {selectedTask.readinessScore}</span>
                  <h3>{selectedTask.name}</h3>
                  <p>{selectedTask.description}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="primary" disabled={!data.activeOwnedAppId} onClick={() => runAgentTask(selectedTask)}>
                    <RefreshCw size={15} />
                    运行{jobTypeLabel(selectedTask.linkedJobType)}
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid agent-fact-grid">
                <article>
                  <strong>计划</strong>
                  <p>{selectedTask.schedule}</p>
                </article>
                <article>
                  <strong>最近运行</strong>
                  <p>{selectedTask.lastRunAt ? selectedTask.lastRunAt.slice(0, 16).replace("T", " ") : "未运行"}</p>
                </article>
                <article>
                  <strong>覆盖</strong>
                  <p>{selectedTask.coverage}</p>
                </article>
                <article>
                  <strong>下次动作</strong>
                  <p>{selectedTask.nextRunText}</p>
                </article>
              </div>

              <section className="agent-section agent-two-col">
                <div>
                  <h3>阻塞项</h3>
                  <div className="action-chip-grid">
                    {(selectedTask.blockers.length > 0 ? selectedTask.blockers : ["暂无硬阻塞，继续观察任务运行和证据质量。"]).map((blocker) => (
                      <span key={blocker}>{blocker}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>已有产出</h3>
                  <div className="action-chip-grid">
                    {selectedTask.outputs.map((output) => (
                      <span key={output}>{output}</span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="agent-section">
                <div className="panel-heading nested-heading">
                  <h3>运行记录</h3>
                  <small>当前 App 最近任务</small>
                </div>
                <div className="job-log-list">
                  {sortedJobs.length === 0 ? (
                    <EmptyState title="暂无运行记录" text="点击运行任务后会显示状态、进度和结果。" />
                  ) : (
                    sortedJobs.map((job) => (
                      <article key={job.id}>
                        <div className="decision-card-top">
                          <strong>{jobTypeLabel(job.type)}</strong>
                          <span className={`severity ${job.state === "Failed" ? "high" : job.state === "PartialSucceeded" ? "medium" : "low"}`}>
                            {statusLabel(job.state)}
                          </span>
                        </div>
                        <p>{job.userMessage}</p>
                        <small>
                          {jobTimestamp(job).slice(0, 16).replace("T", " ")} / 进度 {job.progress}%
                          {job.errorCode ? ` / ${job.errorCode}` : ""}
                        </small>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="agent-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedTask.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedTask.evidenceIds.slice(0, 10)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EvidenceCenterView({ data }: { data: ApiStateResponse }) {
  const records = buildEvidenceRecords(data);
  const credibilityProfiles = new Map(records.map((record) => [record.id, buildEvidenceCredibilityProfile(data, record)]));
  const coverageAudit = buildEvidenceCoverageAudit(data, records);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState<EvidenceCredibilityGrade | "all">("all");
  const ownerOptions = [
    ...(data.state.currentOwnedApp ? [{ id: data.state.currentOwnedApp.id, name: data.state.currentOwnedApp.name }] : []),
    ...data.state.competitors.map((competitor) => ({ id: competitor.id, name: competitor.name }))
  ];
  const sourceTypes = uniqueValues(records.map((record) => record.sourceType));
  const channels = uniqueValues(records.map((record) => record.channelName));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter((record) => {
    const queryMatches =
      !normalizedQuery ||
      [record.id, record.ownerName, record.channelName, record.sourceType, record.rawExcerpt]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    return (
      queryMatches &&
      (ownerFilter === "all" || record.ownerId === ownerFilter) &&
      (typeFilter === "all" || record.sourceType === typeFilter) &&
      (channelFilter === "all" || record.channelName === channelFilter) &&
      (scoreFilter === "all" || credibilityProfiles.get(record.id)?.grade === scoreFilter)
    );
  });

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="证据总数" value={records.length} />
        <Metric label="筛选结果" value={filteredRecords.length} />
        <Metric label="平均证据分" value={coverageAudit.averageScore} tone={coverageAudit.averageScore >= 68 ? "ok" : "warn"} />
        <Metric label="强证据" value={coverageAudit.strongCount} tone="ok" />
        <Metric label="可评审" value={coverageAudit.reviewableCount} />
        <Metric label="证据缺口" value={coverageAudit.gaps.length} tone={coverageAudit.gaps.length ? "warn" : "ok"} />
      </section>

      <section className="panel wide evidence-scoreboard">
        <div className="panel-heading">
          <h3>证据覆盖审计</h3>
          <small>评分口径：来源、可追溯、截图、用户信号、交叉覆盖、近期性。</small>
        </div>
        <div className="evidence-audit-grid">
          <article>
            <strong>平台覆盖</strong>
            <p>iOS {coverageAudit.iosCount} / Android {coverageAudit.androidCount} / Website {coverageAudit.websiteCount}</p>
          </article>
          <article>
            <strong>来源覆盖</strong>
            <p>{coverageAudit.sourceTypeCount} 类来源 / {coverageAudit.channelCount} 个渠道</p>
          </article>
          <article>
            <strong>用户与截图</strong>
            <p>评论 {coverageAudit.reviewCount} / 社媒 {coverageAudit.socialCount} / 截图 {coverageAudit.screenshotCount}</p>
          </article>
          <article>
            <strong>评分分布</strong>
            <p>强 {coverageAudit.strongCount} / 可评审 {coverageAudit.reviewableCount} / 待补 {coverageAudit.weakCount} / 不足 {coverageAudit.insufficientCount}</p>
          </article>
        </div>
        <div className="evidence-gap-strip">
          {(coverageAudit.gaps.length > 0 ? coverageAudit.gaps : ["证据覆盖暂可支撑报告和需求评审，继续补充近期截图和评论样本。"]).map((gap) => (
            <span key={gap}>{gap}</span>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>证据筛选</h3>
          <small>按对象、来源、渠道和关键词定位证据</small>
        </div>
        <div className="filter-bar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索证据 ID、对象、渠道、摘录" />
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">全部类型</option>
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value)}>
            <option value="all">全部渠道</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
          <select value={scoreFilter} onChange={(event) => setScoreFilter(event.target.value as EvidenceCredibilityGrade | "all")}>
            <option value="all">全部证据等级</option>
            <option value="strong">强证据</option>
            <option value="reviewable">可评审</option>
            <option value="weak">待补证据</option>
            <option value="insufficient">证据不足</option>
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>证据列表</h3>
          <small>{filteredRecords.length} 条</small>
        </div>
        {filteredRecords.length === 0 ? (
          <EmptyState title="没有匹配证据" text="调整筛选条件或先执行采集任务。" />
        ) : (
          <div className="evidence-grid">
            {filteredRecords.map((record) => {
              const credibility = credibilityProfiles.get(record.id) ?? buildEvidenceCredibilityProfile(data, record);
              return (
                <article className="evidence-item evidence-card" key={record.id}>
                  <div className="evidence-title">
                    <span className="tag">{record.sourceType}</span>
                    <strong>{record.ownerName}</strong>
                    <small>{record.channelName}</small>
                    <small>{record.capturedAt.slice(0, 10)}</small>
                    <span className={`score-pill ${evidenceCredibilityTone(credibility.grade)}`}>{credibility.gradeLabel} {credibility.score}</span>
                  </div>
                  <p>{record.rawExcerpt}</p>
                  <div className="evidence-meta">
                    <span>证据 ID：{record.id}</span>
                    <span>快照 {record.snapshotCount}</span>
                    <span>评论 {record.reviewCount}</span>
                    <span>{credibility.verdict}</span>
                  </div>
                  <div className="evidence-dimension-grid">
                    {credibility.dimensions.map((dimension) => (
                      <span key={`${record.id}-${dimension.key}`}>
                        <strong>{dimension.label} {dimension.score}</strong>
                        {dimension.summary}
                      </span>
                    ))}
                  </div>
                  <div className="evidence-gap-strip compact">
                    {(credibility.missingEvidence.length > 0 ? credibility.missingEvidence : [credibility.usageAdvice]).slice(0, 3).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  {record.screenshots.length > 0 ? <ScreenshotStrip ownerName={record.ownerName} screenshots={record.screenshots} /> : null}
                  {record.sourceUrl ? (
                    <a className="evidence-link" href={record.sourceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      打开来源
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function KnowledgeBaseView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const records = buildEvidenceRecords(data);
  const templates = knowledgeQuestionTemplates(data);
  const [question, setQuestion] = useState(templates[0] ?? "");
  const [submittedQuestion, setSubmittedQuestion] = useState(templates[0] ?? "");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const ownerOptions = [
    ...(data.state.currentOwnedApp ? [{ id: data.state.currentOwnedApp.id, name: data.state.currentOwnedApp.name }] : []),
    ...data.state.competitors.map((competitor) => ({ id: competitor.id, name: competitor.name }))
  ];
  const sourceTypes = uniqueValues(records.map((record) => record.sourceType));
  const answer = submittedQuestion ? buildKnowledgeAnswer(data, submittedQuestion, ownerFilter, sourceTypeFilter) : undefined;
  const relatedDecisionCount = answer
    ? buildProductDecisionBriefs(data).filter((brief) => answer.evidenceHits.some((hit) => brief.packageItem.evidenceIds.includes(hit.record.id))).length
    : 0;

  const appendKnowledgeToReport = () => {
    if (!latestReport || !answer) {
      return;
    }
    const marker = `### 知识库问答：${answer.question}`;
    const nextMarkdown = latestReport.markdown.includes(marker)
      ? latestReport.markdown
      : `${latestReport.markdown}\n\n## 竞品知识库补充\n\n${answer.reportSnippet}`;
    void runAction("knowledge-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="证据总数" value={records.length} />
        <Metric label="命中证据" value={answer?.evidenceHits.length ?? 0} />
        <Metric label="问答置信度" value={answer?.confidence ?? 0} tone={answer && answer.confidence >= 70 ? "ok" : "warn"} />
        <Metric label="证据缺口" value={answer?.missingEvidence.length ?? 0} tone={answer?.missingEvidence.length ? "warn" : "ok"} />
        <Metric label="关联决策" value={relatedDecisionCount} />
        <Metric label="可写周报" value={latestReport ? 1 : 0} />
      </section>

      <section className="panel wide knowledge-ask-panel">
        <div className="panel-heading">
          <h3>竞品知识库问答</h3>
          <small>只基于当前 App 已归档 Evidence 回答；证据不足会直接提示补证。</small>
        </div>
        <div className="knowledge-question-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && question.trim()) {
                setSubmittedQuestion(question.trim());
              }
            }}
            placeholder="例如：最近哪些竞品在强化 AI？"
          />
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {ownerOptions.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <select value={sourceTypeFilter} onChange={(event) => setSourceTypeFilter(event.target.value)}>
            <option value="all">全部证据</option>
            {sourceTypes.map((sourceType) => (
              <option key={sourceType} value={sourceType}>
                {sourceType}
              </option>
            ))}
          </select>
          <button className="primary" disabled={!question.trim()} onClick={() => setSubmittedQuestion(question.trim())}>
            <Search size={15} />
            分析问题
          </button>
        </div>
        <div className="knowledge-template-row">
          {templates.map((template) => (
            <button
              className={submittedQuestion === template ? "tag active" : "tag"}
              key={template}
              onClick={() => {
                setQuestion(template);
                setSubmittedQuestion(template);
              }}
            >
              {template}
            </button>
          ))}
        </div>
      </section>

      {!answer ? (
        <EmptyState title="还没有问题" text="输入一个竞品问题，系统会基于 Evidence 生成可回溯回答。" />
      ) : (
        <section className="panel wide knowledge-board">
          <div className="knowledge-answer-panel">
            <div className="knowledge-answer-hero">
              <div>
                <span className={`score-pill ${persuasivenessTone(answer.confidence)}`}>置信度 {answer.confidence}%</span>
                <h3>{answer.question}</h3>
                <p>{answer.answer}</p>
              </div>
              <button className="secondary" disabled={!latestReport} onClick={appendKnowledgeToReport}>
                <FileText size={15} />
                写入周报
              </button>
            </div>

            <div className="knowledge-section">
              <h3>核心发现</h3>
              <ul className="mini-list review-checklist">
                {answer.findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>

            <div className="knowledge-section">
              <h3>风险判断</h3>
              <ul className="mini-list review-checklist">
                {answer.risks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="knowledge-section">
              <h3>下一步动作</h3>
              <div className="action-chip-grid">
                {answer.nextActions.map((action) => (
                  <span key={action}>{action}</span>
                ))}
              </div>
            </div>

            <div className="knowledge-section">
              <h3>周报片段</h3>
              <pre className="decision-prd-preview">{answer.reportSnippet}</pre>
            </div>
          </div>

          <div className="knowledge-evidence-panel">
            <div className="panel-heading nested-heading">
              <h3>证据缺口</h3>
              <small>{answer.missingEvidence.length} 项</small>
            </div>
            {answer.missingEvidence.length === 0 ? (
              <div className="evidence-list empty">当前回答的证据覆盖较完整。</div>
            ) : (
              <div className="evidence-gap-grid">
                {answer.missingEvidence.map((gap) => (
                  <article className="evidence-gap-card" key={gap}>
                    <strong>{gap}</strong>
                    <p>补齐后再把结论推进到需求评审或周报强结论。</p>
                  </article>
                ))}
              </div>
            )}

            <div className="panel-heading nested-heading knowledge-hit-heading">
              <h3>命中证据</h3>
              <small>{answer.evidenceHits.length} 条</small>
            </div>
            <div className="knowledge-hit-list">
              {answer.evidenceHits.map((hit) => (
                <article className="evidence-item evidence-card" key={hit.record.id}>
                  <div className="evidence-title">
                    <span className="tag">{hit.record.sourceType}</span>
                    <strong>{hit.record.ownerName}</strong>
                    <small>相关度 {hit.score}</small>
                  </div>
                  <p>{hit.record.rawExcerpt}</p>
                  <div className="evidence-meta">
                    <span>{hit.record.channelName}</span>
                    <span>{hit.record.capturedAt.slice(0, 10)}</span>
                    <span>匹配 {hit.matchedTerms.join("、") || "上下文"}</span>
                  </div>
                  {hit.record.screenshots.length > 0 ? <ScreenshotStrip ownerName={hit.record.ownerName} screenshots={hit.record.screenshots.slice(0, 3)} /> : null}
                  <EvidenceList data={data} evidenceIds={[hit.record.id]} />
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CompetitorDetailView({ data }: { data: ApiStateResponse }) {
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(data.state.competitors[0]?.id ?? "");

  useEffect(() => {
    if (!data.state.competitors.some((competitor) => competitor.id === selectedCompetitorId)) {
      setSelectedCompetitorId(data.state.competitors[0]?.id ?? "");
    }
  }, [data.state.competitors, selectedCompetitorId]);

  const competitor = data.state.competitors.find((item) => item.id === selectedCompetitorId) ?? data.state.competitors[0];
  if (!competitor) {
    return <EmptyState title="暂无竞品" text="先在 App 与竞品页面添加竞品。" />;
  }

  const channels = channelsFor(data, competitor);
  const snapshots = data.state.snapshots
    .filter((snapshot) => snapshot.competitorId === competitor.id)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
  const reviews = data.state.reviews
    .filter((review) => review.competitorId === competitor.id)
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt));
  const moduleAnalyses = moduleAnalysisTypes.map((moduleType) => ({
    moduleType,
    analysis: competitorModuleAnalysisFor(data, competitor, moduleType)
  }));
  const features = normalizeFeatures(data.state.features);
  const gapFeatures = features.filter((feature) => {
    const support = feature.competitorSupport[competitor.id];
    return (support === "owned" || support === "advantage") && (feature.currentAppSupport === "missing" || feature.currentAppSupport === "partial");
  });
  const advantageFeatures = features.filter((feature) => feature.currentAppSupport === "advantage" && feature.competitorSupport[competitor.id] !== "advantage");
  const evidenceIds = Array.from(
    new Set([
      ...snapshots.map((snapshot) => snapshot.evidenceId),
      ...reviews.map((review) => review.evidenceId),
      ...moduleAnalyses.flatMap((item) => item.analysis.evidenceIds)
    ])
  );

  return (
    <div className="page-grid">
      <section className="panel wide">
        <div className="panel-heading">
          <h3>竞品详情</h3>
          <select className="inline-select" value={competitor.id} onChange={(event) => setSelectedCompetitorId(event.target.value)}>
            {data.state.competitors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="detail-hero">
          <div>
            <span className="tag">{competitor.priority}</span>
            <h3>{competitor.name}</h3>
            <p>{competitor.category}</p>
          </div>
          <dl className="compact-detail">
            <div>
              <dt>状态</dt>
              <dd>{statusLabel(competitor.status)}</dd>
            </div>
            <div>
              <dt>官网</dt>
              <dd>
                {competitor.websiteUrl ? (
                  <a href={competitor.websiteUrl} target="_blank" rel="noreferrer">
                    {competitor.websiteUrl}
                  </a>
                ) : (
                  "未配置"
                )}
              </dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{competitor.updatedAt.slice(0, 10)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="metric-grid">
        <Metric label="渠道" value={channels.length} />
        <Metric label="快照" value={snapshots.length} />
        <Metric label="评论" value={reviews.length} />
        <Metric label="模块分析" value={moduleAnalyses.length} />
        <Metric label="功能差距" value={gapFeatures.length} tone={gapFeatures.length ? "warn" : "ok"} />
        <Metric label="关联证据" value={evidenceIds.length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>模块分析</h3>
        </div>
        <div className="table-wrap module-detail-table">
          <table>
            <thead>
              <tr>
                <th>模块</th>
                <th>判断</th>
                <th>信号</th>
                <th>建议</th>
                <th>置信度</th>
              </tr>
            </thead>
            <tbody>
              {moduleAnalyses.map(({ moduleType, analysis }) => (
                <tr key={moduleType}>
                  <td>{moduleAnalysisLabels[moduleType]}</td>
                  <td>{analysis.summary}</td>
                  <td>{moduleListText(analysis.signals)}</td>
                  <td>{analysis.recommendation}</td>
                  <td>{Math.round(analysis.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>渠道覆盖</h3>
        </div>
        <div className="item-list">
          {channels.length === 0 ? (
            <EmptyState title="暂无渠道" text="在 App 与竞品页为该竞品绑定渠道。" />
          ) : (
            channels.map((channel) => (
              <article className="feature-summary" key={channel.id}>
                <strong>{channel.channelName}</strong>
                <span>{statusLabel(channel.crawlStatus)} / {channel.collectionMode}</span>
                <p>
                  <a href={channel.storeUrl} target="_blank" rel="noreferrer">
                    {channel.storeUrl}
                  </a>
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>功能差距</h3>
        </div>
        <div className="item-list">
          {[...gapFeatures, ...advantageFeatures].length === 0 ? (
            <EmptyState title="暂无功能判断" text="执行分析后会生成功能矩阵。" />
          ) : (
            [...gapFeatures, ...advantageFeatures].slice(0, 6).map((feature) => (
              <article className="feature-summary" key={feature.id}>
                <strong>{feature.name}</strong>
                <span>{featureDecisionLabel(feature)} / 需求分 {feature.demandScore}</span>
                <p>{featureAction(feature)}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>版本快照</h3>
        </div>
        <div className="snapshot-grid">
          {snapshots.length === 0 ? (
            <EmptyState title="暂无快照" text="执行采集后展示版本、价格、评分、截图和更新说明。" />
          ) : (
            snapshots.map((snapshot) => {
              const evidence = data.state.evidence.find((item) => item.id === snapshot.evidenceId);
              return (
                <article className="snapshot-card" key={snapshot.id}>
                  <div>
                    <strong>{snapshot.version ?? "未知版本"}</strong>
                    <span>{snapshot.capturedAt.slice(0, 10)}</span>
                  </div>
                  <p>{snapshot.releaseNotes ?? snapshot.description ?? "暂无说明"}</p>
                  <small>{snapshot.rating ? `${snapshot.rating} 分` : "无评分"} / {snapshot.reviewCount ? `${snapshot.reviewCount} 条评论` : "无评论量"} / {snapshot.priceText ?? "暂无价格"}</small>
                  {snapshot.screenshots.length > 0 ? <ScreenshotStrip ownerName={competitor.name} screenshots={snapshot.screenshots} /> : null}
                  {evidence?.sourceUrl ? (
                    <a className="evidence-link" href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} />
                      打开来源
                    </a>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>评论样本</h3>
        </div>
        <div className="review-grid">
          {reviews.length === 0 ? (
            <EmptyState title="暂无评论" text="执行采集后展示评论样本。" />
          ) : (
            reviews.slice(0, 12).map((review) => (
              <article className="review-card" key={review.id}>
                <div className="item-header">
                  <strong>{review.rating} 分</strong>
                  <span>{review.capturedAt.slice(0, 10)}</span>
                </div>
                <p>{review.content}</p>
                <small>{review.topicHint ?? "未分类"} / {review.version ?? "未知版本"}</small>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>关联证据</h3>
          <small>{evidenceIds.length} 条</small>
        </div>
        <EvidenceList data={data} evidenceIds={evidenceIds} />
      </section>
    </div>
  );
}

// @SpecId: ACI-FLOW-SETUP-001
function PortfolioView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const activeApp = data.state.currentOwnedApp;
  const defaultProjectId = activeApp?.projectId ?? data.state.projects[0]?.id ?? "project_cn_pm";
  const [newAppDraft, setNewAppDraft] = useState({
    name: "",
    category: "影像 / App",
    owner: "产品团队",
    platforms: ["ios", "android"] as OwnedApp["platforms"],
    featureTemplate: "通用 App",
    websiteUrl: "",
    appStoreUrl: "",
    androidStoreUrls: ""
  });
  const [appDraft, setAppDraft] = useState({
    name: "",
    category: "",
    owner: "",
    platforms: ["ios", "android"] as OwnedApp["platforms"],
    featureTemplate: "",
    websiteUrl: "",
    appStoreUrl: "",
    androidStoreUrls: ""
  });
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    category: activeApp?.category ?? "影像 / App",
    priority: "P1" as Priority,
    websiteUrl: ""
  });
  const [editingCompetitorId, setEditingCompetitorId] = useState<string>();
  const [competitorDrafts, setCompetitorDrafts] = useState<Record<string, Pick<Competitor, "name" | "category" | "priority" | "status"> & { websiteUrl: string }>>({});
  const [channelOwner, setChannelOwner] = useState("");
  const [channelName, setChannelName] = useState<ChannelName>("App Store China");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelNotice, setChannelNotice] = useState("");

  useEffect(() => {
    if (activeApp) {
      setAppDraft({
        name: activeApp.name,
        category: activeApp.category,
        owner: activeApp.owner,
        platforms: activeApp.platforms,
        featureTemplate: activeApp.featureTemplate,
        websiteUrl: activeApp.websiteUrl ?? "",
        appStoreUrl: activeApp.appStoreUrl ?? "",
        androidStoreUrls: activeApp.androidStoreUrls.join(", ")
      });
      setChannelOwner(activeApp.id);
      setNewCompetitor((current) => ({ ...current, category: activeApp.category }));
    }
  }, [activeApp?.id, activeApp?.updatedAt]);

  useEffect(() => {
    setCompetitorDrafts(
      Object.fromEntries(
        data.state.competitors.map((competitor) => [
          competitor.id,
          {
            name: competitor.name,
            category: competitor.category,
            priority: competitor.priority,
            status: competitor.status,
            websiteUrl: competitor.websiteUrl ?? ""
          }
        ])
      )
    );
  }, [data.state.competitors]);

  function toggleDraftPlatform(kind: "new" | "current", platform: "ios" | "android") {
    const updater = kind === "new" ? setNewAppDraft : setAppDraft;
    updater((current) => {
      const nextPlatforms = current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform];
      return { ...current, platforms: nextPlatforms.length > 0 ? (nextPlatforms as OwnedApp["platforms"]) : current.platforms };
    });
  }

  const ownerOptions = channelOwnerOptions(data);
  const selectedOwner = ownerOptions.find((owner) => owner.id === channelOwner) ?? ownerOptions[0];
  const selectedOwnerChannels = channelsForOwner(data, selectedOwner?.id);

  return (
    <div className="page-grid">
      <section className="panel">
        <div className="panel-heading">
          <h3>新增自有 App</h3>
        </div>
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!newAppDraft.name.trim()) {
              return;
            }
            void runAction("create-app", () =>
              postJson<ApiStateResponse>("/api/owned-apps", {
                projectId: defaultProjectId,
                name: newAppDraft.name,
                category: newAppDraft.category,
                owner: newAppDraft.owner,
                platforms: newAppDraft.platforms,
                featureTemplate: newAppDraft.featureTemplate,
                websiteUrl: optionalText(newAppDraft.websiteUrl),
                appStoreUrl: optionalText(newAppDraft.appStoreUrl),
                androidStoreUrls: splitUrlList(newAppDraft.androidStoreUrls)
              })
            );
            setNewAppDraft((current) => ({ ...current, name: "", websiteUrl: "", appStoreUrl: "", androidStoreUrls: "" }));
          }}
        >
          <div className="form-row">
            <input value={newAppDraft.name} onChange={(event) => setNewAppDraft((current) => ({ ...current, name: event.target.value }))} placeholder="App 名称，例如 SODA、Foodie、EPIK" />
            <input value={newAppDraft.category} onChange={(event) => setNewAppDraft((current) => ({ ...current, category: event.target.value }))} placeholder="分类" />
          </div>
          <div className="form-row">
            <input value={newAppDraft.owner} onChange={(event) => setNewAppDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="负责人 / 团队" />
            <input value={newAppDraft.featureTemplate} onChange={(event) => setNewAppDraft((current) => ({ ...current, featureTemplate: event.target.value }))} placeholder="功能模板" />
          </div>
          <div className="form-row">
            <input value={newAppDraft.websiteUrl} onChange={(event) => setNewAppDraft((current) => ({ ...current, websiteUrl: event.target.value }))} placeholder="官网 URL" />
            <input value={newAppDraft.appStoreUrl} onChange={(event) => setNewAppDraft((current) => ({ ...current, appStoreUrl: event.target.value }))} placeholder="App Store URL" />
          </div>
          <input value={newAppDraft.androidStoreUrls} onChange={(event) => setNewAppDraft((current) => ({ ...current, androidStoreUrls: event.target.value }))} placeholder="安卓渠道 URL，多个用逗号分隔" />
          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={newAppDraft.platforms.includes("ios")} onChange={() => toggleDraftPlatform("new", "ios")} />
              iOS
            </label>
            <label>
              <input type="checkbox" checked={newAppDraft.platforms.includes("android")} onChange={() => toggleDraftPlatform("new", "android")} />
              Android
            </label>
          </div>
          <button className="primary" type="submit">
            <Plus size={16} />
            添加
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>当前 App</h3>
          {activeApp ? <strong>{statusLabel(activeApp.status)}</strong> : null}
        </div>
        {!activeApp ? (
          <EmptyState title="没有当前 App" text="先新增一个自有 App，再维护竞品和渠道。" />
        ) : (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction("update-app", () =>
                patchJson<ApiStateResponse>(`/api/owned-apps/${activeApp.id}`, {
                  name: appDraft.name,
                  category: appDraft.category,
                  owner: appDraft.owner,
                  platforms: appDraft.platforms,
                  featureTemplate: appDraft.featureTemplate,
                  websiteUrl: optionalText(appDraft.websiteUrl),
                  appStoreUrl: optionalText(appDraft.appStoreUrl),
                  androidStoreUrls: splitUrlList(appDraft.androidStoreUrls)
                })
              );
            }}
          >
            <div className="form-row">
              <input value={appDraft.name} onChange={(event) => setAppDraft((current) => ({ ...current, name: event.target.value }))} placeholder="App 名称" />
              <input value={appDraft.category} onChange={(event) => setAppDraft((current) => ({ ...current, category: event.target.value }))} placeholder="分类" />
            </div>
            <div className="form-row">
              <input value={appDraft.owner} onChange={(event) => setAppDraft((current) => ({ ...current, owner: event.target.value }))} placeholder="负责人 / 团队" />
              <input value={appDraft.featureTemplate} onChange={(event) => setAppDraft((current) => ({ ...current, featureTemplate: event.target.value }))} placeholder="功能模板" />
            </div>
            <div className="form-row">
              <input value={appDraft.websiteUrl} onChange={(event) => setAppDraft((current) => ({ ...current, websiteUrl: event.target.value }))} placeholder="官网 URL" />
              <input value={appDraft.appStoreUrl} onChange={(event) => setAppDraft((current) => ({ ...current, appStoreUrl: event.target.value }))} placeholder="App Store URL" />
            </div>
            <input value={appDraft.androidStoreUrls} onChange={(event) => setAppDraft((current) => ({ ...current, androidStoreUrls: event.target.value }))} placeholder="安卓渠道 URL，多个用逗号分隔" />
            <div className="toggle-row">
              <label>
                <input type="checkbox" checked={appDraft.platforms.includes("ios")} onChange={() => toggleDraftPlatform("current", "ios")} />
                iOS
              </label>
              <label>
                <input type="checkbox" checked={appDraft.platforms.includes("android")} onChange={() => toggleDraftPlatform("current", "android")} />
                Android
              </label>
            </div>
            <div className="button-row">
              <button className="primary" type="submit">
                <Check size={16} />
                保存
              </button>
              {activeApp.status === "Archived" ? (
                <button className="ghost" type="button" onClick={() => void runAction("restore-app", () => patchJson<ApiStateResponse>(`/api/owned-apps/${activeApp.id}`, { status: "Active" }))}>
                  <RefreshCw size={16} />
                  恢复
                </button>
              ) : (
                <button className="ghost" type="button" onClick={() => void runAction("archive-app", () => deletePath<ApiStateResponse>(`/api/owned-apps/${activeApp.id}?retainHistory=true`))}>
                  <Archive size={16} />
                  归档
                </button>
              )}
              <button className="danger" type="button" onClick={() => void runAction("delete-app", () => deletePath<ApiStateResponse>(`/api/owned-apps/${activeApp.id}?retainHistory=false`))}>
                <Trash2 size={16} />
                删除
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>新增竞品</h3>
        </div>
        {!activeApp ? (
          <EmptyState title="未选择自有 App" text="创建或选择自有 App 后再添加竞品。" />
        ) : (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!newCompetitor.name.trim()) {
                return;
              }
              void runAction("create-competitor", () =>
                postJson<ApiStateResponse>("/api/competitors", {
                  ownedAppId: activeApp.id,
                  name: newCompetitor.name,
                  category: newCompetitor.category,
                  priority: newCompetitor.priority,
                  websiteUrl: optionalText(newCompetitor.websiteUrl)
                })
              );
              setNewCompetitor((current) => ({ ...current, name: "", websiteUrl: "" }));
            }}
          >
            <div className="form-row">
              <input value={newCompetitor.name} onChange={(event) => setNewCompetitor((current) => ({ ...current, name: event.target.value }))} placeholder="竞品 App 名称" />
              <input value={newCompetitor.category} onChange={(event) => setNewCompetitor((current) => ({ ...current, category: event.target.value }))} placeholder="分类 / 定位" />
            </div>
            <div className="form-row">
              <select value={newCompetitor.priority} onChange={(event) => setNewCompetitor((current) => ({ ...current, priority: event.target.value as Priority }))}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <input value={newCompetitor.websiteUrl} onChange={(event) => setNewCompetitor((current) => ({ ...current, websiteUrl: event.target.value }))} placeholder="官网 URL" />
            </div>
            <button className="primary" type="submit">
              <Plus size={16} />
              添加
            </button>
          </form>
        )}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>新增渠道</h3>
        </div>
        {!activeApp || !selectedOwner ? (
          <EmptyState title="未选择对象" text="创建自有 App 或竞品后再绑定渠道。" />
        ) : (
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (channelRequiresUrl(channelName) && !channelUrl.trim()) {
                return;
              }
              const trimmedChannelUrl = channelUrl.trim();
              const existingChannel = selectedOwnerChannels.find((channel) => channel.channelName === channelName);
              const submittedChannelName = channelName;
              const submittedOwnerLabel = selectedOwner.label;
              void runAction("create-channel", async () => {
                const response = existingChannel
                  ? await patchJson<ApiStateResponse>(`/api/channels/${existingChannel.id}`, {
                      ownedAppId: activeApp.id,
                      storeUrl: trimmedChannelUrl || existingChannel.storeUrl,
                      collectionMode: channelCollectionMode(channelName),
                      complianceStatus: channelComplianceStatus(channelName)
                    })
                  : await postJson<ApiStateResponse>("/api/channels", {
                      ownedAppId: activeApp.id,
                      ownerType: selectedOwner.type,
                      ownerId: selectedOwner.id,
                      channelName,
                      storeUrl: trimmedChannelUrl,
                      collectionMode: channelCollectionMode(channelName),
                      complianceStatus: channelComplianceStatus(channelName)
                    });
                setChannelNotice(`${submittedOwnerLabel} 已绑定 ${submittedChannelName}${existingChannel && trimmedChannelUrl ? "，链接已更新" : ""}`);
                return response;
              });
              setChannelUrl("");
            }}
          >
            <select
              value={channelOwner}
              onChange={(event) => {
                setChannelOwner(event.target.value);
                setChannelNotice("");
              }}
            >
              {ownerOptions.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.label}
                </option>
              ))}
            </select>
            <select
              value={channelName}
              onChange={(event) => {
                setChannelName(event.target.value as ChannelName);
                setChannelNotice("");
              }}
            >
              {channelOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={channelUrl}
              onChange={(event) => setChannelUrl(event.target.value)}
              placeholder={channelRequiresUrl(channelName) ? "商店或官网链接，必填" : "渠道链接，可先留空后补"}
            />
            <small>OPPO、vivo、华为、小米、应用宝可先作为手动样本渠道添加，链接后续补齐。</small>
            <button className="primary" type="submit">
              <Plus size={16} />
              绑定渠道
            </button>
            {channelNotice ? <strong className="success-copy">{channelNotice}</strong> : null}
            <div className="mini-channel-list">
              <strong>当前对象已绑定渠道</strong>
              {selectedOwnerChannels.length === 0 ? (
                <span>暂无渠道</span>
              ) : (
                <div className="tag-row">
                  {selectedOwnerChannels.map((channel) => (
                    <span key={channel.id}>
                      {channel.channelName} · {statusLabel(channel.crawlStatus)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>竞品清单</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>竞品</th>
                <th>分类</th>
                <th>优先级</th>
                <th>状态</th>
                <th>官网</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.state.competitors.length === 0 ? (
                <tr>
                  <td colSpan={6}>暂无竞品，先在上方添加。</td>
                </tr>
              ) : (
                data.state.competitors.map((competitor) => {
                  const draft = competitorDrafts[competitor.id] ?? {
                    name: competitor.name,
                    category: competitor.category,
                    priority: competitor.priority,
                    status: competitor.status,
                    websiteUrl: competitor.websiteUrl ?? ""
                  };
                  const isEditing = editingCompetitorId === competitor.id;
                  return (
                    <tr key={competitor.id}>
                      <td>
                        {isEditing ? (
                          <input value={draft.name} onChange={(event) => setCompetitorDrafts((current) => ({ ...current, [competitor.id]: { ...draft, name: event.target.value } }))} />
                        ) : (
                          competitor.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input value={draft.category} onChange={(event) => setCompetitorDrafts((current) => ({ ...current, [competitor.id]: { ...draft, category: event.target.value } }))} />
                        ) : (
                          competitor.category
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select value={draft.priority} onChange={(event) => setCompetitorDrafts((current) => ({ ...current, [competitor.id]: { ...draft, priority: event.target.value as Priority } }))}>
                            {priorityOptions.map((priority) => (
                              <option key={priority} value={priority}>
                                {priority}
                              </option>
                            ))}
                          </select>
                        ) : (
                          competitor.priority
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select value={draft.status} onChange={(event) => setCompetitorDrafts((current) => ({ ...current, [competitor.id]: { ...draft, status: event.target.value as Competitor["status"] } }))}>
                            <option value="Active">启用</option>
                            <option value="Archived">归档</option>
                          </select>
                        ) : (
                          statusLabel(competitor.status)
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input value={draft.websiteUrl} onChange={(event) => setCompetitorDrafts((current) => ({ ...current, [competitor.id]: { ...draft, websiteUrl: event.target.value } }))} />
                        ) : competitor.websiteUrl ? (
                          <a href={competitor.websiteUrl} target="_blank" rel="noreferrer">
                            官网
                          </a>
                        ) : (
                          "无"
                        )}
                      </td>
                      <td>
                        <div className="button-row compact-actions">
                          {isEditing ? (
                            <>
                              <button
                                className="primary"
                                type="button"
                                onClick={() => {
                                  if (!activeApp) {
                                    return;
                                  }
                                  void runAction("update-competitor", () =>
                                    patchJson<ApiStateResponse>(`/api/competitors/${competitor.id}`, {
                                      ownedAppId: activeApp.id,
                                      name: draft.name,
                                      category: draft.category,
                                      priority: draft.priority,
                                      status: draft.status,
                                      websiteUrl: optionalText(draft.websiteUrl)
                                    })
                                  );
                                  setEditingCompetitorId(undefined);
                                }}
                              >
                                <Check size={15} />
                                保存
                              </button>
                              <button className="ghost" type="button" onClick={() => setEditingCompetitorId(undefined)}>
                                <X size={15} />
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="ghost" type="button" onClick={() => setEditingCompetitorId(competitor.id)}>
                                <Settings2 size={15} />
                                编辑
                              </button>
                              {competitor.status === "Archived" ? (
                                <button className="ghost" type="button" onClick={() => activeApp && void runAction("restore-competitor", () => patchJson<ApiStateResponse>(`/api/competitors/${competitor.id}`, { ownedAppId: activeApp.id, status: "Active" }))}>
                                  <RefreshCw size={15} />
                                  恢复
                                </button>
                              ) : (
                                <button className="ghost" type="button" onClick={() => void runAction("archive-competitor", () => deletePath<ApiStateResponse>(`/api/competitors/${competitor.id}?retainHistory=true`))}>
                                  <Archive size={15} />
                                  归档
                                </button>
                              )}
                              <button className="danger" type="button" onClick={() => void runAction("delete-competitor", () => deletePath<ApiStateResponse>(`/api/competitors/${competitor.id}?retainHistory=false`))}>
                                <Trash2 size={15} />
                                删除
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CoverageMapView({ data }: { data: ApiStateResponse }) {
  const rows = buildCoverageMap(data);
  const [dimensionFilter, setDimensionFilter] = useState<CoverageDimension | "all">("all");
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(rows[0]?.ownerId);
  const dimensions: CoverageDimension[] = ["ios", "android", "website", "reviews", "social", "price", "feature", "report"];
  const selectedRow = rows.find((row) => row.ownerId === selectedOwnerId) ?? rows[0];
  const filteredCells = selectedRow?.cells.filter((cell) => dimensionFilter === "all" || cell.dimension === dimensionFilter) ?? [];
  const missingCells = rows.flatMap((row) => row.cells.filter((cell) => cell.status === "missing").map((cell) => ({ row, cell })));
  const strongCells = rows.flatMap((row) => row.cells).filter((cell) => cell.status === "strong").length;
  const averageScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.totalScore, 0) / rows.length) : 0;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="对象数" value={rows.length} />
        <Metric label="平均覆盖" value={averageScore} tone={averageScore >= 70 ? "ok" : "warn"} />
        <Metric label="完整覆盖格" value={strongCells} />
        <Metric label="缺失覆盖格" value={missingCells.length} tone={missingCells.length ? "warn" : "ok"} />
        <Metric label="P0 竞品" value={rows.filter((row) => row.priority === "P0").length} />
        <Metric label="证据数" value={uniqueValues(rows.flatMap((row) => row.cells.flatMap((cell) => cell.evidenceIds))).length} />
      </section>

      <section className="panel wide coverage-summary-panel">
        <div className="panel-heading">
          <h3>监控覆盖摘要</h3>
          <small>判断哪些竞品和渠道缺数据，避免分析结论建立在覆盖盲区上。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>覆盖最好</strong>
            <p>{rows[0] ? `${rows[0].ownerName}，覆盖分 ${rows[0].totalScore}` : "暂无对象。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最大缺口</strong>
            <p>{missingCells[0] ? `${missingCells[0].row.ownerName} / ${missingCells[0].cell.label}：${missingCells[0].cell.nextAction}` : "暂无明显覆盖缺口。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>使用边界</strong>
            <p>覆盖分用于判断数据可靠性，不等于竞品强弱或市场表现。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>覆盖筛选</h3>
          <small>{rows.length} 个对象</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={dimensionFilter} onChange={(event) => setDimensionFilter(event.target.value as CoverageDimension | "all")}>
            <option value="all">全部维度</option>
            {dimensions.map((dimension) => (
              <option key={dimension} value={dimension}>
                {coverageDimensionLabel(dimension)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide coverage-map-workbench">
        <div className="coverage-matrix-panel">
          <div className="panel-heading nested-heading">
            <h3>对象覆盖矩阵</h3>
          </div>
          <div className="table-wrap coverage-table">
            <table>
              <thead>
                <tr>
                  <th>对象</th>
                  <th>覆盖分</th>
                  {dimensions.map((dimension) => (
                    <th key={dimension}>{coverageDimensionLabel(dimension)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.ownerId} className={selectedRow?.ownerId === row.ownerId ? "active-row" : undefined} onClick={() => setSelectedOwnerId(row.ownerId)}>
                    <td>
                      <strong>{row.ownerName}</strong>
                      <small>{row.ownerType === "owned_app" ? "自有 App" : row.priority ?? "P2"}</small>
                    </td>
                    <td>
                      <span className={`score-pill ${persuasivenessTone(row.totalScore)}`}>{row.totalScore}</span>
                    </td>
                    {dimensions.map((dimension) => {
                      const cell = row.cells.find((item) => item.dimension === dimension);
                      return (
                        <td key={dimension}>
                          {cell ? <span className={`coverage-status coverage-${cell.status}`}>{coverageStatusLabel(cell.status)}</span> : "无"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="coverage-detail-panel">
          {!selectedRow ? (
            <EmptyState title="未选择对象" text="从矩阵中选择一个对象查看覆盖详情。" />
          ) : (
            <>
              <div className="coverage-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedRow.totalScore)}`}>覆盖分 {selectedRow.totalScore}</span>
                  <h3>{selectedRow.ownerName}</h3>
                  <p>{selectedRow.blockers[0] ?? "当前对象关键覆盖相对完整，继续保持定期采集。"}</p>
                </div>
                <span className="rank-chip">{selectedRow.ownerType === "owned_app" ? "自有 App" : selectedRow.priority ?? "P2"}</span>
              </div>

              <section className="coverage-section">
                <div className="panel-heading nested-heading">
                  <h3>覆盖详情</h3>
                  <small>{filteredCells.length} 项</small>
                </div>
                <div className="coverage-cell-grid">
                  {filteredCells.map((cell) => (
                    <article className={`coverage-cell coverage-${cell.status}`} key={cell.dimension}>
                      <div className="decision-card-top">
                        <strong>{cell.label}</strong>
                        <span>{coverageStatusLabel(cell.status)}</span>
                      </div>
                      <p>{cell.detail}</p>
                      <small>{cell.nextAction}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="coverage-section">
                <div className="panel-heading nested-heading">
                  <h3>覆盖缺口</h3>
                  <small>{selectedRow.blockers.length} 条</small>
                </div>
                {selectedRow.blockers.length === 0 ? (
                  <div className="evidence-list empty">暂无明显覆盖缺口。</div>
                ) : (
                  <div className="coverage-blocker-list">
                    {selectedRow.blockers.map((blocker) => (
                      <span key={blocker}>{blocker}</span>
                    ))}
                  </div>
                )}
              </section>

              <section className="coverage-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{uniqueValues(selectedRow.cells.flatMap((cell) => cell.evidenceIds)).length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={uniqueValues(selectedRow.cells.flatMap((cell) => cell.evidenceIds)).slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// @SpecId: ACI-FLOW-CHANNEL-004
function ChannelsView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const activeApp = data.state.currentOwnedApp;
  const ownerOptions = channelOwnerOptions(data);
  const [channelOwner, setChannelOwner] = useState(activeApp?.id ?? "");
  const [channelName, setChannelName] = useState<ChannelName>("OPPO");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelNotice, setChannelNotice] = useState("");
  const selectedOwner = ownerOptions.find((owner) => owner.id === channelOwner) ?? ownerOptions[0];
  const selectedOwnerChannels = channelsForOwner(data, selectedOwner?.id);

  useEffect(() => {
    if (activeApp && !ownerOptions.some((owner) => owner.id === channelOwner)) {
      setChannelOwner(activeApp.id);
    }
  }, [activeApp?.id, channelOwner, ownerOptions]);

  return (
    <div className="page-grid">
      <section className="panel wide">
        <div className="panel-heading">
          <h3>新增渠道</h3>
          <small>国内安卓渠道支持先添加为手动样本，链接后续补齐。</small>
        </div>
        {!activeApp || !selectedOwner ? (
          <EmptyState title="未选择对象" text="创建自有 App 或竞品后再绑定渠道。" />
        ) : (
          <form
            className="form-grid social-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (channelRequiresUrl(channelName) && !channelUrl.trim()) {
                return;
              }
              const trimmedChannelUrl = channelUrl.trim();
              const existingChannel = selectedOwnerChannels.find((channel) => channel.channelName === channelName);
              const submittedChannelName = channelName;
              const submittedOwnerLabel = selectedOwner.label;
              void runAction("create-channel", async () => {
                const response = existingChannel
                  ? await patchJson<ApiStateResponse>(`/api/channels/${existingChannel.id}`, {
                      ownedAppId: activeApp.id,
                      storeUrl: trimmedChannelUrl || existingChannel.storeUrl,
                      collectionMode: channelCollectionMode(channelName),
                      complianceStatus: channelComplianceStatus(channelName)
                    })
                  : await postJson<ApiStateResponse>("/api/channels", {
                      ownedAppId: activeApp.id,
                      ownerType: selectedOwner.type,
                      ownerId: selectedOwner.id,
                      channelName,
                      storeUrl: trimmedChannelUrl,
                      collectionMode: channelCollectionMode(channelName),
                      complianceStatus: channelComplianceStatus(channelName)
                    });
                setChannelNotice(`${submittedOwnerLabel} 已绑定 ${submittedChannelName}${existingChannel && trimmedChannelUrl ? "，链接已更新" : ""}`);
                return response;
              });
              setChannelUrl("");
            }}
          >
            <label>
              对象
              <select
                value={selectedOwner.id}
                onChange={(event) => {
                  setChannelOwner(event.target.value);
                  setChannelNotice("");
                }}
              >
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              渠道
              <select
                value={channelName}
                onChange={(event) => {
                  setChannelName(event.target.value as ChannelName);
                  setChannelNotice("");
                }}
              >
                {channelOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              链接
              <input
                value={channelUrl}
                onChange={(event) => setChannelUrl(event.target.value)}
                placeholder={channelRequiresUrl(channelName) ? "商店或官网链接，必填" : "OPPO/vivo 等安卓渠道可先留空"}
              />
            </label>
            <div className="span-2">
              <span>新增后会进入渠道状态表；OPPO、vivo 默认是 ManualOnly，不会被当成抓取失败。</span>
            </div>
            <button className="primary" type="submit">
              <Plus size={16} />
              绑定渠道
            </button>
            <div className="span-3 mini-channel-list">
              {channelNotice ? <strong className="success-copy">{channelNotice}</strong> : null}
              <strong>当前对象已绑定渠道</strong>
              {selectedOwnerChannels.length === 0 ? (
                <span>暂无渠道</span>
              ) : (
                <div className="tag-row">
                  {selectedOwnerChannels.map((channel) => (
                    <span key={channel.id}>
                      {channel.channelName} · {statusLabel(channel.crawlStatus)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>渠道状态</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>对象</th>
                <th>渠道</th>
                <th>采集模式</th>
                <th>合规</th>
                <th>状态</th>
                <th>最近成功</th>
              </tr>
            </thead>
            <tbody>
              {data.state.channels.map((channel) => (
                <tr key={channel.id}>
                  <td>{ownerLabel(data, channel)}</td>
                  <td>{channelLink(channel)}</td>
                  <td>{channel.collectionMode}</td>
                  <td>{channel.complianceStatus}</td>
                  <td>{statusLabel(channel.crawlStatus)}</td>
                  <td>{channel.lastSuccessAt?.slice(0, 10) ?? channel.lastFailureReason ?? "无"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>快照记录</h3>
        </div>
        <div className="snapshot-grid">
          {data.state.snapshots.length === 0 ? (
            <EmptyState title="暂无快照" text="先执行采集任务，系统会记录版本、描述、价格、截图和证据。" />
          ) : (
            data.state.snapshots.map((snapshot) => {
              const evidence = data.state.evidence.find((item) => item.id === snapshot.evidenceId);
              return (
                <article className="snapshot-card" key={snapshot.id}>
                  <div>
                    <strong>{competitorName(data, snapshot.competitorId)}</strong>
                    <span>{snapshot.version ?? "未知版本"}</span>
                  </div>
                  <p>{snapshot.releaseNotes ?? snapshot.description ?? "暂无说明"}</p>
                  {snapshot.screenshots.length > 0 ? <ScreenshotStrip ownerName={competitorName(data, snapshot.competitorId)} screenshots={snapshot.screenshots} /> : null}
                  <div className="item-footer">
                    <span>证据：{snapshot.evidenceId}</span>
                    {evidence?.sourceUrl ? (
                      <a href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                        来源链接
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function InsightsView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  return (
    <section className="panel wide">
      <div className="panel-heading">
        <h3>评论洞察</h3>
      </div>
      <div className="item-list">
        {data.state.insights.length === 0 ? (
          <EmptyState title="暂无洞察" text="导入评论或执行分析后，这里会按主题聚类。" />
        ) : (
          data.state.insights.map((insight) => (
            <InsightCard
              key={insight.id}
              data={data}
              insight={insight}
              actions={
                <>
                  <button className="ghost" onClick={() => void runAction("confirm-insight", () => postJson<ApiStateResponse>(`/api/insights/${insight.id}/status`, { status: "Confirmed" }))}>
                    <Check size={16} />
                    确认
                  </button>
                  <button className="ghost" onClick={() => void runAction("dismiss-insight", () => postJson<ApiStateResponse>(`/api/insights/${insight.id}/status`, { status: "Dismissed" }))}>
                    <X size={16} />
                    忽略
                  </button>
                  <button className="primary" onClick={() => void runAction("convert-insight", () => postJson<ApiStateResponse>("/api/requirements/from-insight", { insightId: insight.id }))}>
                    <Send size={16} />
                    转需求
                  </button>
                </>
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

function InsightCard({
  data,
  insight,
  actions,
  compact
}: {
  data: ApiStateResponse;
  insight: Insight;
  actions?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <article className="insight-card">
      <div className="item-header">
        <div>
          <span className="tag">{insight.label}</span>
          <span className={`severity ${insight.severity}`}>{insight.severity}</span>
        </div>
        <strong>{statusLabel(insight.status)}</strong>
      </div>
      <h4>{insight.title}</h4>
      <p>{insight.summary}</p>
      {!compact ? <EvidenceList data={data} evidenceIds={insight.evidenceIds} /> : null}
      <div className="item-footer">
        <span>置信度 {Math.round(insight.confidence * 100)}%</span>
        <span>证据 {insight.evidenceIds.length} 条</span>
      </div>
      {actions ? <div className="button-row">{actions}</div> : null}
    </article>
  );
}

function EvidenceList({ data, evidenceIds }: { data: ApiStateResponse; evidenceIds: string[] }) {
  const recordById = new Map(buildEvidenceRecords(data).map((record) => [record.id, record]));
  const evidenceItems = evidenceIds
    .map((id) => data.state.evidence.find((item) => item.id === id))
    .filter(Boolean);

  if (evidenceItems.length === 0) {
    return <div className="evidence-list empty">暂无可展示证据。</div>;
  }

  return (
    <div className="evidence-list">
      {evidenceItems.map((evidence) => {
        if (!evidence) {
          return null;
        }
        const snapshots = evidenceSnapshots(data, evidence.id);
        const reviews = evidenceReviews(data, evidence.id);
        const screenshots = snapshots.flatMap((snapshot) => snapshot.screenshots);
        const record = recordById.get(evidence.id);
        const credibility = record ? buildEvidenceCredibilityProfile(data, record) : undefined;
        return (
          <article className="evidence-item" key={evidence.id}>
            <div className="evidence-title">
              <span className="tag">{evidence.sourceType}</span>
              <strong>{evidence.channelName}</strong>
              <small>{evidence.capturedAt.slice(0, 10)}</small>
              {credibility ? <span className={`score-pill ${evidenceCredibilityTone(credibility.grade)}`}>{credibility.gradeLabel} {credibility.score}</span> : null}
            </div>
            <p>{evidence.rawExcerpt}</p>
            {credibility ? (
              <div className="evidence-quality-line">
                <span>{credibility.usageAdvice}</span>
                {credibility.missingEvidence[0] ? <span>{credibility.missingEvidence[0]}</span> : null}
              </div>
            ) : null}
            {reviews.length > 0 ? (
              <div className="evidence-review">
                {reviews.map((review) => (
                  <small key={review.id}>评论：{review.rating} 分 / {review.content}</small>
                ))}
              </div>
            ) : null}
            {screenshots.length > 0 ? <ScreenshotStrip ownerName={evidence.channelName} screenshots={screenshots} /> : null}
            {evidence.sourceUrl ? (
              <a className="evidence-link" href={evidence.sourceUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                打开来源
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function ScreenshotStrip({ ownerName, screenshots }: { ownerName: string; screenshots: string[] }) {
  return (
    <div className="screenshot-strip">
      {screenshots.map((screenshot, index) =>
        isImageUrl(screenshot) ? (
          <a key={`${ownerName}-${index}-${screenshot}`} href={screenshot} target="_blank" rel="noreferrer" className="screenshot-thumb">
            <img src={screenshot} alt={`${ownerName} 截图 ${index + 1}`} />
          </a>
        ) : (
          <span className="screenshot-chip" key={`${ownerName}-${index}-${screenshot}`}>
            <ImageIcon size={14} />
            {screenshot}
          </span>
        )
      )}
    </div>
  );
}

function FeatureGapDetailView({
  data,
  selectedFeatureId,
  onSelectFeature,
  runAction
}: {
  data: ApiStateResponse;
  selectedFeatureId?: string;
  onSelectFeature: (featureId: string) => void;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const details = buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "");
  const selectedDetail = details.find((detail) => detail.featureId === selectedFeatureId) ?? details[0];

  if (!selectedDetail) {
    return <EmptyState title="暂无功能详情" text="先执行分析生成 Feature Matrix，再查看单个功能的差距详情。" />;
  }

  const competitorHasFeature = selectedDetail.competitorDetails.filter((detail) => detail.support === "owned" || detail.support === "advantage").length;
  const relatedEvidenceIds = uniqueValues([
    ...selectedDetail.ownEvidenceIds,
    ...selectedDetail.competitorDetails.flatMap((detail) => detail.evidenceIds),
    ...selectedDetail.socialEvidenceIds
  ]);
  const selectedFeature =
    data.state.features.find((feature) => feature.id === selectedDetail.featureId) ??
    ({
      id: selectedDetail.featureId,
      ownedAppId: selectedDetail.ownedAppId,
      name: selectedDetail.featureName,
      category: selectedDetail.category,
      currentAppSupport: selectedDetail.currentAppSupport,
      competitorSupport: Object.fromEntries(selectedDetail.competitorDetails.map((detail) => [detail.competitorId, detail.support])),
      demandScore: selectedDetail.demandScore,
      source: "user_confirmed",
      updatedAt: new Date().toISOString()
    } satisfies Feature);
  const selectedInsight = featureDecisionInsight(selectedFeature, selectedDetail);
  const selectedComparison = buildFeatureComparisonRecord(data, selectedFeature, selectedDetail);
  const convertFeatureTask = (task: FeatureExecutionTask) => {
    void runAction("convert-feature-task", () =>
      postJson<ApiStateResponse>("/api/requirements/from-feature", {
        ownedAppId: selectedFeature.ownedAppId,
        featureId: selectedFeature.id,
        title: task.title,
        recommendation: task.objective,
        priorityHint: task.priorityHint,
        evidenceIds: task.evidenceIds,
        competitorReference: selectedComparison.bestCompetitor?.ownerName ?? "功能对比模型",
        appGapOrAdvantage: selectedComparison.decisionGrade,
        prdNotes: [
          `问题：${selectedComparison.modelSummary}`,
          `为什么现在：${task.whyNow}`,
          `产品动作：${task.objective}`,
          `MVP 范围：${task.scope}`,
          `研发提示：${task.implementationSteps.join("；")}`,
          `成功指标：${task.acceptance.join("；")}`,
          `证据：${task.evidenceIds.join(", ") || "待补证据"}`
        ].join("\n")
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="需求分" value={selectedDetail.demandScore} tone={selectedDetail.demandScore >= 80 ? "warn" : "ok"} />
        <Metric label="说服力" value={selectedInsight.persuasivenessScore} tone={selectedInsight.persuasivenessScore >= 80 ? "warn" : "ok"} />
        <Metric label="模型分" value={selectedComparison.modelScore} tone={selectedComparison.modelScore >= 80 ? "warn" : "ok"} />
        <Metric label="成熟度差距" value={selectedInsight.maturityGap} tone={selectedInsight.maturityGap >= 2 ? "warn" : "ok"} />
        <Metric label="竞品已覆盖" value={competitorHasFeature} />
        <Metric label="关联证据" value={relatedEvidenceIds.length} />
        <Metric label="社媒证据" value={selectedDetail.socialEvidenceIds.length} />
        <Metric label="当前 App 证据" value={selectedDetail.ownEvidenceIds.length} />
        <Metric label="评论样本" value={selectedDetail.competitorDetails.reduce((sum, detail) => sum + detail.reviewQuotes.length, 0)} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>功能选择</h3>
          <small>点击功能矩阵中的详情，或在这里切换功能。</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={selectedDetail.featureId} onChange={(event) => onSelectFeature(event.target.value)}>
            {details.map((detail) => (
              <option key={detail.featureId} value={detail.featureId}>
                {detail.featureName}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>{selectedDetail.featureName}</h3>
          <small>{selectedDetail.category}</small>
        </div>
        <div className="detail-grid">
          <div className="evidence-item">
            <strong>当前 App 状态</strong>
            <p>{supportLabel(selectedDetail.currentAppSupport)}</p>
          </div>
          <div className="evidence-item">
            <strong>判断</strong>
            <p>{featureDetailDecisionLabel(selectedDetail.decision)}</p>
          </div>
          <div className="evidence-item">
            <strong>用户评价</strong>
            <p>{selectedDetail.reviewSummary}</p>
          </div>
          <div className="evidence-item">
            <strong>建议怎么补</strong>
            <p>{selectedDetail.suggestedAction}</p>
          </div>
        </div>
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>功能对比模型</h3>
          <small>{selectedComparison.decisionGrade} / {selectedComparison.modelSummary}</small>
        </div>
        <div className="feature-model-grid">
          {selectedComparison.dimensionScores.map((dimension) => (
            <article className="feature-model-card" key={dimension.key}>
              <div className="decision-card-top">
                <strong>{dimension.label}</strong>
                <span className={`score-pill ${dimensionTone(dimension.score, dimension.key === "implementationRisk")}`}>{dimension.score}</span>
              </div>
              <p>{dimension.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>用户旅程差距地图</h3>
          <small>把功能点拆成入口、流程、结果、复用 / 商业化。</small>
        </div>
        <div className="journey-gap-map">
          {selectedComparison.insight.journey.split(" -> ").map((stage, index) => {
            const isLast = index === selectedComparison.insight.journey.split(" -> ").length - 1;
            const state =
              selectedFeature.currentAppSupport === "missing"
                ? index === 0
                  ? "缺入口"
                  : "待设计"
                : selectedFeature.currentAppSupport === "partial"
                  ? index <= 1
                    ? "需优化"
                    : "待补齐"
                  : selectedFeature.currentAppSupport === "advantage"
                    ? "可强化"
                    : "待确认";
            return (
              <article className="journey-step" key={`${stage}-${index}`}>
                <span>{index + 1}</span>
                <strong>{stage}</strong>
                <p>{state}</p>
                {!isLast ? <small>下一步需要保持路径连续</small> : <small>{selectedComparison.insight.monetizationBoundary}</small>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>产品判断链</h3>
          <small>把竞品信号转成是否值得做、怎么做、怎么验证。</small>
        </div>
        <div className="decision-playbook">
          <article className="decision-card spotlight-card primary-decision">
            <div className="decision-card-top">
              <span className={`score-pill ${persuasivenessTone(selectedInsight.persuasivenessScore)}`}>说服力 {selectedInsight.persuasivenessScore}</span>
              <span className="tag">{selectedInsight.evidenceStrength}</span>
            </div>
            <h4>是否值得进入需求评审</h4>
            <p>{selectedInsight.ifDo}</p>
            <small>不做影响：{selectedInsight.ifNotDo}</small>
          </article>
          <article className="decision-card">
            <strong>成熟度差距</strong>
            <p>
              当前 {maturityLabel(selectedInsight.maturityLevel)}，竞品最高 {maturityLabel(selectedInsight.competitorMaturityLevel)}，差距{" "}
              {selectedInsight.maturityGap} 级。
            </p>
            <small>{selectedInsight.journey}</small>
          </article>
          <article className="decision-card">
            <strong>为什么不能照搬</strong>
            <p>{selectedInsight.whyNotCopy}</p>
            <small>边界：{selectedInsight.monetizationBoundary}</small>
          </article>
          <article className="decision-card">
            <strong>MVP 范围</strong>
            <p>{selectedInsight.mvpScope}</p>
            <small>验证：{selectedInsight.validationPlan}</small>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>可执行任务卡</h3>
          <small>从功能对比直接生成可进入需求池或研发评审的任务。</small>
        </div>
        <div className="task-card-grid">
          {selectedComparison.taskCards.map((task) => (
            <article className="task-card spotlight-card" key={task.id}>
              <div className="decision-card-top">
                <span className={`priority priority-${task.priorityHint.toLowerCase()}`}>{task.priorityHint}</span>
                <span className={`score-pill ${persuasivenessTone(task.score)}`}>任务分 {task.score}</span>
              </div>
              <h4>{task.title}</h4>
              <p>{task.objective}</p>
              <div className="decision-meta">
                <span>{recommendationOwnerLabel(task.ownerRole)}</span>
                <span>{requirementReadinessLabel(task.readiness)}</span>
                <span>风险 {impactLabel(task.risk)}</span>
              </div>
              <div className="task-section">
                <strong>MVP 范围</strong>
                <small>{task.scope}</small>
              </div>
              <div className="task-section">
                <strong>研发步骤</strong>
                <ul className="mini-list review-checklist">
                  {task.implementationSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
              <div className="task-section">
                <strong>验收口径</strong>
                <ul className="mini-list review-checklist">
                  {task.acceptance.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="button-row">
                <button className="primary" onClick={() => convertFeatureTask(task)}>
                  <Send size={15} />
                  转需求
                </button>
                <span className="task-evidence-note">{task.evidenceIds.length} 条证据</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>竞品覆盖与用户反馈</h3>
          <small>哪些竞品有、证据是什么、用户怎么评价。</small>
        </div>
        <div className="table-wrap decision-table">
          <table>
            <thead>
              <tr>
                <th>竞品</th>
                <th>能力状态</th>
                <th>能力分</th>
                <th>成熟度</th>
                <th>评论风险</th>
                <th>入口 / 边界</th>
                <th>可借鉴 / 风险</th>
                <th>用户评价</th>
                <th>社媒证据</th>
                <th>证据</th>
              </tr>
            </thead>
            <tbody>
              {selectedDetail.competitorDetails.map((detail) => {
                const competitorMaturity = maturityLevelForSupport(
                  detail.support,
                  detail.evidenceIds.length,
                  detail.reviewQuotes.length,
                  detail.socialEvidenceIds.length
                );
                const snapshot = selectedComparison.competitorSnapshots.find((item) => item.ownerId === detail.competitorId);
                return (
                  <tr key={detail.competitorId}>
                    <td>
                      <strong>{detail.competitorName}</strong>
                      <small>{detail.lastSignalAt?.slice(0, 10) ?? "暂无最近信号"}</small>
                    </td>
                    <td>
                      <span className={`support ${detail.support}`}>{supportLabel(detail.support)}</span>
                    </td>
                    <td>
                      <span className={`score-pill ${persuasivenessTone(snapshot?.capabilityScore ?? 0)}`}>{snapshot?.capabilityScore ?? 0}</span>
                      <small>{snapshot?.verdict ?? "待确认"}</small>
                    </td>
                    <td>
                      <strong>{maturityLabel(competitorMaturity)}</strong>
                      <small>
                        证据 {detail.evidenceIds.length + detail.socialEvidenceIds.length} / 评论 {detail.reviewQuotes.length}
                      </small>
                    </td>
                    <td>
                      <span className={`severity ${detail.reviewSentiment}`}>{impactLabel(detail.reviewSentiment)}</span>
                    </td>
                    <td>
                      <p className="table-copy">{selectedInsight.journey}</p>
                      <small>{selectedInsight.monetizationBoundary}</small>
                    </td>
                    <td>
                      <p className="table-copy">{snapshot?.copyableParts ?? featureCopyableParts(selectedFeature)}</p>
                      <small>{snapshot?.riskNotes ?? featureRiskNotes(selectedFeature)}</small>
                      <small>补证：{snapshot?.nextEvidence ?? "补截图和链接"}</small>
                    </td>
                    <td>
                      {detail.reviewQuotes.length === 0 ? (
                        "暂无直接评论"
                      ) : (
                        <ul className="mini-list">
                          {detail.reviewQuotes.map((quote) => (
                            <li key={quote}>{quote}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td>{detail.socialEvidenceIds.length}</td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={uniqueValues([...detail.evidenceIds, ...detail.socialEvidenceIds]).slice(0, 5)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>关联证据</h3>
          <small>当前功能所有可追溯 Evidence</small>
        </div>
        <EvidenceList data={data} evidenceIds={relatedEvidenceIds.slice(0, 12)} />
      </section>
    </div>
  );
}

function SocialSamplesView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const activeAppId = data.state.currentOwnedApp?.id;
  const [platform, setPlatform] = useState<SocialPlatform>("xiaohongshu");
  const [competitorId, setCompetitorId] = useState(data.state.competitors[0]?.id ?? "");
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [engagementText, setEngagementText] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [signalType, setSignalType] = useState<SocialSignalType>("template_trend");
  const [impact, setImpact] = useState<SocialSample["impact"]>("medium");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSamples = data.state.socialSamples.filter(
    (sample) =>
      (platformFilter === "all" || sample.platform === platformFilter) &&
      (competitorFilter === "all" || sample.competitorId === competitorFilter) &&
      (statusFilter === "all" || sample.fetchStatus === statusFilter)
  );

  const payload = () => ({
    ownedAppId: activeAppId ?? "",
    competitorId: optionalText(competitorId),
    platform,
    url,
    topic,
    author: optionalText(author),
    publishedAt: optionalText(publishedAt),
    engagementText: optionalText(engagementText),
    summary,
    tags: splitUrlList(tags),
    signalType,
    impact
  });

  const resetForm = () => {
    setUrl("");
    setTopic("");
    setAuthor("");
    setPublishedAt("");
    setEngagementText("");
    setSummary("");
    setTags("");
  };

  const submitManual = async () => {
    if (!activeAppId) {
      return;
    }
    await runAction("create-social-sample", () => postJson<ApiStateResponse>("/api/social-samples", payload()));
    resetForm();
  };

  const fetchPublic = async () => {
    if (!activeAppId) {
      return;
    }
    await runAction("fetch-social-sample", () => postJson<ApiStateResponse>("/api/social-samples/fetch", payload()));
    resetForm();
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="社媒样本" value={data.state.socialSamples.length} />
        <Metric label="抓取成功" value={data.state.socialSamples.filter((sample) => sample.fetchStatus === "Fetched").length} />
        <Metric label="抓取失败" value={data.state.socialSamples.filter((sample) => sample.fetchStatus === "Failed").length} tone="warn" />
        <Metric label="小红书" value={data.state.socialSamples.filter((sample) => sample.platform === "xiaohongshu").length} />
        <Metric label="抖音" value={data.state.socialSamples.filter((sample) => sample.platform === "douyin").length} />
        <Metric label="微博" value={data.state.socialSamples.filter((sample) => sample.platform === "weibo").length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>添加社媒样本</h3>
          <small>公开抓取只读取可访问页面；登录、验证码、反爬会记录失败原因。</small>
        </div>
        <div className="form-grid social-form">
          <label>
            平台
            <select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)}>
              {socialPlatforms.map((item) => (
                <option key={item} value={item}>
                  {socialPlatformLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            竞品
            <select value={competitorId} onChange={(event) => setCompetitorId(event.target.value)}>
              <option value="">当前 App / 未绑定</option>
              {data.state.competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            链接
            <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.xiaohongshu.com/..." />
          </label>
          <label>
            话题
            <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="AI 写真 / 爆款模板" />
          </label>
          <label>
            作者
            <input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="可选" />
          </label>
          <label>
            发布时间
            <input value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} placeholder="2026-07-07" />
          </label>
          <label>
            互动量
            <input value={engagementText} onChange={(event) => setEngagementText(event.target.value)} placeholder="点赞 1.2w / 评论 300" />
          </label>
          <label>
            类型
            <select value={signalType} onChange={(event) => setSignalType(event.target.value as SocialSignalType)}>
              {socialSignalTypes.map((item) => (
                <option key={item} value={item}>
                  {socialSignalTypeLabel(item)}
                </option>
              ))}
            </select>
          </label>
          <label>
            影响
            <select value={impact} onChange={(event) => setImpact(event.target.value as SocialSample["impact"])}>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </label>
          <label>
            标签
            <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="AI, 写真, 模板" />
          </label>
          <label className="span-2">
            摘要
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="人工摘要或抓取失败时的补充说明" />
          </label>
        </div>
        <div className="button-row">
          <button className="primary" disabled={!activeAppId || !url || !topic} onClick={() => void fetchPublic()}>
            公开抓取
          </button>
          <button className="secondary" disabled={!activeAppId || !url || !topic || !summary} onClick={() => void submitManual()}>
            手动保存
          </button>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>社媒筛选</h3>
          <small>按平台、竞品和抓取状态筛选证据。</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}>
            <option value="all">全部平台</option>
            {socialPlatforms.map((item) => (
              <option key={item} value={item}>
                {socialPlatformLabel(item)}
              </option>
            ))}
          </select>
          <select value={competitorFilter} onChange={(event) => setCompetitorFilter(event.target.value)}>
            <option value="all">全部对象</option>
            {data.state.competitors.map((competitor) => (
              <option key={competitor.id} value={competitor.id}>
                {competitor.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="Fetched">抓取成功</option>
            <option value="Failed">抓取失败</option>
            <option value="ManualOnly">手动样本</option>
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>社媒样本库</h3>
          <small>{filteredSamples.length} 条</small>
        </div>
        {filteredSamples.length === 0 ? (
          <EmptyState title="暂无社媒样本" text="添加小红书、抖音、微博链接后，这里会显示话题证据。" />
        ) : (
          <div className="evidence-grid alert-grid">
            {filteredSamples.map((sample) => (
              <article className="evidence-item evidence-card" key={sample.id}>
                <div className="evidence-title">
                  <span className={`severity ${sample.impact}`}>{impactLabel(sample.impact)}</span>
                  <span className="tag">{socialPlatformLabel(sample.platform)}</span>
                  <strong>{sample.topic}</strong>
                </div>
                <p>{sample.summary}</p>
                {sample.fetchedTitle ? <p className="table-copy">抓取标题：{sample.fetchedTitle}</p> : null}
                {sample.fetchFailureReason ? <p className="error-copy">失败原因：{sample.fetchFailureReason}</p> : null}
                <div className="evidence-meta">
                  <span>{sample.competitorId ? competitorName(data, sample.competitorId) : data.state.currentOwnedApp?.name ?? "当前 App"}</span>
                  <span>{socialSignalTypeLabel(sample.signalType)}</span>
                  <span>{sample.fetchStatus}</span>
                  {sample.engagementText ? <span>{sample.engagementText}</span> : null}
                </div>
                {sample.tags.length > 0 ? <div className="tag-row">{sample.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                {sample.evidenceId ? <EvidenceList data={data} evidenceIds={[sample.evidenceId]} /> : <div className="evidence-list empty">暂无 Evidence。</div>}
                <a className="evidence-link" href={sample.finalUrl ?? sample.url} target="_blank" rel="noreferrer">
                  <ExternalLink size={14} />
                  打开来源
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface PlatformAuthDraft {
  appId: string;
  clientKey: string;
  clientSecret: string;
  redirectUri: string;
  scopesText: string;
  crawlFrequency: string;
  dailyQuota: string;
  enabled: boolean;
}

function draftFromSocialAuthConfig(config: SocialAuthConfig | undefined, platform: SocialAuthPlatform): PlatformAuthDraft {
  return {
    appId: config?.appId ?? "",
    clientKey: config?.clientKey ?? "",
    clientSecret: "",
    redirectUri: config?.redirectUri ?? defaultSocialAuthRedirectUri(platform),
    scopesText: config?.scopes.join(", ") ?? defaultSocialAuthScopes(platform),
    crawlFrequency: config?.crawlFrequency ?? "daily",
    dailyQuota: `${config?.dailyQuota ?? (platform === "weibo" ? 200 : 80)}`,
    enabled: config?.enabled ?? true
  };
}

function PlatformAuthView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const activeAppId = data.state.currentOwnedApp?.id;
  const [selectedPlatform, setSelectedPlatform] = useState<SocialAuthPlatform>("xiaohongshu");
  const selectedConfig = data.state.socialAuthConfigs.find((config) => config.platform === selectedPlatform);
  const [draft, setDraft] = useState<PlatformAuthDraft>(() => draftFromSocialAuthConfig(selectedConfig, selectedPlatform));
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(draftFromSocialAuthConfig(selectedConfig, selectedPlatform));
  }, [selectedConfig?.id, selectedConfig?.updatedAt, selectedPlatform]);

  const payload = () => ({
    ownedAppId: activeAppId ?? "",
    platform: selectedPlatform,
    appId: optionalText(draft.appId),
    clientKey: optionalText(draft.clientKey),
    clientSecret: optionalText(draft.clientSecret),
    redirectUri: draft.redirectUri,
    scopes: splitUrlList(draft.scopesText),
    enabled: draft.enabled,
    crawlFrequency: draft.crawlFrequency,
    dailyQuota: Number.parseInt(draft.dailyQuota, 10) || 0
  });

  const saveConfig = async () => {
    if (!activeAppId) {
      return;
    }
    await runAction("save-social-auth", () =>
      selectedConfig
        ? patchJson<ApiStateResponse>(`/api/social-auth-configs/${selectedConfig.id}`, payload())
        : postJson<ApiStateResponse>("/api/social-auth-configs", payload())
    );
    setDraft((current) => ({ ...current, clientSecret: "" }));
  };

  const generateAuthUrl = async (config: SocialAuthConfig) => {
    await runAction("generate-social-auth-url", async () => {
      const response = await postJson<ApiStateResponse & { authorizationUrl?: string }>(`/api/social-auth-configs/${config.id}/authorize-url`, {});
      if (response.authorizationUrl) {
        setGeneratedUrls((current) => ({ ...current, [config.id]: response.authorizationUrl ?? "" }));
      }
      return response;
    });
  };

  const disconnectAuth = async (config: SocialAuthConfig) => {
    await runAction("disconnect-social-auth", () => postJson<ApiStateResponse>(`/api/social-auth-configs/${config.id}/disconnect`, {}));
  };

  const configuredCount = data.state.socialAuthConfigs.filter((config) => config.status !== "NotConfigured").length;
  const authorizedCount = data.state.socialAuthConfigs.filter((config) => config.status === "Authorized").length;
  const failedCount = data.state.socialAuthConfigs.filter((config) => config.status === "Failed" || config.status === "TokenExpired").length;
  const quotaTotal = data.state.socialAuthConfigs.reduce((sum, config) => sum + config.dailyQuota, 0);
  const quotaUsed = data.state.socialAuthConfigs.reduce((sum, config) => sum + config.usedToday, 0);

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="支持平台" value={socialAuthPlatforms.length} />
        <Metric label="已配置" value={configuredCount} />
        <Metric label="已授权" value={authorizedCount} tone={authorizedCount ? "ok" : undefined} />
        <Metric label="异常授权" value={failedCount} tone={failedCount ? "warn" : undefined} />
        <Metric label="日额度" value={quotaTotal} />
        <Metric label="今日已用" value={quotaUsed} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>平台授权状态</h3>
          <small>只支持官方授权和额度内采集；不会保存账号密码，也不会绕过登录、验证码或频控。</small>
        </div>
        <div className="evidence-grid alert-grid">
          {socialAuthPlatforms.map((platform) => {
            const config = data.state.socialAuthConfigs.find((item) => item.platform === platform);
            const generatedUrl = config ? generatedUrls[config.id] ?? config.lastAuthorizationUrl : undefined;
            const used = config ? `${config.usedToday}/${config.dailyQuota}` : "未配置";
            return (
              <article className="evidence-item evidence-card" key={platform}>
                <div className="evidence-title">
                  <span className="tag">{socialPlatformLabel(platform)}</span>
                  <strong>{statusLabel(config?.status ?? "NotConfigured")}</strong>
                </div>
                <p>
                  {config
                    ? `频率 ${config.crawlFrequency}，今日额度 ${used}，scope：${config.scopes.join("、") || "未配置"}`
                    : "尚未配置开放平台应用参数。"}
                </p>
                <div className="evidence-meta">
                  <span>Secret {config?.clientSecretConfigured ? "已配置" : "未配置"}</span>
                  <span>{config?.enabled ? "采集启用" : "采集暂停"}</span>
                  {config?.lastAuthorizedAt ? <span>回调 {config.lastAuthorizedAt.slice(0, 10)}</span> : null}
                </div>
                {config?.lastFailureReason ? <p className="error-copy">{config.lastFailureReason}</p> : null}
                {generatedUrl ? (
                  <a className="evidence-link" href={generatedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} />
                    打开授权页
                  </a>
                ) : null}
                <div className="button-row">
                  <button className="secondary" onClick={() => setSelectedPlatform(platform)}>
                    编辑配置
                  </button>
                  <button className="primary" disabled={!config} onClick={() => config && void generateAuthUrl(config)}>
                    生成授权链接
                  </button>
                  <button className="ghost" disabled={!config} onClick={() => config && void disconnectAuth(config)}>
                    断开
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>{socialPlatformLabel(selectedPlatform)} 授权配置</h3>
          <small>AppSecret 不回显；本地演示只记录“已配置”，生产环境应接密钥管理和 token exchange。</small>
        </div>
        <div className="form-grid social-form">
          <label>
            平台
            <select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value as SocialAuthPlatform)}>
              {socialAuthPlatforms.map((platform) => (
                <option key={platform} value={platform}>
                  {socialPlatformLabel(platform)}
                </option>
              ))}
            </select>
          </label>
          <label>
            App ID / Client ID
            <input value={draft.appId} onChange={(event) => setDraft({ ...draft, appId: event.target.value })} placeholder="小红书 appId / 微博 client_id" />
          </label>
          <label>
            Client Key
            <input value={draft.clientKey} onChange={(event) => setDraft({ ...draft, clientKey: event.target.value })} placeholder="抖音 client_key" />
          </label>
          <label>
            App Secret
            <input
              value={draft.clientSecret}
              onChange={(event) => setDraft({ ...draft, clientSecret: event.target.value })}
              placeholder={selectedConfig?.clientSecretConfigured ? "已配置，留空不修改" : "只在服务端保存"}
              type="password"
            />
          </label>
          <label>
            采集频率
            <select value={draft.crawlFrequency} onChange={(event) => setDraft({ ...draft, crawlFrequency: event.target.value })}>
              <option value="hourly">每小时</option>
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="manual">仅手动</option>
            </select>
          </label>
          <label>
            每日额度
            <input value={draft.dailyQuota} onChange={(event) => setDraft({ ...draft, dailyQuota: event.target.value })} inputMode="numeric" />
          </label>
          <label className="span-2">
            回调地址
            <input value={draft.redirectUri} onChange={(event) => setDraft({ ...draft, redirectUri: event.target.value })} />
          </label>
          <label>
            Scope
            <input value={draft.scopesText} onChange={(event) => setDraft({ ...draft, scopesText: event.target.value })} placeholder="user_info, all" />
          </label>
        </div>
        <div className="toggle-row auth-toggle">
          <label>
            <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
            启用该平台采集
          </label>
          {selectedConfig ? (
            <span className={`severity ${socialAuthStatusTone(selectedConfig.status) ?? "medium"}`}>{statusLabel(selectedConfig.status)}</span>
          ) : (
            <span className="severity medium">未配置</span>
          )}
        </div>
        <div className="button-row">
          <button className="primary" disabled={!activeAppId || !draft.redirectUri} onClick={() => void saveConfig()}>
            保存配置
          </button>
          <button className="secondary" disabled={!selectedConfig} onClick={() => selectedConfig && void generateAuthUrl(selectedConfig)}>
            生成授权链接
          </button>
          {selectedConfig?.lastAuthorizationUrl ? (
            <a className="evidence-link" href={selectedConfig.lastAuthorizationUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              最近授权页
            </a>
          ) : null}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>接入边界</h3>
          <small>授权页解决的是官方接口身份，不等于无限采集。</small>
        </div>
        <div className="detail-grid">
          <div className="evidence-item">
            <strong>允许</strong>
            <p>通过官方 OAuth 获取授权，在 scope 和额度内采集公开或已授权数据，并把失败原因写入状态。</p>
          </div>
          <div className="evidence-item">
            <strong>不允许</strong>
            <p>保存账号密码、导入 Cookie、使用账号池或代理池、绕过验证码 / 登录墙 / 平台频控。</p>
          </div>
          <div className="evidence-item">
            <strong>下一步</strong>
            <p>接真实 token exchange、加密 token 存储、按平台额度创建后台采集队列。</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function ReviewAgendaView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const agendaItems = buildReviewAgenda(data);
  const [sectionFilter, setSectionFilter] = useState<ReviewAgendaSection | "all">("all");
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(agendaItems[0]?.id);
  const sections: ReviewAgendaSection[] = ["decision", "risk", "pain", "engineering", "evidence", "followup"];
  const filteredItems = agendaItems.filter((item) => sectionFilter === "all" || item.section === sectionFilter);
  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0];
  const totalMinutes = agendaItems.reduce((sum, item) => sum + item.timeboxMinutes, 0);
  const p0Count = agendaItems.filter((item) => item.priority === "P0").length;
  const evidenceCount = uniqueValues(agendaItems.flatMap((item) => item.evidenceIds)).length;

  const appendAgendaToReport = () => {
    if (!latestReport) {
      return;
    }
    const marker = "## 本周评审会议议程";
    const snippet = [
      marker,
      "",
      `预计时长：${totalMinutes} 分钟`,
      "",
      ...sections.flatMap((section) => {
        const sectionItems = agendaItems.filter((item) => item.section === section);
        if (sectionItems.length === 0) {
          return [];
        }
        return [
          `### ${reviewAgendaSectionLabel(section)}`,
          ...sectionItems.map(
            (item) =>
              `- ${item.priority} ${item.title}（${item.timeboxMinutes}min，${recommendationOwnerLabel(item.owner)}）：${item.decisionNeeded} / 下一步：${item.action}`
          )
        ];
      })
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n${snippet}`;
    void runAction("agenda-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="议题数" value={agendaItems.length} />
        <Metric label="P0 议题" value={p0Count} tone={p0Count ? "warn" : "ok"} />
        <Metric label="预计分钟" value={totalMinutes} />
        <Metric label="决策项" value={agendaItems.filter((item) => item.section === "decision").length} />
        <Metric label="风险项" value={agendaItems.filter((item) => item.section === "risk").length} tone="warn" />
        <Metric label="证据数" value={evidenceCount} />
      </section>

      <section className="panel wide agenda-summary-panel">
        <div className="panel-heading">
          <h3>评审会议摘要</h3>
          <small>把决策、风险、痛点、研发准备和证据缺口整理成会前议程。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>先拍板</strong>
            <p>{agendaItems.find((item) => item.section === "decision")?.title ?? "暂无必须拍板项。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>先预读</strong>
            <p>{agendaItems[0]?.preRead ?? "暂无预读材料。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>会议边界</strong>
            <p>议程只组织讨论，不替代需求状态、研发排期或真实会议纪要。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>议程筛选</h3>
          <small>{filteredItems.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value as ReviewAgendaSection | "all")}>
            <option value="all">全部栏目</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {reviewAgendaSectionLabel(section)}
              </option>
            ))}
          </select>
          <button className="secondary" disabled={!latestReport} onClick={appendAgendaToReport}>
            <FileText size={15} />
            写入周报
          </button>
        </div>
      </section>

      <section className="panel wide agenda-workbench">
        <div className="agenda-board">
          {sections.map((section) => {
            const sectionItems = filteredItems.filter((item) => item.section === section);
            return (
              <section className={`agenda-lane agenda-${section}`} key={section}>
                <div className="agenda-lane-heading">
                  <strong>{reviewAgendaSectionLabel(section)}</strong>
                  <span>{sectionItems.length}</span>
                </div>
                <p>{reviewAgendaSectionHint(section)}</p>
                <div className="agenda-item-list">
                  {sectionItems.length === 0 ? (
                    <div className="roadmap-empty">暂无议题</div>
                  ) : (
                    sectionItems.map((item) => (
                      <button
                        className={selectedItem?.id === item.id ? "agenda-item-card active" : "agenda-item-card"}
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                      >
                        <div className="decision-card-top">
                          <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
                          <span>{item.timeboxMinutes}min</span>
                        </div>
                        <strong>{item.title}</strong>
                        <p>{item.decisionNeeded}</p>
                        <small>{recommendationOwnerLabel(item.owner)}</small>
                      </button>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="agenda-detail-panel">
          {!selectedItem ? (
            <EmptyState title="未选择议题" text="从左侧议程选择一个议题查看预读和行动。" />
          ) : (
            <>
              <div className="agenda-detail-hero">
                <div>
                  <span className={`priority priority-${selectedItem.priority.toLowerCase()}`}>{selectedItem.priority}</span>
                  <h3>{selectedItem.title}</h3>
                  <p>{selectedItem.decisionNeeded}</p>
                </div>
                <span className="rank-chip">{selectedItem.timeboxMinutes} 分钟</span>
              </div>

              <div className="decision-detail-grid agenda-fact-grid">
                <article>
                  <strong>栏目</strong>
                  <p>{reviewAgendaSectionLabel(selectedItem.section)}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{recommendationOwnerLabel(selectedItem.owner)}</p>
                </article>
                <article>
                  <strong>预读材料</strong>
                  <p>{selectedItem.preRead}</p>
                </article>
                <article>
                  <strong>会后动作</strong>
                  <p>{selectedItem.action}</p>
                </article>
              </div>

              <section className="agenda-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedItem.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedItem.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function DecisionBoardView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const briefs = buildProductDecisionBriefs(data);
  const recommendations = actionRecommendationsFor(data);
  const persistedRecommendationIds = new Set((data.state.actionRecommendations ?? []).map((recommendation) => recommendation.id));
  const [outcomeFilter, setOutcomeFilter] = useState<ProductDecisionOutcome | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [selectedBriefId, setSelectedBriefId] = useState<string | undefined>(briefs[0]?.id);
  const filteredBriefs = briefs.filter(
    (brief) =>
      (outcomeFilter === "all" || brief.outcome === outcomeFilter) &&
      (priorityFilter === "all" || brief.packageItem.priorityHint === priorityFilter)
  );
  const selectedBrief = filteredBriefs.find((brief) => brief.id === selectedBriefId) ?? filteredBriefs[0];

  const updateDecisionRequirement = (brief: ProductDecisionBrief, status: RequirementCandidate["status"]) => {
    const requirement = data.state.requirements.find((candidate) => candidate.id === brief.packageItem.sourceId);
    if (!requirement) {
      return;
    }
    void runAction("decision-update-requirement", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  };

  const convertDecisionRecommendation = (brief: ProductDecisionBrief) => {
    const recommendation = recommendations.find((candidate) => candidate.id === brief.packageItem.sourceId);
    if (!recommendation) {
      return;
    }
    void runAction("decision-convert-recommendation", () =>
      postJson<ApiStateResponse>("/api/requirements/from-recommendation", {
        recommendationId: recommendation.id,
        ownedAppId: recommendation.ownedAppId
      })
    );
  };

  const appendDecisionToReport = (brief: ProductDecisionBrief) => {
    if (!latestReport) {
      return;
    }
    const marker = `### ${brief.packageItem.priorityHint} ${brief.packageItem.title}`;
    const nextMarkdown = latestReport.markdown.includes(marker)
      ? latestReport.markdown
      : `${latestReport.markdown}\n\n## 产品决策工作台补充\n\n${brief.reportSnippet}`;
    void runAction("decision-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="决策包" value={briefs.length} />
        <Metric label="本周评审" value={briefs.filter((brief) => brief.outcome === "commit").length} tone="warn" />
        <Metric label="待收敛" value={briefs.filter((brief) => brief.outcome === "scope").length} />
        <Metric label="待补证据" value={briefs.filter((brief) => brief.outcome === "evidence").length} />
        <Metric label="高研发风险" value={briefs.filter((brief) => brief.roadmapItem.engineeringRisk === "high").length} tone="warn" />
        <Metric label="可写 PRD" value={briefs.filter((brief) => brief.outcome !== "watch").length} />
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>产品决策摘要</h3>
          <small>把功能差距、需求池、路线图和证据缺口合成 PM / 研发可执行判断。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>本周要拍板</strong>
            <p>
              {briefs.filter((brief) => brief.outcome === "commit").length === 0
                ? "暂无可直接拍板的需求，优先补证据或收敛范围。"
                : briefs
                    .filter((brief) => brief.outcome === "commit")
                    .slice(0, 2)
                    .map((brief) => brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发先看</strong>
            <p>
              {briefs.filter((brief) => brief.roadmapItem.engineeringRisk === "high").length === 0
                ? "当前高风险项较少，重点确认埋点、灰度和异常兜底。"
                : briefs
                    .filter((brief) => brief.roadmapItem.engineeringRisk === "high")
                    .slice(0, 2)
                    .map((brief) => brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>先补证据</strong>
            <p>
              {briefs.filter((brief) => brief.outcome === "evidence").length === 0
                ? "关键决策基本都有可回溯证据。"
                : briefs
                    .filter((brief) => brief.outcome === "evidence")
                    .slice(0, 2)
                    .map((brief) => brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>决策筛选</h3>
          <small>{filteredBriefs.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={outcomeFilter} onChange={(event) => setOutcomeFilter(event.target.value as ProductDecisionOutcome | "all")}>
            <option value="all">全部决策</option>
            <option value="commit">本周评审</option>
            <option value="scope">先收敛范围</option>
            <option value="evidence">先补证据</option>
            <option value="watch">继续观察</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as Priority | "all")}>
            <option value="all">全部优先级</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide decision-workbench">
        <div className="decision-list-panel">
          <div className="panel-heading nested-heading">
            <h3>决策队列</h3>
          </div>
          {filteredBriefs.length === 0 ? (
            <EmptyState title="暂无决策包" text="调整筛选，或先执行分析并把机会转入需求池。" />
          ) : (
            <div className="decision-brief-list">
              {filteredBriefs.map((brief) => (
                <button
                  key={brief.id}
                  className={selectedBrief?.id === brief.id ? "decision-brief-button active" : "decision-brief-button"}
                  onClick={() => setSelectedBriefId(brief.id)}
                >
                  <span className={`priority priority-${brief.packageItem.priorityHint.toLowerCase()}`}>{brief.packageItem.priorityHint}</span>
                  <strong>{brief.packageItem.title}</strong>
                  <small>{brief.outcomeLabel} / 评审分 {brief.packageItem.score}</small>
                  <small>{brief.releaseGate}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="decision-detail-panel">
          {!selectedBrief ? (
            <EmptyState title="未选择决策包" text="从左侧选择一个需求或机会，查看完整评审材料。" />
          ) : (
            <>
              <div className="decision-detail-header">
                <div>
                  <span className={`score-pill ${decisionOutcomeTone(selectedBrief.outcome)}`}>{selectedBrief.outcomeLabel}</span>
                  <h3>{selectedBrief.packageItem.title}</h3>
                  <p>{selectedBrief.roadmapItem.decisionReason}</p>
                </div>
                <div className="button-row compact-actions">
                  {selectedBrief.packageItem.source === "requirement" ? (
                    <>
                      <button className="ghost" onClick={() => updateDecisionRequirement(selectedBrief, "ToReview")}>
                        待评审
                      </button>
                      <button className="primary" onClick={() => updateDecisionRequirement(selectedBrief, "Accepted")}>
                        接受
                      </button>
                      <button className="ghost" onClick={() => updateDecisionRequirement(selectedBrief, "Deferred")}>
                        暂缓
                      </button>
                    </>
                  ) : persistedRecommendationIds.has(selectedBrief.packageItem.sourceId) ? (
                    <button className="primary" onClick={() => convertDecisionRecommendation(selectedBrief)}>
                      <Send size={15} />
                      转需求
                    </button>
                  ) : (
                    <small>执行分析后可转需求</small>
                  )}
                  <button className="secondary" disabled={!latestReport} onClick={() => appendDecisionToReport(selectedBrief)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid">
                <article>
                  <strong>目标用户</strong>
                  <p>{selectedBrief.targetUser}</p>
                </article>
                <article>
                  <strong>进入条件</strong>
                  <p>{selectedBrief.roadmapItem.entryCondition}</p>
                </article>
                <article>
                  <strong>Benchmark</strong>
                  <p>{selectedBrief.featureRecord?.bestCompetitor?.ownerName ?? selectedBrief.packageItem.competitorText}</p>
                </article>
                <article>
                  <strong>发布门槛</strong>
                  <p>{selectedBrief.releaseGate}</p>
                </article>
              </div>

              <section className="decision-section">
                <div className="panel-heading nested-heading">
                  <h3>PRD 草稿</h3>
                  <small>可直接复制到需求评审文档，再由 PM 补业务细节。</small>
                </div>
                <pre className="decision-prd-preview">{selectedBrief.prdMarkdown}</pre>
              </section>

              <section className="decision-section">
                <div className="panel-heading nested-heading">
                  <h3>证据覆盖与缺口</h3>
                  <small>
                    iOS {selectedBrief.evidenceCoverage.ios} / Android {selectedBrief.evidenceCoverage.android} / 评论 {selectedBrief.evidenceCoverage.review} / 社媒{" "}
                    {selectedBrief.evidenceCoverage.social} / 截图 {selectedBrief.evidenceCoverage.screenshots}
                  </small>
                </div>
                {selectedBrief.evidenceGaps.length === 0 ? (
                  <div className="evidence-list empty">证据闭环暂可进入评审。</div>
                ) : (
                  <div className="evidence-gap-grid">
                    {selectedBrief.evidenceGaps.map((gap) => (
                      <article className="evidence-gap-card" key={`${selectedBrief.id}-${gap.title}`}>
                        <div className="decision-card-top">
                          <strong>{gap.title}</strong>
                          <span className={`severity ${gap.severity}`}>{impactLabel(gap.severity)}</span>
                        </div>
                        <p>{gap.detail}</p>
                        <small>{recommendationOwnerLabel(gap.owner)}：{gap.action}</small>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="decision-section">
                <div className="panel-heading nested-heading">
                  <h3>埋点与上线验证</h3>
                  <small>让研发知道上线前必须预埋哪些复盘口径。</small>
                </div>
                <div className="experiment-grid">
                  {selectedBrief.experiments.map((experiment) => (
                    <article className="experiment-card" key={`${selectedBrief.id}-${experiment.eventName}`}>
                      <strong>{experiment.metric}</strong>
                      <code>{experiment.eventName}</code>
                      <p>{experiment.successDefinition}</p>
                      <small>{recommendationOwnerLabel(experiment.owner)}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="decision-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedBrief.packageItem.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedBrief.packageItem.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PrioritySimulatorView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const [weights, setWeights] = useState<PrioritySimulationWeights>(defaultPriorityWeights);
  const [recommendationFilter, setRecommendationFilter] = useState("all");
  const [selectedResultId, setSelectedResultId] = useState<string>();
  const results = buildPrioritySimulationResults(data, weights);
  const filteredResults = results.filter((result) => recommendationFilter === "all" || result.recommendation === recommendationFilter);
  const selectedResult = filteredResults.find((result) => result.id === selectedResultId) ?? filteredResults[0];
  const recommendationOptions = uniqueValues(results.map((result) => result.recommendation));
  const averageScore = results.length ? Math.round(results.reduce((sum, result) => sum + result.totalScore, 0) / results.length) : 0;
  const weightKeys = Object.keys(defaultPriorityWeights) as PriorityWeightKey[];

  const applyPreset = (preset: "balanced" | "growth" | "engineering" | "monetization") => {
    if (preset === "growth") {
      setWeights({
        competitorPressure: 20,
        userDemand: 22,
        evidenceConfidence: 16,
        businessImpact: 14,
        engineeringEfficiency: 8,
        strategicFit: 12,
        monetizationPotential: 8
      });
      return;
    }
    if (preset === "engineering") {
      setWeights({
        competitorPressure: 12,
        userDemand: 16,
        evidenceConfidence: 18,
        businessImpact: 12,
        engineeringEfficiency: 26,
        strategicFit: 8,
        monetizationPotential: 8
      });
      return;
    }
    if (preset === "monetization") {
      setWeights({
        competitorPressure: 12,
        userDemand: 14,
        evidenceConfidence: 16,
        businessImpact: 16,
        engineeringEfficiency: 8,
        strategicFit: 10,
        monetizationPotential: 24
      });
      return;
    }
    setWeights(defaultPriorityWeights);
  };

  const updateWeight = (key: PriorityWeightKey, value: number) => {
    setWeights((current) => ({ ...current, [key]: value }));
  };

  const appendPrioritySimulationToReport = (result: PrioritySimulationResult) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 优先级模拟：${result.brief.packageItem.title}`;
    const snippet = [
      marker,
      "",
      `- 模拟建议：${result.recommendation}，综合分 ${result.totalScore}`,
      `- 下一步：${result.nextStep}`,
      `- 权重：${weightKeys.map((key) => `${priorityWeightLabels[key]} ${weights[key]}`).join("、")}`,
      `- 分项：${weightKeys.map((key) => `${priorityWeightLabels[key]} ${result.componentScores[key]}`).join("、")}`,
      `- 取舍：${result.tradeoffs.join("；") || "暂无明显取舍风险"}`,
      `- 证据：${result.brief.packageItem.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 优先级模拟补充\n\n${snippet}`;
    void runAction("priority-simulation-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="模拟项" value={results.length} />
        <Metric label="方案评审" value={results.filter((result) => result.recommendation === "进入本周方案评审").length} tone="warn" />
        <Metric label="下版候选" value={results.filter((result) => result.recommendation === "进入下个版本候选").length} />
        <Metric label="先补证据" value={results.filter((result) => result.recommendation === "先补证据再排期").length} tone="warn" />
        <Metric label="先技术预研" value={results.filter((result) => result.recommendation === "先做技术预研").length} />
        <Metric label="平均分" value={averageScore} />
      </section>

      <section className="panel wide priority-summary-panel">
        <div className="panel-heading">
          <h3>优先级模拟摘要</h3>
          <small>调节权重后观察候选需求排序变化，用于版本会前取舍。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>当前最优先</strong>
            <p>{results[0] ? `${results[0].brief.packageItem.title}：${results[0].recommendation}` : "暂无可模拟项目。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最大风险</strong>
            <p>
              {results.find((result) => result.recommendation === "先补证据再排期" || result.recommendation === "先做技术预研")?.tradeoffs[0] ??
                "当前排序没有明显高风险项。"}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>模拟边界</strong>
            <p>模拟结果只用于评审前讨论，不会直接修改需求池真实优先级。</p>
          </article>
        </div>
      </section>

      <section className="panel wide priority-control-panel">
        <div className="panel-heading">
          <h3>权重设置</h3>
          <small>权重总和不要求 100，系统会按比例归一化。</small>
        </div>
        <div className="button-row compact-actions">
          <button className="ghost" onClick={() => applyPreset("balanced")}>
            均衡
          </button>
          <button className="ghost" onClick={() => applyPreset("growth")}>
            增长优先
          </button>
          <button className="ghost" onClick={() => applyPreset("engineering")}>
            研发效率优先
          </button>
          <button className="ghost" onClick={() => applyPreset("monetization")}>
            商业化优先
          </button>
        </div>
        <div className="priority-weight-grid">
          {weightKeys.map((key) => (
            <label className="priority-weight-control" key={key}>
              <span>
                <strong>{priorityWeightLabels[key]}</strong>
                <em>{weights[key]}</em>
              </span>
              <input type="range" min="0" max="30" value={weights[key]} onChange={(event) => updateWeight(key, Number(event.target.value))} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>模拟筛选</h3>
          <small>{filteredResults.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={recommendationFilter} onChange={(event) => setRecommendationFilter(event.target.value)}>
            <option value="all">全部建议</option>
            {recommendationOptions.map((recommendation) => (
              <option key={recommendation} value={recommendation}>
                {recommendation}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide priority-simulator-workbench">
        <div className="priority-result-panel">
          <div className="panel-heading nested-heading">
            <h3>模拟排序</h3>
          </div>
          {filteredResults.length === 0 ? (
            <EmptyState title="暂无模拟结果" text="调整筛选或先生成决策包。" />
          ) : (
            <div className="priority-result-list">
              {filteredResults.map((result, index) => (
                <button
                  className={selectedResult?.id === result.id ? "priority-result-card active" : "priority-result-card"}
                  key={result.id}
                  onClick={() => setSelectedResultId(result.id)}
                >
                  <div className="decision-card-top">
                    <span className="rank-chip">#{index + 1}</span>
                    <span className={`score-pill ${persuasivenessTone(result.totalScore)}`}>{result.totalScore}</span>
                  </div>
                  <strong>{result.brief.packageItem.title}</strong>
                  <p>{result.recommendation}</p>
                  <div className="priority-result-meta">
                    <span>{result.brief.packageItem.priorityHint}</span>
                    <span>{result.brief.outcomeLabel}</span>
                    <span>证据 {result.brief.packageItem.evidenceIds.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="priority-detail-panel">
          {!selectedResult ? (
            <EmptyState title="未选择模拟项" text="从左侧选择一个候选需求查看分项和取舍。" />
          ) : (
            <>
              <div className="priority-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedResult.totalScore)}`}>综合分 {selectedResult.totalScore}</span>
                  <h3>{selectedResult.brief.packageItem.title}</h3>
                  <p>{selectedResult.nextStep}</p>
                </div>
                <button className="secondary" disabled={!latestReport} onClick={() => appendPrioritySimulationToReport(selectedResult)}>
                  <FileText size={15} />
                  写入周报
                </button>
              </div>

              <div className="decision-detail-grid priority-fact-grid">
                <article>
                  <strong>模拟建议</strong>
                  <p>{selectedResult.recommendation}</p>
                </article>
                <article>
                  <strong>原始决策</strong>
                  <p>{selectedResult.brief.outcomeLabel}</p>
                </article>
                <article>
                  <strong>发布门槛</strong>
                  <p>{selectedResult.brief.releaseGate}</p>
                </article>
                <article>
                  <strong>研发风险</strong>
                  <p>{impactLabel(selectedResult.brief.roadmapItem.engineeringRisk)}</p>
                </article>
              </div>

              <section className="priority-section">
                <div className="panel-heading nested-heading">
                  <h3>分项评分</h3>
                  <small>按当前权重计算</small>
                </div>
                <div className="priority-score-grid">
                  {weightKeys.map((key) => (
                    <article key={key}>
                      <div className="decision-card-top">
                        <strong>{priorityWeightLabels[key]}</strong>
                        <span>{selectedResult.componentScores[key]}</span>
                      </div>
                      <div className="score-bar">
                        <span style={{ width: `${selectedResult.componentScores[key]}%` }} />
                      </div>
                      <small>权重 {weights[key]}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="priority-section priority-two-col">
                <div>
                  <h3>关键取舍</h3>
                  {selectedResult.tradeoffs.length === 0 ? (
                    <div className="evidence-list empty">暂无明显取舍风险。</div>
                  ) : (
                    <div className="priority-tradeoff-list">
                      {selectedResult.tradeoffs.map((tradeoff) => (
                        <span key={tradeoff}>{tradeoff}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>下一步</h3>
                  <div className="priority-next-card">{selectedResult.nextStep}</div>
                </div>
              </section>

              <section className="priority-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedResult.brief.packageItem.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedResult.brief.packageItem.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PainRadarView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const themes = buildUserPainThemes(data);
  const [categoryFilter, setCategoryFilter] = useState<UserPainCategory | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedThemeId, setSelectedThemeId] = useState<string | undefined>(themes[0]?.id);
  const categoryOptions = uniqueValues(themes.map((theme) => theme.category)) as UserPainCategory[];
  const filteredThemes = themes.filter(
    (theme) => (categoryFilter === "all" || theme.category === categoryFilter) && (severityFilter === "all" || theme.severity === severityFilter)
  );
  const selectedTheme = filteredThemes.find((theme) => theme.id === selectedThemeId) ?? filteredThemes[0];
  const highThemes = themes.filter((theme) => theme.severity === "high");
  const reviewQuoteCount = themes.reduce((sum, theme) => sum + theme.userQuotes.length, 0);
  const socialSignalCount = themes.reduce((sum, theme) => sum + theme.socialSignals.length, 0);

  const appendPainThemeToReport = (theme: UserPainTheme) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 用户痛点：${theme.title}`;
    const snippet = [
      marker,
      "",
      `- 严重度：${impactLabel(theme.severity)}，频次分 ${theme.frequencyScore}，负向分 ${theme.sentimentScore}`,
      `- 影响对象：${theme.impactedOwners.join("、") || "待确认"}`,
      `- 摘要：${theme.summary}`,
      `- 建议：${theme.recommendation}`,
      `- 用户原话：${theme.userQuotes.join(" / ") || "待补评论原文"}`,
      `- 关联功能：${theme.relatedFeatures.join("；") || "待关联功能"}`,
      `- 证据：${theme.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 用户痛点雷达补充\n\n${snippet}`;
    void runAction("pain-radar-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="痛点主题" value={themes.length} />
        <Metric label="高严重度" value={highThemes.length} tone={highThemes.length ? "warn" : "ok"} />
        <Metric label="用户原话" value={reviewQuoteCount} />
        <Metric label="社媒信号" value={socialSignalCount} />
        <Metric label="关联功能" value={uniqueValues(themes.flatMap((theme) => theme.relatedFeatures)).length} />
        <Metric label="证据数" value={uniqueValues(themes.flatMap((theme) => theme.evidenceIds)).length} />
      </section>

      <section className="panel wide pain-summary-panel">
        <div className="panel-heading">
          <h3>用户痛点摘要</h3>
          <small>聚合评论、洞察、社媒样本和功能差距，帮助 PM 找到真实用户问题。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最该优先看</strong>
            <p>{themes[0] ? `${themes[0].title}：${themes[0].recommendation}` : "暂无痛点主题。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>证据情况</strong>
            <p>{themes[0] ? `${themes[0].summary} 影响对象：${themes[0].impactedOwners.join("、") || "待确认"}` : "先执行采集和分析。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>使用边界</strong>
            <p>痛点主题是聚合判断，进入需求评审前仍需保留评论原文、截图或来源链接。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>痛点筛选</h3>
          <small>{filteredThemes.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as UserPainCategory | "all")}>
            <option value="all">全部主题</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {userPainCategoryLabel(category)}
              </option>
            ))}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as "all" | "high" | "medium" | "low")}>
            <option value="all">全部严重度</option>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </section>

      <section className="panel wide pain-radar-workbench">
        <div className="pain-list-panel">
          <div className="panel-heading nested-heading">
            <h3>痛点主题</h3>
          </div>
          {filteredThemes.length === 0 ? (
            <EmptyState title="暂无痛点主题" text="调整筛选，或先补评论、社媒和功能差距证据。" />
          ) : (
            <div className="pain-theme-list">
              {filteredThemes.map((theme) => (
                <button
                  className={selectedTheme?.id === theme.id ? "pain-theme-card active" : "pain-theme-card"}
                  key={theme.id}
                  onClick={() => setSelectedThemeId(theme.id)}
                >
                  <div className="decision-card-top">
                    <span className={`severity ${theme.severity}`}>{impactLabel(theme.severity)}</span>
                    <span className="tag">{userPainCategoryLabel(theme.category)}</span>
                  </div>
                  <strong>{theme.title}</strong>
                  <p>{theme.summary}</p>
                  <div className="pain-theme-meta">
                    <span>频次 {theme.frequencyScore}</span>
                    <span>负向 {theme.sentimentScore}</span>
                    <span>{recommendationOwnerLabel(theme.owner)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pain-detail-panel">
          {!selectedTheme ? (
            <EmptyState title="未选择痛点" text="从左侧选择一个主题查看原话和建议。" />
          ) : (
            <>
              <div className="pain-detail-hero">
                <div>
                  <span className={`severity ${selectedTheme.severity}`}>{impactLabel(selectedTheme.severity)}</span>
                  <h3>{selectedTheme.title}</h3>
                  <p>{selectedTheme.recommendation}</p>
                </div>
                <button className="secondary" disabled={!latestReport} onClick={() => appendPainThemeToReport(selectedTheme)}>
                  <FileText size={15} />
                  写入周报
                </button>
              </div>

              <div className="decision-detail-grid pain-fact-grid">
                <article>
                  <strong>频次分</strong>
                  <p>{selectedTheme.frequencyScore}</p>
                </article>
                <article>
                  <strong>负向分</strong>
                  <p>{selectedTheme.sentimentScore}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{recommendationOwnerLabel(selectedTheme.owner)}</p>
                </article>
                <article>
                  <strong>影响对象</strong>
                  <p>{selectedTheme.impactedOwners.join("、") || "待确认"}</p>
                </article>
              </div>

              <section className="pain-section pain-two-col">
                <div>
                  <h3>用户原话</h3>
                  {selectedTheme.userQuotes.length === 0 ? (
                    <div className="evidence-list empty">缺少评论原文，评审前需要补评论证据。</div>
                  ) : (
                    <div className="pain-quote-list">
                      {selectedTheme.userQuotes.map((quote) => (
                        <span key={quote}>{quote}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>社媒信号</h3>
                  {selectedTheme.socialSignals.length === 0 ? (
                    <div className="evidence-list empty">暂无社媒样本，可补小红书、抖音或微博链接。</div>
                  ) : (
                    <div className="pain-quote-list">
                      {selectedTheme.socialSignals.map((signal) => (
                        <span key={signal}>{signal}</span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="pain-section">
                <div className="panel-heading nested-heading">
                  <h3>关联功能与建议</h3>
                  <small>{selectedTheme.relatedFeatures.length} 条</small>
                </div>
                {selectedTheme.relatedFeatures.length === 0 ? (
                  <div className="evidence-list empty">暂无直接关联功能，建议先补功能矩阵或评论标签。</div>
                ) : (
                  <div className="pain-feature-list">
                    {selectedTheme.relatedFeatures.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>
                )}
              </section>

              <section className="pain-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedTheme.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedTheme.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// @SpecId: ACI-FLOW-INSIGHT-003
function FeaturesView({ data, onOpenDetail }: { data: ApiStateResponse; onOpenDetail: (featureId: string) => void }) {
  const features = normalizeFeatures(data.state.features);
  const detailMap = new Map(buildFeatureGapDetails(data.state, data.state.currentOwnedApp?.id ?? "").map((detail) => [detail.featureId, detail]));
  const featureInsights = features.map((feature) => ({ feature, insight: featureDecisionInsight(feature, detailMap.get(feature.id)) }));
  const comparisonRecords = features.map((feature) => buildFeatureComparisonRecord(data, feature, detailMap.get(feature.id)));
  const gapCount = features.filter((feature) => featureDecision(feature) === "gap" || featureDecision(feature) === "improve").length;
  const advantageCount = features.filter((feature) => featureDecision(feature) === "advantage").length;
  const highPersuasiveness = featureInsights.filter((item) => item.insight.persuasivenessScore >= 80).length;
  const maturityGapCount = featureInsights.filter((item) => item.insight.maturityGap >= 2).length;
  const p0ModelCount = comparisonRecords.filter((record) => record.decisionGrade.startsWith("P0")).length;

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="功能项" value={features.length} />
        <Metric label="差距/待补强" value={gapCount} tone={gapCount ? "warn" : "ok"} />
        <Metric label="当前优势" value={advantageCount} tone="ok" />
        <Metric label="高说服力" value={highPersuasiveness} tone={highPersuasiveness ? "warn" : "ok"} />
        <Metric label="成熟度差距" value={maturityGapCount} tone={maturityGapCount ? "warn" : "ok"} />
        <Metric label="P0 模型项" value={p0ModelCount} tone={p0ModelCount ? "warn" : "ok"} />
        <Metric label="可转需求" value={features.filter((feature) => featureDecision(feature) !== "watch").length} />
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>决策级功能机会</h3>
          <small>按成熟度差距、证据和用户需求排序</small>
        </div>
        <div className="decision-card-grid">
          {comparisonRecords
            .filter((record) => featureDecision(record.feature) !== "watch")
            .sort((left, right) => right.modelScore - left.modelScore)
            .slice(0, 4)
            .map((record) => (
              <article className="decision-card spotlight-card" key={record.feature.id}>
                <div className="decision-card-top">
                  <span className={`priority priority-${record.decisionGrade.startsWith("P0") ? "p0" : record.decisionGrade.startsWith("P1") ? "p1" : "p2"}`}>
                    {record.decisionGrade}
                  </span>
                  <span className={`score-pill ${persuasivenessTone(record.modelScore)}`}>模型分 {record.modelScore}</span>
                </div>
                <h4>{record.feature.name}</h4>
                <p>{record.modelSummary}</p>
                <div className="decision-meta">
                  <span>
                    {maturityLabel(record.insight.maturityLevel)} {"->"} {maturityLabel(record.insight.competitorMaturityLevel)}
                  </span>
                  <span>{record.insight.evidenceStrength}</span>
                  <span>{record.taskCards[0]?.title ?? "待生成任务"}</span>
                </div>
                <button className="ghost" onClick={() => onOpenDetail(record.feature.id)}>
                  查看详情
                </button>
              </article>
            ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>功能矩阵</h3>
        </div>
        <div className="table-wrap feature-table">
          <table>
            <thead>
              <tr>
                <th>功能</th>
                <th>分类</th>
                <th>当前 App</th>
                {data.state.competitors.map((competitor) => (
                  <th key={competitor.id}>{competitor.name}</th>
                ))}
                <th>成熟度差距</th>
                <th>说服力</th>
                <th>模型决策</th>
                <th>旅程 / 边界</th>
                <th>判断</th>
                <th>建议动作</th>
                <th>需求分</th>
                <th>来源</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              {features.length === 0 ? (
                <tr>
                  <td colSpan={data.state.competitors.length + 12}>暂无功能矩阵，先执行分析任务。</td>
                </tr>
              ) : (
                comparisonRecords.map((record) => {
                  const { feature, insight } = record;
                  return (
                    <tr key={feature.id}>
                      <td>
                        <strong>{feature.name}</strong>
                      </td>
                      <td>{feature.category}</td>
                      <td>
                        <span className={`support ${feature.currentAppSupport}`}>{supportLabel(feature.currentAppSupport)}</span>
                        <small>{maturityLabel(insight.maturityLevel)}</small>
                      </td>
                      {data.state.competitors.map((competitor) => (
                        <td key={competitor.id}>
                          <span className={`support ${feature.competitorSupport[competitor.id] ?? "unknown"}`}>
                            {supportLabel(feature.competitorSupport[competitor.id] ?? "unknown")}
                          </span>
                        </td>
                      ))}
                      <td>
                        <strong>{insight.maturityGap > 0 ? `+${insight.maturityGap}` : "0"}</strong>
                        <small>{maturityLabel(insight.competitorMaturityLevel)}</small>
                      </td>
                      <td>
                        <span className={`score-pill ${persuasivenessTone(insight.persuasivenessScore)}`}>{insight.persuasivenessScore}</span>
                        <small>{insight.evidenceStrength}</small>
                      </td>
                      <td>
                        <span className={`score-pill ${persuasivenessTone(record.modelScore)}`}>{record.modelScore}</span>
                        <small>{record.decisionGrade}</small>
                        <small>{record.bestCompetitor ? `Benchmark：${record.bestCompetitor.ownerName}` : "暂无 Benchmark"}</small>
                      </td>
                      <td>
                        <p className="table-copy">{insight.journey}</p>
                        <small>{insight.monetizationBoundary}</small>
                      </td>
                      <td>
                        <span className={`decision ${featureDecision(feature)}`}>{featureDecisionLabel(feature)}</span>
                      </td>
                      <td>{featureAction(feature)}</td>
                      <td>
                        <strong>{feature.demandScore}</strong>
                      </td>
                      <td>{feature.source}</td>
                      <td>
                        <button className="ghost" onClick={() => onOpenDetail(feature.id)}>
                          详情
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>优先补强</h3>
        </div>
        <div className="item-list">
          {features.filter((feature) => featureDecision(feature) === "gap" || featureDecision(feature) === "improve").length === 0 ? (
            <EmptyState title="暂无明显差距" text="继续积累评论和渠道证据。" />
          ) : (
            features
              .filter((feature) => featureDecision(feature) === "gap" || featureDecision(feature) === "improve")
              .slice(0, 4)
              .map((feature) => (
                <article className="feature-summary" key={feature.id}>
                  <strong>{feature.name}</strong>
                  <span>{featureDecisionLabel(feature)} / 需求分 {feature.demandScore}</span>
                  <p>{featureAction(feature)}</p>
                </article>
              ))
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>可强化优势</h3>
        </div>
        <div className="item-list">
          {features.filter((feature) => featureDecision(feature) === "advantage").length === 0 ? (
            <EmptyState title="暂无明确优势" text="可以通过人工确认功能来沉淀优势项。" />
          ) : (
            features
              .filter((feature) => featureDecision(feature) === "advantage")
              .slice(0, 4)
              .map((feature) => (
                <article className="feature-summary" key={feature.id}>
                  <strong>{feature.name}</strong>
                  <span>{feature.category}</span>
                  <p>{featureAction(feature)}</p>
                </article>
              ))
          )}
        </div>
      </section>
    </div>
  );
}

function RequirementReviewView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const packages = buildRequirementReviewPackages(data);
  const recommendations = actionRecommendationsFor(data);
  const persistedRecommendationIds = new Set((data.state.actionRecommendations ?? []).map((recommendation) => recommendation.id));
  const [readinessFilter, setReadinessFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const filteredPackages = packages.filter(
    (item) =>
      (readinessFilter === "all" || item.readiness === readinessFilter) &&
      (priorityFilter === "all" || item.priorityHint === priorityFilter) &&
      (sourceFilter === "all" || item.source === sourceFilter)
  );
  const focusPackages = filteredPackages.slice(0, 4);

  const updateRequirement = (item: RequirementReviewPackage, status: RequirementCandidate["status"]) => {
    const requirement = data.state.requirements.find((candidate) => candidate.id === item.sourceId);
    if (!requirement) {
      return;
    }
    void runAction("update-requirement-review", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  };

  const convertRecommendation = (item: RequirementReviewPackage) => {
    const recommendation = recommendations.find((candidate) => candidate.id === item.sourceId);
    if (!recommendation) {
      return;
    }
    void runAction("convert-review-recommendation", () =>
      postJson<ApiStateResponse>("/api/requirements/from-recommendation", {
        recommendationId: recommendation.id,
        ownedAppId: recommendation.ownedAppId
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="评审包" value={packages.length} />
        <Metric label="可进评审" value={packages.filter((item) => item.readiness === "ready").length} tone="warn" />
        <Metric label="待补证据" value={packages.filter((item) => item.readiness === "needs_evidence").length} />
        <Metric label="待收敛范围" value={packages.filter((item) => item.readiness === "needs_scope").length} />
        <Metric label="P0/P1" value={packages.filter((item) => item.priorityHint !== "P2").length} />
        <Metric label="证据引用" value={uniqueValues(packages.flatMap((item) => item.evidenceIds)).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>评审筛选</h3>
          <small>把机会雷达和需求池合并成可评审队列</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={readinessFilter} onChange={(event) => setReadinessFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="ready">可进评审</option>
            <option value="needs_evidence">待补证据</option>
            <option value="needs_scope">待收敛范围</option>
            <option value="observe">观察池</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">全部优先级</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">全部来源</option>
            <option value="requirement">已入需求池</option>
            <option value="recommendation">机会雷达建议</option>
          </select>
        </div>
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>本轮评审焦点</h3>
          <small>优先看高评分、证据相对完整、范围可控的需求</small>
        </div>
        {focusPackages.length === 0 ? (
          <EmptyState title="暂无评审包" text="执行分析或从洞察转需求后，这里会形成评审队列。" />
        ) : (
          <div className="decision-card-grid">
            {focusPackages.map((item) => (
              <article className="decision-card spotlight-card" key={item.id}>
                <div className="decision-card-top">
                  <span className={`priority priority-${item.priorityHint.toLowerCase()}`}>{item.priorityHint}</span>
                  <span className={`score-pill ${persuasivenessTone(item.score)}`}>评审分 {item.score}</span>
                </div>
                <h4>{item.title}</h4>
                <p>{item.whyNow}</p>
                <div className="decision-meta">
                  <span>{item.source === "requirement" ? "需求池" : "机会雷达"}</span>
                  <span>{requirementReadinessLabel(item.readiness)}</span>
                  <span>{requirementEvidenceStrength(item.evidenceIds.length)}</span>
                </div>
                <div className="card-divider" />
                <small>下一步：{requirementNextStep(item)}</small>
                <small>MVP：{item.mvpScope}</small>
                <div className="button-row compact-actions">
                  {item.source === "requirement" ? (
                    <>
                      <button className="secondary" onClick={() => updateRequirement(item, "ToReview")}>
                        待评审
                      </button>
                      <button className="primary" onClick={() => updateRequirement(item, "Accepted")}>
                        接受
                      </button>
                    </>
                  ) : persistedRecommendationIds.has(item.sourceId) ? (
                    <button className="primary" onClick={() => convertRecommendation(item)}>
                      <Send size={15} />
                      转需求
                    </button>
                  ) : (
                    <small>执行分析后可转需求</small>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>评审包清单</h3>
          <small>{filteredPackages.length} 条</small>
        </div>
        {filteredPackages.length === 0 ? (
          <EmptyState title="暂无匹配结果" text="调整筛选条件，或继续补充评论、截图、社媒和渠道证据。" />
        ) : (
          <div className="table-wrap review-table">
            <table>
              <thead>
                <tr>
                  <th>优先级</th>
                  <th>评审状态</th>
                  <th>需求主题</th>
                  <th>产品判断</th>
                  <th>研发 / 验收</th>
                  <th>证据</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`priority priority-${item.priorityHint.toLowerCase()}`}>{item.priorityHint}</span>
                      <small>{item.source === "requirement" ? "需求池" : "机会雷达"}</small>
                      <small>{item.status}</small>
                    </td>
                    <td>
                      <span className={`score-pill ${requirementReadinessTone(item.readiness)}`}>{requirementReadinessLabel(item.readiness)}</span>
                      <small>评审分 {item.score}</small>
                      <small>{requirementEvidenceStrength(item.evidenceIds.length)}</small>
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                      <small>{item.competitorText}</small>
                      <small>{item.featureText}</small>
                    </td>
                    <td>
                      <p className="table-copy">{item.problem}</p>
                      <small>{item.recommendation}</small>
                    </td>
                    <td>
                      <p className="table-copy">{item.implementationHint}</p>
                      <ul className="mini-list review-checklist">
                        {requirementAcceptanceLines(item).map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="evidence-cell">
                      <EvidenceList data={data} evidenceIds={item.evidenceIds.slice(0, 4)} />
                    </td>
                    <td>
                      <div className="button-row compact-actions">
                        {item.source === "requirement" ? (
                          <>
                            <button className="ghost" onClick={() => updateRequirement(item, "ToReview")}>
                              待评审
                            </button>
                            <button className="primary" onClick={() => updateRequirement(item, "Accepted")}>
                              接受
                            </button>
                            <button className="ghost" onClick={() => updateRequirement(item, "Deferred")}>
                              暂缓
                            </button>
                          </>
                        ) : persistedRecommendationIds.has(item.sourceId) ? (
                          <button className="primary" onClick={() => convertRecommendation(item)}>
                            <Send size={15} />
                            转需求
                          </button>
                        ) : (
                          <small>执行分析后可流转</small>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function RoadmapPlanningView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const roadmapItems = buildRoadmapItems(data);
  const recommendations = actionRecommendationsFor(data);
  const persistedRecommendationIds = new Set((data.state.actionRecommendations ?? []).map((recommendation) => recommendation.id));
  const lanes: RoadmapLane[] = ["this_week", "next_version", "evidence_needed", "watch"];
  const highRiskCount = roadmapItems.filter((item) => item.engineeringRisk === "high").length;
  const committedItems = roadmapItems.filter((item) => item.lane === "this_week" || item.lane === "next_version");

  const updateRoadmapRequirement = (item: RoadmapItem, status: RequirementCandidate["status"]) => {
    const requirement = data.state.requirements.find((candidate) => candidate.id === item.packageItem.sourceId);
    if (!requirement) {
      return;
    }
    void runAction("update-roadmap-requirement", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  };

  const convertRoadmapRecommendation = (item: RoadmapItem) => {
    const recommendation = recommendations.find((candidate) => candidate.id === item.packageItem.sourceId);
    if (!recommendation) {
      return;
    }
    void runAction("convert-roadmap-recommendation", () =>
      postJson<ApiStateResponse>("/api/requirements/from-recommendation", {
        recommendationId: recommendation.id,
        ownedAppId: recommendation.ownedAppId
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="路线图项" value={roadmapItems.length} />
        <Metric label="本周评审" value={roadmapItems.filter((item) => item.lane === "this_week").length} tone="warn" />
        <Metric label="下个版本" value={roadmapItems.filter((item) => item.lane === "next_version").length} />
        <Metric label="待补证据" value={roadmapItems.filter((item) => item.lane === "evidence_needed").length} />
        <Metric label="高研发风险" value={highRiskCount} tone={highRiskCount ? "warn" : "ok"} />
        <Metric label="版本候选" value={committedItems.length} />
      </section>

      <section className="panel wide intelligence-panel">
        <div className="panel-heading">
          <h3>版本承诺摘要</h3>
          <small>把需求评审结果转成版本规划语言</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>本周要定</strong>
            <p>
              {roadmapItems.filter((item) => item.lane === "this_week").length === 0
                ? "暂无可直接进入评审的需求，建议先补证据或收敛范围。"
                : roadmapItems
                    .filter((item) => item.lane === "this_week")
                    .slice(0, 2)
                    .map((item) => item.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发要先看</strong>
            <p>
              {highRiskCount === 0
                ? "当前高风险项较少，可重点评估埋点、灰度和入口改造。"
                : roadmapItems
                    .filter((item) => item.engineeringRisk === "high")
                    .slice(0, 2)
                    .map((item) => item.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>证据缺口</strong>
            <p>
              {roadmapItems.filter((item) => item.lane === "evidence_needed").length === 0
                ? "高优先级需求基本都有可回溯证据。"
                : "先补跨平台截图、评论样本、社媒链接或商店页来源，避免评审时证据不足。"}
            </p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>版本规划看板</h3>
          <small>按进入条件和研发风险分组</small>
        </div>
        {roadmapItems.length === 0 ? (
          <EmptyState title="暂无路线图项" text="先执行分析，或把机会雷达建议转入需求池。" />
        ) : (
          <div className="roadmap-board">
            {lanes.map((lane) => {
              const laneItems = roadmapItems.filter((item) => item.lane === lane);
              return (
                <section className={`roadmap-lane lane-${lane}`} key={lane}>
                  <div className="roadmap-lane-heading">
                    <strong>{roadmapLaneLabel(lane)}</strong>
                    <span>{laneItems.length}</span>
                  </div>
                  <p>{roadmapLaneHint(lane)}</p>
                  <div className="roadmap-card-list">
                    {laneItems.length === 0 ? (
                      <div className="roadmap-empty">暂无项目</div>
                    ) : (
                      laneItems.map((item) => (
                        <article className="roadmap-card" key={item.packageItem.id}>
                          <div className="decision-card-top">
                            <span className={`priority priority-${item.packageItem.priorityHint.toLowerCase()}`}>{item.packageItem.priorityHint}</span>
                            <span className={`score-pill ${persuasivenessTone(item.releaseFitScore)}`}>适配 {item.releaseFitScore}</span>
                          </div>
                          <h4>{item.packageItem.title}</h4>
                          <p>{item.decisionReason}</p>
                          <div className="decision-meta">
                            <span>{item.packageItem.source === "requirement" ? "需求池" : "机会雷达"}</span>
                            <span>风险 {impactLabel(item.engineeringRisk)}</span>
                            <span>{requirementEvidenceStrength(item.packageItem.evidenceIds.length)}</span>
                          </div>
                          <small>进入条件：{item.entryCondition}</small>
                          <small>验收：{item.packageItem.successMetric}</small>
                          <div className="button-row compact-actions">
                            {item.packageItem.source === "requirement" ? (
                              <>
                                <button className="ghost" onClick={() => updateRoadmapRequirement(item, "ToReview")}>
                                  待评审
                                </button>
                                <button className="primary" onClick={() => updateRoadmapRequirement(item, "Accepted")}>
                                  接受
                                </button>
                                <button className="ghost" onClick={() => updateRoadmapRequirement(item, "Deferred")}>
                                  暂缓
                                </button>
                              </>
                            ) : persistedRecommendationIds.has(item.packageItem.sourceId) ? (
                              <button className="primary" onClick={() => convertRoadmapRecommendation(item)}>
                                <Send size={15} />
                                转需求
                              </button>
                            ) : (
                              <small>执行分析后可流转</small>
                            )}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ReleaseValidationView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const plans = buildReleaseValidationPlans(data);
  const [stageFilter, setStageFilter] = useState<ReleaseValidationStage | "all">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(plans[0]?.id);
  const filteredPlans = plans.filter(
    (plan) =>
      (stageFilter === "all" || plan.stage === stageFilter) &&
      (riskFilter === "all" || plan.brief.roadmapItem.engineeringRisk === riskFilter || plan.metrics.some((metric) => metric.risk === riskFilter))
  );
  const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId) ?? filteredPlans[0];
  const grayPlans = plans.filter((plan) => plan.stage === "gray_release");
  const blockedPlans = plans.filter((plan) => plan.stage === "blocked");
  const missingChecklistCount = plans.flatMap((plan) => plan.checklist).filter((item) => item.status === "missing").length;
  const highMetricCount = plans.flatMap((plan) => plan.metrics).filter((metric) => metric.risk === "high").length;
  const stageOptions: ReleaseValidationStage[] = ["gray_release", "instrumentation", "blocked", "success_review"];

  const updateValidationRequirement = (plan: ReleaseValidationPlan, status: RequirementCandidate["status"]) => {
    const requirement = data.state.requirements.find((candidate) => candidate.id === plan.brief.packageItem.sourceId);
    if (!requirement) {
      return;
    }
    void runAction("validation-update-requirement", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  };

  const appendValidationToReport = (plan: ReleaseValidationPlan) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 上线验证：${plan.brief.packageItem.title}`;
    const snippet = [
      marker,
      "",
      `- 阶段：${releaseValidationStageLabel(plan.stage)}，可信度 ${plan.confidenceScore}`,
      `- 核心假设：${plan.hypothesis}`,
      `- 放量门槛：${plan.decisionGate}`,
      `- 关键指标：${plan.metrics.map((metric) => `${metric.metric}(${metric.eventName})`).join("、")}`,
      `- 检查项：${plan.checklist.map((item) => `${item.title}/${validationChecklistStatusLabel(item.status)}`).join("、")}`,
      `- 证据：${plan.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 上线验证计划\n\n${snippet}`;
    void runAction("validation-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="验证计划" value={plans.length} />
        <Metric label="可进灰度" value={grayPlans.length} tone={grayPlans.length ? "warn" : "ok"} />
        <Metric label="需补埋点" value={plans.filter((plan) => plan.stage === "instrumentation").length} />
        <Metric label="证据阻塞" value={blockedPlans.length} tone={blockedPlans.length ? "warn" : "ok"} />
        <Metric label="缺失检查项" value={missingChecklistCount} tone={missingChecklistCount ? "warn" : "ok"} />
        <Metric label="高风险指标" value={highMetricCount} tone={highMetricCount ? "warn" : "ok"} />
      </section>

      <section className="panel wide validation-summary-panel">
        <div className="panel-heading">
          <h3>上线验证摘要</h3>
          <small>把版本规划里的需求转成灰度、埋点、回滚和复盘口径。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>本周可灰度</strong>
            <p>
              {grayPlans.length === 0
                ? "暂无可直接进入灰度的计划，先补埋点或证据。"
                : grayPlans
                    .slice(0, 2)
                    .map((plan) => plan.brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发先补</strong>
            <p>
              {plans.filter((plan) => plan.stage === "instrumentation").length === 0
                ? "埋点和灰度准备压力较低，重点确认回滚阈值。"
                : plans
                    .filter((plan) => plan.stage === "instrumentation")
                    .slice(0, 2)
                    .map((plan) => plan.brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>不能直接上</strong>
            <p>
              {blockedPlans.length === 0
                ? "当前没有高风险证据阻塞项。"
                : blockedPlans
                    .slice(0, 2)
                    .map((plan) => plan.stageReason)
                    .join("；")}
            </p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>验证筛选</h3>
          <small>{filteredPlans.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as ReleaseValidationStage | "all")}>
            <option value="all">全部阶段</option>
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {releaseValidationStageLabel(stage)}
              </option>
            ))}
          </select>
          <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as "all" | "high" | "medium" | "low")}>
            <option value="all">全部风险</option>
            <option value="high">高风险</option>
            <option value="medium">中风险</option>
            <option value="low">低风险</option>
          </select>
        </div>
      </section>

      <section className="panel wide validation-workbench">
        <div className="validation-list-panel">
          <div className="panel-heading nested-heading">
            <h3>验证队列</h3>
          </div>
          {filteredPlans.length === 0 ? (
            <EmptyState title="暂无验证计划" text="调整筛选，或先在版本规划中形成候选需求。" />
          ) : (
            <div className="validation-plan-list">
              {filteredPlans.map((plan) => (
                <button
                  className={selectedPlan?.id === plan.id ? "validation-plan-card active" : "validation-plan-card"}
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="decision-card-top">
                    <span className={`priority priority-${plan.brief.packageItem.priorityHint.toLowerCase()}`}>{plan.brief.packageItem.priorityHint}</span>
                    <span className={`score-pill ${persuasivenessTone(plan.confidenceScore)}`}>可信 {plan.confidenceScore}</span>
                  </div>
                  <strong>{plan.brief.packageItem.title}</strong>
                  <p>{plan.stageReason}</p>
                  <div className="validation-plan-meta">
                    <span>{releaseValidationStageLabel(plan.stage)}</span>
                    <span>{plan.releaseWindow}</span>
                    <span>指标 {plan.metrics.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="validation-detail-panel">
          {!selectedPlan ? (
            <EmptyState title="未选择验证计划" text="从左侧选择一个计划查看灰度、指标和检查项。" />
          ) : (
            <>
              <div className="validation-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedPlan.confidenceScore)}`}>验证可信度 {selectedPlan.confidenceScore}</span>
                  <h3>{selectedPlan.brief.packageItem.title}</h3>
                  <p>{selectedPlan.hypothesis}</p>
                </div>
                <div className="button-row compact-actions">
                  {selectedPlan.brief.packageItem.source === "requirement" ? (
                    <>
                      <button className="ghost" onClick={() => updateValidationRequirement(selectedPlan, "ToReview")}>
                        待评审
                      </button>
                      <button className="primary" onClick={() => updateValidationRequirement(selectedPlan, "Accepted")}>
                        接受
                      </button>
                      <button className="ghost" onClick={() => updateValidationRequirement(selectedPlan, "Deferred")}>
                        暂缓
                      </button>
                    </>
                  ) : (
                    <small>机会项转需求后可流转状态</small>
                  )}
                  <button className="secondary" disabled={!latestReport} onClick={() => appendValidationToReport(selectedPlan)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid validation-fact-grid">
                <article>
                  <strong>验证阶段</strong>
                  <p>{releaseValidationStageLabel(selectedPlan.stage)}</p>
                </article>
                <article>
                  <strong>放量窗口</strong>
                  <p>{selectedPlan.releaseWindow}</p>
                </article>
                <article>
                  <strong>研发风险</strong>
                  <p>{impactLabel(selectedPlan.brief.roadmapItem.engineeringRisk)}</p>
                </article>
                <article>
                  <strong>放量门槛</strong>
                  <p>{selectedPlan.decisionGate}</p>
                </article>
              </div>

              <section className="validation-section">
                <div className="panel-heading nested-heading">
                  <h3>上线前检查清单</h3>
                  <small>{selectedPlan.checklist.filter((item) => item.status === "ready").length} / {selectedPlan.checklist.length} 已具备</small>
                </div>
                <div className="validation-checklist-grid">
                  {selectedPlan.checklist.map((item) => (
                    <article className={`validation-check-card check-${item.status}`} key={item.id}>
                      <div className="decision-card-top">
                        <strong>{item.title}</strong>
                        <span>{validationChecklistStatusLabel(item.status)}</span>
                      </div>
                      <p>{item.detail}</p>
                      <small>{recommendationOwnerLabel(item.owner)}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="validation-section">
                <div className="panel-heading nested-heading">
                  <h3>指标与埋点</h3>
                  <small>{selectedPlan.metrics.length} 个关键事件</small>
                </div>
                <div className="validation-metric-list">
                  {selectedPlan.metrics.map((metric) => (
                    <article key={`${selectedPlan.id}-${metric.eventName}`}>
                      <div className="decision-card-top">
                        <strong>{metric.metric}</strong>
                        <span className={`severity ${metric.risk}`}>{impactLabel(metric.risk)}</span>
                      </div>
                      <code>{metric.eventName}</code>
                      <div className="validation-metric-grid">
                        <span>
                          <strong>基线</strong>
                          {metric.baseline}
                        </span>
                        <span>
                          <strong>目标</strong>
                          {metric.target}
                        </span>
                        <span>
                          <strong>复盘窗口</strong>
                          {metric.reviewWindow}
                        </span>
                      </div>
                      <p>{metric.successDefinition}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="validation-section validation-two-col">
                <div>
                  <h3>风险与阻塞</h3>
                  {selectedPlan.risks.length === 0 ? (
                    <div className="evidence-list empty">暂无高风险证据缺口，按检查清单执行即可。</div>
                  ) : (
                    <div className="validation-risk-list">
                      {selectedPlan.risks.map((risk) => (
                        <article key={`${selectedPlan.id}-${risk.title}`}>
                          <strong>{risk.title}</strong>
                          <p>{risk.detail}</p>
                          <small>{risk.action}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>关联证据</h3>
                  <EvidenceList data={data} evidenceIds={selectedPlan.evidenceIds.slice(0, 6)} />
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EngineeringReadinessView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const plans = buildEngineeringReadinessPlans(data);
  const [stageFilter, setStageFilter] = useState<EngineeringReadinessStage | "all">("all");
  const [domainFilter, setDomainFilter] = useState<EngineeringDomain | "all">("all");
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(plans[0]?.id);
  const filteredPlans = plans.filter(
    (plan) =>
      (stageFilter === "all" || plan.stage === stageFilter) &&
      (domainFilter === "all" || plan.dependencyMap.some((dependency) => dependency.domain === domainFilter) || plan.dataContracts.some((contract) => contract.domain === domainFilter))
  );
  const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId) ?? filteredPlans[0];
  const readyPlans = plans.filter((plan) => plan.stage === "ready_to_scope");
  const blockedPlans = plans.filter((plan) => plan.stage === "blocked");
  const reviewDependencies = plans.flatMap((plan) => plan.dependencyMap).filter((dependency) => dependency.status !== "ready");
  const highQaChecks = plans.flatMap((plan) => plan.qaChecks).filter((check) => check.risk === "high");
  const domainOptions = uniqueValues(plans.flatMap((plan) => [...plan.dependencyMap, ...plan.dataContracts].map((dependency) => dependency.domain))) as EngineeringDomain[];
  const stageOptions: EngineeringReadinessStage[] = ["ready_to_scope", "needs_data", "needs_design", "needs_risk_review", "blocked"];

  const updateEngineeringRequirement = (plan: EngineeringReadinessPlan, status: RequirementCandidate["status"]) => {
    const requirement = data.state.requirements.find((candidate) => candidate.id === plan.validationPlan.brief.packageItem.sourceId);
    if (!requirement) {
      return;
    }
    void runAction("engineering-update-requirement", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  };

  const appendEngineeringToReport = (plan: EngineeringReadinessPlan) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 研发准备：${plan.validationPlan.brief.packageItem.title}`;
    const snippet = [
      marker,
      "",
      `- 开工阶段：${engineeringReadinessStageLabel(plan.stage)}，准备度 ${plan.readinessScore}`,
      `- 开工门槛：${plan.devStartGate}`,
      `- 实现摘要：${plan.implementationSummary}`,
      `- 依赖：${plan.dependencyMap.map((dependency) => `${engineeringDomainLabel(dependency.domain)}/${engineeringDependencyStatusLabel(dependency.status)}`).join("、")}`,
      `- 数据契约：${plan.dataContracts.map((contract) => contract.title).join("、")}`,
      `- QA：${plan.qaChecks.map((check) => `${check.title}/${impactLabel(check.risk)}`).join("、")}`,
      `- 证据：${plan.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 研发准备度补充\n\n${snippet}`;
    void runAction("engineering-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="研发计划" value={plans.length} />
        <Metric label="可进方案" value={readyPlans.length} tone={readyPlans.length ? "ok" : "warn"} />
        <Metric label="需数据契约" value={plans.filter((plan) => plan.stage === "needs_data").length} tone="warn" />
        <Metric label="需风险评审" value={plans.filter((plan) => plan.stage === "needs_risk_review").length} />
        <Metric label="阻塞项" value={blockedPlans.length} tone={blockedPlans.length ? "warn" : "ok"} />
        <Metric label="高风险 QA" value={highQaChecks.length} tone={highQaChecks.length ? "warn" : "ok"} />
      </section>

      <section className="panel wide engineering-summary-panel">
        <div className="panel-heading">
          <h3>研发准备摘要</h3>
          <small>把产品决策继续拆成依赖、数据契约、QA 用例和开工门槛。</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>可以开技术方案</strong>
            <p>
              {readyPlans.length === 0
                ? "暂无完全就绪项，优先补数据契约、设计状态或风险评审。"
                : readyPlans
                    .slice(0, 2)
                    .map((plan) => plan.validationPlan.brief.packageItem.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发先评</strong>
            <p>
              {reviewDependencies.length === 0
                ? "依赖评审压力较低，重点确认灰度和回滚。"
                : reviewDependencies
                    .slice(0, 2)
                    .map((dependency) => `${engineeringDomainLabel(dependency.domain)}：${dependency.title}`)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>不能开工</strong>
            <p>
              {blockedPlans.length === 0
                ? "当前没有不可开工的需求。"
                : blockedPlans
                    .slice(0, 2)
                    .map((plan) => `${plan.validationPlan.brief.packageItem.title}：${plan.devStartGate}`)
                    .join("；")}
            </p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>准备度筛选</h3>
          <small>{filteredPlans.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as EngineeringReadinessStage | "all")}>
            <option value="all">全部阶段</option>
            {stageOptions.map((stage) => (
              <option key={stage} value={stage}>
                {engineeringReadinessStageLabel(stage)}
              </option>
            ))}
          </select>
          <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value as EngineeringDomain | "all")}>
            <option value="all">全部依赖域</option>
            {domainOptions.map((domain) => (
              <option key={domain} value={domain}>
                {engineeringDomainLabel(domain)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide engineering-workbench">
        <div className="engineering-list-panel">
          <div className="panel-heading nested-heading">
            <h3>研发准备队列</h3>
          </div>
          {filteredPlans.length === 0 ? (
            <EmptyState title="暂无研发准备项" text="调整筛选，或先完成产品决策和上线验证计划。" />
          ) : (
            <div className="engineering-plan-list">
              {filteredPlans.map((plan) => (
                <button
                  className={selectedPlan?.id === plan.id ? "engineering-plan-card active" : "engineering-plan-card"}
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="decision-card-top">
                    <span className={`priority priority-${plan.validationPlan.brief.packageItem.priorityHint.toLowerCase()}`}>{plan.validationPlan.brief.packageItem.priorityHint}</span>
                    <span className={`score-pill ${persuasivenessTone(plan.readinessScore)}`}>准备 {plan.readinessScore}</span>
                  </div>
                  <strong>{plan.validationPlan.brief.packageItem.title}</strong>
                  <p>{plan.devStartGate}</p>
                  <div className="engineering-plan-meta">
                    <span>{engineeringReadinessStageLabel(plan.stage)}</span>
                    <span>依赖 {plan.dependencyMap.length}</span>
                    <span>QA {plan.qaChecks.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="engineering-detail-panel">
          {!selectedPlan ? (
            <EmptyState title="未选择研发准备项" text="从左侧选择一个计划查看开工门槛。" />
          ) : (
            <>
              <div className="engineering-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedPlan.readinessScore)}`}>研发准备度 {selectedPlan.readinessScore}</span>
                  <h3>{selectedPlan.validationPlan.brief.packageItem.title}</h3>
                  <p>{selectedPlan.implementationSummary}</p>
                </div>
                <div className="button-row compact-actions">
                  {selectedPlan.validationPlan.brief.packageItem.source === "requirement" ? (
                    <>
                      <button className="ghost" onClick={() => updateEngineeringRequirement(selectedPlan, "ToReview")}>
                        待评审
                      </button>
                      <button className="primary" onClick={() => updateEngineeringRequirement(selectedPlan, "Accepted")}>
                        接受
                      </button>
                      <button className="ghost" onClick={() => updateEngineeringRequirement(selectedPlan, "Deferred")}>
                        暂缓
                      </button>
                    </>
                  ) : (
                    <small>机会项转需求后可流转状态</small>
                  )}
                  <button className="secondary" disabled={!latestReport} onClick={() => appendEngineeringToReport(selectedPlan)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid engineering-fact-grid">
                <article>
                  <strong>开工阶段</strong>
                  <p>{engineeringReadinessStageLabel(selectedPlan.stage)}</p>
                </article>
                <article>
                  <strong>开工门槛</strong>
                  <p>{selectedPlan.devStartGate}</p>
                </article>
                <article>
                  <strong>验证阶段</strong>
                  <p>{releaseValidationStageLabel(selectedPlan.validationPlan.stage)}</p>
                </article>
                <article>
                  <strong>灰度窗口</strong>
                  <p>{selectedPlan.validationPlan.releaseWindow}</p>
                </article>
              </div>

              <section className="engineering-section">
                <div className="panel-heading nested-heading">
                  <h3>依赖图</h3>
                  <small>{selectedPlan.dependencyMap.filter((dependency) => dependency.status === "ready").length} / {selectedPlan.dependencyMap.length} 已具备</small>
                </div>
                <div className="engineering-dependency-grid">
                  {selectedPlan.dependencyMap.map((dependency) => (
                    <article className={`engineering-dependency-card dependency-${dependency.status}`} key={dependency.id}>
                      <div className="decision-card-top">
                        <strong>{dependency.title}</strong>
                        <span>{engineeringDependencyStatusLabel(dependency.status)}</span>
                      </div>
                      <small>{engineeringDomainLabel(dependency.domain)} / {recommendationOwnerLabel(dependency.owner)}</small>
                      <p>{dependency.detail}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="engineering-section">
                <div className="panel-heading nested-heading">
                  <h3>数据契约</h3>
                  <small>{selectedPlan.dataContracts.length} 个事件</small>
                </div>
                <div className="engineering-contract-list">
                  {selectedPlan.dataContracts.map((contract) => (
                    <article key={contract.id}>
                      <div className="decision-card-top">
                        <strong>{contract.title}</strong>
                        <span>{engineeringDependencyStatusLabel(contract.status)}</span>
                      </div>
                      <p>{contract.detail}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="engineering-section">
                <div className="panel-heading nested-heading">
                  <h3>QA 验收矩阵</h3>
                  <small>{selectedPlan.qaChecks.length} 条</small>
                </div>
                <div className="engineering-qa-grid">
                  {selectedPlan.qaChecks.map((check) => (
                    <article key={check.id}>
                      <div className="decision-card-top">
                        <strong>{check.title}</strong>
                        <span className={`severity ${check.risk}`}>{impactLabel(check.risk)}</span>
                      </div>
                      <p>{check.acceptance}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="engineering-section engineering-two-col">
                <div>
                  <h3>开放问题</h3>
                  {selectedPlan.openQuestions.length === 0 ? (
                    <div className="evidence-list empty">暂无明显开放问题，可进入技术方案评审。</div>
                  ) : (
                    <div className="engineering-question-list">
                      {selectedPlan.openQuestions.map((question) => (
                        <span key={question}>{question}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>建议推进节奏</h3>
                  <div className="engineering-rollout-list">
                    {selectedPlan.rolloutPlan.map((step, index) => (
                      <span key={`${selectedPlan.id}-rollout-${step}`}>
                        {index + 1}. {step}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="engineering-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedPlan.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedPlan.evidenceIds.slice(0, 8)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ExecutionBacklogView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const items = buildExecutionBacklog(data, latestReport);
  const [laneFilter, setLaneFilter] = useState<ExecutionBacklogLane | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState<ActionRecommendation["ownerRole"] | "all">("all");
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(items[0]?.id);
  const filteredItems = items.filter((item) => (laneFilter === "all" || item.lane === laneFilter) && (ownerFilter === "all" || item.owner === ownerFilter));
  const selectedItem = filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0];
  const laneOptions: ExecutionBacklogLane[] = ["blocked", "this_week", "needs_evidence", "needs_scope", "next_version", "watch"];
  const ownerOptions = uniqueValues(items.map((item) => item.owner)) as ActionRecommendation["ownerRole"][];

  const appendBacklogToReport = (item: ExecutionBacklogItem) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 执行任务：${item.title}`;
    const snippet = [
      marker,
      "",
      `- 来源：${item.sourceLabel}`,
      `- 队列：${executionBacklogLaneLabel(item.lane)}，优先级 ${item.priority}，任务分 ${item.score}`,
      `- 负责人：${recommendationOwnerLabel(item.owner)}，风险：${impactLabel(item.risk)}`,
      `- 为什么做：${item.reason}`,
      `- 下一步：${item.nextStep}`,
      `- 范围：${item.scope}`,
      `- 验收：${item.acceptance.join("；")}`,
      `- Evidence：${item.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 执行任务墙\n\n${snippet}`;
    void runAction("backlog-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="执行项" value={items.length} />
        <Metric label="本周处理" value={items.filter((item) => item.lane === "this_week").length} tone="warn" />
        <Metric label="阻塞" value={items.filter((item) => item.lane === "blocked").length} tone={items.some((item) => item.lane === "blocked") ? "warn" : "ok"} />
        <Metric label="先补证据" value={items.filter((item) => item.lane === "needs_evidence").length} />
        <Metric label="研发项" value={items.filter((item) => item.owner === "engineering").length} />
        <Metric label="证据引用" value={uniqueValues(items.flatMap((item) => item.evidenceIds)).length} />
      </section>

      <section className="panel wide execution-summary-panel">
        <div className="panel-heading">
          <h3>执行任务墙</h3>
          <small>把机会、功能差距、决策、验证、研发准备、风险和补证据统一成行动队列</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>本周先做</strong>
            <p>{items.find((item) => item.lane === "this_week")?.title ?? "暂无可直接执行项，先处理阻塞或补证据。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>研发先看</strong>
            <p>{items.find((item) => item.owner === "engineering")?.nextStep ?? "暂无明确研发动作，先从产品决策和验证计划补输入。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最大阻塞</strong>
            <p>{items.find((item) => item.lane === "blocked")?.reason ?? "当前阻塞较少，可以推进评审或补范围。"}</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>任务筛选</h3>
          <small>{filteredItems.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={laneFilter} onChange={(event) => setLaneFilter(event.target.value as ExecutionBacklogLane | "all")}>
            <option value="all">全部队列</option>
            {laneOptions.map((lane) => (
              <option key={lane} value={lane}>
                {executionBacklogLaneLabel(lane)}
              </option>
            ))}
          </select>
          <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as ActionRecommendation["ownerRole"] | "all")}>
            <option value="all">全部负责人</option>
            {ownerOptions.map((owner) => (
              <option key={owner} value={owner}>
                {recommendationOwnerLabel(owner)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide execution-workbench">
        <div className="execution-board">
          {laneOptions.map((lane) => {
            const laneItems = filteredItems.filter((item) => item.lane === lane);
            return (
              <section className={`execution-lane lane-${lane}`} key={lane}>
                <div className="roadmap-lane-heading">
                  <strong>{executionBacklogLaneLabel(lane)}</strong>
                  <span>{laneItems.length}</span>
                </div>
                <div className="execution-lane-list">
                  {laneItems.length === 0 ? (
                    <div className="roadmap-empty">暂无任务</div>
                  ) : (
                    laneItems.slice(0, 12).map((item) => (
                      <button className={selectedItem?.id === item.id ? "execution-task-card active" : "execution-task-card"} key={item.id} onClick={() => setSelectedItemId(item.id)}>
                        <div className="decision-card-top">
                          <span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span>
                          <span className={`score-pill ${persuasivenessTone(item.score)}`}>{item.score}</span>
                        </div>
                        <strong>{item.title}</strong>
                        <p>{item.nextStep}</p>
                        <div className="execution-task-meta">
                          <span>{item.sourceLabel}</span>
                          <span>{recommendationOwnerLabel(item.owner)}</span>
                          <span>{impactLabel(item.risk)}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>

        <div className="execution-detail-panel">
          {!selectedItem ? (
            <EmptyState title="未选择任务" text="从任务墙选择一个执行项查看详情。" />
          ) : (
            <>
              <div className="execution-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedItem.score)}`}>任务分 {selectedItem.score}</span>
                  <h3>{selectedItem.title}</h3>
                  <p>{selectedItem.reason}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendBacklogToReport(selectedItem)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid execution-fact-grid">
                <article>
                  <strong>队列</strong>
                  <p>{executionBacklogLaneLabel(selectedItem.lane)}</p>
                </article>
                <article>
                  <strong>来源</strong>
                  <p>{selectedItem.sourceLabel}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{recommendationOwnerLabel(selectedItem.owner)}</p>
                </article>
                <article>
                  <strong>风险</strong>
                  <p>{impactLabel(selectedItem.risk)}</p>
                </article>
              </div>

              <section className="execution-section execution-two-col">
                <div>
                  <h3>下一步</h3>
                  <div className="impact-action-list">
                    <span>{selectedItem.nextStep}</span>
                    <span>{selectedItem.scope}</span>
                  </div>
                </div>
                <div>
                  <h3>验收口径</h3>
                  <div className="impact-action-list">
                    {selectedItem.acceptance.slice(0, 6).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              </section>

              <section className="execution-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedItem.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedItem.evidenceIds.slice(0, 10)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricDictionaryView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const metrics = buildMetricDictionary(data);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [ownerFilter, setOwnerFilter] = useState<ActionRecommendation["ownerRole"] | "all">("all");
  const [selectedMetricId, setSelectedMetricId] = useState<string | undefined>(metrics[0]?.id);
  const filteredMetrics = metrics.filter((metric) => (riskFilter === "all" || metric.risk === riskFilter) && (ownerFilter === "all" || metric.owner === ownerFilter));
  const selectedMetric = filteredMetrics.find((metric) => metric.id === selectedMetricId) ?? filteredMetrics[0];
  const ownerOptions = uniqueValues(metrics.map((metric) => metric.owner)) as ActionRecommendation["ownerRole"][];

  const appendMetricToReport = (metric: MetricDictionaryItem) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 指标字典：${metric.eventName}`;
    const snippet = [
      marker,
      "",
      `- 指标：${metric.title}`,
      `- 事件：${metric.eventName}`,
      `- 风险：${impactLabel(metric.risk)}，负责人：${recommendationOwnerLabel(metric.owner)}`,
      `- 基线：${metric.baseline}`,
      `- 目标：${metric.target}`,
      `- 复盘窗口：${metric.reviewWindow}`,
      `- 成功定义：${metric.successDefinition}`,
      `- 缺口：${metric.missingFields.join("；") || "暂无"}`,
      `- Evidence：${metric.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 指标字典\n\n${snippet}`;
    void runAction("metric-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="指标事件" value={metrics.length} />
        <Metric label="高风险" value={metrics.filter((metric) => metric.risk === "high").length} tone={metrics.some((metric) => metric.risk === "high") ? "warn" : "ok"} />
        <Metric label="缺字段" value={metrics.filter((metric) => metric.missingFields.length > 0).length} tone={metrics.some((metric) => metric.missingFields.length > 0) ? "warn" : "ok"} />
        <Metric label="研发负责" value={metrics.filter((metric) => metric.owner === "engineering").length} />
        <Metric label="P0/P1" value={metrics.filter((metric) => metric.priority !== "P2").length} />
        <Metric label="证据引用" value={uniqueValues(metrics.flatMap((metric) => metric.evidenceIds)).length} />
      </section>

      <section className="panel wide metric-dictionary-summary">
        <div className="panel-heading">
          <h3>指标字典</h3>
          <small>把上线验证计划转成研发、数据和 PM 可以对齐的事件口径</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最先定义</strong>
            <p>{metrics.find((metric) => metric.risk === "high")?.eventName ?? metrics[0]?.eventName ?? "暂无验证指标，先生成产品决策和上线验证计划。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>字段缺口</strong>
            <p>{metrics.find((metric) => metric.missingFields.length > 0)?.missingFields[0] ?? "指标字段基本完整，进入研发评审时确认触发时机。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>使用边界</strong>
            <p>当前只展示计划口径，不展示真实上线结果或真实埋点数据。</p>
          </article>
        </div>
      </section>

      <section className="panel wide metric-dictionary-workbench">
        <div className="metric-list-panel">
          <div className="panel-heading nested-heading">
            <h3>指标列表</h3>
            <div className="filter-bar compact-filter">
              <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as "all" | "high" | "medium" | "low")}>
                <option value="all">全部风险</option>
                <option value="high">高风险</option>
                <option value="medium">中风险</option>
                <option value="low">低风险</option>
              </select>
              <select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value as ActionRecommendation["ownerRole"] | "all")}>
                <option value="all">全部负责人</option>
                {ownerOptions.map((owner) => (
                  <option key={owner} value={owner}>
                    {recommendationOwnerLabel(owner)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="metric-dictionary-list">
            {filteredMetrics.length === 0 ? (
              <EmptyState title="暂无指标" text="调整筛选，或先生成上线验证计划。" />
            ) : (
              filteredMetrics.map((metric) => (
                <button className={selectedMetric?.id === metric.id ? "metric-dictionary-card active" : "metric-dictionary-card"} key={metric.id} onClick={() => setSelectedMetricId(metric.id)}>
                  <div className="decision-card-top">
                    <span className={`severity ${metric.risk}`}>{impactLabel(metric.risk)}</span>
                    <span className={`priority priority-${metric.priority.toLowerCase()}`}>{metric.priority}</span>
                  </div>
                  <strong>{metric.eventName}</strong>
                  <p>{metric.title}</p>
                  <div className="execution-task-meta">
                    <span>{recommendationOwnerLabel(metric.owner)}</span>
                    <span>缺口 {metric.missingFields.length}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="metric-detail-panel">
          {!selectedMetric ? (
            <EmptyState title="未选择指标" text="从左侧选择指标查看字段和验收口径。" />
          ) : (
            <>
              <div className="metric-detail-hero">
                <div>
                  <span className={`severity ${selectedMetric.risk}`}>{impactLabel(selectedMetric.risk)}</span>
                  <h3>{selectedMetric.eventName}</h3>
                  <p>{selectedMetric.title}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendMetricToReport(selectedMetric)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid metric-fact-grid">
                <article>
                  <strong>基线</strong>
                  <p>{selectedMetric.baseline}</p>
                </article>
                <article>
                  <strong>目标</strong>
                  <p>{selectedMetric.target}</p>
                </article>
                <article>
                  <strong>复盘窗口</strong>
                  <p>{selectedMetric.reviewWindow}</p>
                </article>
                <article>
                  <strong>来源需求</strong>
                  <p>{selectedMetric.source}</p>
                </article>
              </div>

              <section className="metric-section metric-two-col">
                <div>
                  <h3>成功定义</h3>
                  <div className="impact-action-list">
                    <span>{selectedMetric.successDefinition}</span>
                    <span>{selectedMetric.implementationNote}</span>
                  </div>
                </div>
                <div>
                  <h3>字段缺口</h3>
                  {selectedMetric.missingFields.length === 0 ? (
                    <div className="evidence-list empty">字段口径基本完整，研发评审时确认触发时机。</div>
                  ) : (
                    <div className="impact-action-list warning">
                      {selectedMetric.missingFields.map((field) => (
                        <span key={field}>{field}</span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="metric-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedMetric.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedMetric.evidenceIds.slice(0, 10)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EvidenceCollectionQueueView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const tasks = buildEvidenceCollectionQueue(data, latestReport);
  const [statusFilter, setStatusFilter] = useState<EvidenceCollectionStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(tasks[0]?.id);
  const filteredTasks = tasks.filter((task) => (statusFilter === "all" || task.status === statusFilter) && (priorityFilter === "all" || task.priority === priorityFilter));
  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0];
  const activeAppId = data.state.currentOwnedApp?.id;

  const appendEvidenceTaskToReport = (task: EvidenceCollectionTask) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 补证任务：${task.title}`;
    const snippet = [
      marker,
      "",
      `- 状态：${evidenceCollectionStatusLabel(task.status)}，优先级 ${task.priority}，缺口分 ${task.score}`,
      `- 来源：${task.source}`,
      `- 平台：${task.platform}，证据类型：${task.evidenceType}`,
      `- 原因：${task.reason}`,
      `- 下一步：${task.nextAction}`,
      `- 关联对象：${task.relatedObject}`,
      `- Evidence：${task.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 补证队列\n\n${snippet}`;
    void runAction("evidence-queue-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="补证任务" value={tasks.length} />
        <Metric label="缺失" value={tasks.filter((task) => task.status === "missing").length} tone="warn" />
        <Metric label="薄弱" value={tasks.filter((task) => task.status === "weak").length} />
        <Metric label="过旧" value={tasks.filter((task) => task.status === "stale").length} />
        <Metric label="P0" value={tasks.filter((task) => task.priority === "P0").length} tone="warn" />
        <Metric label="已有证据" value={uniqueValues(tasks.flatMap((task) => task.evidenceIds)).length} />
      </section>

      <section className="panel wide evidence-queue-summary">
        <div className="panel-heading">
          <h3>补证队列</h3>
          <small>从覆盖地图、引用图谱、影响链、战略雷达和报告门禁抽取证据缺口</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>先补什么</strong>
            <p>{tasks[0] ? `${tasks[0].title}：${tasks[0].nextAction}` : "暂无明显证据缺口。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>平台缺口</strong>
            <p>{uniqueValues(tasks.slice(0, 8).map((task) => task.platform)).join("、") || "暂无"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>使用边界</strong>
            <p>补证队列是采集建议，不会绕过登录、验证码、频控或平台限制。</p>
          </article>
        </div>
      </section>

      <section className="panel wide evidence-queue-workbench">
        <div className="evidence-queue-list-panel">
          <div className="panel-heading nested-heading">
            <h3>任务列表</h3>
            <div className="filter-bar compact-filter">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EvidenceCollectionStatus | "all")}>
                <option value="all">全部状态</option>
                <option value="missing">缺失</option>
                <option value="weak">薄弱</option>
                <option value="stale">过旧</option>
                <option value="manual">手动补</option>
              </select>
              <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as Priority | "all")}>
                <option value="all">全部优先级</option>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="evidence-queue-list">
            {filteredTasks.length === 0 ? (
              <EmptyState title="暂无补证任务" text="调整筛选，或先运行采集和分析。" />
            ) : (
              filteredTasks.map((task) => (
                <button className={selectedTask?.id === task.id ? "evidence-queue-card active" : "evidence-queue-card"} key={task.id} onClick={() => setSelectedTaskId(task.id)}>
                  <div className="decision-card-top">
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <span>{evidenceCollectionStatusLabel(task.status)}</span>
                  </div>
                  <strong>{task.title}</strong>
                  <p>{task.reason}</p>
                  <div className="execution-task-meta">
                    <span>{task.platform}</span>
                    <span>{task.evidenceType}</span>
                    <span>{task.source}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="evidence-queue-detail-panel">
          {!selectedTask ? (
            <EmptyState title="未选择补证任务" text="从左侧选择任务查看补证动作。" />
          ) : (
            <>
              <div className="evidence-queue-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(100 - selectedTask.score)}`}>缺口分 {selectedTask.score}</span>
                  <h3>{selectedTask.title}</h3>
                  <p>{selectedTask.reason}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="ghost" disabled={!activeAppId} onClick={() => activeAppId && void runAction("evidence-queue-crawl", () => triggerJob(activeAppId, "crawl"))}>
                    <Search size={15} />
                    采集
                  </button>
                  <button className="ghost" disabled={!activeAppId} onClick={() => activeAppId && void runAction("evidence-queue-analyze", () => triggerJob(activeAppId, "analyze"))}>
                    <Layers size={15} />
                    分析
                  </button>
                  <button className="secondary" disabled={!latestReport} onClick={() => appendEvidenceTaskToReport(selectedTask)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid evidence-queue-fact-grid">
                <article>
                  <strong>平台</strong>
                  <p>{selectedTask.platform}</p>
                </article>
                <article>
                  <strong>证据类型</strong>
                  <p>{selectedTask.evidenceType}</p>
                </article>
                <article>
                  <strong>来源</strong>
                  <p>{selectedTask.source}</p>
                </article>
                <article>
                  <strong>负责人</strong>
                  <p>{recommendationOwnerLabel(selectedTask.owner)}</p>
                </article>
              </div>

              <section className="evidence-queue-section evidence-queue-two-col">
                <div>
                  <h3>下一步</h3>
                  <div className="impact-action-list">
                    <span>{selectedTask.nextAction}</span>
                    <span>{selectedTask.relatedObject}</span>
                  </div>
                </div>
                <div>
                  <h3>已有证据</h3>
                  <EvidenceList data={data} evidenceIds={selectedTask.evidenceIds.slice(0, 6)} />
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ChangeImpactView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const traces = buildChangeImpactTraces(data);
  const [stageFilter, setStageFilter] = useState<ChangeImpactStage | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<ChangeImpactSource | "all">("all");
  const [selectedTraceId, setSelectedTraceId] = useState<string | undefined>(traces[0]?.id);
  const filteredTraces = traces.filter((trace) => (stageFilter === "all" || trace.stage === stageFilter) && (sourceFilter === "all" || trace.sourceType === sourceFilter));
  const selectedTrace = filteredTraces.find((trace) => trace.id === selectedTraceId) ?? filteredTraces[0];
  const highImpactCount = traces.filter((trace) => trace.impactScore >= 75).length;
  const blockedCount = traces.filter((trace) => trace.stage === "blocked").length;
  const executeCount = traces.filter((trace) => trace.stage === "execute").length;
  const unlinkedCount = traces.filter((trace) => trace.relatedDecisions.length === 0 || trace.relatedFeatures.length === 0).length;
  const sourceOptions = uniqueValues(traces.map((trace) => trace.sourceType)) as ChangeImpactSource[];

  const appendImpactToReport = (trace: ChangeImpactTrace) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 变更影响链：${trace.title}`;
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 变更影响链\n\n${trace.reportSnippet}`;
    void runAction("impact-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="影响链" value={traces.length} />
        <Metric label="高影响" value={highImpactCount} tone={highImpactCount ? "warn" : "ok"} />
        <Metric label="可执行" value={executeCount} tone={executeCount ? "ok" : "warn"} />
        <Metric label="阻塞" value={blockedCount} tone={blockedCount ? "warn" : "ok"} />
        <Metric label="待映射" value={unlinkedCount} tone={unlinkedCount ? "warn" : "ok"} />
        <Metric label="证据引用" value={uniqueValues(traces.flatMap((trace) => trace.evidenceIds)).length} />
      </section>

      <section className="panel wide impact-summary-panel">
        <div className="panel-heading">
          <h3>变更影响链摘要</h3>
          <small>从竞品变化追到功能、决策、验证、研发和风险</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最该处理</strong>
            <p>{traces[0] ? `${traces[0].title}，${changeImpactStageLabel(traces[0].stage)}。` : "暂无可追踪变化，先补采集和分析证据。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>最大阻塞</strong>
            <p>
              {blockedCount === 0
                ? "暂无明显阻塞，重点关注证据和研发准备度。"
                : traces
                    .filter((trace) => trace.stage === "blocked")
                    .slice(0, 2)
                    .map((trace) => trace.missingEvidence[0] ?? trace.title)
                    .join("；")}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>PM 要问</strong>
            <p>这条变化是否影响我们的功能优先级、会员边界、平台策略或研发排期。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>影响链筛选</h3>
          <small>{filteredTraces.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as ChangeImpactStage | "all")}>
            <option value="all">全部阶段</option>
            <option value="execute">可进入执行</option>
            <option value="review">需要评审</option>
            <option value="monitor">继续观察</option>
            <option value="blocked">阻塞</option>
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as ChangeImpactSource | "all")}>
            <option value="all">全部来源</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {changeImpactSourceLabel(source)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide impact-workbench">
        <div className="impact-list-panel">
          <div className="panel-heading nested-heading">
            <h3>变化队列</h3>
          </div>
          {filteredTraces.length === 0 ? (
            <EmptyState title="暂无影响链" text="调整筛选，或先执行采集和分析任务。" />
          ) : (
            <div className="impact-trace-list">
              {filteredTraces.map((trace) => (
                <button className={selectedTrace?.id === trace.id ? "impact-trace-card active" : "impact-trace-card"} key={trace.id} onClick={() => setSelectedTraceId(trace.id)}>
                  <div className="decision-card-top">
                    <span className={`severity ${trace.severity}`}>{impactLabel(trace.severity)}</span>
                    <span className={`score-pill ${persuasivenessTone(trace.impactScore)}`}>影响 {trace.impactScore}</span>
                  </div>
                  <strong>{trace.title}</strong>
                  <p>{trace.summary}</p>
                  <div className="impact-trace-meta">
                    <span>{trace.sourceLabel}</span>
                    <span>{trace.ownerName}</span>
                    <span>{changeImpactStageLabel(trace.stage)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="impact-detail-panel">
          {!selectedTrace ? (
            <EmptyState title="未选择影响链" text="从左侧选择一条变化查看关联证据和执行建议。" />
          ) : (
            <>
              <div className="impact-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedTrace.confidenceScore)}`}>置信度 {selectedTrace.confidenceScore}</span>
                  <h3>{selectedTrace.title}</h3>
                  <p>{selectedTrace.summary}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendImpactToReport(selectedTrace)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="decision-detail-grid impact-fact-grid">
                <article>
                  <strong>阶段</strong>
                  <p>{changeImpactStageLabel(selectedTrace.stage)}</p>
                </article>
                <article>
                  <strong>来源</strong>
                  <p>{selectedTrace.sourceLabel}</p>
                </article>
                <article>
                  <strong>关联功能</strong>
                  <p>{selectedTrace.relatedFeatures.length}</p>
                </article>
                <article>
                  <strong>关联决策</strong>
                  <p>{selectedTrace.relatedDecisions.length}</p>
                </article>
              </div>

              <section className="impact-section">
                <div className="panel-heading nested-heading">
                  <h3>链路路径</h3>
                  <small>变化 / 功能 / 决策 / 验证 / 研发</small>
                </div>
                <div className="impact-path">
                  <article>
                    <strong>变化</strong>
                    <p>{selectedTrace.sourceLabel} / {selectedTrace.ownerName}</p>
                  </article>
                  <article>
                    <strong>功能</strong>
                    <p>{selectedTrace.relatedFeatures.map((record) => record.feature.name).join("、") || "待映射"}</p>
                  </article>
                  <article>
                    <strong>决策</strong>
                    <p>{selectedTrace.relatedDecisions.map((decision) => decision.outcomeLabel).join("、") || "待判断"}</p>
                  </article>
                  <article>
                    <strong>研发</strong>
                    <p>{selectedTrace.relatedEngineeringPlans.map((plan) => engineeringReadinessStageLabel(plan.stage)).join("、") || "未进入研发准备"}</p>
                  </article>
                </div>
              </section>

              <section className="impact-section impact-two-col">
                <div>
                  <h3>下一步</h3>
                  <div className="impact-action-list">
                    {selectedTrace.nextActions.map((action) => (
                      <span key={action}>{action}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>证据缺口</h3>
                  {selectedTrace.missingEvidence.length === 0 ? (
                    <div className="evidence-list empty">影响链证据较完整，可以进入评审。</div>
                  ) : (
                    <div className="impact-action-list warning">
                      {selectedTrace.missingEvidence.map((gap) => (
                        <span key={gap}>{gap}</span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="impact-section">
                <div className="panel-heading nested-heading">
                  <h3>关联功能与任务</h3>
                  <small>{selectedTrace.relatedFeatures.length} 项</small>
                </div>
                <div className="impact-feature-grid">
                  {selectedTrace.relatedFeatures.length === 0 ? (
                    <div className="evidence-list empty">暂无关联功能，建议先补功能矩阵映射。</div>
                  ) : (
                    selectedTrace.relatedFeatures.map((record) => (
                      <article key={record.feature.id}>
                        <div className="decision-card-top">
                          <strong>{record.feature.name}</strong>
                          <span className={`score-pill ${persuasivenessTone(record.modelScore)}`}>{record.modelScore}</span>
                        </div>
                        <p>{record.modelSummary}</p>
                        <small>{record.taskCards[0]?.objective ?? record.insight.mvpScope}</small>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="impact-section impact-two-col">
                <div>
                  <h3>关联风险</h3>
                  {selectedTrace.relatedRisks.length === 0 ? (
                    <div className="evidence-list empty">暂无直接关联风险。</div>
                  ) : (
                    <div className="validation-risk-list">
                      {selectedTrace.relatedRisks.map((risk) => (
                        <article key={risk.id}>
                          <strong>{risk.title}</strong>
                          <p>{risk.summary}</p>
                          <small>{risk.mitigation}</small>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>关联证据</h3>
                  <EvidenceList data={data} evidenceIds={selectedTrace.evidenceIds.slice(0, 8)} />
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function EvidenceCitationGraphView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const claims = buildEvidenceCitationClaims(data, latestReport);
  const [statusFilter, setStatusFilter] = useState<CitationClaimStatus | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<CitationClaimSource | "all">("all");
  const [selectedClaimId, setSelectedClaimId] = useState<string | undefined>(claims[0]?.id);
  const filteredClaims = claims.filter((claim) => (statusFilter === "all" || claim.status === statusFilter) && (sourceFilter === "all" || claim.source === sourceFilter));
  const selectedClaim = filteredClaims.find((claim) => claim.id === selectedClaimId) ?? filteredClaims[0];
  const weakCount = claims.filter((claim) => claim.status === "weak" || claim.status === "unsupported").length;
  const readyCount = claims.filter((claim) => claim.status === "ready").length;
  const sourceOptions = uniqueValues(claims.map((claim) => claim.source)) as CitationClaimSource[];

  const appendCitationToReport = (claim: EvidenceCitationClaim) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 证据引用：${claim.title}`;
    const snippet = [
      marker,
      "",
      `- 来源模块：${citationSourceLabel(claim.source)}`,
      `- 引用状态：${citationStatusLabel(claim.status)}，支撑分 ${claim.supportScore}`,
      `- 结论：${claim.claim}`,
      `- 缺口：${claim.missingEvidence.join("；") || "暂无"}`,
      `- 下一步：${claim.nextAction}`,
      `- Evidence：${claim.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 证据引用审核\n\n${snippet}`;
    void runAction("citation-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="结论引用" value={claims.length} />
        <Metric label="可直接引用" value={readyCount} tone={readyCount ? "ok" : "warn"} />
        <Metric label="弱引用" value={weakCount} tone={weakCount ? "warn" : "ok"} />
        <Metric label="证据条数" value={uniqueValues(claims.flatMap((claim) => claim.evidenceIds)).length} />
        <Metric label="缺口数" value={claims.flatMap((claim) => claim.missingEvidence).length} tone={weakCount ? "warn" : "ok"} />
        <Metric label="平均支撑分" value={claims.length ? Math.round(claims.reduce((sum, claim) => sum + claim.supportScore, 0) / claims.length) : 0} />
      </section>

      <section className="panel wide citation-summary-panel">
        <div className="panel-heading">
          <h3>证据引用图谱</h3>
          <small>检查每条 PM 结论有没有足够 Evidence 支撑</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最弱结论</strong>
            <p>
              {claims.find((claim) => claim.status === "unsupported" || claim.status === "weak")?.title ??
                "当前强结论大多有证据支撑，可以继续进入报告审核。"}
            </p>
          </article>
          <article className="roadmap-summary-card">
            <strong>引用风险</strong>
            <p>{weakCount > 0 ? "弱引用需要补来源链接、截图、评论或跨平台样本。" : "暂无明显无证据强结论。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>评审口径</strong>
            <p>事实、模式、推断、建议要分层，不让报告把假设写成确定结论。</p>
          </article>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>引用筛选</h3>
          <small>{filteredClaims.length} 条</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as CitationClaimStatus | "all")}>
            <option value="all">全部状态</option>
            <option value="ready">可直接引用</option>
            <option value="reviewable">可评审</option>
            <option value="weak">需补证据</option>
            <option value="unsupported">不应引用</option>
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as CitationClaimSource | "all")}>
            <option value="all">全部模块</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {citationSourceLabel(source)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide citation-workbench">
        <div className="citation-list-panel">
          <div className="panel-heading nested-heading">
            <h3>结论列表</h3>
          </div>
          {filteredClaims.length === 0 ? (
            <EmptyState title="暂无结论" text="调整筛选，或先生成决策、战略、风险和报告。" />
          ) : (
            <div className="citation-claim-list">
              {filteredClaims.map((claim) => (
                <button className={selectedClaim?.id === claim.id ? "citation-claim-card active" : "citation-claim-card"} key={claim.id} onClick={() => setSelectedClaimId(claim.id)}>
                  <div className="decision-card-top">
                    <span className={`score-pill ${persuasivenessTone(claim.supportScore)}`}>支撑 {claim.supportScore}</span>
                    <span>{citationStatusLabel(claim.status)}</span>
                  </div>
                  <strong>{claim.title}</strong>
                  <p>{claim.claim}</p>
                  <div className="citation-claim-meta">
                    <span>{citationSourceLabel(claim.source)}</span>
                    <span>Evidence {claim.evidenceIds.length}</span>
                    <span>缺口 {claim.missingEvidence.length}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="citation-detail-panel">
          {!selectedClaim ? (
            <EmptyState title="未选择结论" text="从左侧选择一条结论查看证据链。" />
          ) : (
            <>
              <div className="citation-detail-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedClaim.supportScore)}`}>支撑分 {selectedClaim.supportScore}</span>
                  <h3>{selectedClaim.title}</h3>
                  <p>{selectedClaim.claim}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendCitationToReport(selectedClaim)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <div className="citation-metric-strip">
                <span>来源 {selectedClaim.sourceCount}</span>
                <span>平台 {selectedClaim.platformCount}</span>
                <span>截图 {selectedClaim.screenshotCount}</span>
                <span>评论 {selectedClaim.reviewCount}</span>
                <span>旧证据 {selectedClaim.staleCount}</span>
              </div>

              <section className="citation-section">
                <div className="panel-heading nested-heading">
                  <h3>引用链</h3>
                  <small>{citationSourceLabel(selectedClaim.source)} / Evidence / 缺口 / 下一步</small>
                </div>
                <div className="citation-path">
                  <article>
                    <strong>结论</strong>
                    <p>{citationStatusLabel(selectedClaim.status)}</p>
                  </article>
                  <article>
                    <strong>证据</strong>
                    <p>{selectedClaim.evidenceIds.length} 条 Evidence</p>
                  </article>
                  <article>
                    <strong>缺口</strong>
                    <p>{selectedClaim.missingEvidence[0] ?? "暂无关键缺口"}</p>
                  </article>
                  <article>
                    <strong>动作</strong>
                    <p>{selectedClaim.nextAction}</p>
                  </article>
                </div>
              </section>

              <section className="citation-section citation-two-col">
                <div>
                  <h3>缺口清单</h3>
                  {selectedClaim.missingEvidence.length === 0 ? (
                    <div className="evidence-list empty">证据可进入评审。</div>
                  ) : (
                    <div className="impact-action-list warning">
                      {selectedClaim.missingEvidence.map((gap) => (
                        <span key={gap}>{gap}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <h3>证据</h3>
                  <EvidenceList data={data} evidenceIds={selectedClaim.evidenceIds.slice(0, 10)} />
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function CompetitorRoadmapView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const hypotheses = buildCompetitorRoadmapHypotheses(data);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | undefined>(hypotheses[0]?.ownerId);
  const selectedHypothesis = hypotheses.find((hypothesis) => hypothesis.ownerId === selectedOwnerId) ?? hypotheses[0];
  const highConfidenceCount = hypotheses.flatMap((hypothesis) => hypothesis.bets).filter((bet) => bet.confidence >= 72).length;
  const nowCount = hypotheses.flatMap((hypothesis) => hypothesis.bets).filter((bet) => bet.horizon === "now").length;
  const blockerCount = hypotheses.flatMap((hypothesis) => hypothesis.blockers).length;

  const appendRoadmapToReport = (hypothesis: CompetitorRoadmapHypothesis) => {
    if (!latestReport) {
      return;
    }
    const marker = `### 竞品路线推测：${hypothesis.ownerName}`;
    const snippet = [
      marker,
      "",
      `- 综合置信度：${hypothesis.confidence}`,
      `- 摘要：${hypothesis.summary}`,
      `- 高置信路线：${hypothesis.bets
        .slice(0, 3)
        .map((bet) => `${bet.themeLabel}/${roadmapHorizonLabel(bet.horizon)}/${bet.confidence}`)
        .join("；")}`,
      `- 应对计划：${hypothesis.responsePlan.join("；")}`,
      `- 缺口：${hypothesis.blockers.join("；") || "暂无"}`,
      `- Evidence：${hypothesis.evidenceIds.join(", ") || "待补"}`
    ].join("\n");
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 竞品路线推测\n\n${snippet}`;
    void runAction("roadmap-hypothesis-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="竞品对象" value={hypotheses.length} />
        <Metric label="路线假设" value={hypotheses.flatMap((hypothesis) => hypothesis.bets).length} />
        <Metric label="高置信" value={highConfidenceCount} tone={highConfidenceCount ? "warn" : "ok"} />
        <Metric label="1-2 周" value={nowCount} tone={nowCount ? "warn" : "ok"} />
        <Metric label="证据缺口" value={blockerCount} tone={blockerCount ? "warn" : "ok"} />
        <Metric label="证据引用" value={uniqueValues(hypotheses.flatMap((hypothesis) => hypothesis.evidenceIds)).length} />
      </section>

      <section className="panel wide competitor-roadmap-summary">
        <div className="panel-heading">
          <h3>竞品功能路线推测</h3>
          <small>基于发布、价格、商店页、评论、社媒和功能模型推断下一步</small>
        </div>
        <div className="roadmap-summary-grid">
          <article className="roadmap-summary-card">
            <strong>最强路线</strong>
            <p>{selectedHypothesis?.summary ?? "暂无足够信号，先补版本、渠道和社媒证据。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>产品应对</strong>
            <p>{selectedHypothesis?.responsePlan[0] ?? "先补证据，再判断是否进入专题分析。"}</p>
          </article>
          <article className="roadmap-summary-card">
            <strong>反证意识</strong>
            <p>路线推测不是事实，必须同时展示缺口和低置信假设。</p>
          </article>
        </div>
      </section>

      <section className="panel wide competitor-roadmap-workbench">
        <div className="competitor-roadmap-list">
          <div className="panel-heading nested-heading">
            <h3>竞品列表</h3>
          </div>
          {hypotheses.length === 0 ? (
            <EmptyState title="暂无竞品" text="先添加竞品和渠道。" />
          ) : (
            hypotheses.map((hypothesis) => (
              <button
                className={selectedHypothesis?.ownerId === hypothesis.ownerId ? "competitor-roadmap-card active" : "competitor-roadmap-card"}
                key={hypothesis.ownerId}
                onClick={() => setSelectedOwnerId(hypothesis.ownerId)}
              >
                <div className="decision-card-top">
                  <span className={`priority priority-${(hypothesis.priority ?? "P2").toLowerCase()}`}>{hypothesis.priority ?? "P2"}</span>
                  <span className={`score-pill ${persuasivenessTone(hypothesis.confidence)}`}>置信 {hypothesis.confidence}</span>
                </div>
                <strong>{hypothesis.ownerName}</strong>
                <p>{hypothesis.summary}</p>
                <div className="competitor-roadmap-meta">
                  <span>假设 {hypothesis.bets.length}</span>
                  <span>缺口 {hypothesis.blockers.length}</span>
                  <span>Evidence {hypothesis.evidenceIds.length}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="competitor-roadmap-detail">
          {!selectedHypothesis ? (
            <EmptyState title="未选择竞品" text="从左侧选择竞品查看路线推测。" />
          ) : (
            <>
              <div className="competitor-roadmap-hero">
                <div>
                  <span className={`score-pill ${persuasivenessTone(selectedHypothesis.confidence)}`}>路线置信度 {selectedHypothesis.confidence}</span>
                  <h3>{selectedHypothesis.ownerName}</h3>
                  <p>{selectedHypothesis.summary}</p>
                </div>
                <div className="button-row compact-actions">
                  <button className="secondary" disabled={!latestReport} onClick={() => appendRoadmapToReport(selectedHypothesis)}>
                    <FileText size={15} />
                    写入周报
                  </button>
                </div>
              </div>

              <section className="competitor-roadmap-section">
                <div className="panel-heading nested-heading">
                  <h3>路线假设</h3>
                  <small>{selectedHypothesis.bets.length} 条</small>
                </div>
                <div className="roadmap-bet-grid">
                  {selectedHypothesis.bets.length === 0 ? (
                    <div className="evidence-list empty">暂无足够信号，先补渠道和版本证据。</div>
                  ) : (
                    selectedHypothesis.bets.map((bet) => (
                      <article key={bet.id}>
                        <div className="decision-card-top">
                          <strong>{bet.themeLabel}</strong>
                          <span className={`score-pill ${persuasivenessTone(bet.confidence)}`}>{bet.confidence}</span>
                        </div>
                        <h4>{bet.title}</h4>
                        <p>{bet.reason}</p>
                        <small>{roadmapHorizonLabel(bet.horizon)}</small>
                        <div className="impact-action-list">
                          {bet.likelyMoves.slice(0, 3).map((move) => (
                            <span key={move}>{move}</span>
                          ))}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>

              <section className="competitor-roadmap-section competitor-roadmap-two-col">
                <div>
                  <h3>应对计划</h3>
                  <div className="impact-action-list">
                    {selectedHypothesis.responsePlan.map((step) => (
                      <span key={step}>{step}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>证据缺口</h3>
                  {selectedHypothesis.blockers.length === 0 ? (
                    <div className="evidence-list empty">当前路线推测缺口较少，继续补反证即可。</div>
                  ) : (
                    <div className="impact-action-list warning">
                      {selectedHypothesis.blockers.map((blocker) => (
                        <span key={blocker}>{blocker}</span>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="competitor-roadmap-section">
                <div className="panel-heading nested-heading">
                  <h3>关联证据</h3>
                  <small>{selectedHypothesis.evidenceIds.length} 条 Evidence</small>
                </div>
                <EvidenceList data={data} evidenceIds={selectedHypothesis.evidenceIds.slice(0, 10)} />
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportQualityGateView({
  data,
  latestReport,
  runAction
}: {
  data: ApiStateResponse;
  latestReport?: Report;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const gate = buildReportQualityGate(data, latestReport);
  const blockedChecks = gate.checks.filter((check) => check.status === "blocked");
  const reviewChecks = gate.checks.filter((check) => check.status === "review");

  const appendGateToReport = () => {
    if (!latestReport) {
      return;
    }
    const marker = "### 报告审核门禁";
    const nextMarkdown = latestReport.markdown.includes(marker) ? latestReport.markdown : `${latestReport.markdown}\n\n## 报告审核\n\n${gate.reportSnippet}`;
    void runAction("report-gate-append-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${latestReport.id}`, {
        ownedAppId: latestReport.ownedAppId,
        markdown: nextMarkdown,
        status: latestReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="门禁分" value={gate.score} tone={gate.status === "pass" ? "ok" : "warn"} />
        <Metric label="检查项" value={gate.checks.length} />
        <Metric label="阻塞项" value={blockedChecks.length} tone={blockedChecks.length ? "warn" : "ok"} />
        <Metric label="需复核" value={reviewChecks.length} tone={reviewChecks.length ? "warn" : "ok"} />
        <Metric label="报告证据" value={gate.evidenceIds.length} />
        <Metric label="可通过项" value={gate.checks.filter((check) => check.status === "pass").length} tone="ok" />
      </section>

      <section className="panel wide report-gate-hero">
        <div>
          <span className={`score-pill ${reportGateStatusTone(gate.status)}`}>{reportGateStatusLabel(gate.status)}</span>
          <h3>报告审核门禁</h3>
          <p>{gate.verdict}</p>
        </div>
        <div className="button-row compact-actions">
          <button className="secondary" disabled={!latestReport} onClick={appendGateToReport}>
            <FileText size={15} />
            写入周报
          </button>
        </div>
      </section>

      <section className="panel wide report-gate-grid">
        {gate.checks.map((check) => (
          <article className={`report-gate-check check-${check.status}`} key={check.id}>
            <div className="decision-card-top">
              <strong>{check.title}</strong>
              <span className={`score-pill ${reportGateStatusTone(check.status)}`}>{reportGateStatusLabel(check.status)}</span>
            </div>
            <div className="report-gate-score">
              <span style={{ width: `${Math.max(6, check.score)}%` }} />
            </div>
            <p>{check.detail}</p>
            <small>{recommendationOwnerLabel(check.owner)}：{check.action}</small>
          </article>
        ))}
      </section>

      <section className="panel wide report-gate-two-col">
        <div>
          <div className="panel-heading nested-heading">
            <h3>发送前阻塞项</h3>
            <small>{gate.blockers.length} 条</small>
          </div>
          {gate.blockers.length === 0 ? (
            <div className="evidence-list empty">暂无阻塞项，仍建议保留 Evidence 附录。</div>
          ) : (
            <div className="impact-action-list warning">
              {gate.blockers.map((blocker) => (
                <span key={blocker}>{blocker}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="panel-heading nested-heading">
            <h3>发布清单</h3>
            <small>{gate.exportChecklist.length} 条</small>
          </div>
          <div className="impact-action-list">
            {gate.exportChecklist.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>报告关联证据</h3>
          <small>{gate.evidenceIds.length} 条 Evidence</small>
        </div>
        <EvidenceList data={data} evidenceIds={gate.evidenceIds.slice(0, 12)} />
      </section>
    </div>
  );
}

function RequirementsView({
  data,
  runAction
}: {
  data: ApiStateResponse;
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const update = (requirement: RequirementCandidate, status: RequirementCandidate["status"]) =>
    runAction("update-requirement", () => patchJson<ApiStateResponse>(`/api/requirements/${requirement.id}`, { ...requirement, status }));
  const reviewPackages = buildRequirementReviewPackages(data).filter((item) => item.source === "requirement");
  const packageByRequirementId = new Map(reviewPackages.map((item) => [item.sourceId, item]));
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const filteredRequirements = data.state.requirements.filter(
    (requirement) =>
      (statusFilter === "all" || requirement.status === statusFilter) &&
      (priorityFilter === "all" || requirement.priorityHint === priorityFilter)
  );

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="候选需求" value={data.state.requirements.length} />
        <Metric label="待评审" value={data.state.requirements.filter((requirement) => requirement.status === "ToReview").length} />
        <Metric label="已接受" value={data.state.requirements.filter((requirement) => requirement.status === "Accepted").length} tone="ok" />
        <Metric label="暂缓" value={data.state.requirements.filter((requirement) => requirement.status === "Deferred").length} />
        <Metric label="P0/P1" value={data.state.requirements.filter((requirement) => requirement.priorityHint !== "P2").length} tone="warn" />
        <Metric label="证据引用" value={uniqueValues(data.state.requirements.flatMap((requirement) => requirement.evidenceIds)).length} />
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>需求筛选</h3>
          <small>按状态和优先级查看需求池</small>
        </div>
        <div className="filter-bar compact-filter">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">全部状态</option>
            <option value="Draft">草稿</option>
            <option value="ToReview">待评审</option>
            <option value="Accepted">已接受</option>
            <option value="Deferred">暂缓</option>
            <option value="Rejected">已拒绝</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
            <option value="all">全部优先级</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>候选需求池</h3>
          <small>{filteredRequirements.length} 条</small>
        </div>
        <div className="requirement-grid">
          {filteredRequirements.length === 0 ? (
            <EmptyState title="暂无候选需求" text="从洞察页、机会雷达或需求评审页把高价值机会转成需求。" />
          ) : (
            filteredRequirements.map((requirement) => {
              const reviewPackage = packageByRequirementId.get(requirement.id) ?? requirementPackageFromRequirement(requirement);
              return (
                <article className="requirement-card" key={requirement.id}>
                  <div className="item-header">
                    <div className="decision-meta">
                      <span className={`priority priority-${requirement.priorityHint.toLowerCase()}`}>{requirement.priorityHint}</span>
                      <span className={`score-pill ${persuasivenessTone(reviewPackage.score)}`}>评审分 {reviewPackage.score}</span>
                      <span className={`score-pill ${requirementReadinessTone(reviewPackage.readiness)}`}>{requirementReadinessLabel(reviewPackage.readiness)}</span>
                    </div>
                    <strong>{statusLabel(requirement.status)}</strong>
                  </div>
                  <h4>{requirement.problem}</h4>
                  <p>{requirement.recommendation}</p>
                  <div className="requirement-review-grid">
                    <div>
                      <strong>竞品参考</strong>
                      <span>{requirement.competitorReference}</span>
                    </div>
                    <div>
                      <strong>差距 / 优势</strong>
                      <span>{requirement.appGapOrAdvantage}</span>
                    </div>
                    <div>
                      <strong>证据强度</strong>
                      <span>{requirementEvidenceStrength(requirement.evidenceIds.length)} / {requirement.evidenceIds.length} 条</span>
                    </div>
                    <div>
                      <strong>下一步</strong>
                      <span>{requirementNextStep(reviewPackage)}</span>
                    </div>
                  </div>
                  <div className="review-brief">
                    <strong>验收口径</strong>
                    <ul className="mini-list review-checklist">
                      {requirementAcceptanceLines(reviewPackage).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <pre className="evidence-box">{requirement.prdNotes}</pre>
                  <EvidenceList data={data} evidenceIds={requirement.evidenceIds} />
                  <div className="button-row">
                    <button className="ghost" onClick={() => void update(requirement, "ToReview")}>
                      待评审
                    </button>
                    <button className="primary" onClick={() => void update(requirement, "Accepted")}>
                      接受
                    </button>
                    <button className="ghost" onClick={() => void update(requirement, "Deferred")}>
                      暂缓
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function ReportsView({
  data,
  reports,
  runAction
}: {
  data: ApiStateResponse;
  reports: Report[];
  runAction: (label: string, action: () => Promise<ApiStateResponse>) => Promise<void>;
}) {
  const activeAppId = data.activeOwnedAppId;
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id);
  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0];
  const [markdown, setMarkdown] = useState(selectedReport?.markdown ?? "");
  const executiveBrief = buildExecutiveReportBrief(data);

  useEffect(() => {
    setSelectedReportId(reports[0]?.id);
    setMarkdown(reports[0]?.markdown ?? "");
  }, [reports]);

  const appendExecutiveBrief = () => {
    if (!selectedReport) {
      return;
    }
    const marker = `# ${executiveBrief.title}`;
    const nextMarkdown = markdown.includes(marker) ? markdown : `${markdown}\n\n---\n\n${executiveBrief.markdown}`;
    setMarkdown(nextMarkdown);
    void runAction("append-executive-report", () =>
      patchJson<ApiStateResponse>(`/api/reports/${selectedReport.id}`, {
        ownedAppId: selectedReport.ownedAppId,
        markdown: nextMarkdown,
        status: selectedReport.status
      })
    );
  };

  return (
    <div className="page-grid">
      <section className="metric-grid">
        <Metric label="决策建议" value={executiveBrief.decisionRows.length} />
        <Metric label="战略推测" value={executiveBrief.strategyRows.filter((row) => row.stage === "strategic_inference").length} tone="warn" />
        <Metric label="验证计划" value={executiveBrief.validationRows.length} />
        <Metric label="不照搬边界" value={executiveBrief.noCopyRows.length} />
        <Metric label="证据覆盖分" value={executiveBrief.evidenceScore} tone={executiveBrief.evidenceScore >= 70 ? "ok" : "warn"} />
        <Metric label="证据缺口" value={executiveBrief.evidenceGaps.length} tone={executiveBrief.evidenceGaps.length ? "warn" : "ok"} />
      </section>

      <section className="panel wide report-studio">
        <div className="panel-heading">
          <h3>专题报告工作台</h3>
          <div className="button-row">
            <button
              className="ghost"
              onClick={() => downloadMarkdownContent(executiveBrief.markdown, `executive_competitive_report_${data.state.currentOwnedApp?.id ?? "app"}.md`)}
            >
              <Download size={16} />
              导出专题
            </button>
            <button className="secondary" onClick={() => setMarkdown(executiveBrief.markdown)}>
              <FileText size={16} />
              放入编辑器
            </button>
            <button className="primary" disabled={!selectedReport} onClick={appendExecutiveBrief}>
              <Check size={16} />
              写入周报
            </button>
          </div>
        </div>
        <div className="report-studio-grid">
          <article className="report-summary-card">
            <span className={`score-pill ${persuasivenessTone(executiveBrief.evidenceScore)}`}>证据覆盖 {executiveBrief.evidenceScore}</span>
            <h4>{executiveBrief.title}</h4>
            <div className="report-summary-list">
              {executiveBrief.summary.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </article>

          <article className="report-summary-card">
            <h4>证据缺口</h4>
            <div className="action-chip-grid">
              {(executiveBrief.evidenceGaps.length > 0 ? executiveBrief.evidenceGaps : ["关键证据闭环较完整，可以进入周报或专题讨论。"]).map((gap) => (
                <span key={gap}>{gap}</span>
              ))}
            </div>
          </article>
        </div>

        <div className="report-section-grid">
          <section className="report-section-card">
            <div className="panel-heading nested-heading">
              <h3>管理层决策摘要</h3>
              <small>{executiveBrief.decisionRows.length} 条</small>
            </div>
            <div className="table-wrap compact-table">
              <table>
                <thead>
                  <tr>
                    <th>优先级</th>
                    <th>主题</th>
                    <th>判断</th>
                    <th>分数</th>
                    <th>证据</th>
                  </tr>
                </thead>
                <tbody>
                  {executiveBrief.decisionRows.length === 0 ? (
                    <tr>
                      <td colSpan={5}>暂无可评审决策，先执行分析或补证据。</td>
                    </tr>
                  ) : (
                    executiveBrief.decisionRows.map((row) => (
                      <tr key={`${row.priority}-${row.title}`}>
                        <td>
                          <span className={`priority priority-${row.priority.toLowerCase()}`}>{row.priority}</span>
                        </td>
                        <td>{row.title}</td>
                        <td>{row.outcome}</td>
                        <td>{row.score}</td>
                        <td>{row.evidenceStrength}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="report-section-card">
            <div className="panel-heading nested-heading">
              <h3>战略推测摘要</h3>
              <small>{executiveBrief.strategyRows.length} 条</small>
            </div>
            <div className="report-strategy-list">
              {executiveBrief.strategyRows.length === 0 ? (
                <EmptyState title="暂无战略推测" text="先补发布、价格、商店页、评论或社媒证据。" />
              ) : (
                executiveBrief.strategyRows.slice(0, 4).map((strategy) => (
                  <article key={strategy.id}>
                    <div className="decision-card-top">
                      <strong>{strategy.ownerName} / {strategy.themeLabel}</strong>
                      <span className={`score-pill ${persuasivenessTone(strategy.confidence)}`}>{strategy.confidence}%</span>
                    </div>
                    <p>{strategy.hypothesis}</p>
                    <small>{strategyStageLabel(strategy.stage)} / Evidence {strategy.evidenceIds.length}</small>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="report-section-card">
            <div className="panel-heading nested-heading">
              <h3>MVP 验证计划</h3>
              <small>{executiveBrief.validationRows.length} 条</small>
            </div>
            <div className="report-plan-list">
              {executiveBrief.validationRows.slice(0, 4).map((row) => (
                <article key={row.title}>
                  <strong>{row.title}</strong>
                  <p>{row.validation}</p>
                  <small>{row.successMetric}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="report-section-card">
            <div className="panel-heading nested-heading">
              <h3>不照搬边界</h3>
              <small>{executiveBrief.noCopyRows.length} 条</small>
            </div>
            <div className="report-plan-list">
              {executiveBrief.noCopyRows.slice(0, 4).map((row) => (
                <article key={row.feature}>
                  <strong>{row.feature}</strong>
                  <p>{row.reason}</p>
                  <small>{row.differentiation}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>报告列表</h3>
          {activeAppId ? (
            <button className="primary" onClick={() => void runAction("generate-report", () => postJson<ApiStateResponse>("/api/reports/generate", { ownedAppId: activeAppId }))}>
              <FileText size={16} />
              生成
            </button>
          ) : null}
        </div>
        <div className="report-list">
          {reports.map((report) => (
            <button key={report.id} className={selectedReport?.id === report.id ? "report-row active" : "report-row"} onClick={() => setSelectedReportId(report.id)}>
              <span>{report.period.start} - {report.period.end}</span>
              <strong>{statusLabel(report.status)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="panel-heading">
          <h3>Markdown 周报</h3>
          {selectedReport ? (
            <div className="button-row">
              <button className="ghost" onClick={() => downloadMarkdown(selectedReport)}>
                <Download size={16} />
                导出
              </button>
              <button
                className="primary"
                onClick={() =>
                  void runAction("save-report", () =>
                    patchJson<ApiStateResponse>(`/api/reports/${selectedReport.id}`, {
                      ownedAppId: selectedReport.ownedAppId,
                      markdown,
                      status: selectedReport.status
                    })
                  )
                }
              >
                <Check size={16} />
                保存
              </button>
            </div>
          ) : null}
        </div>
        {selectedReport ? (
          <textarea className="report-editor" value={markdown} onChange={(event) => setMarkdown(event.target.value)} />
        ) : (
          <EmptyState title="暂无报告" text="点击生成，系统会根据当前 App 的洞察、需求和证据生成 Markdown。" />
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
