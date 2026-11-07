/**
 * Độ khó của câu trong kho: Dễ / Trung bình / Khó.
 * Câu THPT có tag mức độ (NB, TH → Dễ; VD → Trung bình; VDC → Khó).
 * Câu cũ trong bank.ts / bankFigures.ts không có tag: mặc định theo loại câu, cộng bảng ghi đè đánh giá tay bên dưới.
 */
import type { BankEntry } from './bank'

export type BankLevel = 'de' | 'tb' | 'kho'

export const LEVEL_LABEL: Record<BankLevel, string> = { de: 'Dễ', tb: 'Trung bình', kho: 'Khó' }

/** Câu cũ: đánh giá từng câu, chỉ ghi những câu khác mức mặc định của loại câu. */
const OVERRIDE: Record<string, BankLevel> = {
  // trắc nghiệm mức trung bình
  'toan-l6-02': 'tb',
  'toan-l7-01': 'tb',
  'toan-l9-01': 'tb',
  'toan-l9-02': 'tb',
  'toan-l11-04': 'tb',
  'toan-l12-03': 'tb',
  'toan-l12-05': 'tb',
  'vl-07': 'tb',
  'vl-08': 'tb',
  'vl-10': 'tb',
  'vl-12': 'tb',
  'sh-07': 'tb',
  'ta-05': 'tb',
  'hinh-ly11-mach-01': 'tb',
  // tự luận dễ
  'toan-l9-08': 'de',
  'toan-l9-09': 'de',
  'toan-l10-07': 'de',
  'vl-13': 'de',
  'th-10': 'de',
  'nv-02': 'de',
  'nv-05': 'de',
  'tv-08': 'de',
  'dl-02': 'de',
  // tự luận khó
  'ls-03': 'kho',
  'dl-04': 'kho',
  'ls-06': 'kho',
  // tự luận mở rộng nhưng chỉ ở mức trung bình
  'toan-l12-09': 'tb',
  'nv-08': 'tb',
}

const BY_TAG: Record<string, BankLevel> = { NB: 'de', TH: 'de', VD: 'tb', VDC: 'kho' }

export function levelOf(entry: BankEntry): BankLevel {
  for (const t of entry.tags) if (BY_TAG[t]) return BY_TAG[t]
  if (OVERRIDE[entry.id]) return OVERRIDE[entry.id]
  if (entry.type === 'trac-nghiem') return 'de'
  if (entry.type === 'tu-luan-dong') return 'kho'
  return 'tb'
}
