# Phiên 12 — Lưu theo tài khoản, đề đã xuất bản + báo cáo học sinh, trợ lý AI trong tạo đề online (30/10/2026)

## Làm gì

### 1. Hộp thoại, ô tích, xem trước đề (giao diện dùng chung)
- `components/Dialog.tsx`: `dialog.alert/confirm/prompt` (hàm bất đồng bộ, hàng đợi, `<DialogHost />` gắn ở `App.tsx`) thay toàn bộ `alert/confirm/prompt` native (9 chỗ). Việc không hoàn tác được: nút màu đất, focus ở "Huỷ".
- `components/ui.tsx` `Checkbox`: ô tích có hiệu ứng vẽ dấu tick, vẫn là `<input>` thật ẩn (bàn phím, đọc màn hình). Thay 4 chỗ (FindPanel, BackgroundMenu, BankModal, OnlineBuilder). `components/Segmented.tsx`: thanh chọn có thẻ trượt.
- Tạo đề online: nút **Xem trước đề** (cả đề trên một trang, công tắc Hiện đáp án) trong `OnlineBuilder.tsx`.
- Sửa nhỏ: trang đăng nhập/đăng ký cuộn được khi hẹp (`Auth.tsx`); thanh slide đáy tự cuộn tới slide đang chọn (`SlideStrip.tsx`); mục điểm AI ở hồ sơ (`Profile.tsx`, vẫn là số mẫu).

### 2. Lưu theo tài khoản (Supabase), không chỉ localStorage
- Bảng `user_items (owner_id, kind, id, data jsonb, updated_at)`, RLS chủ sở hữu. `lib/sync.ts` đồng bộ 4 loại: `online` (lịch sử tạo đề), `doc` (đề trong trình soạn), `deck` (bài giảng slide), `upload` (ảnh đã tải lên cho slide, `store/uploads.ts`).
- Khi đăng nhập: kéo về, gộp theo `updatedAt` (bản sửa sau thắng), mục chỉ có trên máy và chưa từng đồng bộ thì đẩy lên, mục từng đồng bộ mà máy chủ không còn thì bỏ. Sau đó đẩy mỗi thay đổi sau ~1,5 giây, từng mục một request. Bản đệm của người khác (đổi tài khoản trên cùng máy) bị bỏ.
- Dấu vân tay (hash JSON) quyết định có đẩy hay không, nên **đổi tên** cũng đẩy; `renameDoc/renameDeck` cũng cập nhật `updatedAt`.
- Ảnh base64 cũ trong đề/slide tự được đẩy lên R2 rồi thay bằng đường dẫn khi đồng bộ (`externalizeImages`); panel Tải lên của slide giờ đẩy R2 ngay.
- Trình soạn tự lưu tab có thay đổi mỗi 5 giây (trước chỉ lưu khi rời trang) trong `ComposeDoc.tsx`.
- Test: `npm run test:sync` (máy chủ giả, 7 nhóm tình huống). Bản đệm cũ khoá `dethinhbien-online-sync` không còn dùng.

### 3. Đề đã xuất bản + kết quả học sinh (tạo đề online)
- Hai mục (seg): **Lịch sử tạo đề** / **Đề đã xuất bản** (`OnlineList.tsx`, `OnlinePublished.tsx`).
- Xuất bản hai kiểu: **Cho học sinh** (chỉ link, `community_exams.listed = false`) hoặc **Lên cộng đồng** (`listed = true`). `lib/onlinePublish.ts` `publishItem(item, listed)`; đã xuất bản thì **cập nhật đúng bản đó** (giữ link, kết quả). `lib/community.ts`: `listMyPublished`, `setListed`, `unpublish`; `getCommunityDoc` đọc qua RPC `get_shared_exam` (đề chỉ-link không lộ ở danh sách công khai).
- `exam_attempts` + `lib/attempts.ts`: học sinh nộp bài (ai cũng nộp được, kể cả chưa đăng nhập; chỉ chủ đề đọc). `Quiz.tsx` gửi kết quả khi nộp, hỏi tên bằng `dialog.prompt` nếu chưa đăng nhập; chỉ cho đề có `importedFrom` là uuid. Thẻ báo cáo: lượt làm, người làm, điểm TB (thang 10), phổ điểm 4 mức, top 3 (bằng điểm thì ai nhanh hơn xếp trên); cửa sổ "Kết quả" liệt kê từng học sinh. Gỡ xuất bản xoá luôn bài làm (cascade).
- Test: `npm run test:attempts` (`summarize`).

### 4. Trợ lý AI trong tạo đề online
- `components/OnlineAiBox.tsx` + `lib/onlineAi.ts`: một ô nhập ở đầu vùng soạn; gõ một yêu cầu thì AI soạn và **tự thêm** câu vào đề. **Không có khung hội thoại, không có dòng phản hồi** (chủ dự án chốt): lúc chờ hình "Trợ lý giấy" (`public/brand/ai-static.svg` → `src/assets/ai-assistant.svg` động) đổi sang bản động, ô nhập khoá, nút gửi thành Dừng. Lỗi hoặc không soạn được câu nào thì hiện `dialog.alert`.
- Dấu **+** đính kèm file (`.docx/.pdf/.txt/.md`, tối đa 5, đọc bằng `readImportFile`): chip "N file đính kèm" (bấm mở modal danh sách, từng file có X; X trên chip bỏ tất cả). Nội dung file nối vào yêu cầu (mỗi file ≤20k ký tự, tổng ≤40k).
- AI trả JSON `{message, questions[]}`; `sanitizeAiQuestions` chuẩn hoá theo `questionIssue` (bỏ nhãn "A.", đúng/sai từ mảng hoặc chuỗi, đáp án trả lời ngắn ≤4 ký tự, tối đa 30 câu). Phương án trắc nghiệm được **xáo** (model hay đặt đáp án đúng ở A), trừ câu có "cả A và B…". Mỗi lần là một yêu cầu độc lập, không nhớ lượt trước.
- Test: `npm run test:online-ai`.

## Thay đổi Supabase (dự án `dethinhbien`, ref `ddcyhsxytbcdpgpggexh`) — **chưa có file migration trong repo**
- Migration `user_items`: bảng + RLS 4 chính sách theo `owner_id = auth.uid()`.
- Migration `publish_attempts`: cột `community_exams.listed boolean default true`; thay chính sách SELECT công khai bằng `listed or owner_id = auth.uid()`; thêm chính sách UPDATE cho chủ; hàm `get_shared_exam(uuid)` (security definer, `search_path = ''`, grant cho anon/authenticated); bảng `exam_attempts` (FK `community_exams` on delete cascade, ràng buộc tên 1–60 ký tự, `0 ≤ score ≤ max_score`), INSERT cho anon/authenticated (`user_id is null or = auth.uid()`), SELECT chỉ chủ đề.
- Muốn dựng lại ở nơi khác: xuất hai migration này thành file trong `supabase/migrations/` (đã hỏi chủ dự án, chưa làm).

## Chưa làm / giới hạn
- Chưa chặn spam nộp bài (ai có link nộp nhiều lần được; tên học sinh tự nhập, không xác thực). Chưa thống kê theo từng câu (cần lưu đáp án từng câu). Học sinh chưa tự xem bảng xếp hạng.
- Chưa đồng bộ: `store/app.ts` (`myExams`, kết quả cá nhân), danh sách tab đang mở, lịch sử chat AI ở trình soạn. Một mục quá lớn cho một request vẫn ở lại máy (lỗi nuốt êm, thử lại lần đổi sau).
- Trợ lý AI chỉ **thêm** câu, chưa sửa/xoá câu có sẵn; không có Hoàn tác (bỏ theo yêu cầu); chưa thử đính kèm `.docx/.pdf` qua ô này (chỉ thử `.txt`); chưa trừ điểm AI theo token thật (mục điểm ở hồ sơ vẫn là số mẫu).
- Đề đã đăng bằng `publishDoc` ở trang Cộng đồng (nút "Đăng đề") tạo bản mới mỗi lần, không cập nhật bản cũ.
- Chưa thử đăng nhập thật cho đồng bộ đề trong trình soạn và slide (đã thử thật với lịch sử tạo đề, xuất bản, kết quả, ảnh R2).

## Lưu ý khi làm việc (rút từ phiên này)
- **localStorage tách theo địa chỉ**: `127.0.0.1:5184`, `localhost:5184` và cổng khác là các nơi riêng. Đề soạn trước phiên 12 nằm trong trình duyệt/địa chỉ chủ dự án hay dùng, không phải ở tab xem trước của app. Đăng nhập ở đúng nơi đó thì đồng bộ sẽ đẩy lên tài khoản.
- Dọn dữ liệu thử trong tab xem trước: chỉ xoá đúng đề mình tạo (theo id **và** tên). Lệnh xoá cả danh sách bị chặn là đúng, tab đó chứa đề thật của chủ dự án (`a`, `de-mau`).
- Không tạo tài khoản hay nhập mật khẩu hộ người dùng; để họ đăng nhập trong khung xem trước rồi dùng phiên đó.
- Python/bash qua heredoc: `\n` trong chuỗi Python thường thành xuống dòng thật trong file TS (xảy ra hai lần phiên này), heredoc có nháy lẫn lộn làm cả lệnh hỏng không tạo file. Dùng công cụ Write/Edit cho file có chuỗi chứa `\n`/regex.
- Ảnh chụp tab xem trước bị cắt ở ~800px và đôi khi hết giờ chờ; khi đó đo bằng `getBoundingClientRect`/`scrollWidth` thay vì dựa vào hình. Viewport mobile của tab báo `innerWidth` khác 375.
- Dev server: `preview_start` chạy cổng 5184 khi cổng trống (tắt tiến trình Vite cũ trước); nó gắn với session. Tab xem trước (`localhost:5184`) là trình duyệt riêng, không có phiên đăng nhập của người dùng.

## Việc tiếp theo gợi ý
1. Thử đăng nhập thật ở trình duyệt chủ dự án để đồng bộ đề trong trình soạn và slide; xem có mục nào quá lớn không đẩy được.
2. Xuất hai migration thành file trong repo; chặn spam nộp bài (bắt đăng nhập hoặc giới hạn theo thiết bị) nếu muốn xếp hạng nghiêm túc.
3. AI sửa/xoá câu đã có; thống kê theo câu (câu sai nhiều); trừ điểm AI theo token thật.
4. Đồng bộ `store/app.ts`.
