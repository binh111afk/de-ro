/**
 * Ảnh gốc PNG nét đen (gen.mjs) → kho vector của app:
 *   src/data/figureSprites.json  {id: {w,h,ink,body}} — ink = nét (potrace), body = bóng hình đặc (tô trắng che vật phía sau)
 *   src/lib/objectsCatalog.ts    tên đồ vật + thông số miệng đồ chứa (containers.json)
 * potrace không nằm trong package.json: cài tạm ở thư mục khác rồi trỏ POTRACE tới đó
 *   npm i --prefix <tmp> potrace@2.1.8
 *   POTRACE=<tmp>/node_modules/potrace node scripts/figure-sprites/vector.cjs <thư mục ảnh gốc> [id…]
 */
const { createCanvas, loadImage } = require('@napi-rs/canvas')
const { Potrace } = require(process.env.POTRACE || 'potrace')
const fs = require('fs')
const T = 320 // cạnh dài sau khi thu nhỏ (đơn vị toạ độ của path)

function traceBits(bits, w, h) {
  const c = createCanvas(w, h), g = c.getContext('2d'), d = g.createImageData(w, h)
  for (let i = 0; i < w * h; i++) { const v = bits[i] ? 0 : 255; d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255 }
  g.putImageData(d, 0, 0)
  const buf = c.toBuffer('image/png')
  return new Promise((ok, bad) => {
    const p = new Potrace({ turdSize: 8, optTolerance: 0.7, threshold: 128, blackOnWhite: true })
    p.loadImage(buf, (err) => {
      if (err) return bad(err)
      const tag = p.getPathTag()
      const dd = /\sd="([^"]*)"/.exec(tag)?.[1] ?? ''
      ok(dd.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10)).replace(/\s+/g, ' ').trim())
    })
  })
}

function dilate(bits, w, h, r) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!bits[y * w + x]) continue
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const X = x + dx, Y = y + dy
      if (X >= 0 && Y >= 0 && X < w && Y < h && dx * dx + dy * dy <= r * r) out[Y * w + X] = 1
    }
  }
  return out
}

async function vectorize(file) {
  const img = await loadImage(file)
  const c0 = createCanvas(img.width, img.height), g0 = c0.getContext('2d')
  g0.drawImage(img, 0, 0)
  const p = g0.getImageData(0, 0, img.width, img.height).data
  let x0 = img.width, y0 = img.height, x1 = 0, y1 = 0
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    const i = (y * img.width + x) * 4
    if ((p[i] + p[i + 1] + p[i + 2]) / 3 < 150) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  }
  const pad = 6, sw = x1 - x0 + 1 + 2 * pad, sh = y1 - y0 + 1 + 2 * pad
  const s = T / Math.max(sw, sh), w = Math.round(sw * s), h = Math.round(sh * s)
  const c = createCanvas(w, h), g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
  g.imageSmoothingQuality = 'high'
  g.drawImage(c0, x0 - pad, y0 - pad, sw, sh, 0, 0, w, h)
  const q = g.getImageData(0, 0, w, h).data
  const ink = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) ink[i] = (q[i * 4] + q[i * 4 + 1] + q[i * 4 + 2]) / 3 < 150 ? 1 : 0
  // bóng hình: bịt khe nét (giãn 3px), loang từ mép = bên ngoài; còn lại là thân
  const R = 3, closed = dilate(ink, w, h, R), outside = new Uint8Array(w * h), st = []
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1)
  while (st.length) { const i = st.pop(); if (outside[i] || closed[i]) continue; outside[i] = 1; const x = i % w, y = (i / w) | 0; if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w) }
  // co lại R px để bóng không phình ra ngoài nét
  const notBody = dilate(outside, w, h, R)
  const body = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) body[i] = notBody[i] ? ink[i] : 1
  return { w, h, ink: await traceBits(ink, w, h), body: await traceBits(body, w, h) }
}

const path = require('path')
const ROOT = path.join(__dirname, '..', '..')
const OUT = path.join(ROOT, 'src/data/figureSprites.json')
const CATALOG = path.join(ROOT, 'src/lib/objectsCatalog.ts')

;(async () => {
  const [dir, ...ids] = process.argv.slice(2)
  const list = JSON.parse(fs.readFileSync(path.join(__dirname, 'hinh-tieu-hoc.json'), 'utf8'))
  const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'containers.json'), 'utf8'))
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  // --catalog: chỉ sinh lại danh mục (sửa containers.json / tên gọi), không đổi vector
  const onlyCatalog = ids[0] === '--catalog'
  const files = onlyCatalog ? [] : fs.readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)).filter((id) => !ids.length || ids.includes(id))
  for (const id of files) { prev[id] = await vectorize(`${dir}/${id}.png`); console.log(id, prev[id].w + 'x' + prev[id].h, Math.round((prev[id].ink.length + prev[id].body.length) / 1024) + 'KB') }
  const sorted = Object.fromEntries(Object.keys(prev).sort().map((k) => [k, prev[k]]))
  fs.writeFileSync(OUT, JSON.stringify(sorted))
  console.log('tổng', Object.keys(sorted).length, Math.round(fs.statSync(OUT).size / 1024) + 'KB')

  // danh mục: chỉ ghi hình đã có trong kho (đồ chứa còn phải có thông số miệng) để AI không chọn hình chưa vẽ
  const objects = list.objects.filter((o) => sorted[o.id]).map((o) => `  ${o.id}: '${o.name}',`)
  const sceneIds = list.objects.filter((o) => sorted[o.id] && o.scene).map((o) => `'${o.id}'`)
  // tên gọi khác (không dấu, chữ thường) → id: "cây" → tree, "thang" → ladder
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim()
  const aliases = list.objects.filter((o) => sorted[o.id] && o.aliases).flatMap((o) => o.aliases.map((a) => `  '${fold(a)}': '${o.id}',`))
  const containers = list.containers
    .filter((c) => sorted[c.id] && meta[c.id])
    .map((c) => `  ${c.id}: ${JSON.stringify({ name: c.name, ...meta[c.id] }).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ')},`)
  const ts = `// Sinh tự động bởi scripts/figure-sprites/vector.cjs — đừng sửa tay (thông số miệng đồ chứa ở containers.json)

export interface ContainerMeta {
  name: string
  /** inside: đồ vật nằm trong (thành trước che chân); on_top: đặt lên trên (đĩa, khay); label: chỉ ghi số (túi, gói) */
  placement: 'inside' | 'on_top' | 'label'
  /** elip miệng, theo tỉ lệ khung hình (0–1) */
  mouth: { cx: number; cy: number; rx: number; ry: number }
  /** mép trước của vành nằm cao hơn tâm miệng bao nhiêu (tỉ lệ chiều cao) */
  rim: number
  /** độ cao đặt nhãn số (tỉ lệ chiều cao) */
  labelY: number
  /** cỡ so với đồ chứa chuẩn (mặc định 1) */
  size?: number
}

/** id → tên đồ vật */
export const OBJECTS: Record<string, string> = {
${objects.join('\n')}
}

export const CONTAINERS: Record<string, ContainerMeta> = {
${containers.join('\n')}
}

/** vật hay dùng trong hình thực tế (lệnh "hình <vật> AB") */
export const SCENE_OBJECTS: string[] = [${sceneIds.join(', ')}]

/** tên gọi khác (không dấu, chữ thường) → id */
export const OBJECT_ALIASES: Record<string, string> = {
${aliases.join('\n')}
}
`
  fs.writeFileSync(CATALOG, ts)
  console.log('danh mục', objects.length, 'đồ vật,', containers.length, 'đồ chứa')
})()
