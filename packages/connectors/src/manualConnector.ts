import { createId, isoNow } from "@aci/domain";
import type { StoreConnector, StoreConnectorResult } from "./types";

const TOPIC_SAMPLES = [
  "AI 模板更新快，最近的写真和发型效果比较自然。",
  "会员入口偏多，希望高清导出前能说清楚权益。",
  "相机启动速度不错，但弱光场景容易糊。",
  "贴纸和滤镜分类清晰，适合快速自拍。"
];

export const manualSampleConnector: StoreConnector = {
  name: "manual-sample",
  canHandle(channel) {
    return channel.collectionMode === "manual" || channel.channelName === "Manual";
  },
  async collect(context): Promise<StoreConnectorResult> {
    const now = isoNow();
    const evidenceId = createId("ev");
    const reviewEvidenceId = createId("ev");
    const snapshot = {
      id: createId("snap"),
      ownedAppId: context.ownedAppId,
      competitorId: context.competitorId,
      channelId: context.channel.id,
      version: "manual-1.0",
      rating: 4.5,
      reviewCount: 1200,
      priceText: "免费，含会员订阅；样本会员：月卡 ¥18，年卡 ¥128",
      description: "手动样本：AI 模板、美颜相机、高清导出和会员权益。",
      releaseNotes: "手动录入样本，用于验证竞品雷达闭环。",
      screenshots: ["AI 模板", "高清导出", "会员权益"],
      capturedAt: now,
      evidenceId
    };

    const review = {
      id: createId("rev"),
      ownedAppId: context.ownedAppId,
      competitorId: context.competitorId,
      channelId: context.channel.id,
      rating: 4,
      version: snapshot.version,
      content: TOPIC_SAMPLES[Math.floor(Math.random() * TOPIC_SAMPLES.length)],
      topicHint: "manual",
      capturedAt: now,
      evidenceId: reviewEvidenceId
    };

    return {
      status: "manual_only",
      userMessage: "已写入手动样本快照和评论。",
      snapshot,
      reviews: [review],
      evidence: [
        {
          id: evidenceId,
          ownedAppId: context.ownedAppId,
          sourceType: "manual",
          sourceUrl: context.channel.storeUrl,
          channelName: context.channel.channelName,
          rawExcerpt: snapshot.releaseNotes,
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
