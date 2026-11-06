import { CampaignData } from '../types';
import { AdsPlatformAdapter, PlatformCampaignResult, PlatformActionResult, PlatformStatusResult } from './types';
import { decryptToken } from '../crypto';

export class MetaAdsAdapter implements AdsPlatformAdapter {
  private adAccountId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor(customConfig?: { adAccountId?: string; accessToken?: string; apiVersion?: string }) {
    this.adAccountId = customConfig?.adAccountId || process.env.META_AD_ACCOUNT_ID || '';
    // Tự động giải mã token nếu được lưu trữ dạng mã hóa
    const rawToken = customConfig?.accessToken || process.env.META_ACCESS_TOKEN || process.env.FB_PAGE_ACCESS_TOKEN || '';
    this.accessToken = decryptToken(rawToken);
    this.apiVersion = customConfig?.apiVersion || process.env.META_GRAPH_VERSION || 'v21.0';
  }

  private mapObjective(obj: string): string {
    switch (obj) {
      case 'LEAD': return 'OUTCOME_LEADS';
      case 'MESSAGES': return 'OUTCOME_ENGAGEMENT';
      case 'TRAFFIC': return 'OUTCOME_TRAFFIC';
      case 'AWARENESS': return 'OUTCOME_AWARENESS';
      default: return 'OUTCOME_ENGAGEMENT';
    }
  }

  private mapOptimizationGoal(obj: string): string {
    switch (obj) {
      case 'LEAD': return 'LEAD_GENERATION';
      case 'MESSAGES': return 'CONVERSATIONS';
      case 'TRAFFIC': return 'LINK_CLICKS';
      default: return 'REACH';
    }
  }

  async createPausedCampaign(input: CampaignData): Promise<PlatformCampaignResult> {
    if (!this.adAccountId || !this.accessToken) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: 'Chưa cấu hình META_AD_ACCOUNT_ID hoặc META_ACCESS_TOKEN trong file .env để kết nối Meta Marketing API thật.',
        errorStep: 'VALIDATION',
      };
    }

    const cleanAccountId = this.adAccountId.startsWith('act_') ? this.adAccountId : `act_${this.adAccountId}`;
    const baseUrl = `https://graph.facebook.com/${this.apiVersion}`;

    try {
      // 1. TẠO CHIẾN DỊCH (CAMPAIGN) Ở TRẠNG THÁI PAUSED
      const campaignPayload = {
        name: `[BAHA] ${input.name} - ${input.code}`,
        objective: this.mapObjective(input.objective),
        status: 'PAUSED', // Quy tắc an toàn bắt buộc của BaHa
        special_ad_categories: input.specialCategory === 'NONE' ? [] : [input.specialCategory],
        access_token: this.accessToken,
      };

      const campRes = await fetch(`${baseUrl}/${cleanAccountId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignPayload),
      });
      const campData = await campRes.json();

      if (!campRes.ok || campData.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          isMock: false,
          error: `Lỗi tạo Campaign trên Meta: ${campData.error?.message || 'Không xác định'}`,
          errorStep: 'CAMPAIGN',
        };
      }
      const platformCampaignId = campData.id;

      // 2. TẠO NHÓM QUẢNG CÁO (AD SET) Ở TRẠNG THÁI PAUSED
      const startDateTime = input.startDate ? new Date(input.startDate).toISOString() : new Date().toISOString();
      const endDateTime = input.endDate 
        ? new Date(input.endDate).toISOString() 
        : new Date(Date.now() + (input.durationDays || 7) * 86400000).toISOString();

      const adSetPayload = {
        name: `${input.name} - AdSet [${input.location}]`,
        campaign_id: platformCampaignId,
        daily_budget: Math.round(Number(input.dailyBudget || 200000)), // Đơn vị VND
        billing_event: 'IMPRESSIONS',
        optimization_goal: this.mapOptimizationGoal(input.objective),
        status: 'PAUSED',
        start_time: startDateTime,
        end_time: endDateTime,
        targeting: {
          geo_locations: {
            countries: ['VN'],
            // Nhắm mục tiêu theo thành phố hoặc vị trí
          },
          age_min: 25,
          age_max: 55,
          genders: input.targetGender === 'FEMALE' ? [2] : input.targetGender === 'MALE' ? [1] : [1, 2],
        },
        access_token: this.accessToken,
      };

      const adSetRes = await fetch(`${baseUrl}/${cleanAccountId}/adsets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adSetPayload),
      });
      const adSetData = await adSetRes.json();

      if (!adSetRes.ok || adSetData.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          platformCampaignId,
          isMock: false,
          error: `Lỗi tạo AdSet trên Meta: ${adSetData.error?.message || 'Không xác định'}`,
          errorStep: 'ADSET',
        };
      }
      const platformAdSetId = adSetData.id;

      // 3. TẠO MẪU QUẢNG CÁO SÁNG TẠO (AD CREATIVE)
      const pageId = process.env.FB_PAGE_ID || '102938475610293';
      const creativePayload = {
        name: `${input.name} - Creative`,
        object_story_spec: {
          page_id: pageId,
          link_data: {
            message: input.primaryText,
            name: input.headline,
            link: 'https://bahagroup.vn',
            picture: input.imageUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
            call_to_action: {
              type: input.callToAction || 'LEARN_MORE',
            },
          },
        },
        access_token: this.accessToken,
      };

      const creativeRes = await fetch(`${baseUrl}/${cleanAccountId}/adcreatives`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload),
      });
      const creativeData = await creativeRes.json();

      if (!creativeRes.ok || creativeData.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          platformCampaignId,
          platformAdSetId,
          isMock: false,
          error: `Lỗi tạo Ad Creative trên Meta: ${creativeData.error?.message || 'Không xác định'}`,
          errorStep: 'CREATIVE',
        };
      }
      const platformCreativeId = creativeData.id;

      // 4. TẠO QUẢNG CÁO (AD) Ở TRẠNG THÁI PAUSED
      const adPayload = {
        name: `${input.name} - Ad`,
        adset_id: platformAdSetId,
        creative: { creative_id: platformCreativeId },
        status: 'PAUSED',
        access_token: this.accessToken,
      };

      const adRes = await fetch(`${baseUrl}/${cleanAccountId}/ads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adPayload),
      });
      const adData = await adRes.json();

      if (!adRes.ok || adData.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          platformCampaignId,
          platformAdSetId,
          platformCreativeId,
          isMock: false,
          error: `Lỗi tạo Ad trên Meta: ${adData.error?.message || 'Không xác định'}`,
          errorStep: 'AD',
        };
      }
      const platformAdId = adData.id;

      return {
        success: true,
        platformCampaignId,
        platformAdSetId,
        platformCreativeId,
        platformAdId,
        status: 'CREATED_PAUSED',
        isMock: false,
        message: 'Đã tạo trọn vẹn Campaign, AdSet, Creative, Ad trên Meta Marketing API thật ở trạng thái TẠM DỪNG an toàn.',
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: `Lỗi mạng khi kết nối Meta: ${err.message}`,
        errorStep: 'NETWORK',
      };
    }
  }

  async activateCampaign(platformCampaignId: string): Promise<PlatformActionResult> {
    if (!this.accessToken) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: 'Thiếu Meta Access Token để kích hoạt chiến dịch.',
      };
    }

    try {
      // 1. Gửi lệnh kích hoạt sang Meta
      const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${platformCampaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: this.accessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          isMock: false,
          error: `Meta từ chối kích hoạt: ${data.error?.message || 'Lỗi không xác định'}`,
        };
      }

      // 2. Đọc lại trạng thái thực tế từ Meta để xác nhận
      const statusRes = await this.getCampaignStatus(platformCampaignId);
      return {
        success: true,
        status: statusRes.status,
        isMock: false,
        message: statusRes.status === 'ACTIVE' 
          ? 'Meta đã xác nhận chiến dịch chuyển sang trạng thái ĐANG CHẠY (ACTIVE)!' 
          : 'Lệnh kích hoạt đã gửi tới Meta, chiến dịch đang trong hàng đợi xét duyệt (PLATFORM_REVIEW).',
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: `Lỗi kết nối Meta khi kích hoạt: ${err.message}`,
      };
    }
  }

  async pauseCampaign(platformCampaignId: string): Promise<PlatformActionResult> {
    if (!this.accessToken) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: 'Thiếu Meta Access Token để gửi lệnh dừng.',
      };
    }

    try {
      const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${platformCampaignId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: this.accessToken,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          isMock: false,
          error: `Lỗi dừng chiến dịch trên Meta: ${data.error?.message}`,
        };
      }

      return {
        success: true,
        status: 'STOPPED',
        isMock: false,
        message: 'Meta xác nhận đã TẠM DỪNG thành công (Dừng phân phối và không trừ tiền).',
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isMock: false,
        error: `Lỗi kết nối khi dừng chiến dịch: ${err.message}`,
      };
    }
  }

  async getCampaignStatus(platformCampaignId: string): Promise<PlatformStatusResult> {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${platformCampaignId}?fields=status,effective_status&access_token=${this.accessToken}`
      );
      const data = await res.json();

      if (!res.ok || data.error) {
        return {
          success: false,
          status: 'INTEGRATION_ERROR',
          isServing: false,
          lastSyncAt: new Date().toISOString(),
          error: data.error?.message,
        };
      }

      const effective = data.effective_status || data.status;
      let finalStatus: CampaignData['status'] = 'CREATED_PAUSED';
      let isServing = false;

      if (effective === 'ACTIVE') {
        finalStatus = 'ACTIVE';
        isServing = true;
      } else if (effective === 'PENDING_REVIEW' || effective === 'IN_PROCESS') {
        finalStatus = 'PLATFORM_REVIEW';
      } else if (effective === 'PAUSED') {
        finalStatus = 'CREATED_PAUSED';
      } else if (effective === 'ARCHIVED' || effective === 'DELETED') {
        finalStatus = 'STOPPED';
      }

      return {
        success: true,
        status: finalStatus,
        effectiveStatus: effective,
        isServing,
        lastSyncAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'INTEGRATION_ERROR',
        isServing: false,
        lastSyncAt: new Date().toISOString(),
        error: err.message,
      };
    }
  }
}

