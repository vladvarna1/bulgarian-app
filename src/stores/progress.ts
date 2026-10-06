import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localDate } from '../domain/localDate'
import { allLessonIds } from '../content'

export interface WordStat {
  ok: number
  bad: number
  lastOk: boolean
  /** Leitner box 0–6 */
  box: number
  /** YYYY-MM-DD the word is next due */
  due: string
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
  perfectLessons: number
  finishOnboarding: (reason: string, goalMin: number) => void
  setGoal: (min: number) => void
  setSettings: (s: Partial<Settings>) => void
  completeSession: (r: SessionResult) => void
  resetAll: () => void
}

const INTERVALS = [0, 1, 2, 4, 8, 16, 32]
export const timeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
export const today = () => localDate(new Date(), timeZone())

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const initial = {
  onboarded: false,
  reason: null as string | null,
  goalMin: 10,
  settings: { sound: true, stress: true, theme: 'system' } as Settings,
  xp: 0,
  activity: {} as Record<string, number>,
  lessons: {} as State['lessons'],
  words: {} as State['words'],
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
            const prev = words[id] ?? { ok: 0, bad: 0, lastOk: true, box: 0, due: d }
            const box = ok ? Math.min(prev.box + 1, 6) : 0
            words[id] = {
              ok: prev.ok + (ok ? 1 : 0),
              bad: prev.bad + (ok ? 0 : 1),
              lastOk: ok,
              box,
              due: addDays(d, INTERVALS[box]),
            }
          }
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
  return allLessonIds.find((id) => !lessons[id]) ?? null
}
