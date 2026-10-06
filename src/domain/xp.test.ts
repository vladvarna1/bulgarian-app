import { describe, expect, it } from 'vitest'
import { localDate } from './localDate'
import { currentStreak, dailyGoalXp, lastDays, sessionXp } from './xp'

describe('sessionXp', () => {
  it('gives a bonus for perfect and fast sessions', () => {
    expect(sessionXp({ firstTryCorrect: 10, total: 10, seconds: 200, kind: 'lesson' })).toBe(25)
    expect(sessionXp({ firstTryCorrect: 10, total: 10, seconds: 30, kind: 'lesson' })).toBe(28)
    expect(sessionXp({ firstTryCorrect: 7, total: 10, seconds: 30, kind: 'lesson' })).toBe(17)
    expect(sessionXp({ firstTryCorrect: 5, total: 10, seconds: 100, kind: 'practice' })).toBe(10)
  })
})

describe('streak', () => {
  it('counts consecutive days ending today', () => {
    const a = { '2026-03-10': 20, '2026-03-09': 5, '2026-03-08': 30, '2026-03-06': 10 }
    expect(currentStreak(a, '2026-03-10')).toBe(3)
  })
  it('keeps the streak alive until the end of the next day', () => {
    expect(currentStreak({ '2026-03-09': 20, '2026-03-08': 20 }, '2026-03-10')).toBe(2)
  })
  it('resets after a missed day', () => {
    expect(currentStreak({ '2026-03-08': 20 }, '2026-03-10')).toBe(0)
  })
  it('works across month and year boundaries', () => {
    expect(currentStreak({ '2026-01-01': 1, '2025-12-31': 1, '2025-12-30': 1 }, '2026-01-01')).toBe(3)
  })
  it('uses the user local date: late evening in Los Angeles is still "today"', () => {
    const instant = new Date('2026-03-02T05:30:00Z')
    expect(localDate(instant, 'America/Los_Angeles')).toBe('2026-03-01')
    expect(localDate(instant, 'Europe/Sofia')).toBe('2026-03-02')
  })
})

describe('helpers', () => {
  it('daily goal and last days', () => {
    expect(dailyGoalXp(10)).toBe(40)
    expect(lastDays('2026-03-10', 3)).toEqual(['2026-03-08', '2026-03-09', '2026-03-10'])
  })
})
