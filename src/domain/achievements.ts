import { units, wordIndex } from '../content'
import { currentStreak } from './xp'
import type { WordStat } from '../stores/progress'

export interface Achievement {
  id: string
  icon: string
  title: string
  desc: string
  earned: boolean
}

interface Snapshot {
  lessons: Record<string, { best: number; times: number }>
  words: Record<string, WordStat>
  activity: Record<string, number>
  perfectLessons: number
  today: string
}

export function learnedWords(words: Record<string, WordStat>): number {
  return Object.values(words).filter((w) => w.box >= 2).length
}

export function completedUnits(lessons: Snapshot['lessons']) {
  return units.filter((u) => u.lessons.every((l) => lessons[l.id]))
}

export function estimateCefr(lessons: Snapshot['lessons']): string {
  const done = completedUnits(lessons)
  if (done.length === 0) return 'A0'
  const order = ['A1', 'A2', 'B1']
  return done.map((u) => u.cefr).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0]
}

export function achievements(s: Snapshot): Achievement[] {
  const streak = currentStreak(s.activity, s.today)
  const lessonsDone = Object.keys(s.lessons).length
  const learned = learnedWords(s.words)
  const ffAll = [...wordIndex.values()].filter((w) => w.sim === 'false_friend')
  const ffMastered = ffAll.filter((w) => (s.words[w.id]?.box ?? 0) >= 2).length
  return [
    { id: 'first', icon: '🌱', title: 'Первый шаг', desc: 'Пройдите первый урок', earned: lessonsDone >= 1 },
    { id: 'streak3', icon: '🔥', title: 'Три дня подряд', desc: 'Серия из 3 дней', earned: streak >= 3 },
    { id: 'streak7', icon: '🔥', title: 'Неделя без пропусков', desc: 'Серия из 7 дней', earned: streak >= 7 },
    { id: 'words25', icon: '📚', title: '25 слов', desc: 'Выучите 25 слов', earned: learned >= 25 },
    { id: 'words100', icon: '🎓', title: '100 слов', desc: 'Выучите 100 слов', earned: learned >= 100 },
    { id: 'perfect', icon: '🏆', title: 'Без единой ошибки', desc: 'Пройдите урок идеально', earned: s.perfectLessons >= 1 },
    { id: 'unit', icon: '🏅', title: 'Юнит пройден', desc: 'Завершите все уроки юнита', earned: completedUnits(s.lessons).length >= 1 },
    {
      id: 'ff',
      icon: '⚠️',
      title: 'Охотник за ложными друзьями',
      desc: `Освойте все ложные друзья (${ffMastered}/${ffAll.length})`,
      earned: ffAll.length > 0 && ffMastered === ffAll.length,
    },
  ]
}
