# Mã QR — Thể lệ chương trình

Tất cả các file đều mã hoá cùng một nội dung: `https://saiza.vn/the-le`

## Chọn kiểu nào

| Kiểu | File | Dùng khi nào |
|---|---|---|
| **Chấm tròn dày** | `saiza-qr-cham-day*` | **Khuyến nghị cho thẻ cào.** Đẹp, hiện đại, mà lượng mực vẫn dày nên quét chắc. |
| Bo tròn liền mạch | `saiza-qr-bo-lien*` | Đẹp nhất và chắc nhất. Dùng cho poster, standee, bao bì. |
| Chấm tròn nhỏ | `saiza-qr-cham*` | Thanh mảnh, nhiều khoảng trắng. Chỉ nên dùng khi in to (≥3cm). |
| Ô vuông cổ điển | `saiza-qr-the-le*` | Bản dự phòng an toàn nhất, không có gì để sai. |

Mỗi kiểu có 4 file:

- `*.svg` — **bản gửi nhà in**, vector thật (circle/path), phóng bao nhiêu cũng nét
- `*-logo.svg` — bản vector có logo SAIZA ở giữa
- `*.png` / `*-logo.png` — 2048px, dùng cho slide, post, thiết kế số

## Thông số

- **Mức sửa lỗi**: H (khôi phục 30% dữ liệu hỏng) — cần cho việc đè logo lên giữa, và chịu được nhoè mực/xước khi in bao bì
- **Lưới**: 29×29 ô + viền trắng 4 ô
- **Màu**: navy `#16213e` trên nền trắng

## Khi in cần lưu ý

- **Kích thước tối thiểu 1,5cm** (thẻ cào nên in 2cm). Đã kiểm chứng bằng cách giải mã ngược ở 120/150/200/300/600/2048px — tất cả đều ra đúng URL — nhưng giải mã từ file sạch luôn dễ hơn camera điện thoại quét giấy in thật, nên cần biên an toàn.
- **Không được cắt mất viền trắng xung quanh.** Quiet zone là bắt buộc theo chuẩn ISO/IEC 18004; cắt sát lưới là nhiều app quét không nhận ra mã.
- **Không đổi màu, không đảo âm bản.** Phải là module tối trên nền sáng.
- **Không kéo méo tỷ lệ.** Luôn giữ hình vuông.

## Nếu cần chỉnh lại kiểu dáng — đọc phần này trước

Script sinh mã nằm ở `gen-final.js` (thư mục scratchpad của phiên làm việc).
Có một cái bẫy đã mắc phải một lần và mất khá nhiều thời gian mới tìm ra:

> **Tuyệt đối không vẽ 3 ô định vị góc (finder) và ô căn chỉnh (alignment)
> thành chấm rời.** Máy quét dò hai vùng này bằng tỷ lệ quét dòng — 1:1:3:1:1
> cho ô định vị, 1:1:1:1:1 cho ô căn chỉnh. Tách chúng thành chấm là tỷ lệ vỡ,
> mã **không giải được** dù toàn bộ phần dữ liệu vẫn đúng.

Triệu chứng rất dễ gây hiểu nhầm: mã vẫn quét được khi thu nhỏ (do ảnh bị nhoè,
các chấm dính lại thành khối đặc) nhưng **thất bại ở độ phân giải cao**, ngược
hẳn với trực giác. Hai vùng đó luôn phải vẽ đặc, chỉ được bo góc.

Sau mỗi lần đổi kiểu dáng, **phải giải mã ngược lại để kiểm chứng** — nhìn mắt
thường không phát hiện được lỗi này.

## Quan trọng: đừng xoá đường dẫn `/the-le`

Mã QR đã in ra giấy thì không sửa được nữa. Đường dẫn `/the-le` khai báo trong
`next.config.ts` (phần `redirects`), trỏ sang trang thể lệ của chương trình
đang chạy.

- **Đổi sang chương trình khác**: chỉ sửa `destination` trong `next.config.ts`. Mọi mã QR đã in vẫn chạy đúng.
- **Tuyệt đối không xoá** entry này, kể cả khi chương trình "Cào nhanh tay — Trúng ngay 500K" đã kết thúc. Xoá đi là mọi thẻ cào, bao bì đã in dẫn vào trang 404.
- Redirect cố ý để `permanent: false` (HTTP 307) chứ không phải 308, để trình duyệt không cache vĩnh viễn đích đến — nhờ vậy đổi chương trình mới có hiệu lực với cả người đã quét trước đó.
