export interface DayStats {
  lessons: number
  perfect: number
  /** exercises answered correctly on the first try */
  correct: number
}

export interface Quest {
  id: string
  icon: string
  title: string
  progress: number
  target: number
  done: boolean
}

/** Three small goals per day, derived from that day's activity. */
export function dailyQuests(xpToday: number, stats: DayStats | undefined): Quest[] {
  const s = stats ?? { lessons: 0, perfect: 0, correct: 0 }
  const q = (id: string, icon: string, title: string, progress: number, target: number): Quest => ({
    id,
    icon,
    title,
    progress: Math.min(progress, target),
    target,
    done: progress >= target,
  })
  return [
    q('xp', '⚡', 'Заработайте 30 XP', xpToday, 30),
    q('lessons', '📘', 'Пройдите 2 урока', s.lessons, 2),
    q('correct', '🎯', '15 верных ответов с первой попытки', s.correct, 15),
  ]
}
