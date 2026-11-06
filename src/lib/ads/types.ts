import { CampaignData, CampaignStatus } from '../types';

export interface PlatformCampaignResult {
  success: boolean;
  platformCampaignId?: string;
  platformAdSetId?: string;
  platformCreativeId?: string;
  platformAdId?: string;
  status: CampaignStatus;
  isMock: boolean;
  message?: string;
  error?: string;
  errorStep?: 'VALIDATION' | 'CAMPAIGN' | 'ADSET' | 'CREATIVE' | 'AD' | 'NETWORK';
}

export interface PlatformActionResult {
  success: boolean;
  status: CampaignStatus;
  isMock: boolean;
  message?: string;
  error?: string;
}

export interface PlatformStatusResult {
  success: boolean;
  status: CampaignStatus;
  effectiveStatus?: string;
  isServing: boolean;
  lastSyncAt: string;
  error?: string;
}

export interface PlatformInsightsResult {
  success: boolean;
  spend?: number;
  impressions?: number;
  clicks?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  since?: string;
  until?: string;
  error?: string;
}

export interface AdsPlatformAdapter {
  createPausedCampaign(input: CampaignData): Promise<PlatformCampaignResult>;
  activateCampaign(platformCampaignId: string): Promise<PlatformActionResult>;
  pauseCampaign(platformCampaignId: string): Promise<PlatformActionResult>;
  getCampaignStatus(platformCampaignId: string): Promise<PlatformStatusResult>;
  getCampaignInsights(platformCampaignId: string, since?: string, until?: string): Promise<PlatformInsightsResult>;
}
