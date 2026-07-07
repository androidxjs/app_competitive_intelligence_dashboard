import { describe, expect, it } from "vitest";
import { diffSnapshots } from "../src";

describe("snapshot diff", () => {
  it("does not backfill missing fields across channels", () => {
    const diffs = diffSnapshots(
      {
        id: "a",
        ownedAppId: "app",
        channelId: "ch",
        version: "1.0",
        rating: 4.2,
        screenshots: ["old"],
        capturedAt: "2026-07-01T00:00:00.000Z",
        evidenceId: "ev1"
      },
      {
        id: "b",
        ownedAppId: "app",
        channelId: "ch",
        version: "1.1",
        screenshots: ["old"],
        capturedAt: "2026-07-02T00:00:00.000Z",
        evidenceId: "ev2"
      }
    );

    expect(diffs.map((diff) => diff.field)).toEqual(["version"]);
  });
});
