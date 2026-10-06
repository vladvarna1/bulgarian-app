import { z } from 'zod'

export const similaritySchema = z.enum(['identical', 'similar', 'different', 'false_friend'])

/** Grammar areas tracked per learner (accuracy by tag shows on the profile). */
export const TAGS = {
  article: 'Артикль',
  'article-adj': 'Артикль с прилагательным',
  possessive: 'Притяжательные формы',
  da: 'Да-конструкции',
  future: 'Будущее и «няма да»',
  prepositions: 'Предлоги',
  euphony: 'в/във, с/със',
  clitics: 'Порядок клитик',
  'clitics-form': 'Формы клитик (ми, ѝ, я…)',
  aorist: 'Аорист и имперфект',
  perfect: 'Перфект',
  renarrative: 'Пересказывательное наклонение',
  numerals: 'Числительные',
  agreement: 'Согласование',
  formal: 'Деловой стиль',
  clauses: 'Сложные предложения',
  conditionals: 'Условные предложения',
  indirect: 'Косвенная речь',
  aspect: 'Вид глагола',
  imperative: 'Повелительное наклонение',
  reading: 'Чтение',
  calques: 'Русизмы',
  sounds: 'Звуки и буквы',
  vocab: 'Слова',
} as const
export type Tag = keyof typeof TAGS
const tagSchema = z.string().default('vocab')

export const wordSchema = z.object({
  id: z.string(),
  bg: z.string(), // written with stress marks (U+0301) where the word has 2+ syllables
  ru: z.string(),
  sim: similaritySchema,
  emoji: z.string().optional(),
  note: z.string().optional(),
})

export const sentenceSchema = z.object({
  bg: z.string(),
  ru: z.string(),
  ruAlt: z.array(z.string()).default([]),
  bgAlt: z.array(z.string()).default([]),
  note: z.string().optional(),
})

export const articleDrillSchema = z.object({
  base: z.string(),
  ru: z.string(),
  answer: z.string(),
  alt: z.array(z.string()).default([]),
})

const kind = z.enum(['word', 'rule', 'falseFriend', 'dialogue']).default('rule')

export const extraSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('choose'),
    kind,
    tag: tagSchema,
    /** optional text shown above the question (reading comprehension) */
    passage: z.string().optional(),
    prompt: z.string(),
    options: z.array(z.string()).min(2).max(6),
    answer: z.string(),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal('type'),
    kind,
    tag: tagSchema,
    prompt: z.string(),
    answer: z.string(),
    accepted: z.array(z.string()).default([]),
    explanation: z.string().optional(),
  }),
  // "find the mistake": tap the wrong word, or "no mistake" when errors is empty
  z.object({
    type: z.literal('spot'),
    kind,
    tag: tagSchema,
    sentence: z.string(),
    errors: z.array(z.number().int()).default([]),
    fix: z.string(),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal('tiles'),
    kind,
    tag: tagSchema,
    prompt: z.string(), // Russian sentence
    answer: z.string(), // Bulgarian sentence
    accepted: z.array(z.string()).default([]),
    extraTiles: z.array(z.string()).default([]),
    explanation: z.string().optional(),
  }),
])

export const ruleSchema = z.object({
  title: z.string(),
  body: z.string(),
  examples: z.array(z.object({ bad: z.string().optional(), good: z.string(), note: z.string().optional() })).default([]),
})

export const lessonSchema = z.object({
  id: z.string(),
  title_ru: z.string(),
  icon: z.string().default('⭐'),
  words: z.array(z.string()).default([]),
  sentences: z.array(sentenceSchema).default([]),
  articles: z.array(articleDrillSchema).default([]),
  extra: z.array(extraSchema).default([]),
  rule: ruleSchema.optional(),
  culture: z.string().optional(),
  status: z.enum(['draft', 'approved']).default('approved'),
})

export const guideSchema = z.object({
  intro: z.string(),
  cards: z.array(z.object({ title: z.string(), ru: z.string(), bg: z.string(), note: z.string().optional() })),
  tips: z.array(z.string()).default([]),
})

export const unitSchema = z
  .object({
    id: z.string(),
    order: z.number().int(),
    track: z.enum(['basics', 'pro']).default('pro'),
    title_ru: z.string(),
    subtitle_ru: z.string(),
    cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
    color: z.string(),
    emoji: z.string(),
    guide: guideSchema,
    words: z.array(wordSchema).default([]),
    lessons: z.array(lessonSchema),
  })
  .superRefine((u, ctx) => {
    const ids = new Set(u.words.map((w) => w.id))
    for (const l of u.lessons) {
      for (const w of l.words) {
        if (!ids.has(w)) ctx.addIssue({ code: 'custom', message: `Lesson ${l.id}: unknown word id ${w}` })
      }
      l.extra.forEach((e, i) => {
        if (e.type === 'choose' && !e.options.includes(e.answer)) ctx.addIssue({ code: 'custom', message: `${l.id} extra ${i}: answer not among options` })
        if (e.type === 'spot') {
          const n = e.sentence.split(' ').length
          if (e.errors.some((x) => x < 0 || x >= n)) ctx.addIssue({ code: 'custom', message: `${l.id} extra ${i}: error index out of range` })
        }
      })
    }
  })

export type Word = z.output<typeof wordSchema>
export type Sentence = z.output<typeof sentenceSchema>
export type Lesson = z.output<typeof lessonSchema>
export type Extra = z.output<typeof extraSchema>
export type Unit = z.output<typeof unitSchema>
export type Similarity = z.output<typeof similaritySchema>
