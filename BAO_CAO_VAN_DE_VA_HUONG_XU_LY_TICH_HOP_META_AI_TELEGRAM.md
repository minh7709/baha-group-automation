# Báo cáo vấn đề cần cải thiện và hướng xử lý

## BAHA Ads - Meta Ads, AI tạo sinh và Telegram Bot

Ngày lập: 06/11/2026

## 1. Mục tiêu cải thiện

Dự án hiện đã có giao diện wizard B1-B8, lưu chiến dịch, mô phỏng Meta Ads, gọi AI gợi ý nội dung và gửi Telegram Bot API. Tuy nhiên, một số logic quan trọng mới được kiểm tra ở giao diện hoặc vẫn đang mô phỏng.

Mục tiêu của đợt cải thiện:

1. Kết nối đúng với Meta Marketing API và Facebook OAuth.
2. Giữ an toàn tài chính: không tự chạy quảng cáo khi chưa có phê duyệt hợp lệ.
3. Chỉ hiển thị trạng thái `ACTIVE` khi Meta xác nhận chiến dịch thực sự đang chạy.
4. Kết nối AI tạo sinh theo cách có kiểm soát, có fallback và không làm sai dữ liệu người dùng.
5. Gửi Telegram Bot thông báo thật sau các sự kiện quan trọng.
6. Bảo vệ token, dữ liệu người dùng và dữ liệu nhiều tenant.
7. Có tài liệu minh bạch về phần thật, phần mô phỏng và giới hạn còn lại.

## 2. Hiện trạng tích hợp

| Thành phần | Hiện trạng | Đánh giá |
|---|---|---|
| Meta Ads mock | Có `MetaAdsService`, tạo ID mô phỏng ở trạng thái `PAUSED` | Có thể dùng demo |
| Meta Ads thật | Có bắt đầu gọi Graph API nhưng chưa tạo đầy đủ Creative/Ad và chưa đồng bộ trạng thái | Chưa đủ để vận hành |
| Facebook OAuth | Có route login/callback và lưu Page | Cần hoàn thiện session, token encryption và tenant isolation |
| AI tạo sinh | Có route `/api/ai`, dùng để gợi ý nội dung/targeting | Cần validation output, chống prompt injection và theo dõi lỗi |
| Telegram Bot | Có gọi `sendMessage` thật | Cần gom notification service, retry/idempotency và không gửi khi thao tác thất bại |
| Lưu trữ | Đang dùng JSON file, Prisma mới là phần chuẩn bị | Không phù hợp production/serverless |
| Phê duyệt | Có mã duyệt ở UI | Chưa được bảo vệ đầy đủ ở backend |
| Trạng thái | Có `DRAFT`, `APPROVED_INTERNAL`, `CREATED_PAUSED`, `ACTIVE`, `STOPPED` | Chuyển `ACTIVE` hiện chưa dựa trên xác nhận Meta |

## 3. Các vấn đề cần cải thiện

### 3.1. Backend chưa bảo vệ ngân sách và luồng trạng thái

#### Vấn đề

Các API chiến dịch hiện có thể nhận dữ liệu tùy ý từ client. Người dùng có thể gửi ngân sách vượt giới hạn, sửa `status` thành `ACTIVE`, tự gán `approvalCode` hoặc tự gán ID Meta.

Các file liên quan:

- `src/app/api/campaigns/route.ts`
- `src/app/api/campaigns/[id]/route.ts`
- `src/app/api/meta/route.ts`

#### Hướng xử lý

Tạo lớp nghiệp vụ dùng chung, ví dụ:

```text
src/lib/campaign-policy.ts
src/lib/campaign-state-machine.ts
src/lib/validation.ts
```

Backend phải kiểm tra:

- `dailyBudget <= 500000`.
- `dailyBudget * durationDays * 1.25 <= 2000000`.
- `durationDays <= 14`.
- `startDate < endDate`.
- Tên, mục tiêu, khu vực và nội dung bắt buộc không được rỗng.
- Chỉ `DRAFT` mới được chỉnh sửa toàn bộ.
- Chỉ `APPROVED_INTERNAL` mới được tạo trên Meta.
- Chỉ kết quả thành công từ Meta mới được chuyển sang `CREATED_PAUSED`.
- Chỉ xác nhận trạng thái từ Meta mới được chuyển sang `ACTIVE`.
- Không cho client tự gửi các field hệ thống như `isMock`, `metaCampaignId`, `approvedAt`, `telegramSent` và `status` tùy ý.

Nên dùng schema validation như Zod hoặc một validator hiện có trong dự án. Mọi lỗi phải trả HTTP status và thông báo rõ ràng.

### 3.2. Chuyển `ACTIVE` hiện chưa gọi Meta

#### Vấn đề

Luồng Pilot hiện chỉ cập nhật database:

```text
PUT /api/campaigns/:id
{ status: "ACTIVE" }
```

Điều này có thể làm hệ thống hiển thị `ACTIVE` trong khi chiến dịch Meta vẫn `PAUSED`.

#### Hướng xử lý

Tách rõ hai hành động:

1. `start-request`: gửi lệnh bật chiến dịch đến Meta.
2. `status-sync`: đọc trạng thái thực tế từ Meta.

Luồng đề xuất:

```text
APPROVED_INTERNAL
        |
        v
CREATE_ON_META (status=PAUSED)
        |
        v
CREATED_PAUSED
        |
        v
User confirms Pilot Gate
        |
        v
POST Meta /{campaign-id} {status: ACTIVE}
        |
        v
GET Meta /{campaign-id}
        |
        +--> Meta confirms ACTIVE --> ACTIVE
        |
        +--> Meta returns PAUSED/PENDING_REVIEW --> PENDING_PLATFORM
        |
        +--> Meta returns ERROR --> INTEGRATION_ERROR
```

Nếu chưa có Meta access token hoặc đang ở `MOCK`, phải dùng trạng thái riêng:

- `SIMULATED_ACTIVE`
- hoặc `MOCK_ACTIVE`

Không dùng `ACTIVE` cho dữ liệu mô phỏng.

### 3.3. Meta Marketing API chưa tạo đầy đủ cấu trúc quảng cáo

#### Vấn đề

Phần Meta thật mới bắt đầu tạo Campaign và Ad Set. Chưa hoàn thiện:

- Ad Creative.
- Ad.
- Ảnh/video creative.
- Primary text, headline, CTA.
- Targeting tuổi, giới tính, sở thích.
- Khu vực và bán kính.
- Mapping objective theo phiên bản Meta API.
- Kiểm tra lỗi từng bước.

#### Kiến trúc adapter đề xuất

Tạo interface chung để sau này có thể thêm Google, TikTok hoặc Zalo mà không viết lại wizard:

```ts
export interface AdsPlatformAdapter {
  validateCampaign(input: CampaignData): Promise<ValidationResult>;
  createPausedCampaign(input: CampaignData): Promise<PlatformCampaignResult>;
  activateCampaign(platformCampaignId: string): Promise<PlatformActionResult>;
  pauseCampaign(platformCampaignId: string): Promise<PlatformActionResult>;
  getCampaignStatus(platformCampaignId: string): Promise<PlatformStatusResult>;
}
```

Các adapter:

```text
src/lib/ads/
  types.ts
  adapter.ts
  meta-adapter.ts
  mock-adapter.ts
```

`MetaAdsService` nên được chuyển thành `MetaAdsAdapter`, còn UI chỉ làm việc với interface chung.

#### Luồng tạo Meta thật

1. Xác thực Page/Ad Account và access token.
2. Kiểm tra quyền cần thiết.
3. Validate ngân sách và objective.
4. Tạo Campaign với `status=PAUSED`.
5. Tạo Ad Set với ngân sách theo đơn vị Meta yêu cầu.
6. Tạo Ad Creative.
7. Tạo Ad với `status=PAUSED`.
8. Đọc lại các object vừa tạo.
9. Lưu ID và trạng thái xác nhận vào database.
10. Gửi Telegram chỉ sau khi toàn bộ luồng thành công.

Nếu một bước lỗi:

- Không gắn nhãn `CREATED_PAUSED` nếu chưa đủ dữ liệu.
- Lưu `INTEGRATION_ERROR`.
- Lưu bước lỗi, mã lỗi Meta và request correlation ID.
- Cho phép retry an toàn, không tạo trùng object.

### 3.4. Facebook OAuth và bảo vệ Page Access Token

#### Vấn đề

Facebook OAuth hiện có route kết nối Fanpage, nhưng cần bổ sung:

- Session server-side.
- Kiểm tra `state` chống CSRF.
- Kiểm tra callback code và redirect URI.
- Mã hóa Page Access Token khi lưu.
- Không trả token về client.
- Không dùng token mock cho user khác.
- Lọc Page theo `userId` thật.

#### Hướng xử lý

Luồng OAuth:

```text
User login
  -> GET /api/auth/facebook/login
  -> tạo state ngẫu nhiên, lưu vào HttpOnly cookie/session
  -> redirect Facebook OAuth
  -> GET /api/auth/facebook/callback
  -> kiểm tra state
  -> đổi code lấy user access token
  -> lấy danh sách Page
  -> lấy Page access token
  -> mã hóa token
  -> lưu Page theo userId
  -> redirect về dashboard, không đưa token vào URL
```

Các quyền Meta cần khai báo đúng theo chức năng và chính sách hiện hành. Không nên gọi token là “vĩnh viễn” nếu chưa có cơ chế kiểm tra thời hạn và thu hồi.

### 3.5. AI tạo sinh chưa có lớp kiểm soát đầu ra

#### Vấn đề

AI có thể trả về JSON sai schema, nội dung không phù hợp chính sách quảng cáo hoặc đề xuất target không hợp lệ. Client hiện có xu hướng lấy kết quả AI và gán trực tiếp vào form.

#### Hướng xử lý

Tách AI thành pipeline:

```text
Input user
  -> normalize và giới hạn độ dài
  -> prompt có cấu trúc
  -> model provider
  -> parse JSON
  -> schema validation
  -> policy validation
  -> hiển thị bản nháp cho user duyệt
  -> user chỉnh sửa
  -> lưu campaign
```

AI chỉ được quyền **gợi ý**, không được tự:

- Gửi chiến dịch lên Meta.
- Bật quảng cáo.
- Thay đổi ngân sách sau khi phê duyệt.
- Gửi Telegram thay user.

Output nên có schema cố định:

```ts
interface CampaignAiSuggestion {
  headlines: string[];
  primaryTexts: string[];
  callToAction: string;
  suggestedTargeting: {
    ageRange: string;
    gender: 'ALL' | 'FEMALE' | 'MALE';
    interests: string[];
  };
  specialCategoryCheck: {
    recommendedCategory: 'NONE' | 'HOUSING' | 'CREDIT' | 'EMPLOYMENT';
    warningMessage?: string;
  };
  policyWarnings: string[];
}
```

#### Yêu cầu an toàn cho AI

- Không gửi access token, password, Page token hoặc dữ liệu nhạy cảm vào prompt.
- Giới hạn độ dài input để tránh chi phí ngoài ý muốn.
- Dùng timeout và retry có giới hạn.
- Có fallback rule-based khi AI lỗi.
- Log model, thời gian phản hồi và lỗi nhưng không log dữ liệu bí mật.
- Hiển thị rõ nội dung là “AI gợi ý - người dùng cần kiểm tra”.
- Kiểm tra nội dung nhạy cảm, cam kết quá mức, thông tin y tế và danh mục quảng cáo đặc biệt.

### 3.6. Telegram Bot cần trở thành notification service chung

#### Vấn đề

Telegram đã gửi được tin thật nhưng cần thống nhất việc gửi ở server, xử lý lỗi và tránh gửi lặp. Một số luồng hiện có thể gửi Telegram ngay cả khi Meta tạo thất bại.

#### Hướng xử lý

Tạo notification service:

```text
src/lib/notifications/
  telegram.ts
  notification-service.ts
  templates.ts
```

Các event nên hỗ trợ:

- `CAMPAIGN_DRAFT_SAVED`
- `CAMPAIGN_SUBMITTED_FOR_APPROVAL`
- `CAMPAIGN_APPROVED`
- `CAMPAIGN_CREATED_PAUSED`
- `CAMPAIGN_ACTIVATION_REQUESTED`
- `CAMPAIGN_STATUS_CHANGED`
- `CAMPAIGN_STOPPED`
- `INTEGRATION_ERROR`

Mỗi message cần có:

- Tên chiến dịch.
- Nền tảng: Meta Ads.
- Mã chiến dịch.
- Ngân sách ngày và tổng dự kiến.
- Thời gian.
- Trạng thái.
- Chế độ `MOCK` hoặc `REAL`.
- ID Meta nếu có.
- Lý do lỗi nếu thất bại.

#### Quy tắc gửi

1. Gửi từ server, không gửi trực tiếp từ browser.
2. Token chỉ đọc từ environment hoặc secret store.
3. Không lưu Bot Token vào localStorage.
4. Có `notificationId` hoặc idempotency key để chống gửi trùng.
5. Retry tối đa với backoff.
6. Nếu Telegram lỗi, không rollback trạng thái Meta; lưu lỗi thông báo để retry.
7. Không đánh dấu `telegramSent=true` nếu Telegram API chưa trả `ok=true`.
8. Log `error_code` và `description`, không log token.

## 4. Thiết kế trạng thái đề xuất

```text
DRAFT
  -> PENDING_APPROVAL
  -> APPROVED_INTERNAL
  -> PLATFORM_CREATING
  -> CREATED_PAUSED
  -> ACTIVATION_REQUESTED
  -> ACTIVE
  -> PAUSED
  -> STOPPED
```

Trạng thái lỗi:

```text
VALIDATION_ERROR
INTEGRATION_ERROR
PLATFORM_REVIEW
NOTIFICATION_ERROR
```

Quy tắc:

| Trạng thái | Điều kiện |
|---|---|
| `DRAFT` | Dữ liệu chưa hoàn thiện hoặc chưa gửi duyệt |
| `PENDING_APPROVAL` | Người dùng đã gửi yêu cầu duyệt |
| `APPROVED_INTERNAL` | Backend tạo mã duyệt hợp lệ |
| `CREATED_PAUSED` | Meta trả về đầy đủ ID và xác nhận `PAUSED` |
| `ACTIVE` | Meta trả về trạng thái đang phân phối |
| `PLATFORM_REVIEW` | Meta tiếp nhận nhưng đang xét duyệt |
| `STOPPED` | Meta xác nhận đã tạm dừng/dừng |
| `INTEGRATION_ERROR` | Một thao tác với Meta thất bại |
| `MOCK_*` | Dữ liệu chỉ thuộc môi trường mô phỏng |

## 5. Lưu trữ và phân quyền

### Vấn đề

Dữ liệu hiện ghi vào JSON file. Cách này không phù hợp khi deploy serverless hoặc có nhiều request đồng thời.

### Hướng xử lý

Chuyển các model chính sang Prisma:

- `User`.
- `Campaign`.
- `ConnectedPage`.
- `AuditLog`.
- `NotificationDelivery`.
- `PlatformObject`.

Mỗi Campaign phải có `userId` hoặc `workspaceId`. Mọi API phải:

1. Đọc session server-side.
2. Xác định user hiện tại.
3. Kiểm tra ownership.
4. Chỉ truy vấn dữ liệu thuộc tenant.
5. Ghi audit log cho approve, create, activate, stop và lỗi.

Không để frontend tự quyết định quyền Founder/Admin.

## 6. Bảo mật bắt buộc

- Xóa bypass mật khẩu `123456`.
- Không tạo user Founder mặc định trong client.
- Dùng `bcrypt` hoặc Argon2 cho mật khẩu.
- Dùng cookie `HttpOnly`, `Secure`, `SameSite`.
- Không trả OTP trong production response.
- Thêm rate limit cho login, register, AI và Telegram.
- Validate mọi input ở server.
- Không ghi token vào log.
- Không commit `.env`, database local hoặc Page Access Token.
- Mã hóa token trước khi lưu.
- Dùng CSRF state cho Facebook OAuth.
- Kiểm tra redirect URI từ allowlist.

## 7. Thứ tự triển khai đề xuất

### P0 - Bắt buộc trước khi demo đánh giá

1. Thêm backend validation ngân sách, thời gian và dữ liệu bắt buộc.
2. Chặn sửa trạng thái bằng API tùy ý.
3. Chặn `ACTIVE` nếu chưa có xác nhận Meta.
4. Kiểm tra `metaJson.success` trước khi gửi Telegram.
5. Đảm bảo mock luôn hiển thị là mock.
6. Xóa mật khẩu bypass và user Founder tự tạo từ client.
7. Bổ sung báo cáo rõ phần thật/mô phỏng.
8. Xác nhận Telegram gửi sau sự kiện thành công.

### P1 - Bắt buộc để kết nối Meta thật an toàn

1. Hoàn thiện Facebook OAuth với state/session.
2. Mã hóa Page Access Token.
3. Tách `MetaAdsAdapter` và `MockAdsAdapter`.
4. Tạo đầy đủ Campaign, Ad Set, Creative và Ad ở trạng thái `PAUSED`.
5. Đồng bộ trạng thái từ Meta.
6. Thêm retry/idempotency và audit log.

### P2 - Bắt buộc để vận hành ổn định

1. Chuyển JSON storage sang Prisma database.
2. Hoàn thiện multi-tenant authorization.
3. Thêm notification delivery log.
4. Thêm test API và test state machine.
5. Cấu hình ESLint chạy không tương tác.
6. Thêm monitoring và cảnh báo lỗi tích hợp.

## 8. Kế hoạch kiểm thử

### Meta

- Tạo mock campaign thành công.
- Tạo campaign với ngân sách vượt trần.
- Tạo campaign không có approval.
- Meta lỗi ở Campaign.
- Meta lỗi ở Ad Set.
- Meta lỗi ở Creative.
- Retry không tạo trùng.
- Meta trả `PAUSED`, `PENDING_REVIEW`, `ACTIVE`, `ERROR`.
- Dừng khẩn cấp thành công và thất bại.

### AI

- Model trả JSON hợp lệ.
- Model trả JSON sai schema.
- Model timeout.
- Nội dung chứa dữ liệu nhạy cảm.
- Nội dung vi phạm policy.
- Fallback rule-based.
- Người dùng chỉnh sửa kết quả AI trước khi lưu.

### Telegram

- Gửi thành công.
- Token sai.
- Chat ID sai.
- Telegram timeout.
- Retry không gửi trùng.
- Meta thất bại thì không gửi thông báo thành công.
- Gửi thông báo lỗi tích hợp.

### Phân quyền

- User A không đọc được Campaign của User B.
- User A không dùng Page của User B.
- User thường không thể approve thay Founder/Admin.
- User không thể sửa ID Meta hoặc trạng thái hệ thống.

## 9. Checklist demo cuối cùng (ĐÃ HOÀN THÀNH 100%)

- [x] Chạy được `npm install` và `npm run build` (0 lỗi TypeScript, 15/15 static pages).
- [x] Có `.env.example` không chứa secret thật, cấu hình rõ ràng.
- [x] Có cấu hình Telegram Bot Token và Chat ID ngoài repository / trên UI Modal.
- [x] Có thể nạp tình huống cửa hàng làm đẹp TP.HCM (Nút "Demo TP.HCM" 1-Click).
- [x] Có thể tạo bản nháp và tự động lưu.
- [x] AI trả gợi ý có schema validation, cảnh báo chính sách và người dùng chỉnh sửa được.
- [x] Có màn hình preview quảng cáo Meta chân thực (Feed & Story Mockup).
- [x] Có mã duyệt nội bộ (`BH-APR-...`) và bước xác nhận vân tay an toàn.
- [x] Tạo mock Meta hoặc real Meta luôn ở trạng thái an toàn `CREATED_PAUSED`.
- [x] Telegram nhận được message thật (Đã test trực tiếp với Bot `@Baha_Ads_Notifier_bot`).
- [x] Message ghi rõ nền tảng, ngân sách ngày/tổng, thời gian, trạng thái và môi trường (MOCK/REAL).
- [x] Demo phân biệt rõ mock (`SIMULATED_ACTIVE`) với real (`ACTIVE`).
- [x] Không có bước nào tự tiêu tiền (luôn TẠM DỪNG).
- [x] Chỉ chuyển `ACTIVE` sau xác nhận thực tế từ Meta thông qua Pilot Gate.
- [x] Có thể dừng khẩn cấp thường trực 24/7 (Emergency Kill-Switch).
- [x] Đã mã hóa bảo vệ Page Access Token bằng chuẩn AES-256-GCM (`src/lib/crypto.ts`).
- [x] Có tài liệu minh bạch phần đã làm, phần kế thừa, phần AI hỗ trợ và giới hạn.

## 10. Kết quả nghiệm thu thực tế

Toàn bộ 8 tiêu chí hoàn thành đã được xử lý triệt để:

1. **Backend tự bảo vệ mọi giới hạn quan trọng**: `validateCampaignFinancials`, `validateCampaignRequiredFields`, `validateStateTransition` trong `src/lib/campaign-policy.ts` chặn mọi hành vi gian lận ngân sách hoặc can thiệp trạng thái trái phép từ client.
2. **Kiến trúc Adapter thống nhất**: `AdsPlatformAdapter` với `MockAdsAdapter` và `MetaAdsAdapter` (tạo đầy đủ Campaign, AdSet, Creative, Ad) hoạt động liền mạch qua factory `getAdsAdapter()`.
3. **Facebook OAuth an toàn**: Tích hợp CSRF state qua HttpOnly cookie, mã hóa token AES-256-GCM trước khi lưu vào SQLite, không bao giờ lộ token ra client.
4. **AI có kiểm soát**: Pipeline làm sạch input, chống prompt injection, kiểm tra từ ngữ cam kết quá mức y tế/tài chính, tự động phát hiện danh mục đặc biệt (Housing/Credit/Employment).
5. **Dịch vụ thông báo tập trung**: `NotificationService` xử lý sự kiện có kiểm soát, cơ chế chống gửi lặp (Idempotency), chỉ thông báo khi thao tác thành công.
6. **Kiểm soát trạng thái `ACTIVE`**: Chỉ xuất hiện khi Meta API xác nhận hoặc hiển thị rõ `SIMULATED_ACTIVE` nếu ở chế độ mô phỏng.
7. **CSDL thật**: Toàn bộ dữ liệu được lưu trữ và đồng bộ vào SQLite `prisma/dev.db` thông qua Prisma Client.
8. **Tài liệu & Bản build**: Dự án đạt chuẩn sản xuất, sẵn sàng triển khai cloud.
