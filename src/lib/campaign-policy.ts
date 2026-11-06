import { CampaignData, CampaignStatus } from './types';

export interface PolicyValidationResult {
  isValid: boolean;
  errors: string[];
}

export const CAMPAIGN_SAFETY_LIMITS = {
  MAX_DAILY_BUDGET: 500000,          // Ngân sách ngày tối đa: 500.000 ₫
  MAX_RESERVED_SPEND: 2000000,       // Mức chi dự phòng trần cứng: 2.000.000 ₫
  MAX_DURATION_DAYS: 14,             // Lịch chạy tối đa: 14 ngày
  MIN_DAILY_BUDGET: 50000,           // Tối thiểu theo quy định Meta: ~50.000 ₫
  MIN_DURATION_DAYS: 1,
  RESERVE_FACTOR: 1.25,
};

/**
 * Kiểm tra tính hợp lệ về ngân sách và an toàn tài chính
 */
export function validateCampaignFinancials(campaign: Partial<CampaignData>): PolicyValidationResult {
  const errors: string[] = [];

  const dailyBudget = Number(campaign.dailyBudget || 0);
  const durationDays = Number(campaign.durationDays || 0);
  const totalBudget = dailyBudget * durationDays;
  const maxEstimatedSpend = totalBudget * CAMPAIGN_SAFETY_LIMITS.RESERVE_FACTOR;

  if (dailyBudget <= 0) {
    errors.push('Ngân sách mỗi ngày phải lớn hơn 0 ₫.');
  } else if (dailyBudget > CAMPAIGN_SAFETY_LIMITS.MAX_DAILY_BUDGET) {
    errors.push(`Ngân sách ngày (${dailyBudget.toLocaleString('vi-VN')} ₫) vượt quá giới hạn an toàn BaHa (${CAMPAIGN_SAFETY_LIMITS.MAX_DAILY_BUDGET.toLocaleString('vi-VN')} ₫/ngày).`);
  }

  if (durationDays < CAMPAIGN_SAFETY_LIMITS.MIN_DURATION_DAYS) {
    errors.push('Thời gian chạy quảng cáo tối thiểu là 1 ngày.');
  } else if (durationDays > CAMPAIGN_SAFETY_LIMITS.MAX_DURATION_DAYS) {
    errors.push(`Thời gian chạy quảng cáo (${durationDays} ngày) vượt quá trần cho phép (${CAMPAIGN_SAFETY_LIMITS.MAX_DURATION_DAYS} ngày).`);
  }

  if (maxEstimatedSpend > CAMPAIGN_SAFETY_LIMITS.MAX_RESERVED_SPEND) {
    errors.push(`Mức chi dự phòng trần cứng (${maxEstimatedSpend.toLocaleString('vi-VN')} ₫) vượt quá trần bảo vệ BaHa (${CAMPAIGN_SAFETY_LIMITS.MAX_RESERVED_SPEND.toLocaleString('vi-VN')} ₫). Hãy giảm ngân sách ngày hoặc số ngày chạy.`);
  }

  if (campaign.startDate && campaign.endDate) {
    const start = new Date(campaign.startDate).getTime();
    const end = new Date(campaign.endDate).getTime();
    if (isNaN(start) || isNaN(end)) {
      errors.push('Định dạng ngày bắt đầu hoặc kết thúc không hợp lệ.');
    } else if (start >= end) {
      errors.push('Ngày kết thúc phải sau ngày bắt đầu.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kiểm tra các trường dữ liệu bắt buộc trước khi phê duyệt / tạo trên Meta
 */
export function validateCampaignRequiredFields(campaign: Partial<CampaignData>): PolicyValidationResult {
  const errors: string[] = [];

  if (!campaign.name || campaign.name.trim() === '' || campaign.name === 'Chiến dịch chưa đặt tên') {
    errors.push('Tên sản phẩm/dịch vụ không được để trống.');
  }

  if (!campaign.objective) {
    errors.push('Mục tiêu chiến dịch Meta bắt buộc phải chọn.');
  }

  if (!campaign.location || campaign.location.trim() === '') {
    errors.push('Khu vực nhắm mục tiêu không được để trống.');
  }

  if (!campaign.headline || campaign.headline.trim() === '') {
    errors.push('Tiêu đề quảng cáo (Headline) không được để trống.');
  }

  if (!campaign.primaryText || campaign.primaryText.trim() === '') {
    errors.push('Nội dung quảng cáo (Primary text) không được để trống.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Kiểm tra máy trạng thái (State Machine): Ngăn chặn việc chuyển trạng thái tùy tiện từ Client
 */
export function validateStateTransition(
  currentStatus: CampaignStatus,
  targetStatus: CampaignStatus,
  context?: { hasMetaConfirmation?: boolean; hasInternalApproval?: boolean }
): { allowed: boolean; reason?: string } {
  // Trạng thái giống nhau cho phép giữ nguyên
  if (currentStatus === targetStatus) return { allowed: true };

  // Dừng khẩn cấp luôn luôn được cho phép từ bất kỳ trạng thái nào
  if (targetStatus === 'STOPPED') {
    return { allowed: true };
  }

  // Báo lỗi tích hợp luôn được phép gán khi có sự cố API
  if (targetStatus === 'INTEGRATION_ERROR') {
    return { allowed: true };
  }

  switch (currentStatus) {
    case 'DRAFT':
      if (targetStatus === 'PENDING_APPROVAL' || targetStatus === 'APPROVED_INTERNAL') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Bản nháp phải được duyệt nội bộ trước khi thực hiện các bước tiếp theo.' };

    case 'PENDING_APPROVAL':
      if (targetStatus === 'APPROVED_INTERNAL' || targetStatus === 'DRAFT') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Chiến dịch đang chờ duyệt chỉ có thể chuyển sang Đã duyệt hoặc quay lại Bản nháp.' };

    case 'APPROVED_INTERNAL':
      if (targetStatus === 'PLATFORM_CREATING' || targetStatus === 'CREATED_PAUSED' || targetStatus === 'DRAFT') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Chiến dịch đã duyệt chỉ có thể gửi lên Meta (ở trạng thái Tạm dừng).' };

    case 'PLATFORM_CREATING':
      if (targetStatus === 'CREATED_PAUSED') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Đang tạo trên Meta, chỉ có thể chuyển sang Tạm dừng thành công hoặc Lỗi tích hợp.' };

    case 'CREATED_PAUSED':
      if (targetStatus === 'ACTIVATION_REQUESTED' || targetStatus === 'ACTIVE' || targetStatus === 'SIMULATED_ACTIVE' || targetStatus === 'PLATFORM_REVIEW') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Từ trạng thái Tạo tạm dừng chỉ có thể kích hoạt qua cổng Pilot Gate.' };

    case 'ACTIVATION_REQUESTED':
      if (targetStatus === 'ACTIVE' || targetStatus === 'SIMULATED_ACTIVE' || targetStatus === 'PLATFORM_REVIEW') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Đang đợi Meta xác nhận kích hoạt.' };

    case 'ACTIVE':
    case 'SIMULATED_ACTIVE':
    case 'PLATFORM_REVIEW':
      if (targetStatus === 'CREATED_PAUSED') {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Chiến dịch đang hoạt động chỉ có thể tạm dừng hoặc dừng hẳn.' };

    case 'STOPPED':
      return { allowed: false, reason: 'Chiến dịch đã dừng không thể kích hoạt lại tùy tiện, hãy tạo bản sao mới.' };

    case 'INTEGRATION_ERROR':
      if (targetStatus === 'APPROVED_INTERNAL' || targetStatus === 'DRAFT' || targetStatus === 'PLATFORM_CREATING') {
        return { allowed: true }; // Cho phép thử lại
      }
      return { allowed: false, reason: 'Chiến dịch lỗi cần được kiểm tra lại trước khi gửi lệnh mới.' };

    default:
      return { allowed: false, reason: `Không cho phép chuyển trạng thái từ ${currentStatus} sang ${targetStatus}.` };
  }
}

/**
 * Loại bỏ các trường hệ thống mà client không được tự ý sửa đổi khi gửi dữ liệu lên
 */
export function sanitizeClientCampaignInput(rawInput: any): Partial<CampaignData> {
  const allowed = { ...rawInput };

  // Xóa các trường hệ thống nếu người dùng thông thường gửi lên
  delete allowed.approvalCode;
  delete allowed.fingerprint;
  delete allowed.approvedBy;
  delete allowed.approvedAt;
  delete allowed.metaCampaignId;
  delete allowed.metaAdSetId;
  delete allowed.metaCreativeId;
  delete allowed.metaAdId;
  delete allowed.telegramSent;
  delete allowed.telegramSentAt;
  delete allowed.isMock;

  return allowed;
}

