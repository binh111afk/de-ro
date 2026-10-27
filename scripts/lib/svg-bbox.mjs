/** Hộp bao (bbox) của một chuỗi path SVG; dùng chung cho các script nhập sheet. */
const NUM = /[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g
export function bboxOf(d) {
  const tokens = d.match(NUM) || []
  let i = 0
  let cmd = ''
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const xs = []
  const ys = []
  const add = (px, py) => {
    if (Number.isFinite(px) && Number.isFinite(py)) {
      xs.push(px)
      ys.push(py)
    }
  }
  const num = () => Number(tokens[i++])
  while (i < tokens.length) {
    if (/[a-zA-Z]/.test(tokens[i])) cmd = tokens[i++]
    if (!cmd) break
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    if (C === 'M') {
      x = rel ? x + num() : num()
      y = rel ? y + num() : num()
      add(x, y)
      sx = x
      sy = y
      cmd = rel ? 'l' : 'L'
      continue
    }
    if (C === 'Z') { x = sx; y = sy; continue }
    if (C === 'L') { x = rel ? x + num() : num(); y = rel ? y + num() : num(); add(x, y); continue }
    if (C === 'H') { x = rel ? x + num() : num(); add(x, y); continue }
    if (C === 'V') { y = rel ? y + num() : num(); add(x, y); continue }
    if (C === 'C' || C === 'S' || C === 'Q') {
      const n = C === 'C' ? 3 : 2
      for (let k = 0; k < n; k++) {
        const px = rel ? x + num() : num()
        const py = rel ? y + num() : num()
        add(px, py)
        if (k === n - 1) { x = px; y = py }
      }
      continue
    }
    if (C === 'T') { x = rel ? x + num() : num(); y = rel ? y + num() : num(); add(x, y); continue }
    if (C === 'A') {
      const rx = Math.abs(num())
      const ry = Math.abs(num())
      num(); num(); num()
      x = rel ? x + num() : num()
      y = rel ? y + num() : num()
      add(x - rx, y - ry)
      add(x + rx, y + ry)
      add(x, y)
      continue
    }
    i++
  }
  return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }
}
