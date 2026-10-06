import { describe, expect, it } from 'vitest'
import { localDate } from './localDate'

describe('localDate', () => {
  const instant = new Date('2026-03-01T23:30:00Z')
  it('uses the user time zone, not UTC', () => {
    expect(localDate(instant, 'UTC')).toBe('2026-03-01')
    expect(localDate(instant, 'Europe/Sofia')).toBe('2026-03-02')
    expect(localDate(instant, 'America/Los_Angeles')).toBe('2026-03-01')
  })
})
