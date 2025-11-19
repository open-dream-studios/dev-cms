// shared/types/models/services.ts

export interface GoogleAdsData {
  customerId: string;
  stats: any,
  keywordData: any,
  adGroups: any,
  locations: any,
  campaign: any,
  campaigns: {
    campaigns: {
      id: string;
      name: string;
      status: number;
      budget: number;
    }[];
  };
  activeCampaign?: any;
  selectedAdGroup: any;
}

export type GoogleAdsRange = "7d" | "30d" | "90d"
