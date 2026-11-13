/**
 * Công cụ "Sơ đồ phả hệ" (Sinh học 12 / Đề thi tốt nghiệp THPT).
 * Kí hiệu chuẩn di truyền học:
 *   - Nam: hình vuông
 *   - Nữ: hình tròn
 *   - Chưa rõ giới tính: hình thoi
 *   - Bình thường: màu trắng
 *   - Bị bệnh: tô đen kín
 *   - Mang gen (dị hợp): tô nửa đen hoặc chấm giữa
 *   - Đã chết: gạch chéo
 *   - Người hỏi trong đề: dấu "?" cạnh hình
 *   - Vợ chồng: đường nối ngang (cận huyết: gạch đôi)
 *   - Con: rẽ nhánh từ đường ngang anh chị em (sinh đôi cùng trứng: có thanh ngang; khác trứng: không thanh ngang)
 *   - Thế hệ: tự suy ra từ quan hệ, đánh số La Mã I, II, III...
 */

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (n: number) => Math.round(n * 10) / 10

export type Gender = 'male' | 'female' | 'unknown'
export type HealthStatus = 'normal' | 'affected' | 'carrier'

export interface PedigreePerson {
  id: string
  label: string
  gender: Gender
  status: HealthStatus
  deceased: boolean
  isQuestion: boolean
  lineDeclared?: number
}

export type ChildItem =
  | { type: 'single'; id: string }
  | { type: 'identicalTwins'; ids: [string, string] }
  | { type: 'fraternalTwins'; ids: [string, string] }

export interface PedigreeMarriage {
  parent1: string
  parent2: string
  consanguineous: boolean
  children: ChildItem[]
  line: number
}

export interface PedigreeSpec {
  /** mỗi dòng một lệnh khai báo người, hôn nhân, con cái, chú thích */
  text: string
  /** bật/tắt khung chú thích (mặc định: bật) */
  legend?: boolean
  /** kiểu mang gen: 'half' (tô nửa) | 'dot' (chấm giữa), mặc định: 'half' */
  carrierStyle?: 'half' | 'dot'
}

export const PEDIGREE_SAMPLE = `bệnh "bạch tạng"
1: nam bt
2: nữ bệnh
3: nam bệnh
4: nữ bt
1 x 2 -> 5, 6, 7
3 x 4 -> 8, 9
5: nữ bt
6: nam bệnh
7: nữ mang gen
8: nam bt
9: nữ bt
6 x 9 -> 10, 11, 12
10: nam bệnh
11: nữ bt
12: ?
hỏi 12`

export const PEDIGREE_SAMPLE_TWINS = `bệnh "mù màu"
1: nam bt
2: nữ mang gen
1 x 2 -> 3, (4 5), 6
3: nam bệnh
4: nữ bt
5: nữ bt
6: nam bt
7: nữ mang gen
6 x 7 -> [8 9], 10
8: nam bt
9: nữ bệnh
10: ?
hỏi 10`

export interface ParseResult {
  persons: Map<string, PedigreePerson>
  marriages: PedigreeMarriage[]
  disease?: string
  legend: boolean
  carrierStyle: 'half' | 'dot'
  errors: Array<{ line: number; msg: string }>
}

function deaccent(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

const MARR_RE = /^(\S+?)\s*(xx|x)\s*(\S+?)(?:\s*(?:->|→)\s*(.*))?$/i

export function parsePedigree(text: string, options?: { legend?: boolean; carrierStyle?: 'half' | 'dot' }): ParseResult {
  const persons = new Map<string, PedigreePerson>()
  const marriages: PedigreeMarriage[] = []
  const errors: Array<{ line: number; msg: string }> = []
  const questionIds = new Set<string>()
  const childParentMap = new Map<string, number>()
  let disease: string | undefined
  let legend = options?.legend ?? true
  let carrierStyle: 'half' | 'dot' = options?.carrierStyle ?? 'half'

  const lines = text.split('\n')
  const marriageLines: Array<{ line: string; lineNum: number }> = []

  lines.forEach((rawLine, idx) => {
    const lineNum = idx + 1
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) return

    const d = deaccent(line).toLowerCase()

    // 1. Tên bệnh: bệnh "mù màu" / benh "mù màu" / bệnh: mù màu
    if (d.startsWith('benh ') || d.startsWith('benh:') || d.startsWith('benh"')) {
      const m = line.match(/^(?:bệnh|benh)\s*(?::\s*|\s+)("([^"]+)"|'([^']+)'|(.+))$/i)
      if (m) {
        disease = (m[2] || m[3] || m[4]).trim()
        return
      }
    }

    // 2. Chú thích bật/tắt
    if (d.startsWith('chu thich:') || d.startsWith('chu thich ')) {
      const v = d.replace(/^chu thich[:\s]+/, '').trim()
      if (v === 'khong' || v === 'tat' || v === 'false' || v === '0') legend = false
      else if (v === 'co' || v === 'bat' || v === 'true' || v === '1') legend = true
      return
    }

    // 3. Kiểu mang gen: tô nửa / chấm
    if (d.startsWith('kieu mang gen:') || d.startsWith('kieu mang gen ')) {
      const v = d.replace(/^kieu mang gen[:\s]+/, '').trim()
      if (v.includes('cham') || v.includes('dot')) carrierStyle = 'dot'
      else if (v.includes('nua') || v.includes('half')) carrierStyle = 'half'
      return
    }

    // 4. Hỏi: hỏi 10 / ? 10 / hỏi: 10
    if (d.startsWith('hoi ') || d.startsWith('hoi:') || d.startsWith('? ') || d.startsWith('?:')) {
      const body = line.replace(/^(?:hỏi|hoi|\?)\s*:?\s*/i, '').trim()
      const tokens = body.split(/[\s,]+/).filter(Boolean)
      tokens.forEach((id) => questionIds.add(id))
      return
    }

    // 5. Khai báo người: <id> [nhãn]: thuộc tính
    // vd: "1: nam bệnh", "2: nữ", "5: ?"
    const colonIdx = line.indexOf(':')
    if (colonIdx > 0) {
      const rawIdPart = line.slice(0, colonIdx).trim()
      const rawAttrPart = line.slice(colonIdx + 1).trim()

      // Kiểm tra rawIdPart không phải hôn nhân (không chứa ' x ' hay ' xx ')
      if (!/\bxx?\b/i.test(rawIdPart)) {
        let id = rawIdPart
        let label = rawIdPart
        const labelM = rawIdPart.match(/^(\S+)\s+["'([]([^"'\])]+)["')\]]$/)
        if (labelM) {
          id = labelM[1]
          label = labelM[2]
        }

        const attrD = deaccent(rawAttrPart).toLowerCase()

        // Giới tính
        let gender: Gender = 'unknown'
        if (/\bnam\b/.test(attrD)) gender = 'male'
        else if (/\b(nu)\b/.test(attrD)) gender = 'female'
        else if (attrD.includes('?') || attrD.includes('chua ro') || attrD.includes('kxd')) gender = 'unknown'

        // Trạng thái bệnh tật / mang gen
        let status: HealthStatus = 'normal'
        if (attrD.includes('mang gen') || attrD.includes('carrier') || attrD.includes('di hop')) {
          status = 'carrier'
        } else if (attrD.includes('benh')) {
          status = 'affected'
        } else if (attrD.includes('binh thuong') || attrD.includes('lanh') || attrD.includes('bt')) {
          status = 'normal'
        }

        // Đã chết
        const deceased = /\b(chet|mat|tu)\b/.test(attrD)

        // Người hỏi
        const isQuestion = rawAttrPart.includes('?') || questionIds.has(id)

        if (persons.has(id)) {
          errors.push({ line: lineNum, msg: `Người "${id}" bị khai báo lặp lại` })
        }

        persons.set(id, {
          id,
          label,
          gender,
          status,
          deceased,
          isQuestion,
          lineDeclared: lineNum,
        })
        return
      }
    }

    // 6. Hôn nhân & con cái: 1 x 2 [-> 5, 6, 7] hoặc 1 xx 2 — xử lý sau khi đọc hết khai báo người,
    // để người (kể cả con) khai báo ở dòng sau vẫn hợp lệ
    if (MARR_RE.test(line)) {
      marriageLines.push({ line, lineNum })
      return
    }

    errors.push({ line: lineNum, msg: `Cú pháp không hợp lệ: "${line}"` })
  })

  marriageLines.forEach(({ line, lineNum }) => {
    const marrMatch = line.match(MARR_RE)
    if (marrMatch) {
      const p1 = marrMatch[1]
      const rel = marrMatch[2].toLowerCase()
      const p2 = marrMatch[3]
      const childrenRaw = marrMatch[4]

      if (p1 === p2) {
        errors.push({ line: lineNum, msg: `Người "${p1}" không thể kết hôn với chính mình` })
      }

      if (!persons.has(p1)) {
        errors.push({ line: lineNum, msg: `Người "${p1}" chưa được khai báo` })
        persons.set(p1, { id: p1, label: p1, gender: 'male', status: 'normal', deceased: false, isQuestion: false })
      }
      if (!persons.has(p2)) {
        errors.push({ line: lineNum, msg: `Người "${p2}" chưa được khai báo` })
        persons.set(p2, { id: p2, label: p2, gender: 'female', status: 'normal', deceased: false, isQuestion: false })
      }

      const children: ChildItem[] = []
      if (childrenRaw && childrenRaw.trim()) {
        let rest = childrenRaw.trim()
        while (rest.length > 0) {
          // Sinh đôi cùng trứng (8 9) hoặc (8, 9)
          const idTwins = rest.match(/^\(\s*([^,\s)]+)[,\s]+([^,\s)]+)\s*\)/)
          if (idTwins) {
            children.push({ type: 'identicalTwins', ids: [idTwins[1], idTwins[2]] })
            rest = rest.slice(idTwins[0].length).replace(/^[\s,]+/, '')
            continue
          }
          // Sinh đôi khác trứng [8 9] hoặc [8, 9]
          const frTwins = rest.match(/^\[\s*([^,\s\]]+)[,\s]+([^,\s\]]+)\s*\]/)
          if (frTwins) {
            children.push({ type: 'fraternalTwins', ids: [frTwins[1], frTwins[2]] })
            rest = rest.slice(frTwins[0].length).replace(/^[\s,]+/, '')
            continue
          }
          // Con đơn
          const sng = rest.match(/^([^,\s([\]]+)/)
          if (sng) {
            children.push({ type: 'single', id: sng[1] })
            rest = rest.slice(sng[0].length).replace(/^[\s,]+/, '')
            continue
          }
          break
        }

        // Kiểm tra khai báo con & trùng bố mẹ
        children.forEach((ch) => {
          const ids = ch.type === 'single' ? [ch.id] : ch.ids
          ids.forEach((cid) => {
            if (!persons.has(cid)) {
              errors.push({ line: lineNum, msg: `Người con "${cid}" chưa được khai báo` })
              persons.set(cid, { id: cid, label: cid, gender: 'unknown', status: 'normal', deceased: false, isQuestion: false })
            }
            if (childParentMap.has(cid)) {
              errors.push({ line: lineNum, msg: `Con "${cid}" đã có bố mẹ khác (trùng bố mẹ)` })
            } else {
              childParentMap.set(cid, marriages.length)
            }
          })
        })
      }

      marriages.push({
        parent1: p1,
        parent2: p2,
        consanguineous: rel === 'xx',
        children,
        line: lineNum,
      })
    }
  })

  // Áp dụng các id trong lệnh "hỏi"
  questionIds.forEach((qid) => {
    if (persons.has(qid)) {
      persons.get(qid)!.isQuestion = true
    } else {
      errors.push({ line: 1, msg: `Người hỏi "${qid}" chưa được khai báo` })
    }
  })

  return {
    persons,
    marriages,
    disease,
    legend,
    carrierStyle,
    errors,
  }
}

/**
 * Tính thế hệ cho từng người.
 * - Spouses: cùng thế hệ.
 * - Con: thế hệ = max(bố, mẹ) + 1.
 * - Phát hiện chu trình nếu vượt quá giới hạn.
 */
export function assignGenerations(
  persons: Map<string, PedigreePerson>,
  marriages: PedigreeMarriage[],
  errors: Array<{ line: number; msg: string }>,
): Map<string, number> {
  const gen = new Map<string, number>()
  for (const id of persons.keys()) gen.set(id, 0)

  let changed = true
  let iter = 0
  const maxIter = Math.max(10, persons.size * 2 + 5)

  while (changed && iter < maxIter) {
    changed = false
    iter++

    for (const m of marriages) {
      const g1 = gen.get(m.parent1) ?? 0
      const g2 = gen.get(m.parent2) ?? 0
      const maxG = Math.max(g1, g2)
      if (g1 < maxG) {
        gen.set(m.parent1, maxG)
        changed = true
      }
      if (g2 < maxG) {
        gen.set(m.parent2, maxG)
        changed = true
      }

      const childGen = maxG + 1
      for (const ch of m.children) {
        const ids = ch.type === 'single' ? [ch.id] : ch.ids
        for (const cid of ids) {
          const cg = gen.get(cid) ?? 0
          if (cg < childGen) {
            gen.set(cid, childGen)
            changed = true
          }
        }
      }
    }
  }

  if (iter >= maxIter) {
    errors.push({ line: 1, msg: 'Phát hiện vòng lặp quan hệ thế hệ' })
  }

  // Chuẩn hoá để thế hệ nhỏ nhất là 0
  let minG = Infinity
  for (const g of gen.values()) {
    if (g < minG) minG = g
  }
  if (minG !== 0 && minG !== Infinity) {
    for (const [id, g] of gen.entries()) {
      gen.set(id, g - minG)
    }
  }

  return gen
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export interface BoundingBox {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface PedigreeLayout {
  positions: Map<string, { x: number; y: number; gen: number }>
  marriages: PedigreeMarriage[]
  persons: Map<string, PedigreePerson>
  width: number
  height: number
  disease?: string
  legend: boolean
  carrierStyle: 'half' | 'dot'
  errors: Array<{ line: number; msg: string }>
  boxes: BoundingBox[]
}

/**
 * Bố cục phả hệ tự động:
 * 1. Phân chia thế hệ theo hàng dọc (Y).
 * 2. Xác định thứ tự xuất hiện các cá thể theo từng hàng (X) sao cho vợ chồng kề nhau,
 *    con cái giữ thứ tự khai báo, người lấy vào đặt kề người kết hôn.
 * 3. Căn giữa con cái dưới bố mẹ, đảm bảo khoảng cách tối thiểu, không bao giờ chồng hộp bao.
 */
export function layoutPedigree(parsed: ParseResult): PedigreeLayout {
  const { persons, marriages, disease, legend, carrierStyle, errors } = parsed

  if (persons.size === 0) {
    return {
      positions: new Map(),
      marriages: [],
      persons,
      width: 400,
      height: 200,
      disease,
      legend,
      carrierStyle,
      errors: [{ line: 1, msg: 'Chưa có khai báo cá thể nào' }],
      boxes: [],
    }
  }

  const genMap = assignGenerations(persons, marriages, errors)
  const maxGen = Math.max(...Array.from(genMap.values()))

  // Gom các cá thể theo thế hệ
  const byGen = new Map<number, string[]>()
  for (let g = 0; g <= maxGen; g++) byGen.set(g, [])
  for (const [id, g] of genMap.entries()) {
    byGen.get(g)!.push(id)
  }

  // Lập bản đồ hôn nhân theo từng người
  const spouseOf = new Map<string, string[]>()
  for (const m of marriages) {
    if (!spouseOf.has(m.parent1)) spouseOf.set(m.parent1, [])
    if (!spouseOf.has(m.parent2)) spouseOf.set(m.parent2, [])
    spouseOf.get(m.parent1)!.push(m.parent2)
    spouseOf.get(m.parent2)!.push(m.parent1)
  }

  // Xác định cặp sinh đôi để đặt khoảng cách kề nhau
  const twinPairSet = new Set<string>()
  for (const m of marriages) {
    for (const ch of m.children) {
      if (ch.type !== 'single') {
        const [a, b] = ch.ids
        twinPairSet.add(`${a}:${b}`)
        twinPairSet.add(`${b}:${a}`)
      }
    }
  }

  const hasParents = new Set<string>()
  for (const m of marriages) for (const ch of m.children) for (const id of ch.type === 'single' ? [ch.id] : ch.ids) hasParents.add(id)

  // 1. Sắp xếp thứ tự các cá thể trong từng thế hệ từ trái sang phải
  const orderedGen = new Map<number, string[]>()

  // Thế hệ 0: xếp các cặp bố mẹ sáng lập
  const gen0Placed = new Set<string>()
  const gen0List: string[] = []
  for (const m of marriages) {
    if ((genMap.get(m.parent1) ?? 0) === 0 && (genMap.get(m.parent2) ?? 0) === 0) {
      if (!gen0Placed.has(m.parent1) && !gen0Placed.has(m.parent2)) {
        gen0List.push(m.parent1, m.parent2)
        gen0Placed.add(m.parent1)
        gen0Placed.add(m.parent2)
      }
    }
  }
  for (const id of byGen.get(0) ?? []) {
    if (!gen0Placed.has(id)) {
      gen0List.push(id)
      gen0Placed.add(id)
    }
  }
  orderedGen.set(0, gen0List)

  // Các thế hệ 1, 2, ...
  for (let g = 1; g <= maxGen; g++) {
    const list: string[] = []
    const placed = new Set<string>()

    // Duyệt qua các cuộc hôn nhân ở thế hệ trước theo thứ tự vị trí bố mẹ
    const prevList = orderedGen.get(g - 1) ?? []
    const parentMidPos = new Map<PedigreeMarriage, number>()
    for (const m of marriages) {
      const idx1 = prevList.indexOf(m.parent1)
      const idx2 = prevList.indexOf(m.parent2)
      if (idx1 >= 0 && idx2 >= 0) {
        parentMidPos.set(m, (idx1 + idx2) / 2)
      } else if (idx1 >= 0 || idx2 >= 0) {
        parentMidPos.set(m, Math.max(idx1, idx2))
      } else {
        parentMidPos.set(m, 999)
      }
    }

    const sortedMarriages = marriages
      // chỉ cặp bố mẹ ở đúng thế hệ ngay trên (con của họ thuộc thế hệ g)
      .filter((m) => Math.max(genMap.get(m.parent1) ?? 0, genMap.get(m.parent2) ?? 0) === g - 1 && m.children.length > 0)
      .sort((a, b) => (parentMidPos.get(a) ?? 0) - (parentMidPos.get(b) ?? 0))

    for (const m of sortedMarriages) {
      const sibIds: string[] = []
      // người có vợ/chồng thuộc nhóm anh chị em đã xếp (bên trái) đứng đầu, thuộc nhóm chưa xếp (bên phải) đứng cuối,
      // để đường nối vợ chồng không cắt qua người khác; cặp sinh đôi giữ nguyên khối
      const sideOf = (ids: string[]) => {
        const sp = ids.flatMap((id) => spouseOf.get(id) ?? []).filter((s) => (genMap.get(s) ?? 0) === g && hasParents.has(s))
        if (sp.some((s) => placed.has(s))) return 0
        if (sp.length) return 2
        return 1
      }
      const groups = [...m.children].sort(
        (a, b) => sideOf(a.type === 'single' ? [a.id] : a.ids) - sideOf(b.type === 'single' ? [b.id] : b.ids),
      )
      for (const ch of groups) {
        if (ch.type === 'single') sibIds.push(ch.id)
        else sibIds.push(ch.ids[0], ch.ids[1])
      }

      // Đặt con cái và vợ/chồng lấy vào
      sibIds.forEach((cid, i) => {
        if (placed.has(cid) || (genMap.get(cid) ?? 0) !== g) return
        const spouses = (spouseOf.get(cid) ?? []).filter((sid) => (genMap.get(sid) ?? 0) === g)

        // Nếu người này kết hôn với người ngoài (không thuộc nhóm con cái của các gia đình khác ở thế hệ này)
        // Đặt người vợ/chồng cạnh nhau
        // chỉ người "lấy vào" (không có bố mẹ trong sơ đồ) mới đứng cạnh; người có bố mẹ đứng trong nhóm anh chị em của mình
        const outsideSpouses = spouses.filter((sid) => !placed.has(sid) && !hasParents.has(sid))

        if (outsideSpouses.length > 0) {
          const sid = outsideSpouses[0]
          // Nếu con ở vị trí đầu của nhóm anh chị em, cho vợ/chồng đứng bên trái
          if (i === 0 && sibIds.length > 1) {
            list.push(sid, cid)
          } else {
            list.push(cid, sid)
          }
          placed.add(cid)
          placed.add(sid)
        } else {
          list.push(cid)
          placed.add(cid)
        }
      })
    }

    // Còn cá thể nào chưa đặt ở thế hệ g thì thêm vào cuối
    for (const id of byGen.get(g) ?? []) {
      if (!placed.has(id)) {
        list.push(id)
        placed.add(id)
      }
    }

    orderedGen.set(g, list)
  }

  // 2. Gán toạ độ Y và X
  const ROW_HEIGHT = 86
  const Y0 = 46
  const positions = new Map<string, { x: number; y: number; gen: number }>()

  // Khoảng cách cơ bản
  const SPAN_MARRIED = 56
  const SPAN_TWIN = 38
  const SPAN_DEFAULT = 48

  // Đặt X ban đầu cho từng thế hệ
  for (let g = 0; g <= maxGen; g++) {
    const list = orderedGen.get(g) ?? []
    let curX = 72
    const y = Y0 + g * ROW_HEIGHT

    list.forEach((id, i) => {
      if (i > 0) {
        const prevId = list[i - 1]
        const isM = (spouseOf.get(prevId) ?? []).includes(id)
        const isT = twinPairSet.has(`${prevId}:${id}`)
        const gap = isM ? SPAN_MARRIED : isT ? SPAN_TWIN : SPAN_DEFAULT
        curX += gap
      }
      positions.set(id, { x: curX, y, gen: g })
    })
  }

  // 3. Căn giữa con cái dưới bố mẹ (lặp nhiều lượt trên-dưới)
  for (let pass = 0; pass < 3; pass++) {
    for (const m of marriages) {
      if (!m.children.length) continue
      const p1Pos = positions.get(m.parent1)
      const p2Pos = positions.get(m.parent2)
      if (!p1Pos || !p2Pos) continue

      const pMid = (p1Pos.x + p2Pos.x) / 2

      // Tính tâm các con
      const childIds: string[] = []
      for (const ch of m.children) {
        if (ch.type === 'single') childIds.push(ch.id)
        else childIds.push(ch.ids[0], ch.ids[1])
      }
      const cXs = childIds.map((cid) => positions.get(cid)?.x ?? 0)
      const cMid = (Math.min(...cXs) + Math.max(...cXs)) / 2

      // Dịch chuyển con để thẳng hàng với bố mẹ nếu có thể
      const shift = pMid - cMid
      if (Math.abs(shift) > 2) {
        if (shift > 0) {
          // Bố mẹ ở bên phải con -> dịch con và các cá thể bên phải con sang phải
          const cGen = p1Pos.gen + 1
          const list = orderedGen.get(cGen) ?? []
          const firstChildIdx = list.indexOf(childIds[0])
          if (firstChildIdx >= 0) {
            for (let i = firstChildIdx; i < list.length; i++) {
              const pos = positions.get(list[i])!
              pos.x += shift
            }
          }
        } else {
          // Con ở bên phải bố mẹ -> dịch bố mẹ sang phải
          const pGen = p1Pos.gen
          const list = orderedGen.get(pGen) ?? []
          const minPIdx = Math.min(list.indexOf(m.parent1), list.indexOf(m.parent2))
          if (minPIdx >= 0) {
            for (let i = minPIdx; i < list.length; i++) {
              const pos = positions.get(list[i])!
              pos.x += -shift
            }
          }
        }
      }
    }

    // Đảm bảo không bị dồn ngược làm giảm khoảng cách tối thiểu
    for (let g = 0; g <= maxGen; g++) {
      const list = orderedGen.get(g) ?? []
      for (let i = 1; i < list.length; i++) {
        const prevId = list[i - 1]
        const id = list[i]
        const isM = (spouseOf.get(prevId) ?? []).includes(id)
        const isT = twinPairSet.has(`${prevId}:${id}`)
        const minGap = isM ? SPAN_MARRIED : isT ? SPAN_TWIN : SPAN_DEFAULT
        const p1 = positions.get(prevId)!
        const p2 = positions.get(id)!
        if (p2.x - p1.x < minGap) {
          p2.x = p1.x + minGap
        }
      }
    }
  }

  // 4. Chuẩn hoá toạ độ: dịch lề trái tối thiểu 70px cho nhãn thế hệ La Mã
  let minAllX = Infinity
  for (const pos of positions.values()) {
    if (pos.x < minAllX) minAllX = pos.x
  }
  const xOffset = 72 - minAllX
  for (const pos of positions.values()) {
    pos.x = Math.round(pos.x + xOffset)
  }

  // Tính hộp bao cho mọi cá thể
  const boxes: BoundingBox[] = []
  for (const [id, pos] of positions.entries()) {
    boxes.push({
      id,
      x1: pos.x - 13,
      y1: pos.y - 13,
      x2: pos.x + 13,
      y2: pos.y + 13,
    })
  }

  // Tính chiều rộng & chiều cao tổng thể
  let maxAllX = 0
  let maxAllY = 0
  for (const pos of positions.values()) {
    if (pos.x > maxAllX) maxAllX = pos.x
    if (pos.y > maxAllY) maxAllY = pos.y
  }

  const baseWidth = Math.max(480, maxAllX + 54)
  const baseHeight = maxAllY + 36

  return {
    positions,
    marriages,
    persons,
    width: baseWidth,
    height: baseHeight,
    disease,
    legend,
    carrierStyle,
    errors,
    boxes,
  }
}

/**
 * Vẽ sơ đồ phả hệ thành SVG.
 */
export function renderPedigreeSvg(
  spec: PedigreeSpec,
  desc: string = '',
): { svg: string; width: number; height: number; errors?: Array<{ line: number; msg: string }> } {
  const parsed = parsePedigree(spec.text, { legend: spec.legend, carrierStyle: spec.carrierStyle })
  const layout = layoutPedigree(parsed)
  const { positions, marriages, persons, disease, legend, carrierStyle, errors } = layout

  let body = ''

  // 1. Vẽ số La Mã thế hệ bên trái
  const maxGen = Math.max(0, ...Array.from(positions.values()).map((p) => p.gen))
  const ROW_HEIGHT = 86
  const Y0 = 46

  for (let g = 0; g <= maxGen; g++) {
    const y = Y0 + g * ROW_HEIGHT
    const roman = ROMAN[g] ?? String(g + 1)
    body += `<text x="24" y="${y + 5}" ${FAM} font-size="15" font-weight="bold" fill="#111" text-anchor="start">${roman}</text>`
  }

  // 2. Vẽ đường hôn nhân và đường nối con cái
  for (const m of marriages) {
    const p1Pos = positions.get(m.parent1)
    const p2Pos = positions.get(m.parent2)
    if (!p1Pos || !p2Pos) continue

    const leftX = Math.min(p1Pos.x, p2Pos.x)
    const rightX = Math.max(p1Pos.x, p2Pos.x)
    const y = p1Pos.y // đã cùng hàng

    // Đường vợ chồng
    if (m.consanguineous) {
      body += `<line x1="${f1(leftX + 13)}" y1="${f1(y - 2.5)}" x2="${f1(rightX - 13)}" y2="${f1(y - 2.5)}" stroke="#111" stroke-width="1.6"/>`
      body += `<line x1="${f1(leftX + 13)}" y1="${f1(y + 2.5)}" x2="${f1(rightX - 13)}" y2="${f1(y + 2.5)}" stroke="#111" stroke-width="1.6"/>`
    } else {
      body += `<line x1="${f1(leftX + 13)}" y1="${f1(y)}" x2="${f1(rightX - 13)}" y2="${f1(y)}" stroke="#111" stroke-width="1.6"/>`
    }

    // Nếu có con cái
    if (m.children.length > 0) {
      const midParentX = (p1Pos.x + p2Pos.x) / 2
      const busY = y + 42
      const childTopY = y + ROW_HEIGHT - 13

      // Điểm nhánh của từng con trên đường ngang
      type Branch = { x: number; childType: 'single' | 'twins'; childIds: string[]; identical?: boolean }
      const branches: Branch[] = []

      for (const ch of m.children) {
        if (ch.type === 'single') {
          const cPos = positions.get(ch.id)
          if (cPos) branches.push({ x: cPos.x, childType: 'single', childIds: [ch.id] })
        } else {
          const c1Pos = positions.get(ch.ids[0])
          const c2Pos = positions.get(ch.ids[1])
          if (c1Pos && c2Pos) {
            const twinMidX = (c1Pos.x + c2Pos.x) / 2
            branches.push({
              x: twinMidX,
              childType: 'twins',
              childIds: [ch.ids[0], ch.ids[1]],
              identical: ch.type === 'identicalTwins',
            })
          }
        }
      }

      if (branches.length === 1 && branches[0].childType === 'single' && Math.abs(branches[0].x - midParentX) < 1) {
        // Chỉ 1 con thẳng hàng: một đoạn thẳng từ bố mẹ xuống thẳng con
        body += `<line x1="${f1(midParentX)}" y1="${f1(y)}" x2="${f1(midParentX)}" y2="${f1(childTopY)}" stroke="#111" stroke-width="1.5"/>`
      } else {
        // Đường dọc từ tâm bố mẹ xuống đường xe bus
        body += `<line x1="${f1(midParentX)}" y1="${f1(y)}" x2="${f1(midParentX)}" y2="${f1(busY)}" stroke="#111" stroke-width="1.5"/>`

        // Đường ngang xe bus nối tất cả các con
        const allBranchXs = [midParentX, ...branches.map((b) => b.x)]
        const minBranchX = Math.min(...allBranchXs)
        const maxBranchX = Math.max(...allBranchXs)
        body += `<line x1="${f1(minBranchX)}" y1="${f1(busY)}" x2="${f1(maxBranchX)}" y2="${f1(busY)}" stroke="#111" stroke-width="1.5"/>`

        // Nhánh xuống từng con
        for (const br of branches) {
          if (br.childType === 'single') {
            body += `<line x1="${f1(br.x)}" y1="${f1(busY)}" x2="${f1(br.x)}" y2="${f1(childTopY)}" stroke="#111" stroke-width="1.5"/>`
          } else {
            // Sinh đôi: 2 nhánh chéo từ một điểm
            const pA = positions.get(br.childIds[0])!
            const pB = positions.get(br.childIds[1])!
            body += `<line x1="${f1(br.x)}" y1="${f1(busY)}" x2="${f1(pA.x)}" y2="${f1(childTopY)}" stroke="#111" stroke-width="1.5"/>`
            body += `<line x1="${f1(br.x)}" y1="${f1(busY)}" x2="${f1(pB.x)}" y2="${f1(childTopY)}" stroke="#111" stroke-width="1.5"/>`

            // Sinh đôi cùng trứng: có thanh ngang giữa 2 nhánh
            if (br.identical) {
              const crossY = (busY + childTopY) / 2
              const x1 = (br.x + pA.x) / 2
              const x2 = (br.x + pB.x) / 2
              body += `<line x1="${f1(x1)}" y1="${f1(crossY)}" x2="${f1(x2)}" y2="${f1(crossY)}" stroke="#111" stroke-width="1.5"/>`
            }
          }
        }
      }
    }
  }

  // 3. Vẽ hình người và số hiển thị
  for (const [id, person] of persons.entries()) {
    const pos = positions.get(id)
    if (!pos) continue

    const { x, y } = pos
    const { gender, status, deceased, isQuestion, label } = person

    // Nam: Vuông 26x26
    if (gender === 'male') {
      const rx = x - 13
      const ry = y - 13
      if (status === 'normal') {
        body += `<rect x="${f1(rx)}" y="${f1(ry)}" width="26" height="26" fill="#fff" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'affected') {
        body += `<rect x="${f1(rx)}" y="${f1(ry)}" width="26" height="26" fill="#111" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'carrier') {
        if (carrierStyle === 'dot') {
          body += `<rect x="${f1(rx)}" y="${f1(ry)}" width="26" height="26" fill="#fff" stroke="#111" stroke-width="1.8"/>`
          body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="#111"/>`
        } else {
          body += `<rect x="${f1(rx)}" y="${f1(ry)}" width="26" height="26" fill="#fff" stroke="#111" stroke-width="1.8"/>`
          body += `<rect x="${f1(rx)}" y="${f1(ry)}" width="13" height="26" fill="#111"/>`
          body += `<line x1="${f1(x)}" y1="${f1(ry)}" x2="${f1(x)}" y2="${f1(ry + 26)}" stroke="#111" stroke-width="1.5"/>`
        }
      }
    } else if (gender === 'female') {
      // Nữ: Tròn r=13
      if (status === 'normal') {
        body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="#fff" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'affected') {
        body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="#111" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'carrier') {
        if (carrierStyle === 'dot') {
          body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="#fff" stroke="#111" stroke-width="1.8"/>`
          body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="#111"/>`
        } else {
          body += `<path d="M ${f1(x)} ${f1(y - 13)} A 13 13 0 0 0 ${f1(x)} ${f1(y + 13)} Z" fill="#111"/>`
          body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="13" fill="none" stroke="#111" stroke-width="1.8"/>`
          body += `<line x1="${f1(x)}" y1="${f1(y - 13)}" x2="${f1(x)}" y2="${f1(y + 13)}" stroke="#111" stroke-width="1.5"/>`
        }
      }
    } else {
      // Chưa rõ giới tính: Hình thoi 26x26
      const pts = `${f1(x)},${f1(y - 13)} ${f1(x + 13)},${f1(y)} ${f1(x)},${f1(y + 13)} ${f1(x - 13)},${f1(y)}`
      if (status === 'normal') {
        body += `<polygon points="${pts}" fill="#fff" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'affected') {
        body += `<polygon points="${pts}" fill="#111" stroke="#111" stroke-width="1.8"/>`
      } else if (status === 'carrier') {
        if (carrierStyle === 'dot') {
          body += `<polygon points="${pts}" fill="#fff" stroke="#111" stroke-width="1.8"/>`
          body += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="#111"/>`
        } else {
          const leftPts = `${f1(x)},${f1(y - 13)} ${f1(x)},${f1(y + 13)} ${f1(x - 13)},${f1(y)}`
          body += `<polygon points="${leftPts}" fill="#111"/>`
          body += `<polygon points="${pts}" fill="none" stroke="#111" stroke-width="1.8"/>`
          body += `<line x1="${f1(x)}" y1="${f1(y - 13)}" x2="${f1(x)}" y2="${f1(y + 13)}" stroke="#111" stroke-width="1.5"/>`
        }
      }
    }

    // Gạch chéo người đã chết
    if (deceased) {
      body += `<line x1="${f1(x - 17)}" y1="${f1(y + 17)}" x2="${f1(x + 17)}" y2="${f1(y - 17)}" stroke="#111" stroke-width="1.8"/>`
    }

    // Dấu hỏi cho người hỏi trong đề
    if (isQuestion) {
      body += `<text x="${f1(x + 13)}" y="${f1(y - 7)}" ${FAM} font-size="16" font-weight="bold" fill="#d9383a" text-anchor="start">?</text>`
    }

    // Số / tên hiển thị dưới hình
    body += `<text x="${f1(x)}" y="${f1(y + 26)}" ${FAM} font-size="13" text-anchor="middle" fill="#111">${esc(label)}</text>`
  }

  // 4. Khung chú thích
  let totalHeight = layout.height

  if (legend) {
    // Thu thập các kí hiệu thực tế có dùng
    const usedMaleNormal = Array.from(persons.values()).some((p) => p.gender === 'male' && p.status === 'normal' && !p.deceased)
    const usedFemaleNormal = Array.from(persons.values()).some((p) => p.gender === 'female' && p.status === 'normal' && !p.deceased)
    const usedMaleAffected = Array.from(persons.values()).some((p) => p.gender === 'male' && p.status === 'affected')
    const usedFemaleAffected = Array.from(persons.values()).some((p) => p.gender === 'female' && p.status === 'affected')
    const usedCarrier = Array.from(persons.values()).some((p) => p.status === 'carrier')
    const usedDeceased = Array.from(persons.values()).some((p) => p.deceased)
    const usedUnknown = Array.from(persons.values()).some((p) => p.gender === 'unknown')
    const usedQuestion = Array.from(persons.values()).some((p) => p.isQuestion)
    const usedConsanguineous = marriages.some((m) => m.consanguineous)
    const usedTwinsIdentical = marriages.some((m) => m.children.some((c) => c.type === 'identicalTwins'))
    const usedTwinsFraternal = marriages.some((m) => m.children.some((c) => c.type === 'fraternalTwins'))

    type LegItem = { icon: string; label: string }
    const legItems: LegItem[] = []

    const disSuffix = disease ? ` ${disease}` : ''

    if (usedMaleNormal) {
      legItems.push({
        icon: `<rect x="0" y="0" width="13" height="13" fill="#fff" stroke="#111" stroke-width="1.3"/>`,
        label: 'Nam bình thường',
      })
    }
    if (usedFemaleNormal) {
      legItems.push({
        icon: `<circle cx="6.5" cy="6.5" r="6.5" fill="#fff" stroke="#111" stroke-width="1.3"/>`,
        label: 'Nữ bình thường',
      })
    }
    if (usedMaleAffected) {
      legItems.push({
        icon: `<rect x="0" y="0" width="13" height="13" fill="#111" stroke="#111" stroke-width="1.3"/>`,
        label: `Nam bị bệnh${disSuffix}`,
      })
    }
    if (usedFemaleAffected) {
      legItems.push({
        icon: `<circle cx="6.5" cy="6.5" r="6.5" fill="#111" stroke="#111" stroke-width="1.3"/>`,
        label: `Nữ bị bệnh${disSuffix}`,
      })
    }
    if (usedCarrier) {
      if (carrierStyle === 'dot') {
        legItems.push({
          icon: `<circle cx="6.5" cy="6.5" r="6.5" fill="#fff" stroke="#111" stroke-width="1.3"/><circle cx="6.5" cy="6.5" r="2.5" fill="#111"/>`,
          label: 'Mang gen (dị hợp)',
        })
      } else {
        legItems.push({
          icon: `<path d="M 6.5 0 A 6.5 6.5 0 0 0 6.5 13 Z" fill="#111"/><circle cx="6.5" cy="6.5" r="6.5" fill="none" stroke="#111" stroke-width="1.3"/><line x1="6.5" y1="0" x2="6.5" y2="13" stroke="#111"/>`,
          label: 'Mang gen (dị hợp)',
        })
      }
    }
    if (usedDeceased) {
      legItems.push({
        icon: `<rect x="0" y="0" width="13" height="13" fill="#fff" stroke="#111" stroke-width="1.3"/><line x1="-2" y1="15" x2="15" y2="-2" stroke="#111" stroke-width="1.4"/>`,
        label: 'Đã chết',
      })
    }
    if (usedUnknown) {
      legItems.push({
        icon: `<polygon points="6.5,0 13,6.5 6.5,13 0,6.5" fill="#fff" stroke="#111" stroke-width="1.3"/>`,
        label: 'Chưa rõ giới tính',
      })
    }
    if (usedQuestion) {
      legItems.push({
        icon: `<text x="6.5" y="12" ${FAM} font-size="14" font-weight="bold" fill="#d9383a" text-anchor="middle">?</text>`,
        label: 'Cần xác định',
      })
    }
    if (usedTwinsIdentical) {
      legItems.push({
        icon: `<line x1="1" y1="13" x2="6.5" y2="0" stroke="#111" stroke-width="1.2"/><line x1="12" y1="13" x2="6.5" y2="0" stroke="#111" stroke-width="1.2"/><line x1="3.5" y1="6.5" x2="9.5" y2="6.5" stroke="#111" stroke-width="1.2"/>`,
        label: 'Sinh đôi cùng trứng',
      })
    }
    if (usedTwinsFraternal) {
      legItems.push({
        icon: `<line x1="1" y1="13" x2="6.5" y2="0" stroke="#111" stroke-width="1.2"/><line x1="12" y1="13" x2="6.5" y2="0" stroke="#111" stroke-width="1.2"/>`,
        label: 'Sinh đôi khác trứng',
      })
    }
    if (usedConsanguineous) {
      legItems.push({
        icon: `<line x1="0" y1="4.5" x2="13" y2="4.5" stroke="#111" stroke-width="1.2"/><line x1="0" y1="8.5" x2="13" y2="8.5" stroke="#111" stroke-width="1.2"/>`,
        label: 'Kết hôn cận huyết',
      })
    }

    if (legItems.length > 0) {
      const legX = 24
      const legY = layout.height + 14
      const legW = layout.width - 48

      let curX = legX + 12
      let curY = legY + 20
      let legSvg = ''

      legItems.forEach((item) => {
        const itemW = 18 + item.label.length * 7.5 + 16
        if (curX + itemW > legX + legW - 10) {
          curX = legX + 12
          curY += 22
        }

        legSvg += `<g transform="translate(${f1(curX)}, ${f1(curY - 10)})">${item.icon}</g>`
        legSvg += `<text x="${f1(curX + 18)}" y="${f1(curY)}" ${FAM} font-size="12" fill="#333">${esc(item.label)}</text>`
        curX += itemW
      })

      const legH = curY - legY + 14
      body += `<rect x="${f1(legX)}" y="${f1(legY)}" width="${f1(legW)}" height="${f1(legH)}" rx="4" fill="#fafafa" stroke="#d5d5d5" stroke-width="1"/>`
      body += legSvg
      totalHeight = legY + legH + 16
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(layout.width)}" height="${Math.round(totalHeight)}" viewBox="0 0 ${Math.round(layout.width)} ${Math.round(totalHeight)}">${desc}<rect width="100%" height="100%" fill="#fff"/>${body}</svg>`

  return errors.length
    ? { svg, width: Math.round(layout.width), height: Math.round(totalHeight), errors }
    : { svg, width: Math.round(layout.width), height: Math.round(totalHeight) }
}
