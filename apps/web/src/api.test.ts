import { describe, expect, it } from "vitest";
import { createJobPayload } from "./api";

describe("api job payload", () => {
  it("creates a unique idempotency key for each manual job trigger", () => {
    const first = createJobPayload("app_b612", "crawl", new Date("2026-07-07T03:00:00.000Z"));
    const second = createJobPayload("app_b612", "crawl", new Date("2026-07-07T03:00:00.001Z"));

    expect(first.idempotencyKey).toBe("crawl-app_b612-2026-07-07T03:00:00.000Z");
    expect(second.idempotencyKey).toBe("crawl-app_b612-2026-07-07T03:00:00.001Z");
    expect(first.idempotencyKey).not.toBe(second.idempotencyKey);
  });
});
