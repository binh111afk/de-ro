import { fileURLToPath } from 'node:url'
import {readFileSync as R, writeFileSync as W} from 'fs'
const K=fileURLToPath(new URL('./ban-goc/nhanh-khung/', import.meta.url)), O=fileURLToPath(new URL('../../src/data/', import.meta.url))
const r=f=>JSON.parse(R(f,'utf8'))
const NGAY='08/11/2026'
function merge(files, mon, extra={}) {
  const ds=files.map(f=>typeof f==='string'?r(K+f):f)
  const d={mon, ...extra, lop:[], cau_truc_de:[], muc_luc_da_tra:[]}
  for (const x of ds){
    d.lop.push(...x.lop); d.cau_truc_de.push(...(x.cau_truc_de||[]))
    if (x.muc_luc_da_tra) d.muc_luc_da_tra.push(...[].concat(x.muc_luc_da_tra))
    for (const k of ['tien_trinh_ngu_phap','tien_trinh_lap_trinh','nguon','sach']) if (x[k]&&!d[k]) d[k]=x[k]
  }
  d.lop.sort((a,b)=>a.lop-b.lop)
  const ids=d.lop.flatMap(l=>l.chuong.map(c=>c.id)); const dup=ids.filter((x,i)=>ids.indexOf(x)!==i)
  if (dup.length) throw new Error(mon+' trùng id '+dup)
  return d
}
const save=(d,name,sua)=>{d.phien_ban=`Claude ghép ${NGAY} từ nhánh feat/khung-chuong-trinh: ${sua}`;W(O+name,JSON.stringify(d,null,2)+'\n');console.log(name,d.lop.map(l=>`L${l.lop}:${l.chuong.length}`).join(' '))}

// Tin: thay lớp 11–12 cũ
{ const old=r(O+'khungTin.json'), n=r(K+'khung_tin_11_12.json')
  const c=n.lop.find(l=>l.lop===12).chuong.find(c=>/HTML/.test(c.ten))
  c.ten='Thiết kế trang web bằng HTML và CSS'; c.dinh_huong='chung'
  c.luu_y_ra_de=(c.luu_y_ra_de||'')+' Claude sửa: HTML/CSS thuộc phần chung lớp 12 (chủ đề F), không riêng CS.'
  old.lop=old.lop.filter(l=>l.lop<11).concat(n.lop)
  const lopDe=e=>Number(String(e.lop??e.ten??'').match(/\d+/)?.[0])
  old.cau_truc_de=(old.cau_truc_de||[]).filter(e=>!(lopDe(e)>=11)).concat(n.cau_truc_de||[])
  old.muc_luc_da_tra=n.muc_luc_da_tra
  save(old,'khungTin.json','lớp 11–12 làm lại theo mục lục; HTML/CSS lớp 12 chuyển về phần chung.') }

save(merge(['khung_khtn_6_7.json','khung_khtn_8_9.json'],'Khoa học tự nhiên'),'khungKhtn.json','gộp 6–7 và 8–9.')
save(merge(['khung_gdcd_6_9.json'],'Giáo dục công dân'),'khungGdcd.json','nguyên bản agent.')
save(merge(['khung_ktpl_10_12.json'],'Giáo dục kinh tế và pháp luật'),'khungKtpl.json','nguyên bản agent.')
save(merge(['khung_dia_6_9.json','khung_dia_10_12.json'],'Địa lí'),'khungDia.json','gộp 6–9 (phân môn Địa của LS&ĐL) và 10–12.')

// Anh: lớp 6 từ bản cũ + 7–12 mới; đổi trường về mẫu chung
{ const old=r(fileURLToPath(new URL('./ban-goc/', import.meta.url)) + 'khung_anh_6_12.json')
  const l6={...old.lop.find(l=>l.lop===6)}
  const d=merge([{lop:[l6],tien_trinh_ngu_phap:old.tien_trinh_ngu_phap},'khung_anh_7_9.json','khung_anh_10_12.json'],'Tiếng Anh',{sach:'Global Success'})
  for (const l of d.lop) for (const c of l.chuong){
    c.ten ??= c.chu_de
    c.yeu_cau_can_dat ??= [c.tu_vung&&'Từ vựng: '+[].concat(c.tu_vung).join(', '), c.ngu_phap&&'Ngữ pháp: '+[].concat(c.ngu_phap).join(', '), c.phat_am&&'Phát âm: '+[].concat(c.phat_am).join(', ')].filter(Boolean)
    c.kien_thuc_duoc_dung ??= c.ngu_phap_da_hoc_truoc
  }
  save(d,'khungAnh.json','lớp 6 từ bản cũ, 7–12 agent làm lại; thêm ten/yeu_cau_can_dat suy từ chu_de/tu_vung/ngu_phap.') }
