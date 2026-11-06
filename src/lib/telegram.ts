import { CampaignData } from './types';

export interface TelegramSendResult {
  success: boolean;
  message?: string;
  error?: string;
  chatTitle?: string;
}

export async function sendTelegramNotification(
  campaign: Partial<CampaignData>,
  customConfig?: { botToken?: string; chatId?: string }
): Promise<TelegramSendResult> {
  const token = customConfig?.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customConfig?.chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      success: false,
      error: "Chưa cấu hình Telegram Bot Token hoặc Chat ID. Vui lòng bấm 'Cấu hình Telegram' trên giao diện.",
    };
  }

  const dailyBudgetVND = Number(campaign.dailyBudget || 0).toLocaleString('vi-VN');
  const totalBudgetVND = Number(campaign.totalBudget || 0).toLocaleString('vi-VN');
  const maxSpendVND = Number(campaign.maxEstimatedSpend || 0).toLocaleString('vi-VN');

  const text = `
🚀 *[BAHA ADS] THÔNG BÁO CHIẾN DỊCH QUẢNG CÁO MỚI*
━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Mã yêu cầu:* \`${campaign.code || 'BẢN NHÁP'}\`
📌 *Tên dịch vụ/SP:* *${campaign.name || 'Chưa đặt tên'}*
🎯 *Mục tiêu:* ${campaign.objectiveText || campaign.objective || 'Mặc định'}
📍 *Địa bàn:* ${campaign.location || 'Toàn quốc'} (Bán kính: ${campaign.radiusKm || 0} km)
👥 *Đối tượng:* ${campaign.targetAge || '25-45'} tuổi • ${campaign.targetGender === 'FEMALE' ? 'Nữ' : campaign.targetGender === 'MALE' ? 'Nam' : 'Tất cả'}
💰 *Ngân sách ngày:* *${dailyBudgetVND} ₫ / ngày*
⏱ *Thời gian:* ${campaign.durationDays || 7} ngày (${campaign.startDate || 'Ngay'} ➔ ${campaign.endDate || '7 ngày sau'})
💵 *Tổng dự kiến:* *${totalBudgetVND} ₫* (Dự phòng trần: ${maxSpendVND} ₫)
📝 *Mã duyệt nội bộ:* \`${campaign.approvalCode || 'CHƯA DUYỆT'}\`
⚡ *Trạng thái:* *${campaign.status || 'CREATED_PAUSED'}* (Meta: PAUSED)
━━━━━━━━━━━━━━━━━━━━━━━━━
🛡 *Chế độ an toàn tài chính BAHA:* ĐÃ BẬT
🔒 *Khóa ghi toàn cục:* ON | *Tự động trừ tiền:* KHÔNG (Luôn Tạm Dừng)
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();
    if (data.ok) {
      return {
        success: true,
        message: "Đã gửi thông báo Telegram THẬT thành công!",
        chatTitle: data.result?.chat?.title || data.result?.chat?.first_name || 'Cá nhân',
      };
    } else {
      return {
        success: false,
        error: `Telegram API phản hồi lỗi: ${data.description || 'Không xác định'} (Mã lỗi: ${data.error_code})`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi kết nối mạng tới Telegram: ${err.message}`,
    };
  }
}

export async function testTelegramConnection(botToken: string, chatId: string): Promise<TelegramSendResult> {
  const testText = `
🔔 *[BAHA ADS] KIỂM TRA KẾT NỐI BOT THÀNH CÔNG!*
━━━━━━━━━━━━━━━━━━━━━━━━━
Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
Trạng thái: Bot sẵn sàng nhận thông báo chiến dịch quảng cáo trả phí.
  `.trim();

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: testText,
        parse_mode: 'Markdown',
      }),
    });
    const data = await response.json();
    if (data.ok) {
      return {
        success: true,
        message: "Kết nối thành công! Đã gửi tin nhắn test tới Telegram của bạn.",
        chatTitle: data.result?.chat?.title || data.result?.chat?.first_name,
      };
    }
    return {
      success: false,
      error: `Không thể gửi tin nhắn: ${data.description}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Không kết nối được: ${err.message}`,
    };
  }
}

