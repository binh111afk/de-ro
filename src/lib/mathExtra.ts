/**
 * Công cụ Toán bổ sung:
 * - Đường tròn lượng giác: góc "π/6", "150°", "-2π/3"; họ nghiệm "π/4 + kπ/2"; tô: [π/6 → 5π/6);
 *   y = 1/2; x = -√2/2; nối tô: M N P; nối tô: họ; cung: M N "α"; M(1/2; √3/2); tuỳ chọn values, cot.
 * - Sơ đồ cây xác suất: thụt lề 2 dấu cách mỗi tầng, "A: 0,3"; "A'" hoặc "~A" là biến cố đối (gạch trên).
 * - Trục số: mỗi dòng một tập "(-2; 3]", "(-oo; -1) ∪ [2; 5]", "A = [1; +oo)".
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10
const ARROW = `<defs><marker id="mxarr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#111"/></marker></defs>`
function wrap(W: number, H: number, desc: string, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W)}" height="${Math.round(H)}" viewBox="0 0 ${Math.round(W)} ${Math.round(H)}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`
  return { svg, width: Math.round(W), height: Math.round(H) }
}
const num = (s: string) => Number(s.replace(',', '.'))

/* ------------------------------------------------------------------ *
 * Đường tròn lượng giác
 * ------------------------------------------------------------------ */

export interface TrigSpec {
  /** mỗi dòng một lệnh: góc, họ nghiệm, tô:, nối:, cung:, y =, x =, M(x; y) */
  angles: string
  /** nét đứt chiếu xuống trục cos, sin */
  projections: boolean
  /** vẽ trục tan */
  tan: boolean
  /** ghi giá trị cos, sin trên trục (chân hình chiếu) */
  values?: boolean
  /** vẽ trục cot (đường y = 1) */
  cot?: boolean
}

/** "π/6", "-2π/3", "5pi/4", "150°", "2" (radian) → radian */
export function parseAngle(raw: string): number {
  const s = raw.replace(/\s+/g, '').replace(/pi/gi, 'π').replace(/−/g, '-')
  const deg = /^([+-]?\d+(?:[.,]\d+)?)(?:°|độ|do)$/i.exec(s)
  if (deg) return (num(deg[1]) * Math.PI) / 180
  const m = /^([+-]?)(\d*)(π?)(?:\/(\d+))?$/.exec(s)
  if (!m || (!m[2] && !m[3])) throw new Error(`Không đọc được góc "${raw}" — gõ vd. π/6, -2π/3, 150°`)
  const k = (m[2] ? +m[2] : 1) * (m[3] ? Math.PI : 1)
  return (m[1] === '-' ? -1 : 1) * (k / (m[4] ? +m[4] : 1))
}

/** một dòng → các điểm (radian) cùng nhãn hiển thị */
function anglesOf(line: string): Array<{ a: number; label: string; name?: string }> {
  // "M: π/3" → điểm tên M biểu diễn góc π/3
  const named = /^([A-Z][A-Za-z0-9']*)\s*:\s*(.+)$/.exec(line.trim())
  if (named) return anglesOf(named[2]).map((p, k) => ({ ...p, name: k === 0 ? named[1] : undefined }))
  const t = line.replace(/^x\s*=\s*/i, '').trim()
  // họ nghiệm: α + kβ (k ∈ Z)
  const fam = /^(.*?)\s*\+\s*k\s*(.*?)(?:\s*,?\s*\(?k\s*∈\s*[ZℤR]\)?)?$/i.exec(t)
  if (fam) {
    const a0 = fam[1] ? parseAngle(fam[1]) : 0
    const step = parseAngle(fam[2] || '1')
    if (Math.abs(step) < 1e-9) throw new Error('Bước của họ nghiệm phải khác 0')
    const n = Math.round((2 * Math.PI) / Math.abs(step))
    if (n > 24 || Math.abs(n * Math.abs(step) - 2 * Math.PI) > 1e-6) throw new Error(`Bước ${fam[2]} không chia hết 2π (hoặc quá nhỏ) — cần dạng 2π/n`)
    return Array.from({ length: n }, (_, k) => ({ a: a0 + k * step, label: k === 0 ? (fam[1] || '0') : '' }))
  }
  return [{ a: parseAngle(t), label: t }]
}

const prettyAngle = (s: string) => s.replace(/pi/gi, 'π').replace(/-/g, '−')

/** bỏ dấu tiếng Việt để nhận diện từ khoá lệnh: "tô" → "to", "nối" → "noi", "họ" → "ho" */
const deaccent = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/** số cho toạ độ / đường thẳng: "1/2", "√3/2", "sqrt(3)/2", "0,6", "-0.5" → số */
function parseVal(t: string): number {
  const s = t
    .trim()
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/sqrt\s*\(\s*(\d+)\s*\)/i, '√$1')
    .replace(/sqrt/i, '√')
  const m = s.match(/^(-?)(.+)$/)
  const sign = m && m[1] ? -1 : 1
  const v = m ? m[2] : ''
  const sq = v.match(/^√(\d+)(?:\/(\d+))?$/)
  if (sq) return (sign * Math.sqrt(+sq[1])) / (sq[2] ? +sq[2] : 1)
  const fr = v.match(/^(\d+)\/(\d+)$/)
  if (fr) return (sign * +fr[1]) / +fr[2]
  if (/^\d+(?:[.,]\d+)?$/.test(v)) return sign * num(v)
  throw new Error(`Không đọc được số "${t.trim()}" — gõ vd. 1/2, √3/2, 0,5`)
}

/** giá trị "đẹp" trên trục: 0, ±1/2, ±√2/2, ±√3/2, ±1; số khác ghi gần đúng 2 chữ số thập phân */
function prettyVal(v: number): string {
  if (Math.abs(v) < 1e-6) return '0'
  for (const [q, t] of [[1, '1'], [0.5, '1/2'], [Math.SQRT1_2, '√2/2'], [Math.sqrt(3) / 2, '√3/2']] as const)
    if (Math.abs(Math.abs(v) - q) < 1e-6) return (v < 0 ? '−' : '') + t
  const r = Math.round(Math.abs(v) * 100) / 100
  return (v < 0 && r > 0 ? '−' : '') + String(r).replace('.', ',')
}

export function renderTrigSvg(spec: TrigSpec, desc: string) {
  const lines = spec.angles
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (!lines.length) throw new Error('Gõ ít nhất một góc, vd. π/6')
  const R = 110
  const cx = 170
  const cy = 160
  type Pt = { a: number; vx: number; vy: number; px: number; py: number; label?: string; name?: string }
  const pts: Pt[] = [] // mọi điểm sẽ chấm: góc, họ nghiệm, theo toạ độ
  const named = new Map<string, Pt>()
  const fam: Pt[] = [] // điểm của các họ nghiệm (cho "nối: họ")
  const shades: Array<{ a0: number; a1: number; la: boolean; lb: boolean }> = []
  const rays: Array<{ axis: 'x' | 'y'; v: number }> = []
  const polys: Array<{ names: string[] | null; fill: boolean; ln: number }> = []
  const arcs: Array<{ m: string; n: string; label?: string; ln: number }> = []
  const warns: Array<{ line: number; msg: string }> = []
  // vế phải có π/pi/k/° → góc/họ nghiệm; còn lại là số → đường thẳng/toạ độ
  const isAngleTxt = (t: string) => /[π°]|pi|\bk\b/i.test(t)

  lines.forEach((line, i) => {
    const ln = i + 1
    const err = (msg: string): never => {
      throw new Error(`Dòng ${ln} "${line}": ${msg}`)
    }
    const d = deaccent(line).toLowerCase().trim()
    // nối: M N P / nối tô: M N P / nối (tô): họ
    if (d.match(/^noi(\s+to)?\s*:/)) {
      const fill = /^noi\s+to\s*:/.test(d)
      // thân lệnh là phần sau dấu ":" đầu tiên (tránh so khớp chữ có dấu trong regex)
      const body = line.slice(line.indexOf(':') + 1).trim()
      const names = /^(ho)$/i.test(deaccent(body).trim()) ? null : body.split(/[\s,]+/).filter(Boolean)
      if (names && !names.length) err('cần dạng nối: M N P (hoặc "nối: họ" để nối điểm họ nghiệm)')
      polys.push({ names, fill, ln })
      return
    }
    // cung: M N "nhãn"
    if (d.match(/^cung\s*:/)) {
      const body = line.replace(/^cung\s*:/i, '').trim()
      const m = body.match(/^(\S+)\s+(\S+)(?:\s+"([^"]*)")?$/)
      if (!m) err('cần dạng cung: M N (nhãn trong "…" tuỳ chọn)')
      arcs.push({ m: m![1], n: m![2], label: m![3], ln })
      return
    }
    // tô: [π/6 → 5π/6) — cung miền nghiệm ngược chiều kim đồng hồ
    if (d.match(/^to\s*:/)) {
      const m = d.match(/^to\s*:\s*([[(])?\s*(.+?)\s*(?:→|->|\bden\b)\s*(.+?)\s*([\])])?\s*$/)
      if (!m) err('cần dạng tô: π/6 → 5π/6 (mũi tên →, -> hoặc "đến"; thêm [ ( ] ) ở hai đầu nếu cần)')
      try {
        shades.push({ a0: parseAngle(m![2]), a1: parseAngle(m![3]), la: m![1] ? m![1] === '[' : true, lb: m![4] ? m![4] === ']' : true })
      } catch (e) {
        err(e instanceof Error ? e.message : String(e))
      }
      return
    }
    // y = 1/2, x = -√2/2 — đường thẳng; vế phải là góc thì rơi xuống xử lí như cũ
    if (d.match(/^[xy]\s*=/)) {
      const axis = d[0] as 'x' | 'y'
      const rhs = d.replace(/^[xy]\s*=\s*/, '').trim()
      if (!isAngleTxt(rhs)) {
        try {
          const v = parseVal(rhs)
          // ponytail: vẽ được trong khung mới vẽ — giá trị quá xa thì bỏ qua thay vì nới khung vô hạn
          if ((axis === 'y' && Math.abs(v) <= 1.25) || (axis === 'x' && Math.abs(v) <= 1.35)) rays.push({ axis, v })
          return
        } catch {
          err(`cần dạng ${axis} = 1/2 (chấp nhận √3/2, sqrt(3)/2, 0,5)`)
        }
      }
      if (axis === 'y') err('cần dạng y = 1/2 — muốn vẽ góc/họ nghiệm thì bỏ "y =" đi')
    }
    // M(1/2; √3/2) — điểm theo toạ độ (cos; sin)
    const cm = line.match(/^([A-Z][A-Za-z0-9']*)\s*\(\s*(.+?)\s*;\s*(.+?)\s*\)$/)
    if (cm && !isAngleTxt(cm[2] + cm[3])) {
      try {
        const vx = parseVal(cm[2])
        const vy = parseVal(cm[3])
        if (Math.abs(Math.hypot(vx, vy) - 1) > 0.02) warns.push({ line: ln, msg: `điểm ${cm[1]} không nằm trên đường tròn đơn vị` })
        const p: Pt = { a: Math.atan2(vy, vx), vx, vy, px: cx + R * vx, py: cy - R * vy, name: cm[1] }
        pts.push(p)
        named.set(cm[1], p)
        return
      } catch {
        err(`toạ độ cần số, vd ${cm[1]}(1/2; √3/2)`)
      }
    }
    // góc / họ nghiệm (cú pháp cũ)
    try {
      const items = anglesOf(line)
      for (const it of items) {
        const p: Pt = { a: it.a, vx: Math.cos(it.a), vy: Math.sin(it.a), px: cx + R * Math.cos(it.a), py: cy - R * Math.sin(it.a), label: it.label, name: it.name }
        pts.push(p)
        if (it.name) named.set(it.name, p)
        if (items.length > 1) fam.push(p)
      }
    } catch (e) {
      err(e instanceof Error ? e.message : String(e))
    }
  })

  const W = spec.tan || spec.cot ? 380 : 340
  const H = 320
  const pt = (n: string, ln: number): Pt => {
    const p = named.get(n) ?? named.get(n.toUpperCase())
    if (!p) throw new Error(`Dòng ${ln} "${lines[ln - 1]}": điểm "${n}" chưa khai báo — khai báo bằng ${n}: góc (vd ${n}: pi/3) hoặc ${n}(1/2; √3/2)`)
    return p
  }
  // nhãn giá trị trên trục: gộp nhãn trùng theo giá trị; đường thẳng y = a/x = a cũng ghi nhãn ở đầu đường
  const cosVals = new Map<string, { x: number; t: string }>()
  const sinVals = new Map<string, { y: number; t: string }>()
  if (spec.values)
    for (const p of pts) {
      const tx = prettyVal(p.vx)
      if (!cosVals.has(tx)) cosVals.set(tx, { x: p.vx, t: tx })
      const ty = prettyVal(p.vy)
      if (!sinVals.has(ty)) sinVals.set(ty, { y: p.vy, t: ty })
    }

  let b = ARROW
  b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#111" stroke-width="1.5"/>`
  b += `<path d="M${cx - R - 30} ${cy}H${cx + R + 32}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
  b += `<path d="M${cx} ${cy + R + 28}V${cy - R - 30}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
  b += `<text x="${cx + R + 30}" y="${cy + 18}" ${FAM} font-size="14" font-style="italic" text-anchor="end">cos</text>`
  b += `<text x="${cx + 8}" y="${cy - R - 20}" ${FAM} font-size="14" font-style="italic">sin</text>`
  b += `<text x="${cx - 9}" y="${cy + 16}" ${FAM} font-size="14" font-style="italic" text-anchor="end">O</text>`
  // điểm gốc A, A', B, B'
  const corner = (t: string, x: number, y: number, anchor = 'middle') => `<text x="${x}" y="${y}" ${FAM} font-size="14" font-style="italic" text-anchor="${anchor}">${t}</text>`
  b += corner('A', cx + R + 6, cy - 6, 'start') + corner("A'", cx - R - 6, cy - 6, 'end') + corner('B', cx + 8, cy - R - 4, 'start') + corner("B'", cx + 8, cy + R + 16, 'start')
  if (spec.tan) {
    b += `<path d="M${cx + R} ${cy + R + 10}V${cy - R - 20}" stroke="#111" stroke-width="1.1" marker-end="url(#mxarr)"/>`
    b += `<text x="${cx + R + 6}" y="${cy - R - 12}" ${FAM} font-size="14" font-style="italic">tan</text>`
  }
  if (spec.cot) {
    // trục cot: đường ngang y = 1 (tiếp tuyến tại B), mũi tên sang phải
    b += `<path d="M${cx - R - 2} ${cy - R}H${cx + R + 58}" stroke="#111" stroke-width="1.1" marker-end="url(#mxarr)"/>`
    b += `<text x="${cx + R + 58}" y="${cy - R + 18}" ${FAM} font-size="14" font-style="italic" text-anchor="end">cot</text>`
  }
  // tô cung (miền nghiệm): cung đậm #c0392b ngược chiều kim đồng hồ + chấm đầu mút
  let shadeDots = ''
  for (const s of shades) {
    const raw = s.a1 - s.a0
    const sweep = ((raw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    const dot = (a: number, filled: boolean) =>
      `<circle cx="${f1(cx + R * Math.cos(a))}" cy="${f1(cy - R * Math.sin(a))}" r="4.5" fill="${filled ? '#c0392b' : '#fff'}" stroke="#c0392b" stroke-width="1.5"/>`
    if (raw > 1e-9 && sweep < 1e-9) {
      b += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#c0392b" stroke-width="4"/>`
    } else if (sweep > 1e-9) {
      const a1 = s.a0 + sweep
      const large = sweep > Math.PI ? 1 : 0
      b += `<path d="M${f1(cx + R * Math.cos(s.a0))} ${f1(cy - R * Math.sin(s.a0))}A${R} ${R} 0 ${large} 0 ${f1(cx + R * Math.cos(a1))} ${f1(cy - R * Math.sin(a1))}" fill="none" stroke="#c0392b" stroke-width="4"/>`
    }
    shadeDots += dot(s.a0, s.la) + dot(s.a1, s.lb)
  }
  // đường thẳng y = a / x = a: nét liền mảnh xuyên qua đường tròn, chấm 2 giao điểm nếu |a| ≤ 1
  for (const r of rays) {
    const t = prettyVal(r.v)
    if (r.axis === 'x') {
      const X = cx + R * r.v
      b += `<line x1="${f1(X)}" y1="${cy - R - 14}" x2="${f1(X)}" y2="${cy + R + 14}" stroke="#111" stroke-width="1"/>`
      if (Math.abs(r.v) <= 1) {
        const yy = R * Math.sqrt(1 - r.v * r.v)
        b += `<circle cx="${f1(X)}" cy="${f1(cy - yy)}" r="2.5" fill="#111"/><circle cx="${f1(X)}" cy="${f1(cy + yy)}" r="2.5" fill="#111"/>`
      }
      cosVals.set(t, { x: r.v, t })
    } else {
      const Y = cy - R * r.v
      b += `<line x1="${cx - R - 14}" y1="${f1(Y)}" x2="${cx + R + 14}" y2="${f1(Y)}" stroke="#111" stroke-width="1"/>`
      if (Math.abs(r.v) <= 1) {
        const xx = R * Math.sqrt(1 - r.v * r.v)
        b += `<circle cx="${f1(cx - xx)}" cy="${f1(Y)}" r="2.5" fill="#111"/><circle cx="${f1(cx + xx)}" cy="${f1(Y)}" r="2.5" fill="#111"/>`
      }
      sinVals.set(t, { y: r.v, t })
    }
  }
  // nối điểm thành đa giác (khép kín), "nối tô:" thêm nền nhạt
  for (const pl of polys) {
    const list = pl.names === null ? [...fam].sort((p, q) => p.a - q.a) : pl.names.map((n) => pt(n, pl.ln))
    if (pl.names === null && !list.length) throw new Error(`Dòng ${pl.ln} "${lines[pl.ln - 1]}": không có họ nghiệm nào — thêm dòng vd π/4 + kπ/2`)
    if (list.length < 2) throw new Error(`Dòng ${pl.ln} "${lines[pl.ln - 1]}": cần ít nhất 2 điểm để nối`)
    b += `<path d="M${list.map((p) => `${f1(p.px)} ${f1(p.py)}`).join('L')}Z" fill="${pl.fill ? '#1f5fbf' : 'none'}" fill-opacity="0.08" stroke="#111" stroke-width="1.2"/>`
  }
  const single = pts.length === 1
  for (const { a, label: angleLabel, name, vx, vy, px: X, py: Y } of pts) {
    // điểm có tên: ghi tên ở điểm; một góc thì ghi số đo cạnh cung
    const label = name ?? angleLabel
    if (name && single && angleLabel) {
      const m = a / 2
      b += `<text x="${f1(cx + 44 * Math.cos(m))}" y="${f1(cy - 44 * Math.sin(m) + 5)}" ${FAM} font-size="13" text-anchor="middle">${esc(prettyAngle(angleLabel))}</text>`
    }
    if (spec.projections) {
      b += `<path d="M${f1(X)} ${f1(Y)}V${cy}M${f1(X)} ${f1(Y)}H${cx}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/>`
    }
    if (single || spec.tan || spec.cot) b += `<line x1="${cx}" y1="${cy}" x2="${f1(X)}" y2="${f1(Y)}" stroke="#111" stroke-width="1.2"/>`
    if (spec.tan && Math.abs(vx) > 0.15) {
      const ty = cy - (R * vy) / vx
      if (Math.abs(ty - cy) < R + 10)
        b += `<path d="M${f1(X)} ${f1(Y)}L${cx + R} ${f1(ty)}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/><circle cx="${cx + R}" cy="${f1(ty)}" r="2.5" fill="#111"/>`
    }
    if (spec.cot && Math.abs(vy) > 0.15) {
      const tx = cx + (R * vx) / vy
      if (tx > cx - R - 2 && tx < cx + R + 58)
        b += `<path d="M${f1(X)} ${f1(Y)}L${f1(tx)} ${cy - R}" stroke="#111" stroke-width="0.9" stroke-dasharray="4 3"/><circle cx="${f1(tx)}" cy="${cy - R}" r="2.5" fill="#111"/>`
    }
    b += `<circle cx="${f1(X)}" cy="${f1(Y)}" r="3.2" fill="#111"/>`
    if (label) {
      const lx = X + 16 * Math.cos(a)
      const ly = Y - 16 * Math.sin(a) + 5
      b += `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="14" text-anchor="${Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle'}">${esc(prettyAngle(label))}</text>`
    }
  }
  // một góc: cung từ A tới điểm
  if (single) {
    const a = pts[0].a
    const r = 26
    const large = Math.abs(a) % (2 * Math.PI) > Math.PI ? 1 : 0
    const ex = cx + r * Math.cos(a)
    const ey = cy - r * Math.sin(a)
    b += `<path d="M${cx + r} ${cy}A${r} ${r} 0 ${large} ${a >= 0 ? 0 : 1} ${f1(ex)} ${f1(ey)}" fill="none" stroke="#111" stroke-width="1.1" marker-end="url(#mxarr)"/>`
  }
  // cung giữa hai điểm có tên: ngược chiều kim đồng hồ từ M tới N, mũi tên ở N
  for (const c of arcs) {
    const M = pt(c.m, c.ln)
    const N = pt(c.n, c.ln)
    const sweep = ((N.a - M.a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
    if (sweep > 1e-9) {
      const a1 = M.a + sweep
      const large = sweep > Math.PI ? 1 : 0
      b += `<path d="M${f1(cx + R * Math.cos(M.a))} ${f1(cy - R * Math.sin(M.a))}A${R} ${R} 0 ${large} 0 ${f1(cx + R * Math.cos(a1))} ${f1(cy - R * Math.sin(a1))}" fill="none" stroke="#111" stroke-width="1.3" marker-end="url(#mxarr)"/>`
    }
    if (c.label) {
      // nhãn cung không đặt sát trục (đè A, B, A', B'): đẩy lệch khỏi hướng trục 0,32 rad dọc theo cung
      let mid = M.a + sweep / 2
      const q = Math.round(mid / (Math.PI / 2)) * (Math.PI / 2)
      if (Math.abs(mid - q) < 0.3) mid = q + (mid < q - 1e-9 ? -0.32 : 0.32)
      const lx = cx + (R + 16) * Math.cos(mid)
      const ly = cy - (R + 16) * Math.sin(mid) + 5
      b += `<text x="${f1(lx)}" y="${f1(ly)}" ${FAM} font-size="14" text-anchor="${Math.cos(mid) > 0.2 ? 'start' : Math.cos(mid) < -0.2 ? 'end' : 'middle'}">${esc(c.label)}</text>`
    }
  }
  b += shadeDots
  // giá trị trên trục: cos dưới trục ngang, sin bên trái trục dọc
  // nhãn sát nhau thì xếp sang hàng (cos) / cột (sin) kế tiếp; độ rộng chữ ước ~7 px/ký tự
  const tw = (t: string) => t.length * 7 + 4
  const cosEnd: number[] = []
  for (const v of [...cosVals.values()].sort((p, q) => p.x - q.x)) {
    const X = cx + R * v.x
    let row = cosEnd.findIndex((e) => X - tw(v.t) / 2 > e)
    if (row < 0) row = cosEnd.push(0) - 1
    cosEnd[row] = X + tw(v.t) / 2
    b += `<text x="${f1(X)}" y="${cy + 18 + 15 * row}" ${FAM} font-size="13" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(v.t)}</text>`
  }
  const sinCol: Array<{ y: number; x: number }> = [] // mỗi cột: y dưới cùng đã dùng, mép phải của cột
  for (const v of [...sinVals.values()].sort((p, q) => q.y - p.y)) {
    const Y = cy - R * v.y + 5
    let col = sinCol.findIndex((c) => Y - 14 > c.y)
    if (col < 0) col = sinCol.push({ y: -1e9, x: col === -1 && sinCol.length ? sinCol[sinCol.length - 1].x - 36 : cx - 6 }) - 1
    sinCol[col].y = Y
    b += `<text x="${f1(sinCol[col].x)}" y="${f1(Y)}" ${FAM} font-size="13" text-anchor="end" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(v.t)}</text>`
  }
  const img = wrap(W, H, desc, b)
  return warns.length ? { ...img, errors: warns } : img
}

/* ------------------------------------------------------------------ *
 * Sơ đồ cây xác suất
 * ------------------------------------------------------------------ */

export interface TreeSpec {
  text: string
  /** ghi tích xác suất ở cuối mỗi nhánh */
  products: boolean
}

type TNode = { name: string; p: string; kids: TNode[] }

function parseTree(text: string): TNode[] {
  const root: TNode = { name: '', p: '', kids: [] }
  const stack: Array<{ depth: number; node: TNode }> = [{ depth: -1, node: root }]
  for (const raw of text.split('\n')) {
    if (!raw.trim()) continue
    const depth = Math.floor((raw.match(/^\s*/)![0].replace(/\t/g, '  ').length) / 2)
    const m = /^\s*([^:]+?)\s*:\s*(\S+)\s*$/.exec(raw)
    if (!m) throw new Error(`Dòng "${raw.trim()}" cần dạng Tên: xác suất, vd. A: 0,3`)
    while (stack[stack.length - 1].depth >= depth) stack.pop()
    const node: TNode = { name: m[1], p: m[2], kids: [] }
    stack[stack.length - 1].node.kids.push(node)
    stack.push({ depth, node })
  }
  if (!root.kids.length) throw new Error('Chưa có nhánh nào, vd. A: 0,3')
  return root.kids
}

/** "0,3" "1/3" "30%" → số */
function prob(s: string): number {
  const t = s.replace(',', '.')
  if (/^\d+\/\d+$/.test(t)) {
    const [a, b] = t.split('/').map(Number)
    return a / b
  }
  if (/%$/.test(t)) return Number(t.slice(0, -1)) / 100
  return Number(t)
}
const fmtP = (v: number) => String(Math.round(v * 10000) / 10000).replace('.', ',')

/** "A'" / "~A" / "Ā" → tên + có gạch trên */
function eventLabel(name: string, x: number, y: number, anchor: string) {
  const bar = /^~|'$/.test(name)
  const core = name.replace(/^~|'$/g, '')
  const w = [...core].length * 9
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - w : x - w / 2
  return (
    `<text x="${x}" y="${y}" ${FAM} font-size="16" font-style="italic" text-anchor="${anchor}">${esc(core)}</text>` +
    (bar ? `<line x1="${f1(x0)}" y1="${y - 14}" x2="${f1(x0 + w)}" y2="${y - 14}" stroke="#111" stroke-width="1"/>` : '')
  )
}

export function renderTreeSvg(spec: TreeSpec, desc: string) {
  const top = parseTree(spec.text)
  const depthOf = (n: TNode): number => (n.kids.length ? 1 + Math.max(...n.kids.map(depthOf)) : 1)
  const D = Math.max(...top.map(depthOf))
  const COL = 120
  const ROW = 44
  let leaf = 0
  // lá xếp từ trên xuống; nút trong nằm giữa các con
  type P = { n: TNode; x: number; y: number; acc: number; parent?: P }
  const nodes: P[] = []
  const lay = (n: TNode, depth: number, acc: number, parent?: P): P => {
    const me: P = { n, x: 40 + (depth + 1) * COL, y: 0, acc: acc * prob(n.p), parent }
    if (n.kids.length) {
      const ch = n.kids.map((k) => lay(k, depth + 1, me.acc, me))
      me.y = (ch[0].y + ch[ch.length - 1].y) / 2
    } else me.y = 30 + leaf++ * ROW
    nodes.push(me)
    return me
  }
  const roots = top.map((n) => lay(n, 0, 1))
  const rootY = (roots[0].y + roots[roots.length - 1].y) / 2
  const rootX = 40
  let b = `<circle cx="${rootX}" cy="${f1(rootY)}" r="3" fill="#111"/>`
  for (const p of nodes) {
    const sx = p.parent ? p.parent.x + 22 : rootX
    const sy = p.parent ? p.parent.y : rootY
    const ex = p.x - 14
    b += `<line x1="${f1(sx)}" y1="${f1(sy)}" x2="${f1(ex)}" y2="${f1(p.y)}" stroke="#111" stroke-width="1.2"/>`
    // xác suất trên nhánh, lệch lên trên / xuống dưới theo hướng nhánh
    const mx = (sx + ex) / 2
    const my = (sy + p.y) / 2 + (p.y <= sy ? -6 : 14)
    b += `<text x="${f1(mx)}" y="${f1(my)}" ${FAM} font-size="13" text-anchor="middle">${esc(p.n.p)}</text>`
    b += eventLabel(p.n.name, p.x, p.y + 5, 'middle')
    if (spec.products && !p.n.kids.length) {
      const chain: string[] = []
      for (let q: P | undefined = p; q; q = q.parent) chain.unshift(q.n.p)
      b += `<text x="${f1(p.x + 26)}" y="${f1(p.y + 5)}" ${FAM} font-size="13">→ ${esc(chain.join(' · '))} = ${fmtP(p.acc)}</text>`
    }
  }
  const W = 40 + (D + 1) * COL + (spec.products ? 40 + D * 46 + 70 : 30)
  const H = leaf * ROW + 20
  return wrap(W, Math.max(H, 90), desc, b)
}

/* ------------------------------------------------------------------ *
 * Trục số
 * ------------------------------------------------------------------ */

export interface NumberLineSpec {
  /** mỗi dòng một tập: "(-2; 3]", "(-oo; -1) ∪ [2; 5]", "A = [1; +oo)", "{3}" */
  sets: string
  /** gạch: gạch chéo phần bỏ đi (SGK); đậm: tô đậm phần giữ lại */
  style: 'hatch' | 'bold'
}

type Iv = { a: number; b: number; la: '(' | '['; rb: ')' | ']'; ta: string; tb: string }

function parseSet(src: string): { name: string; ivs: Iv[]; pts: Array<{ v: number; t: string }> } {
  let s = src.trim()
  let name = ''
  const nm = /^([A-Za-z]\w*)\s*=\s*(.+)$/.exec(s)
  if (nm) {
    name = nm[1]
    s = nm[2]
  }
  const ivs: Iv[] = []
  const pts: Array<{ v: number; t: string }> = []
  const val = (t: string) => {
    const u = t.trim().replace(/−/g, '-')
    if (/^\+?(oo|∞|vc)$/i.test(u)) return Infinity
    if (/^-(oo|∞|vc)$/i.test(u)) return -Infinity
    if (/^-?\d+(?:[.,]\d+)?$/.test(u)) return num(u)
    if (/^-?\d+\/\d+$/.test(u)) {
      const [a, b] = u.split('/').map(Number)
      return a / b
    }
    if (/^-?√\d+$/.test(u)) return (u.startsWith('-') ? -1 : 1) * Math.sqrt(Number(u.replace(/[-√]/g, '')))
    throw new Error(`Không đọc được số "${t.trim()}"`)
  }
  const show = (t: string) => {
    const u = t.trim().replace(/-/g, '−')
    return /oo|vc/i.test(u) ? u.replace(/oo|vc/i, '∞') : u
  }
  for (const part of s.split(/∪|\bU\b|\bhợp\b/)) {
    const p = part.trim()
    if (!p) continue
    const iv = /^([([])\s*([^;]+);\s*([^)\]]+)([)\]])$/.exec(p)
    if (iv) {
      const a = val(iv[2])
      const b = val(iv[3])
      if (!(a < b)) throw new Error(`Khoảng "${p}": đầu trái phải nhỏ hơn đầu phải`)
      ivs.push({ a, b, la: iv[1] as '(' | '[', rb: iv[4] as ')' | ']', ta: show(iv[2]), tb: show(iv[3]) })
      continue
    }
    const set = /^\{(.+)\}$/.exec(p)
    if (set) {
      for (const t of set[1].split(/[;,]/)) pts.push({ v: val(t), t: show(t) })
      continue
    }
    throw new Error(`Không đọc được "${p}" — gõ vd. (-2; 3], [1; +oo), {3}`)
  }
  return { name, ivs, pts }
}

export function renderNumberLineSvg(spec: NumberLineSpec, desc: string) {
  const rows = spec.sets
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseSet)
  if (!rows.length) throw new Error('Gõ ít nhất một tập, vd. (-2; 3]')
  // các mốc hữu hạn của mọi dòng, xếp đều (trục số SGK không theo tỉ lệ)
  const marks = [...new Set(rows.flatMap((r) => [...r.ivs.flatMap((iv) => [iv.a, iv.b]), ...r.pts.map((p) => p.v)]).filter(Number.isFinite))].sort((a, b) => a - b)
  const GAP = 70
  const named = rows.some((r) => r.name)
  const left = named ? 70 : 30
  const x0 = left + 30
  const X = (v: number) => (v === -Infinity ? left : v === Infinity ? x0 + Math.max(1, marks.length) * GAP + 30 : x0 + marks.indexOf(v) * GAP)
  const right = x0 + Math.max(1, marks.length) * GAP + 30
  const W = right + 30
  const RH = 64
  let b = ARROW
  b += `<defs><pattern id="nlh" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#111" stroke-width="1.1"/></pattern></defs>`
  rows.forEach((r, ri) => {
    const y = 34 + ri * RH
    if (r.name) b += `<text x="${left - 14}" y="${y + 5}" ${FAM} font-size="16" font-style="italic" text-anchor="end">${esc(r.name)}</text>`
    b += `<path d="M${left} ${y}H${right + 6}" stroke="#111" stroke-width="1.2" marker-end="url(#mxarr)"/>`
    // phần giữ lại theo thứ tự trên trục
    const keep = [...r.ivs].sort((p, q) => p.a - q.a)
    if (spec.style === 'hatch') {
      // gạch các khoảng trống giữa phần giữ lại
      let cur = left
      const gaps: Array<[number, number]> = []
      for (const iv of keep) {
        if (X(iv.a) > cur + 0.5) gaps.push([cur, X(iv.a)])
        cur = Math.max(cur, X(iv.b))
      }
      if (cur < right - 0.5) gaps.push([cur, right])
      if (!keep.length) gaps.length = 0 // chỉ có điểm rời: không gạch
      for (const [g0, g1] of gaps) b += `<rect x="${f1(g0)}" y="${y - 7}" width="${f1(g1 - g0)}" height="7" fill="url(#nlh)"/>`
    } else {
      for (const iv of keep) b += `<line x1="${f1(X(iv.a))}" y1="${y}" x2="${f1(X(iv.b))}" y2="${y}" stroke="#111" stroke-width="4"/>`
    }
    // ngoặc ở đầu mút hữu hạn: "(" / ")" mở, "[" / "]" đóng
    const bracket = (x: number, ch: string) => `<text x="${f1(x)}" y="${y + 7}" ${FAM} font-size="22" text-anchor="middle">${ch}</text>`
    for (const iv of keep) {
      if (Number.isFinite(iv.a)) b += bracket(X(iv.a) + 1, iv.la)
      if (Number.isFinite(iv.b)) b += bracket(X(iv.b) - 1, iv.rb)
    }
    for (const p of r.pts) b += `<circle cx="${f1(X(p.v))}" cy="${y}" r="3.5" fill="#111"/>`
    // số ở dưới các mốc dòng này dùng
    const used = new Map<number, string>()
    for (const iv of keep) {
      if (Number.isFinite(iv.a)) used.set(iv.a, iv.ta)
      if (Number.isFinite(iv.b)) used.set(iv.b, iv.tb)
    }
    for (const p of r.pts) used.set(p.v, p.t)
    for (const [v, t] of used) b += `<text x="${f1(X(v))}" y="${y + 26}" ${FAM} font-size="14" text-anchor="middle">${esc(t)}</text>`
  })
  return wrap(W, 34 + rows.length * RH - 10, desc, b)
}

/* ------------------------------------------------------------------ *
 * Biểu đồ Ven
 * ------------------------------------------------------------------ */

export interface VennSpec {
  /** tên các tập, 2 hoặc 3: "A, B" / "A, B, C" */
  sets: string
  /** miền tô (để trống = không tô): "A ∩ B", "A ∪ B", "A \ B", "(A ∪ B)'", "A n B" … */
  shade: string
  /** số phần tử từng miền, mỗi dòng "A: 5" (chỉ A), "AB: 3" (A và B, không C), "ABC: 1", "ngoài: 4" */
  counts: string
  /** khung chữ nhật tập vũ trụ U */
  universe: boolean
}

/** biểu thức tập → hàm kiểm tra một miền (mảng thuộc / không thuộc từng tập) */
function setExpr(src: string, names: string[]): (inside: boolean[]) => boolean {
  // "A n B" / "A u B" (chữ n, u thay ∩, ∪) đổi trước khi bỏ dấu cách
  const s = src
    .replace(/\s+n\s+|&/g, '∩')
    .replace(/\s+u\s+|\|/g, '∪')
    .replace(/\s+/g, '')
    .replace(/\\|−|-/g, '\\')
  let i = 0
  type F = (m: boolean[]) => boolean
  const atom = (): F => {
    let f: F
    if (s[i] === '(') {
      i++
      f = union()
      if (s[i] !== ')') throw new Error('Thiếu dấu ")"')
      i++
    } else {
      const m = /^[A-Za-z]\w*/.exec(s.slice(i))
      if (!m) throw new Error(`Không đọc được miền tô ở "${s.slice(i, i + 5) || 'cuối'}"`)
      const k = names.indexOf(m[0])
      if (k < 0) {
        if (m[0] === 'U') f = () => true
        else throw new Error(`Không có tập "${m[0]}" (các tập: ${names.join(', ')})`)
      } else f = (mm) => mm[k]
      i += m[0].length
    }
    while (s[i] === "'" || s[i] === '’') {
      const g = f
      f = (mm) => !g(mm)
      i++
    }
    return f
  }
  const inter = (): F => {
    let f = atom()
    while (s[i] === '∩' || s[i] === '\\') {
      const op = s[i++]
      const g = f
      const h = atom()
      f = op === '∩' ? (m) => g(m) && h(m) : (m) => g(m) && !h(m)
    }
    return f
  }
  function union(): F {
    let f = inter()
    while (s[i] === '∪') {
      i++
      const g = f
      const h = inter()
      f = (m) => g(m) || h(m)
    }
    return f
  }
  const f = union()
  if (i < s.length) throw new Error(`Thừa "${s.slice(i)}" trong miền tô`)
  return f
}

export function renderVennSvg(spec: VennSpec, desc: string) {
  const names = spec.sets
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (names.length < 2 || names.length > 3) throw new Error('Gõ 2 hoặc 3 tên tập, vd. A, B, C')
  const three = names.length === 3
  const r = 78
  const W = 360
  const H = three ? 345 : 230
  const cx = W / 2
  const cy = three ? 175 : H / 2
  const C: Array<[number, number]> = three
    ? [
        [cx - 46, cy - 30],
        [cx + 46, cy - 30],
        [cx, cy + 48],
      ]
    : [
        [cx - 50, cy],
        [cx + 50, cy],
      ]
  const ins = (x: number, y: number) => C.map(([a, b]) => (x - a) ** 2 + (y - b) ** 2 <= r * r)
  const key = (m: boolean[]) => m.map((v, k) => (v ? names[k] : '')).join('') || 'ngoài'
  const box = { x: 14, y: 14, w: W - 28, h: H - 28 }
  // lấy mẫu lưới: điểm đại diện (tâm) mỗi miền để ghi số
  const sum = new Map<string, [number, number, number]>()
  for (let x = box.x + 4; x < box.x + box.w; x += 4)
    for (let y = box.y + 4; y < box.y + box.h; y += 4) {
      const k = key(ins(x, y))
      const s = sum.get(k) ?? [0, 0, 0]
      sum.set(k, [s[0] + x, s[1] + y, s[2] + 1])
    }
  let b = `<defs><pattern id="vnh" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#555" stroke-width="1.6"/></pattern>`
  C.forEach(([a, c], k) => (b += `<clipPath id="vc${k}"><circle cx="${a}" cy="${c}" r="${r}"/></clipPath>`))
  b += `<mask id="vall" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/></mask></defs>`
  // tô: mỗi miền nguyên tử thoả biểu thức → giao các hình tròn "thuộc", trừ các hình tròn "không thuộc"
  if (spec.shade.trim()) {
    const f = setExpr(spec.shade, names)
    const combos = Array.from({ length: 2 ** names.length }, (_, n) => names.map((_, k) => Boolean(n & (1 << k))))
    combos.forEach((m, n) => {
      if (!f(m)) return
      const maskId = `vm${n}`
      b += `<mask id="${maskId}" maskUnits="userSpaceOnUse"><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${C.map(([a, c], k) => (m[k] ? '' : `<circle cx="${a}" cy="${c}" r="${r}" fill="#000"/>`)).join('')}</mask>`
      let shape = `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="url(#vnh)" mask="url(#${maskId})"/>`
      m.forEach((v, k) => {
        if (v) shape = `<g clip-path="url(#vc${k})">${shape}</g>`
      })
      b += shape
    })
  }
  if (spec.universe) {
    b += `<rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="#111" stroke-width="1.4"/>`
    b += `<text x="${box.x + 8}" y="${box.y + 20}" ${FAM} font-size="16" font-style="italic">U</text>`
  }
  C.forEach(([a, c], k) => {
    b += `<circle cx="${a}" cy="${c}" r="${r}" fill="none" stroke="#111" stroke-width="1.6"/>`
    // tên tập ngoài vòng, phía xa tâm chung
    const dx = a - cx
    const dy = c - (three ? cy + 6 : cy)
    const L = Math.hypot(dx, dy) || 1
    const lx = a + (dx / L) * (r + 12)
    const ly = c + (three ? (dy / L) * (r + 12) : -r - 6) + 5
    b += `<text x="${f1(three ? lx : a + (k ? 40 : -40))}" y="${f1(three ? ly : ly)}" ${FAM} font-size="17" font-style="italic" text-anchor="middle">${esc(names[k])}</text>`
  })
  // số phần tử
  for (const raw of spec.counts.split('\n')) {
    const t = raw.trim()
    if (!t) continue
    const m = /^([^:]+):\s*(.+)$/.exec(t)
    if (!m) throw new Error(`Dòng "${t}" cần dạng Miền: số, vd. AB: 3`)
    let k = m[1].replace(/\s+|∩/g, '')
    if (/^(ngoài|ngoai|U)$/i.test(k)) k = 'ngoài'
    else k = names.filter((n) => k.includes(n)).join('')
    const s = sum.get(k)
    if (!s) throw new Error(`Không có miền "${m[1].trim()}"`)
    const [x, y] = k === 'ngoài' ? [box.x + box.w - 22, box.y + box.h - 14] : [s[0] / s[2], s[1] / s[2]]
    b += `<text x="${f1(x)}" y="${f1(y + 5)}" ${FAM} font-size="15" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="3">${esc(m[2].trim())}</text>`
  }
  return wrap(W, H, desc, b)
}
