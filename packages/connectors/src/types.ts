import type { AppSnapshot, Channel, Evidence, Review } from "@aci/domain";

export interface ConnectorContext {
  ownedAppId: string;
  competitorId?: string;
  channel: Channel;
}

export interface StoreConnectorResult {
  status: "success" | "manual_only" | "skipped" | "failed";
  userMessage: string;
  snapshot?: AppSnapshot;
  reviews: Review[];
  evidence: Evidence[];
  failureReason?: string;
}

export interface StoreConnector {
  name: string;
  canHandle(channel: Channel): boolean;
  collect(context: ConnectorContext): Promise<StoreConnectorResult>;
}

export interface SnapshotDiff {
  field: "version" | "description" | "screenshots" | "rating" | "reviewCount" | "priceText";
  previous?: string | number;
  current?: string | number;
  summary: string;
}
