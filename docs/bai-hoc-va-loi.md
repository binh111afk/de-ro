## 4. Lỗi đã gặp và cách sửa

### 4.1. TipTap v3 — `content` phải là mảng

```ts
// SAI (v2 còn chấp nhận, v3 thì không):
content: { type: 'table', content: [] }

// ĐÚNG:
content: [{ type: 'table', content: [] }]
```

### 4.2. TipTap v3 — `setContent` đổi signature

```ts
// SAI: editor.commands.setContent(content, false)
editor.commands.setContent(content, { emitUpdate: false })
```

### 4.3. `content.child(index)` không trả `.pos`

Phải lấy offset bằng `forEach`:

```ts
editor.state.doc.content.forEach((_node, offset, index) => {
  if (index === targetIndex) position = offset
})
```

### 4.4. Provider LLM trả content rỗng

Triệu chứng: AI "không soạn được" mà không có lỗi. Nguyên nhân: response rỗng /
retry thiếu. Cách sửa: retry + log raw response + báo lỗi rõ ràng cho người dùng.

### 4.5. Hai tab đề đầu tiên bị trùng

**Triệu chứng:** mở `/soan-de` thấy 2 tab "Đề thi mới" giống nhau.

**Nguyên nhân:** React StrictMode gọi effect **hai lần**. Effect cũ đọc
`tabs.length` từ closure của lần render trước → lần gọi thứ hai vẫn thấy `0` →
gọi `newDoc()` lần nữa.

**Cách sửa (đã áp dụng):** đưa logic vào store, kiểm tra trạng thái **tại thời điểm
gọi** thay vì closure:

```ts
// src/store/compose.ts
ensureDoc: () => {
  const s = get()
  if (s.tabs.length > 0) return s.activeId ?? s.tabs[0].id
  return s.newDoc()
},
```

> Bài học: **đừng dựa vào giá trị từ closure trong effect để quyết định "đã tồn tại
> chưa"**. Dùng `get()` bên trong action của store, hoặc một cờ "đã khởi tạo" đặt
> ở nơi không bị reset.

### 4.6. Trang A4 bị co còn ~38%

**Nguyên nhân:** công thức auto-fit cũ lấy `Math.min(byW, byH)` → chiều cao khung
nhìn (thấp) kéo tỉ lệ xuống.

**Cách sửa:** chỉ co theo chiều rộng, `clamp(0.25, 1.3)`.

### 4.7. Thước kẻ lệch với trang giấy (sau khi đổi auto-fit)

**Triệu chứng:** ruler rộng cố định 842px còn trang giấy bị `transform: scale()` →
thước kẻ không khớp mép trang, tràn ra ngoài khung.

**Nguyên nhân:** `transform: scale()` **không** ảnh hưởng layout, nên container
và phần tử bên trong lệch nhau.

**Cách sửa:** dùng CSS `zoom` (ảnh hưởng layout) cho toàn bộ khối chứa thước kẻ +
trang giấy, đặt trong `.compose-canvas { width: fit-content; margin: 0 auto }` —
đúng cách GenOffice làm với `.doc-zoom`.

### 4.8. Giao diện "AI slop", khác 1 trời 1 vực so với bản gốc

**Triệu chứng (báo cáo của người dùng):** giao diện tôi làm khác hẳn ảnh gốc
GenOffice, dùng emoji làm icon, nhìn rất "AI slop".

**Nguyên nhân:** tôi tự phát minh bảng màu (clay/sage/honey), tự bo góc, và dùng
emoji `📋 ✂️ 🖨 ❓ 💾` thay cho icon. Bản gốc dùng:
- chrome trung tính (trắng/xám `#e6e6e6` sân, `#f3f4f6` status bar),
- accent word-blue `#185abd`,
- icon SVG stroke `currentColor` 16×16, nét ~1.5px cố định,
- ribbon cao **cố định** 80px, nút lớn icon-trên-nhãn-dưới.

**Cách sửa:** port thẳng từ mã nguồn gốc thay vì đoán:
- token: `packages/ui/src/tokens.css` → `src/examEditor/genoffice-tokens.css`
- vỏ: `apps/docs/src/renderer/styles.css` → `src/examEditor/compose.css`
- icon: `apps/docs/src/renderer/components/icons.tsx` → `src/examEditor/icons.tsx`
- tab strip: `apps/shell/src/renderer/src/tabbar.css`

### 4.9. `setLineHeight` không tồn tại trong tiptap core

**Triệu chứng:** `npx tsc -b --noEmit` báo lỗi
`Property 'setLineHeight' does not exist on type 'ChainedCommands'`
tại `Ribbon.tsx` (dropdown "Giãn dòng").

**Nguyên nhân:** lệnh `setLineHeight` **không** có sẵn trong `@tiptap/core`
hay bất kỳ extension nào đang dùng — nó chỉ được đăng ký bởi extension
`LineHeight` của `@tiptap/extension-text-style/line-height`. Code dropdown được
port từ GenOffice nhưng quên không đăng ký extension này.

**Cách sửa (đã áp dụng):** import `LineHeight` từ
`@tiptap/extension-text-style/line-height` và đăng ký trong
`ExamEditor.tsx` với `types: ['paragraph', 'heading']`.
Không cần viết extension thủ công (đã thử, bị trùng khai báo kiểu với bản có
sẵn trong thư viện).

---

## 5. Bài học rút ra

1. **Khi được yêu cầu "copy giao diện của repo X", hãy đọc source thật của repo X
   trước khi viết code.** Mã nguồn GenOffice nằm ở `_ref/genoffice/` (Apache-2.0) —
   đọc nó tiết kiệm hơn nhiều so với suy đoán từ ảnh chụp màn hình.
2. **Emoji không bao giờ nên đứng trong UI sản phẩm.** Nó nổi màu, không theo nhịp
   nét của hệ icon, và phá hệ thống hình ảnh. Icon SVG stroke `currentColor` là
   chuẩn của Word/GenOffice.
3. **Số đo cụ thể quan trọng hơn cảm giác "gần giống".** Ribbon 80px, tab strip
   40px, ruler 20px, status bar 24px, AI dock 360px, nav pane 288px, canvas
   `#e6e6e6` — lấy nguyên số từ bản gốc thì nhìn ra ngay là giống.
4. **`transform: scale()` không đổi layout; `zoom` thì có.** Khi cần thước kẻ /
   trang giấy / nội dung luôn khớp nhau, dùng `zoom`.
5. **StrictMode double-invoke effect** là nguyên nhân kinh điển của "tạo bản ghi
   trùng". Kiểm tra idempotency ở tầng store, không ở tầng component.
6. **Một editor liên tục + lớp giấy vẽ nền** là cách đúng để có phân trang thật mà
   không phá con trỏ / undo.
7. **Không bao giờ sửa DOM do ProseMirror quản lý từ bên ngoài.** Ghi inline
   style/toggle class trên node của editor khiến PM đọc lại DOM và map lại
   selection → con trỏ nhảy, block reflow loạn. Muốn đổi cách hiển thị theo dữ
   liệu đo được thì dùng **decoration** (PM tự quản class) và đo trên bản clone
   ngoài editor.
8. **`data-exam-node` phải trùng tên node** (`examHeader`, `examQuestion`, …).
   CSS và `choiceLayout` bám theo giá trị này; lệch tên thì CSS "sống" mà không
   có tác dụng và rất khó thấy vì không có lỗi nào được báo.

---

