# Khung chương trình các môn: cách soạn và cách kiểm

Mục đích: AI soạn đề đúng chương trình GDPT 2018 của từng lớp, không dùng kiến thức lớp trên, không lấy chương trình cũ. Mỗi môn có một file JSON trong `src/data/`. Khi soạn đề, code chỉ cắt đúng chương cần dùng (300–3.000 token) để chèn vào prompt, không nạp cả file.

Đã có: `src/data/khungToan.json` (Toán 6–12, đã kiểm). Các bước kiểm Toán ghi ở `docs/handoff/phien-24.md`, mục 3.

Quy trình gồm 3 bước:
1. Claude đưa người dùng prompt (mục A). Người dùng nhờ **agent ngoài** (không ở trong dự án) tra cứu và trả về một file JSON.
2. Người dùng gửi file cho Claude. Claude kiểm theo mục B rồi sửa.
3. Claude lưu file vào `src/data/khung<Mon>.json` và cập nhật danh sách ở cuối file này.

Thứ tự nên làm: Lý, Hoá, Sinh 10–12 → Văn, Anh 6–12 → KHTN và Lịch sử–Địa lí 6–9 → Sử, Địa, Tin, KTPL 10–12 → tiểu học.

---

## A. Prompt cho agent ngoài

Thay các chỗ `<…>`, rồi dán thêm **phần riêng của môn** (mục A2) vào cuối.

### A1. Phần chung

````
# Nhiệm vụ: Tổng hợp khung chương trình <MÔN> lớp <TỪ>–<ĐẾN> (GDPT 2018) thành một file JSON

## Mục đích
File này sẽ được chèn từng đoạn vào prompt cho AI soạn đề kiểm tra. Mục tiêu là AI soạn đúng kiến thức của từng lớp: không dùng kiến thức lớp trên, không dùng chương trình cũ (trước 2018). Độ chính xác quan trọng hơn độ dài.

## Nguồn (bắt buộc tra cứu, không viết theo trí nhớ)
1. Chương trình môn <MÔN> GDPT 2018, ban hành kèm Thông tư 32/2018/TT-BGDĐT. Kiểm tra cả các văn bản sửa đổi, ví dụ Thông tư 13/2022. Đây là nguồn chính cho "yêu cầu cần đạt".
2. Mục lục các bộ sách giáo khoa hiện hành: <các bộ sách, mặc định "Kết nối tri thức với cuộc sống, Chân trời sáng tạo, Cánh diều">. Dùng để biết tên chương và thứ tự học từng học kỳ.
3. Quy định kiểm tra, đánh giá: Thông tư 22/2021 (THCS, THPT) hoặc Thông tư 27/2020 (tiểu học). Với lớp 12, dùng cấu trúc đề thi tốt nghiệp THPT từ 2025 của môn này nếu có (đề minh hoạ và đề chính thức).

Nếu các bộ sách khác nhau về thứ tự chương thì ghi rõ khác nhau ở đâu. Chỗ nào không chắc thì ghi vào "ghi_chu_chua_chac", không bịa.

## Phạm vi
<MÔN> lớp <TỪ>–<ĐẾN>. THPT chỉ lấy phần bắt buộc; chuyên đề học tập chỉ ghi tên vào "chuyen_de".

## Định dạng: một file `khung_<mon-khong-dau>_<từ>_<đến>.json`

```json
{
  "mon": "<MÔN>",
  "nguon": ["<tên văn bản, link nếu có>"],
  "lop": [
    {
      "lop": 10,
      "chuong": [
        {
          "id": "<mã môn>10-<ten-khong-dau>",
          "ten": "<tên chủ đề/chương>",
          "hoc_ky": 1,
          "ten_theo_sach": { "KNTT": "...", "CTST": "...", "CD": "..." },
          "yeu_cau_can_dat": ["..."],
          "kien_thuc_duoc_dung": ["..."],
          "chua_duoc_dung": ["..."],
          "dang_bai_dien_hinh": ["..."],
          "luu_y_ra_de": "..."
        }
      ],
      "chuyen_de": [],
      "ghi_chu_chua_chac": []
    }
  ],
  "cau_truc_de": [
    {
      "loai": "Giữa kỳ 1",
      "lop": 10,
      "thoi_gian_phut": 45,
      "phan": [{ "ten": "...", "so_cau": 0, "diem_moi_cau": 0 }],
      "pham_vi": ["<id chương>"],
      "ti_le_muc_do": "..."
    }
  ]
}
```

## Yêu cầu chi tiết
1. "yeu_cau_can_dat": chép sát ý văn bản chương trình, rút gọn câu chữ được nhưng không đổi nghĩa.
2. "chua_duoc_dung" là trường QUAN TRỌNG NHẤT. Liệt kê kiến thức hay bị dùng nhầm sớm: nội dung của lớp trên, nội dung của chương sau trong cùng lớp, nội dung chương trình cũ đã bỏ. Mỗi mục ghi rõ học ở lớp nào. Mỗi chương ít nhất 2–3 mục. Không ghi mục cho đủ số (kiến thức đại học, kiến thức AI vốn không dùng).
3. "dang_bai_dien_hinh": 3–6 dạng mỗi chương, có ít nhất một dạng gắn thực tế.
4. Chỉ ra những nội dung đã ĐỔI LỚP hoặc BỊ BỎ so với chương trình 2006, ghi vào "luu_y_ra_de" của chương liên quan.
5. "cau_truc_de": có giữa kỳ 1, cuối kỳ 1, giữa kỳ 2, cuối kỳ 2 cho TỪNG lớp (không gộp nhiều lớp vào một mục), và thêm đề tốt nghiệp nếu có lớp 12. "pham_vi" trỏ tới id chương. Cấu trúc nào không có quy định toàn quốc thì ghi cấu trúc phổ biến, kèm nguồn (Sở nào, năm nào) và ghi chú vào "ghi_chu_chua_chac".
6. "id" duy nhất trong file. Mỗi chương khoảng 150–400 từ. Không viết lý thuyết, không viết bài giải mẫu.

## Kiểm tra trước khi nộp
- JSON hợp lệ: không comment, không dấu phẩy thừa.
- Đủ các lớp; mỗi lớp đủ chương, đã so với mục lục ít nhất một bộ sách.
- Không chương nào có "chua_duoc_dung" rỗng.
- Báo lại: số chương mỗi lớp, nguồn đã dùng, các điểm còn chưa chắc.
````

### A2. Phần riêng của từng môn (dán vào cuối prompt)

**Lý, Hoá, Sinh (10–12):**
```
## Riêng môn này
- "kien_thuc_duoc_dung" ghi cả công cụ Toán học sinh đã có ở lớp đó, ví dụ: lớp 10 chưa có đạo hàm (đạo hàm học ở lớp 11), chưa có logarit (học ở lớp 11), chưa có lượng giác góc tổng quát.
- Ghi công thức hoặc định luật được dùng (dạng chữ ngắn) và đơn vị chuẩn.
- Đề tốt nghiệp 2025 môn này có 3 phần: trắc nghiệm, đúng/sai, trả lời ngắn. Ghi đúng số câu và cách tính điểm.
```

**KHTN 6–9, Lịch sử–Địa lí 6–9:**
```
## Riêng môn này
- Đây là môn tích hợp. Thêm trường "mach" cho mỗi chương: "Lý"/"Hoá"/"Sinh"/"Trái Đất và bầu trời" (KHTN) hoặc "Lịch sử"/"Địa lí" (LS–ĐL).
- Thứ tự và cách xếp mạch giữa các bộ sách khác nhau nhiều. Ghi rõ trong "ten_theo_sach".
```

**Ngữ văn (6–12):**
```
## Riêng môn này (thay ý nghĩa một số trường)
- Mỗi "chuong" là một BÀI HỌC/CHỦ ĐỀ trong sách (theo thể loại).
- "kien_thuc_duoc_dung" = thể loại văn bản, đặc điểm thể loại và kiến thức tiếng Việt học sinh đã có (biện pháp tu từ, từ loại…) tính đến bài đó.
- "chua_duoc_dung" = thể loại, khái niệm, thuật ngữ chưa học ở lớp đó, ví dụ: lớp 6 chưa học nghị luận văn học hoàn chỉnh.
- "dang_bai_dien_hinh" = dạng câu hỏi đọc hiểu và đề viết (kiểu bài) của bài đó.
- Thêm trường "van_ban_trong_sach": tên các văn bản chính. Mục đích là để AI KHÔNG dùng lại các văn bản này làm ngữ liệu đề kiểm tra: chương trình 2018 yêu cầu ngữ liệu ngoài sách giáo khoa.
- "cau_truc_de": phần Đọc hiểu (số câu, loại câu) + phần Viết (kiểu bài, điểm), cùng quy định ngữ liệu ngoài sách.
```

**Tiếng Anh (6–12):**
```
## Riêng môn này
- Bám bộ "Global Success" (NXB Giáo dục Việt Nam). Nếu có thì ghi khác biệt với "Friends Plus" hoặc "i-Learn Smart World".
- Mỗi "chuong" là một UNIT. Thêm các trường "chu_de", "tu_vung" (nhóm từ chính), "ngu_phap", "phat_am".
- "chua_duoc_dung" = cấu trúc ngữ pháp chưa học tính đến unit đó, ví dụ: câu bị động, câu điều kiện loại 2/3, mệnh đề quan hệ, câu tường thuật, ghi rõ học ở lớp/unit nào. Đây là lỗi AI hay mắc nhất.
- "cau_truc_de": các dạng bài (phát âm, trọng âm, từ vựng–ngữ pháp, đọc điền từ, đọc hiểu, viết lại câu, sắp xếp câu…) và số câu mỗi dạng. Với lớp 12, dùng cấu trúc đề tốt nghiệp từ 2025 (40 câu).
```

**Sử, Địa, Tin, Kinh tế–Pháp luật, Công nghệ (10–12):** dùng phần chung. Riêng Tin học thì thêm: "ngôn ngữ lập trình dùng trong sách (Python), cấu trúc lệnh nào học ở lớp nào".

**Tiểu học (lớp 1–5):**
```
## Riêng môn này
- Viết ngắn hơn: mỗi chương 100–250 từ.
- Đánh giá theo Thông tư 27/2020: chỉ có kiểm tra định kỳ cuối học kỳ (lớp 4–5 thêm giữa kỳ với Toán, Tiếng Việt). Đề có 3 mức (Mức 1, 2, 3), không dùng NB/TH/VD.
- "chua_duoc_dung" ghi rõ phạm vi số (ví dụ: lớp 1 trong phạm vi 100, lớp 2 trong phạm vi 1000), phép tính chưa học, đơn vị đo chưa học.
- Lưu ý trình bày cho lứa tuổi: câu ngắn, có tranh.
```

---

## B. Cách kiểm file agent gửi về

### B1. Kiểm máy (luôn chạy đầu tiên)
Chạy script tóm tắt cấu trúc: số chương mỗi lớp, trùng id, trường rỗng, `pham_vi` trỏ id không tồn tại, số từ mỗi chương. Có thể viết lại từ đoạn mẫu dưới đây (dùng ở phiên 24):

```bash
node -e '
const d=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));const ids=new Set();
for(const l of d.lop){console.log("Lop",l.lop,"chuong",l.chuong.length);
for(const c of l.chuong){if(ids.has(c.id))console.log("TRUNG",c.id);ids.add(c.id);
const miss=["id","ten","hoc_ky","yeu_cau_can_dat","chua_duoc_dung","dang_bai_dien_hinh"].filter(k=>!c[k]||(Array.isArray(c[k])&&!c[k].length));
console.log("  ",c.id,"HK"+c.hoc_ky,c.ten,miss.length?"THIEU "+miss:"")}}
for(const e of d.cau_truc_de)for(const x of [].concat(e.pham_vi||[]))if(typeof x==="string"&&/^[a-z]+\d+-/.test(x)&&!ids.has(x))console.log("PHAM_VI SAI",x);
' <file.json>
```

Sau đó in riêng `yeu_cau_can_dat`, `chua_duoc_dung`, `luu_y_ra_de` của mọi chương ra file tạm rồi đọc hết. File dài thì đọc theo từng đoạn.

### B2. Kiểm nội dung (phần quan trọng, phải đọc)
1. **Thiếu chương**: so danh sách chương với mục lục ít nhất một bộ sách mà mình nắm chắc. Ở bản Toán, agent bỏ sót 3 chương. Chỗ nào nghi ngờ thì tra web để xác nhận.
2. **Mâu thuẫn chéo giữa các lớp**: lớp A ghi "X học ở lớp B", thì lớp B phải có X. Bản Toán từng ghi "xác suất cổ điển học ở lớp 10" trong khi lớp 8 đã học, và "ghép nhóm học ở lớp 12" trong khi lớp 9 và 11 đã có.
3. **Sai do nhầm chương trình cũ**: agent hay lấy chương trình 2006. Kiểm các nội dung đã đổi lớp hoặc bị bỏ của môn đó.
4. **Ghi "giảm tải" hoặc "đã bỏ" quá tay**: bản Toán ghi sai rằng công thức cộng xác suất tổng quát và vị trí tương đối hai đường tròn đã bỏ, và ghi bỏ hẳn hàm trùng phương (thật ra chỉ bỏ phần khảo sát). Mỗi chỗ ghi "bỏ" đều phải kiểm lại.
5. **Mục cho đủ số trong `chua_duoc_dung`** (kiến thức đại học, số phức ở môn khác…): xoá đi.
6. **`cau_truc_de`**: đề tốt nghiệp phải khớp quy định của Bộ (số câu, cách tính điểm). Đề định kỳ không có quy định chung thì chấp nhận cấu trúc phổ biến, nhưng phải ghi là "phổ biến" và không trình bày như quy định bắt buộc.
7. Thuật ngữ thống nhất với SGK hiện hành, ví dụ "Pythagore", "Thalès", "lôgarit".

### B3. Sửa và lưu
- Không sửa tay trong file 150 KB. Viết một script Node trong scratchpad (dùng Write, vì có tiếng Việt và regex): đọc file gốc, sửa theo id chương (thay hoặc xoá mục bằng regex, chèn chương mới sau một id), kiểm `JSON.parse`, rồi ghi ra `src/data/khung<Mon>.json` (ví dụ `khungLy.json`, `khungVan.json`). Mẫu: phiên 24 dùng `fix-khung.mjs` với các hàm `ch(id)`, `replaceIn(arr, re, val)`, `insertAfter(lop, afterId, chuong)`.
- Thêm trường `"phien_ban"` ghi ngày rà và tóm tắt các chỗ đã sửa. Chỗ nào chưa chắc thì ghi vào `ghi_chu_chua_chac`.
- Báo người dùng: số chương mỗi lớp, danh sách lỗi đã sửa, điểm còn chưa chắc. Chỉ commit khi người dùng bảo.
- Cập nhật danh sách dưới đây.

---

## C. Đã có

| Môn | File | Trạng thái |
|---|---|---|
| Toán 6–12 | `src/data/khungToan.json` | Đã kiểm 07/11/2026. Chưa nối vào prompt (xem phiên 24 mục 3) |
