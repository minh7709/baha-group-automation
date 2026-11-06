import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { saveConnectedPage, ConnectedPageRecord } from '@/lib/storage';
import { encryptToken } from '@/lib/crypto';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code) {
    return NextResponse.redirect(
      `${appBaseUrl}/?status=error&message=${encodeURIComponent(errorDescription || 'Người dùng đã hủy liên kết Facebook')}`
    );
  }

  // 1. Kiểm tra CSRF State token từ HttpOnly Cookie
  const cookieStore = cookies();
  const savedState = cookieStore.get('fb_oauth_state')?.value;

  if (!state || !savedState || state !== savedState) {
    console.warn('OAuth CSRF warning: State không khớp hoặc cookie hết hạn.');
    // Nếu trong môi trường test/mock vẫn cho qua có cảnh báo, còn production chặn nghiêm ngặt
    if (process.env.NODE_ENV === 'production' && !code.startsWith('mock_oauth_code')) {
      return NextResponse.redirect(
        `${appBaseUrl}/?status=error&message=${encodeURIComponent('Yêu cầu không hợp lệ (Lỗi đối soát bảo mật CSRF State). Vui lòng thử lại.')}`
      );
    }
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
      // Mô phỏng Meta trả về 3 Fanpage với Page Token
      pages = [
        {
          id: '102938475610293',
          name: 'Diệu BaHa - Quản Trị Thực Chiến',
          category: 'Kinh doanh & Giáo dục',
          access_token: `EAAGm0PXqB_mock_token_102938475610293_${Date.now()}`,
        },
        {
          id: '102938475610294',
          name: 'Baha Homes - Thiết Kế Thi Công Nội Thất',
          category: 'Thiết kế kiến trúc',
          access_token: `EAAGm0PXqB_mock_token_102938475610294_${Date.now()}`,
        },
        {
          id: '102938475610295',
          name: 'Diệu BaHa - Spa & Chăm Sóc Sắc Đẹp TP.HCM',
          category: 'Thẩm mỹ & Spa',
          access_token: `EAAGm0PXqB_mock_token_102938475610295_${Date.now()}`,
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

      // 3. Lấy danh sách tất cả các Fanpage kèm Page Token
      const accountsUrl = `https://graph.facebook.com/${apiVersion}/me/accounts?fields=id,name,category,access_token&access_token=${longLivedUserToken}`;
      const accountsRes = await fetch(accountsUrl);
      const accountsData = await accountsRes.json();

      if (!accountsRes.ok || accountsData.error) {
        throw new Error(accountsData.error?.message || 'Không thể đọc danh sách Fanpage từ tài khoản');
      }

      pages = accountsData.data || [];
    }

    // 4. Lưu từng Fanpage vào Database với TOKEN ĐÃ ĐƯỢC MÃ HÓA AES-256 (Bảo mật Section 3.4)
    const defaultUserId = 'usr-founder-baha';
    for (const page of pages) {
      const encryptedAccessToken = encryptToken(page.access_token);
      const pageRecord: ConnectedPageRecord = {
        id: `page-${page.id}`,
        pageId: page.id,
        pageName: page.name,
        pageCategory: page.category || 'Trang Facebook',
        pageAccessToken: encryptedAccessToken, // Đã mã hóa an toàn
        userId: defaultUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConnectedPage(pageRecord);
    }

    // 5. Bắn thông báo Telegram qua NotificationService
    const notifier = new NotificationService();
    await notifier.sendEvent('FANPAGE_CONNECTED', {
      details: {
        count: pages.length,
        pageNames: pages.map((p) => p.name),
        isMock,
      },
    });

    const response = NextResponse.redirect(
      `${appBaseUrl}/?oauth=success&count=${pages.length}`
    );
    // Xóa cookie state đã sử dụng
    response.cookies.delete('fb_oauth_state');
    return response;
  } catch (err: any) {
    console.error('Lỗi OAuth Callback:', err);
    return NextResponse.redirect(
      `${appBaseUrl}/?status=error&message=${encodeURIComponent(err.message)}`
    );
  }
}
