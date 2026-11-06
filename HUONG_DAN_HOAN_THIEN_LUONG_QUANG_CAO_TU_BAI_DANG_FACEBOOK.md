# Hoàn thiện luồng quảng cáo từ bài đăng Facebook

## 1. Mục tiêu chức năng

Xây dựng một luồng chính trong BAHA:

```text
Kết nối Facebook
→ Chọn Fanpage
→ Hiển thị danh sách bài đăng
→ Chọn một bài đăng
→ Tạo quảng cáo từ bài đăng
→ Xem lại thông tin
→ Tạo Campaign / Ad Set / Ad trên Meta
→ Kích hoạt quảng cáo khi người dùng xác nhận
```

Chức năng này dùng cho **bài đăng của Fanpage**, không dùng bài đăng profile cá nhân làm
nguồn quảng cáo. Bài đăng profile cá nhân có thể hiển thị ở luồng riêng nếu Meta cấp quyền,
nhưng không được tự động chuyển thành quảng cáo Fanpage.

---

## 2. Điều kiện Meta bắt buộc

### 2.1. Kết nối Fanpage

Website cần nhận được:

1. User Access Token có quyền Page phù hợp.
2. Kết quả từ:

```text
/me/accounts?fields=id,name,category,access_token
```

3. Page Access Token của từng Fanpage.

4. Lưu Page Access Token ở backend dưới dạng mã hóa.

Không trả User Access Token hoặc Page Access Token về trình duyệt.

### 2.2. Quyền đọc và đăng bài Page

Tùy use case và phiên bản Meta, App Review có thể yêu cầu các quyền tương ứng:

```text
pages_show_list
pages_read_engagement
pages_read_user_content
pages_manage_posts
```

Tên quyền phải được kiểm tra lại trong Meta Developer Dashboard. Không hardcode một chuỗi
scope cũ nếu Meta Login Configuration yêu cầu `config_id`.

### 2.3. Quyền tạo quảng cáo

Để tạo quảng cáo trả phí cần:

```text
ads_read
ads_management
```

Ngoài ra cần:

- Ad Account ID hợp lệ.
- User/System User Access Token có quyền trên Ad Account.
- Fanpage được phép dùng trong Ad Account.
- App đã qua App Review/Business Verification nếu chạy với người dùng production.

---

## 3. Cấu hình môi trường

```env
META_API_MODE=REAL
META_APP_ID=...
META_APP_SECRET=...
META_GRAPH_VERSION=v21.0
META_AD_ACCOUNT_ID=act_...
META_ACCESS_TOKEN=...

NEXT_PUBLIC_APP_URL=https://your-domain.com
META_REDIRECT_URI=https://your-domain.com/api/auth/facebook/callback
SESSION_SECRET=...

DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

Không commit `.env`. Nếu token hoặc App Secret từng bị lộ, phải revoke và tạo lại.

Sau khi cập nhật Prisma:

```powershell
npx prisma migrate deploy
npx prisma generate
npm run build
```

---

## 4. Luồng kết nối Facebook

### Bước 1: Người dùng bắt đầu kết nối

UI gọi:

```text
/api/auth/facebook/login?scope=pages
```

Backend phải:

- Sinh `state` chống CSRF.
- Lưu `state` vào HttpOnly cookie.
- Redirect tới Meta OAuth.
- Không tự thêm `email`, `user_posts`, `user_photos` vào luồng Page.

### Bước 2: Callback

Callback:

```text
/api/auth/facebook/callback
```

Backend thực hiện:

1. Kiểm tra `state`.
2. Đổi authorization code lấy User Access Token.
3. Gọi `/me`.
4. Gọi `/me/accounts`.
5. Lấy Page Access Token.
6. Mã hóa token.
7. Lưu Page vào `ConnectedPage`.
8. Tạo session đăng nhập.
9. Redirect về dashboard.

Nếu `/me/accounts` không trả Page:

- Không hiển thị thành công giả.
- Giữ user đăng nhập nếu `/me` thành công.
- Hiển thị hướng dẫn cấp quyền Page hoặc nhập token thủ công.

---

## 5. Luồng lấy danh sách bài đăng

### API đề xuất

```http
GET /api/facebook/posts?pageId={pageId}&sync=true
```

Backend:

1. Xác thực session.
2. Kiểm tra Page thuộc user hiện tại.
3. Lấy Page Access Token từ database.
4. Giải mã token ở server.
5. Gọi Graph API:

```http
GET /{page-id}/posts
  ?fields=id,message,created_time,permalink_url,full_picture,
  status_type,shares,
  comments.limit(0).summary(true),
  reactions.limit(0).summary(true)
```

6. Upsert theo cặp:

```text
pageId + postId
```

7. Trả danh sách đã đồng bộ về UI.

### Dữ liệu cần hiển thị

Mỗi bài đăng nên có:

- Ảnh hoặc thumbnail.
- Nội dung.
- Thời gian đăng.
- Link bài viết gốc.
- Reactions.
- Comments.
- Shares.
- `postId`.
- Fanpage sở hữu bài viết.
- Thời điểm đồng bộ gần nhất.
- Trạng thái token/API.

Khi reload, UI có thể gọi `sync=true` để lấy dữ liệu mới nhất theo yêu cầu người dùng.
Không dùng cron nếu sản phẩm chỉ yêu cầu đồng bộ khi người dùng mở hoặc bấm nút.

---

## 6. Chọn bài đăng để chạy quảng cáo

### UI

Trong mỗi card bài viết, thêm:

```text
[Chọn bài này để quảng cáo]
```

Khi chọn:

- Lưu `selectedPost`.
- Hiển thị trạng thái đã chọn.
- Cho phép bỏ chọn.
- Chỉ cho phép chọn bài thuộc Page có token hợp lệ.

Không dùng `message` từ client làm nguồn duy nhất. Backend phải lấy lại bài theo `postId`
để tránh dữ liệu bị sửa ở trình duyệt.

### API lấy bài đã chọn

```http
GET /api/facebook/posts/{postId}
```

API phải kiểm tra:

- User có quyền với Page không.
- Bài có tồn tại trong database không.
- Bài có thuộc đúng Page đã chọn không.
- Page có Page Access Token không.

---

## 7. Tạo quảng cáo từ bài đăng

### API đề xuất

```http
POST /api/meta/campaigns/from-post
```

Body:

```json
{
  "postId": "pageId_postId",
  "pageId": "123456789",
  "name": "Quảng cáo bài đăng tháng 11",
  "objective": "OUTCOME_TRAFFIC",
  "dailyBudget": 200000,
  "durationDays": 7,
  "location": "TP. Hồ Chí Minh",
  "targetAge": "25-45",
  "targetGender": "ALL",
  "targetInterests": [],
  "callToAction": "LEARN_MORE"
}
```

Backend phải:

1. Đọc lại bài đăng từ database.
2. Xác thực Page và user.
3. Tính ngân sách:

```text
totalBudget = dailyBudget × durationDays
```

4. Kiểm tra giới hạn ngân sách BAHA.
5. Tạo bản ghi Campaign ở trạng thái `DRAFT`.
6. Lưu liên kết:

```text
facebookPostId
pageId
```

7. Trả về bản nháp để người dùng xem lại.

Không tạo quảng cáo thật ngay khi người dùng chỉ mới bấm chọn bài.

---

## 8. Tạo object trên Meta

Sau khi người dùng xác nhận, backend gọi Meta theo thứ tự:

```text
Campaign
→ Ad Set
→ Ad Creative
→ Ad
```

Tất cả object mới tạo phải bắt đầu ở:

```text
PAUSED
```

### Creative từ bài đăng

Nếu dùng bài viết Page làm creative, cần dùng đúng cơ chế Meta cho phép đối với
**existing post/Page post**. Không tự lấy URL bài viết rồi giả lập thành creative nếu endpoint
Meta yêu cầu `object_story_id`.

Dữ liệu cần bảo toàn:

```text
object_story_id = pageId_postId
```

Nếu Meta không cho dùng bài cụ thể làm existing post ad, phải báo lỗi rõ ràng và chuyển sang
creative mới từ `message`, ảnh, link; không im lặng tạo một quảng cáo khác nội dung.

### Lưu ID Meta

Sau mỗi bước, lưu ngay:

```text
metaCampaignId
metaAdSetId
metaCreativeId
metaAdId
```

Nếu bước sau lỗi, lưu:

```text
status = INTEGRATION_ERROR
errorStep
lastError
```

Không đánh dấu `ACTIVE` nếu chưa có xác nhận từ Meta.

---

## 9. Kích hoạt quảng cáo

Nên tách rõ hai nút:

```text
Tạo quảng cáo ở trạng thái tạm dừng
Kích hoạt quảng cáo
```

API kích hoạt:

```http
POST /api/meta
{
  "action": "activate",
  "campaignId": "..."
}
```

Backend:

1. Kiểm tra campaign đã được duyệt.
2. Kiểm tra có đủ Meta IDs.
3. Gọi activate tới Meta.
4. Đọc lại trạng thái từ Meta.
5. Chỉ khi Meta trả trạng thái hợp lệ mới cập nhật:

```text
ACTIVE
```

Nếu Meta trả lỗi, giữ trạng thái lỗi và hiển thị nguyên nhân.

---

## 10. Cấu trúc dữ liệu nên có

Nếu schema chưa có, Campaign nên có thêm:

```prisma
facebookPostId String?
pageId         String?
adAccountId    String?
```

Nên có model riêng cho bài đăng:

```prisma
model FacebookPost {
  id           String   @id @default(cuid())
  postId       String
  pageId       String
  pageName     String
  message      String   @default("")
  createdTime  DateTime
  permalinkUrl String?
  fullPicture  String?
  comments     Int      @default(0)
  reactions    Int      @default(0)
  shares       Int      @default(0)
  syncedAt     DateTime @default(now())

  @@unique([pageId, postId])
}
```

---

## 11. Trạng thái UI đề xuất

### Kết nối

```text
NOT_CONNECTED
CONNECTING
CONNECTED
PAGE_PERMISSION_REQUIRED
TOKEN_EXPIRED
```

### Bài đăng

```text
LOADING
SYNCED
EMPTY
PERMISSION_ERROR
TOKEN_EXPIRED
```

### Quảng cáo

```text
DRAFT
PENDING_APPROVAL
CREATED_PAUSED
ACTIVE
INTEGRATION_ERROR
STOPPED
```

Không dùng một thông báo “thành công” chung cho các trường hợp:

- Đã lưu bản nháp.
- Đã tạo object Meta ở PAUSED.
- Đã kích hoạt thật.
- Đang mô phỏng.

---

## 12. Kiểm tra nghiệm thu

### Kết nối Facebook

- [ ] OAuth callback kiểm tra `state`.
- [ ] User Access Token không xuất hiện trong response frontend.
- [ ] Page Access Token được mã hóa.
- [ ] Page được lưu đúng user.
- [ ] User không nhìn thấy Page của tenant khác.

### Danh sách bài đăng

- [ ] Chọn được Fanpage.
- [ ] Hiển thị bài đăng thật từ Graph API.
- [ ] Hiển thị nội dung, ảnh, thời gian, link và metrics.
- [ ] Reload có thể đồng bộ lại theo yêu cầu.
- [ ] Token hết hạn hiển thị lỗi rõ ràng.
- [ ] Page không có bài hiển thị trạng thái rỗng.

### Chạy quảng cáo

- [ ] Chọn được một bài.
- [ ] Tạo được Campaign bản nháp từ bài đã chọn.
- [ ] Không tạo Meta Ads khi chưa xác nhận.
- [ ] Tạo đúng Campaign / Ad Set / Creative / Ad.
- [ ] Object mới ở `PAUSED`.
- [ ] Lưu đủ ID Meta.
- [ ] Kích hoạt chỉ sau khi người dùng xác nhận.
- [ ] Trạng thái `ACTIVE` dựa trên Meta API.
- [ ] Lỗi Meta được lưu vào `lastError`.

### Production

- [ ] Đã chạy `prisma migrate deploy`.
- [ ] Đã cấu hình `DATABASE_URL`, `DIRECT_URL`.
- [ ] Redirect URI là HTTPS và khớp tuyệt đối.
- [ ] App Review/Business Verification hoàn tất nếu Meta yêu cầu.
- [ ] Token và App Secret không nằm trong Git.
- [ ] Không ghi dữ liệu vào filesystem của Vercel.

---

## 13. Giới hạn cần ghi rõ với người dùng

Luồng này dành cho:

```text
Fanpage Post
→ Existing Post Ad hoặc Creative hợp lệ trên Meta
```

Không nên mô tả thành:

```text
Đọc và quảng cáo mọi bài viết profile cá nhân
```

`user_posts` và `user_photos` không tự cấp quyền đăng bài, sửa bài, xóa bài hoặc chạy
quảng cáo profile cá nhân. Với quảng cáo trả phí, cần dùng Page và Ad Account được Meta cho
phép.

