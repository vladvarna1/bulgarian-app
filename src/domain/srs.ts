import { createEmptyCard, fsrs, Rating, State, type Card } from 'ts-fsrs'
import { localDate } from './localDate'

/** FSRS card as stored in localStorage (dates as ISO strings). */
export interface StoredCard {
  due: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  learning_steps: number
  state: number
  last_review?: string
}

const scheduler = fsrs()

const toCard = (s: StoredCard): Card => ({
  ...s,
  due: new Date(s.due),
  last_review: s.last_review ? new Date(s.last_review) : undefined,
}) as Card

const fromCard = (c: Card): StoredCard => ({
  due: c.due.toISOString(),
  stability: c.stability,
  difficulty: c.difficulty,
  elapsed_days: c.elapsed_days,
  scheduled_days: c.scheduled_days,
  reps: c.reps,
  lapses: c.lapses,
  learning_steps: c.learning_steps,
  state: c.state,
  last_review: c.last_review?.toISOString(),
})

/** Apply one review. Correct on first try → Good, wrong → Again. */
export function reviewCard(prev: StoredCard | undefined, correct: boolean, now: Date): StoredCard {
  const card = prev ? toCard(prev) : createEmptyCard(now)
  return fromCard(scheduler.next(card, now, correct ? Rating.Good : Rating.Again).card)
}

/** Local calendar day (YYYY-MM-DD) the card is next due. */
export function dueDate(card: StoredCard, timeZone: string): string {
  return localDate(new Date(card.due), timeZone)
}

/** Rough maturity 0–3 used for "learned" counts: new/learning/young review/mature. */
export function maturity(card: StoredCard): number {
  if (card.state === State.New) return 0
  if (card.state !== State.Review) return 1
  return card.scheduled_days >= 7 ? 3 : 2
}
