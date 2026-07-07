import { dateOnly, isoNow } from "./ids";
import type { DashboardState } from "./types";

export function createSeedState(): DashboardState {
  const now = isoNow();
  const projectId = "project_cn_pm";
  const ownedAppId = "app_b612";
  const secondAppId = "app_foodie_demo";
  const competitorMeitu = "cmp_meitu";
  const competitorXingtu = "cmp_xingtu";
  const competitorQingyan = "cmp_qingyan";
  const channelB612 = "ch_b612_appstore";
  const channelMeitu = "ch_meitu_appstore";
  const channelXingtu = "ch_xingtu_huawei";
  const channelQingyan = "ch_qingyan_myapp";
  const seedPeriod = {
    start: dateOnly(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
    end: dateOnly()
  };

  return {
    projects: [
      {
        id: projectId,
        name: "中国区 App 竞品雷达",
        market: "China",
        languages: ["zh-CN"],
        defaultWatchFrequency: "weekly",
        createdAt: now
      }
    ],
    ownedApps: [
      {
        id: ownedAppId,
        projectId,
        name: "B612 咔叽",
        category: "影像 / 相机 / 美颜",
        owner: "产品团队",
        platforms: ["ios", "android"],
        status: "Active",
        featureTemplate: "影像类 App",
        websiteUrl: "https://b612.snow.me",
        appStoreUrl: "https://apps.apple.com/cn/app/b612/id904209370",
        androidStoreUrls: [],
        createdAt: now,
        updatedAt: now
      },
      {
        id: secondAppId,
        projectId,
        name: "Foodie 示例",
        category: "影像 / 美食拍摄",
        owner: "增长产品",
        platforms: ["ios", "android"],
        status: "Active",
        featureTemplate: "影像类 App",
        websiteUrl: "https://www.snowcorp.com",
        androidStoreUrls: [],
        createdAt: now,
        updatedAt: now
      }
    ],
    competitors: [
      {
        id: competitorMeitu,
        ownedAppId,
        name: "美图秀秀",
        category: "修图 / 美颜",
        priority: "P0",
        status: "Active",
        websiteUrl: "https://xiuxiu.meitu.com",
        createdAt: now,
        updatedAt: now
      },
      {
        id: competitorXingtu,
        ownedAppId,
        name: "醒图",
        category: "修图 / 模板",
        priority: "P0",
        status: "Active",
        websiteUrl: "https://www.ulikecam.com",
        createdAt: now,
        updatedAt: now
      },
      {
        id: competitorQingyan,
        ownedAppId,
        name: "轻颜相机",
        category: "相机 / 美颜",
        priority: "P1",
        status: "Active",
        websiteUrl: "https://www.ulikecam.com",
        createdAt: now,
        updatedAt: now
      }
    ],
    channels: [
      {
        id: channelB612,
        ownedAppId,
        ownerType: "owned_app",
        ownerId: ownedAppId,
        channelName: "App Store China",
        storeUrl: "https://apps.apple.com/cn/app/b612/id904209370",
        collectionMode: "automatic",
        complianceStatus: "approved",
        crawlStatus: "Succeeded",
        lastSuccessAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: channelMeitu,
        ownedAppId,
        ownerType: "competitor",
        ownerId: competitorMeitu,
        channelName: "App Store China",
        storeUrl: "https://apps.apple.com/cn/app/meitu/id416048305",
        collectionMode: "automatic",
        complianceStatus: "approved",
        crawlStatus: "Succeeded",
        lastSuccessAt: now,
        createdAt: now,
        updatedAt: now
      },
      {
        id: channelXingtu,
        ownedAppId,
        ownerType: "competitor",
        ownerId: competitorXingtu,
        channelName: "Huawei",
        storeUrl: "https://appgallery.huawei.com/app/C101912319",
        collectionMode: "manual",
        complianceStatus: "pending",
        crawlStatus: "ManualOnly",
        lastFailureReason: "国内渠道需合规确认后启用自动采集",
        createdAt: now,
        updatedAt: now
      },
      {
        id: channelQingyan,
        ownedAppId,
        ownerType: "competitor",
        ownerId: competitorQingyan,
        channelName: "Tencent MyApp",
        storeUrl: "https://sj.qq.com/appdetail/com.gorgeous.lite",
        collectionMode: "manual",
        complianceStatus: "pending",
        crawlStatus: "ManualOnly",
        lastFailureReason: "当前以手动样本录入为准",
        createdAt: now,
        updatedAt: now
      }
    ],
    snapshots: [
      {
        id: "snap_meitu_latest",
        ownedAppId,
        competitorId: competitorMeitu,
        channelId: channelMeitu,
        version: "10.22.0",
        rating: 4.8,
        reviewCount: 682000,
        priceText: "美图 VIP：月卡 ¥25，季卡 ¥68，年卡 ¥198",
        description: "AI 写真、照片精修、视频美颜和模板玩法持续更新。",
        releaseNotes: "新增 AI 风格写真模板，优化人像肤色和照片修复体验。",
        screenshots: ["AI 写真", "一键精修", "模板修图"],
        capturedAt: now,
        evidenceId: "ev_meitu_snapshot"
      }
    ],
    reviews: [
      {
        id: "rev_meitu_1",
        ownedAppId,
        competitorId: competitorMeitu,
        channelId: channelMeitu,
        rating: 2,
        version: "10.22.0",
        content: "会员入口太多，导出高清图经常提示开通会员。",
        topicHint: "pricing",
        capturedAt: now,
        evidenceId: "ev_meitu_review_1"
      },
      {
        id: "rev_xingtu_1",
        ownedAppId,
        competitorId: competitorXingtu,
        channelId: channelXingtu,
        rating: 5,
        version: "8.7.0",
        content: "模板更新很快，最近的 AI 发型和证件照很好用。",
        topicHint: "ai",
        capturedAt: now,
        evidenceId: "ev_xingtu_review_1"
      },
      {
        id: "rev_qingyan_1",
        ownedAppId,
        competitorId: competitorQingyan,
        channelId: channelQingyan,
        rating: 3,
        version: "9.9.1",
        content: "拍照很好看，但夜景容易糊，希望相机启动更快。",
        topicHint: "camera",
        capturedAt: now,
        evidenceId: "ev_qingyan_review_1"
      }
    ],
    evidence: [
      {
        id: "ev_meitu_snapshot",
        ownedAppId,
        sourceType: "snapshot",
        sourceUrl: "https://apps.apple.com/cn/app/meitu/id416048305",
        channelName: "App Store China",
        rawExcerpt: "新增 AI 风格写真模板，优化人像肤色和照片修复体验。",
        capturedAt: now
      },
      {
        id: "ev_meitu_review_1",
        ownedAppId,
        sourceType: "review",
        sourceUrl: "https://apps.apple.com/cn/app/meitu/id416048305",
        channelName: "App Store China",
        rawExcerpt: "会员入口太多，导出高清图经常提示开通会员。",
        capturedAt: now
      },
      {
        id: "ev_xingtu_review_1",
        ownedAppId,
        sourceType: "review",
        sourceUrl: "https://appgallery.huawei.com/app/C101912319",
        channelName: "Huawei",
        rawExcerpt: "模板更新很快，最近的 AI 发型和证件照很好用。",
        capturedAt: now
      },
      {
        id: "ev_qingyan_review_1",
        ownedAppId,
        sourceType: "review",
        sourceUrl: "https://sj.qq.com/appdetail/com.gorgeous.lite",
        channelName: "Tencent MyApp",
        rawExcerpt: "拍照很好看，但夜景容易糊，希望相机启动更快。",
        capturedAt: now
      },
      {
        id: "ev_xhs_xingtu_ai_template",
        ownedAppId,
        sourceType: "social",
        sourceUrl: "https://www.xiaohongshu.com/explore/seed-ai-template",
        channelName: "Xiaohongshu",
        rawExcerpt: "小红书样本：醒图 AI 写真、AI 发型和证件照模板被用户收藏讨论，适合追踪模板话题热度。",
        capturedAt: now
      }
    ],
    insights: [
      {
        id: "ins_ai_template",
        ownedAppId,
        category: "AI / 模板机会",
        title: "竞品正在用 AI 模板提升内容供给速度",
        summary: "醒图评论和美图更新日志都出现 AI 写真、AI 发型、证件照等高频能力，说明 AI 模板仍是用户感知强的增长点。",
        evidenceIds: ["ev_meitu_snapshot", "ev_xingtu_review_1"],
        confidence: 0.82,
        severity: "high",
        sourceChannels: ["App Store China", "Huawei"],
        recommendation: "评估 B612 在 AI 模板入口、模板更新频率和生成前后对比展示上的补强。",
        label: "Pattern",
        status: "Confirmed",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "ins_pricing",
        ownedAppId,
        category: "会员 / 价格体验",
        title: "高清导出和会员拦截可能影响用户口碑",
        summary: "评论样本显示会员入口和高清导出限制会触发负面反馈，需要对比 B612 当前会员触点是否更克制。",
        evidenceIds: ["ev_meitu_review_1"],
        confidence: 0.74,
        severity: "medium",
        sourceChannels: ["App Store China"],
        recommendation: "检查当前付费墙出现频率，并把免费能力边界做成可感知优势。",
        label: "Pattern",
        status: "New",
        createdAt: now,
        updatedAt: now
      }
    ],
    features: [
      {
        id: "feature_ai_template",
        ownedAppId,
        name: "AI 写真 / AI 模板",
        category: "AI",
        currentAppSupport: "partial",
        competitorSupport: {
          [competitorMeitu]: "owned",
          [competitorXingtu]: "owned",
          [competitorQingyan]: "partial"
        },
        demandScore: 88,
        source: "ai",
        updatedAt: now
      },
      {
        id: "feature_fast_camera",
        ownedAppId,
        name: "快速启动相机",
        category: "拍照体验",
        currentAppSupport: "advantage",
        competitorSupport: {
          [competitorMeitu]: "partial",
          [competitorXingtu]: "missing",
          [competitorQingyan]: "partial"
        },
        demandScore: 72,
        source: "user_confirmed",
        updatedAt: now
      }
    ],
    moduleAnalyses: [
      {
        id: "mod_meitu_growth",
        ownedAppId,
        competitorId: competitorMeitu,
        period: seedPeriod,
        moduleType: "growth",
        summary: "样本显示美图秀秀持续用 AI 写真和精修模板强化付费增长入口。",
        signals: ["更新日志突出 AI 风格写真", "评论样本提到高清导出会员拦截"],
        risks: ["会员入口过强可能带来负面评论"],
        opportunities: ["B612 可用更轻的拍摄入口承接 AI 模板转化"],
        recommendation: "拆解 AI 写真入口、会员触点和导出链路，优先做低打扰转化实验。",
        evidenceIds: ["ev_meitu_snapshot", "ev_meitu_review_1"],
        confidence: 0.78,
        dataCoverage: ["App Store China", "Review"],
        updatedAt: now
      },
      {
        id: "mod_meitu_traffic",
        ownedAppId,
        competitorId: competitorMeitu,
        period: seedPeriod,
        moduleType: "traffic",
        summary: "当前仅覆盖 App Store 样本和官网入口，暂不估算下载量或投放规模。",
        signals: ["iOS 渠道可采集", "官网可作为后续落地页监控对象"],
        risks: ["缺少安卓渠道和第三方流量来源"],
        opportunities: ["补齐小米、华为、OPPO、vivo 后可比较渠道上新节奏"],
        recommendation: "先补安卓渠道快照，再接官网首页、活动页和商店素材变更监控。",
        evidenceIds: ["ev_meitu_snapshot"],
        confidence: 0.62,
        dataCoverage: ["App Store China"],
        updatedAt: now
      },
      {
        id: "mod_meitu_social",
        ownedAppId,
        competitorId: competitorMeitu,
        period: seedPeriod,
        moduleType: "social",
        summary: "社媒侧尚未接入自动监控，建议先用手动样本记录爆款模板和活动话题。",
        signals: ["AI 写真具备社媒传播素材属性"],
        risks: ["没有小红书、抖音、微博样本前不能判断声量"],
        opportunities: ["把商店更新与社媒话题联动，判断功能是否被传播验证"],
        recommendation: "建立社媒手动采样表，记录话题、素材、互动和对应版本。",
        evidenceIds: ["ev_meitu_snapshot"],
        confidence: 0.46,
        dataCoverage: ["Manual"],
        updatedAt: now
      },
      {
        id: "mod_meitu_product_performance",
        ownedAppId,
        competitorId: competitorMeitu,
        period: seedPeriod,
        moduleType: "product_performance",
        summary: "iOS 样本评分和评论量较高，版本变化集中在人像肤色、照片修复和 AI 模板。",
        signals: ["版本 10.22.0", "评分 4.8", "评论量样本 682000"],
        risks: ["Android 侧样本未补齐，无法做平台差异判断"],
        opportunities: ["对比 B612 相机启动优势，强化拍摄到 AI 编辑的闭环"],
        recommendation: "把评分、评论量、版本频率拆成 iOS/Android 两个平台分别看趋势。",
        evidenceIds: ["ev_meitu_snapshot"],
        confidence: 0.82,
        dataCoverage: ["App Store China"],
        updatedAt: now
      },
      {
        id: "mod_meitu_ai",
        ownedAppId,
        competitorId: competitorMeitu,
        period: seedPeriod,
        moduleType: "ai_insight",
        summary: "AI 写真、修复和模板供给是美图秀秀当前可见的 AI 重点。",
        signals: ["AI 风格写真", "照片修复", "人像肤色优化"],
        risks: ["AI 能力若只绑定付费，可能削弱免费用户好感"],
        opportunities: ["B612 可测试拍摄后自动推荐 AI 模板"],
        recommendation: "建立 AI 功能雷达：入口、生成前后对比、价格门槛、失败反馈四项固定记录。",
        evidenceIds: ["ev_meitu_snapshot", "ev_meitu_review_1"],
        confidence: 0.8,
        dataCoverage: ["App Store China", "Review"],
        updatedAt: now
      },
      {
        id: "mod_xingtu_growth",
        ownedAppId,
        competitorId: competitorXingtu,
        period: seedPeriod,
        moduleType: "growth",
        summary: "醒图样本更偏模板更新与工具上新驱动增长，用户评论对 AI 发型、证件照反馈正向。",
        signals: ["模板更新快", "AI 发型和证件照被正向提及"],
        risks: ["缺少商店价格和评分快照，无法确认商业化强度"],
        opportunities: ["B612 可对比模板更新频率和拍摄入口触达效率"],
        recommendation: "把模板新增、热门模板、AI 工具入口作为醒图增长监控的固定字段。",
        evidenceIds: ["ev_xingtu_review_1"],
        confidence: 0.68,
        dataCoverage: ["Huawei", "Review"],
        updatedAt: now
      },
      {
        id: "mod_xingtu_traffic",
        ownedAppId,
        competitorId: competitorXingtu,
        period: seedPeriod,
        moduleType: "traffic",
        summary: "当前只有华为手动样本，流量来源和下载变化需要补充渠道快照。",
        signals: ["华为渠道为手动样本"],
        risks: ["单渠道样本容易误判整体热度"],
        opportunities: ["新增 App Store 与应用宝后可比较平台节奏差异"],
        recommendation: "优先补齐 App Store、应用宝和官网落地页，再做流量趋势判断。",
        evidenceIds: ["ev_xingtu_review_1"],
        confidence: 0.42,
        dataCoverage: ["Huawei"],
        updatedAt: now
      },
      {
        id: "mod_xingtu_social",
        ownedAppId,
        competitorId: competitorXingtu,
        period: seedPeriod,
        moduleType: "social",
        summary: "模板型产品天然依赖社媒传播，建议监控热门模板在小红书、抖音的二次创作。",
        signals: ["AI 发型和证件照具备分享属性"],
        risks: ["当前没有社媒证据，结论只能作为观察方向"],
        opportunities: ["将模板评论热点与社媒话题做交叉验证"],
        recommendation: "建立模板话题榜，记录话题热度、素材样式和对应功能入口。",
        evidenceIds: ["ev_xingtu_review_1"],
        confidence: 0.45,
        dataCoverage: ["Manual"],
        updatedAt: now
      },
      {
        id: "mod_xingtu_product_performance",
        ownedAppId,
        competitorId: competitorXingtu,
        period: seedPeriod,
        moduleType: "product_performance",
        summary: "用户正向样本集中在模板和 AI 工具，平台表现仍需补齐评分、版本和评论量。",
        signals: ["AI 发型", "证件照", "模板更新快"],
        risks: ["没有版本快照会影响趋势判断"],
        opportunities: ["用版本更新频率对比 B612 的模板供给节奏"],
        recommendation: "补采 iOS/Android 版本号、评分、评论量后再输出平台表现评分。",
        evidenceIds: ["ev_xingtu_review_1"],
        confidence: 0.57,
        dataCoverage: ["Huawei", "Review"],
        updatedAt: now
      },
      {
        id: "mod_xingtu_ai",
        ownedAppId,
        competitorId: competitorXingtu,
        period: seedPeriod,
        moduleType: "ai_insight",
        summary: "AI 发型和证件照是醒图样本中的明确 AI 感知点，偏工具化和结果导向。",
        signals: ["AI 发型被正向提及", "证件照被正向提及"],
        risks: ["缺少失败评论和价格样本，无法判断生成质量稳定性"],
        opportunities: ["B612 可测试拍摄场景下的 AI 发型预览和证件照转化"],
        recommendation: "对 AI 发型、证件照建立功能拆解卡：入口、生成时长、付费限制、导出质量。",
        evidenceIds: ["ev_xingtu_review_1"],
        confidence: 0.72,
        dataCoverage: ["Huawei", "Review"],
        updatedAt: now
      },
      {
        id: "mod_qingyan_growth",
        ownedAppId,
        competitorId: competitorQingyan,
        period: seedPeriod,
        moduleType: "growth",
        summary: "轻颜相机样本更偏拍照体验和美颜效果，增长机会可能来自拍摄质量与自然美颜表达。",
        signals: ["用户认可拍照好看", "夜景糊被提及为体验问题"],
        risks: ["缺少会员、活动和版本快照，商业化信号不足"],
        opportunities: ["B612 可突出快速启动和稳定拍摄作为差异化优势"],
        recommendation: "把拍照质量、启动速度、夜景反馈纳入轻颜固定监控指标。",
        evidenceIds: ["ev_qingyan_review_1"],
        confidence: 0.6,
        dataCoverage: ["Tencent MyApp", "Review"],
        updatedAt: now
      },
      {
        id: "mod_qingyan_traffic",
        ownedAppId,
        competitorId: competitorQingyan,
        period: seedPeriod,
        moduleType: "traffic",
        summary: "当前仅有应用宝手动样本，无法判断渠道流量变化。",
        signals: ["应用宝渠道为手动样本"],
        risks: ["缺少 iOS 和其他安卓渠道对照"],
        opportunities: ["补齐 App Store 与主流安卓渠道后可比较相机类 App 渠道覆盖"],
        recommendation: "先补 iOS 与华为、小米、OPPO、vivo 渠道，再输出流量趋势。",
        evidenceIds: ["ev_qingyan_review_1"],
        confidence: 0.4,
        dataCoverage: ["Tencent MyApp"],
        updatedAt: now
      },
      {
        id: "mod_qingyan_social",
        ownedAppId,
        competitorId: competitorQingyan,
        period: seedPeriod,
        moduleType: "social",
        summary: "自然美颜和拍照效果适合社媒种草，但当前没有社媒样本，需要补采。",
        signals: ["拍照好看是可传播表达"],
        risks: ["没有社媒证据时不能判断话题声量"],
        opportunities: ["追踪妆容、滤镜、夜景等关键词在社媒的用户反馈"],
        recommendation: "建立相机效果关键词监控：自然、美颜、夜景、滤镜、启动速度。",
        evidenceIds: ["ev_qingyan_review_1"],
        confidence: 0.43,
        dataCoverage: ["Manual"],
        updatedAt: now
      },
      {
        id: "mod_qingyan_product_performance",
        ownedAppId,
        competitorId: competitorQingyan,
        period: seedPeriod,
        moduleType: "product_performance",
        summary: "产品表现样本显示拍照效果有优势感知，但夜景和启动体验是需要持续观察的问题。",
        signals: ["拍照好看", "夜景容易糊", "希望相机启动更快"],
        risks: ["单条评论不能代表整体体验"],
        opportunities: ["B612 可把快速启动相机作为自有优势继续验证"],
        recommendation: "将评论主题按拍摄质量、启动性能、夜景、滤镜自然度做结构化统计。",
        evidenceIds: ["ev_qingyan_review_1"],
        confidence: 0.65,
        dataCoverage: ["Tencent MyApp", "Review"],
        updatedAt: now
      },
      {
        id: "mod_qingyan_ai",
        ownedAppId,
        competitorId: competitorQingyan,
        period: seedPeriod,
        moduleType: "ai_insight",
        summary: "当前样本没有明确 AI 功能反馈，AI 结论应保持观察状态。",
        signals: ["暂无明确 AI 评论样本"],
        risks: ["如果只看当前样本，可能低估轻颜的 AI 能力"],
        opportunities: ["补采更新日志和截图 OCR，确认是否有 AI 妆容、AI 修图、AI 模板"],
        recommendation: "将轻颜 AI 监控列为待补证据项，不进入需求优先级判断。",
        evidenceIds: ["ev_qingyan_review_1"],
        confidence: 0.35,
        dataCoverage: ["Review"],
        updatedAt: now
      }
    ],
    actionRecommendations: [],
    socialSamples: [
      {
        id: "social_xhs_xingtu_ai_template",
        ownedAppId,
        competitorId: competitorXingtu,
        platform: "xiaohongshu",
        url: "https://www.xiaohongshu.com/explore/seed-ai-template",
        topic: "AI 写真 / AI 发型模板",
        author: "手动样本",
        publishedAt: dateOnly(),
        engagementText: "收藏 1200+，评论 180+",
        summary: "醒图 AI 写真、AI 发型和证件照模板在小红书样本中有收藏和评论信号，可作为模板供给与社媒传播证据。",
        tags: ["AI", "写真", "发型", "证件照", "模板"],
        signalType: "template_trend",
        impact: "high",
        fetchStatus: "ManualOnly",
        evidenceId: "ev_xhs_xingtu_ai_template",
        createdAt: now,
        updatedAt: now
      }
    ],
    socialAuthConfigs: [
      {
        id: "auth_xhs_b612",
        ownedAppId,
        platform: "xiaohongshu",
        clientSecretConfigured: false,
        redirectUri: "http://localhost:4310/api/social-auth/callback/xiaohongshu",
        scopes: ["user_info"],
        status: "NotConfigured",
        enabled: true,
        crawlFrequency: "daily",
        dailyQuota: 80,
        usedToday: 0,
        authorizationCodeReceived: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "auth_douyin_b612",
        ownedAppId,
        platform: "douyin",
        clientSecretConfigured: false,
        redirectUri: "http://localhost:4310/api/social-auth/callback/douyin",
        scopes: ["user_info"],
        status: "NotConfigured",
        enabled: true,
        crawlFrequency: "daily",
        dailyQuota: 80,
        usedToday: 0,
        authorizationCodeReceived: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "auth_weibo_b612",
        ownedAppId,
        platform: "weibo",
        clientSecretConfigured: false,
        redirectUri: "http://localhost:4310/api/social-auth/callback/weibo",
        scopes: ["all"],
        status: "NotConfigured",
        enabled: true,
        crawlFrequency: "daily",
        dailyQuota: 200,
        usedToday: 0,
        authorizationCodeReceived: false,
        createdAt: now,
        updatedAt: now
      }
    ],
    requirements: [
      {
        id: "req_ai_template",
        ownedAppId,
        insightIds: ["ins_ai_template"],
        problem: "竞品 AI 模板更新快，用户对 AI 发型、写真、证件照反馈正向",
        evidenceIds: ["ev_meitu_snapshot", "ev_xingtu_review_1"],
        competitorReference: "美图秀秀 / 醒图",
        appGapOrAdvantage: "B612 有拍照入口优势，但 AI 模板包装和更新节奏需要验证",
        recommendation: "做一轮 AI 模板入口和新模板供给实验",
        priorityHint: "P0",
        prdNotes: "目标：提升 AI 模板点击和生成完成率。\n验收：新增入口需引用竞品证据并完成小流量验证。",
        status: "ToReview",
        createdAt: now,
        updatedAt: now
      }
    ],
    reports: [
      {
        id: "report_seed_weekly",
        ownedAppId,
        period: seedPeriod,
        markdown: "# B612 咔叽竞品周报\n\n## 摘要\n\n本周重点关注 AI 模板、会员触点和相机启动体验。",
        status: "Draft",
        evidenceIds: ["ev_meitu_snapshot", "ev_xingtu_review_1", "ev_meitu_review_1"],
        generatedAt: now,
        updatedAt: now
      }
    ],
    jobs: []
  };
}
