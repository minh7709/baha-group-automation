export type CampaignObjective = 'LEAD' | 'MESSAGES' | 'TRAFFIC' | 'AWARENESS' | 'SALES';

export type CampaignStatus = 
  | 'DRAFT'              // Bản nháp chưa duyệt
  | 'PENDING_APPROVAL'  // Đang chờ duyệt nội bộ
  | 'APPROVED_INTERNAL'  // Đã duyệt nội bộ (sinh mã BH-APR-...)
  | 'CREATED_PAUSED'    // Đã tạo trên Meta ở trạng thái TẠM DỪNG (an toàn tài chính)
  | 'ACTIVE'            // Đang chạy thực tế (sau khi qua gate bắt đầu chạy)
  | 'STOPPED';          // Đã dừng khẩn cấp / kết thúc

export interface CampaignData {
  id: string;
  code: string;               // VD: BaHa-ADS-20261103-141219-3YRZ
  name: string;               // Tên sản phẩm / dịch vụ
  description: string;        // Mô tả ngắn
  imageUrl?: string;          // Ảnh sản phẩm / banner

  // Bước 2: Mục tiêu
  objective: CampaignObjective;
  objectiveText: string;      // "Khách để lại thông tin", "Khách nhắn tin tư vấn"...
  specialCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT'; // Danh mục đặc biệt

  // Bước 3: Đối tượng & Vị trí
  location: string;           // TP.Hồ Chí Minh, Hà Nội...
  radiusKm: number;           // Bán kính km
  targetAge: string;          // VD: "25 - 45"
  targetGender: 'ALL' | 'FEMALE' | 'MALE';
  targetInterests: string[];  // ['Làm đẹp', 'Spa', 'Chăm sóc da']

  // Bước 4: Ngân sách & Thời gian
  dailyBudget: number;        // VNĐ / ngày (VD: 200.000)
  durationDays: number;       // Số ngày (VD: 7)
  totalBudget: number;        // dailyBudget * durationDays
  maxEstimatedSpend: number;  // totalBudget * 1.25 (Dự phòng an toàn)
  startDate: string;
  endDate: string;

  // Bước 5: Nội dung sáng tạo (AI Copy & Creative)
  headline: string;
  primaryText: string;
  callToAction: string;       // "SEND_MESSAGE", "GET_OFFER", "LEARN_MORE"
  pageName: string;           // Tên Fanpage đại diện

  // Bước 7: Phê duyệt nội bộ & An toàn
  status: CampaignStatus;
  version: number;
  approvalCode?: string;      // BH-APR-20261103-0001
  fingerprint?: string;       // a651ab1de86479ab
  approvedBy?: string;        // "Founder"
  approvedAt?: string;

  // Bước 8: Meta Identifiers & Telegram
  metaCampaignId?: string;
  metaAdSetId?: string;
  metaCreativeId?: string;
  metaAdId?: string;
  isMock: boolean;
  telegramSent: boolean;
  telegramSentAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
}

export interface SystemSafetySettings {
  maxDailyBudget: number;     // Trần ngày: 500.000đ
  maxReservedSpend: number;   // Trần cứng: 2.000.000đ
  maxDurationDays: number;    // Trần lịch: 14 ngày
  globalWriteLock: boolean;   // Khóa ghi toàn cục: true
  metaApiMode: 'MOCK' | 'REAL';
}

