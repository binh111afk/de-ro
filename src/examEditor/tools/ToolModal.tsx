/**
 * Mở đúng modal của công cụ theo `kind`. `initial` là cấu hình cũ (nhấp đúp ảnh
 * để sửa, hoặc AI điền sẵn).
 */
import type { ToolDoc, ToolImage, ToolKind } from '@/lib/toolSpec'
import type { PlotSpec } from '@/lib/plot'
import type { VarTableSpec } from '@/lib/varTable'
import type { Geo2dSpec, Geo3dSpec } from '@/lib/geometry'
import { GraphToolModal } from './GraphToolModal'
import { VarTableModal } from './VarTableModal'
import { Geo2dModal, Geo3dModal } from './GeometryModal'
import { CircuitModal, OxyModal, SignTableModal, StatsModal } from './MoreToolModals'
import type { SignTableSpec } from '@/lib/signTable'
import type { OxySpec } from '@/lib/oxy'
import type { StatsSpec } from '@/lib/stats'
import type { CircuitSpec } from '@/lib/circuit'

export function ToolModal({
  kind,
  initial,
  submitLabel,
  onClose,
  onInsert,
}: {
  kind: ToolKind
  initial?: ToolDoc['spec'] | null
  submitLabel?: string
  onClose: () => void
  onInsert: (img: ToolImage) => void
}) {
  const common = { submitLabel, onClose, onInsert }
  switch (kind) {
    case 'graph':
      return <GraphToolModal initial={initial as PlotSpec | null | undefined} {...common} />
    case 'vartable':
      return <VarTableModal initial={initial as VarTableSpec | null | undefined} {...common} />
    case 'geo2d':
      return <Geo2dModal initial={initial as Geo2dSpec | null | undefined} {...common} />
    case 'geo3d':
      return <Geo3dModal initial={initial as Geo3dSpec | null | undefined} {...common} />
    case 'signtable':
      return <SignTableModal initial={initial as SignTableSpec | null | undefined} {...common} />
    case 'oxy':
      return <OxyModal initial={initial as OxySpec | null | undefined} {...common} />
    case 'stats':
      return <StatsModal initial={initial as StatsSpec | null | undefined} {...common} />
    case 'circuit':
      return <CircuitModal initial={initial as CircuitSpec | null | undefined} {...common} />
  }
}
