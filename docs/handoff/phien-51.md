# Phiên 51 — nhãn chi phí AI, rút gọn lịch sử chat, điểm chào mừng 120, nhánh slide "Chuyên nghiệp"

Ngày 21/11/2026. `main` commit `9821c81` (đã push). Migration `20261212_ai_calls_kind.sql` **đã áp** lên DB `dethinhbien`. Nhánh `feat/slide-chuyen-nghiep` (commit `4bebd00`) **chưa push, chưa gộp** vào `main`.

## Việc phiên sau

1. **Chưa kiểm trên Vercel**: sau deploy, gửi vài lượt (soạn đề, hỏi đáp, slide) rồi chạy
   `select kind, count(*), sum(billed) from ai_calls where created_at > now() - interval '1 hour' group by kind;` — `kind` trống là lỗi.
2. **Màn xem chi phí theo từng người trong Admin** chưa làm: dữ liệu đã có (`ai_calls.user_id`, `kind`, `billed`, `cost`), cần panel tổng hợp theo người × loại việc. Lượt ảnh (`kind='image'`) giờ cũng nằm trong `ai_calls` nên số lượt ở thống kê Admin tăng nhẹ.
3. **Rút gọn lịch sử chat mới chỉ ở khung chat AI của trình soạn** (`AiPanel.tsx`). Chỗ khác có thể gửi lịch sử (ví dụ ngân hàng câu hỏi Admin) chưa đụng. Nếu chat rất dài mà chất lượng giảm: thay phần cắt chữ bằng một lượt model rẻ viết bản tóm tắt.
4. **Nhánh `feat/slide-chuyen-nghiep`**: xem mục dưới. Cần quyết: gộp hay làm tiếp trước.

## Đã làm trên `main`

- **Điểm chào mừng** về 120 (`server/aiQuota.ts`, `Legal.tsx`, mốc thanh điểm ở `Profile.tsx` / `UsersPanel.tsx`). Nếu đổi nữa: sửa đủ bốn chỗ này (từng đổi 120 → 80 → 120). Người dùng cũ không đổi vì quà chỉ cấp một lần. Vercel không có biến `AI_WELCOME_POINTS`.
- **Nhãn loại việc** `aiKind(task, input)` ở `server/ops.ts`; `llmProxy.ts`, `bankVision.ts`, `imageProxy.ts` truyền `kind` (+ `billed` token tính phí) vào `logAiCall`. Nhãn: `task-doc`, `question`, `ask-clarify`, `task-slide`, `task-slide-html`, `edit-slide`, `board`, `web-search`, `task-exam-online`, `edit-question`, `figure`, `bank`, `matrix`, `image`, `vision-source`, `vision-bank`; tên task lạ → `other`, không có task → `untagged`. **Thêm tác vụ AI mới ở `server/aiTasks.ts` thì thêm một `case` ở `aiKind`**, không thì ra `other`.
  `logAiCall` nếu chưa có cột `kind`/`billed` (DB chưa áp migration) tự ghi lại dạng cũ khi PostgREST trả 400, để log và luật miễn điểm lượt hỏng (`FREE_FAIL_FILTER`) không mất.
- **Rút gọn lịch sử chat** `src/lib/aiHistory.ts` (`compactHistory`), dùng ở `AiPanel.tsx`: chat dưới 3.000 ký tự giữ nguyên; dài hơn thì giữ 6 tin gần nhất (mỗi tin ≤ 1.500 ký tự), tin cũ gộp thành một khối tóm tắt ≤ 1.800 ký tự (mỗi tin một dòng, cắt đầu). Không gọi model. Test: `npm run test:ai-history` (gồm cả test `aiKind`).
- **Lời báo của AI viết Markdown** (đậm, gạch đầu dòng) ở soạn đề, sửa đề, bảng vẽ: dặn trong `src/lib/prompts/exam.ts` và `slideTasks.ts`; sửa prompt thì phải cập nhật bản chụp `scripts/fixtures/prompt-*-snap.json` (xem phiên 50).

## Nhánh `feat/slide-chuyen-nghiep` (chưa gộp)

Chế độ "Chuyên nghiệp" cho AI slide, tốn thêm điểm, bật bằng nút cạnh "Tìm trên web" (hộp thoại Hủy / Bật / Bật không hỏi lại).

- **Layout mới** (`src/lib/slideLayouts.ts`): `bignum`, `photo-full`, `photo-compare`, `bars`; trường `credit` (dòng nguồn) ở chân mọi layout. Chỉ mở cho AI khi `pro === true` (`slideCatalogText(true)`); không bật thì prompt y hệt cũ.
- **Prompt chuyên nghiệp**: `slidePlanSystem(pro)` + `proSpecBlock` ở `slideAi.ts` (trường `imagePrompt`, `image2Prompt`, `credit`). Client vẽ ảnh nền từ mô tả bằng `/api/image` (Agnes → SenseNova), `buildPhotoPrompt` ở `imageGen.ts`; prompt có "No text" thì `imageProxy.ts` **không** dặn thêm "chữ tiếng Việt" (dặn thì model vẽ chữ vào ảnh).
- **Font + kiểu chữ**: 12 gói `@fontsource/*` nạp lười (`src/lib/slideFonts.ts`), cặp font theo bộ thiết kế (`slideTheme.ts`, `slideDesigns.ts`); viền / bóng / gradient / uốn cong chữ (`slideTextEffects.ts`, `SlideTextEffectsTool.tsx`). Chữ uốn cong xuất PPTX thành ảnh PNG (không sửa được trong PowerPoint); font Google không nhúng được vào PPTX.
- `scripts/build-server-prompts.mjs` có plugin bỏ qua `@fontsource` để gói prompt của server không kéo font vào.
- **Thử thật**: deck Điện Biên Phủ 8 slide đẹp hơn rõ so với bản thường; chưa bằng bộ mẫu `bom hạt nhân` (ảnh còn là ảnh AI dựng). **Chưa kiểm**: điểm AI thật (mỗi ảnh 5 điểm, deck 4 ảnh thêm ~20 điểm), Vercel, xuất PPT, tải lười font ở bản thật.
- **Còn thiếu / hay gặp**: ảnh lịch sử là cảnh dựng nhưng chú thích ghi cụ thể ngày, nơi (chân slide có "Ảnh minh hoạ do AI tạo"); ảnh thật từ Wikimedia Commons chưa làm (cần cho slide tư liệu, ghi nguồn + giấy phép); font Caveat thiếu vài chữ có dấu (Ơ, Ư); slide đầu trống do mặc định còn nguyên sau khi tạo deck; vài slide vẫn dùng bộ màu nhẹ nên chưa đều tay; chưa chốt mức điểm cộng thêm của Pro.
- Ảnh chụp và so sánh model ảnh nằm ở `scripts/_ref/` (không commit): Agnes ~10 giây/ảnh, SenseNova ~33 giây nhưng giàu chi tiết hơn; cả hai chỉ ra ảnh vuông 1024².

## Cách làm việc với Codex (ghi lại cho lần sau)

- Gọi: `npx --yes @openai/codex@0.170.0 exec -m gpt-6.2-sol --sandbox workspace-write -C . -i <ảnh> - < prompt.txt`; `-i` đính kèm ảnh để nó xem. Chạy nền, rồi review diff + `tsc` + test; không commit được trong sandbox.
- Nếu working tree đang có file chưa commit từ lượt trước, Codex **dừng lại hỏi** (theo AGENTS.md mục 1) và phiên không tương tác nên đứng im. Thêm đầu prompt: "đây là phiên không tương tác, các file đã sửa là kết quả lượt trước đã review, cứ làm tiếp, không hỏi, không commit". Dùng `git stash create` để chụp mốc trước khi giao lượt tiếp, review lượt sau bằng `git diff <mốc>`.
- Sandbox chặn mạng: `npm install` hỏng, Vite không đóng gói được; nó dựng bản tĩnh để chụp. Gói mới phải tự `npm install` sau.
- Không giao việc prompt AI, tiền, migration, bảo mật cho Codex. Đây là phiên: Codex làm UI + layout + font; prompt, server, tính điểm là phần làm tay.
- `sed -i` trong Git Bash làm CRLF thành LF cả file (đã gặp ở `UsersPanel.tsx`, `SlideEditor.tsx`); sửa file CRLF bằng script Node đọc, đổi `\r\n`→`\n`, sửa, ghi lại đúng kiểu; kiểm `git ls-files --eol`.
- Python không có trên máy; viết script bằng Node. Heredoc làm hỏng `\n` trong chuỗi: ghi file bằng công cụ Write.
- Khi dev server (preview_start) đã chạy trước khi sửa `server/*`, prompt cũ vẫn dùng: tắt và mở lại.
