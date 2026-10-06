import type { ComponentType } from 'react'
import type { Verdict } from '../domain/checkAnswer'

interface Base {
  id: string
  /** words this exercise trains (used for progress tracking) */
  wordIds: string[]
  explanation?: string
  kind?: 'word' | 'sentence' | 'listen' | 'rule' | 'falseFriend' | 'dialogue' | 'article'
  /** grammar area, used for per-rule accuracy */
  tag?: string
}

export interface ChooseEx extends Base {
  type: 'choose'
  prompt: string
  /** text spoken by the speaker button (Bulgarian) */
  speak?: string
  /** hide the written prompt (listening exercise) */
  hidePrompt?: boolean
  emoji?: string
  options: string[]
  optionsLang: 'bg' | 'ru'
  answer: string
}

export interface TilesEx extends Base {
  type: 'tiles'
  prompt: string
  speak?: string
  hidePrompt?: boolean
  tiles: string[]
  /** canonical answer, as displayed */
  answer: string
  accepted: string[]
  targetLang: 'bg' | 'ru'
  /** Russian translations to flag as "Russian leak" when typing in Bulgarian */
  knownRussian?: string[]
}

export interface TypeEx extends Base {
  type: 'type'
  prompt: string
  speak?: string
  hidePrompt?: boolean
  answer: string
  accepted: string[]
  targetLang: 'bg' | 'ru'
  knownRussian?: string[]
}

export interface MatchEx extends Base {
  type: 'match'
  prompt: string
  pairs: { id: string; bg: string; ru: string }[]
}

/** Add a new exercise type: extend this union, add a component + check() and register it in registry.tsx. */
export interface SpotEx extends Base {
  type: 'spot'
  sentence: string
  /** indexes of the wrong words; empty = the sentence is correct */
  errors: number[]
  fix: string
}

export type Exercise = ChooseEx | TilesEx | TypeEx | MatchEx | SpotEx

export type AnswerValue = string | { mistakes: number; badIds: string[] }

export interface CheckResult {
  verdict: Verdict
  /** correct answer, as it should be shown/spoken */
  correct: string
  hint?: string
  explanation?: string
  speak?: string
  /** words to count as mistakes even when the exercise passes (match pairs) */
  badWordIds?: string[]
}

export interface ExerciseProps<T extends Exercise> {
  ex: T
  /** report the current answer (null = nothing entered yet) */
  onAnswer: (value: AnswerValue | null) => void
  /** press Enter inside the exercise to submit */
  onSubmit: () => void
  locked: boolean
}

export interface ExerciseDef<T extends Exercise> {
  Component: ComponentType<ExerciseProps<T>>
  check: (ex: T, value: AnswerValue) => CheckResult
}
