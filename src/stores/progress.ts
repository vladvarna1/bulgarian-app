import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localDate } from '../domain/localDate'
import { proLessonIds } from '../content'
import type { DayStats } from '../domain/quests'
import { dueDate, maturity, reviewCard, type StoredCard } from '../domain/srs'

export interface WordStat {
  ok: number
  bad: number
  lastOk: boolean
  /** maturity 0–3 derived from the FSRS card (0 new, 1 learning, 2 young, 3 mature) */
  box: number
  /** YYYY-MM-DD (local) the item is next due */
  due: string
  card?: StoredCard
}

export interface Settings {
  sound: boolean
  stress: boolean
  theme: 'system' | 'light' | 'dark'
}

export interface SessionResult {
  lessonId?: string
  xp: number
  firstTryCorrect: number
  total: number
  seconds: number
  words: { id: string; ok: boolean }[]
  /** first-attempt result per grammar tag */
  tags: { tag: string; ok: boolean }[]
}

interface State {
  onboarded: boolean
  reason: string | null
  goalMin: number
  settings: Settings
  xp: number
  /** day → XP earned */
  activity: Record<string, number>
  lessons: Record<string, { best: number; times: number }>
  words: Record<string, WordStat>
  tags: Record<string, { ok: number; bad: number }>
  dayStats: Record<string, DayStats>
  perfectLessons: number
  finishOnboarding: (reason: string, goalMin: number) => void
  setGoal: (min: number) => void
  setSettings: (s: Partial<Settings>) => void
  completeSession: (r: SessionResult) => void
  resetAll: () => void
}

export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
export const today = () => localDate(new Date(), timeZone())

const initial = {
  onboarded: false,
  reason: null as string | null,
  goalMin: 10,
  settings: { sound: true, stress: true, theme: 'system' } as Settings,
  xp: 0,
  activity: {} as Record<string, number>,
  lessons: {} as State['lessons'],
  words: {} as State['words'],
  tags: {} as State['tags'],
  dayStats: {} as State['dayStats'],
  perfectLessons: 0,
}

export const useProgress = create<State>()(
  persist(
    (set) => ({
      ...initial,
      finishOnboarding: (reason, goalMin) => set({ onboarded: true, reason, goalMin }),
      setGoal: (goalMin) => set({ goalMin }),
      setSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      completeSession: (r) =>
        set((st) => {
          const d = today()
          const words = { ...st.words }
          for (const { id, ok } of r.words) {
            const prev = words[id]
            const card = reviewCard(prev?.card, ok, new Date())
            words[id] = {
              ok: (prev?.ok ?? 0) + (ok ? 1 : 0),
              bad: (prev?.bad ?? 0) + (ok ? 0 : 1),
              lastOk: ok,
              box: maturity(card),
              due: dueDate(card, timeZone()),
              card,
            }
          }
          const tags = { ...st.tags }
          for (const { tag, ok } of r.tags) {
            const prev = tags[tag] ?? { ok: 0, bad: 0 }
            tags[tag] = { ok: prev.ok + (ok ? 1 : 0), bad: prev.bad + (ok ? 0 : 1) }
          }
          const prevDay = st.dayStats[d] ?? { lessons: 0, perfect: 0, correct: 0 }
          const lessons = { ...st.lessons }
          const accuracy = r.total ? r.firstTryCorrect / r.total : 0
          if (r.lessonId) {
            const prev = lessons[r.lessonId]
            lessons[r.lessonId] = { best: Math.max(prev?.best ?? 0, accuracy), times: (prev?.times ?? 0) + 1 }
          }
          return {
            xp: st.xp + r.xp,
            activity: { ...st.activity, [d]: (st.activity[d] ?? 0) + r.xp },
            words,
            tags,
            dayStats: {
              ...st.dayStats,
              [d]: {
                lessons: prevDay.lessons + (r.lessonId ? 1 : 0),
                perfect: prevDay.perfect + (r.lessonId && accuracy === 1 ? 1 : 0),
                correct: prevDay.correct + r.firstTryCorrect,
              },
            },
            lessons,
            perfectLessons: st.perfectLessons + (r.lessonId && accuracy === 1 ? 1 : 0),
          }
        }),
      resetAll: () => set({ ...initial }),
    }),
    { name: 'bgru-progress-v1' },
  ),
)

/** First lesson not yet completed (the "current" node on the path). */
export function currentLessonId(lessons: State['lessons']): string | null {
  return proLessonIds.find((id) => !lessons[id]) ?? null
}
