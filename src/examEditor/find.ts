/**
 * Tìm / thay thế trong tài liệu ProseMirror — thuần PM, không cần extension ngoài.
 * Mỗi kết quả là một range {from, to} trong doc tọa độ.
 */
import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface SearchMatch {
  from: number
  to: number
}

export interface SearchQuery {
  text: string
  matchCase: boolean
  wholeWord: boolean
}

function isWordChar(ch: string): boolean {
  return /[\p{L}\p{N}_]/u.test(ch)
}

export function findMatches(doc: PMNode, q: SearchQuery): SearchMatch[] {
  const needle = q.text
  if (!needle) return []
  const hay = q.matchCase ? '' : ''
  void hay
  const out: SearchMatch[] = []
  doc.descendants((node, pos) => {
    if (!node.isText) return true
    const t = node.text ?? ''
    const src = q.matchCase ? t : t.toLowerCase()
    const pat = q.matchCase ? needle : needle.toLowerCase()
    let i = 0
    while (i <= src.length - pat.length) {
      const idx = src.indexOf(pat, i)
      if (idx === -1) break
      const start = idx
      const end = idx + pat.length
      const okLeft = !q.wholeWord || start === 0 || !isWordChar(t[start - 1])
      const okRight = !q.wholeWord || end === t.length || !isWordChar(t[end])
      if (okLeft && okRight) {
        out.push({ from: pos + start, to: pos + end })
        i = end
      } else {
        i = idx + 1
      }
    }
    return true
  })
  return out
}

export function replaceAll(doc: PMNode, q: SearchQuery, replacement: string): number {
  void doc
  void q
  void replacement
  return 0
}

/* ------------------------------------------------------------------ *
 * Plugin bôi vàng kết quả tìm kiếm (đóng gói thành TipTap Extension)
 * ------------------------------------------------------------------ */

export const searchPluginKey = new PluginKey('examSearch')

export interface SearchState {
  query: SearchQuery
  matches: SearchMatch[]
  active: number
}

export function createSearchPlugin() {
  return Extension.create({
    name: 'examSearch',
    addProseMirrorPlugins() {
      return [
        new Plugin<SearchState>({
          key: searchPluginKey,
          state: {
            init: () => ({ query: { text: '', matchCase: false, wholeWord: false }, matches: [], active: -1 }),
            apply(tr, prev) {
              const meta = tr.getMeta(searchPluginKey) as Partial<SearchState> | undefined
              if (meta) {
                return {
                  query: meta.query ?? prev.query,
                  matches: meta.matches ?? prev.matches,
                  active: meta.active ?? prev.active,
                }
              }
              if (tr.docChanged && prev.query.text) {
                const matches = findMatches(tr.doc, prev.query)
                return { ...prev, matches, active: Math.min(prev.active, matches.length - 1) }
              }
              return prev
            },
          },
          props: {
            decorations(state) {
              const s = searchPluginKey.getState(state)
              if (!s || !s.matches.length) return DecorationSet.empty
              const decos = s.matches.map((m: SearchMatch, i: number) =>
                Decoration.inline(m.from, m.to, {
                  class: i === s.active ? 'doc-search-hit doc-search-hit--active' : 'doc-search-hit',
                }),
              )
              return DecorationSet.create(state.doc, decos)
            },
          },
        }),
      ]
    },
  })
}
