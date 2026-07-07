import type { Feature, Insight, Review } from "@aci/domain";

export interface InsightGenerationInput {
  ownedAppId: string;
  reviews: Review[];
}

export interface FeatureExtractionInput {
  ownedAppId: string;
  descriptions: Array<{
    competitorId?: string;
    text: string;
  }>;
}

export interface LLMProvider {
  name: string;
  classifyReviews(input: InsightGenerationInput): Promise<Insight[]>;
  extractFeatures(input: FeatureExtractionInput): Promise<Feature[]>;
}
