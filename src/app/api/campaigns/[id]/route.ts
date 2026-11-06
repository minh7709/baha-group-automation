import { NextResponse } from 'next/server';
import { getCampaignById, saveCampaign, deleteCampaign } from '@/lib/storage';
import { validateCampaignFinancials, validateStateTransition, CAMPAIGN_SAFETY_LIMITS } from '@/lib/campaign-policy';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const campaign = getCampaignById(params.id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch' }, { status: 404 });
    }
    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = getCampaignById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch' }, { status: 404 });
    }

    const updates = await req.json();

    // 1. KIỂM SOÁT THAY ĐỔI TRẠNG THÁI (State Machine Guardrails)
    if (updates.status && updates.status !== existing.status) {
      // Chặn đổi trạng thái trực tiếp sang ACTIVE / SIMULATED_ACTIVE qua PUT
      if (updates.status === 'ACTIVE' || updates.status === 'SIMULATED_ACTIVE') {
        return NextResponse.json({
          success: false,
          error: 'Chính sách an toàn BaHa: Không thể chuyển trạng thái sang Active trực tiếp qua API cập nhật. Bắt buộc phải thông qua cổng Pilot Gate và được Meta xác nhận.',
        }, { status: 403 });
      }

      // Chặn đổi trạng thái trực tiếp sang CREATED_PAUSED nếu chưa gọi Meta API
      if (updates.status === 'CREATED_PAUSED' && !existing.metaCampaignId && !updates.metaCampaignId) {
        return NextResponse.json({
          success: false,
          error: 'Chính sách an toàn BaHa: Trạng thái CREATED_PAUSED chỉ được cấp sau khi Meta Marketing API tạo thành công và trả về Campaign ID hợp lệ.',
        }, { status: 403 });
      }

      const transition = validateStateTransition(existing.status, updates.status);
      if (!transition.allowed) {
        return NextResponse.json({
          success: false,
          error: transition.reason || 'Chuyển đổi trạng thái không hợp lệ theo quy trình kiểm soát.',
        }, { status: 400 });
      }
    }

    // 2. KIỂM SOÁT NGÂN SÁCH NẾU CÓ THAY ĐỔI
    if (updates.dailyBudget !== undefined || updates.durationDays !== undefined) {
      // Chỉ bản nháp hoặc chờ duyệt mới được sửa đổi ngân sách
      if (existing.status !== 'DRAFT' && existing.status !== 'PENDING_APPROVAL') {
        return NextResponse.json({
          success: false,
          error: 'Không thể chỉnh sửa ngân sách sau khi chiến dịch đã được phê duyệt nội bộ hoặc đã tạo trên Meta.',
        }, { status: 400 });
      }

      const finValidation = validateCampaignFinancials({ ...existing, ...updates });
      if (!finValidation.isValid) {
        return NextResponse.json({
          success: false,
          error: finValidation.errors.join(' '),
        }, { status: 400 });
      }

      const daily = Number(updates.dailyBudget !== undefined ? updates.dailyBudget : existing.dailyBudget);
      const days = Number(updates.durationDays !== undefined ? updates.durationDays : existing.durationDays);
      updates.totalBudget = daily * days;
      updates.maxEstimatedSpend = updates.totalBudget * CAMPAIGN_SAFETY_LIMITS.RESERVE_FACTOR;
    }

    // 3. BẢO VỆ CÁC TRƯỜNG HỆ THỐNG
    delete updates.id;
    delete updates.code;
    delete updates.createdAt;
    // Không cho phép client tự sửa Meta IDs trừ khi đã có
    if (!existing.metaCampaignId) {
      delete updates.metaCampaignId;
      delete updates.metaAdSetId;
      delete updates.metaCreativeId;
      delete updates.metaAdId;
    }

    const updated = saveCampaign({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    // 4. BẮN TELEGRAM THEO SỰ KIỆN DUYỆT HOẶC DỪNG
    const notifier = new NotificationService();
    if (updated.status === 'APPROVED_INTERNAL' && existing.status !== 'APPROVED_INTERNAL') {
      await notifier.sendEvent('CAMPAIGN_APPROVED', { campaign: updated });
    } else if (updated.status === 'STOPPED' && existing.status !== 'STOPPED') {
      await notifier.sendEvent('CAMPAIGN_STOPPED', { campaign: updated });
    }

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const existing = getCampaignById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy chiến dịch để xóa' }, { status: 404 });
    }

    // Không cho phép xóa chiến dịch đang chạy tiền thật mà chưa dừng
    if (existing.status === 'ACTIVE') {
      return NextResponse.json({
        success: false,
        error: 'Chiến dịch đang chạy trên Meta (ACTIVE). Bạn phải nhấn "DỪNG NGAY" trước khi xóa.',
      }, { status: 400 });
    }

    const deleted = deleteCampaign(params.id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
