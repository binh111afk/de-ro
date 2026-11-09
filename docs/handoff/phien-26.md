# Phiên 26 (08–10/11/2026): sửa công cụ vẽ, giao việc cho agent rẻ, dự phòng AI NightRouter

Cách làm mới từ phiên này: Claude viết prompt / thiết kế, **agent rẻ hơn code trên nhánh riêng**, phiên sau Claude **review rồi merge**. Prompt nằm ở `docs/prompt-*.md`.

## VIỆC ĐẦU TIÊN PHIÊN SAU: review và merge 3 nhánh

Không nhánh nào được merge. Mỗi nhánh có file handoff riêng do agent viết; **đọc file đó trước**, rồi đọc diff, chạy kiểm tra, xem bằng mắt trên dev.

| Nhánh | Thư mục worktree | Prompt giao việc | Handoff của agent | Tình trạng (10/11) |
|---|---|---|---|---|
| `feat/keo-nhan` | (đã làm trong thư mục chính, giờ không ai giữ) | `docs/prompt-keo-nhan.md`, `docs/prompt-ten-ham-do-thi.md` | `docs/handoff/keo-nhan.md` | Agent báo xong. 10 commit trước main, sau main 12 |
| `feat/mobile-soan-de` | thư mục chính `dethinhbien` đang ở nhánh này | `docs/prompt-mobile-soan-de.md`, `docs/prompt-leftbar.md` | `docs/handoff/mobile-soan-de.md`, ảnh `docs/handoff/mobile-anh/` | Agent đã làm phần mobile + hiệu ứng trượt tab cột trái. Chưa chắc đã xong hết 5 mục mobile |
| `feat/mau-slide` | `../dethinhbien-mau-slide` | `docs/prompt-mau-slide.md` + 2 đợt sửa giao trong chat (xem dưới) | `docs/handoff/mau-slide.md`, ảnh `docs/handoff/mau-slide-anh/` | Agent đang/đã làm đợt sửa lỗi 2. 7 commit trước main |

Thứ tự merge đề xuất: `feat/keo-nhan` → `feat/mau-slide` → `feat/mobile-soan-de` (mobile đụng nhiều file bố cục nhất, để cuối).

**Chỗ dễ xung đột:**
- `src/examEditor/tools/ToolShell.tsx`: keo-nhan (khung xem trước kéo nhãn) và mobile (modal toàn màn).
- `src/examEditor/SlideSidePanel.tsx`: mau-slide (tab Mẫu) và mobile (hiệu ứng trượt tab, `useSlidingThumb`?).
- `src/examEditor/NavPanel.tsx`: mobile (ngăn kéo + hiệu ứng). Main đã đổi kiểu tab đang chọn (commit `8b8b39c`, `b72bea8`), nhánh mobile đã merge main sau đó.
- `src/lib/plot.ts`: keo-nhan sửa tên hàm cạnh đồ thị; main đã sửa trục ở phiên này.

### Checklist review từng nhánh

**feat/keo-nhan** (kéo thả nhãn trong 5 công cụ + tên hàm theo tiếp tuyến):
- Thiết kế phải đúng prompt: độ lệch lưu ở `spec.labelPos` (đơn vị viewBox), áp ở MỘT chỗ chung trong `renderTool` (cạnh `withTextHalo`), renderer chỉ thêm `data-lbl`. Kiểm `GraphToolModal` cũng áp độ lệch.
- Nhãn tên hàm xoay: `transform="translate(dx dy) rotate(...)"`, translate phải đứng TRƯỚC.
- Hình cũ (không có `labelPos`) vẽ y như trước. Chạy `npm run test:docx`, `test:export`.
- Thử bằng tay: kéo nhãn → Chèn → nhấp đúp mở lại → nhãn còn đúng chỗ; đổi toạ độ điểm → nhãn đi theo; "Đặt lại".
- Thư mục chính từng có file rác của agent: `case1-parabola-and-lines.svg` … `case5-steep.svg`, `docs/handoff/shots/`. Kiểm chúng không bị commit lung tung.

**feat/mau-slide** (tab Mẫu soạn slide: Bố cục | Thiết kế, 8 bộ thiết kế, AI biết bộ thiết kế):
- Người dùng đã chê 2 lần, đã giao 2 đợt sửa trong chat (không có file prompt):
  1. 8 bộ trông y nhau chỉ đổi màu → thêm "skin" ngôn ngữ hình khối từng bộ, lưu `deck.design`, kiểm bằng ảnh trắng đen.
  2. Khung chọn phần tử nhảy loạn khi sát mép slide; font không có dấu tiếng Việt + tương phản chữ/nền kém (phải tính màu nền NGAY DƯỚI chữ); thumbnail không giống slide (bóng đổ tính px không co theo cỡ).
- Kiểm: `npm run test:designs`, `test:export`; xem 8 bộ bằng mắt (khác nhau thật chưa, chữ đọc được chưa); chèn bộ vào bài trống / bài có slide (hộp hỏi 2 lựa chọn) / hoàn tác một bước; xuất PPTX mở được; lệnh AI `apply_design`.
- Khi chèn vào bài đã có slide: đã thống nhất với người dùng là **hỏi** "Đổi cả bài sang giao diện này" / "Giữ giao diện hiện tại, chỉ thêm slide".

**feat/mobile-soan-de** (soạn đề dùng được trên điện thoại + hiệu ứng cột trái):
- Đọc handoff xem agent làm tới mục nào trong 5 mục của prompt.
- Desktop ≥1024px KHÔNG được đổi gì (so ảnh 1440×900). Không dùng `transform: scale` cho trang.
- Chế độ "dàn trang theo màn hình" chỉ đổi hiển thị; xuất Word giống hệt (`test:docx`, `test:export`, `test:convert`).
- Hiệu ứng trượt tab cột trái: khi đứng yên phải giống hệt kiểu trên main (ô nền `bg-clay-soft` 54px căn giữa, gap 8px, không vạch cam). Có commit "thêm top-0 cho ô chỉ báo để không lệch 12px" → xem kỹ căn dọc.
- Thử ở 360, 390, 768, 1440px.

### Nhánh / worktree cần dọn sau khi merge
- `feat/khung-chuong-trinh` + worktree `../dethinhbien-khung`: nội dung đã có trên main từ phiên 25 (nhánh cũ, thiếu file so với main). Xoá được: `git worktree remove ../dethinhbien-khung` rồi xoá nhánh (hỏi người dùng trước khi xoá nhánh remote).
- `../dethinhbien-main`: worktree tạm Claude dùng để commit lên main khi thư mục chính bị agent chiếm. Có file `vite.local.config.ts` (chưa commit, dùng khi nối `node_modules` từ thư mục chính) và 2 file kết quả so sánh model (bị gitignore). Xoá được sau khi xong việc: `node_modules` ở đó là **junction** trỏ sang thư mục chính → xoá junction bằng `cmd /c rmdir …\node_modules` TRƯỚC khi `git worktree remove`, kẻo xoá nhầm `node_modules` thật.
- Thư mục scratchpad còn một worktree mồ côi bị khoá (`wt-main`), đã `git worktree prune`; bỏ qua.

## Đã xong và đã lên main (phiên này)

- **Công cụ vẽ chống che chữ** (`a94dffa`):
  - Đồ thị: bước chia trục 1/2/5×10^k cho 4–8 ô, kéo đầu trục ra bội của bước (y 27 → trục tới 30, mỗi ô 5), hai trục cùng đơn vị.
  - Mọi công cụ: viền trắng quanh chữ (`withTextHalo` trong `src/lib/toolSpec.ts`; bỏ qua chữ có `stroke` hoặc chữ trắng).
  - Hình vẽ (scene): nhãn điểm thử 8 hướng × 2 bán kính, né nét, phía gạch chéo tường/đất, kí hiệu góc vuông.
  - Oxy: chữ vẽ SAU đường cong; mũi tên trục dài thêm 22px, tên trục ở đầu mũi tên.
  - Thống kê: biểu đồ đoạn thẳng có trục ngang là số tăng dần từ 0 → vẽ kiểu đồ thị Lý (mốc 0 ở gốc, chung một số 0, điểm theo giá trị thật).
- **Cột trái (soạn đề + slide)**: tab đang chọn nền cam nhạt, chữ đậm, ô 54px căn giữa, gap 8px (`8b8b39c`, `b72bea8`).
- **Dự phòng AI**: chuỗi giờ là opencode → Mercury → xkiro → **NightRouter `deepseek-v4-flash-0731`** → Claude (`65fc72b`). Biến `NIGHTROUTER_API_KEY`, `NIGHTROUTER_BASE_URL`, `NIGHTROUTER_MODEL`. Đã thêm lên Vercel (production) và đã gọi thử thành công trên bản thật.
- **Script so sánh model** `npm run compare:llm` (`scripts/compare-llm.ts`): 5 bài thử (đề JSON, toán $…$, dàn ý slide JSON, đề thật 40 câu, văn), `--only`, `--delay`, ghi chi tiết token. Kết quả ra `compare-llm-result*.md` (gitignore).
- Các file prompt cho agent: `docs/prompt-keo-nhan.md`, `prompt-ten-ham-do-thi.md`, `prompt-mobile-soan-de.md`, `prompt-leftbar.md`, `prompt-mau-slide.md`.

## Kết quả so sánh nhà cung cấp AI (để khỏi thử lại)

- **FOSTA** (`codex.fosta.app`): mọi kiểu header đều trả "API key required for remote API access" → key chưa bật quyền gọi từ xa. Không dùng.
- **NightRouter** bản `-free`: giới hạn 3 lượt/phút/người → không làm dự phòng được. Bản trả phí: không giới hạn, không tính cache khi proxy không gắn `cache_control`.
- Đo thật đề 40 câu: deepseek-v4-flash-0731 3.248 token ra, 27s, 10đ/lượt (có 1 câu 2 đáp án đúng); claude-sonnet-5 11.786 token ra, 100s, ~35đ; claude-haiku-5-5 có suy nghĩ ngầm tính tiền, chạm 16k token bị cắt đề → loại.
- Soạn một đề = 1 lượt gọi AI (`AiPanel.tsx`); slide = 1 lượt dàn ý + 1 lượt/slide (+1 nếu sửa).

## Việc còn treo (chưa giao ai)

- **Mục lục soạn đề hiện thô công thức** ("Câu 1. Số $472$ gồm:") → phải render math trong `NavPanel` (mục lục).
- **Xuất PPTX** (đã bàn, chưa làm): giữ `pptxgenjs`, làm chắc `src/lib/exportDeck.ts`: (1) dựng cách kiểm file .pptx thật (mở bằng PowerPoint, chụp từng slide so với web, như quy trình Word ở phiên 18), (2) công thức đang `mathToPlain` → ảnh nét cao hoặc OMML, (3) SVG kèm PNG dự phòng, (4) chữ tự co khác giữa web và PowerPoint.
- Từ phiên 25: ô "Khung hình" `GraphToolModal` vẫn ghi miền x cũ khi đã tự mở rộng; hàm phân thức có tiệm cận ngang lớn (vd `(30x+1)/(x−1)`) chỉ thấy một nhánh.
- Từ phiên 24: chất lượng đề AI (đáp án dồn một chữ cái), đề "cuối năm" chỉ lấy HK2.

## Lưu ý cách làm (rút ra phiên này)

- **Hai agent chạy song song phải ở hai thư mục riêng** (`git worktree add ../dethinhbien-<tên> -b <nhánh> origin/main`). Phiên này agent kéo nhãn chuyển nhánh ngay trong thư mục chính → commit docs của Claude rơi nhầm sang `feat/keo-nhan`, phải cherry-pick lại lên main.
- Muốn commit lên main khi thư mục chính đang bị agent chiếm: dùng worktree `../dethinhbien-main` (detached ở `origin/main`, `git push origin HEAD:main`).
- Chạy dev từ worktree có `node_modules` là junction: vite chặn font KaTeX ngoài thư mục → dùng `vite.local.config.ts` (`server.fs.strict=false`).
- Trong Git Bash, chuỗi có `\\` trong heredoc python / `node -e` hay bị mất dấu `\` → sửa file bằng công cụ Edit thay vì script thay chuỗi.
- Hệ thống không cho Claude đọc key từ `.env` để gửi lên dịch vụ ngoài → biến bí mật trên Vercel để người dùng tự dán.
