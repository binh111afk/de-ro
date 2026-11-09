# Handoff: kéo thả nhãn trong công cụ vẽ

Nhánh `feat/keo-nhan` (từ `main`, 7 commit, chưa merge). Prompt gốc: [docs/prompt-keo-nhan.md](../prompt-keo-nhan.md). Người review đọc file này trước.

## Đã làm gì

Tính năng: trong khung xem trước của công cụ vẽ có nút **"Di chuyển nhãn"** (bật chế độ kéo) và **"Đặt lại vị trí nhãn"** (xoá mọi độ lệch). Khi bật: rê chuột lên nhãn → con trỏ `move` + viền xanh nhạt; kéo thì nhãn theo chuột (cập nhật `transform` trên DOM cho mượt); thả thì ghi `labelPos` vào spec và công cụ vẽ lại. Vị trí lưu trong `spec.labelPos` → theo vào attr `plot` / `<desc>`, nên chèn, xuất Word, in, nhấp đúp sửa lại đều giữ đúng chỗ. Độ lệch là **cộng thêm** trên vị trí tự động, nên sửa dữ liệu thì nhãn vẫn đi theo điểm của nó.

Thiết kế đúng theo mục "Thiết kế bắt buộc" của prompt, không đổi hướng:

- **Lưu độ lệch, không lưu toạ độ tuyệt đối** — field tuỳ chọn `labelPos?: Record<string, [number, number]>` (đơn vị viewBox, khoá = id nhãn). Thêm field này vào interface của 5 spec (`PlotSpec`, `Geo2dSpec`, `Geo3dSpec`, `OxySpec`, `SceneSpec`, `StatsSpec`) vì TS excess-property check bắt buộc khi modal ghi `set({ labelPos })`.
- **`applyLabelPos` chung một chỗ** trong `src/lib/toolSpec.ts`: sau khi renderer trả SVG, với mỗi `<text … data-lbl="id">` có trong `labelPos`, thêm `transform="translate(dx dy)"`; thẻ đã có `transform` thì nối thêm. `renderTool` đọc `(doc.spec as {labelPos}).labelPos` và áp; renderer chỉ gắn `data-lbl`, không tự đọc `labelPos`.
- **Id nhãn ổn định** gắn bằng attr `data-lbl` theo đúng bảng quy ước của prompt (`pt:A`, `x:3`, `y:-2`, `ax:x/ax:y/ax:O`, `dim:AB`, `ang:CBA`, `lbl:CB`, `val:<dãy>:<cột>`, `cv:<đường>`).
- **Component chung** `src/examEditor/tools/LabelDragPreview.tsx`: export `LabelPreview` (hàng nút + khung kéo hoặc fallback) — SVG hiện inline qua `dangerouslySetInnerHTML` để bắt `closest('text[data-lbl]')`, pointer events + `setPointerCapture`, kéo cập nhật `transform` trực tiếp trên DOM, chỉ thả mới gọi `onChange`. Hai chế độ (PickPreview ↔ kéo nhãn) mount xen kẽ, không giành chuột.
- **Nối qua `renderPreview` của ToolShell** (Oxy/Stats/Scene) và trực tiếp trong GraphToolModal / GeometryModal. Geo 3D nón/trụ/cầu trước đây không có `renderPreview` — giờ fallback là ảnh tĩnh.

## File nào

| File | Thay đổi |
|---|---|
| `src/lib/toolSpec.ts` | type `LabelPos`, `applyLabelPos()`, `renderTool` áp độ lệch |
| `src/examEditor/tools/LabelDragPreview.tsx` | **file mới** — `LabelPreview` + khung kéo |
| `src/lib/plot.ts` | `data-lbl`: `pt:` `x:` `y:` `ax:` `cv:<chỉ số đường>` |
| `src/lib/geometry.ts` | `data-lbl: pt:<tên>` cho mọi nhãn đỉnh (2D, 3D, tròn, dựng thêm) |
| `src/lib/oxy.ts` | `data-lbl`: `pt:` `x:` `y:` `ax:` `cv:<chỉ số dòng lệnh>` |
| `src/lib/scene.ts` | `data-lbl`: `pt:` `dim:AB` `ang:CBA` `lbl:AB` |
| `src/lib/stats.ts` | `data-lbl`: `val:<dãy>:<cột>` `x:<cột>` `y:<số>` `ax:` |
| `src/examEditor/tools/GraphToolModal.tsx` | nút + `labelPos` state, áp `applyLabelPos` vào preview, spec có `labelPos` theo `<desc>` khi chèn |
| `src/examEditor/tools/GeometryModal.tsx` | nút + `labelPos` cho Geo2d/Geo3d, fallback PickPreview/ảnh tĩnh |
| `src/examEditor/tools/MoreToolModals.tsx` | Oxy/Stats/Scene: nút + `labelPos`; SceneModal sửa luôn `setSpec({ text })` → `setSpec((s) => ({ …s, text }))` (trước đây ghi đè mất labelPos) |

## Commit (nhỏ, theo từng công cụ)

1. `fdb3c52` feat(cong-cu-do-thi): kéo thả nhãn đồ thị + phần chung (`applyLabelPos`, `LabelDragPreview`)
2. `359419e` feat(hinh-hoc): kéo thả nhãn hình phẳng/không gian
3. `1dfba73` feat(oxy): kéo thả nhãn hệ trục Oxy
4. `080a67d` feat(hinh-ly): kéo thả nhãn hình thực tế (scene)
5. `0beff31` feat(thong-ke): kéo thả nhãn biểu đồ
6. `beb5161` fix(keo-nhan): thả chuột ngoài khung vẫn lưu vị trí nhãn
7. `...` feat(do-thi): ghi tên hàm cạnh đồ thị theo tiếp tuyến và biểu thức SGK

## Chỗ prompt không nói rõ → chọn cách đơn giản nhất (và lý do)

1. **Nhãn tên đường thẳng/đường cong/vectơ của Oxy** — bảng quy ước chỉ có "nhãn đường cong y = f(x)". Dùng `cv:<chỉ số dòng lệnh trong items>`: chỉ số là handle ổn định nhất có sẵn. Hệ quả: thêm/xoá/sắp lại dòng lệnh làm đổi chỉ số → độ lệch có thể dính sang nhãn khác (hiếm, chấp nhận).
2. **Thống kê**: nhãn cột trục ngang dùng `x:<chỉ số cột>` (nhãn không phải số); tiêu đề trục `ax:x`/`ax:y`; quạt tròn `val:0:<i>`. **Chú thích (legend) và tên biểu đồ không kéo được** — gần như không bao giờ đè hình. **Bảng số liệu (`chart: 'table'`) ẩn hẳn hàng nút kéo** vì ô bảng không có nhãn đè nhau.
3. **GraphToolModal không có ô nhập điểm `points`** (chỉ AI dùng) nên bước kiểm "đổi toạ độ điểm" với đồ thị được thay bằng đổi hàm số (nhãn `ax:O` giữ độ lệch khi hàm đổi); bài kiểm toạ độ điểm làm trên Oxy (đổi `A(1; 2)` → `A(3; 2)`).
4. **Số thập phân trong id**: `x:0.5` ghi bằng dấu chấm (id chỉ để khớp, không hiện ra màn hình).
5. **Thả chuột ngoài khung xem trước**: thêm listener `pointerup` ở window khi đang kéo (commit `beb5161`) — pointer capture có thể mất, nếu không có fallback thì vị trí kéo bị bỏ qua. Handler của khung vẫn chạy trước và xoá `drag.current`, nên không lưu hai lần.

## Công cụ nào chưa làm

- Các công cụ ngoài phạm vi đợt này: **Bảng biến thiên, Bảng xét dấu, Bảng ghép nhóm, Đường tròn lượng giác, Sơ đồ cây, Trục số, Ven, Mạch điện, Đồ thị chuyển động, Mặt phẳng nghiêng, Đồ thị khí, Hoá** (electron/cấu tạo/đồ thị số mol) — renderer chưa có `data-lbl`, modal chưa có nút. Làm theo đúng khuôn của 5 công cụ trên là được.
- Đồ thị (`graph`): nhãn điểm `pt:` chỉ xuất hiện khi đề có điểm đặt tên (modal chưa có ô nhập `points` — chỉ AI tạo được); nhãn đường cong `cv:` chỉ khi bật "Ghi tên hàm cạnh đồ thị".

## Lỗi còn biết

- **Id `cv:<chỉ số>` của Oxy và `val/x` của Thống kê là theo vị trí** — nếu người dùng chèn thêm dòng dữ liệu vào giữa, các độ lệch đã kéo dịch theo vị trí (nhãn khác nhận độ lệch). Id tên điểm (`pt:`, `dim:`, `ang:`, `lbl:`, `ax:`) không bị.
- Kéo nhãn chỉ làm được trong **modal của công cụ**; ảnh đã chèn vào đề là PNG tĩnh (muốn dời nhãn phải nhấp đúp mở lại).
- Kiểm tự động bằng CDP thấy **pointer capture của chuột ảo không giữ sự kiện** khi thả ngoài khung — đã vá bằng listener window (dù trên chuột thật có thể capture không mất, vá này vô hại).

## Cách thử (đã chạy hết, kết quả ở dưới)

1. `npx tsc -p tsconfig.app.json --noEmit` — sạch.
2. `npm run test:docx` (OK) và `npm run test:export` (7/7).
3. Dev `npm run dev -- --port 5184 --host 127.0.0.1`, mở `/soan-de` → tạo tài liệu "Đề thi" → tab **Công cụ**. Với từng công cụ: bật "Di chuyển nhãn", kéo một nhãn, bấm Chèn, nhấp đúp ảnh trong đề để mở lại (bật lại "Di chuyển nhãn" — chế độ kéo mặc định tắt mỗi lần mở) → nhãn vẫn ở chỗ đã kéo; đổi toạ độ một điểm (Oxy) → nhãn đi theo; "Đặt lại" → về chỗ cũ.
4. Đề cũ không có `labelPos`: so sánh SVG renderer bản `main` với bản nhánh cho 7 trường hợp mẫu (đồ thị, Oxy, scene, thống kê cột/quạt, hình 2D/3D) — sau khi bỏ attr `data-lbl` (vô hình) **giống nhau từng byte** → hình cũ không đổi.

Kết quả kiểm tự động (Chrome headless + CDP, script ngoài dự án): **30/30 đạt** — kéo/đứng đúng chỗ/labelPos vào attr `plot`/mở lại giữ vị trí cho cả 5 công cụ, sửa dữ liệu giữ độ lệch, đặt lại, và luồng scene (công cụ bị ẩn khỏi panel từ commit `0dadc91` — kiểm qua dán ảnh vào đề + nhấp đúp, đúng đường "AI vẫn dùng, nhấp đúp ảnh vẫn sửa được").

## Cập nhật: Tên hàm cạnh đồ thị (theo `docs/prompt-ten-ham-do-thi.md`)

### 1. Yêu cầu & giải pháp kỹ thuật

1. **Chuẩn hoá hiển thị biểu thức SGK (`prettyExpr`) trong `src/lib/plot.ts`**:
   - Dạng `y = f(x)` (hoặc giữ tiền tố `(C): y = ...` nếu người dùng nhập).
   - Luỹ thừa số nguyên dùng ký tự Unicode chuẩn (`²`, `³`, `⁻¹`...); luỹ thừa phức tạp hơn dùng `<tspan baseline-shift="super">`.
   - Phép nhân ẩn không dấu `*` (ví dụ `2*x` → `2x`, `3*sin(x)` → `3sin(x)`).
   - Dấu trừ toán học `−` (U+2212) thay cho dấu gạch ngang `-`.
   - Khoảng cách chuẩn xung quanh các toán tử hai ngôi `+`, `−`, `=`.

2. **Thuật toán tìm vị trí & góc nghiêng theo tiếp tuyến**:
   - Lấy mẫu trên các nhánh đường cong liên tục (bỏ qua 8% biên mép khung và các bước nhảy gián đoạn tiệm cận).
   - Tính vector tiếp tuyến và pháp tuyến trong hệ toạ độ màn hình (pixel).
   - Giới hạn góc nghiêng của nhãn trong khoảng $[-70^\circ, 70^\circ]$ để tránh nhãn quá dốc gây khó đọc, đồng thời luôn lật góc để chữ đọc xuôi từ trái sang phải.
   - Sinh 2 hộp ứng viên nhãn (phía trên và dưới đường cong, cách đường cong 12px theo vector pháp tuyến).
   - Chấm điểm phạt (càng thấp càng tốt) dựa trên:
     - Tràn mép khung vẽ (phạt 1000).
     - Cắt ngang chính đường cong đó (phạt 150) hoặc đường cong khác (phạt 80).
     - Đè lên trục toạ độ $Ox, Oy$ (phạt 40).
     - Đè lên số đo vạch chia trên trục (phạt 30).
     - Đè lên các điểm đặc biệt (phạt 50).
     - Đè lên nhãn đường cong khác đã được đặt (phạt 200).
     - Đè lên giao điểm giữa các đường cong (phạt 60).
     - Vùng uốn khúc mạnh (đạo hàm bậc hai lớn).
   - Chọn ứng viên có tổng điểm phạt thấp nhất.

3. **Khớp nối với tính năng kéo thả nhãn**:
   - Nhãn tên đường cong mang thuộc tính `data-lbl="cv:<i>"`, `dominant-baseline="central"`, `text-anchor="middle"`.
   - Trong `src/lib/toolSpec.ts` (`applyLabelPos`) và `src/examEditor/tools/LabelDragPreview.tsx`: khi áp dụng độ lệch kéo thả, `translate(dx dy)` **bắt buộc đứng TRƯỚC** `rotate(...)`.
     - Nhờ vậy, phép dịch chuyển diễn ra trong hệ toạ độ gốc (viewBox), bảo toàn nguyên vẹn góc xoay tiếp tuyến và tâm xoay của nhãn sau khi kéo sang vị trí mới.

### 2. Kết quả kiểm tra 5 ca thử nghiệm (Checklist "Kiểm tra trước khi báo xong")

Đã chạy tự động qua Chrome Headless + CDP và chụp ảnh toàn bộ vào `docs/handoff/shots/`:

1. **Ca 1: Parabol $x^2 - 2x - 3$, đường thẳng $x$, $-x$ trên đoạn $[-5; 5]$**:
   - Cả 3 nhãn $y = x^2 - 2x - 3$, $y = x$, $y = -x$ được xếp so le, nghiêng theo tiếp tuyến từng đường, không dính trục toạ độ.
   - Kéo thử nhãn $y = x$ (`cv:1`) di chuyển mượt mà; thuộc tính `transform` được sinh đúng dạng `translate(76.4 -61.1) rotate(-45.0 582.2 74.8)` (`translate` đứng trước `rotate`).
   - Sau khi chèn vào văn bản đề thi và nhấp đúp mở lại, nhãn vẫn giữ nguyên chính xác vị trí đã kéo.
   - Ảnh minh chứng:
     - `docs/handoff/shots/ca1-parabol-va-2-duong-thang.png`
     - `docs/handoff/shots/ca1-sau-khi-keo-nhan.png`
     - `docs/handoff/shots/ca1-mo-lai-sau-khi-chen.png`
2. **Ca 2: Hàm bậc ba $x^3 - 3x$**:
   - Nhãn $y = x^3 - 3x$ tự động chọn vùng thoáng bên nhánh, luỹ thừa hiển thị dạng Unicode $x^3$.
   - Ảnh: `docs/handoff/shots/ca2-ham-bac-ba.png`.
3. **Ca 3: Lượng giác $\sin(x)$ và $\cos(x)$**:
   - Hai nhãn đặt dọc theo từng sóng sin và cos, nghiêng tương ứng theo sườn sóng.
   - Ảnh: `docs/handoff/shots/ca3-luong-giac-sin-cos.png`.
4. **Ca 4: Phân thức có tiệm cận $(2x+1)/(x-1)$**:
   - Nhãn $y = (2x + 1)/(x - 1)$ chọn đặt ở nhánh liên tục bên phải, tránh xa hoàn toàn vùng tiệm cận đứng $x = 1$.
   - Ảnh: `docs/handoff/shots/ca4-phan-thuc-tiem-can.png`.
5. **Ca 5: Đường dốc đứng $10x$**:
   - Góc xoay của đường thẳng dốc $10x$ bị chặn ở $-70^\circ$, giữ cho nhãn không bị dựng đứng $90^\circ$ khó đọc.
   - Ảnh: `docs/handoff/shots/ca5-duong-doc-dung-10x.png`.

### 3. Đánh giá thẩm mỹ & các tình huống cần lưu ý

- **Điểm đạt**:
  - Hầu hết các dạng đồ thị phổ biến trong SGK toán (bậc 1, bậc 2, bậc 3, phân thức, lượng giác) đều tự động tìm được vị trí nhãn rất thoáng, góc nghiêng tiếp tuyến mềm mại, không bị đè trục hay số chia.
  - Tên biểu thức định dạng toán học rất đẹp mắt và chuẩn xác.
- **Tình huống cần lưu ý (chưa thật sự hoàn hảo nếu chỉ tự động)**:
  - Khi có quá nhiều đường giao nhau trong một khoảng hẹp (chẳng hạn 4-5 đường dồn về gốc toạ độ), không gian trống ít nên nhãn có thể buộc phải nằm hơi gần một đường lân cận (dù thuật toán đã phạt va chạm).
  - Với trường hợp đó, người dùng có thể nhấp nút **"Di chuyển nhãn"** kéo nhãn đến bất kỳ vị trí thoáng nào mong muốn chỉ bằng 1 thao tác kéo chuột đơn giản.
