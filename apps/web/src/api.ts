import { buildOverviewMetrics, createSeedState, getScopedState } from "@aci/domain";
import type { Channel, DashboardState, JobType, OverviewMetrics, ScopedDashboardState } from "@aci/domain";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4310";

export interface ApiStateResponse {
  state: ScopedDashboardState;
  activeOwnedAppId?: string;
  metrics?: OverviewMetrics;
  offline?: boolean;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function localResponse(ownedAppId?: string): ApiStateResponse {
  const state = createSeedState();
  const activeOwnedAppId = ownedAppId ?? state.ownedApps.find((app) => app.status === "Active")?.id;
  const scoped = getScopedState(state, activeOwnedAppId);
  return {
    state: scoped,
    activeOwnedAppId,
    metrics: activeOwnedAppId ? buildOverviewMetrics(state, activeOwnedAppId) : undefined,
    offline: true
  };
}

export async function fetchDashboardState(ownedAppId?: string): Promise<ApiStateResponse> {
  try {
    const query = ownedAppId ? `?ownedAppId=${encodeURIComponent(ownedAppId)}` : "";
    return await request<ApiStateResponse>(`/api/state${query}`);
  } catch {
    return localResponse(ownedAppId);
  }
}

export async function postJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function patchJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deletePath<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export function createJobPayload(ownedAppId: string, type: JobType, now = new Date()): { ownedAppId: string; type: JobType; idempotencyKey: string } {
  return {
    ownedAppId,
    type,
    idempotencyKey: `${type}-${ownedAppId}-${now.toISOString()}`
  };
}

export function triggerJob(ownedAppId: string, type: JobType): Promise<ApiStateResponse> {
  return postJson<ApiStateResponse>("/api/jobs", createJobPayload(ownedAppId, type));
}

export function createChannelPayload(channel: Partial<Channel>): Partial<Channel> {
  return channel;
}
