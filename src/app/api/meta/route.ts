import { NextResponse } from 'next/server';
import { MetaAdsService } from '@/lib/meta';
import { getCampaignById, saveCampaign } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, campaignId, mode = 'MOCK', accessToken, adAccountId } = body;

    const metaService = new MetaAdsService(mode, accessToken, adAccountId);

    if (action === 'stop') {
      const { metaCampaignId } = body;
      const result = await metaService.stopCampaignEmergency(metaCampaignId);
      if (campaignId) {
        const existing = getCampaignById(campaignId);
        if (existing) {
          saveCampaign({ ...existing, status: 'STOPPED' });
        }
      }
      return NextResponse.json(result);
    }

    // Tạo chiến dịch trên Meta (mặc định PAUSED)
    let campaign = body.campaign;
    if (campaignId) {
      campaign = getCampaignById(campaignId);
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch' }, { status: 400 });
    }

    const result = await metaService.createCampaignSafe(campaign);

    if (result.success && campaign.id) {
      const existing = getCampaignById(campaign.id);
      if (existing) {
        saveCampaign({
          ...existing,
          status: 'CREATED_PAUSED',
          metaCampaignId: result.metaCampaignId,
          metaAdSetId: result.metaAdSetId,
          metaCreativeId: result.metaCreativeId,
          metaAdId: result.metaAdId,
          isMock: result.isMock,
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

