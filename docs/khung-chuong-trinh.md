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

## C. Bản đồ môn theo cấp học và cách chia file

### C1. Cấp nào có môn nào (GDPT 2018)

| Cấp | Môn có ra đề viết | Ghi chú |
|---|---|---|
| Tiểu học 1–3 | Toán, Tiếng Việt, Tự nhiên và Xã hội, Đạo đức; Tiếng Anh từ lớp 3; Tin học và Công nghệ từ lớp 3 | Đánh giá theo TT 27/2020, đề 3 mức (Mức 1/2/3), không dùng NB/TH/VD |
| Tiểu học 4–5 | Toán, Tiếng Việt, Tiếng Anh, Khoa học, Lịch sử và Địa lí, Tin học và Công nghệ, Đạo đức | Như trên |
| THCS 6–9 | Toán, Ngữ văn, Tiếng Anh, **KHTN** (gộp Lý/Hoá/Sinh), **Lịch sử và Địa lí** (gộp 2 phân môn), GDCD, Công nghệ, Tin học | Đề định kỳ theo TT 22/2021 |
| THPT 10–12 | Bắt buộc: Toán, Ngữ văn, Tiếng Anh, Lịch sử. Lựa chọn: Lý, Hoá, Sinh, Địa, Kinh tế và Pháp luật, Tin học (2 định hướng ICT/CS), Công nghệ (2 định hướng Công nghiệp/Nông nghiệp) | Đề tốt nghiệp 2025. Văn tự luận; Anh 40 câu; các môn khác 3 phần TN / Đúng-Sai / Trả lời ngắn (ghi đúng số câu trong `cau_truc_de` từng file) |

Không làm khung cho: Âm nhạc, Mỹ thuật, Giáo dục thể chất, Hoạt động trải nghiệm, Giáo dục quốc phòng và an ninh (gần như không ra đề viết trên web).

### C2. Chia file như thế nào
Nguyên tắc: **mỗi file một môn hoặc một phân môn, kéo dài qua nhiều cấp nếu nội dung nối tiếp nhau.** Môn gộp ở THCS thì tách theo phân môn và ghép lại lúc soạn đề.

| File | Gồm | Ghi chú |
|---|---|---|
| `khungToan.json` | Toán 6–12 | id `t<lớp>-…` |
| `khungLy.json` | Vật lí 10–12 | trường riêng `cong_thuc` |
| `khungHoa.json` | Hoá học 10–12 | `chat_va_phan_ung`, `cong_thuc`; danh pháp IUPAC |
| `khungSinh.json` | Sinh học 10–12 | `thuat_ngu`, `qua_trinh_va_co_che`, `cong_thuc` |
| `khungKhtn.json` | KHTN 6–9 | mỗi chương có `mach` (Lý/Hoá/Sinh/Trái Đất và bầu trời) |
| `khungVan.json` | Ngữ văn 6–12 | chương = nhóm thể loại; `van_ban_trong_sach` (để TRÁNH dùng làm ngữ liệu); `yeu_cau_can_dat` chia doc/viet/noi_nghe; có đề vào lớp 10 |
| `khungAnh.json` | Tiếng Anh 6–12 | chương = UNIT của Global Success; id `anh<lớp>-u<nn>`; bảng `tien_trinh_ngu_phap` |
| `khungSu.json` | Lớp 6–9: **phân môn Lịch sử** của môn Lịch sử và Địa lí; lớp 10–12: Lịch sử | `su_kien_moc`, `nhan_vat`, `khai_niem`; chủ đề chung có `mach: "chủ đề chung"` |
| `khungDia.json` | Lớp 6–9: **phân môn Địa lí**; lớp 10–12: Địa lí | `so_lieu_moc` (có năm + nguồn), `dia_danh`, bảng `ky_nang_tinh_toan`; lưu ý sáp nhập tỉnh 2025 |
| `khungTin.json` | Tin học 6–12 | `mach` (A–G), `dinh_huong` (chung/ICT/CS) lớp 10–12; `phan_mem_ngon_ngu`; bảng `tien_trinh_lap_trinh` |
| `khungGdcd.json` / `khungKtpl.json` | GDCD 6–9 / Kinh tế và Pháp luật 10–12 | `can_cu_phap_ly` có `hieu_luc` |
| `khungCongNghe.json` | Công nghệ 6–12 | lớp 10–12 có `dinh_huong` (Công nghiệp/Nông nghiệp); lớp 9 có `mo_dun` |
| `khungToanTieuHoc.json`, `khungTiengViet.json`, `khungTieuHocKhac.json` | Tiểu học | `cap`, `danh_gia` (TT 27/2020); file khác có `mon` ở từng lớp |
| `khungTieuHoc.json` (hoặc tách theo môn) | các môn tiểu học | làm sau cùng; chưa có prompt |

Prompt mẫu cho từng môn: dùng A1 + A2. Các prompt đầy đủ đã đưa cho người dùng (Lý, Hoá, Sinh, Văn, Anh, Tin, Sử, Địa) có thêm các trường riêng ghi ở bảng trên. Viết prompt mới thì giữ đúng tên trường đó.

### C3. Nối vào prompt AI trong web (ĐÃ LÀM 08/11/2026: src/lib/khungPrompt.ts, kiểm bằng `npx tsx scripts/check-khung.ts`)
- Từ yêu cầu của giáo viên (hoặc ô chọn trong AiPanel), xác định **môn + lớp + phạm vi** (chương cụ thể, hoặc loại đề "giữa kỳ 1"…). Ánh xạ môn → file:
  - THCS "Khoa học tự nhiên" → `khungKhtn`; THCS "Lịch sử và Địa lí" → **cả** `khungSu` (lớp 6–9) **và** `khungDia` (lớp 6–9), ghép theo tỉ lệ điểm phân môn ghi trong `cau_truc_de`; THCS "GDCD" và THPT "Kinh tế và Pháp luật" → `khungGdcdKtpl`.
  - THPT Tin/Công nghệ: hỏi hoặc suy ra định hướng, chỉ lấy chương `dinh_huong` = "chung" + định hướng đó.
  - Tiểu học: dùng file tiểu học; đề theo 3 mức, không dùng NB/TH/VD.
- Chỉ cắt các chương trong phạm vi: `ten`, `yeu_cau_can_dat`, `kien_thuc_duoc_dung` (hoặc trường tương ứng), `chua_duoc_dung`, `dang_bai_dien_hinh`, `luu_y_ra_de`, cộng các trường riêng ngắn (công thức, mốc, số liệu). Bỏ `ten_theo_sach` trừ khi giáo viên nêu bộ sách. Thêm mục `cau_truc_de` phù hợp. Mục tiêu 300–3.000 token.
- Câu dặn trong prompt: "Chỉ dùng kiến thức trong khung dưới đây; tuyệt đối không dùng mục ‘chưa được dùng’." Với Văn thêm: "Ngữ liệu phải ngoài sách giáo khoa, không dùng các văn bản trong `van_ban_trong_sach`."
- Môn chưa có file khung: soạn như hiện nay (không chèn gì), không chặn.
- Nạp file bằng `import()` động theo môn để không làm nặng bundle.

---

## D. Đã có

| Môn | File | Trạng thái |
|---|---|---|
| Toán 6–12 | `src/data/khungToan.json` | Đã kiểm 07/11/2026 |
| Lý, Hoá, Sinh 10–12 | `khungLy.json`, `khungHoa.json`, `khungSinh.json` | Đã kiểm 08/11/2026, sửa vài lỗi (xem `phien_ban` trong file) |
| Ngữ văn 6–12 | `khungVan.json` | Đã kiểm 08/11/2026, không có lỗi lớn |
| Lịch sử 6–12 | `khungSu.json` | Đã kiểm 08/11/2026. Lớp 11: Claude đã thay một chủ đề sai bằng "Quá trình giành độc lập dân tộc của các quốc gia Đông Nam Á" |
| Tin học 6–12 | `khungTin.json` | Đã kiểm. Lớp 11–12 làm lại 08/11/2026 (nhánh feat/khung-chuong-trinh); HTML/CSS lớp 12 Claude chuyển về phần chung. Tỉ lệ chung/riêng đề TN chưa đối chiếu |
| Tiếng Anh 6–12 | `khungAnh.json` | Đã ghép 08/11/2026: lớp 6 bản cũ, 7–12 agent làm lại. Trường riêng `chu_de/tu_vung/ngu_phap`; `ten`, `yeu_cau_can_dat` do Claude suy ra |
| KHTN 6–9 | `khungKhtn.json` | Đã ghép 08/11/2026 (10/10/8/14 chương) |
| GDCD 6–9, KTPL 10–12 | `khungGdcd.json`, `khungKtpl.json` | Đã ghép 08/11/2026. Lưu ý Hiến pháp có thể sửa đổi 2025 |
| Tiểu học 1–5 | `khungToanTieuHoc.json`, `khungTiengViet.json`, `khungAnh.json` (lớp 3–5), `khungTieuHocKhac.json` | Đã ghép 08/11/2026 từ khung_C…G. File "khác" gồm Khoa học, LS&ĐL, Tin học, Công nghệ, TN&XH, Đạo đức, lọc theo trường `mon` của từng lớp; phần này chưa có `cau_truc_de` |
| Địa lí 6–12 | `khungDia.json` | Đã ghép 08/11/2026. Chia theo chủ đề lớn; lớp 6–7 vài chủ đề chưa tra số bài |
| Công nghệ 6–12 | `khungCongNghe.json` | Đã ghép 08/11/2026 từ khung_A, khung_B (bản gốc ở scripts/khung/ban-goc/) |

Lý do các file nháp thiếu: agent ngoài không tra được mục lục SGK hoặc văn bản chương trình nên tự dừng. Khi giao lại thì chia nhỏ (mỗi lần 1–2 lớp hoặc 1 môn) và yêu cầu tra mục lục từng bộ sách trước.

Đã nối tất cả file vào prompt AI soạn đề (src/lib/khungPrompt.ts): đoán môn + lớp + chương/học kỳ từ yêu cầu, nạp lười đúng file. Thêm môn mới: thêm 1 dòng vào SUBJECTS và 1 loader trong F.
