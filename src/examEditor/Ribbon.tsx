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
import { useEffect, useRef, useState, type CSSProperties } from 'react'
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
import { templateById } from './templates'
import { applyFormatAttrs, getSelectedBlock, syncDomSelection, type FormatState } from './formatState'
import { TablePicker, SymbolPicker, ImagePicker, EquationDialog, LinkDialog } from './InsertMenus'
import { Dropdown } from './Dropdown'
import { useAnchoredPopover, popoverStyle } from './useAnchoredPopover'
import { deleteCurrentTable, deleteCurrentTableColumn, deleteCurrentTableRow, deleteCurrentBlock } from './deleteActions'
import {
  IconAlignCenter,
  IconAlignJustify,
  IconAlignLeft,
  IconAlignRight,
  IconAnswerKey,
  IconBullets,
  IconBorderAll,
  IconCaret,
  IconChangeCase,
  IconClearFormat,
  IconCopy,
  IconCut,
  IconDirLtr,
  IconDirRtl,
  IconDoc,
  IconEssay,
  IconEquation,
  IconLink,
  IconFontColorA,
  IconFormatPainter,
  IconGrowFont,
  IconHeading,
  IconHighlight,
  IconIndentDec,
  IconIndentInc,
  IconMultilevel,
  IconNumbered,
  IconPageBreak,
  IconPaste,
  IconPilcrow,
  IconPrinter,
  IconPrintLayout,
  IconReplace,
  IconRubric,
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
  IconTextBox,
} from './icons'

export const RIBBON_TABS: RibbonTabDef[] = [
  { id: 'home', label: 'Trang chủ' },
  { id: 'insert', label: 'Chèn' },
  { id: 'layout', label: 'Bố cục' },
  { id: 'design', label: 'Thiết kế' },
  { id: 'doc', label: 'Tài liệu' },
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
  onSave,
  onPrint,
  onExportWord,
  onExportPdf,
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
}: {
  editor: Editor | null
  activeTab: string
  onTabChange: (id: string) => void
  onSave: () => void
  onPrint: () => void
  onExportWord: () => void
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
}) {
  const [font, setFont] = useState('Times New Roman')
  const [size, setSize] = useState('14')
  // "bút" màu nhớ lần chọn gần nhất — nút chính áp màu này, giống Word/GenOffice
  const [penHighlight, setPenHighlight] = useState('#ffff00')
  const [penColor, setPenColor] = useState('#000000')
  const [painter, setPainter] = useState(false)
  const [dialog, setDialog] = useState<'link' | 'equation' | null>(null)
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

  const insertTemplate = (id: string) => {
    const tpl = templateById(id)
    if (!tpl || !live) return
    syncDomSelection(live)
    // Chèn ở CẤP BLOCK. `insertContent` chèn tại con trỏ — nếu con trỏ đang ở
    // giữa một bullet/option, khối mẫu sẽ bị nhét vào trong node text và
    // schema báo "Invalid content for node examBullets".
    const target = getSelectedBlock(live)
    if (!target) {
      live.chain().focus().insertContent(tpl.build()).run()
      return
    }
    const at = target.pos + target.node.nodeSize
    live.chain().focus().insertContentAt(at, tpl.build()).run()
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

  return (
    <div
      className="ribbon"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement
        if (live && target.closest('button')) syncDomSelection(live)
      }}
    >
      <RibbonTabs tabs={RIBBON_TABS} active={activeTab} onChange={onTabChange}>
        <span className="ribbon-tabs-spacer" />
        <div className="ribbon-quick">
          <span className="ribbon-quick__meta">
            {pageCount} trang{dirty ? ' · chưa lưu' : ''}
          </span>
          <button type="button" className="ribbon-quick__btn" onClick={onSave} title="Lưu đề" aria-label="Lưu đề">
            <IconSave size={16} />
            Lưu
          </button>
          <button type="button" className="ribbon-quick__btn" onClick={onPrint} title="In đề" aria-label="In đề">
            <IconPrinter size={16} />
            In
          </button>
        </div>
      </RibbonTabs>

      <RibbonBody activeKey={activeTab}>
        {activeTab === 'home' && (
          <>
            <RibbonGroup label="Clipboard">
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
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Phông chữ">
              <div className="rb-font-group">
                <div className="rb-row">
                  <Dropdown
                    value={font}
                    options={FONTS.map((f) => ({ value: f, label: f, render: <span style={{ fontFamily: f }}>{f}</span> }))}
                    onPick={setFontFamily}
                    disabled={disabled}
                    ariaLabel="Phông chữ"
                    width={128}
                  />
                  <Dropdown
                    value={size}
                    options={FONT_SIZES.map((s) => ({ value: s, label: s }))}
                    onPick={setFontSize}
                    disabled={disabled}
                    ariaLabel="Cỡ chữ"
                    width={48}
                  />
                  <RibbonIconButton icon={<IconGrowFont size={16} />} title="Phóng to chữ" disabled={disabled} onClick={() => stepFontSize(1)} />
                  <RibbonIconButton icon={<IconShrinkFont size={16} />} title="Thu nhỏ chữ" disabled={disabled} onClick={() => stepFontSize(-1)} />
                  <span className="rb-mini-sep" />
                  <RibbonIconButton icon={<IconChangeCase size={16} />} title="Đổi kiểu chữ" disabled={disabled} onClick={() => applyCase('upper')} />
                  <RibbonIconButton icon={<IconClearFormat size={16} />} title="Xóa định dạng" disabled={disabled} onClick={clearFormatting} />
                </div>
                <div className="rb-row">
                  <button type="button" className={cn('rb-icon', format.bold && 'active')} title="Đậm" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleBold().run()}><b>B</b></button>
                  <button type="button" className={cn('rb-icon', format.italic && 'active')} title="Nghiêng" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleItalic().run()}><i>I</i></button>
                  <button type="button" className={cn('rb-icon', format.underline && 'active')} title="Gạch chân" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleUnderline().run()}><u>U</u></button>
                  <button type="button" className={cn('rb-icon', format.strike && 'active')} title="Gạch ngang" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => chain()?.toggleStrike().run()}><s>ab</s></button>
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
                      colors={HIGHLIGHTS}
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
                      colors={THEME_COLORS}
                      onPick={(c) => {
                        setPenColor(c)
                        chain()?.setMark('textStyle', { color: c }).run()
                      }}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Đoạn văn">
              <div className="rb-col">
                <div className="rb-row">
                  <RibbonIconButton icon={<IconBullets size={16} />} title="Danh sách gạch đầu dòng" disabled={disabled} onClick={() => insertTemplate('bullets')} />
                  <RibbonIconButton icon={<IconNumbered size={16} />} title="Danh sách đánh số" disabled={disabled} onClick={() => insertTemplate('question')} />
                  <RibbonIconButton icon={<IconMultilevel size={16} />} title="Danh sách nhiều cấp" disabled={disabled} onClick={() => insertTemplate('bullets')} />
                  <span className="rb-mini-sep" />
                  <RibbonIconButton icon={<IconIndentDec size={16} />} title="Giảm thụt lề" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { indentLeft: Math.max(0, format.indentLeft - 12) })} />
                  <RibbonIconButton icon={<IconIndentInc size={16} />} title="Tăng thụt lề" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { indentLeft: format.indentLeft + 12 })} />
                  <span className="rb-mini-sep" />
                  <RibbonIconButton icon={<IconPilcrow size={16} />} title="Hiện/ẩn ký tự định dạng" disabled={disabled} onClick={() => chain()?.setNode('paragraph').run()} />
                </div>
                <div className="rb-row">
                  <RibbonIconButton icon={<IconAlignLeft size={16} />} title="Căn trái" active={format.align === 'left'} disabled={disabled} onClick={() => chain()?.setTextAlign('left').run()} />
                  <RibbonIconButton icon={<IconAlignCenter size={16} />} title="Căn giữa" active={format.align === 'center'} disabled={disabled} onClick={() => chain()?.setTextAlign('center').run()} />
                  <RibbonIconButton icon={<IconAlignRight size={16} />} title="Căn phải" active={format.align === 'right'} disabled={disabled} onClick={() => chain()?.setTextAlign('right').run()} />
                  <RibbonIconButton icon={<IconAlignJustify size={16} />} title="Căn đều" active={format.align === 'justify'} disabled={disabled} onClick={() => chain()?.setTextAlign('justify').run()} />
                  <span className="rb-mini-sep" />
                  <RibbonIconButton icon={<IconDirLtr size={16} />} title="Trái sang phải" active={format.dir === 'ltr'} disabled={disabled} onClick={() => live && applyFormatAttrs(live, { dir: 'ltr' })} />
                  <RibbonIconButton icon={<IconDirRtl size={16} />} title="Phải sang trái" active={format.dir === 'rtl'} disabled={disabled} onClick={() => live && applyFormatAttrs(live, { dir: 'rtl' })} />
                  <span className="rb-mini-sep" />
                  <Dropdown
                    value={String(format.lineHeight)}
                    options={LINE_SPACING.map((l) => ({ value: l.value, label: l.label }))}
                    onPick={(v) => chain()?.setLineHeight(v).run()}
                    disabled={disabled}
                    ariaLabel="Giãn dòng"
                    width={52}
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
                    <ColorDropdown colors={THEME_COLORS} onPick={(c) => live && applyFormatAttrs(live, { shading: c })} disabled={disabled} />
                  </div>
                  <div className="rb-split">
                    <RibbonIconButton icon={<IconBorderAll size={16} />} title="Viền đoạn" disabled={disabled} onClick={() => live && applyFormatAttrs(live, { borders: format.borders === 'box' ? 'none' : 'box' })} />
                    <ColorDropdown
                      colors={[]}
                      items={[
                        { label: 'Trên', onClick: () => live && applyFormatAttrs(live, { borders: 'top' }) },
                        { label: 'Dưới', onClick: () => live && applyFormatAttrs(live, { borders: 'bottom' }) },
                        { label: 'Trái', onClick: () => live && applyFormatAttrs(live, { borders: 'left' }) },
                        { label: 'Phải', onClick: () => live && applyFormatAttrs(live, { borders: 'right' }) },
                        { label: 'Khung', onClick: () => live && applyFormatAttrs(live, { borders: 'box' }) },
                        { label: 'Không viền', onClick: () => live && applyFormatAttrs(live, { borders: 'none' }) },
                      ]}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Kiểu">
              <div className="rb-styles">
                {STYLE_PRESETS.map((s) => (
                  <button key={s.id} type="button" className="rb-style-card" disabled={disabled} title={s.label} onMouseDown={(e) => e.preventDefault()} onClick={() => applyStylePreset(s.id)}>
                    <span className="rb-style-card__preview" style={s.preview}>AaBbCcDd</span>
                    <span className="rb-style-card__label">{s.label}</span>
                  </button>
                ))}
                <StylePaneButton
                  disabled={disabled}
                  onPick={(id) => applyStylePreset(id)}
                />
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Chỉnh sửa">
              <div className="rb-col">
                <div className="rb-row">
                  <RibbonIconButton icon={<IconSearch size={16} />} title="Tìm" disabled={disabled} onClick={onFind} />
                  <RibbonIconButton icon={<IconReplace size={16} />} title="Thay thế" disabled={disabled} onClick={onReplace} />
                  <RibbonIconButton icon={<IconSelectAll size={16} />} title="Chọn tất cả" disabled={disabled} onClick={() => chain()?.selectAll().run()} />
                </div>
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Cỡ trang">
              <RibbonButton icon={<IconPrintLayout size={26} />} label="In" onClick={onPrint} />
              <RibbonButton icon={<IconDoc size={26} />} label="Tỉ lệ" onClick={() => onZoomChange(zoom === 100 ? 125 : 100)} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            <RibbonGroup label="Trang">
              <RibbonButton icon={<IconPageBreak size={26} />} label="Ngắt trang" disabled={disabled} onClick={() => insertTemplate('pageBreak')} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Bảng">
              <TablePicker editor={editor} disabled={disabled} />
              <RibbonButton icon={<IconAnswerKey size={26} />} label="Bảng đáp án" disabled={disabled} onClick={() => insertTemplate('answerKey')} />
              <RibbonButton icon={<IconRubric size={26} />} label="Thang điểm" disabled={disabled} onClick={() => insertTemplate('rubric')} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Xóa">
              <RibbonButton icon={<IconTableDelete size={26} />} label="Xóa bảng" disabled={disabled} onClick={() => live && deleteCurrentTable(live)} />
              <RibbonButton icon={<IconRowDelete size={26} />} label="Xóa hàng" disabled={disabled} onClick={() => live && deleteCurrentTableRow(live)} />
              <RibbonButton icon={<IconColDelete size={26} />} label="Xóa cột" disabled={disabled} onClick={() => live && deleteCurrentTableColumn(live)} />
              <RibbonButton icon={<IconTrash size={26} />} label="Xóa khối" disabled={disabled} onClick={() => live && deleteCurrentBlock(live)} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Minh họa">
              <ImagePicker editor={editor} disabled={disabled} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Câu hỏi">
              <RibbonButton icon={<IconNumbered size={26} />} label="Trắc nghiệm" disabled={disabled} onClick={() => insertTemplate('question')} />
              <RibbonButton icon={<IconEssay size={26} />} label="Tự luận" disabled={disabled} onClick={() => insertTemplate('essay')} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Khối">
              <RibbonButton icon={<IconTextBox size={26} />} label="Đoạn văn" disabled={disabled} onClick={() => insertTemplate('paragraph')} />
              <RibbonButton icon={<IconHeading size={26} />} label="Tiêu đề" disabled={disabled} onClick={() => insertTemplate('heading')} />
              <RibbonButton icon={<IconBullets size={26} />} label="Danh sách" disabled={disabled} onClick={() => insertTemplate('bullets')} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Liên kết">
              <RibbonButton icon={<IconLink size={26} />} label="Liên kết" disabled={disabled} onClick={() => setDialog('link')} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Ký hiệu">
              <SymbolPicker editor={editor} disabled={disabled} />
              <RibbonButton icon={<IconEquation size={26} />} label="Công thức" disabled={disabled} onClick={() => setDialog('equation')} />
            </RibbonGroup>
          </>
        )}

        {activeTab === 'layout' && (
          <>
            <RibbonGroup label="Thiết lập trang">
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
                    width={72}
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
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Đoạn văn">
              <div className="rb-col">
                <div className="rb-row">
                  <RibbonIconButton
                    icon={<IconIndentDec size={16} />}
                    title="Giảm thụt lề"
                    disabled={disabled}
                    onClick={() => live && applyFormatAttrs(live, { indentLeft: Math.max(0, format.indentLeft - 12) })}
                  />
                  <RibbonIconButton
                    icon={<IconIndentInc size={16} />}
                    title="Tăng thụt lề"
                    disabled={disabled}
                    onClick={() => live && applyFormatAttrs(live, { indentLeft: format.indentLeft + 12 })}
                  />
                  <span className="rb-mini-sep" />
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
                  <span className="rb-mini-sep" />
                  <label className="rb-inline-label">
                    Giãn dòng
                    <Dropdown
                      value={String(format.lineHeight)}
                      options={LINE_SPACING.map((l) => ({ value: l.value, label: l.label }))}
                      onPick={(v) => chain()?.setLineHeight(v).run()}
                      disabled={disabled}
                      ariaLabel="Giãn dòng"
                      width={52}
                    />
                  </label>
                </div>
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Ngắt">
              <div className="rb-col">
                <div className="rb-row">
                  <RibbonButton
                    icon={<IconPageBreak size={26} />}
                    label="Ngắt trang"
                    disabled={disabled}
                    onClick={() => insertTemplate('pageBreak')}
                  />
                </div>
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Hiển thị">
              <div className="rb-row">
                <button type="button" className="rb-toggle" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange(Math.max(50, zoom - 10))} aria-label="Thu nhỏ">−</button>
                <span className="rb-zoom tnum">{zoom}%</span>
                <button type="button" className="rb-toggle" onMouseDown={(e) => e.preventDefault()} onClick={() => onZoomChange(Math.min(200, zoom + 10))} aria-label="Phóng to">+</button>
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === 'design' && (
          <>
            <RibbonGroup label="Giao diện">
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
                  colors={[]}
                  items={[
                    { label: 'Không viền', onClick: () => onPageBorderChange?.(0) },
                    { label: 'Mảnh (1px)', onClick: () => onPageBorderChange?.(1) },
                    { label: 'Đậm (3px)', onClick: () => onPageBorderChange?.(3) },
                    { label: 'Rất đậm (6px)', onClick: () => onPageBorderChange?.(6) },
                  ]}
                />
              </div>
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Chữ">
              <div className="rb-font-group">
                <Dropdown
                  value={font}
                  options={FONTS.map((f) => ({ value: f, label: f, render: <span style={{ fontFamily: f }}>{f}</span> }))}
                  onPick={setFontFamily}
                  disabled={disabled}
                  ariaLabel="Phông chữ"
                  width={128}
                />
              </div>
            </RibbonGroup>
          </>
        )}

        {activeTab === 'doc' && (
          <>
            <RibbonGroup label="Tệp">
              <RibbonButton icon={<IconSave size={26} />} label="Lưu" onClick={onSave} />
              <RibbonButton icon={<IconDoc size={26} />} label="Xuất Word" onClick={onExportWord} />
              <RibbonButton icon={<IconPrintLayout size={26} />} label="Xuất PDF" onClick={onExportPdf} />
            </RibbonGroup>

            <span className="ribbon-sep" />

            <RibbonGroup label="Thông tin">
              <div className="rb-col">
                <span><b>Trang</b> {pageCount}</span>
                <span><b>Tỉ lệ</b> {zoom}%</span>
              </div>
            </RibbonGroup>
          </>
        )}
      </RibbonBody>

      {editor && dialog === 'link' && <LinkDialog editor={editor} onClose={() => setDialog(null)} />}
      {editor && dialog === 'equation' && <EquationDialog editor={editor} onClose={() => setDialog(null)} />}
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
        title="Khung kiểu"
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

function ColorDropdown({
  colors,
  items,
  onPick,
  disabled,
}: {
  colors: string[]
  items?: Array<{ label: string; onClick: () => void }>
  onPick?: (color: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { triggerRef, pos } = useAnchoredPopover(open)

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
        className="rb-color-caret"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title="Chọn màu"
        aria-label="Chọn màu"
      >
        <IconCaret size={14} />
      </button>
      {open && (
        <div className="rb-color-menu" style={{ ...popoverStyle(pos), width: 'auto', minWidth: 148 }}>
          {colors.length > 0 && (
            <div className="rb-color-grid">
              {colors.map((c) => (
                <button key={c} type="button" className="rb-color-swatch" style={{ background: c }} title={c} onClick={() => { onPick?.(c); setOpen(false) }} />
              ))}
            </div>
          )}
          {items?.map((it) => (
            <button key={it.label} type="button" className="rb-color-item" onClick={() => { it.onClick(); setOpen(false) }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { cn }
