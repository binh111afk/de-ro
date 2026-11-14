/**
 * Hệ thống Skin cho 8 bộ thiết kế slide.
 * Quyết định ngôn ngữ hình khối, kiểu chữ, khung viền, bo góc và motif lặp lại
 * để mỗi bộ khác biệt rõ rệt kể cả khi chuyển sang ảnh trắng đen.
 */
import type { DeckTheme, Slide, SlideElement, SlideTone } from '@/store/docs'
import {
  contentFromSlide,
  isDecorElement,
  isLayoutId,
  isLayoutOwnedId,
  isSkinDecorId,
  type SlideLayoutContent,
  type SlideLayoutId,
} from './slideLayouts'

/** Font web có đủ dấu tiếng Việt; máy nào cũng hiện giống nhau (không phụ thuộc font cài sẵn). */
const ROUNDED = 'Nunito'
const ACADEMIC_SERIF = 'Lora'

const uid = () => Math.random().toString(36).slice(2, 10)

export interface SlideSkinFonts {
  heading: string
  body: string
}

export interface SlideSkin {
  id: string
  name: string
  fonts: SlideSkinFonts
  /** Ngôn ngữ hình khối tóm tắt */
  geometrySummary: string
  /** Nền đặc trưng nếu cần ghi đè */
  getBackground?: (theme: DeckTheme, tone?: SlideTone) => string
  /** Dàn tay slide Tiêu đề riêng của bộ */
  createTitleSlide: (theme: DeckTheme, content: Partial<SlideLayoutContent>, index?: number, total?: number) => SlideElement[]
  /** Dàn tay slide Kết thúc riêng của bộ */
  createClosingSlide: (theme: DeckTheme, content: Partial<SlideLayoutContent>, index?: number, total?: number) => SlideElement[]
  /** Dàn tay slide Chuyển phần riêng nếu có */
  createSectionSlide?: (theme: DeckTheme, content: Partial<SlideLayoutContent>, index?: number, total?: number) => SlideElement[]
  /** Biến đổi các phần tử từ composeLayout và chèn motif đặc trưng của bộ */
  transformSlide: (
    elements: SlideElement[],
    theme: DeckTheme,
    layout: SlideLayoutId,
    slideIndex: number,
    totalSlides: number,
  ) => SlideElement[]
}

/* ------------------------------------------------------------------ *
 * BỘ 1: THANH LỊCH TỐI GIẢN (Swiss Minimalist)
 * Chữ không chân Be Vietnam Pro thanh thoát, lệch trục trái, vạch hairline mảnh,
 * số trang góc 01 / 07, góc vuông sắc sảo (radius: 0), khoảng trắng thoáng đãng.
 * ------------------------------------------------------------------ */
const skinThanhLich: SlideSkin = {
  id: 'thanh-lich',
  name: 'Thanh lịch tối giản',
  fonts: {
    heading: 'Be Vietnam Pro',
    body: 'Be Vietnam Pro',
  },
  geometrySummary: 'Bố cục Swiss lệch trục trái, khoảng trắng lớn, vạch hairline ngang siêu mảnh, số thứ tự tối giản góc trên (01 / 07), bo góc 0, không viền thẻ.',
  createTitleSlide: (theme, content, index = 0, total = 7) => [
    // Số thứ tự tối giản góc trên phải
    {
      id: 'skin-motif-index',
      type: 'text',
      x: 84,
      y: 6,
      w: 10,
      h: 4,
      text: `0${index + 1} / 0${total}`,
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 500,
      textColor: theme.muted ?? '#64748b',
      align: 'right',
      fontFamily: 'Be Vietnam Pro',
      letterSpacing: 0.08,
    },
    // Kicker thanh mảnh, in hoa, giãn chữ
    {
      id: 'kicker',
      type: 'text',
      x: 8,
      y: 22,
      w: 60,
      h: 5,
      text: (content.kicker || 'BÁO CÁO KHOA HỌC').toUpperCase(),
      variant: 'body',
      fontSize: 2.0,
      fontWeight: 600,
      textColor: theme.accent,
      fontFamily: 'Be Vietnam Pro',
      letterSpacing: 0.12,
    },
    // Tiêu đề cực to, lệch hẳn sang mép trái
    {
      id: 'title',
      type: 'text',
      x: 8,
      y: 29,
      w: 70,
      h: 28,
      text: content.title || 'Tiêu Đề Báo Cáo',
      variant: 'title',
      fontSize: 5.4,
      fontWeight: 600,
      textColor: theme.fg,
      fontFamily: 'Be Vietnam Pro',
      lineHeight: 1.15,
    },
    // Vạch hairline mảnh dưới tiêu đề
    {
      id: 'skin-motif-hairline',
      type: 'shape',
      shape: 'rect',
      x: 8,
      y: 59,
      w: 38,
      h: 0.35,
      fill: theme.accent,
    },
    // Phụ đề nhẹ nhàng bên dưới
    {
      id: 'subtitle',
      type: 'text',
      x: 8,
      y: 63,
      w: 62,
      h: 16,
      text: content.subtitle || 'Tóm tắt nội dung nghiên cứu và báo cáo phương pháp',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: theme.muted ?? '#475569',
      fontFamily: 'Be Vietnam Pro',
      lineHeight: 1.35,
    },
  ],
  createClosingSlide: (theme, content, index = 6, total = 7) => [
    {
      id: 'skin-motif-index',
      type: 'text',
      x: 84,
      y: 6,
      w: 10,
      h: 4,
      text: `0${index + 1} / 0${total}`,
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 500,
      textColor: theme.muted ?? '#64748b',
      align: 'right',
      fontFamily: 'Be Vietnam Pro',
      letterSpacing: 0.08,
    },
    {
      id: 'title',
      type: 'text',
      x: 8,
      y: 34,
      w: 75,
      h: 22,
      text: content.title || 'Xin Cảm Ơn',
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 600,
      textColor: theme.fg,
      fontFamily: 'Be Vietnam Pro',
    },
    {
      id: 'skin-motif-hairline',
      type: 'shape',
      shape: 'rect',
      x: 8,
      y: 58,
      w: 24,
      h: 0.35,
      fill: theme.accent,
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8,
      y: 62,
      w: 68,
      h: 14,
      text: content.subtitle || 'Rất mong nhận được câu hỏi và đóng góp từ quý thầy cô',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: theme.muted ?? '#475569',
      fontFamily: 'Be Vietnam Pro',
    },
  ],
  transformSlide: (elements, theme, _layout, slideIndex, totalSlides) => {
    const res: SlideElement[] = []
    let titleEl: SlideElement | undefined

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontFamily = 'Be Vietnam Pro'
          copy.fontWeight = 600
          titleEl = copy
        } else {
          copy.fontFamily = 'Be Vietnam Pro'
          if (copy.id === 'kicker') {
            copy.letterSpacing = 0.1
            copy.fontWeight = 600
          }
        }
      } else if (copy.type === 'shape') {
        // Tối giản: bỏ bo góc, bỏ bóng nặng
        copy.radius = 0
        copy.shadowLevel = 0
        if (copy.border && copy.border > 1.5) copy.border = 1
      }
      res.push(copy)
    }

    // Motif 1: Vạch hairline mảnh dưới tiêu đề nếu có
    if (titleEl && titleEl.y + titleEl.h <= 30) {
      res.push({
        id: 'skin-motif-hairline',
        type: 'shape',
        shape: 'rect',
        x: titleEl.x,
        y: titleEl.y + titleEl.h + 0.8,
        w: Math.min(titleEl.w, 42),
        h: 0.3,
        fill: theme.accent,
      })
    }

    // Motif 2: Số thứ tự trang tối giản góc dưới phải
    res.push({
      id: 'skin-motif-index',
      type: 'text',
      x: 88,
      y: 93,
      w: 9,
      h: 3.5,
      text: `0${slideIndex + 1} / 0${totalSlides}`,
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 500,
      textColor: theme.muted ?? '#64748b',
      align: 'right',
      fontFamily: 'Be Vietnam Pro',
      letterSpacing: 0.08,
    })

    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 2: TRẺ TRUNG NHIỀU MÀU (Playful Bubble)
 * Chữ tròn Nunito (có dấu tiếng Việt), tiêu đề căn giữa, sticker hình tròn nổi bồng bềnh,
 * thẻ dạng viên thuốc bo tròn lớn (radius: 26), badge mềm mại.
 * ------------------------------------------------------------------ */
const skinTreTrung: SlideSkin = {
  id: 'tre-trung',
  name: 'Trẻ trung nhiều màu',
  fonts: {
    heading: ROUNDED,
    body: ROUNDED,
  },
  geometrySummary: 'Bong bóng & viên thuốc (pill badge), tiêu đề căn giữa vui tươi, các chấm tròn sticker lơ lửng, thẻ bo tròn lớn (radius: 26).',
  createTitleSlide: (theme, content) => [
    // Sticker chấm tròn lơ lửng góc trái trên
    {
      id: 'skin-motif-dot-1',
      type: 'shape',
      shape: 'ellipse',
      x: 6,
      y: 8,
      w: 6,
      h: 10.67,
      fill: '#ec4899',
      opacity: 0.8,
    },
    // Sticker chấm tròn nhỏ góc phải trên
    {
      id: 'skin-motif-dot-2',
      type: 'shape',
      shape: 'ellipse',
      x: 88,
      y: 12,
      w: 4.5,
      h: 8.0,
      fill: theme.accent,
      opacity: 0.7,
    },
    // Kicker dạng viên thuốc bo tròn (pill container)
    {
      id: 'kicker-bg',
      type: 'shape',
      shape: 'round',
      x: 34,
      y: 16,
      w: 32,
      h: 7,
      radius: 20,
      fill: theme.accent,
    },
    {
      id: 'kicker',
      type: 'text',
      x: 34,
      y: 17,
      w: 32,
      h: 5,
      text: (content.kicker || 'KHÁM PHÁ THẾ GIỚI').toUpperCase(),
      variant: 'body',
      fontSize: 2.0,
      fontWeight: 800,
      textColor: '#ffffff',
      align: 'center',
      fontFamily: ROUNDED,
    },
    // Tiêu đề căn giữa, to tròn, đậm nét
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 28,
      w: 80,
      h: 28,
      text: content.title || 'Tiêu Đề Trẻ Trung',
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 800,
      textColor: theme.fg,
      align: 'center',
      fontFamily: ROUNDED,
      lineHeight: 1.2,
    },
    // Phụ đề thân thiện bên dưới
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 60,
      w: 70,
      h: 14,
      text: content.subtitle || 'Bài học sinh động và vui tươi dành cho các bạn nhỏ',
      variant: 'body',
      fontSize: 2.8,
      fontWeight: 600,
      textColor: theme.muted ?? '#6b21a8',
      align: 'center',
      fontFamily: ROUNDED,
    },
    // Sticker viên thuốc ngang dưới chân
    {
      id: 'skin-motif-pill-bottom',
      type: 'shape',
      shape: 'round',
      x: 45,
      y: 82,
      w: 10,
      h: 3,
      radius: 12,
      fill: '#ec4899',
      opacity: 0.85,
    },
  ],
  createClosingSlide: (theme, content) => [
    {
      id: 'skin-motif-dot-1',
      type: 'shape',
      shape: 'ellipse',
      x: 8,
      y: 14,
      w: 5,
      h: 8.89,
      fill: theme.accent,
      opacity: 0.75,
    },
    {
      id: 'skin-motif-dot-2',
      type: 'shape',
      shape: 'ellipse',
      x: 86,
      y: 16,
      w: 7,
      h: 12.44,
      fill: '#ec4899',
      opacity: 0.8,
    },
    {
      id: 'title',
      type: 'text',
      x: 12,
      y: 32,
      w: 76,
      h: 24,
      text: content.title || 'Cảm Ơn Các Bạn Nhỏ!',
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 800,
      textColor: theme.fg,
      align: 'center',
      fontFamily: ROUNDED,
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 60,
      w: 70,
      h: 14,
      text: content.subtitle || 'Hẹn gặp lại trong những chuyến phiêu lưu tiếp theo nhé!',
      variant: 'body',
      fontSize: 2.8,
      fontWeight: 600,
      textColor: theme.muted ?? '#6b21a8',
      align: 'center',
      fontFamily: ROUNDED,
    },
  ],
  transformSlide: (elements, theme) => {
    const res: SlideElement[] = []
    // Thêm 2 sticker chấm tròn đặc trưng ở góc trên
    res.push({
      id: 'skin-motif-bubble-1',
      type: 'shape',
      shape: 'ellipse',
      x: 3,
      y: 4,
      w: 3.5,
      h: 6.22,
      fill: theme.accent,
      opacity: 0.7,
    })
    res.push({
      id: 'skin-motif-bubble-2',
      type: 'shape',
      shape: 'ellipse',
      x: 93,
      y: 4,
      w: 4,
      h: 7.11,
      fill: '#ec4899',
      opacity: 0.7,
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        copy.fontFamily = ROUNDED
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontWeight = 800
        }
      } else if (copy.type === 'shape') {
        // Bo tròn thẻ dạng bubble
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 26
        copy.shadowLevel = 1
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 3: HỌC THUẬT NGHIÊM TÚC (Academic Structured)
 * Tiêu đề Lora có chân, thân Be Vietnam Pro, thanh dải màu ngang chạy hết bề rộng màn hình (w: 100%, h: 3.5%)
 * ở đỉnh mọi slide, góc vuông 0, khung bảng số La Mã [ I ], vạch nhấn đỏ dày cạnh trái.
 * ------------------------------------------------------------------ */
const skinHocThuat: SlideSkin = {
  id: 'hoc-thuat',
  name: 'Học thuật nghiêm túc',
  fonts: {
    heading: ACADEMIC_SERIF,
    body: 'Be Vietnam Pro',
  },
  // nền trắng ngà trung tính thay cho nền hồng của bảng màu Đỏ: đọc lâu không mỏi, hợp bài giảng
  getBackground: () => '#fdfcfa',
  geometrySummary: 'Dải màu ngang đỉnh slide chạy 100% bề rộng, khung chữ nhật sắc cạnh (radius: 0), nhãn số La Mã [ I ], vạch nhấn lề trái thẻ bài.',
  createTitleSlide: (theme, content) => [
    { id: 'skin-motif-topbar', type: 'shape', shape: 'rect', x: 0, y: 0, w: 100, h: 1.6, fill: theme.accent, radius: 0, shadowLevel: 0 },
    // cột nhấn mảnh bên trái, chạy theo khối chữ
    { id: 'title-left-accent', type: 'shape', shape: 'rect', x: 8, y: 26, w: 0.6, h: 40, fill: theme.accent, radius: 0, shadowLevel: 0 },
    {
      id: 'kicker', type: 'text', x: 11, y: 26, w: 80, h: 5,
      text: (content.kicker || 'Chuyên đề').toUpperCase(),
      variant: 'body', fontSize: 1.7, fontWeight: 700, textColor: theme.accent, fontFamily: 'Be Vietnam Pro', letterSpacing: 0.12,
    },
    {
      id: 'title', type: 'text', x: 11, y: 32, w: 80, h: 22,
      text: content.title || 'Tiêu đề bài giảng',
      variant: 'title', fontSize: 5.4, fontWeight: 700, textColor: theme.fg, fontFamily: ACADEMIC_SERIF, lineHeight: 1.15,
    },
    {
      id: 'subtitle', type: 'text', x: 11, y: 56, w: 70, h: 10,
      text: content.subtitle || 'Tài liệu giảng dạy dành cho học sinh THPT',
      variant: 'body', fontSize: 2.1, fontWeight: 400, textColor: theme.muted ?? '#475569', fontFamily: 'Be Vietnam Pro', lineHeight: 1.45,
    },
    // chân trang: vạch mảnh + nhãn nhỏ
    { id: 'skin-motif-footrule', type: 'shape', shape: 'rect', x: 8, y: 88, w: 84, h: 0.25, fill: theme.muted ?? '#94a3b8', opacity: 0.35, radius: 0, shadowLevel: 0 },
  ],
  createSectionSlide: (theme, content) => [
    { id: 'skin-motif-topbar', type: 'shape', shape: 'rect', x: 0, y: 0, w: 100, h: 1.6, fill: theme.accent, radius: 0, shadowLevel: 0 },
    {
      id: 'kicker', type: 'text', x: 8, y: 30, w: 30, h: 16,
      text: content.kicker || 'Phần 1',
      variant: 'title', fontSize: 6.5, fontWeight: 700, textColor: theme.accent, fontFamily: ACADEMIC_SERIF, lineHeight: 1,
    },
    { id: 'section-rule', type: 'shape', shape: 'rect', x: 8, y: 48, w: 10, h: 0.5, fill: theme.accent, radius: 0, shadowLevel: 0 },
    {
      id: 'title', type: 'text', x: 8, y: 52, w: 80, h: 16,
      text: content.title || 'Tên phần',
      variant: 'title', fontSize: 4.2, fontWeight: 700, textColor: theme.fg, fontFamily: ACADEMIC_SERIF, lineHeight: 1.2,
    },
    {
      id: 'subtitle', type: 'text', x: 8, y: 70, w: 70, h: 10,
      text: content.subtitle || '',
      variant: 'body', fontSize: 2, fontWeight: 400, textColor: theme.muted ?? '#475569', fontFamily: 'Be Vietnam Pro',
    },
  ],
  createClosingSlide: (theme, content) => [
    { id: 'skin-motif-topbar', type: 'shape', shape: 'rect', x: 0, y: 0, w: 100, h: 1.6, fill: theme.accent, radius: 0, shadowLevel: 0 },
    { id: 'closing-accent', type: 'shape', shape: 'rect', x: 8, y: 36, w: 0.6, h: 28, fill: theme.accent, radius: 0, shadowLevel: 0 },
    {
      id: 'title', type: 'text', x: 11, y: 36, w: 80, h: 16,
      text: content.title || 'Tổng kết',
      variant: 'title', fontSize: 4.8, fontWeight: 700, textColor: theme.fg, fontFamily: ACADEMIC_SERIF,
    },
    {
      id: 'subtitle', type: 'text', x: 11, y: 54, w: 70, h: 10,
      text: content.subtitle || 'Câu hỏi và thảo luận',
      variant: 'body', fontSize: 2.1, fontWeight: 400, textColor: theme.muted ?? '#475569', fontFamily: 'Be Vietnam Pro',
    },
  ],
  transformSlide: (elements, theme) => {
    const res: SlideElement[] = []
    // Motif lặp lại: Dải màu ngang đỉnh toàn màn hình
    res.push({
      id: 'skin-motif-topbar',
      type: 'shape',
      shape: 'rect',
      x: 0,
      y: 0,
      w: 100,
      h: 1.6,
      fill: theme.accent,
      radius: 0,
      shadowLevel: 0,
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        const isTitle = copy.variant === 'title' || copy.id === 'title'
        copy.fontFamily = isTitle ? ACADEMIC_SERIF : 'Be Vietnam Pro'
        if (isTitle) copy.fontWeight = 700
      } else if (copy.type === 'shape') {
        // Góc vuông học thuật sắc bén
        copy.radius = 0
        copy.shadowLevel = 0
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 4: THIÊN NHIÊN BENTO (Nature Split)
 * Segoe UI mềm mại nhân bản, dải cột dọc lề trái chạy 100% chiều cao màn hình,
 * cấu trúc chia đôi màn hình tự nhiên, thẻ bento bo góc vừa (radius: 18).
 * ------------------------------------------------------------------ */
const skinThienNhien: SlideSkin = {
  id: 'thien-nhien',
  name: 'Sinh thái thiên nhiên',
  fonts: {
    heading: 'Segoe UI',
    body: 'Segoe UI',
  },
  geometrySummary: 'Dải màu dọc cạnh trái màn hình (full-height sidebar), bố cục chia đôi màn hình, thẻ bento bo góc vừa (radius: 18).',
  createTitleSlide: (theme, content) => [
    // Khối màu xanh đặc chiếm trọn 30% cạnh trái
    {
      id: 'split-left-block',
      type: 'shape',
      shape: 'rect',
      x: 0,
      y: 0,
      w: 30,
      h: 100,
      fill: theme.accent,
      radius: 0,
    },
    // Chữ dọc hoặc biểu tượng ở khối trái
    {
      id: 'left-tag',
      type: 'text',
      x: 4,
      y: 42,
      w: 22,
      h: 16,
      text: 'SINH THÁI\n& TỰ NHIÊN',
      variant: 'body',
      fontSize: 2.2,
      fontWeight: 700,
      textColor: '#ffffff',
      align: 'center',
      fontFamily: 'Segoe UI',
      lineHeight: 1.3,
    },
    // Phần nội dung bên phải (70%)
    {
      id: 'kicker',
      type: 'text',
      x: 36,
      y: 22,
      w: 58,
      h: 5,
      text: (content.kicker || 'BẢO TỒN ĐA DẠNG').toUpperCase(),
      variant: 'body',
      fontSize: 2.0,
      fontWeight: 600,
      textColor: theme.accent,
      fontFamily: 'Segoe UI',
      letterSpacing: 0.08,
    },
    {
      id: 'title',
      type: 'text',
      x: 36,
      y: 30,
      w: 58,
      h: 30,
      text: content.title || 'Hệ Sinh Thái Rừng Nhiệt Đới',
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 700,
      textColor: theme.fg,
      fontFamily: 'Segoe UI',
      lineHeight: 1.2,
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 36,
      y: 63,
      w: 58,
      h: 16,
      text: content.subtitle || 'Tìm hiểu về chuỗi thức ăn, vai trò của thảm thực vật và bảo vệ nguồn nước',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: theme.muted ?? '#335340',
      fontFamily: 'Segoe UI',
    },
  ],
  createClosingSlide: (theme, content) => [
    {
      id: 'split-left-block',
      type: 'shape',
      shape: 'rect',
      x: 0,
      y: 0,
      w: 30,
      h: 100,
      fill: theme.accent,
      radius: 0,
    },
    {
      id: 'title',
      type: 'text',
      x: 36,
      y: 34,
      w: 58,
      h: 22,
      text: content.title || 'Cùng Chung Tay Bảo Vệ',
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 700,
      textColor: theme.fg,
      fontFamily: 'Segoe UI',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 36,
      y: 59,
      w: 58,
      h: 14,
      text: content.subtitle || 'Mỗi hành động nhỏ hôm nay đều góp phần giữ gìn màu xanh cho tương lai',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: theme.muted ?? '#335340',
      fontFamily: 'Segoe UI',
    },
  ],
  transformSlide: (elements, theme) => {
    const res: SlideElement[] = []
    // Motif lặp lại: Dải màu dọc cạnh trái màn hình (full-height sidebar band)
    res.push({
      id: 'skin-motif-leftbar',
      type: 'shape',
      shape: 'rect',
      x: 0,
      y: 0,
      w: 3.5,
      h: 100,
      fill: theme.accent,
      radius: 0,
    })

    for (const el of elements) {
      const copy = { ...el }
      // Dịch nhẹ các phần tử sát mép trái ra ngoài dải sidebar
      if (copy.x < 5.5) {
        const diff = 5.5 - copy.x
        copy.x = 5.5
        copy.w = Math.max(10, copy.w - diff)
      }
      if (copy.type === 'text') {
        copy.fontFamily = 'Segoe UI'
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontWeight = 700
        }
      } else if (copy.type === 'shape') {
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 18
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 5: CÔNG NGHỆ TƯƠNG LAI (Cyber Terminal HUD)
 * Nền tối, Courier New monospace tech, thanh HUD trên cùng // SYSTEM READY,
 * tiêu đề đặt trong dấu ngoặc vuông [ ARCHITECTURE ], góc công nghệ (radius: 2).
 * ------------------------------------------------------------------ */
const skinCongNghe: SlideSkin = {
  id: 'cong-nghe',
  name: 'Công nghệ tương lai',
  fonts: {
    heading: 'Courier New',
    body: 'Segoe UI',
  },
  geometrySummary: 'Màn hình terminal HUD nền tối, chữ monospace, thanh trạng thái // SYSTEM::ONLINE, tiêu đề trong ngoặc vuông [ HỆ THỐNG ], góc vuông công nghệ.',
  createTitleSlide: (theme, content) => [
    // Thanh HUD trạng thái hệ thống góc trên
    {
      id: 'skin-motif-hud',
      type: 'text',
      x: 6,
      y: 6,
      w: 88,
      h: 4,
      text: '// SYSTEM ARCHITECTURE v3.0 [ONLINE] :: TERMINAL_NODE_01',
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 700,
      textColor: theme.accent,
      fontFamily: 'Courier New',
      letterSpacing: 0.06,
    },
    // Kicker dạng lệnh terminal
    {
      id: 'kicker',
      type: 'text',
      x: 8,
      y: 20,
      w: 70,
      h: 5,
      text: `> EXECUTE: ${(content.kicker || 'SYS_MODULE').toUpperCase()}`,
      variant: 'body',
      fontSize: 2.0,
      fontWeight: 700,
      textColor: '#38bdf8',
      fontFamily: 'Courier New',
    },
    // Tiêu đề trong dấu ngoặc vuông
    {
      id: 'title',
      type: 'text',
      x: 8,
      y: 28,
      w: 84,
      h: 28,
      text: `[ ${content.title || 'KIẾN TRÚC HỆ THỐNG'} ]`,
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 700,
      textColor: '#ffffff',
      fontFamily: 'Courier New',
      lineHeight: 1.2,
    },
    // Vạch sáng neon ngăn cách
    {
      id: 'neon-line',
      type: 'shape',
      shape: 'rect',
      x: 8,
      y: 58,
      w: 84,
      h: 0.4,
      fill: theme.accent,
    },
    // Phụ đề
    {
      id: 'subtitle',
      type: 'text',
      x: 8,
      y: 62,
      w: 84,
      h: 14,
      text: content.subtitle || 'Mô hình phân tán, vi dịch vụ và xử lý luồng dữ liệu thời gian thực',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: '#94a3b8',
      fontFamily: 'Segoe UI',
    },
    // Footer lệnh shell
    {
      id: 'terminal-prompt',
      type: 'text',
      x: 8,
      y: 84,
      w: 84,
      h: 5,
      text: 'root@datacenter:~$ ./deploy_production.sh --all',
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 400,
      textColor: '#64748b',
      fontFamily: 'Courier New',
    },
  ],
  createClosingSlide: (theme, content) => [
    {
      id: 'skin-motif-hud',
      type: 'text',
      x: 6,
      y: 6,
      w: 88,
      h: 4,
      text: '// PROCESS COMPLETED :: EXIT CODE 0',
      variant: 'body',
      fontSize: 1.8,
      fontWeight: 700,
      textColor: theme.accent,
      fontFamily: 'Courier New',
      letterSpacing: 0.06,
    },
    {
      id: 'title',
      type: 'text',
      x: 8,
      y: 32,
      w: 84,
      h: 24,
      text: `[ ${content.title || 'KẾT THÚC PHIÊN LÀM VIỆC'} ]`,
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 700,
      textColor: '#ffffff',
      fontFamily: 'Courier New',
    },
    {
      id: 'neon-line',
      type: 'shape',
      shape: 'rect',
      x: 8,
      y: 58,
      w: 60,
      h: 0.4,
      fill: theme.accent,
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 8,
      y: 62,
      w: 84,
      h: 14,
      text: content.subtitle || 'Cảm ơn đã theo dõi phiên trình bày kiến trúc công nghệ',
      variant: 'body',
      fontSize: 2.5,
      fontWeight: 400,
      textColor: '#94a3b8',
      fontFamily: 'Segoe UI',
    },
  ],
  transformSlide: (elements, theme, _layout, slideIndex) => {
    const res: SlideElement[] = []
    // Motif lặp lại: HUD bar trên cùng
    res.push({
      id: 'skin-motif-hud',
      type: 'text',
      x: 6,
      y: 3,
      w: 88,
      h: 3.5,
      text: `// SYSTEM :: NODE_${slideIndex + 1} [ACTIVE]`,
      variant: 'body',
      fontSize: 1.6,
      fontWeight: 700,
      textColor: theme.accent,
      fontFamily: 'Courier New',
      letterSpacing: 0.06,
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontFamily = 'Courier New'
          copy.fontWeight = 700
        } else {
          copy.fontFamily = 'Segoe UI'
        }
      } else if (copy.type === 'shape') {
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 2
        copy.border = 1.2
        copy.borderColor = theme.accent
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 6: CỔ ĐIỂN TRANG NHÃ (Vintage Editorial)
 * Times New Roman thanh lịch, khung viền đôi (ornamental double frame: 95% x 95%),
 * tiêu đề căn giữa trang trọng, ký hiệu hoa văn ~ ❖ ~ phân tách cổ điển.
 * ------------------------------------------------------------------ */
const skinCoDien: SlideSkin = {
  id: 'co-dien',
  name: 'Cổ điển trang nhã',
  fonts: {
    heading: 'Times New Roman',
    body: 'Times New Roman',
  },
  geometrySummary: 'Khung viền đôi bao quanh toàn slide, chữ có chân Times New Roman căn giữa, hoa văn phân cách ~ ❖ ~, màu giấy ngả ấm.',
  createTitleSlide: (theme, content) => [
    // Khung viền đôi ngoài
    {
      id: 'skin-motif-outer-frame',
      type: 'shape',
      shape: 'rect',
      x: 2.5,
      y: 2.5,
      w: 95,
      h: 95,
      border: 2,
      borderColor: theme.accent,
      fill: 'transparent',
      radius: 0,
    },
    // Khung viền chỉ trong
    {
      id: 'skin-motif-inner-frame',
      type: 'shape',
      shape: 'rect',
      x: 3.8,
      y: 3.8,
      w: 92.4,
      h: 92.4,
      border: 0.8,
      borderColor: theme.muted ?? '#92400e',
      fill: 'transparent',
      radius: 0,
    },
    // Kicker văn học
    {
      id: 'kicker',
      type: 'text',
      x: 15,
      y: 16,
      w: 70,
      h: 6,
      text: `— ${content.kicker || 'LUẬN ĐỀ VĂN HỌC & LỊCH SỬ'} —`,
      variant: 'body',
      fontSize: 2.2,
      fontWeight: 700,
      textColor: theme.accent,
      align: 'center',
      fontFamily: 'Times New Roman',
      letterSpacing: 0.06,
    },
    // Hoa văn phân cách trên
    {
      id: 'flourish-top',
      type: 'text',
      x: 40,
      y: 23,
      w: 20,
      h: 4,
      text: '~ ❖ ~',
      variant: 'body',
      fontSize: 2.2,
      textColor: theme.muted ?? '#92400e',
      align: 'center',
      fontFamily: 'Times New Roman',
    },
    // Tiêu đề căn giữa có chân
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 29,
      w: 80,
      h: 28,
      text: content.title || 'Áng Văn Cổ Điển Việt Nam',
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 700,
      textColor: theme.fg,
      align: 'center',
      fontFamily: 'Times New Roman',
      lineHeight: 1.25,
    },
    // Hoa văn phân cách dưới
    {
      id: 'flourish-bot',
      type: 'text',
      x: 40,
      y: 59,
      w: 20,
      h: 4,
      text: '~ ❖ ~',
      variant: 'body',
      fontSize: 2.2,
      textColor: theme.muted ?? '#92400e',
      align: 'center',
      fontFamily: 'Times New Roman',
    },
    // Phụ đề chữ nghiêng
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 65,
      w: 70,
      h: 16,
      text: content.subtitle || 'Khảo cứu giá trị tư tưởng và nghệ thuật thi ca qua các thời kỳ',
      variant: 'body',
      fontSize: 2.6,
      fontStyle: 'italic',
      textColor: theme.muted ?? '#78350f',
      align: 'center',
      fontFamily: 'Times New Roman',
    },
  ],
  createClosingSlide: (theme, content) => [
    {
      id: 'skin-motif-outer-frame',
      type: 'shape',
      shape: 'rect',
      x: 2.5,
      y: 2.5,
      w: 95,
      h: 95,
      border: 2,
      borderColor: theme.accent,
      fill: 'transparent',
      radius: 0,
    },
    {
      id: 'skin-motif-inner-frame',
      type: 'shape',
      shape: 'rect',
      x: 3.8,
      y: 3.8,
      w: 92.4,
      h: 92.4,
      border: 0.8,
      borderColor: theme.muted ?? '#92400e',
      fill: 'transparent',
      radius: 0,
    },
    {
      id: 'flourish-top',
      type: 'text',
      x: 40,
      y: 28,
      w: 20,
      h: 4,
      text: '~ ❖ ~',
      variant: 'body',
      fontSize: 2.2,
      textColor: theme.muted ?? '#92400e',
      align: 'center',
      fontFamily: 'Times New Roman',
    },
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 35,
      w: 80,
      h: 22,
      text: content.title || 'Kính Chúc Thành Công',
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 700,
      textColor: theme.fg,
      align: 'center',
      fontFamily: 'Times New Roman',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 60,
      w: 70,
      h: 14,
      text: content.subtitle || 'Chân thành cảm ơn quý thầy cô và các bạn đã lắng nghe',
      variant: 'body',
      fontSize: 2.6,
      fontStyle: 'italic',
      textColor: theme.muted ?? '#78350f',
      align: 'center',
      fontFamily: 'Times New Roman',
    },
    {
      id: 'flourish-bot',
      type: 'text',
      x: 40,
      y: 76,
      w: 20,
      h: 4,
      text: '~ FIN ~',
      variant: 'body',
      fontSize: 2.0,
      textColor: theme.muted ?? '#92400e',
      align: 'center',
      fontFamily: 'Times New Roman',
      letterSpacing: 0.1,
    },
  ],
  transformSlide: (elements, theme) => {
    const res: SlideElement[] = []
    // Motif lặp lại: Khung viền đôi bao quanh toàn slide
    res.push({
      id: 'skin-motif-outer-frame',
      type: 'shape',
      shape: 'rect',
      x: 2.5,
      y: 2.5,
      w: 95,
      h: 95,
      border: 1.8,
      borderColor: theme.accent,
      fill: 'transparent',
      radius: 0,
    })
    res.push({
      id: 'skin-motif-inner-frame',
      type: 'shape',
      shape: 'rect',
      x: 3.6,
      y: 3.6,
      w: 92.8,
      h: 92.8,
      border: 0.8,
      borderColor: theme.muted ?? '#92400e',
      fill: 'transparent',
      radius: 0,
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        copy.fontFamily = 'Times New Roman'
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontWeight = 700
        }
      } else if (copy.type === 'shape') {
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 4
        copy.border = 1
        copy.borderColor = theme.muted ?? '#92400e'
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 7: VUI NHỘN HOẠT HÌNH (Neo-Brutalist Comic Pop)
 * Verdana cực đậm (weight 900), viền đen dày 3px, bóng khối cứng lệch đen (shadowLevel: 2),
 * sticker ngôi sao góc ★ HOT ★, hộp thẻ nổi bật cá tính.
 * ------------------------------------------------------------------ */
const skinVuiNhon: SlideSkin = {
  id: 'vui-nhon',
  name: 'Vui nhộn hoạt hình',
  fonts: {
    heading: 'Verdana',
    body: 'Verdana',
  },
  geometrySummary: 'Neo-brutalist phong cách truyện tranh: viền đen dày 3px, bóng cứng offset đen (shadowLevel: 2), sticker ngôi sao ★ POP ★, chữ Verdana cực đậm in hoa.',
  createTitleSlide: (theme, content) => [
    // Sticker ngôi sao góc trên
    {
      id: 'star-badge',
      type: 'shape',
      shape: 'round',
      x: 10,
      y: 12,
      w: 26,
      h: 8,
      border: 3,
      borderColor: '#000000',
      fill: '#fde047',
      radius: 6,
      shadowLevel: 2,
    },
    {
      id: 'kicker',
      type: 'text',
      x: 10,
      y: 13,
      w: 26,
      h: 6,
      text: (content.kicker || '★ ĐỐ VUI ★').toUpperCase(),
      variant: 'body',
      fontSize: 2.2,
      fontWeight: 900,
      textColor: '#000000',
      align: 'center',
      fontFamily: 'Verdana',
    },
    // Hộp tiêu đề chính neo-brutalist viền dày 3.5px bóng cứng
    {
      id: 'title-box',
      type: 'shape',
      shape: 'round',
      x: 10,
      y: 24,
      w: 80,
      h: 38,
      border: 3.5,
      borderColor: '#000000',
      fill: '#ffffff',
      radius: 8,
      shadowLevel: 2,
    },
    {
      id: 'title',
      type: 'text',
      x: 12,
      y: 27,
      w: 76,
      h: 32,
      text: (content.title || 'THỬ THÁCH TRÍ TUỆ').toUpperCase(),
      variant: 'title',
      fontSize: 5.2,
      fontWeight: 900,
      textColor: '#000000',
      fontFamily: 'Verdana',
      lineHeight: 1.2,
    },
    // Hộp phụ đề màu nhấn viền đen
    {
      id: 'sub-box',
      type: 'shape',
      shape: 'round',
      x: 10,
      y: 67,
      w: 72,
      h: 16,
      border: 2.5,
      borderColor: '#000000',
      fill: theme.accent,
      radius: 6,
      shadowLevel: 2,
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 12,
      y: 69,
      w: 68,
      h: 12,
      text: content.subtitle || 'Cùng tham gia tranh tài với những câu hỏi siêu hài hước và bổ ích',
      variant: 'body',
      fontSize: 2.4,
      fontWeight: 700,
      textColor: '#ffffff',
      fontFamily: 'Verdana',
    },
  ],
  createClosingSlide: (_theme, content) => [
    {
      id: 'closing-box',
      type: 'shape',
      shape: 'round',
      x: 12,
      y: 26,
      w: 76,
      h: 46,
      border: 3.5,
      borderColor: '#000000',
      fill: '#ffffff',
      radius: 8,
      shadowLevel: 2,
    },
    {
      id: 'title',
      type: 'text',
      x: 14,
      y: 31,
      w: 72,
      h: 20,
      text: (content.title || 'CHIẾN THẮNG RỰC RỠ!').toUpperCase(),
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 900,
      textColor: '#000000',
      align: 'center',
      fontFamily: 'Verdana',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 16,
      y: 53,
      w: 68,
      h: 14,
      text: content.subtitle || 'Bạn đã hoàn thành xuất sắc thử thách hôm nay! Xin chúc mừng!',
      variant: 'body',
      fontSize: 2.4,
      fontWeight: 700,
      textColor: '#000000',
      align: 'center',
      fontFamily: 'Verdana',
    },
  ],
  transformSlide: (elements) => {
    const res: SlideElement[] = []
    // Motif lặp lại: Sticker ngôi sao neo-brutalist góc dưới phải
    res.push({
      id: 'skin-motif-badge',
      type: 'text',
      x: 87,
      y: 92.5,
      w: 10,
      h: 4.5,
      text: '★ POP ★',
      variant: 'body',
      fontSize: 1.6,
      fontWeight: 900,
      textColor: '#000000',
      fill: '#fde047',
      border: 2,
      borderColor: '#000000',
      radius: 4,
      align: 'center',
      fontFamily: 'Verdana',
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        copy.fontFamily = 'Verdana'
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontWeight = 900
        } else {
          copy.fontWeight = 700
        }
      } else if (copy.type === 'shape') {
        // Viền dày 3px và bóng cứng offset kiểu neo-brutalist
        copy.border = 3
        copy.borderColor = '#000000'
        copy.shadowLevel = 2
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 8
      }
      res.push(copy)
    }
    return res
  },
}

/* ------------------------------------------------------------------ *
 * BỘ 8: BẢNG ĐEN PHẤN TRẮNG (Classroom Chalkboard)
 * Nền bảng đen sâu, Tahoma dễ đọc như chữ viết phấn, khung viền gỗ/phấn quanh slide,
 * vạch phấn gạch chân nét đứt (borderStyle: 'dashed'), các hộp bài tập đóng khung phấn.
 * ------------------------------------------------------------------ */
const skinBangDen: SlideSkin = {
  id: 'bang-den',
  name: 'Bảng đen phấn trắng',
  fonts: {
    heading: 'Tahoma',
    body: 'Tahoma',
  },
  geometrySummary: 'Khung viền bảng gỗ quanh slide, nét phấn đứt đoạn (dashed) dưới tiêu đề và quanh thẻ, phong cách phấn trắng trên nền bảng tối.',
  createTitleSlide: (_theme, content) => [
    // Khung viền gỗ bên ngoài của bảng
    {
      id: 'skin-motif-chalk-frame',
      type: 'shape',
      shape: 'round',
      x: 1.5,
      y: 1.5,
      w: 97,
      h: 97,
      border: 5,
      borderColor: '#92400e', // viền gỗ nâu
      fill: 'transparent',
      radius: 4,
    },
    // Đường viền nét đứt phấn bên trong
    {
      id: 'skin-motif-chalk-inner',
      type: 'shape',
      shape: 'round',
      x: 2.8,
      y: 2.8,
      w: 94.4,
      h: 94.4,
      border: 1.5,
      borderStyle: 'dashed',
      borderColor: '#e2e8f0',
      fill: 'transparent',
      radius: 2,
    },
    // Tiêu đề môn học viết phấn vàng
    {
      id: 'kicker',
      type: 'text',
      x: 10,
      y: 16,
      w: 80,
      h: 6,
      text: (content.kicker || 'TIẾT HỌC HÔM NAY — BÀI GIẢNG TRÊN LỚP').toUpperCase(),
      variant: 'body',
      fontSize: 2.0,
      fontWeight: 700,
      textColor: '#fef08a',
      align: 'center',
      fontFamily: 'Tahoma',
      letterSpacing: 0.08,
    },
    // Tiêu đề phấn trắng
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 26,
      w: 80,
      h: 26,
      text: content.title || 'Định Lý & Bài Tập Thực Hành',
      variant: 'title',
      fontSize: 5.0,
      fontWeight: 700,
      textColor: '#ffffff',
      align: 'center',
      fontFamily: 'Tahoma',
      lineHeight: 1.25,
    },
    // Gạch chân nét đứt kiểu phấn dưới tiêu đề
    {
      id: 'chalk-line',
      type: 'shape',
      shape: 'rect',
      x: 25,
      y: 55,
      w: 50,
      h: 0.4,
      border: 1.5,
      borderStyle: 'dashed',
      borderColor: '#ffffff',
    },
    // Phụ đề phấn nhạt
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 61,
      w: 70,
      h: 16,
      text: content.subtitle || 'Hệ thống công thức, phương pháp giải toán và các ví dụ minh hoạ chi tiết',
      variant: 'body',
      fontSize: 2.6,
      fontWeight: 400,
      textColor: '#e2e8f0',
      align: 'center',
      fontFamily: 'Tahoma',
    },
  ],
  createClosingSlide: (_theme, content) => [
    {
      id: 'skin-motif-chalk-frame',
      type: 'shape',
      shape: 'round',
      x: 1.5,
      y: 1.5,
      w: 97,
      h: 97,
      border: 5,
      borderColor: '#92400e',
      fill: 'transparent',
      radius: 4,
    },
    {
      id: 'skin-motif-chalk-inner',
      type: 'shape',
      shape: 'round',
      x: 2.8,
      y: 2.8,
      w: 94.4,
      h: 94.4,
      border: 1.5,
      borderStyle: 'dashed',
      borderColor: '#e2e8f0',
      fill: 'transparent',
      radius: 2,
    },
    {
      id: 'title',
      type: 'text',
      x: 10,
      y: 32,
      w: 80,
      h: 22,
      text: content.title || 'Hết Giờ — Dặn Dò Về Nhà',
      variant: 'title',
      fontSize: 4.8,
      fontWeight: 700,
      textColor: '#ffffff',
      align: 'center',
      fontFamily: 'Tahoma',
    },
    {
      id: 'chalk-line',
      type: 'shape',
      shape: 'rect',
      x: 30,
      y: 57,
      w: 40,
      h: 0.4,
      border: 1.5,
      borderStyle: 'dashed',
      borderColor: '#fef08a',
    },
    {
      id: 'subtitle',
      type: 'text',
      x: 15,
      y: 62,
      w: 70,
      h: 14,
      text: content.subtitle || 'Làm bài tập trang 42 trong SGK và chuẩn bị bài mới cho tiết sau',
      variant: 'body',
      fontSize: 2.6,
      fontWeight: 400,
      textColor: '#e2e8f0',
      align: 'center',
      fontFamily: 'Tahoma',
    },
  ],
  transformSlide: (elements) => {
    const res: SlideElement[] = []
    // Motif lặp lại: Khung bảng gỗ
    res.push({
      id: 'skin-motif-chalk-frame',
      type: 'shape',
      shape: 'round',
      x: 1.5,
      y: 1.5,
      w: 97,
      h: 97,
      border: 4.5,
      borderColor: '#92400e',
      fill: 'transparent',
      radius: 4,
    })

    for (const el of elements) {
      const copy = { ...el }
      if (copy.type === 'text') {
        copy.fontFamily = 'Tahoma'
        if (copy.variant === 'title' || copy.id === 'title') {
          copy.fontWeight = 700
        }
      } else if (copy.type === 'shape') {
        // Viền nét đứt phấn trắng
        copy.border = 1.8
        copy.borderStyle = 'dashed'
        copy.borderColor = '#cbd5e1'
        if (!copy.shape || copy.shape === 'rect') copy.shape = 'round'
        copy.radius = 6
      }
      res.push(copy)
    }
    return res
  },
}

export const SLIDE_SKINS: Record<string, SlideSkin> = {
  'thanh-lich': skinThanhLich,
  'tre-trung': skinTreTrung,
  'hoc-thuat': skinHocThuat,
  'thien-nhien': skinThienNhien,
  'cong-nghe': skinCongNghe,
  'co-dien': skinCoDien,
  'vui-nhon': skinVuiNhon,
  'bang-den': skinBangDen,
}

export function skinById(id: string | undefined): SlideSkin | undefined {
  if (!id) return undefined
  return SLIDE_SKINS[id]
}

/**
 * Trả về theme đã được ghi đè phông chữ đặc trưng của Skin
 */
export function themeWithSkinFonts(theme: DeckTheme, skin: SlideSkin): DeckTheme {
  return {
    ...theme,
    fontHeading: skin.fonts.heading,
    fontBody: skin.fonts.body,
    fonts: {
      heading: skin.fonts.heading,
      body: skin.fonts.body,
      serif: skin.fonts.heading.includes('Times') ? skin.fonts.heading : (theme.fonts?.serif ?? "'Times New Roman', serif"),
      mono: skin.fonts.heading.includes('Courier') ? skin.fonts.heading : (theme.fonts?.mono ?? 'monospace'),
    },
  }
}

/**
 * Áp Skin lên một slide đã dựng.
 * - Title: dùng layout tự dàn tay riêng biệt của bộ
 * - Closing: dùng layout tự dàn tay riêng biệt của bộ
 * - Các layout khác: biến đổi theo ngôn ngữ hình khối + chèn motif
 */
export function applySkin(
  slide: Slide,
  designId: string | undefined,
  theme: DeckTheme,
  slideIndex = 0,
  totalSlides = 7,
): Slide {
  if (!designId || slide.html) return slide
  // Slide freeform (không có layout) giữ nguyên các phần tử, chỉ đổi nền khi không có customBg
  if (!slide.layout || !isLayoutId(slide.layout)) return slide
  const skin = SLIDE_SKINS[designId]
  if (!skin) return slide

  const userAdded = slide.elements.filter((el) => !isDecorElement(el) && !isLayoutOwnedId(el.id))
  const layoutEls = slide.elements.filter((el) => !isDecorElement(el) && isLayoutOwnedId(el.id))
  const content = contentFromSlide({ ...slide, elements: layoutEls })

  let nextSlide = slide
  if (skin.getBackground && !slide.customBg) nextSlide = { ...slide, background: skin.getBackground(theme, slide.tone) }

  const finalize = (els: SlideElement[]): SlideElement[] => {
    const decorated = els.map((el) => ({
      ...el,
      id: el.id || uid(),
      ...(isSkinDecorId(el.id) ? { decor: true } : {}),
    }))
    // Không nhân bản ảnh/bảng/đồ hoạ người dùng nếu layout đã dựng phần tử tương ứng từ contentFromSlide
    const keptUser = userAdded.filter((el) => {
      if (el.type === 'image' && decorated.some((e) => e.type === 'image' && e.src === el.src)) return false
      if (el.type === 'table' && decorated.some((e) => e.type === 'table')) return false
      if (el.type === 'graphic' && decorated.some((e) => e.type === 'graphic' && e.graphicId === el.graphicId)) return false
      return true
    })
    return [...decorated, ...keptUser]
  }

  if (slide.layout === 'title') {
    const customElements = skin.createTitleSlide(theme, content, slideIndex, totalSlides)
    return {
      ...nextSlide,
      elements: finalize(customElements),
    }
  }

  if (slide.layout === 'closing') {
    const customElements = skin.createClosingSlide(theme, content, slideIndex, totalSlides)
    return {
      ...nextSlide,
      elements: finalize(customElements),
    }
  }

  if (slide.layout === 'section' && skin.createSectionSlide) {
    const customElements = skin.createSectionSlide(theme, content, slideIndex, totalSlides)
    return {
      ...nextSlide,
      elements: finalize(customElements),
    }
  }

  // Layout nội dung thông thường: biến đổi phần tử + chèn motif (không đụng phần tử người dùng tự thêm)
  const transformed = skin.transformSlide(
    layoutEls,
    theme,
    slide.layout,
    slideIndex,
    totalSlides,
  )

  return {
    ...nextSlide,
    elements: finalize(transformed),
  }
}
