import type { ChatTurn } from '../examEditor/AiPanel'

type HistoryTurn = Pick<ChatTurn, 'id' | 'role' | 'text' | 'intent' | 'sources' | 'webSources' | 'sourceNote' | 'error' | 'refs' | 'fileNames'>
const MAX_TURNS = 60

export const chatHistoryKey = (mode: 'exam' | 'slide', id: string) => `derou.ai-chat.${mode}.${id}`

export function encodeChatHistory(turns: ChatTurn[]): string {
  return JSON.stringify(turns
    .filter((turn) => !turn.pending && turn.planState !== 'pending' && turn.askState !== 'open')
    .slice(-MAX_TURNS)
    .map(({ id, role, text, intent, sources, webSources, sourceNote, error, refs, files, fileNames }): HistoryTurn => ({
      id, role, text, intent, sources, webSources, sourceNote, error, refs,
      fileNames: files?.map((file) => file.name) ?? fileNames,
    })))
}

const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object'
const asStrings = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
const asString = (value: unknown) => typeof value === 'string' ? value : undefined

export function decodeChatHistory(raw: string): HistoryTurn[] {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.slice(-MAX_TURNS).flatMap((turn: unknown): HistoryTurn[] => {
      if (!isObject(turn)) return []
      const { id, role, text, intent, webSources } = turn
      if (typeof id !== 'string' || typeof text !== 'string' || (role !== 'user' && role !== 'assistant')) return []
      return [{
        id, role, text,
        intent: intent === 'chat' || intent === 'doc' ? intent : undefined,
        sources: asStrings(turn.sources),
        webSources: Array.isArray(webSources)
          ? webSources.flatMap((item: unknown) =>
              isObject(item) && typeof item.url === 'string' && typeof item.title === 'string'
                ? [{ url: item.url, title: item.title }]
                : [])
          : undefined,
        sourceNote: asString(turn.sourceNote),
        error: asString(turn.error),
        refs: asStrings(turn.refs),
        fileNames: asStrings(turn.fileNames),
      }]
    })
  } catch {
    return []
  }
}

export function loadChatHistory(key: string): HistoryTurn[] {
  try {
    return decodeChatHistory(localStorage.getItem(key) ?? '')
  } catch {
    return []
  }
}

export function saveChatHistory(key: string, encoded: string) {
  try {
    localStorage.setItem(key, encoded)
  } catch {
    // Hết chỗ hoặc trình duyệt chặn lưu cục bộ.
  }
}

export function removeChatHistory(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // Trình duyệt chặn lưu cục bộ.
  }
}
