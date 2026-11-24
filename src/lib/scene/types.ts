import { type Camera3D, type Mesh3dKind } from '../scene3d'

export interface SceneSpec {
  /** các lệnh, mỗi dòng một lệnh */
  text: string
  /** độ lệch nhãn do người dùng kéo (khoá = id nhãn trên attr `data-lbl`) */
  labelPos?: Record<string, [number, number]>
}

export type P = [number, number]
export type ShapeKind = 'tròn' | 'elip' | 'hộp' | 'thoi'
export type Weight = 'thin' | 'normal' | 'thick'

export interface StyleOpts {
  fill?: string
  fillOpacity?: number
  stroke?: string
  weight?: Weight
  dashed?: boolean
  bg?: boolean
  italic?: boolean
  rotate?: number
}

export type RegionPart =
  | { k: 'seg'; names: string[] }
  | { k: 'curve'; names: string[] }
  | { k: 'arc'; o: string; rx: number; ry: number; from: number; to: number; rotate: number }

export type Cmd =
  | { t: 'seg'; a: string; b: string; dashed: boolean; arrow?: boolean; arrowStart?: boolean; stroke?: string; weight?: Weight }
  | { t: 'poly'; names: string[]; fill?: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed?: boolean; bg?: boolean }
  | { t: 'dim'; a: string; b: string; text: string }
  | { t: 'angle'; a: string; o: string; b: string; text: string; radius?: number; italic?: boolean }
  | { t: 'right'; a: string; o: string; b: string }
  | { t: 'label'; a: string; b: string; text: string; italic?: boolean; rotate?: number; along?: boolean }
  | { t: 'ground'; a: string; b: string; wall: boolean }
  | { t: 'sprite'; id: string; name: string; a: string; b?: string }
  | { t: 'shape'; kind: ShapeKind; o: string; rx: number; ry: number; text: string; dashed: boolean; fill: string; fillOpacity?: number; rounded: boolean; stroke?: string; weight?: Weight; bg?: boolean; rotate?: number; italic?: boolean }
  | { t: 'arc'; kind: 'cung' | 'quạt' | 'cung elip'; o: string; rx: number; ry: number; start: number; sweep: number; text: string; dashed: boolean; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; bg?: boolean; rotate?: number; italic?: boolean }
  | { t: 'curve'; names: string[]; closed: boolean; dashed: boolean; arrow: boolean; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; bg?: boolean }
  | { t: 'region'; parts: RegionPart[]; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed: boolean; bg?: boolean }
  | { t: 'dot'; o: string; fill: string; stroke?: string; r: number }
  | { t: 'text'; o: string; text: string; large: boolean; bold: boolean; italic?: boolean; rotate?: number }
  | { t: 'frame'; w: number; h: number }
  | { t: 'view'; cam: Camera3D }
  | { t: 'face'; names: string[]; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed: boolean }
  | { t: 'mesh3d'; meshKind: Mesh3dKind; o: string; r: number; h: number; steps: number; cam?: Camera3D; fill: string; fillOpacity?: number; stroke?: string; weight?: Weight; dashed: boolean }

export interface StyleCaps {
  fill?: boolean
  stroke?: boolean
  dashed?: boolean
  weight?: boolean
  bg?: boolean
  rotate?: boolean
  italic?: boolean
}

export type Shape = Extract<Cmd, { t: 'shape' }>
export type ArcCmd = Extract<Cmd, { t: 'arc' }>
export type CurveCmd = Extract<Cmd, { t: 'curve' }>
export type RegionCmd = Extract<Cmd, { t: 'region' }>
