import { checkAnswer } from '../domain/checkAnswer'
import { normalize } from '../domain/text'
import { Choose } from './Choose'
import { Match } from './Match'
import { Spot } from './Spot'
import { Tiles } from './Tiles'
import { TypeAnswer } from './TypeEx'
import type { AnswerValue, CheckResult, ChooseEx, Exercise, ExerciseDef, MatchEx, SpotEx, TilesEx, TypeEx } from './types'

function checkTyped(ex: TilesEx | TypeEx, value: AnswerValue): CheckResult {
  const v = typeof value === 'string' ? value : ''
  const r = checkAnswer(v, ex.accepted, { lang: ex.targetLang, knownRussian: ex.knownRussian })
  return { verdict: r.verdict, correct: ex.answer, hint: r.hint, explanation: ex.explanation, speak: ex.targetLang === 'bg' ? ex.answer : undefined }
}

const choose: ExerciseDef<ChooseEx> = {
  Component: Choose,
  check: (ex, value) => ({
    verdict: typeof value === 'string' && normalize(value) === normalize(ex.answer) ? 'correct' : 'wrong',
    correct: ex.answer,
    explanation: ex.explanation,
    speak: ex.optionsLang === 'bg' ? ex.answer : ex.speak,
  }),
}

const match: ExerciseDef<MatchEx> = {
  Component: Match,
  check: (_ex, value) => {
    const m = typeof value === 'object' ? value : { mistakes: 0, badIds: [] }
    return {
      verdict: m.mistakes === 0 ? 'correct' : 'typo',
      correct: 'Все пары найдены',
      hint: m.mistakes ? `Ошибок при поиске пар: ${m.mistakes}. Повторите эти слова.` : undefined,
      badWordIds: m.badIds,
    }
  },
}

const spot: ExerciseDef<SpotEx> = {
  Component: Spot,
  check: (ex, value) => {
    const v = typeof value === 'string' ? value : ''
    const ok = ex.errors.length === 0 ? v === 'none' : ex.errors.map(String).includes(v)
    const words = ex.sentence.split(' ')
    const where = ex.errors.length ? `Ошибка в слове «${ex.errors.map((i) => words[i]).join(' ')}». ` : 'Ошибок нет. '
    return {
      verdict: ok ? 'correct' : 'wrong',
      correct: ex.fix,
      hint: ok ? undefined : where,
      explanation: ex.explanation,
      speak: ex.fix,
    }
  },
}

/**
 * Exercise registry. To add a new type (e.g. "speak"):
 * 1) add its interface to the Exercise union in types.ts, 2) write a component, 3) add one line here.
 */
export const registry: { [K in Exercise['type']]: ExerciseDef<Extract<Exercise, { type: K }>> } = {
  choose,
  match,
  spot,
  tiles: { Component: Tiles, check: checkTyped },
  type: { Component: TypeAnswer, check: checkTyped },
}

export function checkExercise(ex: Exercise, value: AnswerValue): CheckResult {
  return (registry[ex.type] as ExerciseDef<Exercise>).check(ex, value)
}
