import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import {
  appendEvidence,
  attachSocialEvidence,
  buildOverviewMetrics,
  createCompetitor,
  createEvidenceFromSocialSample,
  createId,
  createOwnedApp,
  createRequirementFromInsight,
  createRequirementFromRecommendation,
  createSocialSample,
  createSocialAuthConfig,
  buildSocialAuthUrl,
  disconnectSocialAuthConfig,
  getScopedState,
  isoNow,
  markSocialAuthCallback,
  markSocialAuthUrlGenerated,
  removeOwnedApp,
  transitionOwnedAppStatus,
  updateInsightStatus,
  updateOwnedApp,
  updateReportStatus,
  updateRequirementStatus,
  upsertChannel,
  upsertCompetitor,
  upsertOwnedApp,
  upsertReport,
  updateSocialAuthConfig,
  upsertSocialAuthConfig,
  upsertSocialSample
} from "@aci/domain";
import type { ActionRecommendation, Channel, DashboardState, JobType, Priority, RequirementCandidate, SocialAuthPlatform, SocialSample } from "@aci/domain";
import { generateMarkdownReport } from "@aci/reporting";
import { runAnalyzeJob, runCrawlJob, runReportJob } from "./jobRunner.js";
import { fetchPublicSocialLink } from "./socialFetch.js";
import { JsonStateStore } from "./store.js";

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "OPTIONS";

function sendJson(response: ServerResponse, status: number, payload: unknown): void {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
  });
  response.end(JSON.stringify(payload));
}

function sendHtml(response: ServerResponse, status: number, html: string): void {
  response.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(html);
}

async function readBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? (JSON.parse(raw) as T) : ({} as T);
}

function notFound(response: ServerResponse): void {
  sendJson(response, 404, { error: "NOT_FOUND" });
}

function channelFromBody(body: Partial<Channel> & { ownedAppId: string; ownerType: Channel["ownerType"]; ownerId: string }): Channel {
  const now = isoNow();
  const collectionMode = body.collectionMode ?? "manual";
  return {
    id: body.id ?? createId("ch"),
    ownedAppId: body.ownedAppId,
    ownerType: body.ownerType,
    ownerId: body.ownerId,
    channelName: body.channelName ?? "Manual",
    storeUrl: body.storeUrl ?? "",
    collectionMode,
    complianceStatus: body.complianceStatus ?? (collectionMode === "automatic" ? "approved" : "pending"),
    crawlStatus: body.crawlStatus ?? (collectionMode === "manual" ? "ManualOnly" : "Ready"),
    lastFailureReason: body.lastFailureReason,
    lastSuccessAt: body.lastSuccessAt,
    createdAt: body.createdAt ?? now,
    updatedAt: now
  };
}

async function mutateAndReturn(
  store: JsonStateStore,
  response: ServerResponse,
  mutator: (state: DashboardState) => DashboardState | Promise<DashboardState>,
  ownedAppId?: string
): Promise<void> {
  const state = await store.update(mutator);
  sendJson(response, 200, buildStateResponse(state, ownedAppId));
}

function buildStateResponse(state: DashboardState, ownedAppId?: string) {
  const activeOwnedAppId = ownedAppId ?? state.ownedApps.find((app) => app.status === "Active")?.id;
  const scoped = activeOwnedAppId ? getScopedState(state, activeOwnedAppId) : getScopedState(state);
  return {
    state: scoped,
    activeOwnedAppId,
    metrics: activeOwnedAppId ? buildOverviewMetrics(state, activeOwnedAppId) : undefined
  };
}

export function createApiServer(store = new JsonStateStore()) {
  return createServer(async (request, response) => {
    try {
      const method = request.method as Method;
      if (method === "OPTIONS") {
        sendJson(response, 204, {});
        return;
      }

      const url = new URL(request.url ?? "/", "http://localhost");
      const path = url.pathname;

      if (method === "GET" && path === "/health") {
        sendJson(response, 200, { ok: true, service: "app-competitive-intelligence-api" });
        return;
      }

      if (method === "GET" && path === "/api/state") {
        const state = await store.read();
        sendJson(response, 200, buildStateResponse(state, url.searchParams.get("ownedAppId") ?? undefined));
        return;
      }

      if (method === "POST" && path === "/api/owned-apps") {
        const body = await readBody<Parameters<typeof createOwnedApp>[0]>(request);
        const ownedApp = createOwnedApp(body);
        await mutateAndReturn(store, response, (state) => upsertOwnedApp(state, ownedApp), ownedApp.id);
        return;
      }

      const ownedAppMatch = path.match(/^\/api\/owned-apps\/([^/]+)$/);
      if (ownedAppMatch && method === "PATCH") {
        const body = await readBody<Partial<Parameters<typeof createOwnedApp>[0]> & { status?: Parameters<typeof transitionOwnedAppStatus>[1] }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const current = state.ownedApps.find((app) => app.id === ownedAppMatch[1]);
            if (!current) {
              return state;
            }
            const updated = updateOwnedApp(current, body);
            return upsertOwnedApp(state, body.status ? transitionOwnedAppStatus(updated, body.status) : updated);
          },
          ownedAppMatch[1]
        );
        return;
      }

      if (ownedAppMatch && method === "DELETE") {
        const retainHistory = url.searchParams.get("retainHistory") !== "false";
        await mutateAndReturn(store, response, (state) => removeOwnedApp(state, ownedAppMatch[1], retainHistory), undefined);
        return;
      }

      if (method === "POST" && path === "/api/competitors") {
        const body = await readBody<Parameters<typeof createCompetitor>[0]>(request);
        const competitor = createCompetitor(body);
        await mutateAndReturn(store, response, (state) => upsertCompetitor(state, competitor), competitor.ownedAppId);
        return;
      }

      const competitorMatch = path.match(/^\/api\/competitors\/([^/]+)$/);
      if (competitorMatch && method === "PATCH") {
        const body = await readBody<Partial<ReturnType<typeof createCompetitor>>>(request);
        const existing = (await store.read()).competitors.find((competitor) => competitor.id === competitorMatch[1]);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            competitors: state.competitors.map((competitor) =>
              competitor.id === competitorMatch[1] ? { ...competitor, ...body, updatedAt: isoNow() } : competitor
            )
          }),
          body.ownedAppId ?? existing?.ownedAppId
        );
        return;
      }

      if (competitorMatch && method === "DELETE") {
        const retainHistory = url.searchParams.get("retainHistory") !== "false";
        const existing = (await store.read()).competitors.find((item) => item.id === competitorMatch[1]);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const competitor = state.competitors.find((item) => item.id === competitorMatch[1]);
            if (!competitor) {
              return state;
            }
            if (!retainHistory) {
              return {
                ...state,
                competitors: state.competitors.filter((item) => item.id !== competitor.id),
                channels: state.channels.filter((channel) => !(channel.ownerType === "competitor" && channel.ownerId === competitor.id)),
                snapshots: state.snapshots.filter((snapshot) => snapshot.competitorId !== competitor.id),
                reviews: state.reviews.filter((review) => review.competitorId !== competitor.id),
                features: state.features.map((feature) => {
                  const { [competitor.id]: _removed, ...competitorSupport } = feature.competitorSupport;
                  return { ...feature, competitorSupport };
                }),
                moduleAnalyses: state.moduleAnalyses.filter((analysis) => analysis.competitorId !== competitor.id),
                actionRecommendations: state.actionRecommendations.filter(
                  (recommendation) => !recommendation.competitorIds.includes(competitor.id)
                ),
                socialSamples: state.socialSamples.filter((sample) => sample.competitorId !== competitor.id)
              };
            }
            return {
              ...state,
              competitors: state.competitors.map((item) =>
                item.id === competitorMatch[1] ? { ...item, status: "Archived", updatedAt: isoNow() } : item
              )
            };
          },
          existing?.ownedAppId
        );
        return;
      }

      if (method === "POST" && path === "/api/channels") {
        const body = await readBody<Partial<Channel> & { ownedAppId: string; ownerType: Channel["ownerType"]; ownerId: string }>(request);
        const channel = channelFromBody(body);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const existing = state.channels.find(
              (item) =>
                item.ownedAppId === channel.ownedAppId &&
                item.ownerType === channel.ownerType &&
                item.ownerId === channel.ownerId &&
                item.channelName === channel.channelName
            );
            return upsertChannel(
              state,
              existing
                ? {
                    ...existing,
                    ...channel,
                    id: existing.id,
                    storeUrl: channel.storeUrl || existing.storeUrl,
                    createdAt: existing.createdAt,
                    lastFailureReason: channel.lastFailureReason ?? existing.lastFailureReason,
                    lastSuccessAt: channel.lastSuccessAt ?? existing.lastSuccessAt
                  }
                : channel
            );
          },
          channel.ownedAppId
        );
        return;
      }

      const channelMatch = path.match(/^\/api\/channels\/([^/]+)$/);
      if (channelMatch && method === "PATCH") {
        const body = await readBody<Partial<Channel>>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            channels: state.channels.map((channel) => (channel.id === channelMatch[1] ? { ...channel, ...body, updatedAt: isoNow() } : channel))
          }),
          body.ownedAppId
        );
        return;
      }

      if (channelMatch && method === "DELETE") {
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            channels: state.channels.filter((channel) => channel.id !== channelMatch[1])
          }),
          undefined
        );
        return;
      }

      if (method === "POST" && path === "/api/jobs") {
        const body = await readBody<{ ownedAppId: string; type: JobType; idempotencyKey?: string }>(request);
        const idempotencyKey = body.idempotencyKey ?? `${body.type}-${new Date().toISOString().slice(0, 10)}`;
        await mutateAndReturn(
          store,
          response,
          (state) => {
            if (body.type === "crawl") {
              return runCrawlJob(state, body.ownedAppId, idempotencyKey);
            }
            if (body.type === "analyze") {
              return runAnalyzeJob(state, body.ownedAppId, idempotencyKey);
            }
            return runReportJob(state, body.ownedAppId, idempotencyKey);
          },
          body.ownedAppId
        );
        return;
      }

      const insightStatusMatch = path.match(/^\/api\/insights\/([^/]+)\/status$/);
      if (insightStatusMatch && method === "POST") {
        const body = await readBody<{ status: Parameters<typeof updateInsightStatus>[1] }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            insights: state.insights.map((insight) =>
              insight.id === insightStatusMatch[1] ? updateInsightStatus(insight, body.status) : insight
            )
          }),
          undefined
        );
        return;
      }

      if (method === "POST" && path === "/api/requirements/from-insight") {
        const body = await readBody<{ insightId: string; competitorName?: string }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const insight = state.insights.find((item) => item.id === body.insightId);
            if (!insight) {
              return state;
            }
            const requirement = createRequirementFromInsight(insight, body.competitorName);
            return {
              ...state,
              insights: state.insights.map((item) => (item.id === insight.id ? updateInsightStatus(item, "Converted") : item)),
              requirements: [...state.requirements, requirement]
            };
          },
          undefined
        );
        return;
      }

      if (method === "POST" && path === "/api/requirements/from-recommendation") {
        const body = await readBody<{ recommendationId: string; ownedAppId?: string }>(request);
        const existingRecommendation = (await store.read()).actionRecommendations.find((item) => item.id === body.recommendationId);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const recommendation = state.actionRecommendations.find((item) => item.id === body.recommendationId);
            if (!recommendation) {
              return state;
            }
            const competitorNames = recommendation.competitorIds
              .map((id) => state.competitors.find((competitor) => competitor.id === id)?.name)
              .filter(Boolean)
              .join(" / ");
            const requirement = createRequirementFromRecommendation(recommendation, competitorNames || "机会雷达");
            const alreadyExists = state.requirements.some(
              (item) => item.ownedAppId === recommendation.ownedAppId && item.problem === requirement.problem
            );
            return {
              ...state,
              actionRecommendations: state.actionRecommendations.map((item) =>
                item.id === recommendation.id ? { ...item, status: "Accepted", updatedAt: isoNow() } : item
              ),
              requirements: alreadyExists ? state.requirements : [...state.requirements, requirement]
            };
          },
          body.ownedAppId ?? existingRecommendation?.ownedAppId
        );
        return;
      }

      if (method === "POST" && path === "/api/requirements/from-feature") {
        const body = await readBody<{
          ownedAppId: string;
          featureId: string;
          title: string;
          recommendation: string;
          priorityHint: Priority;
          prdNotes: string;
          evidenceIds: string[];
          competitorReference?: string;
          appGapOrAdvantage?: string;
        }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => {
            const feature = state.features.find((item) => item.id === body.featureId && item.ownedAppId === body.ownedAppId);
            if (!feature) {
              return state;
            }
            const now = isoNow();
            const evidenceIds = Array.from(new Set(body.evidenceIds ?? []));
            const requirement: RequirementCandidate = {
              id: createId("req"),
              ownedAppId: body.ownedAppId,
              insightIds: [],
              problem: body.title || `${feature.name}功能优化`,
              evidenceIds,
              competitorReference: body.competitorReference ?? "功能对比模型",
              appGapOrAdvantage:
                body.appGapOrAdvantage ??
                (feature.currentAppSupport === "advantage" ? "当前 App 优势项，可强化表达" : "来自功能对比模型的差距或待补强项"),
              recommendation: body.recommendation,
              priorityHint: body.priorityHint,
              prdNotes: body.prdNotes,
              status: "Draft",
              createdAt: now,
              updatedAt: now
            };
            const alreadyExists = state.requirements.some(
              (item) => item.ownedAppId === body.ownedAppId && item.problem === requirement.problem
            );
            return alreadyExists ? state : { ...state, requirements: [...state.requirements, requirement] };
          },
          body.ownedAppId
        );
        return;
      }

      const requirementMatch = path.match(/^\/api\/requirements\/([^/]+)$/);
      if (requirementMatch && method === "PATCH") {
        const body = await readBody<Partial<ReturnType<typeof createRequirementFromInsight>> & { status?: Parameters<typeof updateRequirementStatus>[1] }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            requirements: state.requirements.map((requirement) => {
              if (requirement.id !== requirementMatch[1]) {
                return requirement;
              }
              const patched = { ...requirement, ...body, updatedAt: isoNow() };
              return body.status ? updateRequirementStatus(patched, body.status) : patched;
            })
          }),
          body.ownedAppId
        );
        return;
      }

      const recommendationMatch = path.match(/^\/api\/action-recommendations\/([^/]+)$/);
      if (recommendationMatch && method === "PATCH") {
        const body = await readBody<{ status?: ActionRecommendation["status"]; ownedAppId?: string }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            actionRecommendations: state.actionRecommendations.map((recommendation) =>
              recommendation.id === recommendationMatch[1]
                ? { ...recommendation, status: body.status ?? recommendation.status, updatedAt: isoNow() }
                : recommendation
            )
          }),
          body.ownedAppId
        );
        return;
      }

      if (method === "POST" && path === "/api/social-auth-configs") {
        const body = await readBody<Parameters<typeof createSocialAuthConfig>[0]>(request);
        const existing = (await store.read()).socialAuthConfigs.find(
          (config) => config.ownedAppId === body.ownedAppId && config.platform === body.platform
        );
        const config = existing ? updateSocialAuthConfig(existing, body) : createSocialAuthConfig(body);
        await mutateAndReturn(store, response, (state) => upsertSocialAuthConfig(state, config), config.ownedAppId);
        return;
      }

      const socialAuthMatch = path.match(/^\/api\/social-auth-configs\/([^/]+)$/);
      if (socialAuthMatch && method === "PATCH") {
        const body = await readBody<Partial<Parameters<typeof createSocialAuthConfig>[0]>>(request);
        const existing = (await store.read()).socialAuthConfigs.find((config) => config.id === socialAuthMatch[1]);
        if (!existing) {
          notFound(response);
          return;
        }
        const config = updateSocialAuthConfig(existing, body);
        await mutateAndReturn(store, response, (state) => upsertSocialAuthConfig(state, config), config.ownedAppId);
        return;
      }

      const socialAuthUrlMatch = path.match(/^\/api\/social-auth-configs\/([^/]+)\/authorize-url$/);
      if (socialAuthUrlMatch && method === "POST") {
        const existing = (await store.read()).socialAuthConfigs.find((config) => config.id === socialAuthUrlMatch[1]);
        if (!existing) {
          notFound(response);
          return;
        }
        const result = buildSocialAuthUrl(existing);
        if (!result.authorizationUrl) {
          sendJson(response, 400, { error: "SOCIAL_AUTH_CONFIG_INCOMPLETE", missingFields: result.missingFields });
          return;
        }
        const config = markSocialAuthUrlGenerated(existing, result.authorizationUrl);
        const state = await store.update((current) => upsertSocialAuthConfig(current, config));
        sendJson(response, 200, {
          ...buildStateResponse(state, config.ownedAppId),
          authorizationUrl: result.authorizationUrl,
          state: result.state
        });
        return;
      }

      const socialAuthDisconnectMatch = path.match(/^\/api\/social-auth-configs\/([^/]+)\/disconnect$/);
      if (socialAuthDisconnectMatch && method === "POST") {
        const existing = (await store.read()).socialAuthConfigs.find((config) => config.id === socialAuthDisconnectMatch[1]);
        if (!existing) {
          notFound(response);
          return;
        }
        const config = disconnectSocialAuthConfig(existing);
        await mutateAndReturn(store, response, (state) => upsertSocialAuthConfig(state, config), config.ownedAppId);
        return;
      }

      const socialAuthCallbackMatch = path.match(/^\/api\/social-auth\/callback\/([^/]+)$/);
      if (socialAuthCallbackMatch && method === "GET") {
        const platform = socialAuthCallbackMatch[1] as SocialAuthPlatform;
        const callbackState = url.searchParams.get("state") ?? "";
        const configId = callbackState.split(":")[2];
        const code = url.searchParams.get("code") ?? undefined;
        const callbackError = url.searchParams.get("error") ?? url.searchParams.get("error_description") ?? undefined;
        const existing = (await store.read()).socialAuthConfigs.find(
          (config) => config.id === configId && config.platform === platform
        );
        if (!existing) {
          sendHtml(response, 404, "<h1>授权配置不存在</h1><p>请回到 App 竞品雷达重新生成授权链接。</p>");
          return;
        }
        const config = markSocialAuthCallback(existing, { code, error: callbackError });
        await store.update((state) => upsertSocialAuthConfig(state, config));
        const statusText = config.status === "PendingTokenExchange" ? "授权 code 已收到，等待服务端换取 token" : `授权失败：${config.lastFailureReason}`;
        sendHtml(
          response,
          200,
          `<h1>社媒平台授权回调</h1><p>${statusText}</p><p>可以关闭此页面，回到 App 竞品雷达查看授权状态。</p>`
        );
        return;
      }

      if (method === "POST" && path === "/api/social-samples") {
        const body = await readBody<Parameters<typeof createSocialSample>[0]>(request);
        const sample = createSocialSample({ ...body, fetchStatus: body.fetchStatus ?? "ManualOnly" });
        const evidence = createEvidenceFromSocialSample(sample);
        const sampleWithEvidence = attachSocialEvidence(sample, evidence);
        await mutateAndReturn(
          store,
          response,
          (state) => upsertSocialSample(appendEvidence(state, [evidence]), sampleWithEvidence),
          sampleWithEvidence.ownedAppId
        );
        return;
      }

      if (method === "POST" && path === "/api/social-samples/fetch") {
        const body = await readBody<
          Omit<Parameters<typeof createSocialSample>[0], "platform" | "summary" | "fetchStatus"> & {
            platform?: SocialSample["platform"];
            summary?: string;
          }
        >(request);
        const fetched = await fetchPublicSocialLink(body.url);
        const platform = body.platform ?? fetched.platform ?? "xiaohongshu";
        const sample = createSocialSample({
          ...body,
          platform,
          summary: body.summary ?? fetched.excerpt ?? fetched.failureReason ?? "公开链接抓取未提取到正文",
          fetchStatus: fetched.status,
          fetchFailureReason: fetched.failureReason,
          fetchedTitle: fetched.title,
          fetchedExcerpt: fetched.excerpt,
          finalUrl: fetched.finalUrl
        });
        if (fetched.status === "Fetched") {
          const evidence = createEvidenceFromSocialSample(sample);
          const sampleWithEvidence = attachSocialEvidence(sample, evidence);
          await mutateAndReturn(
            store,
            response,
            (state) => upsertSocialSample(appendEvidence(state, [evidence]), sampleWithEvidence),
            sampleWithEvidence.ownedAppId
          );
          return;
        }
        await mutateAndReturn(store, response, (state) => upsertSocialSample(state, sample), sample.ownedAppId);
        return;
      }

      if (method === "POST" && path === "/api/reports/generate") {
        const body = await readBody<{ ownedAppId: string; period?: { start: string; end: string } }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => upsertReport(state, generateMarkdownReport(state, body.ownedAppId, body.period ?? { start: "2026-07-01", end: "2026-07-06" })),
          body.ownedAppId
        );
        return;
      }

      const reportMatch = path.match(/^\/api\/reports\/([^/]+)$/);
      if (reportMatch && method === "PATCH") {
        const body = await readBody<{ markdown?: string; status?: Parameters<typeof updateReportStatus>[1]; ownedAppId?: string }>(request);
        await mutateAndReturn(
          store,
          response,
          (state) => ({
            ...state,
            reports: state.reports.map((report) => {
              if (report.id !== reportMatch[1]) {
                return report;
              }
              const patched = { ...report, markdown: body.markdown ?? report.markdown, updatedAt: isoNow() };
              return body.status ? updateReportStatus(patched, body.status) : patched;
            })
          }),
          body.ownedAppId
        );
        return;
      }

      notFound(response);
    } catch (error) {
      sendJson(response, 500, {
        error: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
