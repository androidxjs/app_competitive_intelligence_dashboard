import { createId, isoNow } from "@aci/domain";
import type { Feature, Insight, Review } from "@aci/domain";
import type { FeatureExtractionInput, InsightGenerationInput, LLMProvider } from "./provider.js";

const TOPIC_RULES = [
  { category: "AI / 模板机会", keywords: ["AI", "写真", "发型", "模板", "证件照"], severity: "high" as const },
  { category: "会员 / 价格体验", keywords: ["会员", "付费", "订阅", "高清", "价格"], severity: "medium" as const },
  { category: "拍照体验", keywords: ["相机", "拍照", "夜景", "启动", "清晰"], severity: "medium" as const },
  { category: "性能 / 稳定性", keywords: ["卡", "崩溃", "失败", "慢", "闪退"], severity: "high" as const }
];

function matchCategory(review: Review) {
  return TOPIC_RULES.find((rule) => rule.keywords.some((keyword) => review.content.includes(keyword))) ?? {
    category: "综合体验",
    severity: "low" as const,
    keywords: []
  };
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export const fakeLLMProvider: LLMProvider = {
  name: "fake-evidence-provider",

  // @SpecId: ACI-FLOW-INSIGHT-001, ACI-RULE-INSIGHT-001, ACI-RULE-INSIGHT-002
  async classifyReviews(input: InsightGenerationInput): Promise<Insight[]> {
    const grouped = new Map<string, Review[]>();
    input.reviews.forEach((review) => {
      const rule = matchCategory(review);
      grouped.set(rule.category, [...(grouped.get(rule.category) ?? []), review]);
    });

    return Array.from(grouped.entries()).map(([category, reviews]) => {
      const rule = TOPIC_RULES.find((item) => item.category === category);
      const negativeCount = reviews.filter((review) => review.rating <= 3).length;
      const confidence = Math.min(0.92, 0.58 + reviews.length * 0.08 + negativeCount * 0.06);
      const evidenceIds = unique(reviews.map((review) => review.evidenceId));
      const channelSummary = unique(reviews.map((review) => review.channelId));
      const now = isoNow();
      return {
        id: createId("ins"),
        ownedAppId: input.ownedAppId,
        category,
        title: `${category}：${reviews.length} 条样本形成可跟进信号`,
        summary: reviews.slice(0, 3).map((review) => review.content).join(" / "),
        evidenceIds,
        confidence,
        severity: rule?.severity ?? "low",
        sourceChannels: channelSummary.map(() => "Manual"),
        recommendation:
          category === "AI / 模板机会"
            ? "评估当前 App 是否需要补强 AI 模板入口、模板更新节奏和生成结果展示。"
            : category === "会员 / 价格体验"
              ? "对比当前 App 会员入口频率和免费权益边界，避免付费拦截损害口碑。"
              : "结合当前 App 体验链路排查是否存在同类问题，并沉淀为候选需求。",
        label: reviews.length > 1 ? "Pattern" : "Fact",
        status: "New",
        createdAt: now,
        updatedAt: now
      };
    });
  },

  // @SpecId: ACI-FLOW-INSIGHT-002, ACI-RULE-AI-001
  async extractFeatures(input: FeatureExtractionInput): Promise<Feature[]> {
    const now = isoNow();
    const text = input.descriptions.map((item) => item.text).join("\n");
    const features: Array<Pick<Feature, "name" | "category" | "demandScore">> = [
      { name: "AI 写真 / AI 模板", category: "AI", demandScore: text.includes("AI") ? 88 : 60 },
      { name: "高清导出", category: "会员 / 导出", demandScore: text.includes("高清") ? 76 : 52 },
      { name: "快速启动相机", category: "拍照体验", demandScore: text.includes("启动") ? 70 : 55 },
      { name: "会员权益说明", category: "商业化", demandScore: text.includes("会员") ? 82 : 50 }
    ];

    const competitorIds = unique(input.descriptions.map((item) => item.competitorId).filter(Boolean)) as string[];
    return features.map((feature) => ({
      id: createId("feature"),
      ownedAppId: input.ownedAppId,
      name: feature.name,
      category: feature.category,
      currentAppSupport: feature.name === "快速启动相机" ? "advantage" : "partial",
      competitorSupport: competitorIds.reduce<Record<string, Feature["currentAppSupport"]>>((acc, competitorId) => {
        acc[competitorId] = feature.demandScore >= 75 ? "owned" : "partial";
        return acc;
      }, {}),
      demandScore: feature.demandScore,
      source: "ai",
      updatedAt: now
    }));
  }
};
