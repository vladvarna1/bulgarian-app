import { unitSchema, type Lesson, type Unit, type Word } from './schema'
import outlineJson from '../../content/outline.json'

const modules = import.meta.glob('../../content/units/*.json', { eager: true, import: 'default' })

export const units: Unit[] = Object.values(modules)
  .map((m) => unitSchema.parse(m))
  .sort((a, b) => a.order - b.order)

export const wordIndex = new Map<string, Word>()
export const wordUnit = new Map<string, Unit>()
export const lessonIndex = new Map<string, { unit: Unit; lesson: Lesson; index: number }>()

for (const unit of units) {
  for (const w of unit.words) {
    wordIndex.set(w.id, w)
    wordUnit.set(w.id, unit)
  }
  unit.lessons.forEach((lesson, index) => lessonIndex.set(lesson.id, { unit, lesson, index }))
}

export interface OutlineUnit {
  order: number
  cefr: 'A1' | 'A2' | 'B1'
  title_ru: string
  focus_ru: string
  ready?: boolean
}
export const outline = outlineJson as OutlineUnit[]

/** Ordered list of every lesson id in the course. */
export const allLessonIds: string[] = units.flatMap((u) => u.lessons.map((l) => l.id))

export function wordsOf(lesson: Lesson): Word[] {
  return lesson.words.map((id) => wordIndex.get(id)).filter((w): w is Word => Boolean(w))
}
