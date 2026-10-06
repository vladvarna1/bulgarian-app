import { describe, expect, it } from 'vitest'
import { allLessonIds, lessonIndex, units } from '../content'
import { checkExercise } from '../exercises/registry'
import { buildLesson, buildPractice } from './lessonBuilder'
import { normalize } from './text'

let seed = 1
const rng = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

describe('content', () => {
  it('loads three units with five lessons each', () => {
    expect(units.map((u) => u.lessons.length)).toEqual([5, 5, 5])
    expect(new Set(allLessonIds).size).toBe(15)
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
    const bad = units
      .flatMap((u) => [...u.words.map((w) => w.bg), ...u.lessons.flatMap((l) => [...l.sentences.map((s) => s.bg), ...l.articles.map((a) => a.answer)])])
      .filter((t) => /[ыэё]/i.test(t))
    expect(bad).toEqual([])
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
        } else {
          expect(checkExercise(ex, { mistakes: 0, badIds: [] }).verdict).toBe('correct')
        }
      }
    }
  })
  it('practice builder works for any word subset', () => {
    const words = units[0].words
    const exs = buildPractice(words.slice(0, 6), { mode: 'mix', pool: words }, rng)
    expect(exs).toHaveLength(6)
  })
})
