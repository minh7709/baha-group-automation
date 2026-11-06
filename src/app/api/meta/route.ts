import { NextResponse } from 'next/server';
import { getAdsAdapter } from '@/lib/ads';
import { getCampaignById, saveCampaign } from '@/lib/storage';
import { NotificationService } from '@/lib/notifications/notification-service';
import { validateCampaignFinancials, validateCampaignRequiredFields } from '@/lib/campaign-policy';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'create', campaignId, mode = 'MOCK', botToken, chatId } = body;

    const notifier = new NotificationService({ botToken, chatId });
    const adapter = getAdsAdapter(mode);

    // 1. HÀNH ĐỘNG: DỪNG KHẨN CẤP (EMERGENCY KILL SWITCH)
    if (action === 'stop') {
      const targetCampaign = campaignId ? getCampaignById(campaignId) : null;
      const metaId = body.metaCampaignId || targetCampaign?.metaCampaignId;

      if (!metaId) {
        return NextResponse.json({ success: false, error: 'Thiếu Meta Campaign ID để dừng.' }, { status: 400 });
      }

      const pauseResult = await adapter.pauseCampaign(metaId);

      if (targetCampaign) {
        saveCampaign({
          ...targetCampaign,
          status: 'STOPPED',
          updatedAt: new Date().toISOString(),
        });

        // Bắn thông báo Telegram sự kiện dừng
        await notifier.sendEvent('CAMPAIGN_STOPPED', { campaign: targetCampaign });
      }

      return NextResponse.json({
        success: true,
        message: pauseResult.message || 'Đã kích hoạt dừng khẩn cấp thành công!',
        status: 'STOPPED',
      });
    }

    // 2. HÀNH ĐỘNG: KÍCH HOẠT CHIẾN DỊCH (PILOT GATE ACTIVATION)
    if (action === 'activate') {
      const targetCampaign = campaignId ? getCampaignById(campaignId) : null;
      if (!targetCampaign) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch để kích hoạt.' }, { status: 404 });
      }

      if (targetCampaign.status !== 'CREATED_PAUSED') {
        return NextResponse.json({
          success: false,
          error: `Chiến dịch đang ở trạng thái "${targetCampaign.status}". Chỉ chiến dịch đã tạo trên Meta ở trạng thái CREATED_PAUSED mới được kích hoạt qua cổng Pilot.`,
        }, { status: 400 });
      }

      const metaId = targetCampaign.metaCampaignId;
      if (!metaId) {
        return NextResponse.json({ success: false, error: 'Chiến dịch chưa có Meta Campaign ID.' }, { status: 400 });
      }

      // Gọi Adapter để gửi lệnh bật chạy sang Meta
      const activateResult = await adapter.activateCampaign(metaId);

      if (!activateResult.success) {
        // Ghi nhận lỗi và báo Telegram
        saveCampaign({
          ...targetCampaign,
          status: 'INTEGRATION_ERROR',
          lastError: activateResult.error,
          errorStep: 'ACTIVATION',
          updatedAt: new Date().toISOString(),
        });

        await notifier.sendEvent('INTEGRATION_ERROR', {
          campaign: targetCampaign,
          errorMessage: activateResult.error,
          details: { errorStep: 'KÍCH HOẠT CHIẾN DỊCH META' },
        });

        return NextResponse.json({
          success: false,
          error: activateResult.error || 'Lỗi khi kích hoạt trên Meta.',
        }, { status: 500 });
      }

      // Cập nhật trạng thái chuẩn xác (ACTIVE cho thật, SIMULATED_ACTIVE cho mock)
      const updated = saveCampaign({
        ...targetCampaign,
        status: activateResult.status,
        updatedAt: new Date().toISOString(),
      });

      // Bắn thông báo Telegram kích hoạt thành công
      await notifier.sendEvent('CAMPAIGN_ACTIVATED', { campaign: updated });

      return NextResponse.json({
        success: true,
        message: activateResult.message,
        status: activateResult.status,
        isMock: activateResult.isMock,
        campaign: updated,
      });
    }

    // 3. HÀNH ĐỘNG: ĐỒNG BỘ TRẠNG THÁI THỜI GIAN THỰC TỪ META (STATUS SYNC)
    if (action === 'sync') {
      const targetCampaign = campaignId ? getCampaignById(campaignId) : null;
      if (!targetCampaign || !targetCampaign.metaCampaignId) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy Meta Campaign ID để đồng bộ.' }, { status: 400 });
      }

      const syncResult = await adapter.getCampaignStatus(targetCampaign.metaCampaignId);
      if (syncResult.success) {
        const updated = saveCampaign({
          ...targetCampaign,
          status: syncResult.status,
          updatedAt: new Date().toISOString(),
        });
        return NextResponse.json({
          success: true,
          status: syncResult.status,
          effectiveStatus: syncResult.effectiveStatus,
          isServing: syncResult.isServing,
          campaign: updated,
        });
      }
      return NextResponse.json({ success: false, error: syncResult.error }, { status: 500 });
    }

    // 4. HÀNH ĐỘNG: TẠO CHIẾN DỊCH TRÊN META (LUÔN TẠM DỪNG - CREATED_PAUSED)
    let campaign = body.campaign;
    if (campaignId) {
      campaign = getCampaignById(campaignId);
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dữ liệu chiến dịch.' }, { status: 400 });
    }

    // BẢO VỆ CHÍNH SÁCH BẮT BUỘC: Phải được duyệt nội bộ trước khi tạo trên Meta
    if (campaign.status !== 'APPROVED_INTERNAL' && !campaign.approvalCode) {
      return NextResponse.json({
        success: false,
        error: 'Chính sách an toàn BaHa: Chiến dịch bắt buộc phải có Phê duyệt nội bộ (Mã duyệt BH-APR-...) trước khi gửi lên Meta.',
      }, { status: 403 });
    }

    // BẢO VỆ NGÂN SÁCH & TRƯỜNG DỮ LIỆU
    const finValidation = validateCampaignFinancials(campaign);
    if (!finValidation.isValid) {
      return NextResponse.json({ success: false, error: finValidation.errors.join(' ') }, { status: 400 });
    }

    const fieldValidation = validateCampaignRequiredFields(campaign);
    if (!fieldValidation.isValid) {
      return NextResponse.json({ success: false, error: fieldValidation.errors.join(' ') }, { status: 400 });
    }

    // Gọi Adapter tạo đầy đủ 4 tầng đối tượng Meta (Campaign, AdSet, Creative, Ad)
    const result = await adapter.createPausedCampaign(campaign);

    if (!result.success) {
      // Ghi nhận lỗi và KHÔNG gắn nhãn CREATED_PAUSED
      saveCampaign({
        ...campaign,
        status: 'INTEGRATION_ERROR',
        lastError: result.error,
        errorStep: result.errorStep,
        updatedAt: new Date().toISOString(),
      });

      // Báo Telegram về lỗi tích hợp
      await notifier.sendEvent('INTEGRATION_ERROR', {
        campaign,
        errorMessage: result.error,
        details: { errorStep: result.errorStep },
      });

      return NextResponse.json({
        success: false,
        error: result.error,
        errorStep: result.errorStep,
      }, { status: 500 });
    }

    // Lưu lại đầy đủ ID Meta và cập nhật trạng thái CREATED_PAUSED
    const saved = saveCampaign({
      ...campaign,
      status: 'CREATED_PAUSED',
      metaCampaignId: result.platformCampaignId,
      metaAdSetId: result.platformAdSetId,
      metaCreativeId: result.platformCreativeId,
      metaAdId: result.platformAdId,
      isMock: result.isMock,
      telegramSent: true,
      telegramSentAt: new Date().toISOString(),
      lastError: undefined,
      errorStep: undefined,
      updatedAt: new Date().toISOString(),
    });

    // Chỉ bắn thông báo Telegram sau khi Meta xác nhận thành công trọn vẹn
    await notifier.sendEvent('CAMPAIGN_CREATED_PAUSED', {
      campaign: saved,
      details: {
        platformCampaignId: result.platformCampaignId,
        platformAdSetId: result.platformAdSetId,
        platformCreativeId: result.platformCreativeId,
        platformAdId: result.platformAdId,
      },
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      metaCampaignId: result.platformCampaignId,
      metaAdSetId: result.platformAdSetId,
      metaCreativeId: result.platformCreativeId,
      metaAdId: result.platformAdId,
      isMock: result.isMock,
      campaign: saved,
    });
  } catch (error: any) {
    console.error('Lỗi API Meta:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi hệ thống.' }, { status: 500 });
  }
}
