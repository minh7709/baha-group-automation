import { CampaignData } from '../types';
import { AdsPlatformAdapter, PlatformCampaignResult, PlatformActionResult, PlatformStatusResult } from './types';

export class MockAdsAdapter implements AdsPlatformAdapter {
  async createPausedCampaign(input: CampaignData): Promise<PlatformCampaignResult> {
    // Giả lập độ trễ mạng như Meta Graph API thật
    await new Promise((r) => setTimeout(r, 800));

    const timestamp = Date.now();
    const campaignId = `1202489${timestamp.toString().slice(-11)}`;
    const adSetId = `1202489${(timestamp + 1).toString().slice(-11)}`;
    const creativeId = `1808740${(timestamp + 2).toString().slice(-9)}`;
    const adId = `1202489${(timestamp + 3).toString().slice(-11)}`;

    return {
      success: true,
      platformCampaignId: campaignId,
      platformAdSetId: adSetId,
      platformCreativeId: creativeId,
      platformAdId: adId,
      status: 'CREATED_PAUSED',
      isMock: true,
      message: 'Đã tạo đầy đủ Campaign, AdSet, Creative, Ad trên môi trường mô phỏng Meta v21.0 (Luôn ở trạng thái TẠM DỪNG).',
    };
  }

  async activateCampaign(platformCampaignId: string): Promise<PlatformActionResult> {
    await new Promise((r) => setTimeout(r, 600));

    return {
      success: true,
      status: 'SIMULATED_ACTIVE',
      isMock: true,
      message: `[MÔ PHỎNG] Chiến dịch ${platformCampaignId} đã kích hoạt ở chế độ MOCK (Không trừ tiền, an toàn tài chính).`,
    };
  }

  async pauseCampaign(platformCampaignId: string): Promise<PlatformActionResult> {
    await new Promise((r) => setTimeout(r, 400));

    return {
      success: true,
      status: 'STOPPED',
      isMock: true,
      message: `[MÔ PHỎNG] Đã gửi lệnh dừng khẩn cấp thành công cho chiến dịch ${platformCampaignId}.`,
    };
  }

  async getCampaignStatus(platformCampaignId: string): Promise<PlatformStatusResult> {
    return {
      success: true,
      status: 'CREATED_PAUSED',
      effectiveStatus: 'PAUSED',
      isServing: false,
      lastSyncAt: new Date().toISOString(),
    };
  }
}

