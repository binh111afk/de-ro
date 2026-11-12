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
import { NumberLineModal, TreeModal, TrigModal, VennModal, GroupedModal } from './MoreToolModals'
import type { NumberLineSpec, TreeSpec, TrigSpec, VennSpec } from '@/lib/mathExtra'
import type { GroupedSpec } from '@/lib/grouped'
import { GasModal, SceneModal } from './MoreToolModals'
import type { SceneSpec } from '@/lib/scene'
import type { GasSpec } from '@/lib/gas'
import { ChemGraphModal, CircuitModal, ElectronModal, InclineModal, MotionModal, StructModal, OxyModal, SignTableModal, StatsModal, TableModal } from './MoreToolModals'
import type { TableSpec } from '@/lib/table'
import type { InclineSpec, MotionSpec } from '@/lib/physics'
import type { ChemGraphSpec, ElectronSpec, StructSpec } from '@/lib/chem'
import type { SignTableSpec } from '@/lib/signTable'
import type { OxySpec } from '@/lib/oxy'
import type { StatsSpec } from '@/lib/stats'
import type { CircuitSpec } from '@/lib/circuit'
import { ChemEqModal } from './MoreToolModals'
import type { ChemEqSpec } from '@/lib/chemEq'
import { PhaseModal } from './MoreToolModals'
import type { PhaseSpec } from '@/lib/phaseChange'
import { OscModal } from './MoreToolModals'
import type { OscSpec } from '@/lib/oscillation'

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
    case 'scene':
      return <SceneModal initial={initial as SceneSpec | null | undefined} {...common} />
    case 'gas':
      return <GasModal initial={initial as GasSpec | null | undefined} {...common} />
    case 'incline':
      return <InclineModal initial={initial as InclineSpec | null | undefined} {...common} />
    case 'electron':
      return <ElectronModal initial={initial as ElectronSpec | null | undefined} {...common} />
    case 'struct':
      return <StructModal initial={initial as StructSpec | null | undefined} {...common} />
    case 'chemgraph':
      return <ChemGraphModal initial={initial as ChemGraphSpec | null | undefined} {...common} />
    case 'chemeq':
      return <ChemEqModal initial={initial as ChemEqSpec | null | undefined} {...common} />
    case 'trig':
      return <TrigModal initial={initial as TrigSpec | null | undefined} {...common} />
    case 'probtree':
      return <TreeModal initial={initial as TreeSpec | null | undefined} {...common} />
    case 'numberline':
      return <NumberLineModal initial={initial as NumberLineSpec | null | undefined} {...common} />
    case 'venn':
      return <VennModal initial={initial as VennSpec | null | undefined} {...common} />
    case 'grouped':
      return <GroupedModal initial={initial as GroupedSpec | null | undefined} {...common} />
    case 'table':
      return <TableModal initial={initial as TableSpec | null | undefined} {...common} />
    case 'phase':
      return <PhaseModal initial={initial as PhaseSpec | null | undefined} {...common} />
    case 'osc':
      return <OscModal initial={initial as OscSpec | null | undefined} {...common} />
  }
}
