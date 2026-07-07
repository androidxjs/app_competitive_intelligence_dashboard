import http from "node:http";
import https from "node:https";
import { URL } from "node:url";
import type { SocialPlatform } from "@aci/domain";

export interface PublicSocialFetchResult {
  status: "Fetched" | "Failed";
  platform?: SocialPlatform;
  finalUrl: string;
  title?: string;
  excerpt?: string;
  failureReason?: string;
}

const allowedDomains: Record<SocialPlatform, string[]> = {
  xiaohongshu: ["xiaohongshu.com", "xhslink.com"],
  douyin: ["douyin.com", "iesdouyin.com"],
  weibo: ["weibo.com", "weibo.cn"]
};

function platformForHost(hostname: string): SocialPlatform | undefined {
  const host = hostname.toLowerCase();
  return (Object.entries(allowedDomains) as Array<[SocialPlatform, string[]]>).find(([, domains]) =>
    domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  )?.[0];
}

function isAllowedUrl(input: string): { url?: URL; platform?: SocialPlatform; error?: string } {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { error: "只支持 http/https 公开链接" };
    }
    const platform = platformForHost(url.hostname);
    if (!platform) {
      return { error: "仅支持小红书、抖音、微博公开链接" };
    }
    return { url, platform };
  } catch {
    return { error: "链接格式无效" };
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function metaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`, "i")
  ];
  return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
}

function titleFromHtml(html: string): string | undefined {
  return decodeHtmlEntities(metaContent(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim() || undefined;
}

function descriptionFromHtml(html: string): string | undefined {
  return decodeHtmlEntities(metaContent(html, "description") ?? metaContent(html, "og:description") ?? "").trim() || undefined;
}

function looksBlocked(statusCode: number, html: string): string | undefined {
  const text = stripHtml(html).slice(0, 2000).toLowerCase();
  if ([401, 403, 429].includes(statusCode)) {
    return `平台返回 ${statusCode}，可能需要登录或触发访问限制`;
  }
  if (/captcha|验证码|安全验证|访问过于频繁|请登录|登录后|login|verify|滑块/.test(text)) {
    return "页面疑似需要登录、验证码或安全验证，已按合规规则停止抓取";
  }
  return undefined;
}

function requestText(url: URL): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.request(
      url,
      {
        method: "GET",
        timeout: 8000,
        headers: {
          "User-Agent": "Mozilla/5.0 AppCompetitiveIntelligenceDashboard/0.1",
          Accept: "text/html,application/xhtml+xml"
        }
      },
      (response) => {
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size <= 256_000) {
            chunks.push(chunk);
          }
          if (size > 256_000) {
            request.destroy();
          }
        });
        response.on("end", () => {
          resolve({
            statusCode: response.statusCode ?? 0,
            headers: response.headers,
            body: Buffer.concat(chunks).toString("utf8")
          });
        });
      }
    );
    request.on("timeout", () => {
      request.destroy(new Error("公开链接抓取超时"));
    });
    request.on("error", reject);
    request.end();
  });
}

export async function fetchPublicSocialLink(inputUrl: string, redirectDepth = 0): Promise<PublicSocialFetchResult> {
  const validation = isAllowedUrl(inputUrl);
  if (!validation.url || !validation.platform) {
    return {
      status: "Failed",
      finalUrl: inputUrl,
      failureReason: validation.error ?? "链接不可抓取"
    };
  }

  try {
    const result = await requestText(validation.url);
    const location = result.headers.location;
    if ([301, 302, 303, 307, 308].includes(result.statusCode) && location && redirectDepth < 3) {
      const redirectedUrl = new URL(location, validation.url);
      return fetchPublicSocialLink(redirectedUrl.toString(), redirectDepth + 1);
    }

    const blockedReason = looksBlocked(result.statusCode, result.body);
    if (blockedReason) {
      return {
        status: "Failed",
        platform: validation.platform,
        finalUrl: validation.url.toString(),
        failureReason: blockedReason
      };
    }
    if (result.statusCode < 200 || result.statusCode >= 300) {
      return {
        status: "Failed",
        platform: validation.platform,
        finalUrl: validation.url.toString(),
        failureReason: `平台返回 ${result.statusCode}`
      };
    }

    const title = titleFromHtml(result.body);
    const description = descriptionFromHtml(result.body);
    const text = stripHtml(result.body);
    const excerpt = (description || text).slice(0, 500);
    return {
      status: "Fetched",
      platform: validation.platform,
      finalUrl: validation.url.toString(),
      title,
      excerpt: excerpt || title || "公开页面可访问，但未提取到正文摘要"
    };
  } catch (error) {
    return {
      status: "Failed",
      platform: validation.platform,
      finalUrl: validation.url.toString(),
      failureReason: error instanceof Error ? error.message : String(error)
    };
  }
}
