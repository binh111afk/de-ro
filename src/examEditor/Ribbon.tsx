/**
 * Ribbon của trình soạn đề — port cấu trúc ribbon Word của GenOffice:
 * các tab (Trang chủ / Chèn / Bố cục / Thiết kế / Tài liệu), mỗi tab là các
 * nhóm nút có nhãn dưới.
 *
 * Cấu trúc dọc đúng chuẩn GenOffice (host ghép qua `midSection`):
 *   1. hàng tab ribbon (Trang chủ | Chèn | …)
 *   2. tab strip nhiều đề đang mở   ← `midSection`
 *   3. ribbon body (thân công cụ)
 *
 * Mọi icon là SVG stroke `currentColor` từ bộ icon GenOffice — KHÔNG dùng emoji.
 */
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Editor } from '@tiptap/core'
import {
  RibbonBody,
  RibbonButton,
  RibbonGroup,
  RibbonIconButton,
  RibbonTabs,
  type RibbonTabDef,
} from './Layout'
import { cn } from '@/lib/cn'
import { BookMarked } from 'lucide-react'
import { MonitorPlay, Blocks, ListTree, TableCellsMerge, TableCellsSplit, Wrench } from 'lucide-react'
import { FileMenu } from './FileMenu'
import { BankModal } from './BankModal'
import { templateById, insertBlockTemplate } from './templates'
import { applyFormatAttrs, getSelectedBlock, syncDomSelection, type FormatState } from './formatState'
import { TablePicker, SymbolPicker, ImagePicker, EquationDialog, LinkDialog } from './InsertMenus'
import { Dropdown } from './Dropdown'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'
import { PhoneRibbon, TabletRibbonBody, type RibbonGroupDef } from './RibbonAdaptive'
import { deleteCurrentTable, deleteCurrentTableColumn, deleteCurrentTableRow, deleteCurrentBlock } from './deleteActions'
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconBullets,
  IconBorderAll,
  IconCaret,
  IconCheck,
  IconChangeCase,
  IconChevronDown,
  IconChevronUp,
  IconClearFormat,
  IconCopy,
  IconCut,
  IconDoc,
  IconEquation,
  IconLink,
  IconFontColorA,
  IconFormatPainter,
  IconGrowFont,
  IconHighlight,
  IconIndentDec,
  IconIndentInc,
  IconMultilevel,
  IconNumbered,
  IconPageBreak,
  IconPaste,
  IconPrinter,
  IconPrintLayout,
  IconRedo,
  IconReplace,
  IconRowDelete,
  IconColDelete,
  IconSave,
  IconSearch,
  IconSelectAll,
  IconShading,
  IconShrinkFont,
  IconStylesPane,
  IconSubscript,
  IconSuperscript,
  IconTable,
  IconTableDelete,
  IconTrash,
  IconUndo,
} from './icons'

export const RIBBON_TABS: RibbonTabDef[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'insert', label: 'Chèn' },
  { id: 'layout', label: 'Bố cục' },
]

const FONT_SIZES = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72']
const FONTS = ['Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Segoe UI', 'Tahoma', 'Verdana', 'Courier New']
const LINE_SPACING = [
  { label: '1,0', value: '1' },
  { label: '1,15', value: '1.15' },
  { label: '1,5', value: '1.5' },
  { label: '2,0', value: '2' },
  { label: '2,5', value: '2.5' },
  { label: '3,0', value: '3' },
]

const HIGHLIGHTS = [
  '#ffff00', '#00ff00', '#00ffff', '#ff00ff', '#0000ff', '#ff0000', '#000080', '#008080',
  '#008000', '#800080', '#800000', '#808000', '#808080', '#c0c0c0', '#000000',
]

const THEME_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
]

interface StylePreset {
  id: string
  label: string
  preview: CSSProperties
}

const STYLE_PRESETS: StylePreset[] = [
  { id: 'normal', label: 'Bình thường', preview: { fontSize: 13 } },
  { id: 'noSpacing', label: 'Không giãn', preview: { fontSize: 13, lineHeight: 1 } },
  { id: 'title', label: 'Tiêu đề', preview: { fontSize: 17, fontWeight: 700 } },
  { id: 'subtitle', label: 'Phụ đề', preview: { fontSize: 13, color: '#666' } },
  { id: 'heading1', label: 'Tiêu đề 1', preview: { fontSize: 15, fontWeight: 700, color: '#8e3f1f' } },
  { id: 'heading2', label: 'Tiêu đề 2', preview: { fontSize: 14, fontWeight: 700, color: '#8e3f1f' } },
  { id: 'heading3', label: 'Tiêu đề 3', preview: { fontSize: 13, fontWeight: 700, color: '#8e3f1f' } },
  { id: 'quote', label: 'Trích dẫn', preview: { fontSize: 13, fontStyle: 'italic', color: '#666' } },
]

export function Ribbon({
  editor,
  activeTab,
  onTabChange,
  onNewDoc,
  onImportFile,
  onSave,
  onPrint,
  onExportWord,
  onExportPdf,
  onStartQuiz,
  dirty,
  pageCount,
  zoom,
  onZoomChange,
  format,
  onFind,
  onReplace,
  marginCm = 2,
  onMarginChange,
  orientation = 'portrait',
  onOrientationChange,
  pageColor = '#ffffff',
  onPageColorChange,
  pageBorder = 0,
  onPageBorderChange,
  onOpenNav,
  layoutMode = 'desktop',
}: {
  editor: Editor | null
  activeTab: string
  onTabChange: (id: string) => void
  onNewDoc: () => void
  onImportFile: (file: File) => Promise<void>
  onSave: () => void
  onPrint: () => void
  onExportWord: () => void
  /** Tệp → Làm đề tương tác: chuyển đề đang soạn sang bài làm có đếm ngược và chấm điểm */
  onStartQuiz: () => void
  onExportPdf: () => void
  dirty: boolean
  pageCount: number
  zoom: number
  onZoomChange: (z: number) => void
  format: FormatState
  onFind?: () => void
  onReplace?: () => void
  marginCm?: number
  onMarginChange?: (cm: number) => void
  orientation?: 'portrait' | 'landscape'
  onOrientationChange?: (o: 'portrait' | 'landscape') => void
  pageColor?: string
  onPageColorChange?: (c: string) => void
  pageBorder?: number
  onPageBorderChange?: (w: number) => void
  onOpenNav?: (tab: 'toc' | 'blocks' | 'tools') => void
  layoutMode?: 'desktop' | 'tablet' | 'phone'
}) {
  const [font, setFont] = useState('Times New Roman')
  const [size, setSize] = useState('14')
  // "bút" màu nhớ lần chọn gần nhất — nút chính áp màu này, giống Word/GenOffice
  const [penHighlight, setPenHighlight] = useState('#ffff00')
  const [penColor, setPenColor] = useState('#000000')
  const [painter, setPainter] = useState(false)
  const [dialog, setDialog] = useState<'link' | 'equation' | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const handleTabChange = (id: string) => {
    if (collapsed) setCollapsed(false)
    onTabChange(id)
  }
  const painterRef = useRef<{
    marks: Record<string, unknown>
    attrs: Record<string, unknown>
  } | null>(null)

  useEffect(() => {
    if (format.fontFamily) setFont(format.fontFamily)
    if (format.fontSize) setSize(String(parseFloat(format.fontSize)))
  }, [format.fontFamily, format.fontSize])

  const chain = () => {
    // Một editor đã bị destroy vẫn trả về `chain()` nhưng mọi command đều
    // rơi vào im lặng — đây là nguyên nhân "ribbon bấm không ăn". Editor cũ
    // hay bị giữ lại khi đổi tab (StrictMode remount), nên phải chặn ở đây.
    if (!editor || editor.isDestroyed) return undefined
    syncDomSelection(editor)
    return editor.chain()
  }
  const disabled = !editor || editor.isDestroyed
  /** editor còn sống — dùng cho các lệnh gọi trực tiếp, không qua chain() */
  const live = editor && !editor.isDestroyed ? editor : null

  /**
   * Hoàn tác/Làm lại dùng lịch sử của chính TipTap (một sổ duy nhất cho mỗi
   * tài liệu). `useFormatState` chỉ re-render khi định dạng đổi, nên trạng thái
   * bật/tắt của 2 nút phải tự theo dõi transaction.
   */
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  useEffect(() => {
    if (!live) return
    const sync = () => {
      setCanUndo(live.can().undo())
      setCanRedo(live.can().redo())
    }
    sync()
    live.on('transaction', sync)
    return () => {
      live.off('transaction', sync)
    }
  }, [live])

  const setFontFamily = (name: string) => {
    setFont(name)
    chain()?.setMark('textStyle', { fontFamily: name }).run()
  }

  const setFontSize = (v: string) => {
    setSize(v)
    chain()?.setMark('textStyle', { fontSize: `${v}pt` }).run()
  }

  const stepFontSize = (dir: 1 | -1) => {
    const cur = parseFloat(size) || 14
    const idx = FONT_SIZES.findIndex((s) => parseFloat(s) >= cur)
    const next = FONT_SIZES[Math.max(0, Math.min(FONT_SIZES.length - 1, (idx < 0 ? 0 : idx) + dir))]
    setFontSize(next)
  }

  const applyCase = (mode: 'sentence' | 'lower' | 'upper' | 'title') => {
    if (!live) return
    const { from, to } = live.state.selection
    if (from === to) return
    const text = live.state.doc.textBetween(from, to, ' ')
    let out = text
    if (mode === 'lower') out = text.toLowerCase()
    else if (mode === 'upper') out = text.toUpperCase()
    else if (mode === 'title') out = text.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    else out = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    live.chain().focus().deleteRange({ from, to }).insertContentAt(from, out).run()
  }

  const clearFormatting = () => {
    chain()
      ?.unsetAllMarks()
      .setMark('textStyle', { fontFamily: null, fontSize: null, color: null })
      .run()
    if (live)
      applyFormatAttrs(live, {
        align: undefined,
        lineHeight: undefined,
        indentLeft: undefined,
        indentFirstLine: undefined,
        spaceBefore: undefined,
        spaceAfter: undefined,
        borders: undefined,
        shading: undefined,
      })
  }

  const capturePainter = () => {
    if (!live) return
    const parent = live.state.selection.$from.parent
    painterRef.current = {
      marks: live.getAttributes('textStyle') as Record<string, unknown>,
      attrs: { ...parent.attrs },
    }
    setPainter(true)
  }

  useEffect(() => {
    if (!editor || !painter) return
    const onSel = () => {
      const p = painterRef.current
      if (!p) return
      if (editor.isDestroyed) return
      const { from, to } = editor.state.selection
      if (from === to) return
      editor.chain().focus().setMark('textStyle', p.marks).run()
      applyFormatAttrs(editor, p.attrs as Record<string, never>)
      painterRef.current = null
      setPainter(false)
    }
    editor.on('selectionUpdate', onSel)
    return () => {
      editor.off('selectionUpdate', onSel)
    }
  }, [editor, painter])

  const [bankOpen, setBankOpen] = useState(false)

  const insertTemplate = (id: string) => {
    const tpl = templateById(id)
    // Chèn qua đường chèn chung (đề trống / cuối đề / sau khối cấp cao nhất
    // đang chứa con trỏ) — xem `insertBlockTemplate` trong templates.ts.
    if (tpl && live) insertBlockTemplate(live, tpl)
  }

  const applyStylePreset = (id: string) => {
    if (!live) return
    syncDomSelection(live)
    const target = getSelectedBlock(live)
    if (!target) return
    const { node, pos: nodePos } = target
    const { state, view } = live
    const typeName = node.type.name
    let patch: Record<string, unknown> = {}
    let newType: string | null = null
    switch (id) {
      case 'normal':
        patch = { align: undefined, textAlign: undefined, lineHeight: undefined, indentLeft: undefined, indentFirstLine: undefined, spaceBefore: undefined, spaceAfter: undefined, borders: undefined, shading: undefined }
        break
      case 'noSpacing':
        patch = { spaceBefore: 0, spaceAfter: 0, lineHeight: 1 }
        newType = typeName === 'examParagraph' ? null : 'examParagraph'
        break
      case 'title':
        patch = { align: 'center', textAlign: 'center', spaceBefore: 12, spaceAfter: 6 }
        newType = typeName === 'examParagraph' ? null : 'examParagraph'
        break
      case 'subtitle':
        patch = { align: 'center', textAlign: 'center', spaceBefore: 0, spaceAfter: 6 }
        newType = typeName === 'examParagraph' ? null : 'examParagraph'
        break
      case 'heading1':
        patch = { spaceBefore: 12, spaceAfter: 4 }
        newType = typeName === 'examHeading' ? null : 'examHeading'
        if (newType) patch.level = 1
        break
      case 'heading2':
        patch = { spaceBefore: 8, spaceAfter: 3 }
        newType = typeName === 'examHeading' ? null : 'examHeading'
        if (newType) patch.level = 2
        break
      case 'heading3':
        patch = { spaceBefore: 6, spaceAfter: 2 }
        newType = typeName === 'examHeading' ? null : 'examHeading'
        if (newType) patch.level = 3
        break
      case 'quote':
        patch = { indentLeft: 24, indentFirstLine: 0, spaceBefore: 4, spaceAfter: 4 }
        newType = typeName === 'examParagraph' ? null : 'examParagraph'
        break
    }
    const attrs = { ...node.attrs, ...patch }
    let tr = state.tr.setNodeMarkup(nodePos, newType ? state.schema.nodes[newType] : undefined, attrs)
    if (id === 'quote' || id === 'subtitle') {
      const from = nodePos + 1
      const to = nodePos + node.nodeSize - 1
      tr = tr.addMark(from, to, state.schema.marks.italic.create())
    }
    if (id === 'title' || id === 'heading1' || id === 'heading2' || id === 'heading3') {
      const from = nodePos + 1
      const to = nodePos + node.nodeSize - 1
      tr = tr.addMark(from, to, state.schema.marks.bold.create())
    }
    view.dispatch(tr)
  }

  const fileMenuEl = (
    <FileMenu
      kind="exam"
      onNew={onNewDoc}
      onImport={onImportFile}
      onDownload={onExportWord}
      downloadHint=".doc"
      extra={[
        { label: 'Xuất PDF', hint: 'In ra hoặc lưu thành PDF', onClick: onExportPdf },
        { label: 'Làm đề tương tác', hint: 'Làm thử có đếm ngược, tự chấm', onClick: onStartQuiz, icon: <MonitorPlay className="size-4" strokeWidth={1.5} /> },
      ]}
    />
  )

  const groupsByTab: Record<string, RibbonGroupDef[]> = {
    home: [
      {
        id: 'clipboard',
        label: 'Clipboard',
        render: () => (
          <div className="rb-row rb-row--top">
            <RibbonButton
              icon={<IconPaste size={26} />}
              label="Dán"
              disabled={disabled}
              onClick={() =>
                navigator.clipboard?.readText().then((t) => chain()?.insertContent(t).run())
              }
            />
            <div className="rb-col rb-col--icons">
              <RibbonIconButton icon={<IconCut size={16} />} title="Cắt" disabled={disabled} onClick={() => document.execCommand('cut')} />
              <RibbonIconButton icon={<IconCopy size={16} />} title="Sao chép" disabled={disabled} onClick={() => document.execCommand('copy')} />
              <RibbonIconButton icon={<IconFormatPainter size={16} />} title="Sao chép định dạng" active={painter} disabled={disabled} onClick={capturePainter} />
            </div>
          </div>
        ),
      },
      {
        id: 'font',
        label: 'Phông chữ',
        render: () => (
          <div className="rb-font-group">
            <div className="rb-row">
              <Dropdown
                value={font}
                options={FONTS.map((f) => ({ value: f, label: f, render: <span style={{ fontFamily: f }}>{f}</span> }))}
                onPick={setFontFamily}
                disabled={disabled}
                ariaLabel="Phông chữ"
                width={148}
              />
              <Dropdown
                value={size}
                options={FONT_SIZES.map((s) => ({ value: s, label: s }))}
                onPick={setFontSize}
                disabled={disabled}
                ariaLabel="Cỡ chữ"
                width={58}
              />
              <RibbonIconButton icon={<IconGrowFont size={16} />} title="Phóng to chữ" disabled={disabled} onClick={() => stepFontSize(1)} />
              <RibbonIconButton icon={<IconShrinkFont size={16} />} title="Thu nhỏ chữ" disabled={disabled} onClick={() => stepFontSize(-1)} />
              <span className="rb-mini-sep" />
              <RibbonIconButton icon={<IconChangeCase size={16} />} title="Đổi kiểu chữ" disabled={disabled} onClick={() => applyCase('upper')} />
              <RibbonIconButton icon={<IconClearFormat size={16} />} title="Xóa định dạng" disabled={disabled} onClick={clearFormatting} />
            </div>
            <div className="rb-row">
              <button type="button" className={cn('rb-icon', format.bold && 'active')} data-tip="Đậm" aria-label="Đậm" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleBold().run()}><b>B</b></button>
              <button type="button" className={cn('rb-icon', format.italic && 'active')} data-tip="Nghiêng" aria-label="Nghiêng" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleItalic().run()}><i>I</i></button>
              <button type="button" className={cn('rb-icon', format.underline && 'active')} data-tip="Gạch chân" aria-label="Gạch chân" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleUnderline().run()}><u>U</u></button>
              <button type="button" className={cn('rb-icon', format.strike && 'active')} data-tip="Gạch ngang" aria-label="Gạch ngang" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleStrike().run()}><s>ab</s></button>
              <span className="rb-mini-sep" />
              <RibbonIconButton icon={<IconSubscript size={16} />} title="Chỉ số dưới" active={format.sub} disabled={disabled} onClick={() => chain()?.toggleMark('sub').run()} />
              <RibbonIconButton icon={<IconSuperscript size={16} />} title="Chỉ số trên" active={format.super} disabled={disabled} onClick={() => chain()?.toggleMark('super').run()} />
              <span className="rb-mini-sep" />
              <div className="rb-split">
                <RibbonIconButton
                  icon={
                    <span className="rb-color-glyph">
                      <IconHighlight size={16} />
                      <ColorBar color={format.highlightColor || '#ffff00'} />
                    </span>
                  }
                  title="Tô sáng"
                  active={format.highlight}
                  disabled={disabled}
                  onClick={() => chain()?.toggleHighlight({ color: penHighlight }).run()}
                />
                <ColorDropdown
                  title="Màu tô sáng"
                  colors={HIGHLIGHTS}
                  current={penHighlight}
                  none={{ label: 'Không tô sáng', onClick: () => chain()?.unsetHighlight().run() }}
                  onPick={(c) => {
                    setPenHighlight(c)
                    chain()?.toggleHighlight({ color: c }).run()
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="rb-split">
                <RibbonIconButton
                  icon={
                    <span className="rb-color-glyph">
                      <IconFontColorA size={16} />
                      <ColorBar color={penColor} />
                    </span>
                  }
                  title="Màu chữ"
                  disabled={disabled}
                  onClick={() => chain()?.setMark('textStyle', { color: penColor }).run()}
                />
                <ColorDropdown
                  title="Màu chữ"
                  colors={THEME_COLORS}
                  current={penColor}
                  none={{ label: 'Tự động (đen)', onClick: () => { setPenColor('#000000'); chain()?.unsetMark('textStyle').run() } }}
                  onPick={(c) => {
                    setPenColor(c)
                    chain()?.setMark('textStyle', { color: c }).run()
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'paragraph',
        label: 'Đoạn văn',
        render: () => (
          <div className="rb-col">
            <div className="rb-row">
              <RibbonIconButton icon={<IconBullets size={16} />} title="Danh sách gạch đầu dòng" disabled={disabled} onClick={() => insertTemplate('bullets')} />
              <RibbonIconButton icon={<IconNumbered size={16} />} title="Danh sách đánh số" disabled={disabled} onClick={() => insertTemplate('numbered')} />
              <RibbonIconButton icon={<IconMultilevel size={16} />} title="Danh sách nhiều cấp" disabled={disabled} onClick={() => insertTemplate('multilevel')} />
              <span className="rb-mini-sep" />
              <RibbonIconButton icon={<IconIndentDec size={16} />} title="Giảm thụt lề" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { indentLeft: Math.max(0, format.indentLeft - 12) })} />
              <RibbonIconButton icon={<IconIndentInc size={16} />} title="Tăng thụt lề" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { indentLeft: format.indentLeft + 12 })} />
            </div>
            <div className="rb-row">
              <RibbonIconButton icon={<IconAlignLeft size={16} />} title="Căn trái" active={format.align === 'left'} disabled={disabled} onClick={() => chain()?.setTextAlign('left').run()} />
              <RibbonIconButton icon={<IconAlignCenter size={16} />} title="Căn giữa" active={format.align === 'center'} disabled={disabled} onClick={() => chain()?.setTextAlign('center').run()} />
              <RibbonIconButton icon={<IconAlignRight size={16} />} title="Căn phải" active={format.align === 'right'} disabled={disabled} onClick={() => chain()?.setTextAlign('right').run()} />
              <RibbonIconButton icon={<IconAlignJustify size={16} />} title="Căn đều" active={format.align === 'justify'} disabled={disabled} onClick={() => chain()?.setTextAlign('justify').run()} />
              <span className="rb-mini-sep" />
              <Dropdown
                value={String(format.lineHeight)}
                options={LINE_SPACING.map((l) => ({ value: l.value, label: l.label }))}
                onPick={(v) => chain()?.setLineHeight(v).run()}
                disabled={disabled}
                ariaLabel="Giãn dòng"
                width={64}
              />
              <span className="rb-mini-sep" />
              <div className="rb-split">
                <RibbonIconButton
                  icon={
                    <span className="rb-color-glyph">
                      <IconShading size={16} />
                      <ColorBar color={format.shading || '#fff2cc'} />
                    </span>
                  }
                  title="Đổ bóng đoạn"
                  disabled={disabled}
                  onClick={() => live && applyFormatAttrs(live, { shading: format.shading ? undefined : '#fff2cc' })}
                />
                <ColorDropdown
                  title="Màu đổ bóng đoạn"
                  colors={THEME_COLORS}
                  current={format.shading}
                  none={{ label: 'Không đổ bóng', onClick: () => live && applyFormatAttrs(live, { shading: undefined }) }}
                  onPick={(c) => live && applyFormatAttrs(live, { shading: c })}
                  disabled={disabled}
                />
              </div>
              <div className="rb-split">
                <RibbonIconButton icon={<IconBorderAll size={16} />} title="Viền đoạn" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { borders: format.borders === 'box' ? 'none' : 'box' })} />
                <ColorDropdown
                  title="Viền đoạn"
                  colors={[]}
                  items={BORDER_ITEMS.map((it) => ({
                    label: it.label,
                    icon: <BorderGlyph side={it.side} />,
                    active: (format.borders || 'none') === it.side,
                    onClick: () => live && applyFormatAttrs(live, { borders: it.side }),
                  }))}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'styles',
        label: 'Kiểu',
        render: () => (
          <div className="rb-styles">
            {STYLE_PRESETS.map((s) => (
              <button key={s.id} type="button" className="rb-style-card" disabled={disabled} data-tip={s.label} onMouseDown={(e) => e.preventDefault()} onClick={() => applyStylePreset(s.id)}>
                <span className="rb-style-card__preview" style={s.preview}>AaBbCcDd</span>
                <span className="rb-style-card__label">{s.label}</span>
              </button>
            ))}
            <StylePaneButton
              disabled={disabled}
              onPick={(id) => applyStylePreset(id)}
            />
          </div>
        ),
      },
      {
        id: 'editing',
        label: 'Chỉnh sửa',
        render: () => (
          <div className="rb-col">
            <div className="rb-row">
              <RibbonIconButton icon={<IconSearch size={16} />} title="Tìm" disabled={disabled} onClick={onFind} />
              <RibbonIconButton icon={<IconReplace size={16} />} title="Thay thế" disabled={disabled} onClick={onReplace} />
              <RibbonIconButton icon={<IconSelectAll size={16} />} title="Chọn tất cả" disabled={disabled} onClick={() => chain()?.selectAll().run()} />
              <RibbonIconButton icon={<IconTrash size={16} />} title="Xóa khối đang chọn" disabled={disabled} onClick={() => live && deleteCurrentBlock(live)} />
            </div>
          </div>
        ),
      },
    ],
    insert: [
      {
        id: 'tools',
        label: 'Công cụ',
        render: () => (
          <>
            <RibbonButton icon={<Wrench className="size-[26px]" strokeWidth={1.3} />} label="Công cụ vẽ" onClick={() => onOpenNav?.('tools')} />
            <RibbonButton icon={<Blocks className="size-[26px]" strokeWidth={1.3} />} label="Khối mẫu" onClick={() => onOpenNav?.('blocks')} />
            <RibbonButton icon={<ListTree className="size-[26px]" strokeWidth={1.3} />} label="Mục lục" onClick={() => onOpenNav?.('toc')} />
          </>
        ),
      },
      {
        id: 'bank',
        label: 'Kho',
        render: () => <RibbonButton icon={<BookMarked size={26} strokeWidth={1.75} />} label="Kho câu hỏi" disabled={disabled} onClick={() => setBankOpen(true)} />,
      },
      {
        id: 'table',
        label: 'Bảng',
        render: () => (
          <>
            <TablePicker editor={editor} disabled={disabled} />
            <RibbonButton
              icon={<TableCellsMerge className="size-[26px]" strokeWidth={1.3} />}
              label="Gộp ô"
              title="Kéo chọn nhiều ô trong bảng rồi bấm để gộp"
              disabled={disabled}
              onClick={() => live?.chain().focus().mergeCells().run()}
            />
            <RibbonButton
              icon={<TableCellsSplit className="size-[26px]" strokeWidth={1.3} />}
              label="Tách ô"
              title="Đặt con trỏ vào ô đã gộp rồi bấm để tách lại"
              disabled={disabled}
              onClick={() => live?.chain().focus().splitCell().run()}
            />
            <div className="rb-col rb-col--icons">
              <RibbonIconButton icon={<IconRowDelete size={16} />} title="Xóa hàng" disabled={disabled} onClick={() => live && deleteCurrentTableRow(live)} />
              <RibbonIconButton icon={<IconColDelete size={16} />} title="Xóa cột" disabled={disabled} onClick={() => live && deleteCurrentTableColumn(live)} />
              <RibbonIconButton icon={<IconTableDelete size={16} />} title="Xóa bảng" disabled={disabled} onClick={() => live && deleteCurrentTable(live)} />
            </div>
          </>
        ),
      },
      {
        id: 'media',
        label: 'Minh họa',
        render: () => <ImagePicker editor={editor} disabled={disabled} />,
      },
      {
        id: 'link',
        label: 'Liên kết',
        render: () => <RibbonButton icon={<IconLink size={26} />} label="Liên kết" disabled={disabled} onClick={() => setDialog('link')} />,
      },
      {
        id: 'symbols',
        label: 'Ký hiệu',
        render: () => (
          <>
            <SymbolPicker editor={editor} disabled={disabled} />
            <RibbonButton icon={<IconEquation size={26} />} label="Công thức" disabled={disabled} onClick={() => setDialog('equation')} />
          </>
        ),
      },
      {
        id: 'page',
        label: 'Trang',
        render: () => <RibbonButton icon={<IconPageBreak size={26} />} label="Ngắt trang" disabled={disabled} onClick={() => insertTemplate('pageBreak')} />,
      },
    ],
    layout: [
      {
        id: 'pageSetup',
        label: 'Thiết lập trang',
        render: () => (
          <div className="rb-row rb-row--top">
            <div className="rb-col rb-col--gap4">
              <span className="rb-label">Lề</span>
              <Dropdown
                value={String(marginCm)}
                options={[
                  { value: '1', label: '1 cm' },
                  { value: '1.5', label: '1,5 cm' },
                  { value: '2', label: '2 cm' },
                  { value: '2.5', label: '2,5 cm' },
                  { value: '3', label: '3 cm' },
                ]}
                onPick={(v) => onMarginChange?.(Number(v))}
                disabled={disabled}
                ariaLabel="Lề trang"
                width={84}
              />
            </div>
            <div className="rb-col rb-col--gap4">
              <span className="rb-label">Hướng</span>
              <div className="rb-row">
                <RibbonIconButton
                  icon={<IconDoc size={16} />}
                  title="Dọc"
                  active={orientation === 'portrait'}
                  disabled={disabled}
                  onClick={() => onOrientationChange?.('portrait')}
                />
                <RibbonIconButton
                  icon={<IconPrintLayout size={16} />}
                  title="Ngang"
                  active={orientation === 'landscape'}
                  disabled={disabled}
                  onClick={() => onOrientationChange?.('landscape')}
                />
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'theme',
        label: 'Nền & viền trang',
        render: () => (
          <>
            <div className="rb-split">
              <RibbonButton
                icon={
                  <span className="rb-color-glyph">
                    <IconDoc size={26} />
                    <ColorBar color={pageColor} />
                  </span>
                }
                label="Màu trang"
                onClick={() => onPageColorChange?.('#ffffff')}
              />
              <ColorDropdown
                title="Màu trang"
                current={pageColor}
                colors={['#ffffff', '#f7f8f7', '#fff8e6', '#eef4ff', '#eaf4ed', '#fdeceb']}
                onPick={(c) => onPageColorChange?.(c)}
              />
            </div>
            <div className="rb-split">
              <RibbonButton
                icon={
                  <span className="rb-color-glyph">
                    <IconTable size={26} />
                    <ColorBar color={pageBorder ? '#000000' : '#c0c0c0'} />
                  </span>
                }
                label="Viền trang"
                onClick={() => onPageBorderChange?.(pageBorder ? 0 : 3)}
              />
              <ColorDropdown
                title="Viền trang"
                colors={[]}
                items={[
                  { w: 0, label: 'Không viền' },
                  { w: 1, label: 'Mảnh (1px)' },
                  { w: 3, label: 'Đậm (3px)' },
                  { w: 6, label: 'Rất đậm (6px)' },
                ].map((it) => ({
                  label: it.label,
                  icon: <span className="rb-line-glyph" style={{ height: Math.max(1, it.w), opacity: it.w ? 1 : 0.25 }} aria-hidden="true" />,
                  active: (pageBorder ?? 0) === it.w,
                  onClick: () => onPageBorderChange?.(it.w),
                }))}
              />
            </div>
          </>
        ),
      },
      {
        id: 'layoutPara',
        label: 'Khoảng cách & thụt lề',
        render: () => (
          <div className="rb-col">
            <div className="rb-row">
              <label className="rb-inline-label">
                Trước
                <input
                  className="rb-num-input"
                  type="number"
                  min={0}
                  value={format.spaceBefore}
                  disabled={disabled}
                  onChange={(e) => live && applyFormatAttrs(live, { spaceBefore: Number(e.target.value) })}
                  aria-label="Khoảng cách trước đoạn"
                />
              </label>
              <label className="rb-inline-label">
                Sau
                <input
                  className="rb-num-input"
                  type="number"
                  min={0}
                  value={format.spaceAfter}
                  disabled={disabled}
                  onChange={(e) => live && applyFormatAttrs(live, { spaceAfter: Number(e.target.value) })}
                  aria-label="Khoảng cách sau đoạn"
                />
              </label>
            </div>
            <div className="rb-row">
              <label className="rb-inline-label">
                Thụt trái
                <input
                  className="rb-num-input"
                  type="number"
                  min={0}
                  value={format.indentLeft}
                  disabled={disabled}
                  onChange={(e) => live && applyFormatAttrs(live, { indentLeft: Number(e.target.value) })}
                  aria-label="Thụt lề trái"
                />
              </label>
              <label className="rb-inline-label">
                Dòng đầu
                <input
                  className="rb-num-input"
                  type="number"
                  value={format.indentFirstLine}
                  disabled={disabled}
                  onChange={(e) => live && applyFormatAttrs(live, { indentFirstLine: Number(e.target.value) })}
                  aria-label="Thụt dòng đầu"
                />
              </label>
            </div>
          </div>
        ),
      },
      {
        id: 'view',
        label: 'Hiển thị',
        render: () => (
          <div className="rb-row">
            <button type="button" className="rb-toggle" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange(Math.max(50, zoom - 10))} aria-label="Thu nhỏ">−</button>
            <span className="rb-zoom tnum">{zoom}%</span>
            <button type="button" className="rb-toggle" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange(Math.min(200, zoom + 10))} aria-label="Phóng to">+</button>
          </div>
        ),
      },
    ],
  }

  const activeGroups = groupsByTab[activeTab] ?? groupsByTab.home

  return (
    <div
      className="ribbon"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (live && target.closest('button')) syncDomSelection(live)
      }}
    >
      {layoutMode === 'phone' ? (
        <PhoneRibbon
          fileMenu={fileMenuEl}
          groupsByTab={groupsByTab}
          onSave={onSave}
          onUndo={() => chain()?.undo().run()}
          onRedo={() => chain()?.redo().run()}
          canUndo={canUndo}
          canRedo={canRedo}
          disabled={disabled}
          onOpenNav={onOpenNav}
          format={format}
          onToggleBold={() => chain()?.toggleBold().run()}
          onToggleItalic={() => chain()?.toggleItalic().run()}
          onToggleUnderline={() => chain()?.toggleUnderline().run()}
          penColor={penColor}
          onPickColor={(c) => {
            setPenColor(c)
            chain()?.setMark('textStyle', { color: c }).run()
          }}
          themeColors={THEME_COLORS}
          onInsertTemplate={insertTemplate}
          onIndentDec={() => live && applyFormatAttrs(live, { indentLeft: Math.max(0, format.indentLeft - 12) })}
          onIndentInc={() => live && applyFormatAttrs(live, { indentLeft: format.indentLeft + 12 })}
          onAlign={(a) => chain()?.setTextAlign(a).run()}
        />
      ) : (
        <>
          <RibbonTabs
            tabs={RIBBON_TABS}
            active={activeTab}
            onChange={handleTabChange}
            leading={
              <>
                {fileMenuEl}
                <span className="qa-sep" aria-hidden="true" />
                <button type="button" className="qa-btn" onClick={onSave} data-tip="Lưu đề" aria-label="Lưu đề">
                  <IconSave size={16} />
                </button>
                <button
                  type="button"
                  className="qa-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chain()?.undo().run()}
                  disabled={disabled || !canUndo}
                  data-tip="Hoàn tác"
                  aria-label="Hoàn tác"
                >
                  <IconUndo size={16} />
                </button>
                <button
                  type="button"
                  className="qa-btn"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chain()?.redo().run()}
                  disabled={disabled || !canRedo}
                  data-tip="Làm lại"
                  aria-label="Làm lại"
                >
                  <IconRedo size={16} />
                </button>
                <button type="button" className="qa-btn" onClick={onPrint} data-tip="In đề" aria-label="In đề">
                  <IconPrinter size={16} />
                </button>
                <span className="qa-sep" aria-hidden="true" />
              </>
            }
          >
            <span className="ribbon-tabs-spacer" />
            <div className="ribbon-quick">
              <span className="ribbon-quick__meta">
                {pageCount} trang{dirty ? ' · chưa lưu' : ''}
              </span>
              <button
                type="button"
                className="ribbon-toggle-btn"
                onClick={() => setCollapsed(!collapsed)}
                data-tip={collapsed ? 'Mở rộng dải ruy-băng' : 'Thu gọn dải ruy-băng'}
                aria-label={collapsed ? 'Mở rộng dải ruy-băng' : 'Thu gọn dải ruy-băng'}
              >
                {collapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
              </button>
            </div>
          </RibbonTabs>

          {!collapsed && (
            layoutMode === 'tablet' ? (
              <TabletRibbonBody activeKey={activeTab} groups={activeGroups} />
            ) : (
              <RibbonBody activeKey={activeTab}>
                {activeGroups.map((g, i) => (
                  <Fragment key={g.id}>
                    {i > 0 && <span className="ribbon-sep" />}
                    <RibbonGroup label={g.label}>{g.render()}</RibbonGroup>
                  </Fragment>
                ))}
              </RibbonBody>
            )
          )}
        </>
      )}

      {editor && dialog === 'link' && <LinkDialog editor={editor} onClose={() => setDialog(null)} />}
      {editor && dialog === 'equation' && <EquationDialog editor={editor} onClose={() => setDialog(null)} />}
      {editor && bankOpen && <BankModal editor={editor} onClose={() => setBankOpen(false)} />}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Color split button (font color / highlight / shading)
 * ------------------------------------------------------------------ */

function ColorBar({ color }: { color: string }) {
  return <span className="rb-color-bar" style={{ background: color }} />
}

/**
 * Nút "Khung kiểu" — mở popover liệt kê các kiểu đã có. Không dựng thêm
 * panel cố định: gallery ngay cạnh đã hiển thị kiểu, popover chỉ là cách
 * liệt kê đầy đủ (Word mở Styles pane, nhưng ở đân popover là đủ dùng).
 */
function StylePaneButton({
  disabled,
  onPick,
}: {
  disabled?: boolean
  onPick: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 180)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="rb-color-drop" ref={ref}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className="rb-icon"
        data-tip="Khung kiểu"
        aria-label="Khung kiểu"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <IconStylesPane size={16} />
      </button>
      {open && (
        <div className="rb-color-menu" style={{ ...popoverStyle(pos), minWidth: 180 }}>
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="rb-color-item"
              onClick={() => {
                onPick(s.id)
                setOpen(false)
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type BorderSide = 'top' | 'bottom' | 'left' | 'right' | 'box' | 'none'

/** hình nhỏ minh hoạ cạnh có viền, dùng trong menu Viền đoạn */
function BorderGlyph({ side }: { side: BorderSide }) {
  return <span className={cn('rb-border-glyph', `is-${side}`)} aria-hidden="true" />
}

const BORDER_ITEMS: Array<{ side: BorderSide; label: string }> = [
  { side: 'bottom', label: 'Viền dưới' },
  { side: 'top', label: 'Viền trên' },
  { side: 'left', label: 'Viền trái' },
  { side: 'right', label: 'Viền phải' },
  { side: 'box', label: 'Khung quanh đoạn' },
  { side: 'none', label: 'Không viền' },
]

/**
 * Nửa phải của nút tách (mũi tên): mở bảng màu và/hoặc danh sách lựa chọn.
 * Bảng có tiêu đề nói rõ đang chọn gì, ô màu đủ lớn để bấm, mục đang dùng có dấu tích.
 */
function ColorDropdown({
  title,
  colors,
  current,
  none,
  items,
  onPick,
  disabled,
}: {
  /** tiêu đề bảng + chú thích của mũi tên, vd "Màu tô sáng" */
  title: string
  colors: string[]
  /** màu đang dùng, để viền nổi ô tương ứng */
  current?: string
  /** mục bỏ màu đặt trên cùng, vd "Không tô sáng" */
  none?: { label: string; onClick: () => void }
  items?: Array<{ label: string; onClick: () => void; icon?: ReactNode; active?: boolean }>
  onPick?: (color: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open, 236)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const cur = current?.toLowerCase()

  return (
    <div className="rb-color-drop" ref={ref}>
      <button
        ref={triggerRef as React.RefObject<HTMLButtonElement>}
        type="button"
        className={cn('rb-color-caret', open && 'is-open')}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        data-tip={title}
        aria-label={title}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <IconCaret size={14} />
      </button>
      {open && (
        <div className="rb-color-menu" role="menu" aria-label={title} style={{ ...popoverStyle(pos), width: 'auto', minWidth: 196 }}>
          <div className="rb-color-menu__title">{title}</div>
          {none && (
            <button type="button" role="menuitem" className="rb-color-item" onMouseDown={(e) => e.preventDefault()} onClick={() => { none.onClick(); setOpen(false) }}>
              <span className="rb-color-none" aria-hidden="true" />
              <span className="rb-color-item__label">{none.label}</span>
            </button>
          )}
          {colors.length > 0 && (
            <div className="rb-color-grid">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn('rb-color-swatch', cur === c.toLowerCase() && 'is-current')}
                  style={{ background: c }}
                  data-tip={c}
                  aria-label={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onPick?.(c); setOpen(false) }}
                />
              ))}
            </div>
          )}
          {items?.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitemradio"
              aria-checked={!!it.active}
              className={cn('rb-color-item', it.active && 'is-active')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { it.onClick(); setOpen(false) }}
            >
              {it.icon}
              <span className="rb-color-item__label">{it.label}</span>
              {it.active ? <IconCheck size={13} /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { cn }
