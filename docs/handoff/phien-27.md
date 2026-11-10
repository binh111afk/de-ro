# Phiên 27 (10/11/2026): review + gộp 3 nhánh agent

Gộp trên nhánh `tich-hop-27` (worktree `../dethinhbien-main`), thứ tự keo-nhan → mau-slide → mobile-soan-de. **Chưa push main** tới khi người dùng đồng ý.

## Đã làm
- `feat/keo-nhan`: gộp sạch. `applyLabelPos` đúng thiết kế (một chỗ trong `renderTool`, translate đứng trước rotate). Modal Đồ thị có nút "Di chuyển nhãn".
- `feat/mau-slide`: xung đột `package.json` (thêm `test:designs`). Agent thêm 2 theme (`bang-den`, `vang-nang`) nhưng không sửa test, `test:slide-theme` và `test:slide-plan` hỏng (agent báo pass là sai) → đã sửa số theme 6 → 8.
- `feat/mobile-soan-de`: xung đột `SlideSidePanel.tsx` (import + thân panel). Giữ props mới của TemplatesPanel (theme, design) và cấu trúc `tabId`/`isMobileSheet` của nhánh mobile.
- Kiểm: tsc sạch; docx, export, convert, designs, slide-theme/plan/layout, markdown, online, grading, guard đều qua. Xem trên dev: desktop 1440 không đổi, 360px không cuộn ngang, tab Mẫu → Thiết kế hiện 8 bộ, không lỗi console.

## Còn treo
- **mau-slide đợt sửa 2 CHƯA làm**: khung chọn phần tử nhảy khi sát mép slide; tương phản chữ theo màu nền ngay dưới chữ; thumbnail bóng đổ tính px không co theo cỡ.
- Dọn worktree/nhánh sau khi push (xem phiên 26, mục "Nhánh / worktree cần dọn").
- Các việc treo khác: xem phiên 26.
