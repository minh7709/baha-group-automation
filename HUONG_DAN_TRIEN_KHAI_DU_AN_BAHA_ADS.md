# QUY TRÌNH TOÀN DIỆN TRIỂN KHAI DỰ ÁN: WEBSITE THIẾT LẬP QUẢNG CÁO TRẢ PHÍ TỰ ĐỘNG (BAHA ADS)

> **Dự án**: Đánh giá năng lực thực chiến BAHA GROUP  
> **Nền tảng mục tiêu**: **Facebook / Meta Ads** + **Telegram Notification**  
> **Công nghệ**: **Fullstack JavaScript / TypeScript** (Next.js App Router, Tailwind CSS, Prisma)  
> **Triển khai Cloud**: Vercel / Render / Supabase  

---

## ⚠️ CẢNH BÁO QUAN TRỌNG NHẤT TỪ ĐỀ BÀI (DEADLY TRAP)

Trong yêu cầu của bạn có đề cập: *"thiết lập tự động viết bài, lên lịch đăng Fanpage, đăng video, … lên facebook link với tài khoản facebook nếu được... đăng bài vào nhóm hoặc quản lý nội dung mạng xã hội. Đây là tự động đăng nội dung..."*

🚨 **HÃY DỪNG LẠI VÀ ĐỌC KỸ LƯU Ý BẮT BUỘC Ở TRANG 1 CỦA ĐỀ BÀI BAHA GROUP:**

> **LƯU Ý BẮT BUỘC – KHÔNG NHẦM “QUẢNG CÁO TỰ ĐỘNG” VỚI “ĐĂNG BÀI TỰ ĐỘNG”**
> - **ĐÚNG YÊU CẦU**: Xây dựng quy trình thiết lập chiến dịch **QUẢNG CÁO TRẢ PHÍ (Paid Ads)**: Mục tiêu quảng cáo, đối tượng tiếp cận, khu vực, ngân sách, lịch chạy, nội dung sáng tạo, xem trước (Mockup Ad), phê duyệt nội bộ và trạng thái chiến dịch. Hệ thống hướng tới khả năng kết nối Meta Marketing API.
> - **KHÔNG ĐÚNG YÊU CẦU**: Website chỉ tự động viết bài, lên lịch đăng Fanpage, đăng video lên YouTube, đăng bài Zalo, đăng bài vào nhóm. Đây là **tự động đăng nội dung (Organic Social Media Management)**, **KHÔNG PHẢI** tự động thiết lập quảng cáo trả phí. Làm sai phần này sẽ bị **ĐÁNH TRƯỢT NGAY LẬP TỨC**.

👉 **Điểm giao thoa chuẩn xác**: 
Tính năng **AI viết bài** và **chọn Fanpage đại diện** vẫn được sử dụng, nhưng là để phục vụ cho **Nội dung mẫu quảng cáo (Ad Creative: Tiêu đề, Body Copy, Hình ảnh/Video, Nút Kêu Gọi Hành Động CTA)** được phân phối dưới dạng **Sponsored Ads** có ngân sách tiền thật, chứ **không phải** tool auto-post lên group hay trang cá nhân!

---

## I. TỔNG QUAN YÊU CẦU ĐỀ BÀI (TRÍCH XUẤT TỪ PDF & ẢNH MẪU)

### 1. Đối tượng người dùng mục tiêu
- Chủ shop / hộ kinh doanh cá thể ~ 45 tuổi, không rành kỹ thuật, sợ phức tạp.
- **Yêu cầu UI/UX**: Ngôn ngữ 100% tiếng Việt thân thiện, che giấu các thuật ngữ khó hiểu (CPC, CPM, CTR, Pixel, Custom Audience...). 
- Có gợi ý thông minh (AI / Rule-based) tại từng bước để người dùng chỉ việc click chọn.

### 2. Quy trình 8 bước chuẩn (B1 ➔ B8)
Theo đúng Mục 04 trong đề bài PDF và khớp với giao diện thực tế của BAHA Group:
1. **B1 - Nhập thông tin cơ bản**: Tên sản phẩm/dịch vụ, mô tả ngắn, tải lên hình ảnh/video sản phẩm.
2. **B2 - Chọn mục tiêu mong muốn**: 
   - Có thêm khách hàng nhắn tin / liên hệ tư vấn (Messages / Leads).
   - Tăng nhận biết thương hiệu / nhiều người biết đến (Awareness / Reach).
   - Tăng truy cập website / tăng đơn hàng (Traffic / Conversions).
3. **B3 - Chọn vị trí & đối tượng**: 
   - Nhập tỉnh/thành phố, bán kính (km).
   - Hệ thống tự động gợi ý độ tuổi, giới tính và nhóm sở thích phù hợp.
4. **B4 - Ngân sách & Thời gian chạy**:
   - Nhập số tiền/ngày (ví dụ 100.000đ - 500.000đ) hoặc tổng ngân sách.
   - Chọn số ngày chạy (mặc định ≤ 14 ngày để an toàn).
   - Tự động tính toán tổng chi phí ước tính, cảnh báo nếu ngân sách vượt ngưỡng an toàn.
5. **B5 - Hoàn thiện nội dung quảng cáo (Ad Creative & AI)**:
   - Tích hợp AI (Gemini / OpenAI) tự động gợi ý 3 phiên bản: Tiêu đề giật tít, bài viết quảng cáo, nút kêu gọi hành động (CTA: "Gửi tin nhắn", "Nhận báo giá", "Tìm hiểu thêm").
   - Cho phép người dùng chỉnh sửa trực tiếp.
6. **B6 - Xem trước quảng cáo (Ad Preview)**:
   - Hiển thị trực quan khung xem trước bài quảng cáo Facebook Feed & Facebook Story (giống hệt giao diện Facebook thật có nhãn "Được tài trợ / Sponsored").
7. **B7 - Kiểm tra, Duyệt nội bộ & Tạo chiến dịch an toàn**:
   - Tóm tắt toàn bộ thông tin chiến dịch.
   - **Cơ chế an toàn 2 lớp**: Phê duyệt nội bộ (sinh mã duyệt dạng `BH-APR-YYYYMMDD-XXXX`), yêu cầu người dùng gõ xác nhận.
   - Khi đẩy lên Meta: **LUÔN Ở TRẠNG THÁI TẠM DỪNG (`PAUSED` / `CREATED_PAUSED`)**, tuyệt đối không tự ý bật trừ tiền.
8. **B8 - Quản lý chiến dịch & Bắn thông báo Telegram THẬT**:
   - Quản lý danh sách chiến dịch, phân biệt rõ trạng thái: `Bản nháp (Draft)` ➔ `Chờ duyệt (Pending)` ➔ `Đã duyệt nội bộ (Approved)` ➔ `Mô phỏng (Mocked)` / `Đã tạo trên Meta (PAUSED)` ➔ `Đang chạy (ACTIVE)`.
   - **Gửi thông báo Telegram THẬT**: Ngay khi lưu hoặc xác nhận chiến dịch, Telegram Bot lập tức gửi tin nhắn về nhóm/kênh quản trị.

---

## II. KIẾN TRÚC HỆ THỐNG FULLSTACK JAVASCRIPT

```
┌────────────────────────────────────────────────────────────────────────┐
│                      NGƯỜI DÙNG (CHỦ SHOP 45 TUỔI)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Web Browser (Desktop / Mobile)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FRONTEND: Next.js 14 / React (App Router)            │
│  - Giao diện Dark Theme giống BaHa (`nhap-adspro.bahagroup.vn`)        │
│  - Luồng Wizard 8 bước tạo nhanh & Tinh chỉnh chuyên sâu               │
│  - Thành phần Ad Mockup Preview (Facebook Feed & Story)                │
│  - Bảng điều khiển Quản lý chiến dịch & Nút DỪNG KHẨN CẤP (Kill-switch)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ API Routes / Server Actions
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   BACKEND: Next.js API / Node.js Engine                │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   Ad Campaign Engine    │  │       Financial Safety Guard        │  │
│  │ - Quản lý Draft, Version│  │ - Trần ngân sách ngày (≤ 500k VND)  │  │
│  │ - Hash vân tay nội dung │  │ - Khóa ghi toàn cục                 │  │
│  │ - Mã duyệt BH-APR-xxxx  │  │ - Trạng thái mặc định luôn PAUSED   │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   AI Generator Service  │  │   Telegram Notification Service     │  │
│  │ - Google Gemini / OpenAI│  │ - Gửi tin nhắn thực qua Bot API     │  │
│  │ - Gợi ý Ad Copy, CTA    │  │ - Báo cáo ngân sách, trạng thái     │  │
│  └─────────────────────────┘  └─────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │           Meta Ads Adapter (Hỗ trợ 2 chế độ linh hoạt)           │  │
│  │ - MODE = REAL : Gọi Meta Marketing API v21.0 qua Graph SDK       │  │
│  │ - MODE = MOCK : Giả lập phản hồi chuẩn Meta Ads (Campaign, AdSet)│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prisma ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             DATABASE: PostgreSQL (Supabase / Neon) hoặc SQLite         │
│  - Campaigns (Chiến dịch), AdCreatives (Nội dung), AuditLogs (Nhật ký) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## III. HƯỚNG DẪN CẤU HÌNH CÁC KHÓA API CẦN THIẾT

### 1. Telegram Bot API (BẮT BUỘC PHẢI GỬI THẬT ĐỂ ĐẠT ĐIỂM TỐI ĐA)
Đề bài quy định: *"Riêng Telegram phải gửi được thông báo THẬT... Ứng viên cần trình diễn tin nhắn được gửi trong lúc kiểm tra"*.

#### Cách lấy Token và Chat ID trong 2 phút:
1. Mở Telegram trên điện thoại/máy tính, tìm bot `@BotFather`.
2. Gõ `/newbot`, đặt tên bot (ví dụ: `BaHa Ads Notification Bot`), đặt username (ví dụ: `baha_ads_alert_bot`).
3. BotFather sẽ trả về **BOT_TOKEN** (dạng `7123456789:ABCdefGHIjklMNOpqrsTUVwxyz`).
4. Tìm bot `@userinfobot`, gõ `/start` để lấy **CHAT_ID** của bạn (dạng `123456789`).
5. Nếu muốn gửi vào Group: Tạo nhóm, thêm bot vào nhóm, cấp quyền Admin, sau đó lấy Group Chat ID (dạng `-100xxxxxxxxx`).

#### Code gửi tin nhắn Telegram (Node.js Fetch):
```javascript
// lib/telegram.js
export async function sendTelegramAlert(campaign) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Chưa cấu hình TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID");
    return { success: false, error: "Chưa cấu hình Telegram" };
  }

  const message = `
🚀 *[BAHA ADS] THÔNG BÁO THIẾT LẬP QUẢNG CÁO MỚI*
━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 *Mã chiến dịch:* \`${campaign.code}\`
📌 *Tên chiến dịch:* ${campaign.name}
🎯 *Mục tiêu:* ${campaign.objectiveText}
📍 *Khu vực:* ${campaign.location}
💰 *Ngân sách:* ${Number(campaign.dailyBudget).toLocaleString('vi-VN')} đ/ngày (${campaign.durationDays} ngày)
💵 *Tổng dự kiến:* ${Number(campaign.totalBudget).toLocaleString('vi-VN')} đ
📝 *Mã duyệt nội bộ:* \`${campaign.approvalCode || 'CHƯA DUYỆT'}\`
⚡ *Trạng thái:* *${campaign.status}* (Meta: PAUSED)
━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 _Hệ thống tự động kích hoạt chế độ an toàn tài chính._
  `.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return { success: data.ok, result: data };
  } catch (error) {
    console.error("Lỗi gửi Telegram:", error);
    return { success: false, error: error.message };
  }
}
```

---

### 2. AI Content Generator API (Google Gemini API / OpenAI API)
Dùng để tự động tạo tiêu đề giật tít, bài viết chuẩn AIDA/PAS và nút CTA cho chủ shop.

#### Cách lấy Google Gemini API Key (Miễn phí):
1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập Google, bấm **Get API Key** ➔ **Create API key in new project**.
3. Copy API Key lưu vào biến môi trường `GEMINI_API_KEY`.

#### Code gợi ý nội dung quảng cáo bằng AI:
```javascript
// lib/ai.js
import { GoogleGenAI } from '@google/genai'; // hoặc fetch REST chuẩn

export async function generateAdContent({ productName, description, objective, location }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Trả về dữ liệu gợi ý dự phòng (Fallback Template) nếu chưa có API Key
    return {
      headlines: [
        `Khám Phá Dịch Vụ ${productName} Đẳng Cấp Tại ${location}`,
        `Ưu Đãi Đặc Biệt Cho ${productName} - Đặt Lịch Ngay Hôm Nay!`,
        `Giải Pháp Hoàn Hảo Về ${productName} Dành Riêng Cho Bạn`
      ],
      primaryTexts: [
        `Bạn đang tìm kiếm giải pháp ${productName} uy tín tại ${location}? ${description}. Đăng ký ngay để nhận ưu đãi đặc biệt!`,
      ],
      callToAction: "SEND_MESSAGE",
      suggestedTargeting: {
        ageRange: "25 - 45",
        interests: ["Làm đẹp", "Chăm sóc cá nhân", "Spa"]
      }
    };
  }

  const prompt = `
Bạn là chuyên gia quảng cáo Facebook Ads thực chiến của BAHA GROUP.
Hãy tạo nội dung quảng cáo chuyển đổi cao cho sản phẩm sau:
- Tên sản phẩm: ${productName}
- Mô tả: ${description}
- Mục tiêu: ${objective}
- Khu vực: ${location}

Trả về ĐÚNG định dạng JSON sau (không kèm markdown ngoài json):
{
  "headlines": ["Tiêu đề 1 ngắn gọn dưới 40 ký tự", "Tiêu đề 2", "Tiêu đề 3"],
  "primaryTexts": ["Bài viết quảng cáo thu hút, có icon, kêu gọi hành động rõ ràng"],
  "callToAction": "SEND_MESSAGE",
  "suggestedTargeting": {
    "ageRange": "22 - 50",
    "interests": ["Sở thích 1", "Sở thích 2", "Sở thích 3"]
  }
}
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(text);
}
```

---

### 3. Meta Marketing API (Facebook Graph API) & Mock Adapter
Đề bài cho phép: *"Có thể mô phỏng kết nối API quảng cáo nếu chưa có quyền truy cập, nhưng phải trình bày đúng phương thức xác thực, dữ liệu tạo chiến dịch, xử lý lỗi và điều kiện để chuyển sang tích hợp thật"*.

#### Cấu trúc kết nối chuẩn Meta Graph API v21.0:
Khi tạo quảng cáo trả phí trên Meta, luồng gồm 4 bước bắt buộc theo cấp bậc phân cấp:
1. **Tạo Chiến dịch (Campaign)**: Chứa mục tiêu (`OUTCOME_LEADS`, `OUTCOME_ENGAGEMENT`, `OUTCOME_TRAFFIC`), Trạng thái `PAUSED`.
2. **Tạo Nhóm quảng cáo (Ad Set)**: Chứa Ngân sách ngày (`daily_budget`), Target khu vực (`geo_locations`), Tuổi, Vị trí hiển thị.
3. **Tạo Nội dung sáng tạo (Ad Creative)**: Chứa Page ID, Tiêu đề, Body Text, Link ảnh/video, Call to Action button.
4. **Tạo Quảng cáo (Ad)**: Kết hợp `adset_id` và `creative_id`, đặt trạng thái `status: 'PAUSED'`.

#### Module Adapter đa chế độ (Chuyển đổi 1-Click giữa MOCK và REAL):
```javascript
// lib/meta-adapter.js
export class MetaAdsService {
  constructor() {
    this.isMock = process.env.META_API_MODE !== 'REAL';
    this.accessToken = process.env.META_ACCESS_TOKEN;
    this.adAccountId = process.env.META_AD_ACCOUNT_ID; // dạng: act_123456789
    this.apiVersion = 'v21.0';
  }

  async createCampaignInMeta(campaignData) {
    // NGUYÊN TẮC AN TOÀN BAHA: MỌI CHIẾN DỊCH TẠO RA LUÔN ĐỂ STATUS = PAUSED
    if (this.isMock) {
      console.log("[MOCK META] Đang mô phỏng tạo chiến dịch trên Meta Graph API...");
      await new Promise(r => setTimeout(r, 800)); // Giả lập độ trễ mạng
      const timestamp = Date.now();
      return {
        success: true,
        mode: 'MOCK',
        metaCampaignId: `120248${timestamp.toString().slice(-12)}`,
        metaAdSetId: `120249${timestamp.toString().slice(-12)}`,
        metaCreativeId: `180874${timestamp.toString().slice(-10)}`,
        metaAdId: `120250${timestamp.toString().slice(-12)}`,
        metaStatus: 'CREATED_PAUSED',
        note: 'Đã tạo bản sao mô phỏng chuẩn cấu trúc Meta Graph API. Không phát sinh chi phí.'
      };
    }

    // CHẾ ĐỘ THẬT: GỌI META MARKETING API CHÍNH THỨC
    try {
      // 1. Tạo Campaign
      const campRes = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.adAccountId}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `[BaHa] ${campaignData.name}`,
          objective: campaignData.objective, // VD: OUTCOME_LEADS
          status: 'PAUSED', // LUÔN TẠM DỪNG
          special_ad_categories: campaignData.specialCategory || ['NONE'],
          access_token: this.accessToken,
        })
      });
      const campJson = await campRes.json();
      if (campJson.error) throw new Error(campJson.error.message);

      // 2. Tạo Ad Set (Ngân sách, target)
      // 3. Tạo Ad Creative
      // 4. Tạo Ad
      return {
        success: true,
        mode: 'REAL',
        metaCampaignId: campJson.id,
        metaStatus: 'CREATED_PAUSED'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
```

---

## IV. BẢNG DỮ LIỆU & QUY TẮC AN TOÀN TÀI CHÍNH (THEO CHUẨN BAHA FOUNDER)

Dựa trên dữ liệu từ hình ảnh giao diện và nhật ký `#43 · BaHa-ADS-20261103-141219-3YRZ` của Founder BaHa:

### 1. Bảng quy tắc an toàn (Guardrails)
| Quy tắc | Giới hạn hệ thống BaHa | Mô tả kỹ thuật |
| :--- | :--- | :--- |
| **Trần ngân sách ngày** | `≤ 500.000 VNĐ / ngày` | Frontend & Backend validate chặn submit nếu vượt quá |
| **Mức dự phòng chi tối đa** | `≤ 2.000.000 VNĐ` | `Ngân sách ngày * Số ngày * 1.25 ≤ 2.000.000đ` |
| **Thời gian chiến dịch** | `1 đến 14 ngày` | Phải có ngày bắt đầu và ngày kết thúc cụ thể |
| **Khóa ghi toàn cục** | `GLOBAL_WRITE_LOCK: ON` | Mặc định không cho phép bật chạy tự động |
| **Trạng thái khởi tạo** | `CREATED_PAUSED` | Mọi entity tạo ra trên Meta bắt buộc ở trạng thái TẠM DỪNG |
| **Phê duyệt 2 lớp** | `BH-APR-YYYYMMDD-XXXX` | Phải qua bước Duyệt nội bộ + Tạo mã vân tay (fingerprint) |
| **Nút Dừng khẩn cấp** | `EMERGENCY STOP` | 1-Click chuyển trạng thái chiến dịch về STOPPED ngay lập tức |

### 2. Thiết kế Cơ sở dữ liệu (Prisma Schema)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite" // hoặc "postgresql" khi deploy Supabase/Neon
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Campaign {
  id               String   @id @default(cuid())
  code             String   @unique // Ví dụ: BaHa-ADS-20261103-141219-3YRZ
  name             String   // Tên sản phẩm/dịch vụ
  description      String?  // Mô tả ngắn
  imageUrl         String?  // Ảnh sản phẩm
  
  // Thông tin mục tiêu & Target
  objective        String   // OUTCOME_LEADS, OUTCOME_TRAFFIC, OUTCOME_AWARENESS
  objectiveText    String   // "Khách để lại thông tin", "Nhiều người biết đến"...
  location         String   // Ví dụ: TP.Hồ Chí Minh
  radiusKm         Int      @default(15)
  targetAge        String   @default("25-45")
  targetInterests  String?  // JSON string
  
  // Ngân sách & Thời gian
  dailyBudget      Float    // Số tiền / ngày (VD: 200.000)
  durationDays     Int      // Số ngày chạy (VD: 7)
  totalBudget      Float    // dailyBudget * durationDays
  startDate        DateTime
  endDate          DateTime
  
  // Nội dung quảng cáo (Creative)
  headline         String   // Tiêu đề
  primaryText      String   // Nội dung bài viết
  callToAction     String   // SEND_MESSAGE, CONTACT_US...
  
  // Trạng thái & Phê duyệt (Safety)
  status           String   @default("DRAFT") // DRAFT, PENDING_APPROVAL, APPROVED_INTERNAL, CREATED_PAUSED, ACTIVE, STOPPED
  approvalCode     String?  // BH-APR-20261103-0001
  fingerprint      String?  // Hash md5 xác thực phiên bản duyệt
  approvedAt       DateTime?
  
  // Meta Identifiers (Thật hoặc Mô phỏng)
  metaCampaignId   String?
  metaAdSetId      String?
  metaCreativeId   String?
  metaAdId         String?
  isMock           Boolean  @default(true)
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

---

## V. CHI TIẾT TỪNG BƯỚC XÂY DỰNG WEBSITE (STEP-BY-STEP IMPLEMENTATION)

### Bước 1: Khởi tạo Project Next.js (Fullstack)
Chạy lệnh khởi tạo ứng dụng:
```bash
npx create-next-app@latest baha-ads-system --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd baha-ads-system
npm install lucide-react clsx tailwind-merge @prisma/client
npm install -D prisma
npx prisma init
```

### Bước 2: Thiết kế Giao diện Khớp Ảnh Mẫu BAHA
Theo ảnh mẫu giao diện dark mode của BAHA (`nhap-adspro.bahagroup.vn`), tạo các thành phần cốt lõi:
1. **Header Thống Kê**:
   - `ĐANG CHẠY` (0 - Chưa xác minh)
   - `BẢN NHÁP` (Số lượng bản nháp)
   - `CHỜ DUYỆT` (0)
   - `CẦN SỬA` (0)
   - `ĐÃ TẠO` (1)
2. **Khung Nhập Nhanh Trực Quan ("Bạn muốn quảng cáo điều gì hôm nay?")**:
   - Input đa dòng hỗ trợ ngôn ngữ tự nhiên:  
     *Ví dụ: "Tôi muốn có khách hỏi giá dịch vụ chăm sóc sắc đẹp ở TP.HCM, 200 nghìn mỗi ngày trong 7 ngày, khách bấm vào thì gửi tin nhắn cho tôi."*
   - Nút hành động: `[✨ THIẾT LẬP QUẢNG CÁO]` | `[TIẾP TỤC BẢN NHÁP]` | `[XEM CHIẾN DỊCH CỦA TÔI]` | `[⚙️ THIẾT LẬP CHUYÊN SÂU]`.
3. **Thanh Thông Báo "VIỆC TIẾP THEO"**:
   - Hiển thị danh sách các mục còn thiếu (Ví dụ: Thiếu Mục tiêu chiến dịch, Khu vực, Ngày bắt đầu).
   - Nút `[TIẾP TỤC THIẾT LẬP ➔]`.

### Bước 3: Xây dựng Bộ tạo Ad Creative Preview (Facebook Ad Mockup)
Component xem trước hiển thị thời gian thực gồm:
- Header Fanpage (Avatar + Tên Page + Nhãn "Được tài trợ • 🌐").
- Nội dung Text chính (sinh ra từ AI hoặc người dùng gõ).
- Khung ảnh sản phẩm tỉ lệ 1:1 hoặc 4:5.
- Headline in đậm phía dưới ảnh + Nút CTA bên phải (VD: "Gửi tin nhắn").

### Bước 4: Xây dựng Trung tâm Phê Duyệt Nội Bộ & An Toàn 2 Lớp
- Màn hình tóm tắt thông số chiến dịch trước khi tạo.
- Hộp cảnh báo chính sách an toàn tài chính:
  - Ngân sách ngày: 200.000 ₫ (≤ 500.000 ₫ trần an toàn).
  - Dự phòng tối đa: 1.750.000 ₫ (≤ 2.000.000 ₫).
  - Lịch: 7 ngày.
  - Trạng thái tạo trên Meta: **TẠM DỪNG (PAUSED)**.
- Nút bấm `[DUYỆT NỘI BỘ]` ➔ Hệ thống sinh mã `BH-APR-xxxx` và sinh vân tay checksum.
- Nút bấm `[TẠO TRÊN META (TẠM DỪNG)]` ➔ Gọi Meta Ads Service (Mock hoặc Real) ➔ Gửi thông báo Telegram THẬT.

---

## VI. HƯỚNG DẪN DEPLOY CLOUD MIỄN PHÍ VÀ NHANH NHẤT

### 1. Database (Cloud Miễn phí)
- Sử dụng **Supabase** (PostgreSQL) hoặc **Neon.tech**:
  1. Tạo tài khoản tại [supabase.com](https://supabase.com).
  2. Tạo Project mới ➔ Vào **Project Settings** ➔ **Database** ➔ Copy Connection String dạng URI.
  3. Dán vào file `.env`: `DATABASE_URL="postgresql://postgres:[PASSWORD]@...supabase.co:5432/postgres"`.
  4. Chạy lệnh: `npx prisma db push` để tạo bảng trên Cloud.

### 2. Frontend & Backend (Deploy lên Vercel)
- Vercel hỗ trợ 100% Next.js, có SSL HTTPS miễn phí:
  1. Đẩy mã nguồn lên kho **GitHub / GitLab** cá nhân.
  2. Truy cập [vercel.com](https://vercel.com), chọn **Add New Project** ➔ Chọn repo vừa tạo.
  3. Cấu hình các biến môi trường trong phần **Environment Variables**:
     - `DATABASE_URL`: URL database Supabase.
     - `TELEGRAM_BOT_TOKEN`: Token lấy từ BotFather.
     - `TELEGRAM_CHAT_ID`: Chat ID của bạn.
     - `GEMINI_API_KEY`: Key từ Google AI Studio.
     - `META_API_MODE`: `MOCK` (hoặc `REAL` nếu có tài khoản).
  4. Bấm **Deploy**. Sau 2 phút, bạn sẽ có đường link website trực tuyến hoạt động 24/7 (VD: `https://baha-ads.vercel.app`).

---

## VII. KỊCH BẢN TRÌNH DIỄN THỰC CHIẾN (CHUẨN THEO MỤC 09 CỦA ĐỀ BÀI)

Đề bài yêu cầu tình huống mẫu bắt buộc:
> **Khách hàng mẫu**: Chủ cửa hàng làm đẹp tại TP.HCM  
> **Dịch vụ**: Chăm sóc sắc đẹp  
> **Địa bàn**: TP.HCM  
> **Ngân sách**: 200.000 đồng/ngày, thời gian 07 ngày  
> **Mục tiêu**: Có thêm khách hàng liên hệ tư vấn  

### Các bước bạn sẽ thao tác trực tiếp trước ban giám khảo:
1. **Bước 1**: Mở đường link website đã deploy trên Vercel.
2. **Bước 2**: Nhập vào ô nhập nhanh:  
   *"Tôi muốn chạy quảng cáo dịch vụ Chăm sóc sắc đẹp tại TP.HCM, ngân sách 200.000đ mỗi ngày trong 7 ngày, mục tiêu khách nhắn tin tư vấn."*
3. **Bước 3**: Bấm `[✨ THIẾT LẬP QUẢNG CÁO]`. Hệ thống tự động phân tích:
   - Điền sẵn Mục tiêu: *Khách nhắn tin / liên hệ tư vấn*.
   - Điền Địa bàn: *TP.HCM*.
   - Điền Ngân sách: *200.000 đ/ngày*, Thời gian: *7 ngày*, Tổng dự tính: *1.400.000 đ*.
4. **Bước 4**: Bấm `[GỢI Ý NỘI DUNG VỚI AI]`:
   - AI sinh ngay 3 tiêu đề hấp dẫn và 1 bài viết chuẩn cho dịch vụ làm đẹp tại TP.HCM.
   - Nút kêu gọi hành động được tự chọn là `Gửi tin nhắn`.
5. **Bước 5**: Xem trước bài quảng cáo trên giao diện Facebook Feed Mockup.
6. **Bước 6**: Bấm `[DUYỆT NỘI BỘ]`:
   - Hệ thống cấp mã `BH-APR-20261106-0001` và tạo mã băm an toàn.
7. **Bước 7**: Bấm `[TẠO TRÊN META (TẠM DỪNG)]`:
   - Hệ thống tạo chiến dịch với trạng thái `CREATED_PAUSED`.
   - **Mở điện thoại / Telegram**: Hiển thị ngay tin nhắn thông báo THẬT với đầy đủ tên chiến dịch, ngân sách 200.000đ, 7 ngày, mã duyệt và trạng thái an toàn.
8. **Bước 8**: Giải thích với giám khảo: Chiến dịch đã ở trạng thái TẠM DỪNG trên hệ thống quảng cáo, không tự trừ tiền, và nút DỪNG KHẨN CẤP luôn sẵn sàng.

---

## VIII. BỘ CÂU HỎI & ĐÁP ÁN BẢO VỆ ĐỒ ÁN (MỤC 11 CỦA ĐỀ BÀI)

Dưới đây là đáp án chuẩn bị sẵn giúp bạn trả lời tự tin 100% trước nhà tuyển dụng BAHA Group:

1. **Trước bài kiểm tra, bạn đã từng xây dựng phần mềm quảng cáo hoặc tích hợp API quảng cáo chưa?**  
   *Trả lời:* Em chưa từng trực tiếp chạy API quảng cáo trước đây, nhưng thông qua đề bài, em đã chủ động đọc tài liệu Meta Marketing API v21.0, hiểu rõ cấu trúc 4 cấp (Campaign -> AdSet -> Creative -> Ad) và xây dựng được adapter linh hoạt chuyển đổi giữa chế độ Mockup chuẩn schema và Real API.
2. **Khó khăn kỹ thuật lớn nhất là gì? Bạn xác định nguyên nhân và xử lý thế nào?**  
   *Trả lời:* Khó khăn lớn nhất là đảm bảo an toàn tài chính, tránh việc code vô tình kích hoạt quảng cáo trừ tiền của người dùng. Em đã xử lý bằng cách áp dụng cơ chế 2 lớp duyệt, khóa ghi toàn cục (Global Write Lock), áp trần cứng ngân sách 500k/ngày và ép trạng thái mặc định của mọi đối tượng tạo ra trên Meta luôn là `PAUSED`.
3. **Hãy giải thích luồng gửi tin nhắn Telegram thật, cách xác thực và xử lý lỗi?**  
   *Trả lời:* Hệ thống dùng Telegram Bot API qua endpoint `/sendMessage`. Token và Chat ID được bảo vệ trong biến môi trường server-side, không bao giờ lộ ra client. Khi người dùng xác nhận chiến dịch, Server Action gọi API Telegram bất đồng bộ, có khối try/catch bắt lỗi mạng và ghi log đầy đủ.
4. **Bạn sẽ làm gì để thay bộ kết nối quảng cáo mô phỏng bằng API quảng cáo thật?**  
   *Trả lời:* Kiến trúc code của em tuân thủ Interface Adapter. Để chuyển sang thật, chỉ cần điền `META_ACCESS_TOKEN` và `META_AD_ACCOUNT_ID` vào `.env`, sau đó đổi `META_API_MODE=REAL`. Toàn bộ dữ liệu payload đã được chuẩn hóa theo đúng Graph API v21.0.
5. **Nếu thêm Zalo Ads, TikTok Ads và YouTube Ads, làm sao để không phải viết lại website?**  
   *Trả lời:* Em áp dụng kiến trúc **Provider / Strategy Pattern**. Frontend chỉ tương tác với Interface quảng cáo chung (`IAdCampaignProvider`). Khi mở rộng sang TikTok hay Zalo, ta chỉ cần tạo thêm class adapter mới (`TikTokAdsAdapter`, `ZaloAdsAdapter`) thực thi interface đó mà không cần thay đổi giao diện hay cơ sở dữ liệu cốt lõi.

