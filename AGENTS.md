# AGENTS.md — luật chung cho mọi AI làm trong dự án này

> Bắt buộc đọc hết file này **trước khi làm bất cứ việc gì**, rồi đọc `context.md` (bối cảnh, bản đồ code, bẫy hay gặp).
> Áp dụng cho mọi agent: Claude Code, Claude/Gemini trong Antigravity (agy), ZCode/GLM, Codex…

## 1. Bắt đầu và kết thúc phiên

- **Đầu phiên:** đọc `AGENTS.md` → `context.md` → `git status` + `git branch --show-current` + `git log --oneline -5`. Có thay đổi chưa commit mà không phải của mình thì hỏi người dùng, đừng đè.
- **Người dùng bảo "ghi context":** cập nhật `context.md` để agent khác (không thấy cuộc trò chuyện này) làm tiếp được: việc vừa xong (kèm commit), việc đang dở + bước tiếp theo, quyết định đã chốt và lý do, bẫy mới gặp. Viết gọn, xoá thông tin đã cũ; chi tiết dài đưa vào `docs/handoff/` hoặc `docs/bai-hoc-va-loi.md`. Luật mới người dùng dặn mà áp dụng lâu dài → ghi vào **file này**, không chỉ vào bộ nhớ riêng của công cụ.
- **Hai agent không làm cùng lúc trong cùng một thư mục.** Làm lần lượt; muốn song song thì mỗi agent một worktree / nhánh riêng và cổng dev riêng.
- Xoá worktree: nếu trong đó có `node_modules` là liên kết về dự án chính thì `unlink <worktree>/node_modules` **trước**, rồi mới `git worktree remove` (không thì nó xoá theo liên kết, mất `node_modules` chính).

## 2. Git

- Chỉ commit / push / merge khi người dùng bảo. Áp migration Supabase cũng chỉ khi được bảo; thứ tự: áp migration → kiểm trên DB → push.
- Trước mỗi commit kiểm lại nhánh hiện tại (agent khác có thể đã đổi nhánh). Việc được giao qua file prompt thì làm trên nhánh ghi trong prompt, không commit lên `main`.
- Không đưa vào commit: `.claude/`, `.rls-audit/`, `.strix/`, `public/brand/logo-120*.png`, `scripts/probe-imports.mts` và mọi file chưa track không phải của mình.
- Commit message tiếng Việt, dạng `feat(vùng): …` / `fix(vùng): …` / `docs: …`.

## 3. Sửa file — CRLF

Nhiều file dùng **CRLF** (không có `.gitattributes`, `core.autocrlf=false`). `sed -i` và Python `open()` ghi text thường sẽ đổi **cả file** sang LF → diff phình hàng nghìn dòng, gộp nhánh xung đột cả file.

- Sửa bằng công cụ sửa file của agent, hoặc script đọc/ghi **bytes** giữ nguyên kiểu xuống dòng.
- Sau khi sửa: `git ls-files --eol <file>` (cột `i/` và `w/` phải giống nhau) và `git diff --stat` (file chỉ đổi vài dòng mà báo hàng trăm dòng là đã hỏng → khôi phục).

## 4. Giao diện

- **Không thêm chữ thừa:** không dòng phụ giải thích, câu trấn an, chú thích kỹ thuật, hướng dẫn hiển nhiên, mô tả lặp tiêu đề. Chỉ giữ chữ cần để quyết định / thao tác (nhãn, lỗi, cảnh báo thật). Viết giọng bình thường, không khẩu hiệu kiểu AI ("X, không phải Y").
- **Dùng lại component có sẵn** trước khi tự làm: tìm trong `src/components` (+ `ui.tsx`). Đã có: `Segmented`, `SiteSelect` (thay `<select>`), `Pager` + `usePaged`, `dialog` (`Dialog.tsx`), `Button` / `inputClass` / `Badge` / `Spinner`, `Portal`, `ProgressBar`, `DocIcon`, `ColorPalette`, `HexInput`, `ContextMenu`. `src/examEditor/Dropdown.tsx` chỉ dùng cho ribbon trình soạn, không dùng ở trang thường. Cần cái mới thì đặt vào `src/components` để dùng chung.
- Không tự đề xuất / thêm tính năng mới cho trình soạn khi người dùng không yêu cầu.
- Giao diện tiếng Việt, bám Word / PowerPoint / Canva.

## 5. Code

- Không ghi đường dẫn tuyệt đối ra ngoài dự án (`C:/Users/.../Downloads`, worktree, scratchpad) vào code / script. File người dùng gửi thì chép vào dự án rồi đọc bằng đường dẫn tương đối.
- Key LLM chỉ ở server (`/api/llm`); client gọi API bằng `apiFetch`.
- Không thêm thư viện khi chưa hỏi.
- Kiểm kiểu: `npx tsc -p tsconfig.app.json --noEmit` (không dùng `tsc -p .`). Dev: `npm run dev -- --port 5184 --host 127.0.0.1`.
- Báo kết quả trung thực: chưa chạy thử / chưa kiểm thì nói rõ là chưa.

## 6. Chia việc

- Việc cần phán đoán, thiết kế, bảo mật, kiểm đúng sai: agent mạnh tự làm.
- Việc dài, máy móc, đã rõ cách làm: viết `docs/prompt-<việc>.md` tự đủ (file cần đọc, việc cụ thể, điều cấm, cách kiểm, nhánh riêng, mẫu báo cáo) để người dùng giao cho agent khác; agent mạnh review rồi mới merge.
- **Gọi Codex từ agent khác** (đã dùng ở phiên 49): `npx --yes @openai/codex@0.170.0 exec -m gpt-6.2-sol --sandbox read-only -C <thư mục> - < prompt.txt` (rà lỗi, chỉ đọc) hoặc `--sandbox workspace-write` trong một worktree riêng (viết test, sửa nhỏ); đăng nhập sẵn bằng ChatGPT của người dùng. Tốt ở rà lỗi và viết test có chạy kiểm; **không commit được trong worktree** (sandbox chặn `index.lock`) nên agent gọi phải tự rà diff, chạy lại test rồi commit. Không giao việc tiền, bảo mật, migration, prompt AI. Gửi mã lên OpenAI bằng tài khoản người dùng: chỉ làm khi người dùng bảo.

## 7. Việc chưa làm (đang chờ điều kiện)

- **Đổi email liên hệ sang `lienhe@dero.id.vn`** (đã chạy được: DNS iNET + ImprovMX chuyển tiếp về Gmail chủ dự án, kiểm 22/11/2026). **Chưa đổi trên web** vì hồ sơ đã nộp Bộ Công Thương (`docs/dang-ky-bct/`, 8 file PDF) ghi `afkbinh1412007@gmail.com`; thông tin trên web phải khớp hồ sơ. Giữ `CONTACT.email` ở `src/lib/contact.ts` như cũ cho tới khi người dùng báo hồ sơ đã được duyệt. Khi đó: (1) người dùng cập nhật thông tin liên hệ trên cổng Bộ Công Thương và chờ xác nhận; (2) đổi `CONTACT.email`; (3) sửa email trong các PDF của `docs/dang-ky-bct/` (thư mục chưa commit, không có script sinh; nội dung các điều khoản cùng nguồn ở `src/pages/Legal.tsx`). Chưa làm: trả lời thư bằng đúng `lienhe@dero.id.vn` (cần Resend làm SMTP + Gmail "Gửi thư với tư cách"); alias `*` trên ImprovMX đang nhận mọi địa chỉ, xoá nếu chỉ muốn `lienhe`.
