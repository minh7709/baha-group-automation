import { CampaignData } from '../types';

export type NotificationEvent =
  | 'CAMPAIGN_DRAFT_SAVED'
  | 'CAMPAIGN_APPROVED'
  | 'CAMPAIGN_CREATED_PAUSED'
  | 'CAMPAIGN_ACTIVATED'
  | 'CAMPAIGN_STOPPED'
  | 'FANPAGE_CONNECTED'
  | 'FANPAGE_POST_PUBLISHED'
  | 'INTEGRATION_ERROR';

export interface NotificationResult {
  success: boolean;
  messageId?: number;
  error?: string;
  chatTitle?: string;
}

// Bộ nhớ đệm chống gửi trùng thông báo trong vòng 30 giây (Idempotency)
const sentCache = new Map<string, number>();

export class NotificationService {
  private botToken: string;
  private chatId: string;

  constructor(customConfig?: { botToken?: string; chatId?: string }) {
    this.botToken = customConfig?.botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = customConfig?.chatId || process.env.TELEGRAM_CHAT_ID || '';
  }

  private isDuplicate(idempotencyKey: string): boolean {
    const now = Date.now();
    const lastSent = sentCache.get(idempotencyKey);
    if (lastSent && now - lastSent < 30000) {
      return true;
    }
    sentCache.set(idempotencyKey, now);
    return false;
  }

  async sendEvent(
    event: NotificationEvent,
    payload: {
      campaign?: Partial<CampaignData>;
      details?: Record<string, any>;
      errorMessage?: string;
      customMessage?: string;
    }
  ): Promise<NotificationResult> {
    if (!this.botToken || !this.chatId) {
      console.warn('NotificationService: Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID.');
      return {
        success: false,
        error: 'Chưa cấu hình Telegram Bot Token hoặc Chat ID.',
      };
    }

    const { campaign, details, errorMessage, customMessage } = payload;
    const idempotencyKey = `${event}_${campaign?.id || campaign?.code || 'global'}_${Date.now() - (Date.now() % 5000)}`;

    if (this.isDuplicate(idempotencyKey)) {
      return { success: true, error: 'Bỏ qua tin nhắn trùng lặp (Idempotency).' };
    }

    const dailyBudgetVND = Number(campaign?.dailyBudget || 0).toLocaleString('vi-VN');
    const totalBudgetVND = Number(campaign?.totalBudget || 0).toLocaleString('vi-VN');
    const maxSpendVND = Number(campaign?.maxEstimatedSpend || 0).toLocaleString('vi-VN');
    const isMock = campaign?.isMock !== undefined ? campaign.isMock : true;
    const modeLabel = isMock ? 'MÔ PHỎNG (MOCK)' : 'THẬT (PRODUCTION)';

    let title = '📢 [BAHA ADS] THÔNG BÁO HỆ THỐNG';
    let body = '';

    switch (event) {
      case 'CAMPAIGN_APPROVED':
        title = '🛡 *[BAHA ADS] PHÊ DUYỆT NỘI BỘ THÀNH CÔNG*';
        body = `
🆔 *Mã chiến dịch:* \`${campaign?.code}\`
📌 *Dịch vụ/SP:* *${campaign?.name}*
📝 *Mã duyệt Founder:* \`${campaign?.approvalCode}\`
👤 *Người duyệt:* ${campaign?.approvedBy || 'Founder'}
💰 *Ngân sách ngày:* *${dailyBudgetVND} ₫/ngày* (${campaign?.durationDays || 7} ngày)
💵 *Tổng ngân sách:* *${totalBudgetVND} ₫* (Trần an toàn: ${maxSpendVND} ₫)
⚡ *Trạng thái:* *ĐÃ DUYỆT NỘI BỘ (Chưa tạo trên Meta)*
        `.trim();
        break;

      case 'CAMPAIGN_CREATED_PAUSED':
        title = '🔒 *[BAHA ADS] ĐÃ TẠO TRÊN META (TẠM DỪNG)*';
        body = `
🆔 *Mã chiến dịch:* \`${campaign?.code}\`
📌 *Dịch vụ/SP:* *${campaign?.name}*
🎯 *Mục tiêu:* ${campaign?.objectiveText || campaign?.objective}
💰 *Ngân sách ngày:* *${dailyBudgetVND} ₫/ngày* (${campaign?.durationDays || 7} ngày)
💵 *Tổng dự kiến:* *${totalBudgetVND} ₫*
🌐 *Môi trường:* *${modeLabel}*
🆔 *Meta Campaign ID:* \`${campaign?.metaCampaignId || details?.platformCampaignId || 'Chưa cấp'}\`
🆔 *Meta AdSet ID:* \`${campaign?.metaAdSetId || details?.platformAdSetId || 'Chưa cấp'}\`
🆔 *Meta Creative ID:* \`${campaign?.metaCreativeId || details?.platformCreativeId || 'Chưa cấp'}\`
🆔 *Meta Ad ID:* \`${campaign?.metaAdId || details?.platformAdId || 'Chưa cấp'}\`
⚡ *Trạng thái:* *TẠM DỪNG (PAUSED)*
🛡 _Chưa bật chạy, chưa phân phối, chưa phát sinh chi phí tiền thật._
        `.trim();
        break;

      case 'CAMPAIGN_ACTIVATED':
        title = '🚀 *[BAHA ADS] ĐÃ KÍCH HOẠT QUẢNG CÁO META*';
        body = `
🆔 *Mã chiến dịch:* \`${campaign?.code}\`
📌 *Dịch vụ/SP:* *${campaign?.name}*
🌐 *Môi trường:* *${modeLabel}*
🆔 *Meta Campaign ID:* \`${campaign?.metaCampaignId}\`
⚡ *Trạng thái:* *${campaign?.status === 'SIMULATED_ACTIVE' ? 'MÔ PHỎNG ĐANG CHẠY (SIMULATED_ACTIVE)' : 'ĐANG CHẠY THẬT (ACTIVE)'}*
💰 *Ngân sách ngày:* *${dailyBudgetVND} ₫/ngày*
🛑 *Nút dừng khẩn cấp:* Thường trực 24/7 trên Dashboard
        `.trim();
        break;

      case 'CAMPAIGN_STOPPED':
        title = '🛑 *[BAHA ADS] ĐÃ DỪNG KHẨN CẤP QUẢNG CÁO*';
        body = `
🆔 *Mã chiến dịch:* \`${campaign?.code}\`
📌 *Dịch vụ/SP:* *${campaign?.name}*
🌐 *Môi trường:* *${modeLabel}*
⚡ *Trạng thái:* *ĐÃ DỪNG (STOPPED)*
🔒 _Lệnh dừng đã gửi tới Meta, quảng cáo ngừng phân phối ngay lập tức._
        `.trim();
        break;

      case 'FANPAGE_CONNECTED':
        title = '🔗 *[BAHA ADS] LIÊN KẾT FACEBOOK OAUTH THÀNH CÔNG*';
        body = `
👥 *Số Fanpage đã nạp:* ${details?.count || 1} trang
📌 *Danh sách trang:* ${details?.pageNames ? details.pageNames.join(', ') : 'Đã nạp'}
🌐 *Chế độ:* ${isMock ? 'Mô phỏng chuẩn Meta OAuth 2.0' : 'Meta OAuth thật (Production)'}
🎉 _Người dùng đã sẵn sàng đăng bài và gắn quảng cáo vào Fanpage._
        `.trim();
        break;

      case 'FANPAGE_POST_PUBLISHED':
        title = '📢 *[BAHA ADS] ĐÃ ĐĂNG BÀI LÊN FANPAGE (0Đ)*';
        body = `
📌 *Nội dung:* ${details?.message ? details.message.slice(0, 100) + '...' : ''}
🆔 *Post ID:* \`${details?.postId || 'N/A'}\`
🌐 *Link bài viết:* ${details?.postUrl || 'N/A'}
⏰ *Thời gian:* ${details?.scheduledTime ? `Lên lịch lúc ${new Date(details.scheduledTime * 1000).toLocaleString('vi-VN')}` : 'Đăng ngay lập tức'}
⚡ *Trạng thái:* ${details?.isMock ? 'Mô phỏng chuẩn Meta Graph API v21.0' : 'Đã đăng trực tiếp lên Fanpage'}
        `.trim();
        break;

      case 'INTEGRATION_ERROR':
        title = '⚠️ *[BAHA ADS] CẢNH BÁO LỖI TÍCH HỢP META API*';
        body = `
🆔 *Mã chiến dịch:* \`${campaign?.code || 'N/A'}\`
📌 *Dịch vụ/SP:* *${campaign?.name || 'N/A'}*
❌ *Bước lỗi:* ${details?.errorStep || 'GỌI API'}
❗ *Chi tiết lỗi:* \`${errorMessage || 'Lỗi không xác định'}\`
🛡 _Hệ thống đã khóa trạng thái an toàn, không tự động chuyển Active._
        `.trim();
        break;

      default:
        body = customMessage || 'Có cập nhật mới từ hệ thống BaHa Ads.';
    }

    const fullText = `
${title}
━━━━━━━━━━━━━━━━━━━━━━━━━
${body}
━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: fullText,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      if (data.ok) {
        return {
          success: true,
          messageId: data.result?.message_id,
          chatTitle: data.result?.chat?.title || data.result?.chat?.first_name,
        };
      } else {
        console.error(`Telegram API error [${data.error_code}]: ${data.description}`);
        return {
          success: false,
          error: `Telegram phản hồi lỗi: ${data.description} (Mã: ${data.error_code})`,
        };
      }
    } catch (err: any) {
      console.error('Telegram network error:', err.message);
      return {
        success: false,
        error: `Lỗi kết nối tới Telegram: ${err.message}`,
      };
    }
  }
}

