import { describe, expect, it } from 'vitest'
import { allLessonIds, extraIndex, lessonIndex, units } from '../content'
import { checkExercise } from '../exercises/registry'
import { buildLesson, buildPractice } from './lessonBuilder'
import { normalize } from './text'

let seed = 1
const rng = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('content', () => {
  it('loads the pro course first, then the basics', () => {
    expect(units.filter((u) => u.track === 'pro').length).toBeGreaterThanOrEqual(8)
    expect(units.findIndex((u) => u.track === 'basics')).toBeGreaterThan(7)
    expect(new Set(allLessonIds).size).toBe(allLessonIds.length)
  })
  it('every authored exercise is valid: spot indexes in range, choose answer among options, no empty tiles', () => {
    for (const [key, { extra }] of extraIndex) {
      if (extra.type === 'spot') {
        const n = extra.sentence.split(' ').length
        expect(extra.errors.every((i) => i >= 0 && i < n), key).toBe(true)
        if (extra.errors.length === 0) expect(normalize(extra.sentence), key).toBe(normalize(extra.fix))
      }
      if (extra.type === 'choose') expect(extra.options, key).toContain(extra.answer)
      if (extra.type === 'tiles') expect(normalize(extra.answer).split(' ').length, key).toBeGreaterThan(1)
    }
  })
  it('Bulgarian text has no Russian-only letters', () => {
    const bad: string[] = []
    for (const [key, { extra }] of extraIndex) {
      const bg = extra.type === 'spot' ? [extra.sentence, extra.fix] : extra.type === 'type' || extra.type === 'tiles' ? [extra.answer, ...extra.accepted] : []
      if (bg.some((s) => /[ыэё]/i.test(s))) bad.push(key)
    }
    expect(bad).toEqual([])
  })
  it('has unique word ids and every multi-syllable Bulgarian word has a stress mark', () => {
    const ids = units.flatMap((u) => u.words.map((w) => w.id))
    expect(new Set(ids).size).toBe(ids.length)
    const missing = units.flatMap((u) =>
      u.words
        .filter((w) => w.bg.split(' ').some((p) => (p.match(/[аеиоуъюяѝ]/gi) ?? []).length >= 2 && !p.includes('́')))
        .map((w) => w.bg),
    )
    expect(missing).toEqual([])
  })
  it('contains no Russian-only letters in Bulgarian text', () => {
    const badBasics = units
      .flatMap((u) => [...u.words.map((w) => w.bg), ...u.lessons.flatMap((l) => [...l.sentences.map((s) => s.bg), ...l.articles.map((a) => a.answer)])])
      .filter((t) => /[ыэё]/i.test(t))
    expect(badBasics).toEqual([])
  })
})

describe('buildLesson', () => {
  it('produces 8–18 exercises per lesson, each solvable with its own answer', () => {
    for (const id of allLessonIds) {
      const { unit, lesson } = lessonIndex.get(id)!
      const exs = buildLesson(unit, lesson, rng)
      expect(exs.length, id).toBeGreaterThanOrEqual(8)
      expect(exs.length, id).toBeLessThanOrEqual(18)
      for (const ex of exs) {
        if (ex.type === 'choose') {
          expect(ex.options, ex.id).toContain(ex.answer)
          expect(new Set(ex.options.map(normalize)).size, ex.id).toBe(ex.options.length)
          expect(checkExercise(ex, ex.answer).verdict).toBe('correct')
        } else if (ex.type === 'tiles') {
          const built = normalize(ex.answer).split(' ')
          for (const t of built) expect(ex.tiles, `${ex.id} needs tile ${t}`).toContain(t)
          expect(checkExercise(ex, built.join(' ')).verdict, ex.id).toBe('correct')
        } else if (ex.type === 'type') {
          expect(checkExercise(ex, ex.answer).verdict, ex.id).toBe('correct')
        } else if (ex.type === 'spot') {
          expect(checkExercise(ex, ex.errors.length ? String(ex.errors[0]) : 'none').verdict, ex.id).toBe('correct')
          expect(checkExercise(ex, ex.errors.length ? 'none' : '0').verdict, ex.id).toBe('wrong')
        } else {
          expect(checkExercise(ex, { mistakes: 0, badIds: [] }).verdict).toBe('correct')
        }
      }
    }
  })
  it('practice builder works for any word subset', () => {
    const words = units.find((u) => u.words.length > 0)!.words
    const exs = buildPractice(words.slice(0, 6), { mode: 'mix', pool: words }, rng)
    expect(exs).toHaveLength(6)
  })
})
