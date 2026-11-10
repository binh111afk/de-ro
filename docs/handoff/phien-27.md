# Phiên 27 (10/11/2026): gộp 3 nhánh agent, sửa mẫu slide, LLM dự phòng, Xáo đề

Gộp trên nhánh `tich-hop-27` (worktree `../dethinhbien-main`), thứ tự keo-nhan → mau-slide → mobile-soan-de. Đã push main, worktree và nhánh local đã dọn.

## Đã làm
- `feat/keo-nhan`: gộp sạch. `applyLabelPos` đúng thiết kế (một chỗ trong `renderTool`, translate đứng trước rotate). Modal Đồ thị có nút "Di chuyển nhãn".
- `feat/mau-slide`: xung đột `package.json` (thêm `test:designs`). Agent thêm 2 theme (`bang-den`, `vang-nang`) nhưng không sửa test, `test:slide-theme` và `test:slide-plan` hỏng (agent báo pass là sai) → đã sửa số theme 6 → 8.
- `feat/mobile-soan-de`: xung đột `SlideSidePanel.tsx` (import + thân panel). Giữ props mới của TemplatesPanel (theme, design) và cấu trúc `tabId`/`isMobileSheet` của nhánh mobile.
- Kiểm: tsc sạch; docx, export, convert, designs, slide-theme/plan/layout, markdown, online, grading, guard đều qua. Xem trên dev: desktop 1440 không đổi, 360px không cuộn ngang, tab Mẫu → Thiết kế hiện 8 bộ, không lỗi console.

## Đợt sửa 2 của mau-slide (Claude làm)
- **Khung chọn nhảy sát mép**: nguyên nhân là khung viền trang trí rỗng của skin (nền trong suốt, phủ ~95% slide) bắt mọi cú bấm vào vùng trống/gần mép. Giờ hình rỗng chưa chọn chỉ nhận chuột ở dải viền 10px (`isHollowShape`, `HOLLOW_HIT` trong `SlideEditor.tsx`).
- **Tương phản chữ**: `src/lib/slideContrast.ts` (`readableElements`) tính màu nền ngay dưới chữ (ô tô của chữ → hình đặc nằm dưới che tâm chữ → nền slide); dưới 3:1 thì đổi sang `theme.fg` hoặc mực đậm/trắng. Chỉ đổi lúc vẽ (editor, thumbnail, trình chiếu, in, PPTX), không ghi vào dữ liệu. Test `npm run test:slide-contrast` (8 bộ × mọi bộ màu).
- **Bóng thumbnail**: bóng cứng `6px 6px` → `0.6cqw 0.6cqw`, co theo cỡ slide.

---

## Đã push main

| Commit | Nội dung |
|---|---|
| `2e92d70` | Chữ slide đọc được trên nền ngay dưới (`src/lib/slideContrast.ts`, chỉ áp khi vẽ). Khung viền rỗng không bắt nhầm cú bấm. Bóng cứng co theo cỡ slide. |
| `d6edd2b` | Tab Mẫu chỉ vẽ hình xem trước khi cuộn tới (`LazyThumb`), nhớ sẵn slide của bộ thiết kế (`designPreview`). |
| `9e4e571` | FOSTA `gpt-6-luna` làm **dự phòng 2** trong `server/llmProxy.ts`: DeepSeek → Mercury → FOSTA → xkiro → NightRouter → Claude. Vercel production đã có `FOSTA_API_KEY`, `FOSTA_BASE_URL`, `FOSTA_MODEL`. |
| `b83882a` | Mẫu **Trẻ trung** dùng Nunito, mẫu **Học thuật** dùng Lora + Be Vietnam Pro, nền trắng ngà, có slide chuyển phần riêng. Cả 8 bộ: `circle` → `ellipse`, rect có radius → `round`. `buildDesignSlides` giữ id theo vai trò (trước bị đổi thành uid nên kicker/phụ đề mẫu mất). PPTX: font web → Arial/Georgia. |
| `e31be0c` | Tab Thiết kế thành lưới 2 cột (chỉ ảnh bìa + tên). Bấm mẫu mở pop-up xem trước: mũi tên ‹ ›, bộ đếm, dải ảnh nhỏ, nút Thêm vào bài. Bố cục thống kê: thẻ không khớp từ khoá lấy icon chung để cả hàng đều có icon. |
| `f2db7e8` | Mục lục Soạn đề (`NavPanel`) và Tạo đề online vẽ công thức bằng `MathText`. Chưa nhìn tận mắt một mục lục có công thức. |

## Đang dở: công cụ Xáo đề (đã push `7d963da`, chưa thử với đề thật)

Tab Công cụ → nhóm **Khác** → **Xáo đề**. Nhóm Khác chỉ hiện khi `ToolsPanel` nhận prop `examDoc`, tức chỉ ở soạn đề; soạn slide và ô ảnh câu hỏi không có.

- `src/lib/shuffleExam.ts`: logic xáo đề.
  - Xáo câu trong từng nhóm câu liền nhau cùng dạng; khối khác chen giữa (đoạn văn, tiêu đề phần) giữ chỗ.
  - Xáo phương án A–D và ý a–d của câu đúng/sai. Bỏ qua câu có phương án kiểu "Cả A và B".
  - Tự luận giữ nguyên. Đánh số lại câu. Thêm dòng "Mã đề".
  - Tách phần đáp án ở cuối đề (`answerSectionStart`) ra khỏi đề phát cho học sinh. File đáp án gồm bảng đáp án từng mã và phần hướng dẫn chấm tự luận.
- `src/examEditor/tools/ShuffleModal.tsx`: modal dùng `ToolShell`. Word xuất .zip (jszip + `buildDocxBlob`). PDF dùng `printDocs` mới trong `exportBlocks.ts`, in một lần, mỗi mã sang trang mới.
- Đường truyền dữ liệu: `ComposeDoc` (`activeDoc`) → `NavPanel` (`examDoc`) → `ToolsPanel`.
- Test: `npm run test:shuffle` (`scripts/test-shuffle.ts`) đạt. Trên dev server đã kiểm: zip đủ 4 mã + đáp án, docx có "Mã đề: 101", đáp án mới trỏ đúng phương án.

Còn phải làm:
1. Thử với đề thật do AI soạn, có khối `answerKey` và hướng dẫn chấm, nhất là phần đúng/sai và trả lời ngắn.
2. Thử bản PDF (hộp thoại in).
3. Sửa lỗi nếu có rồi push.

Ý tưởng chưa làm: cho người dùng gõ danh sách mã tuỳ ý (hiện chỉ có mã đầu + số đề), và trộn từ ngân hàng câu hỏi.

## Kết quả so model (để chọn dự phòng)

- **FOSTA:** `gpt-6-luna` nhanh nhất (khoảng 21 giây), làm slide và đề tốt. `gpt-6.1-sol` và `gpt-6-astra` chậm gấp 2–3 lần mà không hay hơn.
- **DeepSeek v4.1 flash (opencode, ưu tiên 1):** đề chuyên Toán tốt nhất nhưng nghĩ lâu. Đề khó mất khoảng 148 giây và 20 nghìn token suy luận; gọi không streaming còn có lần quá 5 phút. Cần xem `upstreamTimeoutMs` trong proxy có ngắt đề khó không (chưa kiểm).
- **NightRouter:**
  - `deepseek-v4.1-flash-1017` gọi được và đang **miễn phí** (usage tài khoản không tăng), nhanh hơn, nhưng 2/5 lần không trả token. Chưa dùng trong app.
  - `qwen3.8-flash` rẻ hơn `deepseek-v4-flash-0731`, nhưng đề chuyên Toán yếu (nghiệm xấu, câu hình tầm thường). Không dùng để soạn đề.
- Cách đo chi phí NightRouter: gọi `GET {NIGHTROUTER_BASE_URL}/dashboard/billing/usage?start_date=…&end_date=…` trước và sau rồi so `total_usage`.
- Gọi opencode bằng tay phải gửi header `x-opencode-session` và `User-Agent`.

## Việc tiếp theo: trang Admin

Đã chốt làm trong repo này, ở `/admin`. Kế hoạch chi tiết, hiện trạng Supabase và 4 câu cần hỏi người dùng: [docs/plan-admin.md](../plan-admin.md).

## Việc treo

- Các mẫu slide khác vẫn dùng font cài sẵn trên máy (Segoe UI, Tahoma, Verdana, Courier New) nên có thể vỡ chữ trên Mac/Android, như Trẻ trung/Học thuật trước khi sửa.
- Bài đã áp mẫu từ trước phải áp lại mẫu mới thấy font và hình mới.
- Nhánh remote `feat/keo-nhan`, `feat/mau-slide`, `feat/mobile-soan-de` đã merge nhưng chưa xoá (lệnh xoá bị chặn). Nhánh local `feat/khung-chuong-trinh` cần `git branch -D`.
- Việc cũ từ phiên 25–26: xem [phiên 26](phien-26.md), [phiên 25](phien-25.md).
