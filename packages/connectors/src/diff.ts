import type { AppSnapshot } from "@aci/domain";
import type { SnapshotDiff } from "./types";

function normalizeScreenshots(value: string[]): string {
  return value.join(" / ");
}

// @SpecId: ACI-FLOW-CHANNEL-003, ACI-RULE-CHANNEL-001
export function diffSnapshots(previous?: AppSnapshot, current?: AppSnapshot): SnapshotDiff[] {
  if (!previous || !current) {
    return [];
  }

  const diffs: SnapshotDiff[] = [];
  const compare = (
    field: SnapshotDiff["field"],
    previousValue: string | number | undefined,
    currentValue: string | number | undefined,
    label: string
  ) => {
    if (previousValue === undefined || currentValue === undefined) {
      return;
    }
    if (previousValue !== currentValue) {
      diffs.push({
        field,
        previous: previousValue,
        current: currentValue,
        summary: `${label} 从 ${previousValue} 变为 ${currentValue}`
      });
    }
  };

  compare("version", previous.version, current.version, "版本");
  compare("description", previous.description, current.description, "描述");
  compare("rating", previous.rating, current.rating, "评分");
  compare("reviewCount", previous.reviewCount, current.reviewCount, "评论数");
  compare("priceText", previous.priceText, current.priceText, "价格");
  compare("screenshots", normalizeScreenshots(previous.screenshots), normalizeScreenshots(current.screenshots), "截图卖点");

  return diffs;
}
