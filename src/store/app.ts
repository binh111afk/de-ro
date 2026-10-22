import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exam, Question, Section } from '@/data/types'
import { pickQuestions, type BankEntry } from '@/data/bank'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
  /** step labels the AI is currently "doing" */
  steps?: string[]
  done?: boolean
  createdAt: number
}

export interface DraftMeta {
  title: string
  school: string
  year: string
  term: string
  subject: string
  grade: string
  durationMinutes: number
}

type Mode = 'compose' | 'quiz' | 'grade'

interface AppState {
  /** exams the teacher owns */
  myExams: Exam[]
  /** exam currently open in the composer */
  draft: Exam | null
  chat: ChatMessage[]
  mode: Mode
  /** the exam currently being taken as an interactive quiz */
  activeQuizId: string | null
  quizAnswers: Record<string, string>
  quizStartedAt: number | null
  quizRemaining: number | null
  quizSubmitted: boolean
  /** last graded result */
  lastResult: { examId: string; score: number; total: number; at: number } | null

  setMode: (m: Mode) => void
  createDraft: (meta: DraftMeta) => void
  seedQuestions: (count: number, type?: 'trac-nghiem' | 'tu-luan' | 'mixed') => void
  updateDraftMeta: (patch: Partial<DraftMeta>) => void
  renameDraft: (title: string) => void
  setDraft: (exam: Exam | null) => void
  addQuestion: (q: Question, sectionId?: string) => void
  updateQuestion: (id: string, patch: Partial<Question>) => void
  removeQuestion: (id: string) => void
  addSection: (title: string) => void
  removeSection: (id: string) => void
  updateSection: (id: string, patch: Partial<Section>) => void
  reorderQuestion: (id: string, dir: -1 | 1) => void
  shuffleQuestions: () => void

  pushChat: (m: Omit<ChatMessage, 'id' | 'createdAt'>) => string
  updateChat: (id: string, patch: Partial<ChatMessage>) => void
  clearChat: () => void

  publishDraft: () => void
  duplicateExam: (id: string) => void
  deleteExam: (id: string) => void
  toggleShared: (id: string) => void
  importExam: (exam: Exam) => string

  startQuiz: (examId: string) => void
  setAnswer: (questionId: string, value: string) => void
  setRemaining: (s: number) => void
  submitQuiz: () => void
  resetQuiz: () => void
  setQuizSubmitted: (v: boolean) => void
}

const uid = () => Math.random().toString(36).slice(2, 10)

function blankExam(meta: DraftMeta): Exam {
  return {
    id: uid(),
    title: meta.title,
    subject: meta.subject as Exam['subject'],
    grade: meta.grade,
    school: meta.school,
    year: meta.year,
    term: meta.term,
    durationMinutes: meta.durationMinutes,
    interactive: true,
    sections: [
      {
        id: uid(),
        title: 'PHẦN I. TRẮC NGHIỆM',
        points: 0,
        questions: [],
      },
    ],
    author: 'Bạn',
    createdAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    shared: false,
  }
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      myExams: [],
      draft: null,
      chat: [],
      mode: 'compose',
      activeQuizId: null,
      quizAnswers: {},
      quizStartedAt: null,
      quizRemaining: null,
      quizSubmitted: false,
      lastResult: null,

      setMode: (mode) => set({ mode }),

      createDraft: (meta) =>
        set({
          draft: blankExam(meta),
          chat: [],
          mode: 'compose',
        }),

      updateDraftMeta: (patch) =>
        set((s) =>
          s.draft
            ? {
                draft: {
                  ...s.draft,
                  ...patch,
                  subject: (patch.subject ?? s.draft.subject) as Exam['subject'],
                },
              }
            : {},
        ),

      seedQuestions: (count, type = 'mixed') =>
        set((s) => {
          if (!s.draft) return s
          const picked = pickQuestions({
            subject: s.draft.subject,
            grade: s.draft.grade,
            type: type === 'mixed' ? undefined : type,
            count,
          })
          if (!picked.length) return s

          const mcq = picked.filter((e) => e.type === 'trac-nghiem')
          const essay = picked.filter((e) => e.type !== 'trac-nghiem')

          const sections = s.draft.sections.map((sec) => ({ ...sec, questions: [...sec.questions] }))
          const s1 = sections[0]
          const s2 = sections[1]

          if (s1 && mcq.length) {
            const start = s1.questions.length
            s1.questions = [...s1.questions, ...mcq.map((e, i) => bankToQuestion(e, start + i + 1))]
          }

          const target = s2 ?? s1
          if (target && essay.length) {
            const start = target.questions.length
            target.questions = [
              ...target.questions,
              ...essay.map((e, i) => bankToQuestion(e, start + i + 1)),
            ]
          }

          return { draft: { ...s.draft, sections: renumber(sections) } }
        }),

      renameDraft: (title) =>
        set((s) => (s.draft ? { draft: { ...s.draft, title } } : s)),

      setDraft: (draft) => set({ draft }),

      addQuestion: (q, sectionId) =>
        set((s) => {
          if (!s.draft) return s
          const sections = renumber(
            s.draft.sections.map((sec) => {
              const isTarget = sectionId ? sec.id === sectionId : sec.id === s.draft!.sections[0].id
              if (!isTarget) return sec
              return { ...sec, questions: [...sec.questions, q] }
            }),
          )
          return { draft: { ...s.draft, sections } }
        }),

      updateQuestion: (id, patch) =>
        set((s) => {
          if (!s.draft) return s
          return {
            draft: {
              ...s.draft,
              sections: s.draft.sections.map((sec) => ({
                ...sec,
                questions: sec.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)),
              })),
            },
          }
        }),

      removeQuestion: (id) =>
        set((s) => {
          if (!s.draft) return s
          return {
            draft: {
              ...s.draft,
              sections: renumber(
                s.draft.sections.map((sec) => ({
                  ...sec,
                  questions: sec.questions.filter((q) => q.id !== id),
                })),
              ),
            },
          }
        }),

      addSection: (title) =>
        set((s) => {
          if (!s.draft) return s
          return {
            draft: {
              ...s.draft,
              sections: [
                ...s.draft.sections,
                { id: uid(), title, points: 0, questions: [] },
              ],
            },
          }
        }),

      removeSection: (id) =>
        set((s) => {
          if (!s.draft) return s
          if (s.draft.sections.length <= 1) return s
          return {
            draft: {
              ...s.draft,
              sections: s.draft.sections.filter((sec) => sec.id !== id),
            },
          }
        }),

      updateSection: (id, patch) =>
        set((s) => {
          if (!s.draft) return s
          return {
            draft: {
              ...s.draft,
              sections: s.draft.sections.map((sec) =>
                sec.id === id ? { ...sec, ...patch } : sec,
              ),
            },
          }
        }),

      reorderQuestion: (id, dir) =>
        set((s) => {
          if (!s.draft) return s
          return {
            draft: {
              ...s.draft,
              sections: renumber(
                s.draft.sections.map((sec) => {
                  const idx = sec.questions.findIndex((q) => q.id === id)
                  if (idx === -1) return sec
                  const target = idx + dir
                  if (target < 0 || target >= sec.questions.length) return sec
                  const questions = [...sec.questions]
                  const [item] = questions.splice(idx, 1)
                  questions.splice(target, 0, item)
                  return { ...sec, questions }
                }),
              ),
            },
          }
        }),

      shuffleQuestions: () =>
        set((s) => {
          if (!s.draft) return s
          const sections = s.draft.sections.map((sec) => ({
            ...sec,
            // Fisher–Yates so the order is a real permutation
            questions: sec.questions
              .map((q) => ({ q, sort: Math.random() }))
              .sort((a, b) => a.sort - b.sort)
              .map(({ q }) => q),
          }))
          return { draft: { ...s.draft, sections: renumber(sections) } }
        }),

      pushChat: (m) => {
        const id = uid()
        set((s) => ({
          chat: [...s.chat, { ...m, id, createdAt: Date.now() }],
        }))
        return id
      },

      updateChat: (id, patch) =>
        set((s) => ({
          chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),

      clearChat: () => set({ chat: [] }),

      publishDraft: () =>
        set((s) => {
          if (!s.draft) return s
          const exam = { ...s.draft, shared: true, createdAt: new Date().toISOString() }
          const exists = s.myExams.some((e) => e.id === exam.id)
          return {
            myExams: exists
              ? s.myExams.map((e) => (e.id === exam.id ? exam : e))
              : [exam, ...s.myExams],
            draft: exam,
          }
        }),

      duplicateExam: (id) =>
        set((s) => {
          const src = s.myExams.find((e) => e.id === id)
          if (!src) return s
          const copy: Exam = {
            ...src,
            id: uid(),
            title: `${src.title} (bản sao)`,
            createdAt: new Date().toISOString(),
            shared: false,
            views: 0,
            likes: 0,
            sections: src.sections.map((sec) => ({
              ...sec,
              id: uid(),
              questions: sec.questions.map((q) => ({ ...q, id: uid() })),
            })),
          }
          return { myExams: [copy, ...s.myExams] }
        }),

      deleteExam: (id) =>
        set((s) => ({ myExams: s.myExams.filter((e) => e.id !== id) })),

      toggleShared: (id) =>
        set((s) => ({
          myExams: s.myExams.map((e) => (e.id === id ? { ...e, shared: !e.shared } : e)),
        })),

      importExam: (exam) => {
        const existing = get().myExams.find((e) => e.importedFrom === exam.id)
        if (existing) return existing.id
        const copy: Exam = {
          ...exam,
          id: uid(),
          author: 'Bạn',
          shared: false,
          views: 0,
          likes: 0,
          createdAt: new Date().toISOString(),
          importedFrom: exam.id,
          sections: exam.sections.map((sec) => ({
            ...sec,
            id: uid(),
            questions: sec.questions.map((q) => ({ ...q, id: uid() })),
          })),
        }
        set((s) => ({ myExams: [copy, ...s.myExams] }))
        return copy.id
      },

      startQuiz: (examId) =>
        set({
          activeQuizId: examId,
          quizAnswers: {},
          quizStartedAt: Date.now(),
          quizRemaining: null,
          quizSubmitted: false,
          mode: 'quiz',
        }),

      setAnswer: (questionId, value) =>
        set((s) => ({ quizAnswers: { ...s.quizAnswers, [questionId]: value } })),

      setRemaining: (s) => set({ quizRemaining: s }),

      submitQuiz: () =>
        set((s) => {
          const exam = s.myExams.find((e) => e.id === s.activeQuizId)
          if (!exam) return s
          const questions = exam.sections.flatMap((sec) => sec.questions)
          let score = 0
          for (const q of questions) {
            const given = s.quizAnswers[q.id]
            if (given && given === q.answer) score += q.points
          }
          const total = questions.reduce((sum, q) => sum + q.points, 0)
          return {
            quizSubmitted: true,
            lastResult: { examId: exam.id, score, total, at: Date.now() },
          }
        }),

      resetQuiz: () =>
        set({
          quizAnswers: {},
          quizStartedAt: null,
          quizRemaining: null,
          quizSubmitted: false,
          lastResult: null,
        }),

      setQuizSubmitted: (v) => set({ quizSubmitted: v }),
    }),
    {
      name: 'dethinhbien-v1',
      partialize: (s) => ({
        myExams: s.myExams,
        draft: s.draft,
        chat: s.chat,
        lastResult: s.lastResult,
      }),
    },
  ),
)

/* ------------------------------------------------------------------ helpers */

/**
 * Renumber every question 1..n inside its own section.
 * Section-local numbering is what the exam sheet prints ("Câu 1.", "Câu 2.").
 */
function renumber(sections: Section[]): Section[] {
  return sections.map((sec) => ({
    ...sec,
    questions: sec.questions.map((q, i) => ({ ...q, number: i + 1 })),
  }))
}

export function bankToQuestion(entry: BankEntry, number: number): Question {
  return {
    id: uid(),
    number,
    type: entry.type,
    prompt: entry.prompt,
    options: entry.options,
    answer: entry.answer,
    explanation: entry.explanation,
    points: entry.points,
    solution: entry.solution,
    sourceId: entry.id,
  }
}

export function autoGenerate(opts: {
  subject: string
  grade: string
  count: number
  type?: 'trac-nghiem' | 'tu-luan' | 'tu-luan-dong' | 'mixed'
  avoidIds?: string[]
}): Question[] {
  const picked = pickQuestions({
    subject: opts.subject,
    grade: opts.grade,
    type: opts.type && opts.type !== 'mixed' ? opts.type : undefined,
    count: opts.count,
    avoidIds: opts.avoidIds,
  })
  return picked.map((entry, i) => bankToQuestion(entry, i + 1))
}
