import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { extraIndex, lessonIndex, units, wordIndex } from '../../content'
import { TAGS } from '../../content/schema'
import { buildPractice, extraToExercise, shuffle } from '../../domain/lessonBuilder'
import type { Exercise } from '../../exercises/types'
import { currentLessonId, today, useProgress } from '../../stores/progress'
import { Session } from '../lesson/Session'

export type Mode = 'warmup' | 'daily' | 'mistakes' | 'weak' | 'grammar' | 'listen' | 'falseFriends'

const MODES: { id: Mode; icon: string; title: string; desc: string; always?: boolean }[] = [
  { id: 'warmup', icon: '🔥', title: 'Разминка', desc: 'Смесь заданий из пройденных уроков', always: true },
  { id: 'daily', icon: '📅', title: 'Повторение дня', desc: 'Задания, которые пора повторить', always: true },
  { id: 'mistakes', icon: '🩹', title: 'Повторить ошибки', desc: 'Задания, в которых вы ошиблись', always: true },
  { id: 'grammar', icon: '🎯', title: 'Слабые правила', desc: 'Грамматика, где вы чаще ошибаетесь', always: true },
  { id: 'weak', icon: '💪', title: 'Трудные задания', desc: 'То, что даётся труднее всего', always: true },
  { id: 'listen', icon: '🎧', title: 'Только аудирование', desc: 'Слова из «Основ»: слушайте и пишите' },
  { id: 'falseFriends', icon: '⚠️', title: 'Ложные друзья', desc: 'Слова из «Основ», похожие на русские' },
]

/** Item ids: word ids and authored-exercise keys share one progress table. */
function useItemPools(): Record<Mode, string[]> {
  const { lessons, words, tags } = useProgress()
  return useMemo(() => {
    const seen = new Set(Object.keys(words))
    for (const id of Object.keys(lessons)) {
      const l = lessonIndex.get(id)
      if (!l) continue
      l.lesson.words.forEach((w) => seen.add(w))
      l.lesson.extra.forEach((_, i) => seen.add(`${id}-x${i}`))
    }
    const items = [...seen].filter((id) => wordIndex.has(id) || extraIndex.has(id))
    const d = today()
    const stat = (id: string) => words[id]
    const weakTags = new Set(
      Object.entries(tags)
        .filter(([, t]) => t.bad > 0 && t.ok / (t.ok + t.bad) < 0.85)
        .map(([k]) => k),
    )
    const extras = items.filter((id) => extraIndex.has(id))
    const grammar = extras.filter((id) => weakTags.has(extraIndex.get(id)!.extra.tag))
    const unlocked = [...Object.keys(lessons), ...(currentLessonId(lessons) ? [currentLessonId(lessons)!] : [])]
    const warmup = unlocked.flatMap((id) => (lessonIndex.get(id)?.lesson.extra ?? []).map((_, i) => `${id}-x${i}`))
    return {
      warmup,
      daily: items.filter((id) => !stat(id) || stat(id).due <= d),
      mistakes: items.filter((id) => stat(id) && !stat(id).lastOk),
      weak: items.filter((id) => stat(id) && stat(id).bad > 0 && stat(id).box <= 2),
      grammar,
      listen: items.filter((id) => wordIndex.has(id)),
      falseFriends: items.filter((id) => wordIndex.get(id)?.sim === 'false_friend'),
    }
  }, [lessons, words, tags])
}

function buildFromItems(ids: string[], mode: Mode): Exercise[] {
  const picked = shuffle(ids).slice(0, 10)
  const allWords = units.flatMap((u) => u.words)
  const out: Exercise[] = []
  const wordItems = picked.filter((id) => wordIndex.has(id)).map((id) => wordIndex.get(id)!)
  if (wordItems.length) {
    out.push(...buildPractice(wordItems, { mode: mode === 'listen' ? 'listen' : mode === 'falseFriends' ? 'falseFriends' : 'mix', pool: allWords }))
  }
  for (const id of picked) {
    const e = extraIndex.get(id)
    if (e) out.push(extraToExercise(e.extra, id, e.unit.track))
  }
  return shuffle(out)
}

export function PracticePage() {
  const pools = useItemPools()
  const tags = useProgress((s) => s.tags)
  const hasProgress = Object.values(useProgress((s) => s.lessons)).length > 0
  const weak = Object.entries(tags)
    .filter(([, t]) => t.ok + t.bad >= 3)
    .map(([k, t]) => ({ k, acc: t.ok / (t.ok + t.bad) }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 3)

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-3xl font-extrabold">Практика</h1>
      {!hasProgress && (
        <p className="rounded-2xl bg-sky/10 p-4">
          Пройдите первый урок, и здесь появятся задания для повторения. Ошибки автоматически попадают в «Слабые правила».
        </p>
      )}
      {weak.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 dark:bg-[#3b2a0a]">
          <p className="font-extrabold">Над чем стоит поработать</p>
          <ul className="mt-1 text-sm">
            {weak.map((w) => (
              <li key={w.k}>
                • {TAGS[w.k as keyof typeof TAGS] ?? w.k} — {Math.round(w.acc * 100)}% верно
              </li>
            ))}
          </ul>
        </div>
      )}
      {MODES.filter((m) => m.always || pools[m.id].length > 0).map((m) => {
        const n = pools[m.id].length
        const disabled = n === 0
        const body = (
          <div className={`flex items-center gap-4 rounded-3xl border-2 border-b-4 p-4 dark:border-slate-700 ${disabled ? 'opacity-50' : 'active:translate-y-0.5'}`}>
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
  const pools = useItemPools()
  const m = MODES.find((x) => x.id === mode)
  const exercises = useMemo(() => (m ? buildFromItems(pools[m.id], m.id) : []), [m?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!m || exercises.length === 0) return <Navigate to="/practice" replace />
  return <Session exercises={exercises} kind="practice" onExit={() => nav('/practice')} />
}
