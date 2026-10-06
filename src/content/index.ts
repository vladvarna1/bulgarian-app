import { unitSchema, type Extra, type Lesson, type Unit, type Word } from './schema'
import outlineJson from '../../content/outline.json'

const modules = import.meta.glob('../../content/units/*.json', { eager: true, import: 'default' })

const trackRank = { pro: 0, basics: 1 } as const

export const units: Unit[] = Object.values(modules)
  .map((m) => unitSchema.parse(m))
  .sort((a, b) => trackRank[a.track] - trackRank[b.track] || a.order - b.order)

export const proUnits = units.filter((u) => u.track === 'pro')
export const basicUnits = units.filter((u) => u.track === 'basics')

export const wordIndex = new Map<string, Word>()
export const lessonIndex = new Map<string, { unit: Unit; lesson: Lesson; index: number }>()
/** Every authored exercise (extra) gets a stable key so progress/SRS can refer to it. */
export const extraIndex = new Map<string, { unit: Unit; lesson: Lesson; extra: Extra; key: string }>()

export const extraKey = (lessonId: string, i: number) => `${lessonId}-x${i}`

for (const unit of units) {
  for (const w of unit.words) wordIndex.set(w.id, w)
  unit.lessons.forEach((lesson, index) => {
    lessonIndex.set(lesson.id, { unit, lesson, index })
    lesson.extra.forEach((extra, i) => {
      const key = extraKey(lesson.id, i)
      extraIndex.set(key, { unit, lesson, extra, key })
    })
  })
}

export interface OutlineUnit {
  order: number
  cefr: string
  title_ru: string
  focus_ru: string
  ready?: boolean
}
export const outline = outlineJson as OutlineUnit[]

/** Lessons of the main (pro) course, in order: these unlock one after another. */
export const proLessonIds: string[] = proUnits.flatMap((u) => u.lessons.map((l) => l.id))
export const allLessonIds: string[] = units.flatMap((u) => u.lessons.map((l) => l.id))

export function wordsOf(lesson: Lesson): Word[] {
  return lesson.words.map((id) => wordIndex.get(id)).filter((w): w is Word => Boolean(w))
}
