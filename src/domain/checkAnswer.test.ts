import { describe, expect, it } from 'vitest'
import { checkAnswer, russianLeak } from './checkAnswer'
import { normalize, stripStress } from './text'

describe('normalize', () => {
  it('ignores stress marks, case, punctuation and extra spaces', () => {
    expect(normalize('  Здраве́йте,   ДОБЪР  ден! ')).toBe('здравейте добър ден')
  })
  it('keeps й intact when stripping stress', () => {
    expect(stripStress('здраве́й')).toBe('здравей')
    expect(stripStress('ви́е')).toBe('вие')
  })
  it('maps ё to е and treats hyphen as a space', () => {
    expect(normalize('ёлка')).toBe('елка')
    expect(normalize('така́-така́')).toBe('така така')
  })
})

describe('checkAnswer', () => {
  it('accepts exact and alternative answers', () => {
    expect(checkAnswer('аз съм дома', ['Аз съм до́ма.', 'До́ма съм.']).verdict).toBe('correct')
    expect(checkAnswer('дома съм', ['Аз съм до́ма.', 'До́ма съм.']).verdict).toBe('correct')
  })
  it('allows a one-letter typo in a longer word', () => {
    expect(checkAnswer('здравйте', ['здраве́йте']).verdict).toBe('typo')
  })
  it('does not allow typos in two-letter words', () => {
    expect(checkAnswer('до', ['да']).verdict).toBe('wrong')
  })
  it('rejects wrong answers', () => {
    expect(checkAnswer('книга', ['маса']).verdict).toBe('wrong')
    expect(checkAnswer('', ['маса']).verdict).toBe('wrong')
  })
  it('does not accept «шт» for «щ» as correct, only as a typo with a hint', () => {
    const r = checkAnswer('ношт', ['нощ'])
    expect(r.verdict).toBe('typo')
    expect(r.hint).toContain('щ')
  })
  it('flags a missing definite article', () => {
    const r = checkAnswer('книга', ['кни́гата'])
    expect(r.verdict).toBe('wrong')
    expect(r.hint).toContain('артикл')
  })
  it('detects Russian leak letters', () => {
    expect(russianLeak('мыш')).toContain('ы')
    expect(russianLeak('это')).toContain('э')
    expect(russianLeak('мъж')).toBeNull()
    expect(checkAnswer('кныга', ['книга']).hint).toContain('ы')
  })
  it('flags a Russian word typed instead of the Bulgarian one', () => {
    const r = checkAnswer('дом', ['къ́ща'], { lang: 'bg', knownRussian: ['дом'] })
    expect(r.verdict).toBe('wrong')
    expect(r.hint).toContain('русское')
  })
})
