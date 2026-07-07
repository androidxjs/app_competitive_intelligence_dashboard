import { describe, expect, it } from "vitest";
import { createSeedState } from "@aci/domain";
import { fakeLLMProvider } from "../src";

describe("fake provider", () => {
  it("generates evidence-backed insights", async () => {
    const state = createSeedState();
    const insights = await fakeLLMProvider.classifyReviews({
      ownedAppId: "app_b612",
      reviews: state.reviews
    });

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((insight) => insight.evidenceIds.length > 0)).toBe(true);
    expect(insights.every((insight) => insight.label === "Fact" || insight.label === "Pattern")).toBe(true);
  });
});
