// Ghép các file khung_A..G (agent bên ngoài, 08/11/2026) từ ban-goc/ vào src/data/
import { readFileSync as R, writeFileSync as W } from 'fs'
const B = new URL('./ban-goc/', import.meta.url), O = new URL('../../src/data/', import.meta.url)
const NGAY = '08/11/2026'
const load = (f, sua = '') => JSON.parse(R(new URL(f, B), 'utf8') + sua)
const ccLa = /[฀-๿぀-ヿ一-鿿]+/g
const clean = (v) => (typeof v === 'string' ? v.replace(ccLa, '') : Array.isArray(v) ? v.map(clean) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clean(x)])) : v)
const TH = { cap: 'Tiểu học', danh_gia: 'Thông tư 27/2020: đề 3 mức (Mức 1/2/3), không dùng NB/TH/VD' }

function save(d, name, sua) {
  d = clean(d)
  d.lop.sort((a, b) => a.lop - b.lop || String(a.mon ?? '').localeCompare(String(b.mon ?? '')))
  const ids = d.lop.flatMap((l) => l.chuong.map((c) => c.id))
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i)
  if (dup.length) throw new Error(name + ' trùng id: ' + [...new Set(dup)])
  d.phien_ban = `Claude ghép ${NGAY}: ${sua}`
  W(new URL(name, O), JSON.stringify(d, null, 2) + '\n')
  console.log(name, d.lop.map((l) => `${l.mon ? l.mon + ' ' : ''}L${l.lop}:${l.chuong.length}`).join(' | '))
}
const gop = (ds, extra) => ({
  ...extra,
  muc_luc_da_tra: ds.flatMap((d) => d.muc_luc_da_tra ?? []),
  lop: ds.flatMap((d) => d.lop),
  cau_truc_de: ds.flatMap((d) => d.cau_truc_de ?? []),
})

// Công nghệ 6–12
{
  const a = load('khung_A.json'), b = load('khung_B.json')
  save(gop([a, b], { mon: 'Công nghệ', sach_chinh: a.sach_chinh }), 'khungCongNghe.json', 'khung_A (6–9) + khung_B (10–12, 2 định hướng).')
}
// Toán, Tiếng Việt tiểu học
{
  const c = load('khung_C.json')
  save(gop([c], { mon: 'Toán', ...TH, sach_chinh: c.sach_chinh }), 'khungToanTieuHoc.json', 'khung_C.')
  const d = load('khung_D.json')
  save(gop([d], { mon: 'Tiếng Việt', ...TH, sach_chinh: d.sach_chinh }), 'khungTiengViet.json', 'khung_D.')
}
// Tiếng Anh 3–5 nối vào khungAnh.json (6–12)
{
  const e = load('khung_E.json'), anh = JSON.parse(R(new URL('khungAnh.json', O), 'utf8'))
  anh.lop = anh.lop.filter((l) => l.lop >= 6).concat(e.lop)
  anh.cau_truc_de = (anh.cau_truc_de ?? []).filter((x) => !(x.lop <= 5)).concat(e.cau_truc_de ?? [])
  anh.muc_luc_da_tra = [].concat(anh.muc_luc_da_tra ?? []).filter((x) => !(x?.lop <= 5)).concat(e.muc_luc_da_tra ?? [])
  anh.ghi_chu_tieu_hoc = 'Lớp 3–5 đánh giá theo ' + TH.danh_gia
  save(anh, 'khungAnh.json', 'lớp 6 bản cũ, 7–12 agent làm lại (nhánh feat/khung-chuong-trinh), 3–5 từ khung_E.')
}
// Các môn tiểu học khác: mỗi lớp có trường "mon"
{
  const f = load('khung_F.json'), g = load('khung_G.json', ']}') // file G bị cụt mất "]}" cuối
  save(gop([f, g], { mon: 'Tiểu học – các môn khác', ...TH, cac_mon: ['Khoa học', 'Lịch sử và Địa lí', 'Tin học', 'Công nghệ', 'Tự nhiên và Xã hội', 'Đạo đức'] }), 'khungTieuHocKhac.json', 'khung_F (Khoa học, LS&ĐL 4–5) + khung_G (Tin học, Công nghệ 3–5; TN&XH 1–3; Đạo đức 1–5; file gốc cụt đuôi, chưa có cau_truc_de). Lọc theo trường "mon" ở từng lớp.')
}
