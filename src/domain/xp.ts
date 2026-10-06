/** XP for a finished session. */
export function sessionXp(o: { firstTryCorrect: number; total: number; seconds: number; kind: 'lesson' | 'practice' }): number {
  const base = o.kind === 'lesson' ? 10 : 5
  const perfect = o.total > 0 && o.firstTryCorrect === o.total
  const fast = perfect && o.seconds < o.total * 8
  return base + o.firstTryCorrect + (perfect ? 5 : 0) + (fast ? 3 : 0)
}

/** Daily goal in minutes → XP target (about 4 XP per minute). */
export function dailyGoalXp(minutes: number): number {
  return minutes * 4
}

function addDays(date: string, n: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Current streak: consecutive days with XP ending today (or yesterday, so a
 * streak is not lost before the user had a chance to practise today).
 * `activity` maps YYYY-MM-DD (in the user's local time zone) to XP.
 */
export function currentStreak(activity: Record<string, number>, today: string): number {
  let day = (activity[today] ?? 0) > 0 ? today : addDays(today, -1)
  let n = 0
  while ((activity[day] ?? 0) > 0) {
    n++
    day = addDays(day, -1)
  }
  return n
}

export function lastDays(today: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(today, i - (count - 1)))
}
