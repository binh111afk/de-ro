/**
 * Thư viện hình khối dựng sẵn (OOXML `prstGeom`) cho trình soạn slide: nhóm + tên tiếng Việt cho thư viện hình,
 * và hàm vẽ hình thành đường SVG. Hình học lấy từ `vendor/presetGeometry.ts` (GenOffice, Apache-2.0).
 *
 * `SlideElement.shape` giữ nguyên 7 tên cũ (rect, round, ellipse, triangle, arrow, star, heart) để deck cũ đọc được;
 * mọi hình khác lưu thẳng tên prst (vd. `hexagon`, `flowChartDecision`) và vẽ bằng SVG ở đây.
 */
import { connectorBezier, connectorPoints, isConnectorPreset, isPillPreset, presetPath, presetPolygon } from './vendor/presetGeometry'

/** Tên cũ ↔ prst; các tên này vẫn vẽ bằng CSS như trước (giữ bo góc theo bộ màu…). */
const LEGACY_TO_PRST: Record<string, string> = {
  rect: 'rect',
  round: 'roundRect',
  ellipse: 'ellipse',
  triangle: 'triangle',
  arrow: 'rightArrow',
  star: 'star5',
  heart: 'heart',
}
const PRST_TO_LEGACY = Object.fromEntries(Object.entries(LEGACY_TO_PRST).map(([legacy, prst]) => [prst, legacy]))

/** Tên lưu trong `SlideElement.shape` ứng với một prst của thư viện. */
export const shapeNameOf = (prst: string): string => PRST_TO_LEGACY[prst] ?? prst
/** prst OOXML ứng với `SlideElement.shape` (để vẽ và xuất PPTX). */
export const prstOf = (shape: string | undefined): string => LEGACY_TO_PRST[shape ?? 'rect'] ?? shape ?? 'rect'

/** Hình được vẽ bằng SVG ở đây (không phải 7 hình cũ hay đường thẳng của app). */
export const isPresetShape = (shape: string | undefined): boolean => !!shape && shape !== 'line' && !(shape in LEGACY_TO_PRST)

/** Đường nối gấp khúc/cong chỉ có nét, không có nền. */
export const isStrokeOnlyShape = (shape: string | undefined): boolean => isConnectorPreset(prstOf(shape))

type Group = { group: string; shapes: Array<{ prst: string; label: string }> }
const g = (group: string, items: Record<string, string>): Group => ({
  group,
  shapes: Object.entries(items).map(([prst, label]) => ({ prst, label })),
})

export const PRESET_GROUPS: Group[] = [
  g('Đường', {
    line: 'Đường thẳng',
    lineArrow: 'Đường mũi tên',
    lineArrowDouble: 'Mũi tên hai đầu',
    bentConnector3: 'Đường gấp khúc',
    curvedConnector3: 'Đường cong',
  }),
  g('Hình chữ nhật', {
    rect: 'Chữ nhật',
    roundRect: 'Bo góc',
    snip1Rect: 'Cắt một góc',
    snip2SameRect: 'Cắt hai góc cùng cạnh',
    snip2DiagRect: 'Cắt hai góc chéo',
    snipRoundRect: 'Cắt và bo góc',
    round1Rect: 'Bo một góc',
    round2SameRect: 'Bo hai góc cùng cạnh',
    round2DiagRect: 'Bo hai góc chéo',
  }),
  g('Hình cơ bản', {
    ellipse: 'Hình tròn',
    triangle: 'Tam giác cân',
    rtTriangle: 'Tam giác vuông',
    parallelogram: 'Hình bình hành',
    trapezoid: 'Hình thang',
    diamond: 'Hình thoi',
    pentagon: 'Ngũ giác',
    hexagon: 'Lục giác',
    octagon: 'Bát giác',
    plus: 'Chữ thập',
    mathPlus: 'Dấu cộng',
    pie: 'Hình quạt',
    chord: 'Dây cung',
    teardrop: 'Giọt nước',
    frame: 'Khung',
    halfFrame: 'Nửa khung',
    corner: 'Góc vuông',
    diagStripe: 'Sọc chéo',
    donut: 'Vòng tròn',
    noSmoking: 'Biển cấm',
    blockArc: 'Cung dày',
    foldedCorner: 'Gấp góc',
    bevel: 'Vát cạnh',
    cube: 'Khối lập phương',
    can: 'Hình trụ',
    lightningBolt: 'Tia chớp',
    heart: 'Trái tim',
    sun: 'Mặt trời',
    moon: 'Mặt trăng',
    cloud: 'Đám mây',
    arc: 'Cung',
    plaque: 'Tấm bảng',
    smileyFace: 'Mặt cười',
    leftBracket: 'Ngoặc vuông trái',
    rightBracket: 'Ngoặc vuông phải',
    leftBrace: 'Ngoặc nhọn trái',
    rightBrace: 'Ngoặc nhọn phải',
  }),
  g('Mũi tên', {
    rightArrow: 'Mũi tên phải',
    leftArrow: 'Mũi tên trái',
    upArrow: 'Mũi tên lên',
    downArrow: 'Mũi tên xuống',
    leftRightArrow: 'Hai chiều ngang',
    upDownArrow: 'Hai chiều dọc',
    quadArrow: 'Bốn hướng',
    bentArrow: 'Mũi tên gấp',
    uturnArrow: 'Mũi tên quay đầu',
    curvedRightArrow: 'Mũi tên cong',
    stripedRightArrow: 'Mũi tên sọc',
    notchedRightArrow: 'Mũi tên khía',
    chevron: 'Chevron',
    homePlate: 'Ngũ giác mũi tên',
  }),
  g('Sao và băng rôn', {
    star4: 'Sao 4 cánh',
    star5: 'Sao 5 cánh',
    star6: 'Sao 6 cánh',
    star7: 'Sao 7 cánh',
    star8: 'Sao 8 cánh',
    star10: 'Sao 10 cánh',
    star12: 'Sao 12 cánh',
    star16: 'Sao 16 cánh',
    star24: 'Sao 24 cánh',
    star32: 'Sao 32 cánh',
    irregularSeal1: 'Vụ nổ 1',
    irregularSeal2: 'Vụ nổ 2',
    ribbon: 'Dải ruy băng',
    ribbon2: 'Dải ruy băng ngược',
    wave: 'Lượn sóng',
    doubleWave: 'Sóng đôi',
  }),
  g('Sơ đồ khối', {
    flowChartProcess: 'Quy trình',
    flowChartAlternateProcess: 'Quy trình thay thế',
    flowChartDecision: 'Quyết định',
    flowChartPredefinedProcess: 'Quy trình định sẵn',
    flowChartInternalStorage: 'Lưu trữ trong',
    flowChartDocument: 'Tài liệu',
    flowChartMultidocument: 'Nhiều tài liệu',
    flowChartTerminator: 'Bắt đầu / Kết thúc',
    flowChartPreparation: 'Chuẩn bị',
    flowChartManualInput: 'Nhập tay',
    flowChartManualOperation: 'Thao tác tay',
    flowChartConnector: 'Điểm nối',
    flowChartOffpageConnector: 'Nối sang trang',
    flowChartMagneticDisk: 'Cơ sở dữ liệu',
    flowChartMagneticDrum: 'Lưu trữ trực tiếp',
    flowChartDisplay: 'Hiển thị',
    flowChartDelay: 'Trì hoãn',
    flowChartOr: 'Hoặc',
    flowChartCollate: 'Đối chiếu',
    flowChartSort: 'Sắp xếp',
    flowChartExtract: 'Trích xuất',
    flowChartMerge: 'Hợp nhất',
    flowChartSummingJunction: 'Điểm tổng',
    flowChartPunchedTape: 'Băng đục lỗ',
  }),
  g('Chú thích', {
    wedgeRectCallout: 'Chú thích chữ nhật',
    wedgeRoundRectCallout: 'Chú thích bo góc',
    wedgeEllipseCallout: 'Chú thích hình tròn',
    cloudCallout: 'Chú thích đám mây',
  }),
]

export const PRESET_COUNT = PRESET_GROUPS.reduce((n, grp) => n + grp.shapes.length, 0)

/** Hình dài (mũi tên ngang, băng rôn, sơ đồ khối, chú thích…) chèn vào hộp ngang; còn lại hộp vuông. */
const WIDE = /Arrow$|^chevron$|^homePlate$|^ribbon|^wave|^doubleWave|^flowChart(Process|AlternateProcess|PredefinedProcess|Document|Multidocument|Terminator|ManualInput|Display|Delay|PunchedTape|Preparation|InternalStorage)|Callout$|^(rect|roundRect|snip|round[12])|^(parallelogram|trapezoid|plaque|frame|bevel|foldedCorner|Connector)/
export const defaultBox = (prst: string): { w: number; h: number } =>
  WIDE.test(prst) || isConnectorPreset(prst) ? { w: 34, h: 28 } : { w: 22, h: 39.1 }

/** Hộp phần tử (% slide) → kích thước vẽ tham chiếu (slide 1000 × 562,5) để tỉ lệ hình đúng. */
const refSize = (w: number, h: number) => ({ W: Math.max(w * 10, 1), H: Math.max(h * 5.625, 1) })

export interface PresetPaths {
  W: number
  H: number
  /** nền + nét */
  both?: string
  /** chỉ nền (không nét) */
  fillOnly?: string
  /** chỉ nét (không nền) */
  strokeOnly?: string
}

const polygonPath = (pts: number[]): string => {
  let d = ''
  for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'} ${pts[i].toFixed(2)} ${pts[i + 1].toFixed(2)} `
  return `${d}Z`
}

/** Đường vẽ của một hình theo hộp `w`×`h` (% slide); `adjust` là giá trị chỉnh OOXML (thiếu = mặc định). */
export function presetPaths(prst: string, w: number, h: number, adjust?: Record<string, number>): PresetPaths {
  const { W, H } = refSize(w, h)
  if (isConnectorPreset(prst)) {
    const pts = connectorPoints(prst, W, H, false, false, adjust)
    if (/^curved/.test(prst)) {
      const bez = connectorBezier(pts)
      let d = `M ${pts[0].toFixed(2)} ${pts[1].toFixed(2)} `
      for (let i = 0; i < bez.length; i += 6) d += `C ${bez.slice(i, i + 6).map((n) => n.toFixed(2)).join(' ')} `
      return { W, H, strokeOnly: d }
    }
    let d = ''
    for (let i = 0; i < pts.length; i += 2) d += `${i ? 'L' : 'M'} ${pts[i].toFixed(2)} ${pts[i + 1].toFixed(2)} `
    return { W, H, strokeOnly: d }
  }
  if (prst === 'ellipse') {
    const [rx, ry] = [W / 2, H / 2]
    return { W, H, both: `M 0 ${ry} A ${rx} ${ry} 0 1 1 ${W} ${ry} A ${rx} ${ry} 0 1 1 0 ${ry} Z` }
  }
  if (prst === 'roundRect') {
    const r = Math.min(W, H) / 6 // mặc định OOXML: 16,667% cạnh ngắn
    return { W, H, both: `M ${r} 0 H ${W - r} A ${r} ${r} 0 0 1 ${W} ${r} V ${H - r} A ${r} ${r} 0 0 1 ${W - r} ${H} H ${r} A ${r} ${r} 0 0 1 0 ${H - r} V ${r} A ${r} ${r} 0 0 1 ${r} 0 Z` }
  }
  if (isPillPreset(prst)) {
    const r = Math.min(W, H) / 2
    return { W, H, both: `M ${r} 0 H ${W - r} A ${r} ${r} 0 0 1 ${W - r} ${H} H ${r} A ${r} ${r} 0 0 1 ${r} 0 Z` }
  }
  const poly = presetPolygon(prst, W, H, adjust)
  if (poly && poly.length >= 6) return { W, H, both: polygonPath(poly) }
  const path = presetPath(prst, W, H, adjust)
  if (path) return { W, H, both: path.path, fillOnly: path.fillPath, strokeOnly: path.strokePath }
  // hình chưa có công thức: hình chữ nhật
  return { W, H, both: `M 0 0 H ${W} V ${H} H 0 Z` }
}
