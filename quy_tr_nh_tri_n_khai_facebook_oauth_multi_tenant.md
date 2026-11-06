# QUY TRÌNH TRIỂN KHAI FACEBOOK OAUTH 2.0 MULTI-TENANT (CHO NGƯỜI DÙNG BÊN NGOÀI TỰ LIÊN KẾT & ĐĂNG BÀI)

Tài liệu này cung cấp toàn bộ quy trình, kiến trúc hệ thống và mã nguồn chi tiết để biến website thành nền tảng SaaS: Người dùng bên ngoài bấm nút "Kết nối Facebook", cấp quyền các Fanpage họ quản lý, hệ thống tự động lưu Token vào Cơ sở dữ liệu và cho phép họ đăng bài mà không cần bạn phải thao tác thủ công.

---

## 1. MÔ HÌNH KIẾN TRÚC & LUỒNG DỮ LIỆU (OAUTH 2.0 FLOW)

```text
[Trình duyệt Người dùng]               [Server Backend / Next.js]               [Meta Graph API]
         │                                       │                                     │
         │ 1. Bấm "Kết nối Facebook"             │                                     │
         ├──────────────────────────────────────>│                                     │
         │   (Chuyển hướng sang Meta Login)      │                                     │
         │                                       │                                     │
         │ 2. Người dùng chọn Fanpage & cấp quyền│                                     │
         │────────────────────────────────────────────────────────────────────────────>│
         │                                                                             │
         │ 3. Meta chuyển hướng về website kèm Auth Code (?code=XYZ&state=ABC)        │
         │<────────────────────────────────────────────────────────────────────────────│
         │                                       │                                     │
         │ 4. Trình duyệt gửi Code lên Backend   │                                     │
         ├──────────────────────────────────────>│                                     │
         │                                       │ 5. Đổi Code lấy User Token          │
         │                                       ├────────────────────────────────────>│
         │                                       │<────────────────────────────────────┤
         │                                       │ 6. Đổi sang Long-lived Token        │
         │                                       ├────────────────────────────────────>│
         │                                       │<────────────────────────────────────┤
         │                                       │ 7. Gọi GET /me/accounts             │
         │                                       ├────────────────────────────────────>│
         │                                       │<────────────────────────────────────┤
         │                                       │    (Nhận DS Page ID & Page Token)   │
         │                                       │                                     │
         │                                       │ 8. Lưu Page Tokens vào DB theo User │
         │                                       │    [User] 1───N [ConnectedPage]     │
         │                                       │                                     │
         │ 9. Thông báo liên kết thành công      │                                     │
         │<──────────────────────────────────────┤                                     │
```

---

## 2. CẤU HÌNH TRÊN META FOR DEVELOPERS

Để luồng đăng nhập OAuth hoạt động mà không bị Meta chặn lỗi bảo mật, bạn cần thêm sản phẩm **Facebook Login for Business**:

1. Truy cập [developers.facebook.com](https://developers.facebook.com) $\rightarrow$ Vào App của bạn.
2. Tại thanh điều hướng bên trái, bấm **Add Product (Thêm sản phẩm)** $\rightarrow$ Tìm **Facebook Login for Business** $\rightarrow$ Bấm **Set up (Thiết lập)**.
3. Vào **Facebook Login for Business** $\rightarrow$ **Settings (Cài đặt)**:
   * **Valid OAuth Redirect URIs (URI chuyển hướng OAuth hợp lệ)**: Thêm URL chuyển hướng của server:
     * Chạy Local: `http://localhost:3000/api/auth/facebook/callback`
     * Chạy Production: `https://yourdomain.com/api/auth/facebook/callback`
   * Bấm **Save Changes (Lưu thay đổi)**.

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU (PRISMA SCHEMA)

Mỗi người dùng trong hệ thống có thể liên kết nhiều Fanpage khác nhau. Mỗi Fanpage sẽ có một `pageAccessToken` riêng biệt.

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite" // hoặc "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Người dùng hệ thống của bạn
model User {
  id             String          @id @default(cuid())
  email          String          @unique
  name           String?
  connectedPages ConnectedPage[] // 1 user sở hữu nhiều Fanpage
  createdAt      DateTime        @default(now())
}

// Bảng lưu trữ Fanpage của người dùng sau khi OAuth
model ConnectedPage {
  id               String   @id @default(cuid())
  pageId           String   // Facebook Page ID (duy nhất từ Meta)
  pageName         String   // Tên Fanpage
  pageCategory     String?  // Danh mục trang
  pageAccessToken  String   // Page Token vĩnh viễn dùng để đăng bài
  instagramId      String?  // Instagram Business ID (nếu có liên kết)
  
  userId           String
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([userId, pageId]) // Đảm bảo 1 user không lưu trùng 1 page 2 lần
}
```

Chạy lệnh cập nhật database:
```bash
npx prisma db push
```

---

## 4. BIẾN MÔI TRƯỜNG (`.env.local`)

```env
DATABASE_URL="file:./dev.db"

# Meta App Credentials (Lấy từ App Settings -> Basic)
META_APP_ID="123456789012345"
META_APP_SECRET="abcdef0123456789abcdef0123456789"
META_GRAPH_VERSION="v21.0"

# Đường dẫn URL callback (phải khớp 100% với cấu hình trên Meta)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
META_REDIRECT_URI="http://localhost:3000/api/auth/facebook/callback"
```

---

## 5. TOÀN BỘ MÃ NGUỒN XỬ LÝ (BACKEND SERVICE & ENDPOINTS)

### Bước 1: API Tạo đường dẫn đăng nhập Facebook (`src/app/api/auth/facebook/login/route.ts`)

Endpoint này tạo URL chuyển hướng đến màn hình xác thực Meta với các quyền cần thiết:

```typescript
// src/app/api/auth/facebook/login/route.ts
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

  if (!appId || !redirectUri) {
    return NextResponse.json({ error: 'Chưa cấu hình META_APP_ID hoặc META_REDIRECT_URI' }, { status: 500 });
  }

  // Danh sách quyền yêu cầu người dùng cấp
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_posts'
  ].join(',');

  // State ngẫu nhiên để chống tấn công CSRF (trong thực tế nên lưu cookie hoặc session)
  const state = Math.random().toString(36).substring(7);

  const fbAuthUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?` + new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state: state,
    scope: scopes,
    response_type: 'code',
    auth_type: 'rerequest', // Yêu cầu cấp lại nếu trước đó người dùng bỏ chọn quyền
  }).toString();

  return NextResponse.redirect(fbAuthUrl);
}
```

---

### Bước 2 & 3: Xử lý Callback, Đổi Token và Lưu Database (`src/app/api/auth/facebook/callback/route.ts`)

Đây là trung tâm xử lý của OAuth 2.0:
1. Nhận `code` từ Meta.
2. Đổi `code` lấy Short-Lived User Token.
3. Đổi Short-Lived User Token lấy Long-Lived User Token ($60$ ngày).
4. Gọi `/me/accounts` để lấy toàn bộ Fanpage kèm **Page Token vĩnh viễn**.
5. Lưu danh sách Page vào bảng `ConnectedPage`.

```typescript
// src/app/api/auth/facebook/callback/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || !code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=error&message=${encodeURIComponent(errorDescription || 'Người dùng đã hủy liên kết')}`
    );
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = process.env.META_REDIRECT_URI!;
  const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';

  try {
    // 1. Đổi Code lấy Short-Lived User Access Token
    const tokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?` + new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code,
    }).toString();

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Không thể đổi mã truy cập');
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Nâng cấp lên Long-Lived User Access Token (thời hạn 60 ngày)
    const longTokenUrl = `https://graph.facebook.com/${apiVersion}/oauth/access_token?` + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortLivedToken,
    }).toString();

    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    const longLivedUserToken = longTokenData.access_token || shortLivedToken;

    // 3. Lấy danh sách tất cả các Fanpage mà user này sở hữu kèm Page Token VĨNH VIỄN
    const accountsUrl = `https://graph.facebook.com/${apiVersion}/me/accounts?fields=id,name,category,access_token&access_token=${longLivedUserToken}`;
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();

    if (!accountsRes.ok || accountsData.error) {
      throw new Error(accountsData.error?.message || 'Không thể đọc danh sách Fanpage');
    }

    const pages = accountsData.data || [];

    // Giả lập ID người dùng hiện tại đang đăng nhập (trong thực tế lấy từ NextAuth / Session)
    // Để test, ta tạo hoặc lấy một User mẫu
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo_user@example.com' },
      update: {},
      create: {
        email: 'demo_user@example.com',
        name: 'Chủ Cửa Hàng Mẫu',
      },
    });

    // 4. Lưu hoặc cập nhật danh sách Fanpage vào Database
    for (const page of pages) {
      await prisma.connectedPage.upsert({
        where: {
          userId_pageId: {
            userId: demoUser.id,
            pageId: page.id,
          },
        },
        update: {
          pageName: page.name,
          pageCategory: page.category,
          pageAccessToken: page.access_token, // Page Token này không bị hết hạn
        },
        create: {
          userId: demoUser.id,
          pageId: page.id,
          pageName: page.name,
          pageCategory: page.category,
          pageAccessToken: page.access_token,
        },
      });
    }

    // Chuyển hướng người dùng về trang Dashboard thành công
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success&count=${pages.length}`
    );
  } catch (err: any) {
    console.error('Lỗi OAuth Callback:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=error&message=${encodeURIComponent(err.message)}`
    );
  }
}
```

---

### Bước 4: API Lấy danh sách Page của User (`src/app/api/pages/route.ts`)

```typescript
// src/app/api/pages/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Lấy user demo (hoặc user từ session)
    const user = await prisma.user.findUnique({
      where: { email: 'demo_user@example.com' },
      include: {
        connectedPages: {
          select: {
            id: true,
            pageId: true,
            pageName: true,
            pageCategory: true,
            createdAt: true,
            // Không trả về pageAccessToken ra Client để bảo mật
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      pages: user?.connectedPages || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

### Bước 5: API Đăng bài tự động theo Page được chọn (`src/app/api/facebook/publish/route.ts`)

Khi người dùng soạn bài, họ chỉ cần chọn Page ID. Backend sẽ tự truy vấn Database để lấy đúng `pageAccessToken` của trang đó:

```typescript
// src/app/api/facebook/publish/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { pageId, message, imageUrl } = await req.json();

    if (!pageId || !message) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn Fanpage và nhập nội dung bài viết' },
        { status: 400 }
      );
    }

    // 1. Tìm thông tin Page và Token trong Database
    const pageRecord = await prisma.connectedPage.findFirst({
      where: { pageId: pageId },
    });

    if (!pageRecord || !pageRecord.pageAccessToken) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy quyền đăng bài cho Fanpage này.' },
        { status: 404 }
      );
    }

    const apiVersion = process.env.META_GRAPH_VERSION || 'v21.0';
    let publishUrl: string;
    let payload: Record<string, any>;

    // 2. Phân loại đăng bài có ảnh hay chỉ có text
    if (imageUrl && imageUrl.trim() !== '') {
      publishUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/photos`;
      payload = {
        url: imageUrl,
        caption: message,
        access_token: pageRecord.pageAccessToken,
      };
    } else {
      publishUrl = `https://graph.facebook.com/${apiVersion}/${pageId}/feed`;
      payload = {
        message: message,
        access_token: pageRecord.pageAccessToken,
      };
    }

    // 3. Gọi Meta API với Token của Fanpage đó
    const metaRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const metaData = await metaRes.json();

    if (!metaRes.ok || metaData.error) {
      return NextResponse.json(
        { success: false, error: metaData.error?.message || 'Meta từ chối đăng bài' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: metaData.post_id || metaData.id,
      pageName: pageRecord.pageName,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

---

## 6. GIAO DIỆN QUẢN LÝ & ĐĂNG BÀI (DASHBOARD COMPONENT)

Tạo trang `src/app/dashboard/page.tsx` cho phép người dùng bấm liên kết, xem danh sách Fanpage đã kết nối và chọn Fanpage để đăng bài:

```tsx
// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface PageItem {
  id: string;
  pageId: string;
  pageName: string;
  pageCategory: string;
}

export default function DashboardPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Lấy danh sách Fanpage đã kết nối
  const fetchConnectedPages = async () => {
    try {
      const res = await fetch('/api/pages');
      const data = await res.json();
      if (data.success && data.pages) {
        setPages(data.pages);
        if (data.pages.length > 0 && !selectedPageId) {
          setSelectedPageId(data.pages[0].pageId);
        }
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách trang:', err);
    }
  };

  useEffect(() => {
    fetchConnectedPages();
  }, []);

  // Xử lý gửi bài viết
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/facebook/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selectedPageId,
          message,
          imageUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({
          type: 'ok',
          text: `Đã đăng thành công lên trang "${data.pageName}"! Mã bài viết: ${data.postId}`,
        });
        setMessage('');
        setImageUrl('');
      } else {
        setStatusMessage({ type: 'err', text: data.error || 'Đăng bài thất bại' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'err', text: err.message || 'Lỗi kết nối máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HEADER & NÚT LIÊN KẾT FACEBOOK */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Quản Trị Kênh Facebook Fanpage</h1>
            <p className="text-sm text-slate-400 mt-1">
              Liên kết tài khoản Facebook của bạn để đăng bài tự động trên nhiều trang.
            </p>
          </div>

          <a
            href="/api/auth/facebook/login"
            className="flex items-center gap-2 bg-[#1877F2] hover:bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg shadow-lg transition-all"
          >
            <span>🔗</span>
            <span>Kết nối Fanpage Mới</span>
          </a>
        </div>

        {/* DANH SÁCH FANPAGE ĐÃ KẾT NỐI */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Fanpage Đã Kết Nối ({pages.length})
          </h2>

          {pages.length === 0 ? (
            <div className="text-sm text-slate-400 italic">
              Chưa có Fanpage nào được kết nối. Hãy bấm nút "Kết nối Fanpage Mới" ở trên.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                    selectedPageId === p.pageId
                      ? 'border-blue-500 bg-blue-950/30'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                  onClick={() => setSelectedPageId(p.pageId)}
                >
                  <div>
                    <div className="font-medium text-white">{p.pageName}</div>
                    <div className="text-xs text-slate-400">ID: {p.pageId} • {p.pageCategory || 'Trang Facebook'}</div>
                  </div>
                  {selectedPageId === p.pageId && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Đang chọn</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FORM ĐĂNG BÀI LÊN FANPAGE ĐƯỢC CHỌN */}
        {pages.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Đăng Bài Lên: <span className="text-blue-400">{pages.find(p => p.pageId === selectedPageId)?.pageName}</span>
            </h2>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  NỘI DUNG BÀI ĐĂNG *
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập thông điệp quảng cáo hoặc bài viết..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  URL ẢNH ĐÍNH KÈM (TÙY CHỌN)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {statusMessage && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    statusMessage.type === 'ok'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Đang gửi bài lên Meta...' : 'Đăng Ngay Lên Fanpage Này'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 7. CÁCH KIỂM THỬ VỚI TÀI KHOẢN BÊN NGOÀI (KHI CHƯA QUA APP REVIEW)

Khi App còn ở **Development Mode**, người lạ bấm vào nút kết nối sẽ bị Meta báo lỗi quyền truy cập. Để người khác (ví dụ: giám khảo, đồng nghiệp, bạn bè) tự đăng nhập và liên kết được:

1. Vào [developers.facebook.com](https://developers.facebook.com) $\rightarrow$ Chọn App của bạn.
2. Tại menu bên trái, tìm mục **App Roles (Vai trò trong ứng dụng)** $\rightarrow$ **Roles**.
3. Bấm **Add Testers (Thêm người thử nghiệm)**.
4. Nhập Facebook ID hoặc đường link trang cá nhân của người cần test $\rightarrow$ Bấm **Submit**.
5. Hướng dẫn người đó:
   * Truy cập: [developers.facebook.com/requests](https://developers.facebook.com/requests).
   * Bấm **Chấp nhận (Accept)** lời mời Tester.
6. Lúc này, người đó có thể truy cập website của bạn, bấm **Kết nối Fanpage Mới**, chọn Fanpage cá nhân của họ và đăng bài thử nghiệm bình thường.