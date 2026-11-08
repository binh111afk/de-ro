# Prompt: thêm 7 tính năng cho công cụ "Đường tròn lượng giác"

> Dán toàn bộ file này cho model làm việc. Model làm trong repo `C:\Users\Lenovo\Desktop\workspace\dethinhbien` (web soạn đề thi tiếng Việt: React 19 + TypeScript + Vite). Đọc `context.md` trước.

## Bối cảnh

Công cụ vẽ đường tròn lượng giác sinh SVG từ một ô văn bản, **mỗi dòng một lệnh**. Hiện hỗ trợ:

- Góc: `π/6`, `-2π/3`, `5pi/4`, `150°`, `150 độ`, số (radian).
- Họ nghiệm: `π/4 + kπ/2` (rải đủ điểm), `x = …` ở đầu cũng được.
- Đặt tên điểm: `M: pi/3` → chấm có tên M, số đo ghi cạnh cung (khi chỉ có một góc).
- Tuỳ chọn `projections` (nét đứt chiếu xuống trục cos, sin) và `tan` (trục tan).
- Một góc duy nhất → vẽ cung mũi tên từ A tới điểm.

## File liên quan (đọc hết trước khi sửa)

| File | Vai trò |
|---|---|
| `src/lib/mathExtra.ts` | `TrigSpec`, `parseAngle`, `anglesOf`, `renderTrigSvg` — **chỗ sửa chính** |
| `src/examEditor/tools/MoreToolModals.tsx` | `TRIG_HELP` (bảng trợ giúp cú pháp) + `TrigModal` (form cho giáo viên) |
| `src/lib/docRewrite.ts` | `FIGURE_GUIDE` mục 8 (hướng dẫn AI) + `toolFromRaw` case `'trig'` (đọc cấu hình AI trả) |
| `src/data/bankFigures.ts` | câu kho `hinh-toan11-luonggiac-01` dùng `{ kind: 'trig', angles: 'M: pi/3' }` — không được làm hỏng |

`toolSpec.ts`, `toolImages.ts`, `ToolsPanel.tsx`, `DocSelectionAi.tsx` đã có `trig`, không cần sửa trừ khi thêm field mới vào spec cần khai báo.

## Yêu cầu: 7 tính năng

Giữ nguyên cú pháp cũ (tương thích ngược). Lệnh mới là **dòng có từ khoá**, còn dòng không có từ khoá vẫn hiểu là góc / họ nghiệm như cũ. Từ khoá viết tiếng Việt, không phân biệt hoa thường, chấp nhận cả bản không dấu.

1. **Ghi giá trị trên trục khi chiếu** — field mới `values: boolean` (mặc định `false`, checkbox "Ghi giá trị cos, sin trên trục"). Bật thì ở chân hình chiếu ghi giá trị đẹp: `0, ±1/2, ±√2/2, ±√3/2, ±1`; góc không "đẹp" thì ghi `sin α` / `cos α` dạng chữ (hoặc số thập phân 2 chữ số — chọn một, ghi rõ trong help). Nhãn trục sin đặt bên trái trục dọc, trục cos đặt dưới trục ngang, không đè nhau khi nhiều điểm trùng giá trị (gộp nhãn trùng).

2. **Trục cot** — field `cot: boolean` (checkbox "Vẽ trục cot"): đường ngang `y = 1` (tiếp tuyến tại B), mũi tên sang phải, nhãn `cot`. Giống `tan`: nối tâm O qua điểm, kéo dài tới trục cot, chấm giao điểm, nét đứt.

3. **Tô cung (miền nghiệm)** — lệnh `tô: π/6 → 5π/6` (chấp nhận `->`, `→`, `đến`; `to` không dấu). Vẽ cung đậm (stroke dày ~4, màu nhấn `#c0392b`) chạy **ngược chiều kim đồng hồ** từ góc đầu tới góc cuối. Thêm `]`/`[` hoặc `(`/`)` ở hai đầu để biểu thị đầu mút lấy/không lấy: `tô: [π/6 → 5π/6)` → chấm đặc ở đầu lấy, chấm rỗng (fill trắng) ở đầu không lấy. Không có ngoặc thì mặc định chấm đặc cả hai. Cho phép nhiều dòng `tô:`.

4. **Đường thẳng y = a / x = a** — lệnh `y = 1/2`, `x = -√2/2`, `y = 0,3` (chấp nhận `sqrt(3)/2`, `√3/2`, phẩy hoặc chấm thập phân). Vẽ đường nét liền mảnh xuyên qua đường tròn (dài hơn đường kính chút), ghi nhãn giá trị ở đầu đường (trục sin với `y =`, trục cos với `x =`). Nếu |a| ≤ 1 thì chấm 2 giao điểm với đường tròn. **Lưu ý:** dòng `x = π/3 + kπ` (họ nghiệm cũ) KHÔNG được hiểu là đường thẳng — phân biệt bằng: vế phải có `π`/`pi`/`k`/`°` → góc/họ nghiệm; còn lại là số → đường thẳng.

5. **Nối điểm thành đa giác** — lệnh `nối: M N P` hoặc `nối: họ` (nối tất cả điểm của họ nghiệm theo thứ tự góc tăng, khép kín). Cho phép tô nhạt bên trong: `nối tô: …` (fill `#1f5fbf` opacity 0.08). Điểm phải có tên (khai báo bằng `M: π/3`) hoặc là điểm họ nghiệm.

6. **Cung giữa hai điểm có tên** — lệnh `cung: M N` (cung ngược chiều kim đồng hồ từ M tới N, nét vừa, có mũi tên ở N), tuỳ chọn nhãn: `cung: M N "α"` ghi nhãn ở giữa cung, phía ngoài đường tròn. Không còn giới hạn "chỉ khi có một góc".

7. **Điểm theo toạ độ** — `M(1/2; √3/2)` hoặc `M(-0,6; 0,8)`: chấm điểm có tên tại đúng toạ độ (quy về bán kính 1; nếu không nằm trên đường tròn, sai số > 0,02, thì vẫn vẽ nhưng báo lỗi dòng "điểm không nằm trên đường tròn đơn vị"). Điểm này dùng được trong `nối:`, `cung:` như điểm theo góc.

### Báo lỗi

`renderTrigSvg` hiện `throw` một lỗi chung. Giữ cách đó nhưng thông báo phải chỉ ra **dòng nào sai và gõ thế nào cho đúng** (ví dụ: `Dòng 3 "tô: π/6 π/2": cần dạng tô: π/6 → 5π/6`). Tên điểm chưa khai báo trong `nối:`/`cung:` → lỗi rõ ràng.

### Bố cục SVG

- Khung hiện cố định `W = 340 | 380, H = 320`. Khi có trục cot, nhãn giá trị trên trục, hoặc đường thẳng dài, nới khung cho đủ chỗ (không cắt chữ).
- Nhãn không đè nét: tên điểm đặt ra phía ngoài theo hướng bán kính (đã làm), nhãn giá trị trục đặt sát trục.
- Giữ phong cách hiện có: nét đen `#111`, font như các nhãn sẵn có (`FAM`), chữ nghiêng cho tên trục.

## Cập nhật các chỗ khác

- `TRIG_HELP` trong `MoreToolModals.tsx`: thêm nhóm "Đặt tên & toạ độ", "Tô cung", "Đường thẳng", "Nối & cung" với ví dụ cụ thể cho từng lệnh (đúng cú pháp đã cài).
- `TrigModal`: thêm 2 checkbox `values`, `cot`. Giá trị khởi tạo mặc định giữ như cũ + `values: false, cot: false`. Spec cũ đã lưu trong đề (không có field mới) phải mở ra được — field mới là optional hoặc có mặc định khi đọc.
- `FIGURE_GUIDE` mục 8 trong `docRewrite.ts`: viết lại ngắn gọn, liệt kê đủ lệnh mới + `"values"`, `"cot"`, ví dụ:
  `{"kind":"trig","angles":"M: pi/6\nN: 5pi/6\ntô: [pi/6 → 5pi/6]\ny = 1/2","values":true}`. Giữ câu "Đề gọi điểm M, N… thì ghi M: góc để tên hiện trên hình."
- `toolFromRaw` case `'trig'`: đọc thêm `values`, `cot` bằng `bool(...)`.

## Kiểm tra (bắt buộc trước khi báo xong)

1. `npx tsc -p tsconfig.app.json --noEmit` không lỗi (KHÔNG dùng `tsc -p .`).
2. Mở dev server (`npm run dev -- --port 5184 --host 127.0.0.1`), trong console trình duyệt vẽ thử bằng:
   ```js
   const { renderTool } = await import('/src/lib/toolSpec.ts')
   renderTool({ kind: 'trig', spec: { angles: '…', projections: true, tan: false, values: true, cot: false } })
   ```
   (`tsx` chạy file lẻ không hiểu alias `@/`, nên thử trong trình duyệt.) Ít nhất các ca:
   - `pi/3` (cũ, phải y như trước), `M: pi/3`, `π/4 + kπ/2`, `x = π/3 + kπ` (vẫn là họ nghiệm).
   - `M: pi/6\nN: 5pi/6\ntô: [pi/6 → 5pi/6]\ny = 1/2` + `values: true`.
   - `π/3 + kπ/3\nnối tô: họ` (lục giác).
   - `M: pi/4\nN: 3pi/4\ncung: M N "π/2"`.
   - `M(1/2; √3/2)\nN(0,6; 0,6)` (N phải báo lỗi không nằm trên đường tròn).
   - `cot: true` với `M: pi/4`.
   - Dòng sai (`tô: π/6`, `nối: X Y` chưa khai báo) → thông báo lỗi đúng dòng.
3. Vẽ lại toàn bộ hình trong kho không lỗi:
   ```js
   const { toolFromRaw } = await import('/src/lib/docRewrite.ts')
   const mods = await Promise.all(['bankFigures','bankThpt','bankThpt2'].map(m => import(`/src/data/${m}.ts`)))
   const all = mods.flatMap(m => Object.values(m).filter(Array.isArray).flat()).filter(q => q?.figure)
   all.filter(q => { try { renderTool(toolFromRaw(q.figure)); return false } catch { return true } }).map(q => q.id)  // phải là []
   ```
4. Mở công cụ trong app (thanh trái → Công cụ → Đường tròn lượng giác), thử gõ các lệnh mới, xem ảnh xem trước và bảng trợ giúp.

## Quy ước repo (đừng phá)

- Code có `\` (regex) → viết bằng công cụ Edit/Write, không qua heredoc bash/Python (dễ nuốt `\`, hỏng chữ có dấu).
- Giao diện, thông báo lỗi, comment: **tiếng Việt**.
- Không thêm thư viện mới.
- **Làm trên nhánh riêng:** trước khi sửa, từ `main` mới nhất tạo nhánh `feat/trig-7-tinh-nang` (`git switch -c feat/trig-7-tinh-nang`). Commit trên nhánh đó (có thể chia nhiều commit, thông điệp tiếng Việt kiểu `feat(trig): …`), rồi `git push -u origin feat/trig-7-tinh-nang`. **Không** merge vào `main`, **không** push `main`, không mở PR — người dùng sẽ preview nhánh rồi mới quyết.
- Xong việc thì `git switch main` để trả thư mục làm việc về `main` (nhánh vẫn còn đó để preview).
- Báo cáo cuối: liệt kê file đã sửa, cú pháp cuối cùng của từng lệnh, kết quả từng ca kiểm tra ở mục trên, và chỗ nào còn chưa làm/không chắc.
