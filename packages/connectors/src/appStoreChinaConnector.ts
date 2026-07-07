import { createId, isoNow } from "@aci/domain";
import type { StoreConnector, StoreConnectorResult } from "./types";

function guessAppName(url: string): string {
  const match = url.match(/\/app\/([^/]+)/);
  return decodeURIComponent(match?.[1]?.replace(/-/g, " ") ?? "App Store 竞品");
}

export const appStoreChinaConnector: StoreConnector = {
  name: "app-store-china-spike",
  canHandle(channel) {
    return channel.channelName === "App Store China" && channel.collectionMode === "automatic";
  },
  async collect(context): Promise<StoreConnectorResult> {
    if (!context.channel.storeUrl.includes("apps.apple.com")) {
      return {
        status: "skipped",
        userMessage: "App Store 适配器只处理 apps.apple.com 链接。",
        reviews: [],
        evidence: [],
        failureReason: "Unsupported App Store URL"
      };
    }

    const now = isoNow();
    const appName = guessAppName(context.channel.storeUrl);
    const evidenceId = createId("ev");
    const reviewEvidenceId = createId("ev");
    const snapshot = {
      id: createId("snap"),
      ownedAppId: context.ownedAppId,
      competitorId: context.competitorId,
      channelId: context.channel.id,
      version: "2026.7",
      rating: 4.7,
      reviewCount: 56000,
      priceText: "免费，App 内购买；样本会员：月卡 ¥25，年卡 ¥198",
      description: `${appName} 商店页样本：突出 AI、模板、美颜和会员权益。`,
      releaseNotes: "App Store 中国区适配器 Spike：记录公开页面结构化字段。",
      screenshots: ["AI 能力", "模板玩法", "会员权益"],
      capturedAt: now,
      evidenceId
    };

    const review = {
      id: createId("rev"),
      ownedAppId: context.ownedAppId,
      competitorId: context.competitorId,
      channelId: context.channel.id,
      rating: 3,
      version: snapshot.version,
      content: "希望 AI 生成速度更快，会员权益说明更清楚。",
      topicHint: "ai",
      capturedAt: now,
      evidenceId: reviewEvidenceId
    };

    return {
      status: "success",
      userMessage: "App Store 中国区样本采集完成。",
      snapshot,
      reviews: [review],
      evidence: [
        {
          id: evidenceId,
          ownedAppId: context.ownedAppId,
          sourceType: "snapshot",
          sourceUrl: context.channel.storeUrl,
          channelName: context.channel.channelName,
          rawExcerpt: `${snapshot.description} ${snapshot.releaseNotes}`,
          capturedAt: now
        },
        {
          id: reviewEvidenceId,
          ownedAppId: context.ownedAppId,
          sourceType: "review",
          sourceUrl: context.channel.storeUrl,
          channelName: context.channel.channelName,
          rawExcerpt: review.content,
          capturedAt: now
        }
      ]
    };
  }
};
