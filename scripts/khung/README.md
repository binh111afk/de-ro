# Khung chương trình: bản gốc và script sửa

- `ban-goc/`: file JSON agent bên ngoài gửi về, giữ nguyên như lúc nhận (để đối chiếu, không sửa).
- `ban-goc/nhanh-khung/`: 15 file agent trong dự án làm trên nhánh `feat/khung-chuong-trinh` (chép về để không phụ thuộc worktree).
- `fix-khung.mjs`, `fix-cac-mon.mjs`: script Claude dùng để sửa bản gốc rồi ghi vào `src/data/`.
- `ghep.mjs`: ghép các file từ nhánh `feat/khung-chuong-trinh` (bản chép ở `ban-goc/nhanh-khung/`) vào `src/data/`.

Bản đã kiểm, dùng thật, nằm ở `src/data/khung*.json`. Hướng dẫn chung: `docs/khung-chuong-trinh.md`.
