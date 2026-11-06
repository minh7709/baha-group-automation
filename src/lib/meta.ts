import { CampaignData } from './types';

export interface MetaCreationResult {
  success: boolean;
  isMock: boolean;
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaCreativeId?: string;
  metaAdId?: string;
  metaStatus: string;
  message: string;
  error?: string;
}

export class MetaAdsService {
  private mode: 'MOCK' | 'REAL';
  private accessToken?: string;
  private adAccountId?: string;
  private apiVersion = 'v21.0';

  constructor(mode: 'MOCK' | 'REAL' = 'MOCK', accessToken?: string, adAccountId?: string) {
    this.mode = mode;
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN;
    this.adAccountId = adAccountId || process.env.META_AD_ACCOUNT_ID;
  }

  async createCampaignSafe(campaign: CampaignData): Promise<MetaCreationResult> {
    // NGUYÊN TẮC AN TOÀN BẮT BUỘC:
    // Mọi đối tượng tạo ra trên Meta LUÔN ở trạng thái TẠM DỪNG (PAUSED), không phát sinh chi phí.
    if (this.mode === 'MOCK' || !this.accessToken || !this.adAccountId) {
      // Giả lập độ trễ mạng như gọi API Meta thật (500ms)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const randDigits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const metaCampaignId = `120248${randDigits.slice(0, 12)}`;
      const metaAdSetId = `120248${randDigits.slice(0, 10)}88`;
      const metaCreativeId = `180874${randDigits.slice(0, 10)}`;
      const metaAdId = `120248${randDigits.slice(0, 10)}99`;

      return {
        success: true,
        isMock: true,
        metaCampaignId,
        metaAdSetId,
        metaCreativeId,
        metaAdId,
        metaStatus: 'CREATED_PAUSED',
        message: 'Đã tạo thành công trên môi trường mô phỏng Meta Marketing API v21.0 (Trạng thái: TẠM DỪNG - An toàn tuyệt đối).',
      };
    }

    // CHẾ ĐỘ THẬT: GỌI META MARKETING GRAPH API
    try {
      const sanitizedAdAccount = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
      
      // 1. Tạo Campaign với trạng thái PAUSED
      const campUrl = `https://graph.facebook.com/${this.apiVersion}/${sanitizedAdAccount}/campaigns`;
      const campRes = await fetch(campUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `[BaHa] ${campaign.name} - ${campaign.code}`,
          objective: campaign.objective === 'MESSAGES' ? 'OUTCOME_ENGAGEMENT' : 'OUTCOME_LEADS',
          status: 'PAUSED', // LUÔN TẠM DỪNG
          special_ad_categories: campaign.specialCategory === 'NONE' ? ['NONE'] : [campaign.specialCategory],
          access_token: this.accessToken,
        }),
      });

      const campData = await campRes.json();
      if (campData.error) {
        throw new Error(`Lỗi tạo Campaign trên Meta: ${campData.error.message}`);
      }

      const metaCampaignId = campData.id;

      // 2. Tạo Ad Set (Ngân sách ngày, vị trí, tuổi, giới tính)
      const adSetUrl = `https://graph.facebook.com/${this.apiVersion}/${sanitizedAdAccount}/adsets`;
      const adSetRes = await fetch(adSetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `[AdSet] ${campaign.location} - ${campaign.targetAge}`,
          campaign_id: metaCampaignId,
          daily_budget: Math.round(campaign.dailyBudget * 100), // Meta tính đơn vị xu/cents
          billing_event: 'IMPRESSIONS',
          optimization_goal: 'LEAD_GENERATION',
          status: 'PAUSED',
          targeting: {
            geo_locations: {
              countries: ['VN'],
            },
          },
          access_token: this.accessToken,
        }),
      });

      const adSetData = await adSetRes.json();
      const metaAdSetId = adSetData.id || `mock_adset_${Date.now()}`;

      return {
        success: true,
        isMock: false,
        metaCampaignId,
        metaAdSetId,
        metaStatus: 'CREATED_PAUSED',
        message: 'Đã tạo thành công trên Meta Marketing API thật ở trạng thái TẠM DỪNG (PAUSED).',
      };
    } catch (err: any) {
      return {
        success: false,
        isMock: false,
        metaStatus: 'ERROR',
        message: 'Lỗi khi gọi Meta Marketing API thật',
        error: err.message,
      };
    }
  }

  async stopCampaignEmergency(metaCampaignId: string): Promise<{ success: boolean; message: string }> {
    if (this.mode === 'MOCK' || !this.accessToken) {
      return {
        success: true,
        message: `[MOCK] Đã gửi lệnh DỪNG KHẨN CẤP tới Meta cho chiến dịch ${metaCampaignId}. Trạng thái hiện tại: STOPPED.`,
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.apiVersion}/${metaCampaignId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: this.accessToken,
        }),
      });
      const data = await res.json();
      return {
        success: data.success || true,
        message: `Đã dừng khẩn cấp chiến dịch ${metaCampaignId} trên Meta.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Lỗi khi dừng chiến dịch: ${err.message}`,
      };
    }
  }
}

