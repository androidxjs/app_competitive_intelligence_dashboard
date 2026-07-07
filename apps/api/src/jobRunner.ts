import { fakeLLMProvider } from "@aci/ai";
import { ChannelAdapterRegistry } from "@aci/connectors";
import { generateMarkdownReport } from "@aci/reporting";
import {
  appendEvidence,
  appendInsights,
  appendReviews,
  appendSnapshots,
  buildActionRecommendations,
  createJob,
  dateOnly,
  getScopedState,
  preserveManualFeatureEdits,
  transitionJob,
  upsertActionRecommendations,
  upsertChannel,
  upsertFeatures,
  upsertModuleAnalyses,
  upsertJob,
  upsertReport
} from "@aci/domain";
import type { Channel, DashboardState, JobType } from "@aci/domain";
import { buildModuleAnalyses } from "./moduleAnalysis.js";

const registry = new ChannelAdapterRegistry();

function markChannel(channel: Channel, patch: Partial<Channel>): Channel {
  return { ...channel, ...patch, updatedAt: new Date().toISOString() };
}

function getOrCreateJob(state: DashboardState, ownedAppId: string, type: JobType, idempotencyKey: string) {
  return state.jobs.find((job) => job.ownedAppId === ownedAppId && job.type === type && job.idempotencyKey === idempotencyKey) ??
    createJob(ownedAppId, type, idempotencyKey);
}

// @SpecId: ACI-FLOW-COLLECT-001, ACI-FLOW-CHANNEL-002, ACI-RULE-CHANNEL-002, ACI-RULE-COMPLIANCE-001
export async function runCrawlJob(state: DashboardState, ownedAppId: string, idempotencyKey: string): Promise<DashboardState> {
  let next = state;
  let job = transitionJob(getOrCreateJob(next, ownedAppId, "crawl", idempotencyKey), "Running", 15, "正在采集渠道快照");
  next = upsertJob(next, job);

  const scoped = getScopedState(next, ownedAppId);
  if (!scoped.currentOwnedApp || scoped.currentOwnedApp.status !== "Active") {
    job = transitionJob(job, "Canceled", 100, "当前 App 不可采集");
    return upsertJob(next, job);
  }

  let successCount = 0;
  let skippedCount = 0;
  for (const channel of scoped.channels) {
    const connector = registry.resolve(channel);
    if (!connector) {
      skippedCount += 1;
      next = upsertChannel(
        next,
        markChannel(channel, {
          crawlStatus: "Skipped",
          lastFailureReason: registry.listCapabilities(channel)
        })
      );
      continue;
    }

    const competitorId = channel.ownerType === "competitor" ? channel.ownerId : undefined;
    const result = await connector.collect({ ownedAppId, competitorId, channel });
    next = appendEvidence(next, result.evidence);
    if (result.snapshot) {
      next = appendSnapshots(next, [result.snapshot]);
    }
    next = appendReviews(next, result.reviews);
    next = upsertChannel(
      next,
      markChannel(channel, {
        crawlStatus: result.status === "success" ? "Succeeded" : result.status === "manual_only" ? "ManualOnly" : "Failed",
        lastFailureReason: result.failureReason,
        lastSuccessAt: result.status === "success" || result.status === "manual_only" ? new Date().toISOString() : channel.lastSuccessAt
      })
    );
    if (result.status === "success" || result.status === "manual_only") {
      successCount += 1;
    }
  }

  const finalState = successCount > 0 && skippedCount > 0 ? "PartialSucceeded" : successCount > 0 ? "Succeeded" : "Failed";
  job = transitionJob(job, finalState, 100, `采集完成：成功 ${successCount} 个渠道，跳过 ${skippedCount} 个渠道`);
  return upsertJob(next, job);
}

// @SpecId: ACI-FLOW-ANALYZE-001, ACI-RULE-EVIDENCE-001
export async function runAnalyzeJob(state: DashboardState, ownedAppId: string, idempotencyKey: string): Promise<DashboardState> {
  let next = state;
  let job = transitionJob(getOrCreateJob(next, ownedAppId, "analyze", idempotencyKey), "Running", 20, "正在生成评论洞察和功能矩阵");
  next = upsertJob(next, job);
  const scoped = getScopedState(next, ownedAppId);

  if (!scoped.currentOwnedApp || scoped.reviews.length === 0) {
    job = transitionJob(job, "Failed", 100, "缺少评论或当前 App，无法分析", "NO_REVIEW_DATA");
    return upsertJob(next, job);
  }

  const newInsights = await fakeLLMProvider.classifyReviews({ ownedAppId, reviews: scoped.reviews });
  const existingEvidence = new Set(scoped.insights.flatMap((insight) => insight.evidenceIds).map((ids) => ids));
  const freshInsights = newInsights.filter((insight) => insight.evidenceIds.some((id) => !existingEvidence.has(id)));
  next = appendInsights(next, freshInsights);

  const extractedFeatures = await fakeLLMProvider.extractFeatures({
    ownedAppId,
    descriptions: scoped.snapshots.map((snapshot) => ({
      competitorId: snapshot.competitorId,
      text: [snapshot.description, snapshot.releaseNotes, snapshot.screenshots.join(" ")].filter(Boolean).join("\n")
    }))
  });
  next = upsertFeatures(next, preserveManualFeatureEdits(scoped.features, extractedFeatures));

  const moduleAnalyses = buildModuleAnalyses(next, ownedAppId);
  next = upsertModuleAnalyses(next, moduleAnalyses);
  const actionRecommendations = buildActionRecommendations(next, ownedAppId);
  next = upsertActionRecommendations(next, actionRecommendations);

  job = transitionJob(
    job,
    "Succeeded",
    100,
    `分析完成：新增 ${freshInsights.length} 条洞察，更新 ${moduleAnalyses.length} 条模块分析和 ${actionRecommendations.length} 条行动建议`
  );
  return upsertJob(next, job);
}

// @SpecId: ACI-FLOW-REPORT-001, ACI-RULE-EXPORT-001
export async function runReportJob(state: DashboardState, ownedAppId: string, idempotencyKey: string): Promise<DashboardState> {
  let next = state;
  let job = transitionJob(getOrCreateJob(next, ownedAppId, "report", idempotencyKey), "Running", 30, "正在生成 Markdown 周报");
  next = upsertJob(next, job);
  const end = new Date();
  const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  const report = generateMarkdownReport(next, ownedAppId, {
    start: dateOnly(start),
    end: dateOnly(end)
  });
  next = upsertReport(next, report);
  job = transitionJob(job, "Succeeded", 100, "Markdown 周报已生成");
  return upsertJob(next, job);
}
