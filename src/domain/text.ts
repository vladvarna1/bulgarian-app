/** Remove stress marks (combining acute) but keep й / ѝ intact. */
export function stripStress(s: string): string {
  return s.normalize('NFD').replace(/́/g, '').normalize('NFC')
}

/** Canonical form used for answer comparison. */
export function normalize(s: string): string {
  return stripStress(s)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/ѝ/g, 'и')
    .replace(/ѐ/g, 'е')
    .replace(/[.,!?;:"«»“”„()—–\-…'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[b.length]
}

/** Allowed edit distance for one word: none for tiny words, 1 for short, 2 for long. */
export function typoLimit(word: string): number {
  if (word.length <= 2) return 0
  return word.length <= 6 ? 1 : 2
}

/** true if `input` differs from `target` only by a small typo in at most one word. */
export function isTypo(input: string, target: string): boolean {
  const a = input.split(' ')
  const b = target.split(' ')
  if (a.length !== b.length) return false
  let wrongWords = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue
    wrongWords++
    if (wrongWords > 1) return false
    if (levenshtein(a[i], b[i]) > typoLimit(b[i])) return false
  }
  return wrongWords === 1
}

export function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean)
}
