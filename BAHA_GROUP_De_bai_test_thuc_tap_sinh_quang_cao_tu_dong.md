# BAHA GROUP - Bài kiểm tra năng lực thực chiến

## Xây dựng website thiết lập quảng cáo trả phí tự động

| Đối tượng | Thời gian | Phạm vi |
|---|---|---|
| Thực tập sinh công nghệ | Không giới hạn | Một nền tảng quảng cáo + Telegram |

> **Lưu ý bắt buộc:** Không nhầm “quảng cáo trả phí” với “đăng bài tự động”.

## Yêu cầu tổng quát

Xây dựng quy trình thiết lập chiến dịch quảng cáo **trả phí**, gồm mục tiêu quảng cáo, đối tượng tiếp cận, khu vực, ngân sách, lịch chạy, nội dung sáng tạo, xem trước, duyệt và trạng thái chiến dịch. Hệ thống hướng tới khả năng kết nối với nền tảng quảng cáo chính thức.

Không yêu cầu xây dựng website chỉ để viết bài, lên lịch đăng Fanpage, đăng video YouTube, đăng bài Zalo, đăng bài vào nhóm hoặc quản lý nội dung mạng xã hội. Đó là tự động hóa nội dung, không phải tự động thiết lập quảng cáo trả phí.

Trong phạm vi kiểm tra, có thể mô phỏng kết nối API quảng cáo khi chưa có quyền truy cập, nhưng phải thể hiện đầy đủ luồng tạo chiến dịch trả phí. Telegram phải gửi được thông báo **thực tế**.

## 1. Mục đích bài kiểm tra

Bài kiểm tra đánh giá khả năng:

1. Phân tích yêu cầu, chia nhỏ vấn đề và chủ động tìm giải pháp.
2. Tự nghiên cứu tài liệu, API, SDK và mã nguồn.
3. Kế thừa, lựa chọn và tinh chỉnh giải pháp sẵn có thay vì làm lại không cần thiết.
4. Kết nối hệ thống ngoài, trao đổi dữ liệu, xác thực, xử lý lỗi và bảo vệ thông tin.
5. Ứng dụng AI và tự động hóa để tăng hiệu quả phát triển và giảm thao tác thủ công.
6. Chuyển quy trình khó thành trải nghiệm dễ hiểu cho người chưa biết chạy quảng cáo.
7. Giải quyết vấn đề độc lập, kiểm thử và minh bạch giới hạn.
8. Triển khai hiệu quả với thời gian, công sức và chi phí hợp lý.

## 2. Bối cảnh và mục tiêu sản phẩm

Nhiều chủ cửa hàng và doanh nghiệp muốn quảng cáo nhưng không hiểu quy trình quản lý quảng cáo, không biết chọn mục tiêu, khách hàng, ngân sách hoặc cách viết nội dung. Họ dễ thao tác sai, lãng phí tiền và phải dùng nhiều công cụ khác nhau.

Website cần giúp người hoàn toàn chưa có kiến thức quảng cáo tự thiết lập một chiến dịch quảng cáo trả phí qua các bước ngắn gọn, có gợi ý và kiểm tra trước khi xác nhận.

## 3. Lựa chọn nền tảng và phạm vi triển khai

Định hướng dài hạn là quản lý quảng cáo đa nền tảng, nhưng bài kiểm tra chỉ yêu cầu triển khai **một** nền tảng do ứng viên chọn:

- Facebook/Instagram Ads (Meta Ads).
- Google Ads.
- YouTube Ads (quản lý qua Google Ads).
- TikTok Ads.
- Zalo Ads.

Ứng viên phải nêu nền tảng đã chọn, lý do chọn và cách kiến trúc có thể mở rộng sang nền tảng khác. Telegram là tích hợp bổ sung bắt buộc để nhận thông báo, không được tính là nền tảng quảng cáo thay thế lựa chọn trên.

## 4. Luồng sử dụng website bắt buộc

Giả định người dùng là chủ cửa hàng khoảng 45 tuổi, chưa từng sử dụng trình quản lý quảng cáo. Giao diện phải dễ hiểu, bằng tiếng Việt, có hướng dẫn rõ ràng và hạn chế thuật ngữ như CPC, CPM, CTR.

### B1. Nhập thông tin

- Tên sản phẩm/dịch vụ.
- Mô tả ngắn.
- Ảnh hoặc video nếu có.

### B2. Chọn kết quả mong muốn

Ví dụ: có thêm khách hàng liên hệ, tăng truy cập hoặc tăng doanh số; lựa chọn phải phù hợp khả năng của nền tảng đã chọn.

### B3. Chọn đối tượng và khu vực

- Vị trí muốn quảng cáo.
- Gợi ý nhóm khách hàng phù hợp.
- Có thể gồm tuổi, giới tính, sở thích và bán kính.

### B4. Nhập ngân sách và thời gian

- Ngân sách theo ngày hoặc tổng ngân sách.
- Hiển thị số tiền dự kiến.
- Cảnh báo khi thiếu hoặc sai dữ liệu.
- Phải có ngày bắt đầu và ngày kết thúc rõ ràng.

### B5. Hoàn thiện nội dung

Hệ thống gợi ý và cho phép chỉnh sửa:

- Tiêu đề.
- Nội dung quảng cáo.
- Lời kêu gọi hành động.

### B6. Xem trước

Cho người dùng xem định dạng quảng cáo dự kiến trên nền tảng đã chọn.

### B7. Kiểm tra và xác nhận

- Hiển thị toàn bộ thông tin chiến dịch.
- Yêu cầu xác nhận trước khi lưu hoặc gửi.
- Không tự chạy quảng cáo trả phí.

### B8. Quản lý và thông báo

- Hiển thị chiến dịch trong danh sách.
- Trạng thái phải rõ ràng.
- Gửi thông báo Telegram khi có sự kiện phù hợp.

## 5. Chức năng kỹ thuật và mức độ hoàn thiện

### 5.1. Chức năng cần có

Website phải hỗ trợ:

- Tạo và lưu chiến dịch/bản nháp.
- Gợi ý tiêu đề, nội dung, đối tượng, khu vực hoặc ngân sách.
- Tính toán ngân sách dự kiến.
- Kiểm tra thông tin thiếu.
- Xem trước và chỉnh sửa.
- Hiển thị danh sách chiến dịch với trạng thái rõ ràng.

Có thể dùng dữ liệu mẫu, Local Storage, cơ sở dữ liệu đơn giản, thuật toán quy tắc hoặc AI. Tuy nhiên, website phải thao tác được, không chỉ là tập hợp màn hình tĩnh hoặc ảnh thiết kế.

### 5.2. Kết nối nền tảng quảng cáo

Khuyến khích dùng API/SDK quảng cáo chính thức nếu có tài khoản và quyền hợp lệ. Nếu dùng bộ kết nối mô phỏng thì phải trình bày đúng:

- Phương thức xác thực dự kiến.
- Dữ liệu tạo chiến dịch.
- Cách gửi và nhận trạng thái.
- Cách xử lý lỗi.
- Điều kiện chuyển sang tích hợp thật.

Bắt buộc phân biệt các trạng thái:

- Bản nháp.
- Mô phỏng.
- Chờ phê duyệt.
- Đã gửi nền tảng.
- Đang chạy thực tế.

Chỉ hiển thị trạng thái thực khi có dữ liệu xác nhận từ hệ thống tương ứng.

### 5.3. Telegram - phải có kết quả thực tế

Sử dụng Telegram Bot API hoặc phương thức phù hợp để gửi thông báo thật từ website. Tối thiểu, sau khi người dùng hoàn tất lưu/xác nhận chiến dịch, tin nhắn phải xuất hiện trên Telegram với:

- Tên chiến dịch.
- Nền tảng.
- Ngân sách.
- Thời gian.
- Trạng thái.

Ứng viên phải trình diễn được tin nhắn gửi trong lúc kiểm tra.

Có thể mở rộng thông báo thiếu thông tin, lỗi tích hợp, yêu cầu quản lý phê duyệt và cập nhật trạng thái. Bot Token, khóa API và thông tin nhạy cảm không được công khai hoặc đưa vào kho mã nguồn.

## 6. Kế thừa mã nguồn mở và sử dụng AI

Được phép và khuyến khích sử dụng GitHub, GitLab, mã nguồn mở, thư viện, framework, template, SDK, API, n8n, Node-RED và công cụ AI lập trình.

Có thể lấy hệ thống sẵn có làm nền tảng rồi nghiên cứu, chỉnh sửa, kết nối và cải tiến; không bắt buộc viết từ số 0. Cần minh bạch:

- Phần tự làm.
- Phần kế thừa.
- Phần AI hỗ trợ.
- Các chỉnh sửa cụ thể.
- Giới hạn còn tồn tại.

Phải tuân thủ giấy phép, quyền sử dụng và yêu cầu ghi nhận tác giả. Không đánh đổi an toàn hoặc tính trung thực để làm nhanh.

## 7. Giới hạn và nguyên tắc an toàn

1. Không yêu cầu ứng viên chạy chiến dịch thật hoặc tự bỏ tiền mua quảng cáo.
2. Không tự kích hoạt chiến dịch trả phí khi chưa có xác nhận hợp lệ.
3. Phải thể hiện rõ ngân sách và bước phê duyệt.
4. Dữ liệu mẫu và API mô phỏng phải được ghi đúng là mô phỏng; không gắn nhãn “đang chạy” khi chưa có kết nối và xác nhận thực tế.
5. Bảo vệ token, mật khẩu, khóa API và dữ liệu người dùng; dùng tệp cấu hình mẫu không chứa dữ liệu thật.

## 8. Thời gian thực hiện và sản phẩm bàn giao

Không giới hạn thời gian. Sản phẩm bàn giao gồm:

1. Website hoạt động, có đường dẫn thử nghiệm hoặc chạy được trên máy.
2. Mã nguồn và hướng dẫn cài đặt, chạy, cấu hình mẫu.
3. Demo từ nhập thông tin, gợi ý, xem trước, xác nhận, lưu chiến dịch đến nhận Telegram thật.
4. Thuyết minh công nghệ, kiến trúc, thành phần kết nối và hướng mở rộng đa nền tảng.
5. Nhật ký thực hiện: thời gian bắt đầu/kết thúc, số giờ, khó khăn, phương án đã thử, công cụ đã dùng và cách tiết kiệm thời gian.
6. Báo cáo mức độ hoàn thiện: chức năng chạy thật, mô phỏng, chưa hoàn thiện và điều kiện cần thêm để vận hành.

## 9. Tình huống trình diễn bắt buộc

**Khách hàng mẫu:** Chủ cửa hàng làm đẹp tại TP.HCM.

- Dịch vụ: Chăm sóc sắc đẹp.
- Địa bàn: TP.HCM.
- Ngân sách: 200.000 đồng/ngày.
- Thời gian dự kiến: 07 ngày.
- Mục tiêu: Có thêm khách hàng liên hệ tư vấn.

Người chưa biết quảng cáo phải có thể thiết lập chiến dịch, nhận gợi ý, xem trước, xác nhận lưu và nhận thông báo Telegram thật. Khi trình diễn phải giải thích trạng thái thực tế của chiến dịch và chứng minh đây là thiết lập quảng cáo có ngân sách, đối tượng và mục tiêu, không chỉ là đăng bài quảng bá trên mạng xã hội.

## 10. Thang điểm đánh giá

| Tiêu chí | Điểm |
|---|---:|
| Nghiên cứu, tự học và giải quyết bài toán mới | 20 |
| Sản phẩm có quy trình thực tế, thao tác được | 20 |
| Kết nối, tích hợp nền tảng quảng cáo và Telegram | 20 |
| Tốc độ triển khai và hiệu quả tận dụng công nghệ | 15 |
| Tư duy UI/UX và đơn giản hóa trải nghiệm | 10 |
| Kiến trúc, mã nguồn, an toàn và khả năng mở rộng | 10 |
| Trình bày, giải thích và minh bạch kết quả | 5 |
| **Tổng cộng** | **100** |

Điểm cộng: API quảng cáo thật hợp lệ, cơ chế phê duyệt, kiểm soát ngân sách, test tự động, kiến trúc đa nền tảng hoặc xử lý lỗi tốt. Tính năng bổ sung không thay thế yêu cầu cốt lõi.

## 11. Câu hỏi khi bảo vệ sản phẩm

1. Trước bài kiểm tra, bạn đã từng xây dựng phần mềm quảng cáo hoặc tích hợp API quảng cáo chưa?
2. Bước đầu tiên khi gặp bài toán hoàn toàn mới là gì?
3. Bạn tự học kiến thức nào và nguồn tài liệu nào hữu ích nhất?
4. Bạn đã kế thừa mã nguồn, thư viện hoặc sản phẩm nào? Vì sao chọn chúng?
5. Khó khăn kỹ thuật lớn nhất là gì? Bạn xác định nguyên nhân và xử lý thế nào?
6. Hãy giải thích luồng gửi Telegram thật, xác thực và xử lý lỗi.
7. Bạn sẽ làm gì để thay bộ kết nối mô phỏng bằng API quảng cáo thật?
8. Nếu thêm Zalo Ads, TikTok Ads và YouTube Ads, làm sao để không viết lại website?
9. Nếu xây dựng lại để hoàn thành nhanh hơn, bạn sẽ thay đổi cách làm ở đâu?
10. Làm thế nào để tránh vượt ngân sách hoặc tự chạy quảng cáo khi chưa phê duyệt?
11. Nếu được giao dự án chưa biết gì, bạn tổ chức nghiên cứu và triển khai ra sao?
12. Nếu đưa sản phẩm ra thị trường phục vụ nhiều doanh nghiệp, ba hạng mục ưu tiên là gì?

## 12. Thông điệp tuyển dụng

BAHA GROUP tìm người biết tự nghiên cứu khi chưa biết, tìm phương án khi gặp khó khăn, kết nối công nghệ sẵn có, sử dụng AI hiệu quả và biến yêu cầu thành kết quả thực tế. Việc chưa từng làm bài toán này không phải bất lợi nếu ứng viên chứng minh được phương pháp tiếp cận và năng lực triển khai.

Ưu tiên tốc độ, hiệu quả và kết quả có thể kiểm chứng; không cần biết tất cả trước khi bắt đầu, nhưng phải minh bạch về giải pháp và giới hạn.
