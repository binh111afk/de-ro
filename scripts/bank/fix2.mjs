import fs from 'node:fs'
const dir = process.argv[2]
const edit = (file, fn) => {
  const p = `${dir}/${file}`
  const a = JSON.parse(fs.readFileSync(p, 'utf8'))
  fn(a)
  fs.writeFileSync(p, JSON.stringify(a, null, 2))
}
edit('hoa12.json', (a) => {
  for (const q of a) {
    if (q.figure?.kind !== 'stats') continue
    if (q.figure.data.startsWith('Mg Al Zn Fe')) q.figure.data = 'Mg; Al; Zn; Fe\nThể tích H2 (L): 2,24; 3,36; 2,24; 2,24'
    if (q.figure.data.startsWith('Zn Fe Cu Ag')) q.figure.data = 'Zn; Fe; Cu; Ag\nE° (V): -0,76; -0,44; 0,34; 0,80'
  }
})
edit('ly12.json', (a) => {
  for (const q of a) {
    if (q.figure?.kind === 'circuit' && q.figure.text.includes('L=0,4H')) q.figure.text = 'nguồn E = 6 V, r = 0.5 Ω\nK - L=0.4H - R=2.5Ω'
  }
})
console.log('ok')
