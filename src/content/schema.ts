import { z } from 'zod'

export const similaritySchema = z.enum(['identical', 'similar', 'different', 'false_friend'])

export const wordSchema = z.object({
  id: z.string(),
  bg: z.string(), // always written with stress marks (U+0301) where the word has 2+ syllables
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
    prompt: z.string(),
    options: z.array(z.string()).min(2).max(6),
    answer: z.string(),
    explanation: z.string().optional(),
  }),
  z.object({
    type: z.literal('type'),
    kind,
    prompt: z.string(),
    answer: z.string(),
    accepted: z.array(z.string()).default([]),
    explanation: z.string().optional(),
  }),
])

export const lessonSchema = z.object({
  id: z.string(),
  title_ru: z.string(),
  icon: z.string().default('⭐'),
  words: z.array(z.string()),
  sentences: z.array(sentenceSchema).default([]),
  articles: z.array(articleDrillSchema).default([]),
  extra: z.array(extraSchema).default([]),
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
    title_ru: z.string(),
    subtitle_ru: z.string(),
    cefr: z.enum(['A1', 'A2', 'B1']),
    color: z.string(),
    emoji: z.string(),
    guide: guideSchema,
    words: z.array(wordSchema),
    lessons: z.array(lessonSchema),
  })
  .superRefine((u, ctx) => {
    const ids = new Set(u.words.map((w) => w.id))
    for (const l of u.lessons) {
      for (const w of l.words) {
        if (!ids.has(w)) ctx.addIssue({ code: 'custom', message: `Lesson ${l.id}: unknown word id ${w}` })
      }
    }
  })

export type Word = z.output<typeof wordSchema>
export type Sentence = z.output<typeof sentenceSchema>
export type Lesson = z.output<typeof lessonSchema>
export type Unit = z.output<typeof unitSchema>
export type Similarity = z.output<typeof similaritySchema>
