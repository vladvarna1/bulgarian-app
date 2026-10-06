import { describe, expect, it } from 'vitest'
import { dueDate, maturity, reviewCard } from './srs'

const t0 = new Date('2026-03-01T10:00:00Z')

describe('FSRS integration', () => {
  it('a correct first review schedules the card into the future and counts as learning', () => {
    const c = reviewCard(undefined, true, t0)
    expect(new Date(c.due).getTime()).toBeGreaterThan(t0.getTime())
    expect(c.reps).toBe(1)
    expect(maturity(c)).toBe(1)
  })
  it('repeated correct reviews push the due date further out', () => {
    let c = reviewCard(undefined, true, t0)
    let now = new Date(c.due)
    const gaps: number[] = []
    for (let i = 0; i < 4; i++) {
      const next = reviewCard(c, true, now)
      gaps.push(new Date(next.due).getTime() - now.getTime())
      c = next
      now = new Date(c.due)
    }
    expect(gaps[3]).toBeGreaterThan(gaps[1])
    expect(maturity(c)).toBeGreaterThanOrEqual(2)
  })
  it('a wrong answer brings a mature card back soon and records a lapse', () => {
    let c = reviewCard(undefined, true, t0)
    for (let i = 0; i < 4; i++) c = reviewCard(c, true, new Date(c.due))
    const before = new Date(c.due)
    const lapsed = reviewCard(c, false, before)
    expect(lapsed.lapses).toBe(1)
    expect(new Date(lapsed.due).getTime() - before.getTime()).toBeLessThan(2 * 24 * 3600 * 1000)
  })
  it('due date is expressed in the user time zone', () => {
    const c = { ...reviewCard(undefined, true, t0), due: '2026-03-01T23:30:00.000Z' }
    expect(dueDate(c, 'Europe/Sofia')).toBe('2026-03-02')
    expect(dueDate(c, 'UTC')).toBe('2026-03-01')
  })
})
