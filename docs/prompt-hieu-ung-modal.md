# Prompt: hiệu ứng mở modal đồng bộ (giống Kho câu hỏi)

> Đưa nguyên file này cho agent (Antigravity CLI). Làm trên **nhánh riêng** `feat/hieu-ung-modal`, không commit lên `main`, không push.

---

## Bối cảnh

Dự án: web soạn đề thi tiếng Việt (React 19 + TypeScript + Vite 6 + Tailwind v4). Đọc phần đầu `context.md` trước.

Modal **Kho câu hỏi** (`src/examEditor/BankModal.tsx`) mở ra có hiệu ứng: khung modal phóng nhẹ từ 94% lên 100% và hiện dần, có nảy rất nhẹ. Người dùng thích hiệu ứng này và muốn **mọi modal trong web mở ra giống hệt như vậy**. Hiện nhiều modal bật ra tức thì, không có hiệu ứng, hoặc dùng hiệu ứng khác.

Hiệu ứng mẫu đã có sẵn trong `src/index.css`, **dùng lại, không tạo keyframes mới**:

```css
@keyframes pop { 0% { opacity: 0; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
.anim-pop { animation: pop 0.4s var(--ease-bounce) both; }
```

Trong `BankModal.tsx` nó được gắn đúng vào **khung modal** (phần tử `role="dialog"`), không gắn vào lớp nền mờ:

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 …" onMouseDown={onClose}>
  <div role="dialog" aria-modal="true" className="anim-pop flex … rounded-[8px] bg-surface shadow-float" …>
```

## Việc cần làm

1. Rà toàn bộ `src/` tìm mọi **modal giữa màn hình**: một lớp phủ `fixed inset-0` (nền mờ) với một khung hộp thoại ở giữa. Dấu hiệu: `role="dialog"`, `aria-modal="true"`, `fixed inset-0`, class `rb-modal` / `rb-modal-backdrop`, `ai-html-modal`, các `*Modal.tsx`.
2. Với mỗi modal tìm được: gắn class `anim-pop` vào **khung hộp thoại** (phần tử chứa nội dung, thường có `role="dialog"`), giống `BankModal`. Không gắn lên lớp nền mờ.
3. Modal dùng class CSS riêng thay vì Tailwind (vd. `.rb-modal` trong `src/examEditor/compose.css`, `.ai-html-modal`): **thêm `animation: pop 0.4s var(--ease-bounce) both;` vào đúng rule CSS của khung đó**, không phải sửa từng chỗ dùng. Kiểm tra rule đó chưa có `animation` khác; nếu có `transform` cố định để căn giữa (vd. `translate(-50%, -50%)`), không dùng `pop` trực tiếp vì sẽ đè `transform` — báo lại trong danh sách "không làm được", đừng tự chế keyframes.
4. Modal đang có hiệu ứng mở **khác** (vd. `anim-sheet`, `anim-rise`, `anim-slide`) mà vẫn là hộp thoại giữa màn hình: đổi sang `anim-pop` cho đồng bộ.

Danh sách file nên xem (đã dò sơ bộ, có thể còn sót — tự grep thêm):

- `src/components/Dialog.tsx` (hộp xác nhận / thông báo dùng chung `dialog.alert`, `dialog.confirm` — quan trọng nhất, dùng khắp web)
- `src/components/AnnouncementPopup.tsx`, `src/components/OnlineAiBox.tsx` (đang dùng `anim-sheet`), `src/components/QuestionImageField.tsx`, `src/components/Layout.tsx`
- `src/board/BoardDialogs.tsx`, `src/board/BoardEditor.tsx`
- `src/examEditor/InsertMenus.tsx` + `.rb-modal` trong `src/examEditor/compose.css` (hộp Công thức, Liên kết)
- `src/examEditor/SourcePicker.tsx` (modal "Thêm nguồn"), `src/examEditor/AiPanel.tsx` (`.ai-html-modal`), `src/examEditor/DocSelectionAi.tsx`
- `src/examEditor/tools/ToolShell.tsx`, `src/examEditor/tools/GraphToolModal.tsx`, `src/examEditor/tools/VarTableModal.tsx`
- `src/examEditor/SlideEditor.tsx`, `src/examEditor/SlideRibbon.tsx`, `src/examEditor/SlideSidePanel.tsx`
- `src/pages/Community.tsx`, `src/pages/ExamView.tsx`, `src/pages/Quiz.tsx`
- `src/pages/admin/*.tsx` (BankPanel, ContentPanel, StatsPanel, UsersPanel)

## KHÔNG đụng vào

- **Ngăn kéo / panel trượt / bottom sheet** (trượt từ cạnh màn hình vào): `NavPanel.tsx`, `RibbonAdaptive.tsx` (menu điện thoại), `HealthDrawer.tsx`, panel AI, `SlideSidePanel` dạng panel cạnh, các chỗ dùng `pop-in`/`slide-out-up`/`backdrop-in`/`--sheet-dur`. Chúng trượt là đúng, không đổi sang `pop`.
- Menu thả xuống, popover, tooltip, menu chuột phải (`ContextMenu.tsx`, `EditorContextMenu.tsx`, `.rb-color-menu`, `Tooltip.tsx`), thanh công cụ nổi.
- Chế độ trình chiếu toàn màn hình của slide, màn chơi Quiz toàn màn hình (không phải hộp thoại).
- Logic đóng/mở, phím Esc, bấm nền để đóng: giữ nguyên. **Không thêm hiệu ứng đóng** (Kho câu hỏi cũng không có).
- Không đổi màu nền mờ, kích thước, bo góc, bóng của modal. Chỉ thêm hiệu ứng mở.
- Không thêm thư viện. Không tạo keyframes mới.

## Lưu ý kỹ thuật

- **Nhiều file dùng CRLF.** Không sửa bằng `sed -i` hay Python ghi text thường (sẽ đổi cả file sang LF). Sửa bằng công cụ sửa file thường hoặc ghi bytes giữ nguyên kiểu xuống dòng. Sau khi sửa chạy `git ls-files --eol <file>` và `git diff --stat`: mỗi file chỉ được đổi vài dòng; file nào báo đổi hàng trăm dòng là đã hỏng xuống dòng — khôi phục lại.
- `prefers-reduced-motion` trong `src/index.css` đã tắt animation chung; kiểm tra `.anim-pop` có nằm trong danh sách tắt đó chưa — nếu chưa, thêm `.anim-pop` vào rule reduced-motion sẵn có (không tạo rule mới).
- Modal render qua `Portal` hay không đều được; chỉ cần class nằm trên khung hộp thoại.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch.
2. Chạy dev (`npm run dev` → `http://127.0.0.1:5184`) và mở thử ít nhất: Kho câu hỏi (mẫu), một `dialog.confirm` (vd. xoá một đề trong Đề của tôi), hộp Công thức (tab Chèn → Công thức), modal Thêm nguồn trong panel AI, một công cụ vẽ hình (Công cụ → một công cụ bất kỳ), một modal trong Đề cộng đồng. Tất cả phải mở ra cùng một kiểu phóng nhẹ như Kho câu hỏi.
3. Kiểm tra ngăn kéo / menu điện thoại vẫn trượt như cũ.

## Báo lại

Một bảng ngắn: file — modal nào — đã làm gì (thêm `anim-pop` / thêm vào rule CSS / đổi từ hiệu ứng cũ). Thêm mục "Không làm được" cho modal nào vướng `transform` hoặc lý do khác. Không cần giải thích dài.
