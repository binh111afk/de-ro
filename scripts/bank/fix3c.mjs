// Chỉnh hình sau khi xem trên dev server. Chạy sau fix3b.mjs.
import fs from 'node:fs'
const P = {
  'toan-b#7': (f) => Object.assign(f, { yMin: -1, yMax: 6 }),
  'toan-b#16': (f) => Object.assign(f, { xMin: -0.2, xMax: 1.6, yMin: -0.2, yMax: 1.8 }),
  'toan-e#18': (f) => { f.shape = 'pyramid4-sa' },
  'ly-a#20': (f) => { f.states = '1: (5; 1)\n2: (5; 1,5)' },
  'dia#8': (f) => { f.data = f.data.replace('Nông-lâm-thủy sản; Công nghiệp-xây dựng; Dịch vụ; Thuế trừ trợ cấp', 'NLTS; CN-XD; Dịch vụ; Thuế') },
  'dia#22': (f) => { f.data = f.data.replace('Nông-lâm-thủy sản; Công nghiệp-xây dựng; Dịch vụ; Thuế trừ trợ cấp', 'NLTS; CN-XD; Dịch vụ; Thuế') },
}
const by = {}
for (const [k, fn] of Object.entries(P)) { const [f, n] = k.split('#'); (by[f] ??= []).push([+n, fn]) }
for (const [f, list] of Object.entries(by)) {
  const p = `new/${f}.json`, a = JSON.parse(fs.readFileSync(p, 'utf8'))
  for (const [n, fn] of list) fn(a[n - 1].figure)
  fs.writeFileSync(p, JSON.stringify(a, null, 2) + '\n')
}
// câu Địa có biểu đồ GDP: nói rõ chữ viết tắt
for (const n of [8, 22]) {
  const p = 'new/dia.json', a = JSON.parse(fs.readFileSync(p, 'utf8'))
  a[n - 1].prompt = a[n - 1].prompt.replace('năm 2022.', 'năm 2022 (NLTS: nông – lâm – thủy sản; CN-XD: công nghiệp – xây dựng; Thuế: thuế sản phẩm trừ trợ cấp).')
  fs.writeFileSync(p, JSON.stringify(a, null, 2) + '\n')
}
console.log('ok')
