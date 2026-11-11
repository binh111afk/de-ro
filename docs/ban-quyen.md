# Ghi chú bản quyền

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

## Excalidraw (Bảng vẽ)

Tab Bảng vẽ (`src/board/`) là mã **tự viết lại**, học cách tổ chức và tương tác từ Excalidraw —
https://github.com/excalidraw/excalidraw (MIT), clone tham khảo ở `_ref/excalidraw/` (không commit).
Không chép nguyên file nào; phần tham khảo:

| File đích | Học theo |
|---|---|
| `src/board/scene.ts` | `packages/element/src/types.ts`, `bounds.ts`, `collision.ts`, `transformHandles.ts` |
| `src/board/render.ts` | `packages/element/src/renderElement.ts`, `shape.ts` (tham số roughjs, perfect-freehand), `packages/excalidraw/renderer/` |
| `src/board/BoardEditor.tsx` | luồng chuột / phím tắt của `packages/excalidraw/components/App.tsx`, `resizeElements.ts`, `history.ts` |

Thư viện dùng trực tiếp: `roughjs` (MIT), `perfect-freehand` (MIT).
