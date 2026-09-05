# Kế hoạch kiểm thử "Tạo file Lark" — trước khi 30 người dùng thật

Tài liệu này liệt kê mọi test case cần chạy tay trước khi đưa hệ thống vào dùng thật tuần sau.
42 test case logic thuần (naming convention, permission matrix, chuẩn hoá dữ liệu...) đã được
tự động hoá bằng Vitest — chạy `npm test`. Phần dưới đây là những gì **không thể** tự động hoá vì
cần tài khoản Supabase/Lark thật, cần trình duyệt thật, hoặc cần 2 người thao tác cùng lúc.

Đánh dấu `[ ]` → `[x]` khi đã test xong. Ghi chú lại nếu phát hiện lỗi mới.

---

## 0. Trước khi bắt đầu

- [ ] Đã chạy migration `0016_security_hardening_round2.sql` và `0017_lark_trash.sql` trong Supabase Dashboard → SQL Editor (chưa tự áp dụng được, xem báo cáo cuối).
- [ ] `npm run build` chạy sạch, `npm test` pass toàn bộ.
- [ ] Đã deploy lên production và xác nhận `curl -I https://saiza.vn/admin/lark` trả `307`.

---

## 1. Thêm nhân viên (nhan-su)

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 1.1 | Admin mời nhân viên mới, **không** gán phòng ban | Nhân viên đăng nhập được; trang Lark hiện "chưa gán phòng ban"; xem mục 1.2 |
| 1.2 | Nhân viên chưa gán phòng ban bật "Mã phòng ban" trong Quy ước đặt tên rồi tạo file | Vì không có `department`, form Tạo file phải **bắt buộc chọn phòng ban thủ công** (không được tạo file thiếu tên phòng ban trong khi toggle đang bật) — kiểm tra `CreateFileModal` có validate đúng không |
| 1.3 | Hai nhân viên trùng tên (VD: 2 người tên "Nguyễn Văn A") | Danh sách "Người tạo"/chia sẻ phải phân biệt được qua email, không gộp nhầm lịch sử tạo file của người này thành người kia |
| 1.4 | Admin xoá/vô hiệu hoá một nhân viên đã từng tạo file, sau đó người khác thử Di chuyển/Xoá file đó | `checkDocPermission` tra `actor_id` từ `audit_log`, nhân viên bị xoá vẫn là "owner" trong lịch sử → chỉ admin (không phải editor) mới thao tác được (đã sửa permission model, xem mục 8) |
| 1.5 | Mời lại (resend invite) một nhân viên đã set password rồi | Không được phép set lại password qua link mời cũ nếu không phải phiên mời hợp lệ (xem mục 8.6) |

## 2. Đăng nhập lần đầu — phân quyền hiển thị

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 2.1 | Đăng nhập bằng tài khoản role `contributor` | KHÔNG thấy tab "Thống kê"; KHÔNG thấy stat tile "File toàn công ty"; "File của bạn" chỉ đếm file của chính mình |
| 2.2 | Đăng nhập bằng tài khoản role `editor` | Giống contributor về hiển thị Lark, nhưng vẫn có quyền xoá Tin tức/Tuyển dụng/Sản phẩm (canDelete) — xác nhận 2 quyền này **không** còn gộp chung với quyền thao tác file Lark của người khác |
| 2.3 | Đăng nhập bằng `admin` | Thấy đủ tab, thấy toàn bộ file công ty, thấy toàn bộ thùng rác của cả app |
| 2.4 | Contributor mở tab Drive, duyệt vào thư mục của phòng ban khác | Hiện được nội dung thật (đây là **thiết kế org-wide theo mặc định của app Lark dùng chung** — xem mục 8.3 để hiểu rõ giới hạn và rủi ro nếu công ty không muốn vậy) |

## 3. Quy ước đặt tên & tạo file — edge case

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 3.1 | Nhập nội dung file toàn dấu cách `"   "` | Báo lỗi "Nhập nội dung/dự án", không tạo file rỗng tên |
| 3.2 | Nhập nội dung file toàn ký tự cấm: `"///"`, `'***"""'` | **Đã fix**: báo lỗi rõ ràng thay vì âm thầm tạo file thiếu mất phần nội dung |
| 3.3 | Nhập nội dung có dấu tiếng Việt + số: `"báo cáo Q3 2026"` | Tên file viết hoa đúng từng từ, giữ dấu: `..._Báo Cáo Q3 2026_...` |
| 3.4 | Chọn loại tài liệu "Khác", nhập tự do có ký tự `/`: `"Báo cáo/Tài chính"` | **Đã fix**: ký tự `/` bị lọc khỏi tên, không lọt ra ngoài thành tên file có `/` |
| 3.5 | Nội dung dài khiến tên file vượt 80 ký tự | Báo lỗi độ dài rõ ràng, không tạo file bị cắt ngang |
| 3.6 | Tạo file trùng tên với file đã có trong cùng thư mục | Lark cho phép trùng tên (không phải filesystem) — xác nhận cả 2 file cùng hiển thị đúng, không bị nhầm lẫn khi Di chuyển/Xoá (thao tác theo `token`, không theo tên) |
| 3.7 | Tạo file, tick "Chuyển quyền sở hữu" | Sau khi tạo, thử Di chuyển/Xoá file đó từ chính app này → phải báo lỗi rõ ràng "đã chuyển quyền sở hữu, thao tác trực tiếp trong Lark" thay vì lỗi khó hiểu |
| 3.8 | Tạo thư mục con trong khi phòng ban chưa có thư mục gốc | Thư mục phòng ban tự tạo đúng 1 lần (không tạo trùng nếu 2 người bấm tạo file gần như đồng thời — xem mục 6.1) |

## 4. Danh sách / tìm kiếm / phân trang

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 4.1 | Vào tab "File của tôi", lọc theo "Thư mục con" | **Đã fix**: cột tiêu đề đổi thành "Tên thư mục" thay vì "Tên file" |
| 4.2 | Danh sách có cả file lẫn thư mục, không lọc gì | Nhãn số lượng hiện "N mục" (trung tính) thay vì "N file" khi trong đó có thư mục |
| 4.3 | Tìm kiếm với chuỗi rỗng sau khi đã gõ rồi xoá | Danh sách trở lại đầy đủ, không bị kẹt ở kết quả lọc cũ |
| 4.4 | Có hơn 10 file trong "File của tôi" | Phân trang xuất hiện đúng, chuyển trang giữ nguyên bộ lọc đang chọn |
| 4.5 | Sắp xếp "Tên A → Z" với tên có dấu tiếng Việt | Sắp xếp đúng theo bảng chữ cái tiếng Việt (không rơi về sau "Z" như sort ASCII thường) |

## 5. Chia sẻ / Di chuyển / Chuyển quyền / Xoá

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 5.1 | Contributor mở menu "..." của một file KHÔNG phải do mình tạo (thấy được ở tab Drive) | **Đã fix**: chỉ admin hoặc người tạo mới thao tác Di chuyển/Xoá/Chuyển quyền được; người khác bị từ chối rõ ràng |
| 5.2 | Contributor thử "Chia sẻ thêm" trên file không phải của mình | **Đã fix (lỗ hổng nghiêm trọng)**: trước đây `shareExistingDocument` không kiểm tra quyền gì cả — ai cũng chia sẻ full_access được cho bất kỳ file nào. Giờ phải bị từ chối giống Di chuyển/Xoá |
| 5.3 | Di chuyển một thư mục vào chính thư mục con của nó | Phải báo lỗi hoặc bị Lark từ chối, không được tạo vòng lặp thư mục |
| 5.4 | Xoá một thư mục đang có file bên trong | Toàn bộ thư mục + file con chuyển vào thùng rác NGUYÊN VẸN thành một khối (không phải xoá rời từng file) — xem mục 6 |
| 5.5 | Popup "..." mở ở hàng cuối cùng gần đáy màn hình | Popup tự lật lên trên thay vì bị cắt (đã fix trước đó — test lại vì có thay đổi code liên quan) |

## 6. Thùng rác (tính năng mới)

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 6.1 | Xoá một file | Toast "Đã chuyển vào thùng rác..."; file biến mất khỏi Drive/File của tôi/Tổng quan; xuất hiện trong tab "Thùng rác" với đúng tên, đúng người xoá, đúng thư mục gốc, "Còn 30 ngày" |
| 6.2 | Xoá một thư mục có file con | Cả thư mục lẫn file con biến mất khỏi Drive **cùng lúc** (di chuyển cả khối); tab Thùng rác chỉ hiện **thư mục** (file con đi theo, không hiện riêng) |
| 6.3 | Khôi phục file từ Thùng rác | File quay lại đúng thư mục cũ; biến mất khỏi Thùng rác; xuất hiện lại đúng vị trí trong Drive/danh sách |
| 6.4 | Khôi phục file mà thư mục gốc **đã bị xoá luôn** (thư mục gốc cũng đang/đã ở thùng rác hoặc đã xoá vĩnh viễn) | Phải tự động khôi phục về thư mục gốc của app (root) thay vì báo lỗi; toast phải nói rõ "đã đưa về thư mục gốc do thư mục cũ không còn" |
| 6.5 | Người KHÔNG phải người xoá (và không phải admin) mở tab Thùng rác | Không thấy nút Khôi phục/Xoá vĩnh viễn của người khác — chỉ thấy dòng "Chỉ người đã xoá hoặc quản trị viên..." (nếu admin xem thấy full quyền, nếu là người khác không liên quan thì không thấy dòng đó trong danh sách của họ luôn — xác nhận đúng theo scoping: contributor chỉ thấy TRASH CỦA CHÍNH MÌNH, admin thấy toàn bộ) |
| 6.6 | Xoá vĩnh viễn ngay (không đợi 30 ngày) | Xác nhận 2 lần (bấm "Xoá vĩnh viễn" → "Chắc chắn xoá?"); sau khi xoá, file KHÔNG còn khôi phục được nữa từ app này |
| 6.7 | Thư mục "🗑️ Thùng rác hệ thống" tự tạo trong Lark | Không được xuất hiện ở: cây thư mục sidebar, danh sách chọn thư mục đích khi Di chuyển/Tạo file, tab Drive khi duyệt root |
| 6.8 | Không có ai xoá gì cả trong 6 tiếng | Việc "quét dọn quá hạn" (`purgeExpiredTrash`) chỉ chạy khi có người load lại trang Lark — đây là **giới hạn đã biết** (không có cron thật), xem mục 9 |
| 6.9 | Nhiều app Lark (SISMO/SAIZA...) | Mỗi app có thùng rác riêng; xoá bên app A không ảnh hưởng thùng rác app B |

## 7. Đồng thời / hai người cùng lúc

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 7.1 | Hai người cùng tạo file vào phòng ban chưa có thư mục, gần như đồng thời | Chỉ 1 thư mục phòng ban được tạo thật trong Lark (đã có cơ chế khoá insert-or-get từ trước) |
| 7.2 | Hai người cùng bấm Xoá cùng một file gần như đồng thời | Người thứ hai phải nhận lỗi rõ ràng (file đã không còn ở vị trí cũ / đã ở thùng rác), không crash, không tạo 2 bản ghi `lark_trash` trùng |
| 7.3 | Người A xoá file, người B đang xem danh sách cũ (chưa reload) bấm Di chuyển đúng file đó | Server phải trả lỗi rõ ràng (file không tìm thấy trong Lark ở vị trí cũ) thay vì thao tác im lặng sai |

## 8. Bảo mật — test case xác nhận từng lỗ hổng đã sửa

| # | Test case | Kết quả mong đợi |
|---|---|---|
| 8.1 | Gọi thẳng `GET {SUPABASE_URL}/rest/v1/lark_contact_cache` bằng anon key (lấy từ bundle JS công khai), không đăng nhập | Phải trả về rỗng/từ chối (RLS bật, không có policy) — **trước khi fix, đây là danh bạ toàn công ty lộ công khai** |
| 8.2 | Tương tự với `lark_drive_cache`, `lark_folders`, `lark_folder_cache` | Phải bị chặn hết |
| 8.3 | Contributor gọi `/api/lark/drive?app=<key-không-tồn-tại>` | Trả lỗi 400 "App không hợp lệ" thay vì âm thầm rơi về app mặc định |
| 8.4 | Đổi mật khẩu qua `/admin/set-password` khi đang **đăng nhập bình thường bằng mật khẩu** (không phải vừa bấm link mời/reset) | Phải bị từ chối, hướng dẫn dùng "Hồ sơ → Đổi mật khẩu" (yêu cầu xác nhận mật khẩu cũ) |
| 8.5 | Đổi mật khẩu qua `/admin/set-password` ngay sau khi bấm link mời thật | Phải hoạt động bình thường (không bị chặn nhầm) |
| 8.6 | Editor thử Di chuyển/Xoá/Chuyển quyền một file KHÔNG phải do mình tạo | Bị từ chối (trước đây editor có quyền như admin trên MỌI file Lark trong công ty — lỗ hổng nghiêm trọng đã sửa) |
| 8.7 | Kiểm tra Console trình duyệt (F12) trên mọi trang `/admin/*` | Không còn cảnh báo/lỗi CSP về script bị chặn (nonce đã được gắn đúng) |

## 9. Giới hạn đã biết (không phải lỗi, nhưng cần bạn biết trước khi vận hành thật)

- **Xoá vĩnh viễn không đúng giờ tuyệt đối**: vì không có cron job thật trên hạ tầng hiện tại, việc dọn thùng rác quá 30 ngày chỉ chạy khi có người mở trang Lark (mỗi 6 tiếng/app tối đa 1 lần quét, tối đa 20 file/lượt). Nếu suốt 30+ ngày không ai vào trang, file quá hạn vẫn nằm im trong thùng rác cho tới lần load kế tiếp — không mất dữ liệu, chỉ trễ dọn.
- **Thùng rác dùng thư mục ẩn trong Lark, không dùng thùng rác gốc của Lark**: vì Lark không có API liệt kê/khôi phục thùng rác của chính họ (đã xác minh với tài liệu Feishu Open Platform). Nếu ai đó vào thẳng Lark (không qua web này) xoá file trong thư mục "🗑️ Thùng rác hệ thống", nó sẽ vào thùng rác THẬT của Lark — lúc đó chỉ khôi phục được qua Lark, không qua web này nữa.
- **Hiển thị Drive vẫn org-wide theo mặc định**: mọi nhân viên (kể cả contributor) thấy được toàn bộ cây thư mục/file thật trong Lark qua tab Drive, không giới hạn theo phòng ban. Đây là hành vi có từ trước, không phải lỗi mới — nhưng nếu công ty muốn giới hạn theo phòng ban thì cần thiết kế thêm (không nằm trong phạm vi đợt sửa này).

---

## Cách chạy phần tự động hoá

```bash
npm test          # chạy 1 lần, dùng trong CI/trước khi deploy
npm run test:watch  # chạy nền khi đang sửa code
```

42 test case hiện có bao phủ: `buildFileName`/`buildFolderName` (mọi tổ hợp segment optional, ký tự cấm, WIP prefix), `normalizeLarkPrefs` (dữ liệu jsonb hỏng/thiếu type), ma trận phân quyền (`canDelete` vs `canManageAnyLarkDoc`), `itemNoun`/`countNoun` (chính là bug "Tên file" cho thư mục trong ảnh bạn gửi), và `departmentLabel` (mã phòng ban null/lạ).
