import { NextResponse } from 'next/server';
import { saveConnectedPage, ConnectedPageRecord } from '@/lib/storage';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(
      `${appBaseUrl}/?status=error&message=${encodeURIComponent(errorDescription || 'Người dùng đã hủy liên kết Facebook')}`
    );
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI || `${appBaseUrl}/api/auth/facebook/callback`;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

  try {
    let pages: Array<{ id: string; name: string; category?: string; access_token: string }> = [];

    // KIỂM TRA CHẾ ĐỘ THẬT HAY MÔ PHỎNG
    const isMock = code.startsWith('mock_oauth_code') || !appId || !appSecret;

    if (isMock) {
      // Mô phỏng Meta trả về 3 Fanpage với Page Token vĩnh viễn
      pages = [
        {
          id: '102938475610293',
          name: 'Diệu BaHa - Quản Trị Thực Chiến',
          category: 'Kinh doanh & Giáo dục',
          access_token: `EAAGm0PXqB_permanent_token_102938475610293_${Date.now()}`,
        },
        {
          id: '102938475610294',
          name: 'Baha Homes - Thiết Kế Thi Công Nội Thất',
          category: 'Thiết kế kiến trúc',
          access_token: `EAAGm0PXqB_permanent_token_102938475610294_${Date.now()}`,
        },
        {
          id: '102938475610295',
          name: 'Diệu BaHa - Spa & Chăm Sóc Sắc Đẹp TP.HCM',
          category: 'Thẩm mỹ & Spa',
          access_token: `EAAGm0PXqB_permanent_token_102938475610295_${Date.now()}`,
        },
      ];
    } else {
      // 1. Đổi Code lấy Short-Lived User Access Token
      const tokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?` + new URLSearchParams({
        client_id: appId!,
        client_secret: appSecret!,
        redirect_uri: redirectUri,
        code: code,
      }).toString();

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        throw new Error(tokenData.error?.message || 'Không thể đổi mã xác thực Facebook');
      }

      const shortLivedToken = tokenData.access_token;

      // 2. Nâng cấp lên Long-Lived User Access Token (thời hạn 60 ngày)
      const longTokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?` + new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId!,
        client_secret: appSecret!,
        fb_exchange_token: shortLivedToken,
      }).toString();

      const longTokenRes = await fetch(longTokenUrl);
      const longTokenData = await longTokenRes.json();
      const longLivedUserToken = longTokenData.access_token || shortLivedToken;

      // 3. Lấy danh sách tất cả các Fanpage kèm Page Token VĨNH VIỄN
      const accountsUrl = `https://graph.facebook.com/${apiVersion}/me/accounts?fields=id,name,category,access_token&access_token=${longLivedUserToken}`;
      const accountsRes = await fetch(accountsUrl);
      const accountsData = await accountsRes.json();

      if (!accountsRes.ok || accountsData.error) {
        throw new Error(accountsData.error?.message || 'Không thể đọc danh sách Fanpage từ tài khoản');
      }

      pages = accountsData.data || [];
    }

    // 4. Lưu từng Fanpage vào Database theo chuẩn Multi-Tenant
    const defaultUserId = 'usr-founder-baha';
    for (const page of pages) {
      const pageRecord: ConnectedPageRecord = {
        id: `page-${page.id}`,
        pageId: page.id,
        pageName: page.name,
        pageCategory: page.category || 'Trang Facebook',
        pageAccessToken: page.access_token,
        userId: defaultUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConnectedPage(pageRecord);
    }

    // 5. Bắn thông báo Telegram thật nếu có cấu hình
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      try {
        const text = `
🔗 *[BAHA ADS] LIÊN KẾT FACEBOOK OAUTH THÀNH CÔNG!*
━━━━━━━━━━━━━━━━━━━━━━━━━
👥 *Số lượng Fanpage đã kết nối:* ${pages.length} trang
📌 *Danh sách trang:*
${pages.map((p) => `• *${p.name}* (\`${p.id}\`)`).join('\n')}
⚡ *Chế độ:* ${isMock ? 'Mô phỏng chuẩn Meta OAuth 2.0' : 'Meta OAuth thật (Production)'}
━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 _Người dùng đã sẵn sàng đăng bài và chạy quảng cáo trực tiếp!_
        `.trim();

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'Markdown',
          }),
        });
      } catch (e) {
        console.warn('Lỗi gửi Telegram khi OAuth:', e);
      }
    }

    return NextResponse.redirect(
      `${appBaseUrl}/?oauth=success&count=${pages.length}`
    );
  } catch (err: any) {
    console.error('Lỗi OAuth Callback:', err);
    return NextResponse.redirect(
      `${appBaseUrl}/?status=error&message=${encodeURIComponent(err.message)}`
    );
  }
}

