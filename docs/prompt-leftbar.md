# Prompt: hiệu ứng đổi tab ở cột trái (soạn đề + soạn slide)

> Làm **tiếp trên nhánh `feat/mobile-soan-de`**, **sau khi** đã xong và commit hết phần mobile (`docs/prompt-mobile-soan-de.md`). Không tạo nhánh mới, không làm trên `main`.
> Trước khi làm: `git fetch origin && git merge origin/main`. `main` vừa đổi kiểu tab đang chọn (các commit `8b8b39c` và commit căn giữa ô tab sau đó); phải có commit này trên nhánh rồi mới làm tiếp.

---

## Việc cần làm (chỉ việc này)

Cột trái có thanh icon dọc:
- Soạn đề: `src/examEditor/NavPanel.tsx`, các tab Mục lục / Khối mẫu / Công cụ.
- Soạn slide: `src/examEditor/SlideSidePanel.tsx`, các tab Mẫu / Đồ hoạ / Icon / Tải lên / Công cụ.

Tab đang chọn hiện có: ô nền cam nhạt (`bg-clay-soft`) căn giữa thanh, chữ đậm `text-clay-deep`, icon nét dày hơn. Khi bấm sang tab khác, kiểu này **nhảy tức thì** từ nút cũ sang nút mới.

Yêu cầu: khi đổi tab, **ô nền cam nhạt trượt mượt** từ tab cũ sang tab mới, giống thanh chỉ báo ở hàng tab của ribbon (xem `RibbonTabs` trong `src/examEditor/Layout.tsx`, chỗ `transform: translateX(...)`).

Cách làm:
1. Bỏ nền khỏi từng nút. Thay bằng **một phần tử chỉ báo duy nhất** đặt tuyệt đối trong `<nav>`, vẽ ô nền cam nhạt cùng cỡ, cùng bo góc với nút. Di chuyển nó bằng `transform: translateY(...)` tới vị trí nút đang chọn, đo bằng `offsetTop` / `offsetHeight` của nút. Thời gian khoảng 200ms, easing `cubic-bezier(.2,.8,.2,1)`.
2. Chữ và icon của nút đổi màu bằng `transition-colors` cùng thời gian, để không bị lệch nhịp với phần trượt.
3. Khi panel đang đóng (không tab nào chọn): chỉ báo mờ đi (`opacity: 0`), không trượt về đâu cả. Mở lại thì hiện ngay tại tab được chọn, không trượt từ vị trí cũ.
4. Lần vẽ đầu tiên: chỉ báo đứng sẵn ở tab đang chọn, không có hoạt cảnh.
5. Tôn trọng `prefers-reduced-motion`: tắt phần trượt.
6. Viết thành **một component hoặc hook dùng chung** cho cả hai màn, đừng chép code hai lần.
7. Thanh tab đáy của soạn slide trên điện thoại (`<nav aria-label="Thư viện slide">`) **không** cần hiệu ứng này.

Giữ nguyên nhìn khi đứng yên: màu, kích thước, bo góc, khoảng cách, chữ đậm phải giống hệt trước khi sửa.

## Không được

- Không đổi chức năng tab: bấm tab đang mở thì đóng panel, bấm tab khác thì chuyển.
- Không đổi phần khác của cột trái, ribbon, panel AI.
- Không thêm thư viện.
- Không commit lên `main`, không push `--force`.

## Kiểm tra trước khi báo xong

1. `npx tsc -p tsconfig.app.json --noEmit` sạch (**không** dùng `tsc -p .`).
2. Dev server, mở `/soan-de` ở 1280×800. Với cả soạn đề và soạn slide, kiểm tra từng ý:
   - bấm lần lượt các tab: chỉ báo trượt mượt, không giật, không chớp;
   - bấm tab đang mở: panel đóng, chỉ báo mờ đi;
   - mở lại: chỉ báo hiện ngay tại tab chọn;
   - tải lại trang: không có hoạt cảnh lúc đầu.
3. Bật giảm chuyển động (DevTools → Rendering → `prefers-reduced-motion: reduce`), kiểm tra không còn trượt.
4. Thử ở 390×844, kiểm tra phần mobile không bị ảnh hưởng.

## Bàn giao

Commit riêng, message tiếng Việt, push nhánh `feat/mobile-soan-de`. Ghi vài dòng vào `docs/handoff/mobile-soan-de.md`, mục "Hiệu ứng đổi tab cột trái": cách làm, file nào.
