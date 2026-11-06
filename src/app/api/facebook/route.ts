import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';
import { getCampaignById, saveCampaign, getConnectedPageById } from '@/lib/storage';
import { decryptToken } from '@/lib/crypto';
import { NotificationService } from '@/lib/notifications/notification-service';

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
          effectiveToken = decryptToken(pageRecord.pageAccessToken);
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

    // Bắn thông báo Telegram an toàn qua NotificationService
    const notifier = new NotificationService({ botToken, chatId });
    await notifier.sendEvent('FANPAGE_POST_PUBLISHED', {
      details: {
        message,
        postId: result.postId,
        postUrl: result.postUrl,
        scheduledTime: parsedScheduledTime,
        isMock: result.isMock,
        pageName,
      },
    });

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
