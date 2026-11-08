# Prompt: kéo thả nhãn trong công cụ vẽ

> Đưa nguyên file này cho agent. Agent làm trên **nhánh riêng**, không đụng `main`.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite). Đọc `context.md` trước (chỉ phần đầu và "Bản đồ nhanh"), rồi mới đọc các file nêu dưới.

Các công cụ vẽ (đồ thị, hình học, Oxy, hình vẽ Lý, thống kê…) sinh ra **chuỗi SVG** từ một `spec` JSON. Hàm trung tâm: `renderTool(doc)` trong `src/lib/toolSpec.ts`. `doc = { kind, spec }` được lưu nguyên vào attr `plot` của ảnh trong đề (`src/examEditor/toolImages.ts`), nên nhấp đúp ảnh sẽ mở lại công cụ với đúng `spec` cũ.

Nhãn (tên điểm, số trên trục, giá trị trên điểm, chữ "5 m"…) đang được đặt tự động. Đôi khi vẫn đè lên hình. Người dùng muốn **dùng chuột kéo nhãn tới chỗ khác** ngay trong khung xem trước của công cụ, và vị trí đó **được lưu lại**.

## Yêu cầu

1. Trong khung xem trước của công cụ có nút bật/tắt **"Di chuyển nhãn"**. Khi bật: rê chuột lên nhãn thì con trỏ thành `move`, nhãn được tô viền nhạt; kéo thì nhãn đi theo chuột; thả thì giữ vị trí mới.
2. Có nút **"Đặt lại vị trí nhãn"** (xoá mọi vị trí đã kéo).
3. Vị trí đã kéo **được lưu** trong spec. Chèn vào đề, xuất Word, in, mở lại công cụ (nhấp đúp ảnh) đều giữ đúng vị trí.
4. Sửa dữ liệu (ví dụ đổi toạ độ điểm) thì nhãn vẫn đi theo điểm của nó, chỉ cộng thêm độ lệch đã kéo.
5. Ảnh cũ không có dữ liệu kéo vẫn vẽ y như hiện nay.

## Thiết kế bắt buộc (làm đúng hướng này)

**a) Lưu độ lệch, không lưu toạ độ tuyệt đối.** Thêm field tuỳ chọn vào spec:

```ts
/** độ lệch nhãn do người dùng kéo, đơn vị = đơn vị viewBox của SVG; khoá = id nhãn */
labelPos?: Record<string, [number, number]>
```

Đọc nó một cách chung trong `renderTool`: `(doc.spec as { labelPos?: … }).labelPos`. Không cần sửa từng interface Spec, trừ khi TypeScript bắt buộc.

**b) Mỗi nhãn kéo được có id ổn định**, gắn bằng attr `data-lbl` trên thẻ `<text>`. Id phải giữ nguyên khi người dùng sửa dữ liệu khác. Quy ước:

| Loại nhãn | id |
|---|---|
| Tên điểm A, B, M… | `pt:A` |
| Số trên trục x / y | `x:3`, `y:-2` |
| Tên trục, gốc O | `ax:x`, `ax:y`, `ax:O` |
| Nhãn đoạn / kích thước trong Hình vẽ (`nhãn CB "5 m"`, `kích thước AB "x"`) | `lbl:CB`, `dim:AB` |
| Chữ góc (`góc CBA "60°"`) | `ang:CBA` |
| Giá trị trên điểm / cột thống kê | `val:<chỉ số dãy>:<chỉ số cột>` |
| Nhãn đường cong `y = f(x)` | `cv:<chỉ số đường>` |

**c) Áp độ lệch ở MỘT chỗ chung**, trong `renderTool` (`src/lib/toolSpec.ts`), giống cách `withTextHalo` đang làm. Sau khi renderer trả SVG, với mỗi `<text … data-lbl="id" …>` có trong `labelPos`, thêm `transform="translate(dx dy)"`. Nếu thẻ đã có `transform` thì nối thêm, đừng ghi đè. Renderer chỉ cần thêm `data-lbl`, **không** tự đọc `labelPos`.

Lưu ý: công cụ Đồ thị (`kind: 'graph'`) có chỗ gọi thẳng `renderPlotSvg` trong `src/examEditor/tools/GraphToolModal.tsx`. Chỗ đó cũng phải áp độ lệch: tách phần áp độ lệch thành một hàm export, dùng ở cả hai nơi.

**d) Khung kéo thả là một component chung**, ví dụ `src/examEditor/tools/LabelDragPreview.tsx`:
- Hiện SVG **trực tiếp** (inline, `dangerouslySetInnerHTML`) thay vì `<img>`, để bắt được `event.target.closest('text[data-lbl]')`.
- Đổi toạ độ chuột ra đơn vị viewBox giống `toVb` trong `src/examEditor/tools/PickPreview.tsx` (đọc viewBox từ SVG, chia theo `getBoundingClientRect`).
- Dùng pointer events + `setPointerCapture`. Khi kéo, cập nhật `transform` trực tiếp trên phần tử DOM cho mượt. Chỉ khi thả mới gọi `onChange(labelPos mới)` để công cụ vẽ lại.
- Nhận props: `img`, `labelPos`, `onChange`.

**e) Nối vào modal qua `renderPreview` của `ToolShell`** (`src/examEditor/tools/ToolShell.tsx`). Hình học phẳng/không gian đang dùng `PickPreview` (bấm/kéo để dựng hình) trong `GeometryModal.tsx`. Khi bật "Di chuyển nhãn" thì hiện `LabelDragPreview`, khi tắt thì quay lại `PickPreview`. Hai chế độ không được giành nhau sự kiện chuột.

## Phạm vi đợt này

Làm cho các công cụ sau (renderer thêm `data-lbl`, modal có nút):

1. Đồ thị hàm số: `src/lib/plot.ts` + `GraphToolModal.tsx`
2. Hình học phẳng và không gian: `src/lib/geometry.ts` + `GeometryModal.tsx`
3. Oxy: `src/lib/oxy.ts`
4. Hình vẽ Lý (scene): `src/lib/scene.ts`
5. Thống kê, biểu đồ đoạn thẳng và cột: `src/lib/stats.ts`

Modal của mục 3–5 nằm trong `src/examEditor/tools/MoreToolModals.tsx` hoặc `ToolModal.tsx`: tự tìm. Các công cụ khác (bảng biến thiên, mạch điện, hoá…) **chưa làm**.

## Không được

- Không đổi cách đặt nhãn tự động hiện có. Độ lệch chỉ cộng thêm lên trên.
- Không đổi định dạng `<desc>` / attr `plot` ngoài việc spec có thêm `labelPos`.
- Không thêm thư viện mới.
- Không ghi đường dẫn tuyệt đối ra ngoài dự án vào code.
- Không commit lên `main`, không push `--force`.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` phải sạch. **Không** dùng `tsc -p .` (lệnh này không kiểm gì).
2. Chạy `npm run test:docx` và `npm run test:export`, cả hai phải đạt.
3. Chạy dev: `npm run dev -- --port 5184 --host 127.0.0.1`, mở `/soan-de`. Với từng công cụ trong phạm vi: kéo một nhãn, bấm Chèn, nhấp đúp ảnh trong đề để mở lại, kiểm tra nhãn vẫn ở chỗ đã kéo. Đổi toạ độ một điểm, kiểm tra nhãn đi theo điểm. Bấm "Đặt lại", kiểm tra nhãn về chỗ cũ.
4. Mở một đề cũ có ảnh công cụ (chưa có `labelPos`), kiểm tra hình không thay đổi.

## Bàn giao

- Làm trên nhánh `feat/keo-nhan`. Commit nhỏ theo từng công cụ, message tiếng Việt.
- Viết `docs/handoff/keo-nhan.md`: đã làm gì, file nào, công cụ nào chưa làm, lỗi còn biết, cách thử. Người review sẽ đọc file này trước.
