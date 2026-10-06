import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { lessonIndex, units, wordIndex } from '../../content'
import type { Word } from '../../content/schema'
import { buildPractice } from '../../domain/lessonBuilder'
import { today, useProgress } from '../../stores/progress'
import { Session } from '../lesson/Session'

export type Mode = 'daily' | 'mistakes' | 'weak' | 'listen' | 'falseFriends'

const MODES: { id: Mode; icon: string; title: string; desc: string }[] = [
  { id: 'daily', icon: '📅', title: 'Повторение дня', desc: 'Слова, которые пора повторить' },
  { id: 'mistakes', icon: '🩹', title: 'Повторить ошибки', desc: 'Слова, в которых вы ошиблись' },
  { id: 'weak', icon: '💪', title: 'Слабые слова', desc: 'Слова, которые даются труднее всего' },
  { id: 'listen', icon: '🎧', title: 'Только аудирование', desc: 'Слушайте и выбирайте или пишите' },
  { id: 'falseFriends', icon: '⚠️', title: 'Ложные друзья', desc: 'Слова, похожие на русские, но другие' },
]

/** Words the learner has met: those in completed lessons plus anything with stats. */
function useWordPools() {
  const { lessons, words } = useProgress()
  return useMemo(() => {
    const seen = new Set(Object.keys(words))
    for (const id of Object.keys(lessons)) lessonIndex.get(id)?.lesson.words.forEach((w) => seen.add(w))
    const seenWords = [...seen].map((id) => wordIndex.get(id)).filter((w): w is Word => Boolean(w))
    const d = today()
    const pick = (f: (w: Word) => boolean) => seenWords.filter(f)
    const stat = (w: Word) => words[w.id]
    const byMode: Record<Mode, Word[]> = {
      daily: pick((w) => !stat(w) || stat(w)!.due <= d),
      mistakes: pick((w) => stat(w) && !stat(w)!.lastOk),
      weak: pick((w) => stat(w) && stat(w)!.bad > 0 && stat(w)!.box <= 2),
      listen: seenWords,
      falseFriends: pick((w) => w.sim === 'false_friend'),
    }
    return byMode
  }, [lessons, words])
}

export function PracticePage() {
  const pools = useWordPools()
  const hasProgress = Object.values(useProgress((s) => s.lessons)).length > 0
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-3xl font-extrabold">Практика</h1>
      {!hasProgress && (
        <p className="rounded-2xl bg-sky/10 p-4">
          Пройдите первый урок, и здесь появятся слова для повторения. Ошибки и ложные друзья попадают сюда автоматически.
        </p>
      )}
      {MODES.map((m) => {
        const n = pools[m.id].length
        const disabled = n === 0
        const body = (
          <div
            className={`flex items-center gap-4 rounded-3xl border-2 border-b-4 p-4 dark:border-slate-700 ${disabled ? 'opacity-50' : 'active:translate-y-0.5'}`}
          >
            <span className="text-4xl">{m.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-extrabold">{m.title}</p>
              <p className="text-sm opacity-70">{m.desc}</p>
            </div>
            <span className="rounded-full bg-sky/15 px-3 py-1 text-sm font-extrabold text-sky">{n}</span>
          </div>
        )
        return disabled ? (
          <div key={m.id}>{body}</div>
        ) : (
          <Link key={m.id} to={`/practice/run/${m.id}`} className="block">
            {body}
          </Link>
        )
      })}
    </div>
  )
}

export function PracticeRun() {
  const { mode } = useParams()
  const nav = useNavigate()
  const pools = useWordPools()
  const m = MODES.find((x) => x.id === mode)
  const exercises = useMemo(() => {
    if (!m) return []
    const all = units.flatMap((u) => u.words)
    return buildPractice(pools[m.id], { mode: m.id === 'listen' ? 'listen' : m.id === 'falseFriends' ? 'falseFriends' : 'mix', pool: all })
    // build once when the screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m?.id])
  if (!m || exercises.length === 0) return <Navigate to="/practice" replace />
  return <Session exercises={exercises} kind="practice" onExit={() => nav('/practice')} />
}
