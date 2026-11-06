import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';
import { getCampaignById, saveCampaign, getConnectedPageById } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      message, 
      imageUrl, 
      linkUrl, 
      scheduledTime, 
      pageId, 
      accessToken, 
      campaignId,
      botToken,
      chatId 
    } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nội dung bài viết không được để trống.' },
        { status: 400 }
      );
    }

    // Tự động tìm Page Access Token trong Database nếu người dùng chỉ truyền pageId
    let effectiveToken = accessToken;
    let pageName = 'Fanpage';

    if (pageId) {
      const pageRecord = getConnectedPageById(pageId);
      if (pageRecord) {
        if (!effectiveToken && pageRecord.pageAccessToken) {
          effectiveToken = pageRecord.pageAccessToken;
        }
        pageName = pageRecord.pageName;
      }
    }

    // Kiểm tra tính hợp lệ của thời gian lên lịch (nếu có)
    let parsedScheduledTime: number | undefined;
    if (scheduledTime) {
      const scheduleDate = new Date(scheduledTime).getTime() / 1000;
      const now = Math.floor(Date.now() / 1000);

      // Meta quy định: Thời gian hẹn giờ phải cách hiện tại từ 10 phút đến 75 ngày
      if (scheduleDate < now + 600) {
        return NextResponse.json(
          { success: false, error: 'Thời gian lên lịch phải cách thời điểm hiện tại ít nhất 10 phút.' },
          { status: 400 }
        );
      }
      if (scheduleDate > now + 75 * 24 * 3600) {
        return NextResponse.json(
          { success: false, error: 'Thời gian lên lịch không được vượt quá 75 ngày.' },
          { status: 400 }
        );
      }
      parsedScheduledTime = Math.floor(scheduleDate);
    }

    const fbService = new FacebookService();
    const result = await fbService.createPost({
      message,
      imageUrl,
      linkUrl,
      scheduledTime: parsedScheduledTime,
      pageId,
      accessToken: effectiveToken,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Nếu có gắn với Campaign trong hệ thống, cập nhật lại dữ liệu
    if (campaignId) {
      const camp = getCampaignById(campaignId);
      if (camp) {
        saveCampaign({
          ...camp,
          status: 'ACTIVE',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Bắn thông báo Telegram thật nếu có token/chatId
    const effectiveTeleToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const effectiveTeleChatId = chatId || process.env.TELEGRAM_CHAT_ID;
    if (effectiveTeleToken && effectiveTeleChatId) {
      try {
        const text = `
📢 *[BAHA ADS] ĐÃ ĐĂNG BÀI LÊN FANPAGE (${pageName})*
━━━━━━━━━━━━━━━━━━━━━━━━━
📌 *Nội dung:* ${message.slice(0, 100)}...
🆔 *Post ID:* \`${result.postId}\`
⚡ *Trạng thái:* ${result.isMock ? 'Mô phỏng chuẩn Meta v21.0' : 'Đã đăng trực tiếp lên Fanpage'}
🌐 *Link bài viết:* ${result.postUrl}
⏰ *Hẹn giờ:* ${parsedScheduledTime ? new Date(parsedScheduledTime * 1000).toLocaleString('vi-VN') : 'Đăng ngay lập tức'}
━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 _Đăng bài tự nhiên (Organic) hoàn toàn 0đ, không phát sinh chi phí quảng cáo._
        `.trim();

        await fetch(`https://api.telegram.org/bot${effectiveTeleToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: effectiveTeleChatId,
            text,
            parse_mode: 'Markdown',
          }),
        });
      } catch (e) {
        console.warn('Lỗi bắn Telegram khi đăng bài:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      postId: result.postId,
      postUrl: result.postUrl,
      isMock: result.isMock,
      pageName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống nội bộ.' },
      { status: 500 }
    );
  }
}
