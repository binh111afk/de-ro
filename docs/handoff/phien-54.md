# Phiên 54 — 23/11/2026: giao việc agy/Codex hàng loạt, Muse API, điểm thấp, bảng tràn trang

Mọi thứ đã commit và push lên `main` (tới `aa5709f`). Repo chỉ còn nhánh `main`; mọi worktree agy/Codex đã gỡ (còn sót thư mục thường `../dethinhbien-agy-mon` do file Word đang mở — xoá tay được). **Chưa thử trên web thật** phần lớn các sửa dưới đây.

## Đã làm (commit)

| Commit | Nội dung |
|---|---|
| 885187b | `server/bankVision.ts`: DeepSeek đọc ảnh nguồn tắt thinking (`thinking:{type:'disabled'}`) → 12 s thay vì 44 s / 3 trang |
| bed8400, 19f442d, a3bb8eb | AiPanel: bước "Đọc nguồn" đếm giây; đề dài chia lượt hiện như một lượt (Suy nghĩ → Viết đề N/T câu); lời báo xong giọng cộng sự (`mergeChunks` ở `src/lib/examSplit.ts`) |
| d6a0528, 7f25858, 58ff318 | Codex sửa hình + soạn đề (bảng LaTeX, đồ thị, chóp 3D, KaTeX trong chat, Word đồng vị/`\mid`, đề online). Sanitizer kết quả AI chuyển sang `src/examEditor/examAiResult.ts` |
| f2125c3 | Hướng dẫn chấm tự luận dạng bảng Phần/Câu/Nội dung/Điểm: `src/lib/scoringTable.ts` |
| c453b9e, 14e55a9, 4736981 | agy: đọc file nguồn, hình Venn/hoá/electron/chóp, slide thẻ tới 6 |
| 47c57db, e95dda0 | **Muse API** (bot ngoài, chỉ đọc) — xem dưới |
| 7176c3b | Codex: 9 nhóm lỗi slide; "xoá câu 6 và xáo đáp án" giờ sửa đúng câu bằng logic Xáo đề, từ chối kết quả AI làm mất hình; "Lưu ý" lặp; nhãn biểu đồ đường (`stats.ts`); lưu đồ không đè (`scene.ts`); điểm phần + LaTeX ở mục lục đề online. File mới `src/lib/slideStarter.ts` |
| 8f5062f | **Điểm thấp**: `/api/llm` trả 429 `quota` trước khi giữ chỗ nếu số dư dưới ngưỡng (4.000 token cho đề/slide/tài liệu, 512 việc ngắn); sát ngưỡng thì tắt thinking DeepSeek + bỏ opencode; rỗng do `finish_reason=length` khi trần bị kẹp thì dừng fallback, báo quota (cả SSE). Client: `AiQuotaError` (`src/lib/llm.ts`), AiPanel hiện nút Nạp điểm, slide từ dàn ý giữ slide đã tạo. Nguyên nhân gốc: user antooo5113 chờ ~4,5 phút/lượt vì `llmProxy.ts` kẹp `max_tokens` theo số dư |
| aa5709f | agy: **bảng dài tràn qua khe trang** — `computeRichPagePlan` ở `src/examEditor/pagination.ts`: dòng bảng sang trang sau, ô cao (>240px) ngắt giữa các `<p>`, khối answerKey/essay/rubric/bullets dài ngắt bên trong; `ExamEditor.tsx` thêm mask + `.doc-split-lines` vẽ viền đóng/mở. Test `npm run test:pagination`. Chưa thử gõ trong ô đang vắt trang, chưa thử In trên UI, chưa thử một `<p>` dài hơn một trang |

## Muse API

- `GET https://dero.id.vn/api/muse-stats` (rewrite trong `vercel.json` → `/api/admin?muse-stats=1`; không tạo hàm mới vì Vercel Hobby đã đủ 12 hàm). Header `x-muse-token`, so với `MUSE_STATS_TOKEN` (sha256 + timingSafeEqual). Không đặt token = endpoint tắt. 405 nếu không phải GET; 20 lượt/10 phút/IP trước khi kiểm token, 1 lượt/phút sau đó.
- `MUSE_WATCHLIST`: danh sách email/tên/UUID, hoặc `*` → thêm `accounts` (tối đa 200, chỉ `name`, `points_left` (-1 = không giới hạn), `exams`, `slides`; tên chứa email/UUID/SĐT thay bằng email đã che) và `accounts_total`.
- Code: `server/adminMuseStats.ts`; test `npm run test:admin-muse-stats`.
- **Người dùng còn phải:** đặt `MUSE_STATS_TOKEN` + `MUSE_WATCHLIST=*` trên Vercel rồi redeploy. Chưa gọi thử trên production.
- **KHÔNG sửa `src/pages/Legal.tsx`** cho tới khi Bộ Công Thương duyệt hồ sơ (BCT quét thấy trang quyền riêng tư đổi sẽ không duyệt). Khi duyệt: thêm vào mục 5 dòng "Công cụ tự động hỗ trợ người vận hành theo dõi tình trạng hệ thống: chỉ đọc số liệu tổng hợp và thông tin sơ bộ của tài khoản (tên hiển thị, số điểm AI còn lại, số đề và slide đã tạo); không đọc email, mật khẩu hay nội dung đề, slide của bạn, và không thay đổi được dữ liệu." — cùng lúc đổi email liên hệ (AGENTS.md mục 7).

## Cách giao việc đã dùng (người dùng muốn tiết kiệm token Claude)

Claude chỉ chẩn đoán, viết prompt, rà, gộp; sửa code giao agy/Codex.

- **agy CLI** (chạy không giao diện): `C:\Users\Lenovo\AppData\Local\agy\bin\agy.exe -p "<prompt>" --model gemini-4-hydrogen-medium --dangerously-skip-permissions --output-format text > eval-out/agy-log.txt`. Người dùng đã đồng ý `--dangerously-skip-permissions`. Hết quota dễ → chạy **lần lượt**. Log có dòng giữa chừng, đừng coi log có chữ là xong; tiến trình có thể treo sau khi xong việc (kill PID).
- **Codex**: `npx --yes @openai/codex@0.170.0 exec -m gpt-6.2-sol --sandbox workspace-write -C <worktree> - < eval-out/prompt.md`. Không commit được, không có mạng. **Đừng chờ bằng `tasklist | grep codex`** (dịch vụ `codex-windows-sandbox-ser` luôn chạy) — xếp hàng bằng một chuỗi lệnh tuần tự hoặc chờ `grep "tokens used"` trong log job trước.
- Worktree: `git worktree add ../dethinhbien-<tên> -b <nhánh>`, junction `node_modules` bằng PowerShell với đường dẫn tuyệt đối, chép `.env` nếu cần AI thật, prompt + log + ảnh ở `eval-out/`.
- Gộp: trong worktree `git add -A -- src scripts server` + commit "wip"; ở main `git merge --squash <nhánh>` rồi commit message tiếng Việt. Gộp xong: `npm run build:prompts` ở main (bản build trong worktree chứa đường dẫn junction) và cập nhật bản chụp prompt nếu `test:ai-prompts` / `test:ai-prompts-slide` lệch do gộp hai nhánh.
- Gỡ: xoá junction `node_modules` trước (`(Get-Item ... -Force).Delete()`), rồi `git worktree remove --force`, `git branch -D`.
- `tsx` chạy file lẻ không hiểu `@/` → dùng các script npm có `--tsconfig tsconfig.app.json`.

## Việc phiên sau

1. Kiểm trên web thật (sau deploy): bảng chấm Văn dài (gõ trong ô vắt trang, In/PDF); "xoá câu N và xáo đáp án" giữ đủ hình; sửa slide; tài khoản ít điểm thấy báo hết điểm + nút Nạp điểm ngay, không chờ.
2. Người dùng đặt env Muse trên Vercel; gọi thử `curl.exe -H "x-muse-token: <token>" https://dero.id.vn/api/muse-stats`.
3. Chờ BCT duyệt → Legal.tsx mục 5 + đổi email liên hệ.
4. Các file prompt `docs/prompt-agy-*.md`, `docs/prompt-codex-sua-hinh-de.md`, `docs/mau-cham-van.webp` chưa track — không commit.
