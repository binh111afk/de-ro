# Soạn thêm câu cho ngân hàng (cách tốn ít token nhất)

Đọc file này là đủ, không cần mở lại BAN_GIAO hay phiên cũ.

## Nguyên tắc
- **Người dùng không muốn subagent Haiku/Sonnet.** GLM soạn, Claude chỉ kiểm.
- **Đừng tự lái ZCode bằng computer use** (tốn token chụp màn hình). Viết file yêu cầu rồi đưa người dùng một prompt để họ dán vào ZCode (project `dethinhbien`, Start Plan → GLM-5.3-Flash). Không dùng CLI `zcode -p` (gọi nhầm model, lỗi).
- Đầu vào cho GLM: `BRIEF.md` (định dạng chung, Toán), `BRIEF_MON.md` (môn khác, kể cả Sử/Địa/Tin/GDKT&PL), file yêu cầu theo mẫu `YEU_CAU_500.md` (bảng lô: tên file, subject, số câu, chủ đề, số TN/ĐS/TLN). **Cộng lại bảng lô trước khi giao** (lần trước tiêu đề 500 nhưng bảng ra 600).

## Các bước
1. Copy `YEU_CAU_500.md` thành `YEU_CAU_<đợt>.md`, sửa bảng lô, cho GLM ghi vào thư mục mới `scripts/bank/<đợt>/`. Tránh trùng chủ đề đã có (xem tên file trong `new/` và các `*.json` gốc).
2. Đưa người dùng prompt:
   ```
   Đọc và làm đúng theo file scripts/bank/YEU_CAU_<đợt>.md (đọc thêm scripts/bank/BRIEF.md và BRIEF_MON.md). Mỗi lô một file JSON riêng vào scripts/bank/<đợt>/, lô nào đã có file thì bỏ qua. Không sửa file nào khác. Xong báo mỗi file một dòng: tên, số câu, số câu có hình.
   ```
3. Xong thì `cp -r <đợt> <đợt>.orig` rồi kiểm cấu trúc: `node build.mjs <đợt> /tmp/x.ts` (in câu lỗi định dạng).
4. Kiểm đáp án: `node dump.mjs <đợt>/<file>.json` (in đề, phương án, đáp án, hình; thêm tham số `1` để in lời giải — chỉ dùng khi cần). Đọc 2 file mỗi lần, tự giải nhẩm; câu tính số thì kiểm bằng `node -e`. Không đọc lời giải GLM trừ câu nghi ngờ.
5. Ghi mọi sửa vào **một** script `fix_<đợt>.mjs` (mẫu: `fix3.mjs` có helper `q(file, n)`, `opt(...)`, xoá câu, sửa chữ chung). Câu đổi đáp án thì sửa luôn `explanation` (mẫu `fix3b.mjs`), hình thì như `fix3c.mjs`.
6. Gộp: `node build.mjs <đợt> ../../src/data/bankThpt<N>.ts BANK_THPT<N>`, thêm import vào `loadFullBank()` trong `src/data/bank.ts`. ID tự sinh `thpt-<tên file>-NN` nên **tên file phải khác mọi file cũ**.
7. Xem hình: chạy dev (`preview_start` "dev"), trong trình duyệt chạy đoạn JS dưới, chụp 3–4 màn là xem hết:
   ```js
   const { BANK_THPT<N> } = await import('/src/data/bankThpt<N>.ts'); const t = await import('/src/examEditor/toolImages.ts');
   document.body.innerHTML='<div id=g style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;background:#fff"></div>';
   for (const e of BANK_THPT<N>.filter(e=>e.figure)) { const a=t.figureImageAttrs(t.figureDoc(e.figure)); g.insertAdjacentHTML('beforeend',`<div style="font:10px sans-serif"><b>${e.id}</b><br><img src="${a.src}" style="max-width:100%;max-height:170px"></div>`) }
   ```
8. `npx tsc -p tsconfig.app.json --noEmit`. Commit/push chỉ khi người dùng bảo.

## Lỗi GLM hay mắc (soi kỹ những chỗ này)
- Đúng/sai: ý đúng bị đánh S (hoặc ngược) dù lời giải tự tính đúng — so từng ý với đáp án. Đây là lỗi nhiều nhất.
- Tính sai số học trong câu VD/VDC (vd 4 + 3 = 7,5), hình không gian dùng nhầm đoạn (trung tuyến thay cho OA), đơn vị lệch 100–1000 lần.
- Đề thiếu dữ kiện / nhiều đáp án hợp lệ (sĩ số lớp, este có nhiều đồng phân, "một tế bào" thay "một cơ thể", phả hệ hai cách hiểu).
- Số liệu trên hình không khớp đề (hình p–V, `scene`), dạng hình sai (`pyramid4` thay `pyramid4-sa`), đồ thị tràn khung (thêm `yMin`/`yMax`).
- Sử/Địa: sai mốc, bịa trích dẫn; Anh: đọc hiểu ghi "như câu trước" thay vì chép đoạn văn; lặp phương án trong prompt.
- Chữ: "suất phản động", "nucleôtít", "(dư vừa đủ)", "phân hạch" thay "phân huỷ".
- Câu trùng giữa các lô.

## Độ khó
Chip tự lấy từ tag `level` (NB/TH → Dễ, VD → TB, VDC → Khó) trong `src/data/bankLevel.ts`. Câu dễ mà GLM gắn VDC (hay gặp ở Anh, Tin) thì hạ `level` trong script sửa.
