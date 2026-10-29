# context.md — đề rõ (trình soạn đề thi)

Bản đồ dự án. Đọc file này trước, rồi mở file liên kết cần dùng. Lịch sử và chi tiết không để ở đây nữa, để tránh file quá dài.

> Cập nhật lần cuối: **29/10/2026 (phiên 10)**.

## Đọc gì

- **Bàn giao gần nhất:** [phiên 10](docs/handoff/phien-10.md) (tab Tạo đề online: lịch sử, trình tạo đề, cài đặt làm bài, đăng tuỳ chọn + link; xem lại bài có đáp án đúng/sai; lời giải ở cuối tài liệu), [phiên 9](docs/handoff/phien-9.md) (câu Đúng/Sai và Trả lời ngắn theo đề THPT 2025, `Tệp → Làm đề tương tác`, chấm điểm; nhánh `feat/dung-sai-tra-loi-ngan`), [phiên 8](docs/handoff/phien-8.md) (panel thư viện kiểu Canva, menu Lớp, thanh nổi, màu chủ đạo, 325 icon, ô chữ nhấp đúp; nhánh `feat/slide-panel-ui`), [phiên 7](docs/handoff/phien-7.md) (ribbon danh sách Word, thanh slide dưới đáy kiểu Canva, panel Thành phần/Icon/Mẫu/Tải lên, tab Thành phần), [phiên 6](docs/handoff/phien-6.md) (hồ sơ, kho câu hỏi, kho tài liệu), [phiên 5](docs/handoff/phien-5.md) (trang hồ sơ, đề cộng đồng, thanh tab), [phiên 4](docs/handoff/phien-4.md) (tài khoản Supabase, R2, email), [phiên 3](docs/handoff/phien-3.md) (trình soạn slide), [phiên 2](docs/handoff/phien-2.md) (AI sinh và sửa slide).
- **Việc còn tồn đọng:** [docs/viec-con-lai.md](docs/viec-con-lai.md) (mục 5b là việc tiếp theo sau phiên 10).
- **Lỗi đã gặp và bài học:** [docs/bai-hoc-va-loi.md](docs/bai-hoc-va-loi.md).
- **Lịch sử từng chặng** (mục 3.x, số mục ở các file này vẫn giữ nguyên): [docs/history/muc-3-lich-su.md](docs/history/muc-3-lich-su.md).
- **Bản đồ file:** [docs/ban-do-file.md](docs/ban-do-file.md).

## 0. Vị trí dự án

```
C:\Users\Lenovo\Desktop\workspace\dethinhbien
```

> **Lưu ý:** dự án đã được **chuyển** từ thư mục phiên làm việc cũ
> (`~\.minimax\sessions\mvs_198c7695ae8240c5a34b2d4862cc8661\workspace`) sang vị trí
> trên ngày 22/10/2026. Bản cũ đã được đưa vào Recycle Bin (khôi phục được).
> Từ giờ mọi lệnh `cd` / đường dẫn tương đối phải trỏ về thư mục mới.
>
> Lệnh dev hiện tại (chạy ở cổng 5184 vì 5183 đã được dùng cho bản cũ):
>
> ```powershell
> cd C:\Users\Lenovo\Desktop\workspace\dethinhbien
> npm run dev -- --port 5184 --host 127.0.0.1
> ```

---

## 1. Dự án là gì

Ứng dụng web (React 19 + TypeScript + Vite 6 + Tailwind v4 + TipTap 3) giúp soạn đề
thi tiếng Việt theo mô hình tài liệu Word. Trang **Soạn đề** (`/soan-de`) là trình
soạn thảo chính: full-screen, ribbon nhiều tab, tab strip nhiều đề, dock AI bên trái,
nav pane (mục lục / khối mẫu / tìm kiếm) bên phải, sân giấy A4 thật ở giữa.

**Trợ lý AI nằm ở đâu (quyết định của chủ dự án, không theo GenOffice):** ở
trình soạn đề (`/soan-de`) panel AI ở cột **trái**; ở trình soạn slide panel AI ở
cột **phải** (cột trái là danh sách thumbnail). `AiDock` nhận prop `side="left" |
"right"` để đảo rail, viền panel và hướng nút thu gọn.

Các màn khác: Đề thi của tôi, Thư viện, Cộng đồng, Chấm điểm, Quiz. Slide không có
màn riêng — mọi tài liệu (đề/slide/bảng tính) được tạo và mở từ tab **Bắt đầu**
trong `/soan-de`; `/soan-slide` chỉ redirect về đó.

### Nguyên tắc bất di bất dịch của dự án

1. **`ExamBlock` là mô hình lưu bền vững.** Mọi luồng (AI sinh đề, thư viện, xuất
   Word, in A4) đều đi qua `ExamBlock`. TipTap chỉ là lớp trình bày bên trong.
2. **Một editor TipTap liên tục.** Không clone/split editor theo từng trang, nếu
   không con trỏ và undo/redo sẽ vỡ. Lớp giấy A4 chỉ là hình nền vẽ phía sau.
3. **Không lộ credential.** API key của LLM nằm server-side, đi qua proxy
   same-origin `/api/llm`. Không đưa key vào bundle hay checkpoint.
4. **Tiếng Việt, bám GenOffice/Word** cho phần vỏ giao diện.

---

## 2. Quyết định kiến trúc then chốt

| Quyết định | Lý do |
|---|---|
| TipTap/ProseMirror thay editor cũ | Cần một editor duy nhất liên tục để phân trang không vỡ con trỏ |
| Vẽ lớp giấy `.doc-paper` phía sau `.doc-flow` | Giữ 1 editor, vẫn có trang A4 thật có bóng đổ |
| `ExamBlock` là cầu nối AI ↔ TipTap ↔ Word ↔ in | Không phá vỡ luồng cũ khi chuyển engine |
| Store `compose` chỉ quản lý phiên nhiều tab; tài liệu đã lưu ở `useDocStore` | Tách "đang mở" khỏi "đã lưu" |
| Khối mẫu định nghĩa 1 lần ở `src/examEditor/templates.ts` | Ribbon và NavPanel cùng đọc, không lệch dữ liệu |
| `zoom` (CSS property) chứ không phải `transform: scale()` | `zoom` ảnh hưởng layout → thước kẻ và trang giấy luôn khớp nhau, container giữ đúng bề rộng (giống `.doc-zoom` của GenOffice) |
| Trang A4: 21 × 29,7 cm, lề 2 cm, quy đổi theo 96 dpi | PAGE_W = 794px, PAGE_H = 1123px, MARGIN = 76px |
| Auto-fit co **theo chiều rộng** khung nhìn, giới hạn 25%–130% | Word cũng vậy; bỏ giới hạn 50% cứng vì khi mở cả 2 panel trên màn hẹp thì trang biến mất |

---

## 8. Lệnh

```powershell
# dev (chạy trong thư mục dự án mới)
cd C:\Users\Lenovo\Desktop\workspace\dethinhbien
npm run dev -- --port 5184 --host 127.0.0.1

# chạy tách rời (không bị giới hạn 1 giờ của task nền)
Start-Process cmd.exe -ArgumentList '/c','npm run dev -- --port 5184 --host 127.0.0.1 > dev-server.log 2>&1' -WindowStyle Hidden

# kiểm tra
npx tsc -b --noEmit
npm run build
npm run test:convert    # 12/12 pass
npm run test:markdown   # 14/14 pass (parser markdown của chat AI)
npm run test:export     # 5/5 pass (đánh số + phương án 2 cột khi xuất Word)
npm run test:layout     # 7/7 pass (chọn số cột phương án)
npm run test:grading    # chấm điểm đề THPT 2025: nhiều lựa chọn, đúng/sai (0,1/0,25/0,5/1), trả lời ngắn (≤4 ký tự)
npm run test:online     # đề tạo online: kiểm lỗi câu, xếp theo dạng, dựng đề, đề đăng (doc.online), đề từ trình soạn về bản nháp
npm run test:slide-text # 5/5 pass (chiều cao hộp chữ slide)
npm run test:slide-theme # 4/4 pass (theme v2: normalize/tương phản/catalog)
npm run test:slide-layout # 10/10 pass (layout v1+v2: 14 bố cục/quiz/tone)
npm run test:slide-measure # 9 nhóm pass (đo chữ + fit 19 layout, bất biến không tràn)
npm run test:slide-graphics # 21 nhóm pass (332 đồ hoạ catalog + 80 ornament: registry/search/recolor/layout/prompt)
npm run test:image      # 3/3 pass (prompt tạo ảnh từ nội dung slide)
npm run test:sources    # 4/4 pass (thang nguồn + myDocs)
npm run test:extract    # 4/4 pass (trích docx/pdf/xlsx/csv/pptx)
```

**Cấu hình AI:** điền `LLM_API_KEY` vào `.env` ở gốc dự án (mẫu ở
`.env.example`). `.env` đã bị gitignore. `npm run dev` tự mount `/api/llm`,
`/api/extract`, `/api/search`, `/api/image`; bản production chạy
`npx tsx server/llmProxy.ts` (tự nạp `.env`, mặc định cổng 8787). Search web
(ưu tiên 3) cần thêm `TAVILY_API_KEY`; để trống thì app bỏ qua bước search và
báo trong chat. Tạo ảnh dùng `IMAGE_BASE_URL`/`IMAGE_API_KEY`/`IMAGE_MODEL`
(mặc định Xkiro + `sensenova/sensenova-u1.5-lite`); thiếu env thì server đọc
provider Xkiro từ `~/.zcode/v2/provider_config.json` của máy.

Route ứng dụng: `http://127.0.0.1:5184/soan-de`

**Lưu ý:** dev server chạy trong task nền của MCode sẽ bị dừng sau 1 giờ
(`maxRunMs` 3600000). Nếu bị tắt giữa chừng — đây là hạn chế runtime, **không
phải lỗi code**; kiểm tra `dev-server.log` rồi chạy lại bằng lệnh `Start-Process`
ở trên.

---

## 9. Ghi chú về bản quyền

`_ref/genoffice/` là clone mã nguồn `https://github.com/genspark-ai/genoffice`
(Apache-2.0). Các phần đã port sang dự án này:

| File đích | Nguồn |
|---|---|
| `src/examEditor/icons.tsx` | `apps/docs/src/renderer/components/icons.tsx` |
| `src/examEditor/icons.tsx` (`IconHome`) | `apps/shell/src/renderer/src/TabBar.tsx` → `HomeIcon` |
| `src/examEditor/genoffice-tokens.css` | `packages/ui/src/tokens.css` + `apps/docs/src/renderer/styles.css` |
| `src/examEditor/compose.css` | `apps/docs/src/renderer/styles.css` + `apps/shell/src/renderer/src/tabbar.css` |

Ngoài ra, 3 icon loại tài liệu trong `src/components/docIcons.tsx` **không** port từ
GenOffice — đó là file SVG do người dùn cung cấp, vẽ lại bằng React theo cùng
nét. Logo chính + favicon cũng là file SVG do người dùn cung cấp.

Apache-2.0 cho phép dùng lại kể cả thương mại, chỉ cần giữ phần thông báo bản
quyền. File `icons.tsx` đã có ghi chú attribution ở đầu file.
