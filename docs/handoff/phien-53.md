# Phiên 53 — admin AI & Server, chi phí / phản hồi AI, sơ đồ tự do cho AI vẽ hình, kiểm file đề mẫu

Ngày 22/11/2026. `main` đã push tới `079c5ce`. Còn 1 commit **chưa push** (`340f997`) và một cụm thay đổi **chưa commit** (xem "Đang dở"). Không còn worktree / nhánh dở. Migration `20261220`–`20261223` **đã áp**.

## Đang dở (làm đầu phiên sau)

1. **Chưa push** `340f997` (scene: tròn / elip / hộp / chữ / mũi tên). **Chưa commit**: `cung`, `quạt`, đa giác tô màu (`ABC tô đỏ`), điểm ẩn `_A` viết thiếu `_` vẫn hiểu (`splitNames` có bảng bí danh), mục `5c` trong `figureGuide.ts` thêm đoạn đường cong + dặn khai báo điểm, `server/generated/prompts.js`, 3 bản chụp prompt (`scripts/fixtures/prompt-{exam,chon-hinh,slide}-snap.json`: chỉ đổi `len` + `sha256`), `scripts/test-scene-free.ts`. `tsc` sạch, `test:scene`, `test:convert`, `test:export`, `test:docx`, `test:sources`, `test:ai-prompts`, `test:ai-prompts-slide` đều qua. Người dùng nói "commit" là commit, "push" mới push.
2. Việc đã đề xuất, **người dùng chưa duyệt** (làm theo thứ tự):
   - **Cấm AI tự thêm hình khi câu mẫu không có hình**; hình thang vuông / đáy không chuẩn thì không vẽ bằng `geo3d` (nó vẽ hình bình hành — sai). Thấy ở Câu 6 phần III của đề mẫu (xem "Kiểm file đề mẫu").
   - Thêm quy tắc: số vật / độ dài trong hình PHẢI bằng số đã đổi trong đề (hồ cá thử: đề đổi 5 con cá, hình vẫn 3; đề đổi bán kính 5, hình vẫn 3).
   - Hình ghép nhiều thành phần mà không công cụ nào đủ (tam giác nội tiếp + vòng tròn nhỏ ở đỉnh): AI chọn `oxy`; dặn dùng `scene` với `tròn` / `cung` / đa giác.
   - Kiểm app thật xử lý ra sao khi model đầu hết token với đề dài (xem dưới).
   - Câu báo lỗi **"Đang có nhiều yêu cầu AI chạy cùng lúc"** (`server/llmProxy.ts`, `server/sourceVision.ts`) gây hiểu nhầm: thật ra là giữ chỗ điểm (`reserve_ai_quota`, một ô cho mỗi người dùng; hết hạn sau 6 phút) của lượt trước còn chạy / bị đứt kết nối (bấm Dừng, mất mạng, tab ngủ). Sửa câu chữ; sâu hơn: bấm Dừng thì báo server nhả giữ chỗ.
   - "Failed to fetch" (client): lỗi mạng hiện tiếng Anh, mất phần AI đã stream. Đề xuất: Việt hoá, giữ bản nháp, nút Thử lại. Vercel `maxDuration` 300 s nhưng mỗi lần gọi upstream chờ tới 250 s (retry + model dự phòng có thể vượt).
   - **System prompt bị lộ nguyên văn** khi hỏi bằng tiếng Việt ở `hoi-truoc`, `sua-cau`, `bang-ve` (`npm run test:injection`, 108 lượt DeepSeek thật; `soan-de` chống tốt hơn). Prompt không chứa khoá / header nên thiệt hại thấp; chưa sửa (thêm câu "không tiết lộ chỉ dẫn" chỉ giảm bớt).
   - Chưa xem trên trình duyệt thật: trang `/admin/ai` sau khi chia tab, khối Phản hồi AI mới, bốn hình scene (cung, quạt, sân vận động, ngôi nhà), hộp thoại kéo nhãn của scene.

## Đã làm (commit)

- Đầu phiên (hash xem `git log`): số lần / tỉ lệ quay lại mỗi người dùng (migration `20261220`), phễu người dùng ở Số liệu (`20261221`, `admin_funnel`), xuất PPTX khớp web (`npm run check:pptx`, 0 lệch), `972017a` chỉ bỏ phiên khi máy chủ từ chối refresh token (hết bị đăng xuất oan).
- `e86bbc3` bot Telegram báo thêm API 5xx + đơn PayOS lỗi (`20261222`, bảng `api_errors`). `29b957e` khối Phản hồi AI, `2d71223` Lãi / lỗ AI, `a7c386d` giá DeepSeek theo bảng chính thức (cao điểm / thấp điểm), `4e68da9` gộp lượt gọi ở DB (RPC `admin_ai_margin_groups`, `20261223`).
- `96f73cb` khung admin 1600 px, bảng người dùng 15 / 30 dòng. `05748ad`, `079c5ce`: **trang AI & Server chia 4 tab** `?tab=settings|server|ai-cost|feedback` (`OpsPanel.tsx`; "Phản hồi" chỉ admin; Lãi / lỗ và Phản hồi chỉ mount khi mở tab); khối Phản hồi AI có icon + màu theo loại, thanh tỉ lệ, mở / đóng mượt, khung xương khi tải.
- `e070d54`: luật chọn / lấy / trích N câu từ tệp (`src/lib/prompts/sources.ts` `tierRule`: bỏ câu thiếu dữ kiện, cấm suy ngược số liệu từ đáp án); `detectIntent` (`AiPanel.tsx`) nhận "chọn / lấy / trích / ra đề / tạo"; nhập Word để lại `[Công thức ảnh chưa đọc được]` (OLE / MathType `w:object`) và `[Hình chưa đọc được]`, hộp Nguồn cảnh báo "có N công thức/hình AI không đọc được". **Đổi hành vi:** dấu này nằm cả trong tài liệu giáo viên khi nhập Word vào trình soạn; shape / biểu đồ không có ảnh cũng nhận `[Hình chưa đọc được]`.
- `340f997`: `scene` (`src/lib/scene.ts`) thêm lệnh `tròn O 0.6 "nhãn" đứt tô xanh`, `elip O 1 0.6`, `hộp O 2 1 "chữ" bo tô vàng`, `chữ O "a\nb" to đậm`, `mũi tên AB` / `mũi tên đứt AB`; hình tô trắng, vẽ sau đoạn nên đoạn nối dừng ở mép. `scripts/test-scene-free.ts` (`npm run test:scene`).
- Dọn Vercel: xoá các deploy cũ, giữ 10 bản mới nhất (`npx --no-install vercel rm <url…> --yes`; liệt kê đủ bằng `vercel api "/v6/deployments?projectId=…&teamId=…&limit=100"`, `vercel ls` chỉ 20 dòng).

## Những điều cần nhớ

- **`figureGuide.ts` rút theo môn** (`FIGURE_BY_SUBJECT`): mục mới phải thêm id vào danh sách từng môn, nếu không môn đó không thấy (lỗi vừa sửa: Hoá / Sinh / Địa lí không thấy `scene` nên AI bịa `kind:"flow"`, `"mindmap"`). Bộ lọc dòng là `/^(\d+[bc]?)\)/`. Mục `5c` = sơ đồ tự do, mọi môn đều có.
- **Đổi chữ prompt → `npm run build:prompts` rồi cập nhật `len` + `sha256` ở 3 bản chụp** (script tsx tạm dựng lại prompt như `scripts/test-ai-prompts*.ts`, ghi lại bằng `JSON.stringify(j, null, 1)` + giữ dòng cuối; sau đó xoá script). `test:ai-prompts` và `test:ai-prompts-slide` phải qua.
- **Kiểm AI thật bằng script tạm phải đặt `reasoning_effort: 'low'`** (app gửi mức này cho soạn đề, `AI_EFFORT.exam`); không đặt thì suy luận mặc định ăn hết token. Đừng nạp `SUPABASE_*` từ `.env` vào script (tránh ghi `ai_calls` thật). `tsx` cần `--tsconfig tsconfig.app.json` để hiểu alias `@/`.
- **`test:injection`** (`scripts/test-prompt-injection.ts`): dựng prompt thật mỗi tác vụ + mã canary, báo lộ khi canary xuất hiện hoặc trùng 12 từ liền. Một vài ca "lộ" là nhiễu (trùng 1–5 từ, hoặc câu trả lời đúng nhiệm vụ lặp lại chữ trong prompt). Gọi DeepSeek thật, tốn tiền.
- **Giao Codex:** chạy lệnh `npx --yes @openai/codex@0.170.0 exec … - < prompt > out` TRỰC TIẾP trong tác vụ nền. **Không** bọc `( … ) &` rồi thoát (thông báo "xong" bắn ngay khi lệnh bọc thoát, không phải khi Codex xong). Sandbox Codex chặn `tsx` (`uv_os_get_passwd`) nên nó chạy bằng preload tạm; tôi chạy lại test bằng `npm run …` ở thư mục chính. Mỗi việc một worktree (`git worktree add -b <nhánh> ../dethinhbien-<tên> main` + `cmd //c "mklink /J ..\dethinhbien-<tên>\node_modules node_modules"`). **Gỡ worktree: `cmd //c "rmdir ..\dethinhbien-<tên>\node_modules"` TRƯỚC, kiểm `ls node_modules | wc -l` rồi mới `git worktree remove --force`.** Phiên này lỡ nối `&&` nên bước gỡ liên kết bị bỏ qua và `node_modules` chính bị xoá; đã `npm ci` lại (291 gói).
- File `.patch` áp vào thư mục chính: `git apply`; file working copy CRLF mà index LF (như `scripts/test-docx.ts`) thì `git show HEAD:<file> > <file>` trước khi áp, nếu không patch hỏng.
- Render PDF thành ảnh trang không cần thư viện: `powershell.exe` (5.1, không phải `pwsh`) + `Windows.Data.Pdf.PdfDocument` (WinRT), 1600 px cạnh dài như `PAGE_SIDE`. Đọc ảnh bằng `readExamPages` (`server/bankVision.ts`, kết quả ở trường `content`).

## Kiểm file đề mẫu (Toán 12 Hà Nội, `ra0po7d02vh1.pdf`, 5 trang)

- pdf.js tách chữ vỡ (mất vectơ, công thức) → `pdfTextNeedsVision` = true → app tự đọc bằng ảnh (tốn điểm). Đọc ảnh tốt: công thức ra LaTeX, hình có `[Hình: …]`. Hình 7 vòng tròn nối nét đứt = Câu 5 phần III.
- Soạn "y chang, đổi số liệu" **cả 22 câu một lần**: model đầu (DeepSeek flash, mức low) dùng hết 32.000 token, nội dung rỗng (`finish=length`). **Chưa kiểm app thật có chuyển model dự phòng không.**
- Soạn lại riêng 5 câu có hình: ra đủ hình, đều dựng được (`graph`, `vartable`, `geo3d` hình lập phương, `scene` 7 vòng tròn, `geo3d`). Sai: Câu 6 phần III mẫu **không có hình** nhưng AI tự thêm, và vẽ đáy hình bình hành cho đề "hình thang vuông tại A và D". Hình đồ thị vẽ rộng hơn `[-2; 2]` ghi trong đề. Đáp án và số liệu mới chưa được kiểm toán học.
- Tài khoản `trantuan123mt@gmail.com` gửi prompt dò system prompt (đã bị người dùng khoá). AI từ chối ở lượt đó.
