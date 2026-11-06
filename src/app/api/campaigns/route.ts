import { NextResponse } from 'next/server';
import { getAllCampaigns, saveCampaign } from '@/lib/storage';
import { CampaignData } from '@/lib/types';
import { validateCampaignFinancials, validateStateTransition, CAMPAIGN_SAFETY_LIMITS } from '@/lib/campaign-policy';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET() {
  try {
    const campaigns = getAllCampaigns();
    
    // Thống kê chính xác theo chuẩn BaHa Header (Phân biệt rõ Real và Simulated)
    const stats = {
      running: campaigns.filter(c => c.status === 'ACTIVE' || c.status === 'SIMULATED_ACTIVE').length,
      drafts: campaigns.filter(c => c.status === 'DRAFT').length,
      pending: campaigns.filter(c => c.status === 'PENDING_APPROVAL').length,
      needsFix: campaigns.filter(c => c.status === 'INTEGRATION_ERROR').length,
      created: campaigns.filter(c => c.status === 'CREATED_PAUSED' || c.status === 'ACTIVE' || c.status === 'SIMULATED_ACTIVE').length,
    };

    return NextResponse.json({ success: true, campaigns, stats });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Partial<CampaignData> = await req.json();

    // 1. KIỂM SOÁT NGÂN SÁCH & AN TOÀN TÀI CHÍNH (P0 Requirement)
    const finValidation = validateCampaignFinancials(body);
    if (!finValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: finValidation.errors.join(' '),
      }, { status: 400 });
    }

    // 2. CHẶN CLIENT TỰ GÁN TRẠNG THÁI ACTIVE HOẶC CREATED_PAUSED TÙY TIỆN
    let initialStatus = body.status || 'DRAFT';
    if (initialStatus === 'ACTIVE' || initialStatus === 'SIMULATED_ACTIVE' || initialStatus === 'CREATED_PAUSED') {
      return NextResponse.json({
        success: false,
        error: 'Chính sách an toàn BaHa: Không thể tạo mới chiến dịch trực tiếp ở trạng thái Active hoặc Created Paused. Phải trải qua luồng duyệt và tạo trên Meta.',
      }, { status: 400 });
    }

    // Sinh mã chiến dịch chuẩn BaHa: BaHa-ADS-YYYYMMDD-HHMMSS-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedCode = `BaHa-ADS-${dateStr}-${timeStr}-${randomSuffix}`;

    const campaignId = body.id || `camp-${Date.now()}`;
    const code = body.code || generatedCode;

    const dailyBudget = Number(body.dailyBudget || 200000);
    const durationDays = Number(body.durationDays || 7);
    const totalBudget = dailyBudget * durationDays;
    const maxEstimatedSpend = totalBudget * CAMPAIGN_SAFETY_LIMITS.RESERVE_FACTOR;

    const fullCampaign: CampaignData = {
      id: campaignId,
      code,
      name: body.name || 'Chiến dịch chưa đặt tên',
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
      objective: body.objective || 'MESSAGES',
      objectiveText: body.objectiveText || 'Có thêm khách hàng liên hệ tư vấn',
      specialCategory: body.specialCategory || 'NONE',
      location: body.location || 'TP.Hồ Chí Minh',
      radiusKm: Number(body.radiusKm || 15),
      targetAge: body.targetAge || '25 - 45',
      targetGender: body.targetGender || 'FEMALE',
      targetInterests: body.targetInterests || ['Chăm sóc sắc đẹp', 'Spa'],
      dailyBudget,
      durationDays,
      totalBudget,
      maxEstimatedSpend,
      startDate: body.startDate || now.toISOString().slice(0, 10),
      endDate: body.endDate || new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      headline: body.headline || 'Ưu Đãi Đặc Biệt - Trải Nghiệm Dịch Vụ Đẳng Cấp',
      primaryText: body.primaryText || 'Liên hệ ngay để nhận ưu đãi hấp dẫn dành riêng cho bạn!',
      callToAction: body.callToAction || 'SEND_MESSAGE',
      pageName: body.pageName || 'Diệu BaHa - Quản Trị Thực Chiến',
      status: initialStatus,
      version: body.version || 1,
      approvalCode: body.approvalCode,
      fingerprint: body.fingerprint,
      approvedBy: body.approvedBy,
      approvedAt: body.approvedAt,
      metaCampaignId: undefined, // Xóa id meta tự tạo từ client
      metaAdSetId: undefined,
      metaCreativeId: undefined,
      metaAdId: undefined,
      isMock: body.isMock !== undefined ? body.isMock : true,
      telegramSent: false,
      createdAt: body.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const saved = saveCampaign(fullCampaign);

    // Nếu chiến dịch được tạo ở trạng thái APPROVED_INTERNAL (ví dụ từ bước duyệt nội bộ B7)
    if (saved.status === 'APPROVED_INTERNAL' && saved.approvalCode) {
      const notifier = new NotificationService();
      await notifier.sendEvent('CAMPAIGN_APPROVED', { campaign: saved });
    }

    return NextResponse.json({ success: true, campaign: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
