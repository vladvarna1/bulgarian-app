import { describe, expect, it } from 'vitest'
import { dailyQuests } from './quests'

describe('dailyQuests', () => {
  it('starts empty and caps progress at the target', () => {
    const q = dailyQuests(0, undefined)
    expect(q).toHaveLength(3)
    expect(q.every((x) => !x.done && x.progress === 0)).toBe(true)
  })
  it('marks quests as done when targets are reached', () => {
    const q = dailyQuests(55, { lessons: 2, perfect: 0, correct: 9 })
    expect(q.map((x) => x.done)).toEqual([true, true, false])
    expect(q[0].progress).toBe(30)
  })
})
