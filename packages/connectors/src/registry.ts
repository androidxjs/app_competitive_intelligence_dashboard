import type { Channel } from "@aci/domain";
import { appStoreChinaConnector } from "./appStoreChinaConnector";
import { manualSampleConnector } from "./manualConnector";
import type { StoreConnector } from "./types";

export class ChannelAdapterRegistry {
  private readonly connectors: StoreConnector[];

  constructor(connectors: StoreConnector[] = [appStoreChinaConnector, manualSampleConnector]) {
    this.connectors = connectors;
  }

  // @SpecId: ACI-FLOW-CHANNEL-001, ACI-RULE-CHANNEL-003
  resolve(channel: Channel): StoreConnector | undefined {
    if (channel.complianceStatus === "blocked" || channel.collectionMode === "disabled") {
      return undefined;
    }
    return this.connectors.find((connector) => connector.canHandle(channel));
  }

  listCapabilities(channel: Channel): string {
    const connector = this.resolve(channel);
    if (connector) {
      return channel.collectionMode === "manual" ? "manual-sample" : connector.name;
    }
    if (channel.complianceStatus === "blocked") {
      return "blocked-by-compliance";
    }
    if (channel.collectionMode === "disabled") {
      return "disabled";
    }
    return "planned";
  }
}
