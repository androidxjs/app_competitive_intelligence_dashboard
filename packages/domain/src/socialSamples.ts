import { createId, isoNow } from "./ids.js";
import type {
  CompetitiveAlertSeverity,
  Evidence,
  SocialPlatform,
  SocialSample,
  SocialSignalType
} from "./types.js";

export interface CreateSocialSampleInput {
  ownedAppId: string;
  competitorId?: string;
  platform: SocialPlatform;
  url: string;
  topic: string;
  author?: string;
  publishedAt?: string;
  engagementText?: string;
  summary: string;
  tags?: string[];
  signalType: SocialSignalType;
  impact: CompetitiveAlertSeverity;
  fetchStatus?: SocialSample["fetchStatus"];
  fetchFailureReason?: string;
  fetchedTitle?: string;
  fetchedExcerpt?: string;
  finalUrl?: string;
}

export function socialPlatformLabel(platform: SocialPlatform): "Xiaohongshu" | "Douyin" | "Weibo" {
  if (platform === "xiaohongshu") {
    return "Xiaohongshu";
  }
  if (platform === "douyin") {
    return "Douyin";
  }
  return "Weibo";
}

export function createSocialSample(input: CreateSocialSampleInput): SocialSample {
  const now = isoNow();
  return {
    id: createId("social"),
    ownedAppId: input.ownedAppId,
    competitorId: input.competitorId,
    platform: input.platform,
    url: input.finalUrl ?? input.url,
    topic: input.topic.trim() || "未命名话题",
    author: input.author?.trim() || undefined,
    publishedAt: input.publishedAt,
    engagementText: input.engagementText?.trim() || undefined,
    summary: input.summary.trim() || input.fetchedExcerpt?.trim() || input.fetchedTitle?.trim() || "待补充社媒摘要",
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean) ?? [],
    signalType: input.signalType,
    impact: input.impact,
    fetchStatus: input.fetchStatus ?? "ManualOnly",
    fetchFailureReason: input.fetchFailureReason,
    fetchedTitle: input.fetchedTitle,
    fetchedExcerpt: input.fetchedExcerpt,
    finalUrl: input.finalUrl,
    createdAt: now,
    updatedAt: now
  };
}

export function createEvidenceFromSocialSample(sample: SocialSample): Evidence {
  return {
    id: sample.evidenceId ?? createId("ev"),
    ownedAppId: sample.ownedAppId,
    sourceType: "social",
    sourceUrl: sample.finalUrl ?? sample.url,
    channelName: socialPlatformLabel(sample.platform),
    rawExcerpt: [
      sample.fetchedTitle,
      sample.summary,
      sample.fetchedExcerpt,
      sample.engagementText ? `互动：${sample.engagementText}` : undefined,
      sample.tags.length > 0 ? `标签：${sample.tags.join("、")}` : undefined
    ]
      .filter(Boolean)
      .join(" / "),
    capturedAt: sample.updatedAt
  };
}

export function attachSocialEvidence(sample: SocialSample, evidence: Evidence): SocialSample {
  return {
    ...sample,
    evidenceId: evidence.id,
    updatedAt: evidence.capturedAt
  };
}
