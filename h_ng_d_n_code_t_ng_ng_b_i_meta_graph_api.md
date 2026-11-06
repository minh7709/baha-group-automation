# HƯỚNG DẪN TOÀN TẬP: TỰ ĐỘNG ĐĂNG BÀI LÊN FACEBOOK FANPAGE BẰNG META GRAPH API (0 ĐỒNG)

Tài liệu này hướng dẫn chi tiết quy trình từ A - Z để tự xây dựng tính năng đăng bài tự động (Publish Post, Photo, Scheduled Post) lên Facebook Fanpage bằng Meta Graph API (v21.0), hoàn toàn miễn phí, không tốn phí bản quyền hay dịch vụ trung gian.

---

## MỤC LỤC
1. [Cơ chế & Điều kiện hoạt động](#1-cơ-chế--điều-kiện-hoạt-động)
2. [Cấu hình Meta Developer & Lấy Token vĩnh viễn](#2-cấu-hình-meta-developer--lấy-token-vĩnh-viễn)
3. [Thiết lập Dự án & Biến môi trường](#3-thiết-lập-dự-án--biến-môi-trường)
4. [Toàn bộ Mã nguồn Xử lý (Backend Service & API)](#4-toàn-bộ-mã-nguồn-xử-lý-backend-service--api)
5. [Giao diện Đăng bài & Xem trước (Frontend React/Next.js)](#5-giao-diện-đăng-bài--xem-trước-frontend-reactnextjs)
6. [Xử lý Lỗi thường gặp (Error Handling)](#6-xử-lý-lỗi-thường-gặp-error-handling)
7. [Ứng dụng vào Dự án BAHA Ads](#7-ứng-dụng-vào-dự-án-baha-ads)

---

## 1. CƠ CHẾ & ĐIỀU KIỆN HOẠT ĐỘNG

### 1.1. Phạm vi áp dụng
* **Hỗ trợ:** Facebook Fanpage (Trang) mà tài khoản của bạn nắm quyền Quản trị viên (Admin) hoặc Biên tập viên (Editor).
* **Không hỗ trợ:** Trang cá nhân (Profile) và Hội nhóm (Facebook Groups đã đóng Public API từ 2024 để chống spam).
* **Chế độ phát triển (Development Mode):** Khi ứng dụng ở chế độ này, bạn **không cần nộp hồ sơ xét duyệt (App Review)**, vẫn có thể gọi API đăng bài thoải mái lên các Fanpage do chính bạn hoặc các tài khoản trong danh sách Tester/Admin của App quản lý.

### 1.2. Phân loại Token trong Facebook Graph API
* **User Access Token:** Đại diện cho tài khoản cá nhân, thời hạn ngắn (1 - 2 giờ).
* **Long-Lived User Access Token:** Tạo từ User Token ngắn hạn, có thời hạn 60 ngày.
* **Page Access Token (Vĩnh viễn):** Tạo từ Long-Lived User Token. **Token này không bao giờ hết hạn** (trừ khi bạn đổi mật khẩu Facebook hoặc hủy liên kết ứng dụng). Đây chính là chìa khóa để chạy auto post lâu dài mà không bị đứt đoạn.

---

## 2. CẤU HÌNH META DEVELOPER & LẤY TOKEN VĨNH VIỄN

### Bước 2.1: Tạo Ứng dụng trên Meta for Developers
1. Truy cập [developers.facebook.com](https://developers.facebook.com) và đăng nhập bằng tài khoản Facebook.
2. Bấm **My Apps (Ứng dụng của tôi)** $\rightarrow$ **Create App (Tạo ứng dụng)**.
3. Chọn loại ứng dụng: Chọn **Other (Khác)** $\rightarrow$ Bấm **Next**.
4. Chọn loại hình: Chọn **Business (Doanh nghiệp)** hoặc **None (Không có)** $\rightarrow$ Bấm **Next**.
5. Nhập **Tên ứng dụng** (VD: `Auto Post Engine`) và **Email liên hệ** $\rightarrow$ Bấm **Create App**.
6. Lưu lại 2 thông số trong mục **App settings (Cài đặt ứng dụng)** $\rightarrow$ **Basic (Thông tin cơ bản)**:
   * **App ID** (ID ứng dụng)
   * **App Secret** (Khóa bí mật của ứng dụng)

---

### Bước 2.2: Cấp quyền trong Graph API Explorer
1. Trong menu trên cùng, chọn **Tools (Công cụ)** $\rightarrow$ **Graph API Explorer**.
2. Tại cột bên phải:
   * **Meta App:** Chọn đúng App bạn vừa tạo.
   * **User or Page:** Chọn **User Token**.
3. Tại ô **Add a Permission**, tìm và thêm 3 quyền sau:
   * `pages_show_list` (Hiển thị danh sách trang bạn quản lý)
   * `pages_read_engagement` (Đọc thông tin cơ bản của trang)
   * `pages_manage_posts` (Đăng và chỉnh sửa bài viết trên trang)
4. Bấm nút **Generate Access Token**.
5. Một cửa sổ popup Facebook hiện lên $\rightarrow$ Bấm **Tiếp tục dưới tên bạn** $\rightarrow$ Tích chọn các Fanpage muốn cấp quyền $\rightarrow$ Bấm **Lưu / Hoàn tất**.
6. Lúc này bạn có một **Short-Lived User Token** (Token ngắn hạn).

---

### Bước 2.3: Đổi sang Long-Lived Token & Lấy Page Token VĨNH VIỄN

#### Cách 1: Sử dụng công cụ Access Token Debugger (Dễ nhất)
1. Copy chuỗi Token vừa sinh ra ở Graph API Explorer.
2. Truy cập [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/).
3. Dán Token vào ô tìm kiếm $\rightarrow$ Bấm **Debug (Gỡ lỗi)**.
4. Kéo xuống dưới cùng, bấm nút **Extend Access Token (Mở rộng mã truy cập)**.
5. Hệ thống sẽ cấp một chuỗi Token mới có thời hạn **60 ngày**.

#### Cách 2: Gọi API trực tiếp để lấy Page Token vĩnh viễn
Quay lại **Graph API Explorer**, dán token 60 ngày vào ô `Access Token`, nhập lệnh sau vào thanh URL:
```http
GET me/accounts?fields=id,name,access_token
```
Bấm **Submit**. Kết quả JSON sẽ trả về:
```json
{
  "data": [
    {
      "id": "102938475610293",
      "name": "Shop Mỹ Phẩm ABC",
      "access_token": "EAAGm0PXqB..."
    }
  ]
}
```
* **`id`**: Đây chính là `PAGE_ID`.
* **`access_token`**: Đây là **Page Access Token vĩnh viễn**. Bạn copy mã này để sử dụng trong code Backend.

---

## 3. THIẾT LẬP DỰ ÁN & BIẾN MÔI TRƯỜNG

### 3.1. Cấu trúc thư mục (Next.js App Router hoặc Node.js)
```text
my-auto-post/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── facebook/
│   │   │       └── post/
│   │   │           └── route.ts       # API Endpoint xử lý đăng bài
│   │   ├── page.tsx                   # Giao diện Form đăng bài
│   │   └── layout.tsx
│   └── lib/
│       └── facebook.ts                # Service gọi Meta Graph API
├── .env.local                         # Khóa bí mật
├── package.json
└── tsconfig.json
```

### 3.2. Cấu hình file `.env.local`
Tạo file `.env.local` ở thư mục gốc:
```env
# Facebook Page Credentials
FB_PAGE_ID="102938475610293"
FB_PAGE_ACCESS_TOKEN="EAAGm0PXqB..."
FB_GRAPH_VERSION="v21.0"
```

---

## 4. TOÀN BỘ MÃ NGUỒN XỬ LÝ (BACKEND SERVICE & API)

### 4.1. Facebook Service Module (`src/lib/facebook.ts`)
Module này chịu trách nhiệm đóng gói toàn bộ logic tương tác với Meta Graph API, hỗ trợ: đăng bài chỉ có chữ, đăng kèm ảnh và lên lịch đăng bài.

```typescript
// src/lib/facebook.ts

export interface PostPayload {
  message: string;
  imageUrl?: string;
  linkUrl?: string;
  scheduledTime?: number; // Unix timestamp tính bằng giây
}

export interface PostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export class FacebookService {
  private pageId: string;
  private accessToken: string;
  private apiVersion: string;

  constructor() {
    this.pageId = process.env.FB_PAGE_ID || '';
    this.accessToken = process.env.FB_PAGE_ACCESS_TOKEN || '';
    this.apiVersion = process.env.FB_GRAPH_VERSION || 'v21.0';

    if (!this.pageId || !this.accessToken) {
      console.warn('[FacebookService] Cảnh báo: Thiếu FB_PAGE_ID hoặc FB_PAGE_ACCESS_TOKEN trong .env');
    }
  }

  /**
   * Đăng bài viết dạng Text hoặc kèm Link lên Feed của Fanpage
   */
  async postTextOrLink(message: string, linkUrl?: string, scheduledTime?: number): Promise<PostResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pageId}/feed`;
    
    const bodyPayload: Record<string, any> = {
      message: message,
      access_token: this.accessToken,
    };

    if (linkUrl) {
      bodyPayload.link = linkUrl;
    }

    // Nếu có hẹn giờ (Scheduled Post)
    if (scheduledTime) {
      bodyPayload.published = false;
      bodyPayload.scheduled_publish_time = scheduledTime;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || 'Lỗi không xác định từ Facebook API',
        };
      }

      return {
        success: true,
        postId: data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Lỗi kết nối máy chủ',
      };
    }
  }

  /**
   * Đăng bài kèm Hình Ảnh (Photo Upload with Caption)
   */
  async postPhoto(message: string, imageUrl: string, scheduledTime?: number): Promise<PostResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pageId}/photos`;

    const bodyPayload: Record<string, any> = {
      url: imageUrl,
      caption: message,
      access_token: this.accessToken,
    };

    if (scheduledTime) {
      bodyPayload.published = false;
      bodyPayload.scheduled_publish_time = scheduledTime;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        return {
          success: false,
          error: data.error?.message || 'Lỗi khi upload ảnh lên Facebook',
        };
      }

      return {
        success: true,
        postId: data.post_id || data.id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Lỗi kết nối khi gửi ảnh',
      };
    }
  }

  /**
   * Điều phối chính: Tự nhận diện loại bài đăng
   */
  async createPost(payload: PostPayload): Promise<PostResult> {
    if (payload.imageUrl && payload.imageUrl.trim() !== '') {
      return this.postPhoto(payload.message, payload.imageUrl, payload.scheduledTime);
    }
    return this.postTextOrLink(payload.message, payload.linkUrl, payload.scheduledTime);
  }
}
```

---

### 4.2. API Route xử lý yêu cầu (`src/app/api/facebook/post/route.ts`)
Tạo endpoint API nhận dữ liệu từ giao diện, kiểm tra tính hợp lệ và gọi FacebookService.

```typescript
// src/app/api/facebook/post/route.ts
import { NextResponse } from 'next/server';
import { FacebookService } from '@/lib/facebook';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, imageUrl, linkUrl, scheduledTime } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nội dung bài viết không được để trống.' },
        { status: 400 }
      );
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
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: parsedScheduledTime ? 'Lên lịch đăng bài thành công!' : 'Đã đăng bài lên Fanpage thành công!',
      postId: result.postId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi hệ thống nội bộ.' },
      { status: 500 }
    );
  }
}
```

---

## 5. GIAO DIỆN ĐĂNG BÀI & XEM TRƯỚC (FRONTEND REACT/NEXT.JS)

Trang giao diện người dùng bao gồm:
* Form nhập nội dung, link ảnh, link website và chọn thời gian lên lịch.
* Khung Live Ad/Post Preview giả lập giao diện bài viết trên Facebook Feed.

```tsx
// src/app/page.tsx
'use client';

import React, { useState } from 'react';

export default function AutoPostPage() {
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseStatus(null);

    try {
      const res = await fetch('/api/facebook/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          imageUrl: imageUrl || undefined,
          linkUrl: linkUrl || undefined,
          scheduledTime: isScheduled && scheduledTime ? scheduledTime : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponseStatus({
          type: 'success',
          msg: `${data.message} (Post ID: ${data.postId})`,
        });
        setMessage('');
        setImageUrl('');
        setLinkUrl('');
      } else {
        setResponseStatus({ type: 'error', msg: data.error || 'Đăng bài thất bại' });
      }
    } catch (err: any) {
      setResponseStatus({ type: 'error', msg: err.message || 'Lỗi mạng' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-500">
            Hệ Thống Tự Động Đăng Bài Meta Graph API
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Đăng bài trực tiếp hoặc lên lịch phát hành bài viết lên Facebook Fanpage (Miễn phí 100%)
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CỘT TRÁI: FORM SOẠN THẢO */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>✍️</span> Soạn thảo bài viết
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  NỘI DUNG BÀI VIẾT *
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung bạn muốn chia sẻ lên Fanpage..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 text-slate-200 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  URL HÌNH ẢNH (TÙY CHỌN)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/hinh-anh.jpg"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  ĐƯỜNG DẪN LIÊN KẾT / WEBSITE (TÙY CHỌN)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://website-cua-ban.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
                />
              </div>

              {/* Lên lịch */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="scheduleToggle"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800"
                  />
                  <label htmlFor="scheduleToggle" className="text-sm text-slate-300 select-none cursor-pointer">
                    Lên lịch đăng bài (Hẹn giờ)
                  </label>
                </div>

                {isScheduled && (
                  <div className="pl-6">
                    <label className="block text-xs text-slate-400 mb-1">
                      Chọn thời gian đăng (Tối thiểu sau 10 phút):
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                      required={isScheduled}
                    />
                  </div>
                )}
              </div>

              {/* Thông báo kết quả */}
              {responseStatus && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    responseStatus.type === 'success'
                      ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                  }`}
                >
                  {responseStatus.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Đang xử lý với Meta API...</span>
                ) : isScheduled ? (
                  <span>⏰ Xác Nhận Lên Lịch</span>
                ) : (
                  <span>🚀 Đăng Lên Fanpage Ngay</span>
                )}
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: MÔ PHỎNG HIỂN THỊ (FACEBOOK FEED MOCKUP) */}
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <span>👁️</span> Xem trước hiển thị Facebook
            </h2>

            <div className="bg-[#242526] text-[#e4e6eb] rounded-xl border border-slate-800 p-4 max-w-md mx-auto shadow-2xl">
              {/* Header Feed */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                  P
                </div>
                <div>
                  <div className="font-semibold text-sm">Tên Fanpage Của Bạn</div>
                  <div className="text-xs text-[#b0b3b8] flex items-center gap-1">
                    <span>{isScheduled ? 'Đã lên lịch' : 'Vừa xong'}</span> • <span>🌐</span>
                  </div>
                </div>
              </div>

              {/* Text Body */}
              <div className="text-sm whitespace-pre-wrap mb-3">
                {message || (
                  <span className="text-slate-500 italic">
                    Nội dung bài viết sẽ xuất hiện ở đây thời gian thực...
                  </span>
                )}
              </div>

              {/* Link đính kèm */}
              {linkUrl && !imageUrl && (
                <div className="mb-3 p-3 bg-[#3a3b3c] rounded border border-slate-700 text-xs">
                  <div className="text-blue-400 underline truncate">{linkUrl}</div>
                  <div className="text-slate-400 mt-0.5">Nhấp để mở liên kết bên ngoài</div>
                </div>
              )}

              {/* Ảnh Feed */}
              {imageUrl && (
                <div className="rounded-lg overflow-hidden bg-black mb-3 border border-slate-800">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-56 object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Footer Thao tác giả lập */}
              <div className="border-t border-[#3a3b3c] pt-2 flex justify-around text-xs text-[#b0b3b8] font-medium">
                <div className="hover:bg-[#3a3b3c] px-4 py-1.5 rounded cursor-pointer">👍 Thích</div>
                <div className="hover:bg-[#3a3b3c] px-4 py-1.5 rounded cursor-pointer">💬 Bình luận</div>
                <div className="hover:bg-[#3a3b3c] px-4 py-1.5 rounded cursor-pointer">↗️ Chia sẻ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. XỬ LÝ LỖI THƯỜNG GẶP (ERROR HANDLING)

Khi kết nối với Meta Graph API, bạn có thể gặp các mã lỗi chuẩn sau từ Facebook:

| Mã lỗi Meta (`code` / `subcode`) | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Code 190 (Invalid OAuth)** | Access Token hết hạn hoặc người dùng đã đổi mật khẩu Facebook. | Chạy lại quy trình lấy Long-Lived Token ở Mục 2 để lấy mã token mới. |
| **Code 200 (Permissions Error)** | Token chưa được cấp quyền `pages_manage_posts`. | Vào Graph API Explorer, thêm lại quyền `pages_manage_posts` và bấm cấp quyền lại cho App. |
| **Code 100 (Invalid Parameter)** | Định dạng tham số gửi lên không đúng (ví dụ link ảnh chết hoặc thời gian hẹn giờ sai). | - Kiểm tra `imageUrl` phải là link trực tiếp (kết thúc bằng `.jpg`, `.png`).<br>- Thời gian `scheduled_publish_time` phải nằm trong khoảng: `[Hiện tại + 10 phút, Hiện tại + 75 ngày]`. |
| **Code 368 (Temporarily Blocked)** | Facebook nghi ngờ tài khoản gửi quá nhiều bài đăng liên tục trong thời gian ngắn (Spam). | Giãn cách thời gian giữa các lần gọi API (tối thiểu 30-60 giây giữa mỗi bài đăng). |

---

## 7. ỨNG DỤNG VÀO DỰ ÁN BAHA ADS

Đối chiếu với yêu cầu đề bài của **BAHA GROUP**:
1. **Phân biệt ranh giới:**
   * Module trên giải quyết phần **Đăng bài tự động (Organic Post)**.
   * Để tạo **Quảng cáo trả phí (Paid Campaign)** theo đúng đề bài, bạn dùng cùng một `PAGE_ID` và `PAGE_ACCESS_TOKEN` này để tạo đối tượng `AdCreative` liên kết với Fanpage đại diện hiển thị quảng cáo có nút Kêu gọi hành động (CTA).
2. **Quy tắc an toàn tài chính:**
   * Việc đăng bài viết lên Fanpage là **hoàn toàn 0đ**, không tiêu ngân sách.
   * Chỉ khi tạo `AdSet` và `Campaign` thì mới cấu hình ngân sách tiền tệ. Do đó, việc tách riêng module đăng bài giúp hệ thống minh bạch giữa việc quản lý nội dung và chạy quảng cáo trả phí.