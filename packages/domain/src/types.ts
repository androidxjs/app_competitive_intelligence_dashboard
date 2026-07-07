export type Id = string;

export type Platform = "ios" | "android" | "web";
export type OwnedAppStatus = "Incomplete" | "Active" | "Archived" | "Deleted";
export type CompetitorStatus = "Active" | "Archived";
export type Priority = "P0" | "P1" | "P2";
export type ChannelName =
  | "App Store China"
  | "Huawei"
  | "Xiaomi"
  | "OPPO"
  | "vivo"
  | "Tencent MyApp"
  | "Website"
  | "Xiaohongshu"
  | "Douyin"
  | "Weibo"
  | "Manual";
export type OwnerType = "owned_app" | "competitor";
export type CollectionMode = "automatic" | "manual" | "disabled";
export type ComplianceStatus = "approved" | "pending" | "blocked" | "unknown";
export type CrawlStatus = "Ready" | "ManualOnly" | "Skipped" | "Failed" | "Succeeded";
export type InsightStatus = "New" | "Confirmed" | "Dismissed" | "Converted" | "Archived";
export type InsightLabel = "Fact" | "Pattern" | "Inference" | "Recommendation";
export type Severity = "low" | "medium" | "high";
export type RequirementStatus = "Draft" | "ToReview" | "Accepted" | "Deferred" | "Rejected";
export type ReportStatus = "Draft" | "Reviewed" | "Sent" | "Failed";
export type JobType = "crawl" | "analyze" | "report";
export type JobState = "Queued" | "Running" | "Succeeded" | "PartialSucceeded" | "Failed" | "Canceled";
export type FeatureSupport = "owned" | "missing" | "partial" | "advantage" | "unknown";
export type FeatureSource = "ai" | "user_confirmed" | "user_edited" | "user_dismissed";
export type ModuleAnalysisType = "growth" | "traffic" | "social" | "product_performance" | "ai_insight";
export type RecommendationArea = "growth" | "traffic" | "social" | "product" | "ai" | "pricing" | "engineering";
export type RecommendationActionType =
  | "add_feature"
  | "improve_experience"
  | "collect_evidence"
  | "monitor_change"
  | "amplify_advantage"
  | "fix_quality";
export type RecommendationEffort = "S" | "M" | "L";
export type RecommendationOwnerRole = "product" | "engineering" | "growth" | "research";
export type RecommendationStatus = "Open" | "Planned" | "Accepted" | "Dismissed";
export type TimelineEventType = "version" | "price" | "rating" | "review" | "insight" | "recommendation";
export type PriceChangeType = "first_seen" | "changed" | "unchanged" | "missing";
export type EvidenceDiffField = "version" | "rating" | "review_count" | "price" | "release_notes" | "description" | "screenshots";
export type CompetitiveAlertType = "channel_failure" | "price_change" | "rating_risk" | "high_severity_insight" | "high_impact_recommendation";
export type CompetitiveAlertSeverity = "low" | "medium" | "high";
export type StoreMetadataField = "version" | "description" | "release_notes" | "screenshots" | "price" | "rating";
export type KeywordOpportunitySource = "feature" | "review" | "release_notes" | "description" | "evidence";
export type LaunchSignalType = "new_feature" | "campaign" | "pricing" | "positioning" | "quality" | "website";
export type SocialPlatform = "xiaohongshu" | "douyin" | "weibo";
export type SocialSignalType = "new_feature" | "campaign" | "pricing" | "user_feedback" | "brand_positioning" | "template_trend";
export type SocialFetchStatus = "ManualOnly" | "Pending" | "Fetched" | "Failed";
export type SocialAuthPlatform = SocialPlatform;
export type SocialAuthStatus =
  | "NotConfigured"
  | "Configured"
  | "AuthorizationUrlReady"
  | "PendingTokenExchange"
  | "Authorized"
  | "TokenExpired"
  | "Failed";

export interface Project {
  id: Id;
  name: string;
  market: string;
  languages: string[];
  defaultWatchFrequency: string;
  createdAt: string;
}

export interface OwnedApp {
  id: Id;
  projectId: Id;
  name: string;
  category: string;
  owner: string;
  platforms: Platform[];
  status: OwnedAppStatus;
  featureTemplate: string;
  websiteUrl?: string;
  appStoreUrl?: string;
  androidStoreUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Competitor {
  id: Id;
  ownedAppId: Id;
  name: string;
  category: string;
  priority: Priority;
  status: CompetitorStatus;
  websiteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: Id;
  ownedAppId: Id;
  ownerType: OwnerType;
  ownerId: Id;
  channelName: ChannelName;
  storeUrl: string;
  collectionMode: CollectionMode;
  complianceStatus: ComplianceStatus;
  crawlStatus: CrawlStatus;
  lastFailureReason?: string;
  lastSuccessAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: Id;
  ownedAppId: Id;
  sourceType: "snapshot" | "review" | "release" | "price" | "website" | "social" | "manual";
  sourceUrl: string;
  channelName: ChannelName;
  rawExcerpt: string;
  capturedAt: string;
}

export interface AppSnapshot {
  id: Id;
  ownedAppId: Id;
  competitorId?: Id;
  channelId: Id;
  version?: string;
  rating?: number;
  reviewCount?: number;
  priceText?: string;
  description?: string;
  releaseNotes?: string;
  screenshots: string[];
  capturedAt: string;
  evidenceId: Id;
}

export interface Review {
  id: Id;
  ownedAppId: Id;
  competitorId?: Id;
  channelId: Id;
  rating: number;
  version?: string;
  content: string;
  topicHint?: string;
  capturedAt: string;
  evidenceId: Id;
}

export interface Insight {
  id: Id;
  ownedAppId: Id;
  category: string;
  title: string;
  summary: string;
  evidenceIds: Id[];
  confidence: number;
  severity: Severity;
  sourceChannels: ChannelName[];
  recommendation: string;
  label: InsightLabel;
  status: InsightStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: Id;
  ownedAppId: Id;
  name: string;
  category: string;
  currentAppSupport: FeatureSupport;
  competitorSupport: Record<Id, FeatureSupport>;
  demandScore: number;
  source: FeatureSource;
  updatedAt: string;
}

export interface CompetitorModuleAnalysis {
  id: Id;
  ownedAppId: Id;
  competitorId: Id;
  period: ReportPeriod;
  moduleType: ModuleAnalysisType;
  summary: string;
  signals: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  evidenceIds: Id[];
  confidence: number;
  dataCoverage: string[];
  updatedAt: string;
}

export interface ActionRecommendation {
  id: Id;
  ownedAppId: Id;
  sourceKey: string;
  title: string;
  area: RecommendationArea;
  actionType: RecommendationActionType;
  ownerRole: RecommendationOwnerRole;
  priorityHint: Priority;
  impactScore: number;
  effort: RecommendationEffort;
  confidence: number;
  problem: string;
  whyNow: string;
  recommendation: string;
  implementationHint: string;
  successMetric: string;
  competitorIds: Id[];
  featureIds: Id[];
  insightIds: Id[];
  evidenceIds: Id[];
  sourceModules: ModuleAnalysisType[];
  status: RecommendationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitiveTimelineEvent {
  id: Id;
  ownedAppId: Id;
  eventType: TimelineEventType;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  channelName?: ChannelName;
  platform?: Exclude<Platform, "web">;
  title: string;
  summary: string;
  impact: CompetitiveAlertSeverity;
  evidenceIds: Id[];
  occurredAt: string;
}

export interface PriceSignal {
  id: Id;
  ownedAppId: Id;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  channelName: ChannelName;
  platform?: Exclude<Platform, "web">;
  priceText: string;
  numericPrices: string[];
  changeType: PriceChangeType;
  previousPriceText?: string;
  evidenceIds: Id[];
  capturedAt: string;
}

export interface EvidenceDiff {
  id: Id;
  ownedAppId: Id;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  channelName: ChannelName;
  platform?: Exclude<Platform, "web">;
  field: EvidenceDiffField;
  beforeValue: string;
  afterValue: string;
  screenshotUrls: string[];
  evidenceIds: Id[];
  changedAt: string;
}

export interface CompetitiveAlert {
  id: Id;
  ownedAppId: Id;
  alertType: CompetitiveAlertType;
  severity: CompetitiveAlertSeverity;
  title: string;
  summary: string;
  ownerType?: OwnerType;
  ownerId?: Id;
  ownerName?: string;
  competitorId?: Id;
  evidenceIds: Id[];
  recommendationIds: Id[];
  createdAt: string;
}

export interface StoreMetadataSignal {
  id: Id;
  ownedAppId: Id;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  channelName: ChannelName;
  platform?: Exclude<Platform, "web">;
  field: StoreMetadataField;
  beforeValue?: string;
  afterValue: string;
  keywordHints: string[];
  screenshotUrls: string[];
  evidenceIds: Id[];
  capturedAt: string;
}

export interface RatingSentimentSignal {
  id: Id;
  ownedAppId: Id;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  channelName: ChannelName;
  platform?: Exclude<Platform, "web">;
  rating?: number;
  reviewCount?: number;
  sampleSize: number;
  averageReviewRating?: number;
  positiveReviewCount: number;
  negativeReviewCount: number;
  riskLevel: CompetitiveAlertSeverity;
  topThemes: string[];
  summary: string;
  evidenceIds: Id[];
  capturedAt: string;
}

export interface AsoKeywordOpportunity {
  id: Id;
  ownedAppId: Id;
  keyword: string;
  source: KeywordOpportunitySource;
  ownedCoverage: boolean;
  competitorCoverage: Array<{
    competitorId: Id;
    competitorName: string;
    channels: ChannelName[];
    evidenceIds: Id[];
  }>;
  mentionCount: number;
  opportunityScore: number;
  recommendation: string;
  evidenceIds: Id[];
  updatedAt: string;
}

export interface LaunchSignal {
  id: Id;
  ownedAppId: Id;
  signalType: LaunchSignalType;
  ownerType: OwnerType;
  ownerId: Id;
  ownerName: string;
  competitorId?: Id;
  title: string;
  summary: string;
  impact: CompetitiveAlertSeverity;
  confidence: number;
  sourceChannels: ChannelName[];
  evidenceIds: Id[];
  occurredAt: string;
}

export interface SocialSample {
  id: Id;
  ownedAppId: Id;
  competitorId?: Id;
  platform: SocialPlatform;
  url: string;
  topic: string;
  author?: string;
  publishedAt?: string;
  engagementText?: string;
  summary: string;
  tags: string[];
  signalType: SocialSignalType;
  impact: CompetitiveAlertSeverity;
  fetchStatus: SocialFetchStatus;
  fetchFailureReason?: string;
  fetchedTitle?: string;
  fetchedExcerpt?: string;
  finalUrl?: string;
  evidenceId?: Id;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAuthConfig {
  id: Id;
  ownedAppId: Id;
  platform: SocialAuthPlatform;
  appId?: string;
  clientKey?: string;
  clientSecretConfigured: boolean;
  redirectUri: string;
  scopes: string[];
  status: SocialAuthStatus;
  enabled: boolean;
  crawlFrequency: string;
  dailyQuota: number;
  usedToday: number;
  quotaResetAt?: string;
  lastAuthorizationUrl?: string;
  lastAuthUrlGeneratedAt?: string;
  authorizationCodeReceived: boolean;
  lastAuthorizedAt?: string;
  tokenExpiresAt?: string;
  lastFailureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureCompetitorGapDetail {
  competitorId: Id;
  competitorName: string;
  support: FeatureSupport;
  evidenceIds: Id[];
  reviewQuotes: string[];
  reviewSentiment: CompetitiveAlertSeverity;
  socialEvidenceIds: Id[];
  lastSignalAt?: string;
}

export interface FeatureGapDetail {
  featureId: Id;
  ownedAppId: Id;
  featureName: string;
  category: string;
  currentAppSupport: FeatureSupport;
  decision: "gap" | "improve" | "advantage" | "watch";
  demandScore: number;
  suggestedAction: string;
  ownEvidenceIds: Id[];
  competitorDetails: FeatureCompetitorGapDetail[];
  socialEvidenceIds: Id[];
  reviewSummary: string;
  totalEvidenceCount: number;
}

export interface RequirementCandidate {
  id: Id;
  ownedAppId: Id;
  insightIds: Id[];
  problem: string;
  evidenceIds: Id[];
  competitorReference: string;
  appGapOrAdvantage: string;
  recommendation: string;
  priorityHint: Priority;
  prdNotes: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReportPeriod {
  start: string;
  end: string;
}

export interface Report {
  id: Id;
  ownedAppId: Id;
  period: ReportPeriod;
  markdown: string;
  status: ReportStatus;
  evidenceIds: Id[];
  generatedAt: string;
  updatedAt: string;
}

export interface Job {
  id: Id;
  ownedAppId: Id;
  type: JobType;
  state: JobState;
  idempotencyKey: string;
  progress: number;
  userMessage: string;
  errorCode?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

export interface DashboardState {
  projects: Project[];
  ownedApps: OwnedApp[];
  competitors: Competitor[];
  channels: Channel[];
  snapshots: AppSnapshot[];
  reviews: Review[];
  evidence: Evidence[];
  insights: Insight[];
  features: Feature[];
  moduleAnalyses: CompetitorModuleAnalysis[];
  actionRecommendations: ActionRecommendation[];
  socialSamples: SocialSample[];
  socialAuthConfigs: SocialAuthConfig[];
  requirements: RequirementCandidate[];
  reports: Report[];
  jobs: Job[];
}

export interface ScopedDashboardState extends DashboardState {
  currentOwnedApp?: OwnedApp;
}

export interface OverviewMetrics {
  competitors: number;
  channels: number;
  activeInsights: number;
  recommendations: number;
  requirements: number;
  reports: number;
  failedChannels: number;
}
