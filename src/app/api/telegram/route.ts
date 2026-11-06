import { NextResponse } from 'next/server';
import { sendTelegramNotification, testTelegramConnection } from '@/lib/telegram';
import { getCampaignById, saveCampaign } from '@/lib/storage';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, campaignId, botToken, chatId, campaignData } = body;

    if (action === 'test') {
      const result = await testTelegramConnection(
        botToken || process.env.TELEGRAM_BOT_TOKEN,
        chatId || process.env.TELEGRAM_CHAT_ID
      );
      return NextResponse.json(result);
    }

    // Gửi thông báo cho chiến dịch
    let campaign = campaignData;
    if (campaignId) {
      campaign = getCampaignById(campaignId);
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy dữ liệu chiến dịch để gửi' }, { status: 400 });
    }

    const result = await sendTelegramNotification(campaign, { botToken, chatId });

    // Cập nhật trạng thái telegramSent nếu có id
    if (result.success && campaign.id) {
      const existing = getCampaignById(campaign.id);
      if (existing) {
        saveCampaign({
          ...existing,
          telegramSent: true,
          telegramSentAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

