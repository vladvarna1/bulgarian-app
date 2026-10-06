import { extraKey } from '../content'
import type { Extra, Lesson, Unit, Word } from '../content/schema'
import type { ChooseEx, Exercise, MatchEx, TilesEx, TypeEx } from '../exercises/types'
import { normalize } from './text'

export type Rng = () => number

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

let counter = 0
const uid = (p: string) => `${p}-${++counter}`


function pickDistinct(pool: readonly string[], not: string[], n: number, rng: Rng): string[] {
  const banned = new Set(not.map(normalize))
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of shuffle(pool, rng)) {
    const k = normalize(s)
    if (banned.has(k) || seen.has(k)) continue
    seen.add(k)
    out.push(s)
    if (out.length === n) break
  }
  return out
}

/** word → pick the Russian meaning */
export function chooseMeaning(w: Word, pool: Word[], rng: Rng): ChooseEx {
  const distractors = pickDistinct(pool.map((x) => x.ru), [w.ru], 3, rng)
  return {
    id: uid('cm'),
    type: 'choose',
    kind: w.sim === 'false_friend' ? 'falseFriend' : 'word',
    prompt: w.bg,
    speak: w.bg,
    emoji: w.emoji,
    options: shuffle([w.ru, ...distractors], rng),
    optionsLang: 'ru',
    answer: w.ru,
    wordIds: [w.id],
    explanation: w.note,
  }
}

/** audio → pick the Bulgarian word */
export function listenChoose(w: Word, pool: Word[], rng: Rng): ChooseEx {
  const distractors = pickDistinct(pool.map((x) => x.bg), [w.bg], 3, rng)
  return {
    id: uid('lc'),
    type: 'choose',
    kind: 'listen',
    prompt: 'Что вы слышите?',
    speak: w.bg,
    hidePrompt: true,
    options: shuffle([w.bg, ...distractors], rng),
    optionsLang: 'bg',
    answer: w.bg,
    wordIds: [w.id],
    explanation: `${w.bg} — ${w.ru}`,
  }
}

/** audio → type what you hear */
export function listenType(w: Word): TypeEx {
  return {
    id: uid('lt'),
    type: 'type',
    kind: 'listen',
    prompt: 'Напишите то, что слышите',
    speak: w.bg,
    hidePrompt: true,
    answer: w.bg,
    accepted: [w.bg],
    targetLang: 'bg',
    knownRussian: [w.ru],
    wordIds: [w.id],
    explanation: `${w.bg} — ${w.ru}`,
  }
}

/** RU word → type Bulgarian */
export function translateWordType(w: Word): TypeEx {
  return {
    id: uid('tw'),
    type: 'type',
    kind: 'word',
    prompt: `Напишите по-болгарски: «${w.ru}»`,
    answer: w.bg,
    accepted: [w.bg],
    targetLang: 'bg',
    knownRussian: [w.ru],
    wordIds: [w.id],
    explanation: w.note,
  }
}

function singleTokens(words: Word[], lang: 'bg' | 'ru'): string[] {
  return words
    .map((w) => (lang === 'bg' ? w.bg : w.ru))
    .filter((t) => !t.includes(' '))
    .map((t) => normalize(t))
}

function tileDistractors(answerTokens: string[], words: Word[], lang: 'bg' | 'ru', rng: Rng): string[] {
  const used = new Set(answerTokens.map(normalize))
  return pickDistinct(singleTokens(words, lang), [...used], 2, rng).filter((t) => t.length > 0)
}

export function sentenceTiles(
  s: { bg: string; ru: string; ruAlt: string[]; bgAlt: string[]; note?: string },
  dir: 'bg-ru' | 'ru-bg',
  wordPool: Word[],
  wordIds: string[],
  rng: Rng,
): TilesEx {
  const toBg = dir === 'ru-bg'
  const answerText = toBg ? s.bg : s.ru
  const answerTokens = normalize(answerText).split(' ')
  const tiles = shuffle([...answerTokens, ...tileDistractors(answerTokens, wordPool, toBg ? 'bg' : 'ru', rng)], rng)
  return {
    id: uid('st'),
    type: 'tiles',
    kind: 'sentence',
    prompt: toBg ? s.ru : s.bg,
    speak: toBg ? undefined : s.bg,
    tiles,
    answer: answerText,
    accepted: [answerText, ...(toBg ? s.bgAlt : s.ruAlt)],
    targetLang: toBg ? 'bg' : 'ru',
    knownRussian: toBg ? [s.ru, ...s.ruAlt] : undefined,
    wordIds,
    explanation: s.note,
  }
}

export function sentenceListen(s: { bg: string; ru: string; bgAlt: string[] }, wordPool: Word[], wordIds: string[], rng: Rng): TilesEx {
  const answerTokens = normalize(s.bg).split(' ')
  const tiles = shuffle([...answerTokens, ...tileDistractors(answerTokens, wordPool, 'bg', rng)], rng)
  return {
    id: uid('sl'),
    type: 'tiles',
    kind: 'listen',
    prompt: 'Составьте то, что слышите',
    speak: s.bg,
    hidePrompt: true,
    tiles,
    answer: s.bg,
    accepted: [s.bg, ...s.bgAlt],
    targetLang: 'bg',
    wordIds,
    explanation: s.ru,
  }
}

export function matchPairs(words: Word[], rng: Rng): MatchEx | null {
  const picked = shuffle(words, rng).slice(0, 5)
  if (picked.length < 3) return null
  return {
    id: uid('mp'),
    type: 'match',
    prompt: 'Найдите пары',
    pairs: picked.map((w) => ({ id: w.id, bg: w.bg, ru: w.ru })),
    wordIds: picked.map((w) => w.id),
  }
}

/** Turn an authored exercise into a playable one. `key` identifies it for progress tracking. */
export function extraToExercise(e: Extra, key: string, track: 'basics' | 'pro', rng: Rng = Math.random): Exercise {
  const base = { id: uid('ex'), kind: e.kind, tag: e.tag, wordIds: [key], explanation: e.explanation }
  switch (e.type) {
    case 'choose':
      return {
        ...base,
        type: 'choose',
        prompt: e.prompt,
        options: shuffle(e.options, rng),
        optionsLang: track === 'pro' || e.kind === 'dialogue' ? 'bg' : 'ru',
        answer: e.answer,
      }
    case 'type':
      return { ...base, type: 'type', prompt: e.prompt, answer: e.answer, accepted: [e.answer, ...e.accepted], targetLang: 'bg' }
    case 'spot':
      return { ...base, type: 'spot', sentence: e.sentence, errors: e.errors, fix: e.fix }
    case 'tiles': {
      const answerTokens = normalize(e.answer).split(' ')
      const tiles = shuffle([...answerTokens, ...e.extraTiles.map(normalize)], rng)
      return {
        ...base,
        type: 'tiles',
        prompt: e.prompt,
        tiles,
        answer: e.answer,
        accepted: [e.answer, ...e.accepted],
        targetLang: 'bg',
      }
    }
  }
}

/** Build the exercise list for one lesson (≈ 12–16 exercises). */
export function buildLesson(unit: Unit, lesson: Lesson, rng: Rng = Math.random): Exercise[] {
  const words = lesson.words.map((id) => unit.words.find((w) => w.id === id)).filter((w): w is Word => Boolean(w))
  const pool = unit.words // distractors come from the whole unit (and look familiar)
  const out: Exercise[] = []

  // 1. meet the words
  const intro = shuffle(words, rng).slice(0, 5)
  intro.forEach((w) => out.push(chooseMeaning(w, pool, rng)))

  // 2. match pairs
  const m = matchPairs(words, rng)
  if (m) out.push(m)

  // 3. hear the words
  shuffle(words, rng).slice(0, 2).forEach((w) => out.push(listenChoose(w, pool, rng)))
  if (words.length > 0) out.push(listenType(shuffle(words, rng)[0]))

  // 4. sentences, both directions
  const sentences = shuffle(lesson.sentences, rng).slice(0, 4)
  sentences.forEach((s, i) => {
    const ids = words.filter((w) => normalize(s.bg).includes(normalize(w.bg))).map((w) => w.id)
    out.push(sentenceTiles(s, i % 2 === 0 ? 'bg-ru' : 'ru-bg', pool, ids, rng))
  })
  const listenSentence = sentences[0]
  if (listenSentence) out.push(sentenceListen(listenSentence, pool, [], rng))

  // 5. article drills, rules, false friends from content
  for (const a of shuffle(lesson.articles, rng).slice(0, 3)) {
    out.push({
      id: uid('ar'),
      type: 'type',
      kind: 'article',
      tag: 'article',
      prompt: `Добавьте определённый артикль: «${a.base}» (${a.ru})`,
      answer: a.answer,
      accepted: [a.answer, ...a.alt],
      targetLang: 'bg',
      wordIds: [],
      explanation: `${a.base} → ${a.answer}`,
    })
  }
  lesson.extra.forEach((e, i) => out.push(extraToExercise(e, extraKey(lesson.id, i), unit.track, rng)))

  // Intro blocks stay in order; later blocks are shuffled lightly so it doesn't feel mechanical.
  const head = out.slice(0, intro.length + (m ? 1 : 0))
  const tail = shuffle(out.slice(head.length), rng)
  return [...head, ...tail].slice(0, 18)
}

/** Practice session for an arbitrary set of words (weak words, mistakes, daily review, listening…). */
export function buildPractice(
  words: Word[],
  opts: { mode: 'mix' | 'listen' | 'falseFriends'; pool: Word[]; limit?: number },
  rng: Rng = Math.random,
): Exercise[] {
  const limit = opts.limit ?? 10
  const picked = shuffle(words, rng).slice(0, limit)
  const out: Exercise[] = []
  picked.forEach((w, i) => {
    if (opts.mode === 'listen') out.push(i % 3 === 2 ? listenType(w) : listenChoose(w, opts.pool, rng))
    else if (opts.mode === 'falseFriends') out.push(chooseMeaning(w, opts.pool, rng))
    else out.push([chooseMeaning, listenChoose, (x: Word) => translateWordType(x)][i % 3](w, opts.pool, rng))
  })
  return out
}
