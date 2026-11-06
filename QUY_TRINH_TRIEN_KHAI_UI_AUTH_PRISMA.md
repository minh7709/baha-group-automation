# QUY TRÌNH THIẾT KẾ UI STITCH, XÁC THỰC EMAIL, PRISMA DB VÀ HOÀN THIỆN LOGIC USECASE (BAHA ADS)

> **Tài liệu đặc tả kỹ thuật & Hướng dẫn triển khai chi tiết**  
> **Dựa trên Design System**: `stitch_website_ui_ux_design_system` (*Autonomous Kinetic Pulse*)  
> **Cơ sở dữ liệu**: Prisma ORM (SQLite / PostgreSQL)  
> **Bảo mật & Xác thực**: Auth có xác minh Email (OTP / Verification Token)  
> **Hệ sinh thái logic**: 8 bước tạo chiến dịch Meta Ads, AI Copywriting, An toàn tài chính & Telegram Bot thật  

---

## I. HỆ THỐNG THIẾT KẾ UI STITCH: AUTONOMOUS KINETIC PULSE

Dựa trên tài liệu gốc tại `stitch_website_ui_ux_design_system/autonomous_kinetic_pulse/DESIGN.md`, giao diện kết hợp phong cách **Dark Cyber Precision** (Kỹ thuật mạng tối tân) và **High-Trust Fintech Instrumentation** (Bảng điều khiển tài chính minh bạch, độ tin cậy cao), thiết kế riêng cho đối tượng chủ doanh nghiệp vừa và nhỏ (~45 tuổi).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BẢNG MÀU THIẾT KẾ STITCH                         │
├──────────────────────────┬──────────────┬──────────────────────────────┤
│ Mã Token                 │ Mã Màu Hex   │ Ý nghĩa sử dụng              │
├──────────────────────────┼──────────────┼──────────────────────────────┤
│ Base Background          │ #0B0F19      │ Nền tối sâu thẳm obsidian    │
│ Card / Surface Container │ #111827      │ Nền thẻ nổi chứa nội dung    │
│ Surface Hover            │ #1F2937      │ Hiệu ứng rê chuột trên thẻ   │
│ Border Subtle            │ #1E293B      │ Đường viền tinh tế           │
│ Primary Cyber Blue       │ #38BDF8      │ Điểm nhấn điều hướng, nút AI │
│ Financial Safe Emerald   │ #10B981      │ Trạng thái an toàn, đã duyệt │
│ Budget Caution Amber     │ #F59E0B      │ Cảnh báo ngưỡng ngân sách    │
│ Emergency Halt Red       │ #EF4444      │ Nút Dừng khẩn cấp, lỗi       │
│ High Emphasis Text       │ #F8FAFC      │ Tiêu đề, số tiền chính       │
│ Medium Emphasis Text     │ #94A3B8      │ Nhãn giải thích, ghi chú     │
└──────────────────────────┴──────────────┴──────────────────────────────┘
```

### 4 Màn hình cốt lõi từ bộ thiết kế Stitch:
1. **Màn hình 1 - Tổng quan & Nhập nhanh thông minh (`baha_ads_t_ng_quan_nh_p_nhanh_th_ng_minh`)**:
   - Thanh thống kê 5 trạng thái: Đang chạy, Bản nháp, Chờ duyệt, Cần sửa, Đã tạo.
   - Khung nhập ngôn ngữ tự nhiên: *"Bạn muốn quảng cáo điều gì hôm nay?"*
   - Khung cảnh báo nhiệm vụ: *"VIỆC TIẾP THEO: Bạn đang có một bản nháp chưa hoàn thành"*.
2. **Màn hình 2 - Quy trình 8 bước & Ad Mockup Preview (`baha_ads_quy_tr_nh_8_b_c_ad_mockup_preview`)**:
   - Thanh điều hướng 8 bước mượt mà.
   - Khung xem trước bài quảng cáo Facebook Feed & Story thời gian thực với Fanpage, nút CTA "Gửi tin nhắn".
3. **Màn hình 3 - Tích hợp Telegram & Meta Adapter (`baha_ads_t_ch_h_p_telegram_meta_adapter`)**:
   - Cửa sổ cấu hình Bot Token, Chat ID với nút "Test gửi tin nhắn thật".
   - Chuyển đổi linh hoạt 1-click giữa `META MOCK` và `META REAL API`.
4. **Màn hình 4 - Quản trị chiến dịch & Dừng khẩn cấp (`baha_ads_qu_n_tr_chi_n_d_ch_d_ng_kh_n_c_p`)**:
   - Danh sách chiến dịch kèm bộ lọc tab, mã duyệt `BH-APR-...`, mã băm checksum.
   - Nút ngắt mạch **DỪNG QUẢNG CÁO NGAY** màu đỏ rực rỡ luôn sẵn sàng.
   - Trung tâm khởi động Pilot Gate với đếm ngược 120s và câu xác nhận an toàn.

---

## II. HƯỚNG DẪN TỪNG BƯỚC THIẾT LẬP ĐĂNG KÝ, ĐĂNG NHẬP & XÁC MINH EMAIL

Nhằm phục vụ đồ án tuyển dụng không bị phụ thuộc vào dịch vụ bên thứ ba rườm rà, luồng xác thực được thiết kế theo chuẩn bảo mật cao cấp:

```
┌──────────────────┐       1. Điền Form Đăng Ký       ┌────────────────────────┐
│  NGƯỜI DÙNG MỚI  │ ───────────────────────────────> │  POST /api/auth/register
└──────────────────┘                                  └───────────┬────────────┘
                                                                  │
                                      2. Băm mật khẩu (Bcrypt)   │
                                         Sinh mã OTP (6 chữ số)   │
                                                                  ▼
┌──────────────────┐       3. Gửi Mã Xác Thực         ┌────────────────────────┐
│ HỘP THƯ EMAIL    │ <─────────────────────────────── │  Email Service / Mock  │
│ (hoặc Pop-up OTP)│                                  └────────────────────────┘
└────────┬─────────┘
         │
         │ 4. Nhập mã OTP vào trang Xác thực
         ▼
┌────────────────────────┐  5. Đối chiếu mã hợp lệ    ┌────────────────────────┐
│ POST /api/auth/verify  │ ─────────────────────────> │ User.emailVerified=true│
└────────────────────────┘                            └────────────────────────┘
```

### Bước 1: Thiết kế Model User trong Prisma
Mỗi người dùng có thông tin bảo mật, mật khẩu đã mã hóa bằng `bcryptjs`, và trường lưu `verificationToken` cùng thời gian hết hạn `tokenExpiry`.

### Bước 2: API Đăng ký tài khoản (`/api/auth/register`)
- Kiểm tra email đã tồn tại hay chưa.
- Kiểm tra độ dài mật khẩu ($\ge 6$ ký tự).
- Mã hóa mật khẩu: `const hash = await bcrypt.hash(password, 10);`.
- Tạo mã xác thực OTP ngẫu nhiên 6 chữ số: `const otp = Math.floor(100000 + Math.random() * 900000).toString();`.
- Lưu người dùng với trạng thái `emailVerified = false` và thời hạn OTP 15 phút.
- Gửi email xác thực tới người dùng. 
  *(Cơ chế Hybrid: Nếu có cấu hình SMTP/Resend thì gửi email thật; đồng thời lưu mã OTP trong phản hồi API để nhà tuyển dụng kiểm tra test ngay lập tức mà không sợ lỗi chặn mail rác)*.

### Bước 3: API Xác thực Email (`/api/auth/verify`)
- Tiếp nhận email và mã OTP.
- Kiểm tra mã OTP khớp và còn trong thời hạn 15 phút.
- Cập nhật tài khoản `emailVerified = true`, xóa `verificationToken`.
- Trả về thông báo thành công và chuyển hướng đến trang Đăng nhập.

### Bước 4: API Đăng nhập (`/api/auth/login`)
- Kiểm tra tài khoản tồn tại.
- Kiểm tra người dùng đã xác thực email hay chưa. Nếu chưa ➔ yêu cầu nhập mã OTP xác thực.
- So sánh mật khẩu bằng `bcrypt.compare(password, user.passwordHash)`.
- Tạo phiên đăng nhập an toàn (Session Cookie / JWT).

---

## III. KHỞI TẠO VÀ CẤU HÌNH DATABASE PRISMA

### 1. File Schema Prisma (`prisma/schema.prisma`)
Cấu hình SQLite cho môi trường local và dễ dàng chuyển đổi sang PostgreSQL (Supabase/Neon) khi deploy cloud:

```prisma
datasource db {
  provider = "sqlite" // Đổi sang "postgresql" khi kết nối Supabase
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                String     @id @default(cuid())
  email             String     @unique
  passwordHash      String
  name              String
  role              String     @default("USER") // USER | FOUNDER | ADMIN
  emailVerified     Boolean    @default(false)
  verificationToken String?
  tokenExpiry       DateTime?
  campaigns         Campaign[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

model Campaign {
  id                String     @id @default(cuid())
  userId            String?
  user              User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  code              String     @unique // BaHa-ADS-YYYYMMDD-HHMMSS-XXXX
  name              String
  description       String?
  imageUrl          String?
  
  // Bước 2: Mục tiêu
  objective         String     // MESSAGES | LEAD | TRAFFIC | AWARENESS
  objectiveText     String
  specialCategory   String     @default("NONE") // NONE | HOUSING | CREDIT | EMPLOYMENT

  // Bước 3: Khách hàng & Vị trí
  location          String
  radiusKm          Int        @default(15)
  targetAge         String     @default("25 - 45")
  targetGender      String     @default("FEMALE")
  targetInterests   String?    // Lưu JSON danh sách sở thích

  // Bước 4: Ngân sách & Thời gian
  dailyBudget       Float      @default(200000)
  durationDays      Int        @default(7)
  totalBudget       Float      @default(1400000)
  maxEstimatedSpend Float      @default(1750000)
  startDate         DateTime
  endDate           DateTime

  // Bước 5: Nội dung sáng tạo
  headline          String
  primaryText       String
  callToAction      String     @default("SEND_MESSAGE")
  pageName          String     @default("Diệu BaHa - Quản Trị Thực Chiến")

  // Bước 7: Phê duyệt & An toàn
  status            String     @default("DRAFT") // DRAFT, PENDING_APPROVAL, APPROVED_INTERNAL, CREATED_PAUSED, ACTIVE, STOPPED
  version           Int        @default(1)
  approvalCode      String?    // BH-APR-YYYYMMDD-XXXX
  fingerprint       String?    // a651ab1de86479ab
  approvedBy        String?
  approvedAt        DateTime?

  // Bước 8: Meta & Telegram
  metaCampaignId    String?
  metaAdSetId       String?
  metaCreativeId    String?
  metaAdId          String?
  isMock            Boolean    @default(true)
  telegramSent      Boolean    @default(false)
  telegramSentAt    DateTime?

  auditLogs         AuditLog[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

model AuditLog {
  id         String   @id @default(cuid())
  campaignId String
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  action     String   // CREATED, APPROVED, META_CREATED, STOPPED, PILOT_ACTIVATED
  details    String
  timestamp  DateTime @default(now())
}
```

### 2. Các lệnh khởi tạo Database
```bash
# 1. Đẩy schema vào cơ sở dữ liệu SQLite cục bộ (tạo file dev.db và sinh bảng)
npx prisma db push

# 2. Sinh Prisma Client TypeScript
npx prisma generate
```

---

## IV. TRIỂN KHAI CODE LOGIC CHO TOÀN BỘ CÁC USECASE

### 1. Usecase 1: Bóc tách ngôn ngữ tự nhiên (Intent Extraction)
Khi người dùng gõ vào ô: *"Tôi muốn có khách hỏi giá dịch vụ chăm sóc sắc đẹp ở TP.HCM, 200 nghìn mỗi ngày trong 7 ngày, khách bấm vào thì gửi tin nhắn tư vấn cho tôi."*
- Regex trích xuất ngân sách: `200 nghìn` ➔ `dailyBudget = 200000`.
- Regex trích xuất thời gian: `7 ngày` ➔ `durationDays = 7`.
- Nhận diện địa bàn: `TP.HCM` ➔ `location = 'TP.Hồ Chí Minh'`.
- Nhận diện mục tiêu: `gửi tin nhắn` ➔ `objective = 'MESSAGES'`.

### 2. Usecase 2: AI Sáng tạo nội dung (Creative Copywriting)
- Kiểm tra danh mục đặc biệt (nhà ở/nội thất, tài chính/tín dụng, việc làm).
- Sinh 3 phiên bản tiêu đề giật tít, bài viết có emoji theo mô hình AIDA, nút kêu gọi hành động CTA chuẩn Facebook.
- Fallback thông minh: Đảm bảo hoạt động 100% trơn tru ngay cả khi không có kết nối internet hoặc chưa cấu hình API Key.

### 3. Usecase 3: Cơ chế an toàn tài chính 2 lớp của Founder BaHa
- **Quy tắc trần ngày**: Kiểm tra `dailyBudget <= 500000` VNĐ. Nếu vượt quá, giao diện tô đỏ cảnh báo và chặn nút phê duyệt.
- **Quy tắc trần tổng chi**: $Ngân\ sách \times 1.25 \le 2.000.000$ VNĐ.
- **Phê duyệt nội bộ**: Tạo mã `BH-APR-YYYYMMDD-XXXX`, tính checksum MD5 làm vân tay chống gian lận.
- **Tạo trên Meta**: Luôn truyền `status: 'PAUSED'`, không kích hoạt tính tiền.

### 4. Usecase 4: Bắn thông báo Telegram THẬT
- Gọi Telegram Bot API qua phương thức `sendMessage`.
- Soạn thảo Markdown chuyên nghiệp gồm tên chiến dịch, địa bàn, ngân sách, mã duyệt nội bộ và trạng thái an toàn.
- Có nút kiểm tra kết nối ngay trên giao diện cho phép ứng viên đổi Token của mình để demo trực tiếp.

### 5. Usecase 5: Mở Pilot Gate & Nút Dừng Khẩn Cấp
- Cấp giấy phép 120 giây sau khi ứng viên bấm kiểm tra mạch ngắt dừng khẩn cấp.
- Yêu cầu nhập câu xác nhận `TÔI XÁC NHẬN BẬT QUẢNG CÁO THẬT` để tránh vô tình bấm nhầm.
- Nút **DỪNG QUẢNG CÁO NGAY** màu đỏ luôn xuất hiện tại mọi màn hình để đảm bảo kiểm soát rủi ro tuyệt đối.

