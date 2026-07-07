import { createId, isoNow } from "./ids.js";
import type { SocialAuthConfig, SocialAuthPlatform } from "./types.js";

export interface SocialAuthConfigInput {
  ownedAppId: string;
  platform: SocialAuthPlatform;
  appId?: string;
  clientKey?: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string[];
  enabled?: boolean;
  crawlFrequency?: string;
  dailyQuota?: number;
}

export interface SocialAuthUrlResult {
  authorizationUrl?: string;
  missingFields: string[];
  state: string;
}

export const socialAuthPlatforms: SocialAuthPlatform[] = ["xiaohongshu", "douyin", "weibo"];

export function defaultSocialAuthScopes(platform: SocialAuthPlatform): string[] {
  if (platform === "weibo") {
    return ["all"];
  }
  return ["user_info"];
}

export function socialAuthPlatformName(platform: SocialAuthPlatform): "小红书" | "抖音" | "微博" {
  if (platform === "xiaohongshu") {
    return "小红书";
  }
  if (platform === "douyin") {
    return "抖音";
  }
  return "微博";
}

function credentialId(config: Pick<SocialAuthConfig, "platform" | "appId" | "clientKey">): string | undefined {
  return config.platform === "douyin" ? config.clientKey ?? config.appId : config.appId ?? config.clientKey;
}

function normalizeScopes(scopes: string[] | undefined, platform: SocialAuthPlatform): string[] {
  const normalized = scopes?.map((scope) => scope.trim()).filter(Boolean) ?? [];
  return normalized.length > 0 ? normalized : defaultSocialAuthScopes(platform);
}

export function createSocialAuthConfig(input: SocialAuthConfigInput): SocialAuthConfig {
  const now = isoNow();
  return {
    id: createId("auth"),
    ownedAppId: input.ownedAppId,
    platform: input.platform,
    appId: input.appId?.trim() || undefined,
    clientKey: input.clientKey?.trim() || undefined,
    clientSecretConfigured: Boolean(input.clientSecret?.trim()),
    redirectUri: input.redirectUri.trim(),
    scopes: normalizeScopes(input.scopes, input.platform),
    status: "Configured",
    enabled: input.enabled ?? true,
    crawlFrequency: input.crawlFrequency?.trim() || "daily",
    dailyQuota: Math.max(0, Math.trunc(input.dailyQuota ?? 100)),
    usedToday: 0,
    authorizationCodeReceived: false,
    createdAt: now,
    updatedAt: now
  };
}

export function updateSocialAuthConfig(config: SocialAuthConfig, input: Partial<SocialAuthConfigInput>): SocialAuthConfig {
  const appId = input.appId === undefined ? config.appId : input.appId.trim() || undefined;
  const clientKey = input.clientKey === undefined ? config.clientKey : input.clientKey.trim() || undefined;
  const redirectUri = input.redirectUri === undefined ? config.redirectUri : input.redirectUri.trim();
  const hasCredential = Boolean(appId || clientKey);
  return {
    ...config,
    appId,
    clientKey,
    clientSecretConfigured: input.clientSecret?.trim() ? true : config.clientSecretConfigured,
    redirectUri,
    scopes: input.scopes ? normalizeScopes(input.scopes, config.platform) : config.scopes,
    enabled: input.enabled ?? config.enabled,
    crawlFrequency: input.crawlFrequency?.trim() || config.crawlFrequency,
    dailyQuota: input.dailyQuota === undefined ? config.dailyQuota : Math.max(0, Math.trunc(input.dailyQuota)),
    status: hasCredential && redirectUri ? (config.status === "NotConfigured" ? "Configured" : config.status) : "NotConfigured",
    updatedAt: isoNow()
  };
}

export function buildSocialAuthUrl(config: SocialAuthConfig): SocialAuthUrlResult {
  const credential = credentialId(config);
  const missingFields = [
    credential ? undefined : config.platform === "douyin" ? "clientKey" : "appId",
    config.redirectUri ? undefined : "redirectUri"
  ].filter((field): field is string => Boolean(field));
  const state = `${config.ownedAppId}:${config.platform}:${config.id}`;
  if (missingFields.length > 0 || !credential) {
    return { missingFields, state };
  }

  const scopes = config.scopes.join(",");
  if (config.platform === "xiaohongshu") {
    const url = new URL("https://ark.xiaohongshu.com/ark/authorization");
    url.searchParams.set("appId", credential);
    url.searchParams.set("redirectUri", config.redirectUri);
    url.searchParams.set("state", state);
    return { authorizationUrl: url.toString(), missingFields, state };
  }
  if (config.platform === "douyin") {
    const url = new URL("https://open.douyin.com/platform/oauth/connect/");
    url.searchParams.set("client_key", credential);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scopes);
    url.searchParams.set("redirect_uri", config.redirectUri);
    url.searchParams.set("state", state);
    return { authorizationUrl: url.toString(), missingFields, state };
  }

  const url = new URL("https://api.weibo.com/oauth2/authorize");
  url.searchParams.set("client_id", credential);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  return { authorizationUrl: url.toString(), missingFields, state };
}

export function markSocialAuthUrlGenerated(config: SocialAuthConfig, authorizationUrl: string): SocialAuthConfig {
  const now = isoNow();
  return {
    ...config,
    status: "AuthorizationUrlReady",
    lastAuthorizationUrl: authorizationUrl,
    lastAuthUrlGeneratedAt: now,
    lastFailureReason: undefined,
    updatedAt: now
  };
}

export function markSocialAuthCallback(config: SocialAuthConfig, result: { code?: string; error?: string }): SocialAuthConfig {
  const now = isoNow();
  if (result.error || !result.code) {
    return {
      ...config,
      status: "Failed",
      authorizationCodeReceived: false,
      lastFailureReason: result.error ?? "授权回调未返回 code",
      updatedAt: now
    };
  }
  return {
    ...config,
    status: "PendingTokenExchange",
    authorizationCodeReceived: true,
    lastAuthorizedAt: now,
    lastFailureReason: undefined,
    updatedAt: now
  };
}

export function disconnectSocialAuthConfig(config: SocialAuthConfig): SocialAuthConfig {
  const now = isoNow();
  return {
    ...config,
    status: config.appId || config.clientKey ? "Configured" : "NotConfigured",
    authorizationCodeReceived: false,
    lastAuthorizedAt: undefined,
    tokenExpiresAt: undefined,
    lastFailureReason: undefined,
    updatedAt: now
  };
}
