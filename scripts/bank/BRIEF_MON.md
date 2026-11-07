# Bổ sung cho môn khác Toán (đọc BRIEF.md trước, mọi quy tắc ở đó vẫn áp dụng)

- Thêm field `"subject"` vào MỖI câu: đúng một trong `"Vật lí"`, `"Hoá học"`, `"Sinh học"`, `"Tiếng Anh"`.
- Định dạng thi tốt nghiệp 2025:
  - Vật lí, Hoá học: Phần I nhiều lựa chọn, Phần II đúng/sai (4 ý), Phần III trả lời ngắn (đáp án số ≤ 4 ký tự). Câu thực tế, thí nghiệm, đọc đồ thị/bảng số liệu.
  - Sinh học: như trên; nhiều câu đọc sơ đồ phả hệ, bảng số liệu thí nghiệm, bài di truyền tính tỉ lệ.
  - Tiếng Anh: CHỈ trắc nghiệm A–D (`trac-nghiem`): điền từ vào thông báo/quảng cáo, sắp xếp câu thành đoạn/thư, điền câu vào đoạn văn, đọc hiểu đoạn 200–300 từ (mỗi câu hỏi đọc hiểu là một entry riêng, đoạn văn đặt đầu prompt), từ vựng–ngữ pháp trong ngữ cảnh. Đề viết bằng tiếng Anh, `explanation` bằng tiếng Việt.
- Hình (`figure`) cho môn tự nhiên, ngoài các loại trong BRIEF.md (graph, stats, scene…) dùng được:
  - `{"kind":"circuit","text":"nguồn E = 12 V, r = 1 Ω\nR1=4Ω - (R2=6Ω // R3=3Ω)"}` — "-" nối tiếp, "//" song song, ngoặc gom cụm; linh kiện R, Rb, Đ, A, V, K, C, L, E.
  - `{"kind":"motion","yName":"v (m/s)","tName":"t (s)","points":"(0; 0) (2; 4) (5; 4)"}`
  - `{"kind":"incline","angle":30,"fms":"none|up|down","F":"none|up|down"}`
  - `{"kind":"gas","axes":"pV|pT|VT","states":"1: (1; 4)\n2: (4; 1)","processes":"1-2: đẳng nhiệt","ticks":"value|symbol|none"}` (toạ độ (ngang; dọc): p–V là (V; p); số liệu phải khớp quá trình)
  - `{"kind":"electron","element":"Fe"}`
  - `{"kind":"struct","formula":"CH3-CH(CH3)-CH2-OH"}`
  - `{"kind":"chemgraph","xName":"n CO2","yName":"n↓","points":"(0; 0) (0,2; 0,2) (0,4; 0)"}`
- Tiếng Anh không dùng figure.

## Môn xã hội và Tin (bổ sung phiên 23)
- `subject` thêm được: `"Lịch sử"`, `"Địa lí"`, `"Tin học"`, `"GDKT&PL"`.
- Định dạng thi 2025 các môn này: Phần I trắc nghiệm A–D, Phần II đúng/sai 4 ý (đoạn tư liệu/tình huống dẫn). KHÔNG có trả lời ngắn.
- Địa lí: được dùng `stats` (bảng số liệu, biểu đồ cột/đường/tròn) và có thể có trả lời ngắn tính toán (tỉ trọng, tốc độ tăng trưởng, mật độ).
- Tin học: câu Python/HTML/CSDL đặt code trong prompt, xuống dòng bằng `\n`.
