/**
 * Chuỗi và lưới thức ăn (Sinh học):
 * - Cú pháp theo dòng: "Cỏ -> Thỏ -> Cáo", "Cỏ -> Thỏ, Chuột", "Vi sinh vật: phân giải"
 * - Ẩn tên: "?A" hoặc "[A]" để làm đề thi
 * - Bậc dinh dưỡng tự tính: SV sản xuất bậc 1, bậc = 1 + max(thức ăn)
 * - Mũi tên chỉ chiều năng lượng; mũi tên dài vượt bậc uốn cong tránh đè nút khác
 */
import type { ToolImage } from './toolSpec'

export interface FoodWebSpec {
  /** mỗi dòng một chuỗi hoặc quan hệ; "Tên: phân giải" để chỉ định SV phân giải */
  text: string
  /** hướng bố cục: 'bottom-up' (bậc 1 ở dưới) hoặc 'left-right' (trái sang phải) */
  direction?: 'bottom-up' | 'left-right'
  /** kiểu nút: 'box' (khung bo góc) hoặc 'text' (chỉ chữ) */
  nodeStyle?: 'box' | 'text'
  /** hiện nhãn bậc dinh dưỡng bên lề ("SV sản xuất", "SV tiêu thụ bậc 1"...) */
  showLevels?: boolean
  /** nối mũi tên từ mọi loài tới sinh vật phân giải */
  connectDecomposers?: boolean
}

export interface FoodWebError {
  line: number
  msg: string
}

export interface WebNode {
  key: string
  name: string
  rawToken: string
  isPlaceholder: boolean
  placeholderLabel?: string
  isDecomposer: boolean
  level: number
  x: number
  y: number
  w: number
  h: number
}

export interface WebEdge {
  fromKey: string
  toKey: string
  line: number
  isCycle?: boolean
  isDecomposerEdge?: boolean
}

export interface ParsedFoodWeb {
  nodes: Map<string, WebNode>
  edges: WebEdge[]
  errors: FoodWebError[]
  hasCycle: boolean
  maxLevel: number
}

const FAM = `font-family="'Times New Roman',serif"`
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const f1 = (v: number) => String(Math.round(v * 10) / 10)

export const DEFAULT_FOODWEB_GRASSLAND: FoodWebSpec = {
  text: [
    'Cỏ -> Thỏ, Chuột, Châu chấu',
    'Thỏ -> Cáo',
    'Chuột -> Cáo, Rắn',
    'Châu chấu -> Ếch -> Rắn',
    'Rắn -> Đại bàng',
    'Cáo -> Đại bàng',
    'Vi sinh vật: phân giải',
  ].join('\n'),
  direction: 'bottom-up',
  nodeStyle: 'box',
  showLevels: true,
  connectDecomposers: true,
}

export const DEFAULT_FOODWEB_CHAIN: FoodWebSpec = {
  text: 'Cỏ -> Thỏ -> Cáo -> Vi sinh vật: phân giải',
  direction: 'left-right',
  nodeStyle: 'box',
  showLevels: true,
  connectDecomposers: true,
}

export const FOODWEB_HELP: Array<{ group: string; items: Array<{ code: string; what: string }> }> = [
  {
    group: 'Cú pháp cơ bản',
    items: [
      { code: 'Cỏ -> Thỏ -> Cáo', what: 'Chuỗi thức ăn: mũi tên chỉ chiều năng lượng' },
      { code: 'Cỏ -> Thỏ, Chuột, Châu chấu', what: 'Một loài bị nhiều loài ăn (dấu phẩy)' },
      { code: 'Thỏ, Chuột -> Cáo', what: 'Nhiều loài làm thức ăn cho một loài' },
      { code: 'Vi sinh vật: phân giải', what: 'Đặt riêng làm sinh vật phân giải' },
    ],
  },
  {
    group: 'Ẩn tên làm câu hỏi',
    items: [
      { code: '[A]  hoặc  ?A', what: 'Ô ẩn tên, hiện chữ A (dạng câu hỏi "A là loài nào")' },
      { code: 'Cỏ -> [A] -> [B] -> Cáo', what: 'Nối các ô ẩn vào lưới thức ăn' },
    ],
  },
  {
    group: 'Tuỳ chọn',
    items: [
      { code: 'Bậc dinh dưỡng', what: 'Bậc 1 dưới cùng (hoặc trái qua phải); tự tính bậc cao nhất' },
      { code: 'SV phân giải', what: 'Tách riêng bên phải/đáy, tuỳ chọn nối mũi tên từ mọi loài' },
    ],
  },
]

function normalizeKey(token: string): { key: string; name: string; isPlaceholder: boolean; label?: string } {
  const t = token.trim()
  if (t.startsWith('?') && t.length > 1) {
    const label = t.slice(1).trim()
    return { key: 'placeholder:' + label.toLowerCase(), name: label, isPlaceholder: true, label }
  }
  if (t.startsWith('[') && t.endsWith(']') && t.length > 2) {
    const label = t.slice(1, -1).trim()
    return { key: 'placeholder:' + label.toLowerCase(), name: label, isPlaceholder: true, label }
  }
  const clean = t.replace(/\s+/g, ' ')
  return { key: clean.toLowerCase(), name: clean, isPlaceholder: false }
}

export function parseFoodWeb(text: string): ParsedFoodWeb {
  const lines = text.split('\n')
  const nodeMap = new Map<string, WebNode>()
  const edges: WebEdge[] = []
  const errors: FoodWebError[] = []

  const ensureNode = (raw: string, isDecomposer = false): WebNode => {
    const { key, name, isPlaceholder, label } = normalizeKey(raw)
    let node = nodeMap.get(key)
    if (!node) {
      node = {
        key,
        name,
        rawToken: raw.trim(),
        isPlaceholder,
        placeholderLabel: label,
        isDecomposer,
        level: 1,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
      }
      nodeMap.set(key, node)
    } else if (isDecomposer) {
      node.isDecomposer = true
    }
    return node
  }

  lines.forEach((lineRaw, idx) => {
    const ln = idx + 1
    const line = lineRaw.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) return

    // 1. Kiểm tra khai báo nhóm / vai trò: "Tên loài: phân giải"
    const roleMatch = line.match(/^([^:->→]+?)\s*:\s*(phân giải|sv\s*phân giải|sinh vật\s*phân giải|decomposer)\s*$/i)
    if (roleMatch) {
      ensureNode(roleMatch[1], true)
      return
    }

    // 2. Mũi tên: ->, -->, →
    if (/->|-->|→/.test(line)) {
      const parts = line.split(/\s*(?:-->|->|→)\s*/)
      let hasEmpty = false
      for (const p of parts) {
        if (!p.trim()) hasEmpty = true
      }
      if (hasEmpty || parts.length < 2) {
        errors.push({ line: ln, msg: 'Mũi tên thiếu loài trước hoặc sau "->"' })
        return
      }

      for (let i = 0; i < parts.length - 1; i++) {
        const srcParts = parts[i].split(',').map((s) => s.trim()).filter(Boolean)
        const tgtParts = parts[i + 1].split(',').map((s) => s.trim()).filter(Boolean)
        if (!srcParts.length || !tgtParts.length) {
          errors.push({ line: ln, msg: 'Mũi tên thiếu loài trước hoặc sau "->"' })
          continue
        }
        for (const sRaw of srcParts) {
          // kiểm tra xem có gắn nhãn ": phân giải" ở đuôi không
          const sDecomp = /:\s*(phân giải|sv\s*phân giải|decomposer)/i.test(sRaw)
          const sClean = sRaw.replace(/:\s*(phân giải|sv\s*phân giải|decomposer)/i, '').trim()
          const sNode = ensureNode(sClean, sDecomp)

          for (const tRaw of tgtParts) {
            const tDecomp = /:\s*(phân giải|sv\s*phân giải|decomposer)/i.test(tRaw)
            const tClean = tRaw.replace(/:\s*(phân giải|sv\s*phân giải|decomposer)/i, '').trim()
            const tNode = ensureNode(tClean, tDecomp)

            if (sNode.key === tNode.key) {
              errors.push({ line: ln, msg: `Loài "${sNode.name}" tự ăn chính nó` })
            } else {
              edges.push({
                fromKey: sNode.key,
                toKey: tNode.key,
                line: ln,
              })
            }
          }
        }
      }
      return
    }

    // 3. Dòng chỉ có danh sách loài đơn lẻ không có mũi tên
    const singleItems = line.split(',').map((s) => s.trim()).filter(Boolean)
    if (singleItems.length) {
      for (const item of singleItems) {
        ensureNode(item, false)
      }
    } else {
      errors.push({ line: ln, msg: 'Dòng không đúng cú pháp (cần "Loài A -> Loài B" hoặc "Loài: phân giải")' })
    }
  })

  // Phát hiện chu trình (vòng lặp dinh dưỡng) trong các loài không phải phân giải
  const adj = new Map<string, string[]>()
  for (const [k, n] of nodeMap) {
    if (!n.isDecomposer) adj.set(k, [])
  }
  for (const e of edges) {
    const fromNode = nodeMap.get(e.fromKey)
    const toNode = nodeMap.get(e.toKey)
    if (fromNode && toNode && !fromNode.isDecomposer && !toNode.isDecomposer) {
      adj.get(e.fromKey)?.push(e.toKey)
    }
  }

  const visitedState = new Map<string, number>() // 0: unvisited, 1: visiting, 2: visited
  const cycleEdges = new Set<string>()
  const cyclePath: string[] = []
  let hasCycle = false

  function dfsCycle(u: string): boolean {
    visitedState.set(u, 1)
    cyclePath.push(u)
    const neighbors = adj.get(u) ?? []
    for (const v of neighbors) {
      const state = visitedState.get(v) ?? 0
      if (state === 1) {
        hasCycle = true
        cycleEdges.add(`${u}->${v}`)
        const cycleStartIndex = cyclePath.indexOf(v)
        const loopNodes = [...cyclePath.slice(cycleStartIndex), v].map((k) => nodeMap.get(k)?.name ?? k)
        const edgeObj = edges.find((e) => e.fromKey === u && e.toKey === v)
        errors.push({
          line: edgeObj?.line ?? 1,
          msg: `Phát hiện vòng lặp dinh dưỡng: ${loopNodes.join(' → ')} (lưới thức ăn không nên có chu trình)`,
        })
      } else if (state === 0) {
        dfsCycle(v)
      }
    }
    cyclePath.pop()
    visitedState.set(u, 2)
    return false
  }

  for (const k of adj.keys()) {
    if ((visitedState.get(k) ?? 0) === 0) {
      dfsCycle(k)
    }
  }

  // Đánh dấu isCycle cho các cạnh gây chu trình
  for (const e of edges) {
    if (cycleEdges.has(`${e.fromKey}->${e.toKey}`)) {
      e.isCycle = true
    }
  }

  // Tính bậc dinh dưỡng cho từng loài (bậc = 1 + max bậc của thức ăn)
  // Sinh vật sản xuất (không ăn loài nào) có bậc 1
  const incoming = new Map<string, string[]>()
  for (const [k, n] of nodeMap) {
    if (!n.isDecomposer) incoming.set(k, [])
  }
  for (const e of edges) {
    if (!e.isCycle && incoming.has(e.toKey)) {
      const fromNode = nodeMap.get(e.fromKey)
      if (fromNode && !fromNode.isDecomposer) {
        incoming.get(e.toKey)?.push(e.fromKey)
      }
    }
  }

  const computedLevels = new Map<string, number>()
  function getLevel(key: string, stack = new Set<string>()): number {
    if (computedLevels.has(key)) return computedLevels.get(key)!
    if (stack.has(key)) return 1
    stack.add(key)
    const foods = incoming.get(key) ?? []
    if (foods.length === 0) {
      computedLevels.set(key, 1)
      return 1
    }
    let maxFood = 1
    for (const f of foods) {
      const lv = getLevel(f, new Set(stack))
      if (lv > maxFood) maxFood = lv
    }
    const myLevel = maxFood + 1
    computedLevels.set(key, myLevel)
    return myLevel
  }

  let maxLevel = 1
  for (const [k, n] of nodeMap) {
    if (!n.isDecomposer) {
      n.level = getLevel(k)
      if (n.level > maxLevel) maxLevel = n.level
    }
  }

  return { nodes: nodeMap, edges, errors, hasCycle, maxLevel }
}

/**
 * Heuristic Barycenter: sắp xếp thứ tự các nút trong từng hàng để giảm thiểu giao cắt mũi tên
 */
function barycenterOrdering(layers: Map<number, WebNode[]>, edges: WebEdge[], maxLevel: number) {
  // Bản đồ vị trí chỉ số hiện tại
  const posMap = new Map<string, number>()
  for (let l = 1; l <= maxLevel; l++) {
    const list = layers.get(l) ?? []
    list.forEach((n, idx) => posMap.set(n.key, idx))
  }

  // 3 vòng quét lên và xuống
  for (let iter = 0; iter < 3; iter++) {
    // Quét lên: từ bậc 2 đến maxLevel
    for (let l = 2; l <= maxLevel; l++) {
      const list = layers.get(l) ?? []
      const bary = new Map<string, number>()
      for (const n of list) {
        // Tìm các thức ăn ở bậc thấp hơn
        const foodEdges = edges.filter((e) => e.toKey === n.key && !e.isCycle)
        if (foodEdges.length > 0) {
          let sum = 0
          for (const fe of foodEdges) sum += posMap.get(fe.fromKey) ?? 0
          bary.set(n.key, sum / foodEdges.length)
        } else {
          bary.set(n.key, posMap.get(n.key) ?? 0)
        }
      }
      list.sort((a, b) => (bary.get(a.key) ?? 0) - (bary.get(b.key) ?? 0))
      list.forEach((n, idx) => posMap.set(n.key, idx))
    }

    // Quét xuống: từ maxLevel - 1 về 1
    for (let l = maxLevel - 1; l >= 1; l--) {
      const list = layers.get(l) ?? []
      const bary = new Map<string, number>()
      for (const n of list) {
        // Tìm các loài ăn ở bậc cao hơn
        const predatorEdges = edges.filter((e) => e.fromKey === n.key && !e.isCycle)
        if (predatorEdges.length > 0) {
          let sum = 0
          for (const pe of predatorEdges) sum += posMap.get(pe.toKey) ?? 0
          bary.set(n.key, sum / predatorEdges.length)
        } else {
          bary.set(n.key, posMap.get(n.key) ?? 0)
        }
      }
      list.sort((a, b) => (bary.get(a.key) ?? 0) - (bary.get(b.key) ?? 0))
      list.forEach((n, idx) => posMap.set(n.key, idx))
    }
  }
}

/** Tên nhãn bậc dinh dưỡng theo SGK Sinh học */
export function levelLabelName(level: number): string {
  if (level === 1) return 'SV sản xuất'
  if (level === 2) return 'SV tiêu thụ bậc 1'
  if (level === 3) return 'SV tiêu thụ bậc 2'
  if (level === 4) return 'SV tiêu thụ bậc 3'
  return `SV tiêu thụ bậc ${level - 1}`
}

/**
 * Kiểm tra xem một đoạn thẳng nối p1 và p2 có cắt qua hình chữ nhật box không
 */
function lineIntersectsBox(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  box: { x0: number; y0: number; x1: number; y1: number },
): boolean {
  // Nằm hoàn toàn về một phía
  if (Math.max(p1.x, p2.x) < box.x0 || Math.min(p1.x, p2.x) > box.x1) return false
  if (Math.max(p1.y, p2.y) < box.y0 || Math.min(p1.y, p2.y) > box.y1) return false

  // Kiểm tra điểm nằm trong box
  if (p1.x >= box.x0 && p1.x <= box.x1 && p1.y >= box.y0 && p1.y <= box.y1) return true
  if (p2.x >= box.x0 && p2.x <= box.x1 && p2.y >= box.y0 && p2.y <= box.y1) return true

  // Giao điểm với 4 cạnh
  const edges = [
    [{ x: box.x0, y: box.y0 }, { x: box.x1, y: box.y0 }],
    [{ x: box.x1, y: box.y0 }, { x: box.x1, y: box.y1 }],
    [{ x: box.x1, y: box.y1 }, { x: box.x0, y: box.y1 }],
    [{ x: box.x0, y: box.y1 }, { x: box.x0, y: box.y0 }],
  ]
  const ccw = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) =>
    (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x)
  const intersect = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) =>
    ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d)

  return edges.some(([ea, eb]) => intersect(p1, p2, ea, eb))
}

/**
 * Kiểm tra xem đường cong bậc ba có cắt qua box hay không (lấy mẫu 10 điểm)
 */
function bezierIntersectsBox(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  box: { x0: number; y0: number; x1: number; y1: number },
): boolean {
  for (let t = 0.1; t <= 0.9; t += 0.1) {
    const mt = 1 - t
    const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x
    const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y
    if (x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1) return true
  }
  return false
}

export function renderFoodWebSvg(spec: FoodWebSpec, desc: string): ToolImage {
  const { text = '', direction = 'bottom-up', nodeStyle = 'box', showLevels = false, connectDecomposers = true } = spec

  const parsed = parseFoodWeb(text)
  const { nodes, edges, errors, maxLevel } = parsed

  if (nodes.size === 0) {
    throw new Error('Chưa có loài nào. Hãy gõ vd: "Cỏ -> Thỏ -> Cáo"')
  }

  // Tách loài phân giải và loài dinh dưỡng
  const decomposers: WebNode[] = []
  const trophicNodes: WebNode[] = []
  for (const n of nodes.values()) {
    if (n.isDecomposer) decomposers.push(n)
    else trophicNodes.push(n)
  }

  // Kích thước các nút
  for (const n of nodes.values()) {
    if (n.isPlaceholder) {
      n.w = 46
      n.h = 32
    } else {
      const charW = 8.5
      const textW = Math.max(34, n.name.length * charW)
      n.w = Math.max(68, Math.round(textW + 22))
      n.h = 32
    }
  }

  // Phân chia theo bậc
  const layers = new Map<number, WebNode[]>()
  for (let l = 1; l <= maxLevel; l++) layers.set(l, [])
  for (const n of trophicNodes) {
    layers.get(n.level)?.push(n)
  }

  // Sắp xếp thứ tự trong hàng để tối ưu giao cắt
  barycenterOrdering(layers, edges, maxLevel)

  const isBottomUp = direction === 'bottom-up'
  const leftLabelMargin = showLevels ? 120 : 25
  const rightDecompMargin = decomposers.length > 0 ? 120 : 25
  const topMargin = 30
  const bottomMargin = showLevels && !isBottomUp ? 45 : 30

  let canvasW = 400

  // Tính toạ độ
  if (isBottomUp) {
    // Bậc 1 dưới cùng, bậc cao nhất ở trên
    const rowGap = 72
    const totalRowH = (maxLevel - 1) * rowGap
    const H = topMargin + totalRowH + bottomMargin

    // Tính bề rộng cần thiết của phần lưới dinh dưỡng
    let maxLayerW = 280
    for (let l = 1; l <= maxLevel; l++) {
      const list = layers.get(l) ?? []
      const wSum = list.reduce((acc, cur) => acc + cur.w, 0)
      const gapSum = Math.max(0, list.length - 1) * 26
      if (wSum + gapSum > maxLayerW) maxLayerW = wSum + gapSum
    }
    const trophicW = Math.max(320, maxLayerW + 30)
    canvasW = leftLabelMargin + trophicW + rightDecompMargin

    // Gán toạ độ x, y
    for (let l = 1; l <= maxLevel; l++) {
      const list = layers.get(l) ?? []
      const y = H - bottomMargin - (l - 1) * rowGap
      const totalW = list.reduce((acc, cur) => acc + cur.w, 0)
      const availableSpace = trophicW - totalW
      const gap = list.length > 1 ? availableSpace / (list.length + 1) : availableSpace / 2

      let curX = leftLabelMargin + (list.length > 1 ? gap : gap)
      list.forEach((n) => {
        n.x = Math.round(curX + n.w / 2)
        n.y = y
        curX += n.w + (list.length > 1 ? gap : 0)
      })
    }

    // Gán toạ độ sinh vật phân giải (bên phải, canh giữa dọc)
    if (decomposers.length > 0) {
      const decX = leftLabelMargin + trophicW + 55
      const decSpacing = 50
      const startDecY = H / 2 - ((decomposers.length - 1) * decSpacing) / 2
      decomposers.forEach((dn, idx) => {
        dn.x = decX
        dn.y = Math.round(startDecY + idx * decSpacing)
      })
    }
  } else {
    // Trái sang phải (left-right): Bậc 1 bên trái, sang phải
    const colGap = 110
    const totalColW = (maxLevel - 1) * colGap

    let maxNodesInCol = 1
    for (let l = 1; l <= maxLevel; l++) {
      const list = layers.get(l) ?? []
      if (list.length > maxNodesInCol) maxNodesInCol = list.length
    }
    const nodeRowH = 50
    const trophicH = Math.max(160, maxNodesInCol * nodeRowH)
    const H = topMargin + trophicH + bottomMargin + (decomposers.length > 0 ? 55 : 0)
    canvasW = leftLabelMargin + totalColW + rightDecompMargin

    for (let l = 1; l <= maxLevel; l++) {
      const list = layers.get(l) ?? []
      const x = leftLabelMargin + (l - 1) * colGap + 40
      const totalH = list.length * 32
      const gap = list.length > 1 ? (trophicH - totalH) / (list.length - 1) : 0
      const startY = topMargin + (trophicH - totalH - (list.length - 1) * gap) / 2 + 16

      list.forEach((n, idx) => {
        n.x = x
        n.y = Math.round(startY + idx * (32 + gap))
      })
    }

    // Sinh vật phân giải ở cạnh đáy
    if (decomposers.length > 0) {
      const decY = H - 26
      const decSpacing = 110
      const startDecX = canvasW / 2 - ((decomposers.length - 1) * decSpacing) / 2
      decomposers.forEach((dn, idx) => {
        dn.x = Math.round(startDecX + idx * decSpacing)
        dn.y = decY
      })
    }
  }

  // Tính W, H tối thiểu
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  for (const n of nodes.values()) {
    if (n.x - n.w / 2 < minX) minX = n.x - n.w / 2
    if (n.x + n.w / 2 > maxX) maxX = n.x + n.w / 2
    if (n.y - n.h / 2 < minY) minY = n.y - n.h / 2
    if (n.y + n.h / 2 > maxY) maxY = n.y + n.h / 2
  }
  const svgW = Math.max(canvasW, Math.round(maxX + (decomposers.length > 0 ? 30 : 40)))
  const svgH = Math.max(180, Math.round(maxY + 35))

  // Danh sách hộp để kiểm tra va chạm mũi tên
  const boxes = new Map<string, { x0: number; y0: number; x1: number; y1: number }>()
  for (const n of nodes.values()) {
    boxes.set(n.key, {
      x0: n.x - n.w / 2 - 4,
      y0: n.y - n.h / 2 - 4,
      x1: n.x + n.w / 2 + 4,
      y1: n.y + n.h / 2 + 4,
    })
  }

  // Khởi tạo nội dung SVG
  let out = ''

  // Marker đầu mũi tên
  out += `<defs>
    <marker id="foodweb-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e293b"/>
    </marker>
    <marker id="foodweb-cycle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#e11d48"/>
    </marker>
    <marker id="foodweb-dec-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b"/>
    </marker>
  </defs>`

  // Nhãn bậc dinh dưỡng
  if (showLevels) {
    if (isBottomUp) {
      for (let l = 1; l <= maxLevel; l++) {
        const list = layers.get(l) ?? []
        if (!list.length) continue
        const y = list[0].y
        const lbl = levelLabelName(l)
        // Đường dóng ngang nét đứt mờ
        out += `<line x1="${leftLabelMargin - 10}" y1="${f1(y)}" x2="${svgW - 20}" y2="${f1(y)}" stroke="#f1f5f9" stroke-dasharray="3,3" stroke-width="1"/>`
        out += `<text x="${leftLabelMargin - 14}" y="${f1(y + 4)}" ${FAM} font-size="12.5" font-style="italic" fill="#475569" text-anchor="end">${esc(lbl)}</text>`
      }
    } else {
      for (let l = 1; l <= maxLevel; l++) {
        const list = layers.get(l) ?? []
        if (!list.length) continue
        const x = list[0].x
        const lbl = levelLabelName(l)
        out += `<text x="${f1(x)}" y="${svgH - 12}" ${FAM} font-size="12" font-style="italic" fill="#475569" text-anchor="middle">${esc(lbl)}</text>`
      }
    }
  }

  // Vẽ các mũi tên giữa các loài dinh dưỡng
  // Gom các cặp nối (tránh vẽ trùng)
  const drawnEdges = new Set<string>()

  for (const e of edges) {
    const edgeKey = `${e.fromKey}->${e.toKey}`
    if (drawnEdges.has(edgeKey)) continue
    drawnEdges.add(edgeKey)

    const u = nodes.get(e.fromKey)
    const v = nodes.get(e.toKey)
    if (!u || !v) continue

    // Nối đến sinh vật phân giải xử lí riêng
    if (v.isDecomposer) continue

    const levelDiff = Math.abs(v.level - u.level)
    const isCycle = e.isCycle
    const strokeColor = isCycle ? '#e11d48' : '#1e293b'
    const markerId = isCycle ? 'foodweb-cycle-arrow' : 'foodweb-arrow'

    if (isBottomUp) {
      // u ở dưới (y lớn), v ở trên (y nhỏ)
      const pStart = { x: u.x, y: u.y - u.h / 2 }
      const pEnd = { x: v.x, y: v.y + v.h / 2 }

      // Kiểm tra xem đoạn thẳng có va chạm nút khác không hoặc vượt bậc >= 2
      let needsCurve = levelDiff >= 2
      if (!needsCurve) {
        for (const [k, box] of boxes) {
          if (k !== u.key && k !== v.key && lineIntersectsBox(pStart, pEnd, box)) {
            needsCurve = true
            break
          }
        }
      }

      if (!needsCurve) {
        // Đường thẳng trực tiếp
        out += `<line x1="${f1(pStart.x)}" y1="${f1(pStart.y)}" x2="${f1(pEnd.x)}" y2="${f1(pEnd.y)}" stroke="${strokeColor}" stroke-width="1.3" marker-end="url(#${markerId})"/>`
      } else {
        // Đường cong né nút: tìm độ uốn né hoàn toàn các nút khác
        const midX = (u.x + v.x) / 2
        const centerCanvasX = (leftLabelMargin + svgW - rightDecompMargin) / 2
        const baseBendDir = midX <= centerCanvasX ? -1 : 1

        const candidateOffsets = [
          38 * baseBendDir,
          -38 * baseBendDir,
          56 * baseBendDir,
          -56 * baseBendDir,
          76 * baseBendDir,
          -76 * baseBendDir,
        ]

        let cp1 = { x: pStart.x + candidateOffsets[0], y: pStart.y - 25 }
        let cp2 = { x: pEnd.x + candidateOffsets[0], y: pEnd.y + 25 }

        for (const off of candidateOffsets) {
          const testCp1 = { x: pStart.x + off, y: pStart.y - 25 }
          const testCp2 = { x: pEnd.x + off, y: pEnd.y + 25 }
          let collides = false
          for (const [k, box] of boxes) {
            if (k !== u.key && k !== v.key && bezierIntersectsBox(pStart, testCp1, testCp2, pEnd, box)) {
              collides = true
              break
            }
          }
          if (!collides) {
            cp1 = testCp1
            cp2 = testCp2
            break
          }
        }

        out += `<path d="M ${f1(pStart.x)} ${f1(pStart.y)} C ${f1(cp1.x)} ${f1(cp1.y)}, ${f1(cp2.x)} ${f1(cp2.y)}, ${f1(pEnd.x)} ${f1(pEnd.y)}" fill="none" stroke="${strokeColor}" stroke-width="1.3" stroke-dasharray="${isCycle ? '4,3' : 'none'}" marker-end="url(#${markerId})"/>`
      }
    } else {
      // Trái sang phải: u ở bên trái (x nhỏ), v ở bên phải (x lớn)
      const pStart = { x: u.x + u.w / 2, y: u.y }
      const pEnd = { x: v.x - v.w / 2, y: v.y }

      let needsCurve = levelDiff >= 2
      if (!needsCurve) {
        for (const [k, box] of boxes) {
          if (k !== u.key && k !== v.key && lineIntersectsBox(pStart, pEnd, box)) {
            needsCurve = true
            break
          }
        }
      }

      if (!needsCurve) {
        out += `<line x1="${f1(pStart.x)}" y1="${f1(pStart.y)}" x2="${f1(pEnd.x)}" y2="${f1(pEnd.y)}" stroke="${strokeColor}" stroke-width="1.3" marker-end="url(#${markerId})"/>`
      } else {
        const baseBendDir = pStart.y <= pEnd.y ? -1 : 1
        const candidateOffsets = [
          35 * baseBendDir,
          -35 * baseBendDir,
          50 * baseBendDir,
          -50 * baseBendDir,
          70 * baseBendDir,
          -70 * baseBendDir,
        ]

        let cp1 = { x: pStart.x + 25, y: pStart.y + candidateOffsets[0] }
        let cp2 = { x: pEnd.x - 25, y: pEnd.y + candidateOffsets[0] }

        for (const off of candidateOffsets) {
          const testCp1 = { x: pStart.x + 25, y: pStart.y + off }
          const testCp2 = { x: pEnd.x - 25, y: pEnd.y + off }
          let collides = false
          for (const [k, box] of boxes) {
            if (k !== u.key && k !== v.key && bezierIntersectsBox(pStart, testCp1, testCp2, pEnd, box)) {
              collides = true
              break
            }
          }
          if (!collides) {
            cp1 = testCp1
            cp2 = testCp2
            break
          }
        }

        out += `<path d="M ${f1(pStart.x)} ${f1(pStart.y)} C ${f1(cp1.x)} ${f1(cp1.y)}, ${f1(cp2.x)} ${f1(cp2.y)}, ${f1(pEnd.x)} ${f1(pEnd.y)}" fill="none" stroke="${strokeColor}" stroke-width="1.3" stroke-dasharray="${isCycle ? '4,3' : 'none'}" marker-end="url(#${markerId})"/>`
      }
    }
  }

  // Mũi tên đến Sinh vật phân giải
  if (decomposers.length > 0) {
    const dec = decomposers[0] // Sinh vật phân giải chính
    // Nếu connectDecomposers=true thì nối từ mọi loài dinh dưỡng; nếu không chỉ nối loài có cạnh chỉ định
    const targets = connectDecomposers ? trophicNodes : edges.filter((e) => e.toKey === dec.key).map((e) => nodes.get(e.fromKey)!).filter(Boolean)

    for (const src of targets) {
      if (src.key === dec.key) continue
      if (isBottomUp) {
        // Nối từ cạnh phải hoặc đỉnh của src sang mép trái của dec
        const pStart = { x: src.x + src.w / 2, y: src.y }
        const pEnd = { x: dec.x - dec.w / 2, y: dec.y }
        const dx = Math.max(20, (pEnd.x - pStart.x) * 0.4)
        out += `<path d="M ${f1(pStart.x)} ${f1(pStart.y)} C ${f1(pStart.x + dx)} ${f1(pStart.y)}, ${f1(pEnd.x - dx)} ${f1(pEnd.y)}, ${f1(pEnd.x)} ${f1(pEnd.y)}" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#foodweb-dec-arrow)"/>`
      } else {
        const pStart = { x: src.x, y: src.y + src.h / 2 }
        const pEnd = { x: dec.x, y: dec.y - dec.h / 2 }
        out += `<path d="M ${f1(pStart.x)} ${f1(pStart.y)} Q ${f1((pStart.x + pEnd.x) / 2)} ${f1(pEnd.y - 15)} ${f1(pEnd.x)} ${f1(pEnd.y)}" fill="none" stroke="#64748b" stroke-width="1" stroke-dasharray="3,3" marker-end="url(#foodweb-dec-arrow)"/>`
      }
    }
  }

  // Vẽ các nút
  for (const n of nodes.values()) {
    const rx = 6
    const x0 = n.x - n.w / 2
    const y0 = n.y - n.h / 2

    if (nodeStyle === 'box') {
      if (n.isPlaceholder) {
        // Ô ẩn tên làm câu hỏi thi
        out += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${n.w}" height="${n.h}" rx="${rx}" fill="#f8fafc" stroke="#0f172a" stroke-width="1.6"/>`
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 5)}" ${FAM} font-size="15" font-weight="bold" font-style="italic" fill="#0f172a" text-anchor="middle">${esc(n.name)}</text>`
      } else if (n.isDecomposer) {
        // Sinh vật phân giải: khung viền đứt nét hoặc nhạt hơn
        out += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${n.w}" height="${n.h}" rx="${rx}" fill="#f1f5f9" stroke="#64748b" stroke-width="1.3" stroke-dasharray="4,2"/>`
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 5)}" ${FAM} font-size="14" font-weight="500" fill="#334155" text-anchor="middle">${esc(n.name)}</text>`
      } else {
        // Nút loài thông thường
        out += `<rect x="${f1(x0)}" y="${f1(y0)}" width="${n.w}" height="${n.h}" rx="${rx}" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>`
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 4.5)}" ${FAM} font-size="14" fill="#0f172a" text-anchor="middle">${esc(n.name)}</text>`
      }
    } else {
      // Kiểu chỉ chữ
      if (n.isPlaceholder) {
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 5)}" ${FAM} font-size="16" font-weight="bold" font-style="italic" fill="#0f172a" text-anchor="middle">[${esc(n.name)}]</text>`
      } else if (n.isDecomposer) {
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 5)}" ${FAM} font-size="14" font-style="italic" fill="#64748b" text-anchor="middle">${esc(n.name)}</text>`
      } else {
        out += `<text x="${f1(n.x)}" y="${f1(n.y + 5)}" ${FAM} font-size="15" fill="#0f172a" text-anchor="middle">${esc(n.name)}</text>`
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">${desc}<rect width="100%" height="100%" fill="#fff"/>${out}</svg>`

  return errors.length ? { svg, width: svgW, height: svgH, errors } : { svg, width: svgW, height: svgH }
}
