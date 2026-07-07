import { describe, expect, it } from "vitest";
import { createSeedState } from "@aci/domain";
import { generateMarkdownReport } from "../src";

describe("reporting", () => {
  it("exports required metadata and evidence references", () => {
    const report = generateMarkdownReport(createSeedState(), "app_b612", {
      start: "2026-07-01",
      end: "2026-07-06"
    });

    expect(report.markdown).toContain("周期：2026-07-01 至 2026-07-06");
    expect(report.markdown).toContain("Evidence References");
    expect(report.markdown).toContain("## 3. 分模块竞品分析");
    expect(report.markdown).toContain("### 增长");
    expect(report.markdown).toContain("### 流量");
    expect(report.markdown).toContain("### 社媒");
    expect(report.markdown).toContain("### 产品表现");
    expect(report.markdown).toContain("### AI 洞察");
    expect(report.markdown).toContain("### 1.1 管理层决策摘要");
    expect(report.markdown).toContain("### 1.2 说服力证据评分");
    expect(report.markdown).toContain("### 1.3 MVP 验证计划");
    expect(report.markdown).toContain("### 1.4 不直接复制竞品的边界");
    expect(report.markdown).toContain("## 7. 功能差距详情");
    expect(report.markdown).toContain("## 8. 社媒样本库");
    expect(report.markdown).toContain("## 10. 下周行动清单");
    expect(report.markdown).toContain("## 11. 趋势时间线");
    expect(report.markdown).toContain("## 12. 价格 / 会员监控");
    expect(report.markdown).toContain("## 13. 证据 Diff");
    expect(report.markdown).toContain("## 14. 告警中心");
    expect(report.markdown).toContain("## 15. 商店页元数据时间线");
    expect(report.markdown).toContain("## 16. 评分与口碑监控");
    expect(report.markdown).toContain("## 17. ASO 关键词雷达");
    expect(report.markdown).toContain("## 18. 产品发布雷达");
    expect(report.markdown).toContain("小红书");
    expect(report.markdown).toContain("研发提示");
    expect(report.evidenceIds.length).toBeGreaterThan(0);
  });
});
