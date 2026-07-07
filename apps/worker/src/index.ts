import { createSeedState } from "@aci/domain";
import { ChannelAdapterRegistry } from "@aci/connectors";
import { fakeLLMProvider } from "@aci/ai";
import { generateMarkdownReport } from "@aci/reporting";

async function main() {
  const state = createSeedState();
  const channel = state.channels[0];
  const registry = new ChannelAdapterRegistry();
  const connector = registry.resolve(channel);
  const sample = connector
    ? await connector.collect({
        ownedAppId: channel.ownedAppId,
        channel,
        competitorId: channel.ownerType === "competitor" ? channel.ownerId : undefined
      })
    : undefined;
  const insights = await fakeLLMProvider.classifyReviews({
    ownedAppId: "app_b612",
    reviews: state.reviews
  });
  const report = generateMarkdownReport(
    {
      ...state,
      insights: [...state.insights, ...insights]
    },
    "app_b612",
    {
      start: "2026-07-01",
      end: "2026-07-06"
    }
  );

  console.log(
    JSON.stringify(
      {
        worker: "ok",
        connector: connector?.name,
        collected: sample?.status,
        insights: insights.length,
        reportEvidence: report.evidenceIds.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
