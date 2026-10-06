import { isTypo, normalize } from './text'

export type Verdict = 'correct' | 'typo' | 'wrong'

export interface AnswerCheck {
  verdict: Verdict
  /** targeted Russian-language feedback (typo note, Russian leak, missing article…) */
  hint?: string
}

const ARTICLE_SUFFIXES = ['ът', 'ят', 'та', 'то', 'те', 'а', 'я']

/** Letters that exist in Russian but not in Bulgarian. */
export function russianLeak(raw: string): string | null {
  const m = /[ыэёЫЭЁ]/.exec(raw)
  if (!m) return null
  const ch = m[0].toLowerCase()
  if (ch === 'ы') return 'В болгарском нет буквы «ы». Ближайший звук пишется «ъ» (на русской раскладке это та же клавиша).'
  if (ch === 'э') return 'В болгарском нет буквы «э». Пишется «е».'
  return 'В болгарском нет буквы «ё». Вместо неё пишется «ьо» или «е».'
}

/**
 * Compare a typed answer against the accepted variants (first = canonical).
 * lang 'bg' enables Bulgarian-specific diagnostics.
 */
export function checkAnswer(
  input: string,
  accepted: string[],
  opts: { lang: 'bg' | 'ru'; knownRussian?: string[] } = { lang: 'bg' },
): AnswerCheck {
  const n = normalize(input)
  const targets = accepted.map(normalize)
  if (!n) return { verdict: 'wrong' }
  if (targets.includes(n)) return { verdict: 'correct' }

  const leak = opts.lang === 'bg' ? russianLeak(input) : null

  if (opts.lang === 'bg') {
    // «шт» typed instead of «щ»: a hint, never fully correct
    if (targets.some((t) => t.includes('щ') && t.replace(/щ/g, 'шт') === n)) {
      return { verdict: 'typo', hint: 'Буква «щ» пишется одной буквой, а не «шт».' }
    }
    // missing definite article
    for (const t of targets) {
      for (const suf of ARTICLE_SUFFIXES) {
        if (n + suf === t && n.length > 2) {
          return { verdict: 'wrong', hint: 'Не хватает определённого артикля — он добавляется в конец слова.' }
        }
      }
    }
  }

  if (targets.some((t) => isTypo(n, t))) {
    return { verdict: 'typo', hint: leak ?? undefined }
  }

  if (opts.lang === 'bg' && opts.knownRussian?.map(normalize).includes(n)) {
    return { verdict: 'wrong', hint: 'Это русское слово. Нужно написать по-болгарски.' }
  }
  return { verdict: 'wrong', hint: leak ?? undefined }
}
