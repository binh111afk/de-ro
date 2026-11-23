/**
 * Phép chiếu 3D (trục đo xiên kiểu SGK & trực giao theo góc phương vị/ngẩng) và bộ sinh lưới
 * mặt cong 3D có tự che khuất mặt sau cho công cụ `scene`.
 */

export type P2 = [number, number]
export type P3 = [number, number, number]

export type Camera3D =
  | { mode: 'oblique'; dx: number; dy: number }
  | { mode: 'ortho'; az: number; el: number }

export type Mesh3dKind = 'tam giác' | 'nửa tròn' | 'vuông' | 'parabol'

export interface Mesh3dQuad {
  pts: P2[]
  depth: number
}

export const DEFAULT_OBLIQUE_CAMERA = { mode: 'oblique', dx: -0.42, dy: -0.38 } as const satisfies Camera3D
export const DEFAULT_MESH_CAMERA = { mode: 'ortho', az: -56, el: 24 } as const satisfies Camera3D

export function project3d(p: P3, cam: Camera3D): { p2: P2; depth: number } {
  if (cam.mode === 'oblique') {
    const p2: P2 = [p[1] + p[0] * cam.dx, p[2] + p[0] * cam.dy]
    // Vector hướng về phía người xem: (1, -dx, -dy) để mặt trước/phải/trên che mặt sau/trái/dưới.
    const depth = p[0] - p[1] * cam.dx - p[2] * cam.dy
    return { p2, depth }
  }
  const az = (cam.az * Math.PI) / 180
  const el = (cam.el * Math.PI) / 180
  const ca = Math.cos(az)
  const sa = Math.sin(az)
  const ce = Math.cos(el)
  const se = Math.sin(el)
  const x2 = -sa * p[0] + ca * p[1]
  const y2 = -se * ca * p[0] - se * sa * p[1] + ce * p[2]
  const depth = ce * ca * p[0] + ce * sa * p[1] + se * p[2]
  return { p2: [x2, y2], depth }
}

function makeQuad(corners: P3[], origin: P2, cam: Camera3D): Mesh3dQuad {
  let depth = 0
  const pts: P2[] = []
  for (const c of corners) {
    const pr = project3d(c, cam)
    pts.push([origin[0] + pr.p2[0], origin[1] + pr.p2[1]])
    depth += pr.depth
  }
  return { pts, depth: depth / corners.length }
}

function addRibbonQuads(grid: P3[][], origin: P2, cam: Camera3D, out: Mesh3dQuad[]) {
  for (let i = 0; i < grid.length - 1; i++) {
    for (let j = 0; j < grid[i].length - 1; j++) {
      out.push(makeQuad([grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]], origin, cam))
    }
  }
}

/**
 * Sinh lưới ô tứ giác 3D cho vật thể tròn đáy theo thiết diện hoặc mặt paraboloid,
 * sắp xếp từ xa tới gần theo độ sâu trung bình (painter's algorithm).
 */
export function generateMesh3d(
  kind: Mesh3dKind,
  origin: P2,
  radius: number,
  height: number,
  steps: number,
  cam: Camera3D,
): { quads: Mesh3dQuad[]; bounds: P2[] } {
  const n = Math.max(6, Math.min(24, Math.round(steps)))
  const quads: Mesh3dQuad[] = []

  if (kind === 'parabol') {
    const rings = Math.max(4, Math.round(n / 3))
    const grid: P3[][] = []
    for (let i = 0; i <= n; i++) {
      const th = (2 * Math.PI * i) / n
      const col: P3[] = []
      for (let j = 0; j <= rings; j++) {
        const t = j / rings
        const r = radius * t
        col.push([r * Math.cos(th), r * Math.sin(th), height * (1 - t * t)])
      }
      grid.push(col)
    }
    addRibbonQuads(grid, origin, cam, quads)
  } else if (kind === 'tam giác') {
    const m = 6
    for (const sgn of [-1, 1] as const) {
      const grid: P3[][] = []
      for (let i = 0; i <= n; i++) {
        const phi = (Math.PI * i) / n
        const x = radius * Math.cos(phi)
        const s = Math.sin(phi)
        const w = radius * s
        const h = height * s
        const col: P3[] = []
        for (let j = 0; j <= m; j++) {
          const v = j / m
          col.push([x, sgn * (1 - v) * w, v * h])
        }
        grid.push(col)
      }
      addRibbonQuads(grid, origin, cam, quads)
    }
  } else if (kind === 'nửa tròn') {
    const m = 8
    const grid: P3[][] = []
    for (let i = 0; i <= n; i++) {
      const phi = (Math.PI * i) / n
      const x = radius * Math.cos(phi)
      const s = Math.sin(phi)
      const w = radius * s
      const h = height * s
      const col: P3[] = []
      for (let j = 0; j <= m; j++) {
        const alpha = (Math.PI * j) / m
        col.push([x, w * Math.cos(alpha), h * Math.sin(alpha)])
      }
      grid.push(col)
    }
    addRibbonQuads(grid, origin, cam, quads)
  } else {
    // Thiết diện hình chữ nhật / vuông (1 mặt đỉnh + 2 mặt bên)
    const m = 4
    const topGrid: P3[][] = []
    const leftGrid: P3[][] = []
    const rightGrid: P3[][] = []
    for (let i = 0; i <= n; i++) {
      const phi = (Math.PI * i) / n
      const x = radius * Math.cos(phi)
      const s = Math.sin(phi)
      const w = radius * s
      const h = height * s
      const topCol: P3[] = []
      const leftCol: P3[] = []
      const rightCol: P3[] = []
      for (let j = 0; j <= m; j++) {
        const v = j / m
        topCol.push([x, (-1 + 2 * v) * w, h])
        leftCol.push([x, -w, v * h])
        rightCol.push([x, w, v * h])
      }
      topGrid.push(topCol)
      leftGrid.push(leftCol)
      rightGrid.push(rightCol)
    }
    addRibbonQuads(topGrid, origin, cam, quads)
    addRibbonQuads(leftGrid, origin, cam, quads)
    addRibbonQuads(rightGrid, origin, cam, quads)
  }

  quads.sort((a, b) => a.depth - b.depth)
  const bounds: P2[] = []
  for (const q of quads) for (const p of q.pts) bounds.push(p)
  return { quads, bounds }
}
