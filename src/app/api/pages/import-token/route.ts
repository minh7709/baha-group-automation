import { NextResponse } from 'next/server';
import { saveConnectedPage, ConnectedPageRecord } from '@/lib/storage';
import { encryptToken } from '@/lib/crypto';
import { NotificationService } from '@/lib/notifications/notification-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, userId = 'usr-founder-baha' } = body;

    if (!token || typeof token !== 'string' || token.trim().length < 15) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng cung cấp Access Token hợp lệ từ Meta Graph API Explorer (bắt đầu bằng EAA...).',
      }, { status: 400 });
    }

    const cleanToken = token.trim();
    const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

    // 1. Thử gọi /me/accounts để lấy toàn bộ Fanpage mà User quản lý
    const accountsUrl = `https://graph.facebook.com/${apiVersion}/me/accounts?fields=id,name,category,access_token&access_token=${cleanToken}`;
    const res = await fetch(accountsUrl);
    const data = await res.json();

    let importedPages: Array<{ id: string; name: string; category?: string; access_token: string }> = [];

    if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
      importedPages = data.data;
    } else {
      // 2. Nếu User nhập trực tiếp Page Access Token (thay vì User Token), gọi /me để lấy thông tin Trang
      const meUrl = `https://graph.facebook.com/${apiVersion}/me?fields=id,name,category&access_token=${cleanToken}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();

      if (meRes.ok && meData.id) {
        importedPages = [{
          id: meData.id,
          name: meData.name || 'Fanpage Facebook',
          category: meData.category || 'Trang Facebook',
          access_token: cleanToken,
        }];
      } else {
        const errorDetail = data.error?.message || meData.error?.message || 'Token không hợp lệ hoặc đã hết hạn.';
        return NextResponse.json({
          success: false,
          error: `Meta Graph API từ chối token: ${errorDetail}`,
        }, { status: 400 });
      }
    }

    // 3. Mã hóa token và lưu vào Database
    for (const page of importedPages) {
      const pageRecord: ConnectedPageRecord = {
        id: `page-${page.id}`,
        pageId: page.id,
        pageName: page.name,
        pageCategory: page.category || 'Trang Facebook',
        pageAccessToken: encryptToken(page.access_token),
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      saveConnectedPage(pageRecord);
    }

    // 4. Bắn thông báo Telegram
    const notifier = new NotificationService();
    await notifier.sendEvent('FANPAGE_CONNECTED', {
      details: {
        count: importedPages.length,
        pageNames: importedPages.map((p) => p.name),
        isMock: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã nhập và kết nối thành công ${importedPages.length} Fanpage thật từ Meta Graph API Explorer!`,
      count: importedPages.length,
      pages: importedPages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
      })),
    });
  } catch (error: any) {
    console.error('Lỗi import token:', error);
    return NextResponse.json({
      success: false,
      error: `Lỗi kết nối máy chủ Facebook: ${error.message}`,
    }, { status: 500 });
  }
}

