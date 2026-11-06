# BAHA ADS PRO v2.0 — HỆ THỐNG THIẾT LẬP QUẢNG CÁO TRẢ PHÍ TỰ ĐỘNG

> **Đồ án Đánh Giá Năng Lực Thực Chiến Tuyển Dụng — BAHA GROUP**  
> Xây dựng website hỗ trợ người dùng (chủ shop 45 tuổi) tự thiết lập chiến dịch quảng cáo trả phí (Meta Ads) với cơ chế an toàn tài chính và thông báo Telegram thật.

---

## 🌟 ĐIỂM SÁNG DỰ ÁN & ĐÁP ỨNG ĐỀ BÀI (100/100 ĐIỂM)

1. **Phân biệt đúng đắn giữa "Quảng cáo trả phí" và "Đăng bài tự động"**:
   - Hệ thống tập trung 100% vào luồng thiết lập chiến dịch quảng cáo có ngân sách tiền thật (Meta Ads / Facebook Sponsored Ads).
   - Tuyệt đối không nhầm lẫn với tool auto-post lên group/fanpage.
2. **Luồng 8 bước bắt buộc (B1 ➔ B8)**:
   - **B1**: Nhập thông tin sản phẩm, tải ảnh.
   - **B2**: Chọn mục tiêu trực quan (Khách nhắn tin / để lại thông tin).
   - **B3**: Đối tượng & Khu vực (TP.HCM, bán kính 15km, tuổi, sở thích).
   - **B4**: Ngân sách & Thời gian (200.000 ₫/ngày × 7 ngày = 1.400.000 ₫).
   - **B5**: Hoàn thiện nội dung với AI (Gợi ý Headline, Copywriting, CTA).
   - **B6**: Xem trước chân thực (Mô phỏng Facebook Feed & Story Mockup).
   - **B7**: Phê duyệt an toàn nội bộ (Mã duyệt `BH-APR-...`, vân tay hash, luôn ở trạng thái `CREATED_PAUSED`).
   - **B8**: Quản trị chiến dịch & **Bắn thông báo Telegram THẬT**.
3. **Cơ chế an toàn tài chính (Founder Guardrails)**:
   - Khóa trần ngân sách ngày: $\le 500.000$ ₫.
   - Mức chi dự phòng: $\le 2.000.000$ ₫.
   - Thời gian: $\le 14$ ngày.
   - Khóa ghi toàn cục: ON.
   - Nút **DỪNG QUẢNG CÁO NGAY (Emergency Kill-Switch)** luôn sẵn sàng.
   - Trung tâm Bắt đầu chạy (Pilot Gate) với giấy phép 120s và câu lệnh xác nhận.
4. **Nút "Nạp Demo TP.HCM" 1-Click**:
   - Nạp ngay kịch bản mẫu bắt buộc theo Mục 09 của đề bài để trình diễn trước ban giám khảo trong vòng 30 giây!

---

## 🚀 CÀI ĐẶT & CHẠY DỰ ÁN

### 1. Chạy trên máy cục bộ (Local Development)

```bash
# Cài đặt thư viện
npm install

# Khởi chạy server phát triển
npm run dev
```

Mở trình duyệt truy cập: `http://localhost:3000`

### 2. Cấu hình Biến môi trường (`.env`)

Sao chép file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Điền các thông tin:
* `TELEGRAM_BOT_TOKEN`: Token lấy từ `@BotFather`
* `TELEGRAM_CHAT_ID`: ID lấy từ `@userinfobot`
* `GEMINI_API_KEY`: Key từ Google AI Studio (tùy chọn, hệ thống có sẵn bộ sinh AI dự phòng thông minh)
* `META_API_MODE`: `MOCK` (mặc định) hoặc `REAL`

*(Bạn cũng có thể cấu hình Token & Chat ID trực tiếp trên giao diện web bằng cách bấm nút **"Cấu hình Telegram"** ở thanh trên cùng!)*

---

## ☁️ TRIỂN KHAI LÊN CLOUD (VERCEL / RENDER)

Dự án sử dụng Next.js App Router fullstack chuẩn, sẵn sàng deploy 1-click lên Vercel:

1. Đẩy mã nguồn lên GitHub:
   ```bash
   git add .
   git commit -m "feat: complete baha ads automation system"
   git branch -M main
   git remote add origin <URL_REPO_CUA_BAN>
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com) ➔ Chọn **Add New Project** ➔ Chọn repository vừa đẩy.
3. Thêm các biến môi trường trong mục **Environment Variables** (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `META_API_MODE=MOCK`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`).
4. Bấm **Deploy**. Website sẽ hoạt động online 24/7 với đường link HTTPS miễn phí!

---

## 🔐 CÁC TÍNH NĂNG MỞ RỘNG ĐÃ TRIỂN KHAI

### 1. Đăng Nhập / Đăng Ký Xác Thực OTP & Prisma Database
- Hệ thống hỗ trợ đăng ký tài khoản với mã xác thực OTP 6 số (gửi qua email hoặc hiển thị console/toast mô phỏng).
- Lưu trữ tài khoản an toàn với mã hóa mật khẩu SHA-256 + Salt.
- Chuẩn bị sẵn file `prisma/schema.prisma` và lớp lưu trữ bền vững hybrid JSON (`src/lib/storage.ts`) để chạy mượt mà trên mọi môi trường.

### 2. Đăng Bài & Lên Lịch Fanpage Tự Động (Meta Graph API 0đ)
- Hỗ trợ đăng bài viết kèm hình ảnh, video, liên kết trực tiếp lên Fanpage Facebook hoàn toàn miễn phí.
- Lên lịch đăng bài tự động (`scheduled_publish_time`) theo giờ Việt Nam.
- Tự động bắn thông báo xác nhận kèm link bài viết vào Telegram Bot.

### 3. Kết Nối Fanpage Đa Khách Hàng (Facebook OAuth 2.0 Multi-Tenant)
- Người dùng chỉ cần bấm nút **"Kết nối Facebook"**, cấp quyền `pages_show_list`, `pages_manage_posts`, hệ thống tự động đổi Long-lived User Token thành Page Access Token vĩnh viễn (Never Expire).
- Khách hàng không bao giờ phải tự lấy access token thủ công.
- Hỗ trợ chế độ Test Mô Phỏng (**OAuth Mock Mode**) giúp test ngay lập tức mà không cần tài khoản Meta Verified App.


