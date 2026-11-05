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
import { NumberLineModal, TreeModal, TrigModal } from './MoreToolModals'
import type { NumberLineSpec, TreeSpec, TrigSpec } from '@/lib/mathExtra'
import { ChemGraphModal, CircuitModal, ElectronModal, InclineModal, MotionModal, StructModal, OxyModal, SignTableModal, StatsModal } from './MoreToolModals'
import type { InclineSpec, MotionSpec } from '@/lib/physics'
import type { ChemGraphSpec, ElectronSpec, StructSpec } from '@/lib/chem'
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
    case 'motion':
      return <MotionModal initial={initial as MotionSpec | null | undefined} {...common} />
    case 'incline':
      return <InclineModal initial={initial as InclineSpec | null | undefined} {...common} />
    case 'electron':
      return <ElectronModal initial={initial as ElectronSpec | null | undefined} {...common} />
    case 'struct':
      return <StructModal initial={initial as StructSpec | null | undefined} {...common} />
    case 'chemgraph':
      return <ChemGraphModal initial={initial as ChemGraphSpec | null | undefined} {...common} />
    case 'trig':
      return <TrigModal initial={initial as TrigSpec | null | undefined} {...common} />
    case 'probtree':
      return <TreeModal initial={initial as TreeSpec | null | undefined} {...common} />
    case 'numberline':
      return <NumberLineModal initial={initial as NumberLineSpec | null | undefined} {...common} />
  }
}
