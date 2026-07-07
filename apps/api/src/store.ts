import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createEmptyState, createSeedState } from "@aci/domain";
import type { DashboardState } from "@aci/domain";

const currentFile = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(currentFile), "../../..");
const defaultDataFile = path.join(rootDir, "data", "app-state.json");

function normalizeState(rawState: Partial<DashboardState>): DashboardState {
  const empty = createEmptyState();
  return {
    projects: rawState.projects ?? empty.projects,
    ownedApps: rawState.ownedApps ?? empty.ownedApps,
    competitors: rawState.competitors ?? empty.competitors,
    channels: rawState.channels ?? empty.channels,
    snapshots: rawState.snapshots ?? empty.snapshots,
    reviews: rawState.reviews ?? empty.reviews,
    evidence: rawState.evidence ?? empty.evidence,
    insights: rawState.insights ?? empty.insights,
    features: rawState.features ?? empty.features,
    moduleAnalyses: rawState.moduleAnalyses ?? empty.moduleAnalyses,
    actionRecommendations: rawState.actionRecommendations ?? empty.actionRecommendations,
    socialSamples: rawState.socialSamples ?? empty.socialSamples,
    socialAuthConfigs: rawState.socialAuthConfigs ?? empty.socialAuthConfigs,
    requirements: rawState.requirements ?? empty.requirements,
    reports: rawState.reports ?? empty.reports,
    jobs: rawState.jobs ?? empty.jobs
  };
}

export class JsonStateStore {
  constructor(private readonly filePath = process.env.ACI_DATA_FILE ?? defaultDataFile) {}

  async read(): Promise<DashboardState> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return normalizeState(JSON.parse(raw) as Partial<DashboardState>);
    } catch {
      const state = createSeedState();
      await this.write(state);
      return state;
    }
  }

  async write(state: DashboardState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(state, null, 2));
  }

  async update(mutator: (state: DashboardState) => DashboardState | Promise<DashboardState>): Promise<DashboardState> {
    const state = await this.read();
    const next = await mutator(state);
    await this.write(next);
    return next;
  }
}
