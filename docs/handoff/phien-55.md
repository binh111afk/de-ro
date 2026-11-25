# Phiên 55 (24–25/11/2026): nâng cấp AI vẽ hình, sửa khung AI soạn đề, xoá khối mẫu

Mọi thứ dưới đây đã gộp vào `main` và push (commit cuối `f1090ce`). Chưa thử trên bản chạy thật Vercel.

## Đang dở (làm đầu phiên sau)

**Lỗi "AI chưa trả lời được câu hỏi này."** khi giáo viên gõ "câu 5 không khó lắm, cho hình khó và phức tạp hơn".
- Nguyên nhân: `examIntent` (`src/lib/aiDocContext.ts`) không thấy chữ gợi ý sửa đề ("cho hình", "khó hơn", "phức tạp hơn") nên đoán `chat`; AI lại trả JSON sửa đề (đúng ý giáo viên) → `invalidChat` trong `AiPanel.tsx` (khoảng dòng 1382) báo lỗi.
- Hướng sửa đã chốt nhưng CHƯA làm: (1) `invalidChat` thì áp JSON vào đề như lượt `doc` thay vì báo lỗi; (2) thêm gợi ý `khó hơn`, `dễ hơn`, `phức tạp hơn`, `cho hình`, `thay hình` vào `examIntent`; thêm test vào `scripts/test-exam-ai.ts`.

## Đã xong

### AI vẽ hình (`scene` và các công cụ hình)
- `src/lib/scene.ts` tách thành thư mục `src/lib/scene/` (`types`, `style`, `geom`, `parse`, `render`, `build`). `build.ts` = tiền xử lý: nới cú pháp + lệnh dựng điểm (`M = trung điểm AB`, `H = hình chiếu A lên BC`, `I = AC cắt BD`, `X = AB cắt tròn O 3`, `P = tròn O 5 góc 30`, `quay`, `đối xứng`, `tiếp tuyến…`, `đều n …`, `lưới…`, `trụ lưới…`, `đường AB kéo dài`).
- Nới cú pháp theo lỗi thật của model (danh sách đầy đủ ở test `scripts/test-scene-free.ts` mục 9–14). Nguyên tắc: model viết sai kiểu gì phổ biến thì cho bộ đọc hiểu luôn, đừng chỉ dặn trong prompt.
- **Kho hình mẫu** `src/lib/prompts/sceneExamples.ts` (47 mẫu): server chọn tối đa 3 mẫu theo từ khoá đề (`pickSceneExamples`, so khớp bỏ dấu) rồi ghép CUỐI system prompt `chon-hinh` (phần đầu giữ nguyên → vẫn trúng cache, bản chụp prompt không đổi khi đề không khớp mẫu). Client gửi đề qua `task.input.text` (`docRewrite.ts` `planTool`).
  - Luật thêm mẫu: tags phải đặc trưng (không dùng `tam giác`, `hình vuông`, `tiếp tuyến`, `góc nâng`…), không làm mẫu cho dạng đã có công cụ riêng (`geo3d`, `lens`, `incline`…), mọi điểm đề gọi tên phải DỰNG bằng lệnh, xem bằng mắt trong trình duyệt (đổi PNG bằng `@napi-rs/canvas` mất chữ).
- Bộ vẽ tự nới khung khi chữ tràn mép (`render.ts`, biến `ext`).
- `oxy.ts` hiểu `E(-0,5; 0,5)` và `A C`; `geoConstruct.ts` hiểu `đường tròn (O; 5)`; hướng dẫn mục 4 chỉ dùng Oxy khi đề cho toạ độ.
- Đo (DeepSeek chính hãng, chấm gắt bằng mắt): đề có mẫu 5.3 → 7.9; hình tuyển sinh 10 nhiều giao điểm 5.5 → 7.5. Kết quả đo ở `eval-out/` (không commit): `scene-eval-wt/` (bộ đề, script `run.ts` có `PROVIDER=DEEPSEEK|FOSTA|ANYROUTER|NIGHTROUTER`, `STREAM=1`, `NO_EX=1`, `CASES_FILE`, `OUT_ROOT`), `hinh-kho/`.
- Thử model khác (FOSTA gpt-6.x, AnyRouter terra): không hơn DeepSeek flash; gpt-6.1-terra nhanh gấp 5–10 lần, chất lượng gần bằng.

### Khung AI soạn đề (`AiPanel.tsx`, `aiDocContext.ts`)
- "ngay tại đây / trong khung chat / không cần ghi vào đề" → trả lời trong chat; AI trả chữ thay vì JSON thì hiện câu trả lời, không báo lỗi.
- Có tệp đính kèm → dòng cam "Có tệp đính kèm, lượt này có thể tốn nhiều điểm hơn." (`.ai-attach-cost`).
- Server đổi nguồn AI: không còn hiện "lỗi kết nối" / "Thử lại với model dự phòng" (không lộ kiến trúc); bước đang chạy lặng lẽ làm lại.

### Server AI (`server/llmProxy.ts`)
- DeepSeek suy luận cạn hết 32.000 token mà chưa viết chữ nào (gặp thật 24/11, đề "tập trung câu khó"): lần 2 gọi lại cùng mức suy luận + dặn nghĩ ngắn, lần 3 tắt suy luận, rồi mới sang FOSTA → AnyRouter → NightRouter → Claude. Test `npm run test:ai-stream`.
- **opencode bỏ khỏi chuỗi** (key `LLM_API_KEY` bị 403). Chỉ bật lại khi đặt `OPENCODE_FALLBACK=1` (hai test AI dùng nó làm upstream giả). Có thể xoá `LLM_API_KEY` trên Vercel.

### Soạn đề: xoá khối mẫu (`src/examEditor/deleteActions.ts`)
- Khối chỉ còn vỏ (câu hỏi rỗng còn nhãn "Câu 1.") → Backspace xoá hẳn, kể cả khi đứng đầu đề.
- Backspace/Delete ở mép khối không còn chọn nguyên đoạn bên cạnh (bấm thêm là mất đoạn đó); chỉ lùi con trỏ. Đầu đề hai cột xoá qua được cả hai cột.

### Khác
- Gộp nhánh nhập Word → đề tương tác (`70b21ae`) và nhánh scene; worktree scene đã gỡ, nhánh đã xoá.

## Bẫy mới
- agy CLI hay treo sau khi làm ("root agent idle; waiting for background task"), lệnh tắt bị chặn → kiểm giờ sửa file; quá lâu không đổi thì tự làm tiếp. agy lần này viết 50 mẫu mà không chạy test lần nào.
- Bộ đề chấm phải để NGOÀI worktree agent (scratchpad) và soạn TRƯỚC khi giao việc, không thì agent đưa lời giải đề chấm vào prompt (đã gặp vòng 1).
- NightRouter trả 524 khi model nghĩ > 100 s: gọi kiểu stream.
- Sửa câu trong `figureGuide.ts` phải cập nhật 3 bản chụp (`scripts/fixtures/prompt-exam-snap.json`, `prompt-chon-hinh-snap.json`, `prompt-slide-snap.json` mục `BOARD_OPS_GUIDE`) và chạy `npm run build:prompts`.
