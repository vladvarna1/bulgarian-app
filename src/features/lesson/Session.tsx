import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { currentStreak, dailyGoalXp, sessionXp } from '../../domain/xp'
import { registry, checkExercise } from '../../exercises/registry'
import type { AnswerValue, CheckResult, Exercise, ExerciseDef } from '../../exercises/types'
import { sfx } from '../../lib/audio'
import { useShow } from '../../lib/useShow'
import { Btn, SpeakBtn } from '../../components/ui'
import { today, useProgress, type SessionResult } from '../../stores/progress'

interface Props {
  exercises: Exercise[]
  kind: 'lesson' | 'practice'
  lessonId?: string
  onExit: () => void
}

export function Session({ exercises, kind, lessonId, onExit }: Props) {
  const [queue, setQueue] = useState<Exercise[]>(exercises)
  const [idx, setIdx] = useState(0)
  const [answer, setAnswer] = useState<AnswerValue | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [summary, setSummary] = useState<SessionResult | null>(null)
  const [startedAt] = useState(() => Date.now())
  const firstOk = useRef(0)
  const wordResults = useRef<Map<string, boolean>>(new Map())
  const tagResults = useRef<{ tag: string; ok: boolean }[]>([])
  const sound = useProgress((s) => s.settings.sound)
  const completeSession = useProgress((s) => s.completeSession)
  const total = exercises.length

  const ex = queue[idx]

  const finish = useCallback(() => {
    const seconds = Math.round((Date.now() - startedAt) / 1000)
    const r: SessionResult = {
      lessonId,
      firstTryCorrect: firstOk.current,
      total,
      seconds,
      xp: sessionXp({ firstTryCorrect: firstOk.current, total, seconds, kind }),
      words: [...wordResults.current].map(([id, ok]) => ({ id, ok })),
      tags: tagResults.current,
    }
    completeSession(r)
    setSummary(r)
    if (sound) sfx('done')
  }, [completeSession, kind, lessonId, sound, total, startedAt])

  const check = useCallback(() => {
    if (!ex || answer === null || result) return
    const res = checkExercise(ex, answer)
    setResult(res)
    const isRetry = ex.id.endsWith('-r')
    const passed = res.verdict !== 'wrong'
    if (sound) sfx(passed ? 'ok' : 'bad')
    if (!isRetry) {
      if (passed) firstOk.current++
      const bad = new Set(res.badWordIds ?? [])
      for (const id of ex.wordIds) wordResults.current.set(id, passed && !bad.has(id))
      if (ex.tag && ex.tag !== 'vocab') tagResults.current.push({ tag: ex.tag, ok: passed })
    }
    if (!passed) setQueue((q) => [...q, { ...ex, id: ex.id.replace(/-r$/, '') + '-r' }])
  }, [answer, ex, result, sound])

  const next = useCallback(() => {
    if (idx + 1 >= queue.length) return finish()
    setIdx(idx + 1)
    setAnswer(null)
    setResult(null)
  }, [finish, idx, queue.length])

  const act = useRef(() => {})
  useEffect(() => {
    act.current = () => (result ? next() : check())
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.target instanceof HTMLTextAreaElement) return
      if (e.target instanceof HTMLButtonElement && !result) return
      e.preventDefault()
      act.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result])

  if (summary) return <EndScreen result={summary} onDone={onExit} />
  if (!ex) return null

  const def = registry[ex.type] as ExerciseDef<Exercise>
  const progress = Math.min(1, idx / queue.length)

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col">
      <header className="flex items-center gap-3 px-4 pb-2 pt-4">
        <button
          aria-label="Закрыть урок"
          onClick={() => (window.confirm('Выйти из урока? Прогресс этого урока не сохранится.') ? onExit() : undefined)}
          className="grid h-10 w-10 place-items-center rounded-full text-2xl opacity-60 hover:opacity-100"
        >
          ✕
        </button>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-4 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
        >
          <div className="h-full rounded-full bg-brand transition-all duration-300" style={{ width: `${Math.max(progress * 100, 4)}%` }} />
        </div>
      </header>

      <main className="flex-1 px-5 pb-56 pt-4">
        <def.Component key={ex.id} ex={ex} onAnswer={setAnswer} onSubmit={() => act.current()} locked={Boolean(result)} />
      </main>

      <footer
        className={`fixed inset-x-0 bottom-0 border-t-2 pb-[env(safe-area-inset-bottom)] transition-colors ${
          !result
            ? 'bg-white dark:bg-[#131f24] dark:border-slate-700'
            : result.verdict === 'correct'
              ? 'border-[#a5ed6e] bg-[#d7ffb8] dark:border-[#3b6b12] dark:bg-[#1d3a0c]'
              : result.verdict === 'typo'
                ? 'border-[#fcd34d] bg-[#fef3c7] dark:border-[#92400e] dark:bg-[#3b2a0a]'
                : 'border-[#ffb3b3] bg-[#ffdfe0] dark:border-[#7f1d1d] dark:bg-[#3b1214]'
        }`}
      >
        <div className="mx-auto max-w-xl space-y-3 p-4">
          {result && <FeedbackSheet ex={ex} result={result} />}
          {result ? (
            <Btn variant={result.verdict === 'wrong' ? 'danger' : result.verdict === 'typo' ? 'warn' : 'primary'} onClick={next} autoFocus>
              Продолжить
            </Btn>
          ) : (
            <Btn disabled={answer === null} onClick={check}>
              Проверить
            </Btn>
          )}
        </div>
      </footer>
    </div>
  )
}

function FeedbackSheet({ ex, result }: { ex: Exercise; result: CheckResult }) {
  const show = useShow()
  const title =
    result.verdict === 'correct' ? 'Правильно!' : result.verdict === 'typo' ? 'Почти! Опечатка' : 'Неправильно'
  const color =
    result.verdict === 'correct' ? 'text-[#2d6a00] dark:text-[#8ee05a]' : result.verdict === 'typo' ? 'text-[#92400e] dark:text-[#fbbf24]' : 'text-[#c01b1b] dark:text-[#ff8a8a]'
  return (
    <div className={`flex items-start gap-3 ${color}`} aria-live="polite">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xl font-extrabold">{result.verdict === 'correct' ? `✓ ${title}` : result.verdict === 'typo' ? `~ ${title}` : `✕ ${title}`}</p>
        {result.verdict !== 'correct' && ex.type !== 'match' && (
          <p className="font-bold">
            {result.verdict === 'typo' ? 'Правильно: ' : 'Правильный ответ: '}
            {show(result.correct)}
          </p>
        )}
        {result.verdict === 'typo' && ex.type === 'match' && result.hint && <p className="font-bold">{result.hint}</p>}
        {result.hint && ex.type !== 'match' && <p className="text-sm font-semibold">💡 {result.hint}</p>}
        {result.explanation && <p className="text-sm opacity-90">{show(result.explanation)}</p>}
      </div>
      {result.speak && <SpeakBtn text={result.speak} />}
    </div>
  )
}

function EndScreen({ result, onDone }: { result: SessionResult; onDone: () => void }) {
  const activity = useProgress((s) => s.activity)
  const goalMin = useProgress((s) => s.goalMin)
  const streak = currentStreak(activity, today())
  const todayXp = activity[today()] ?? 0
  const goalXp = dailyGoalXp(goalMin)
  const accuracy = result.total ? Math.round((result.firstTryCorrect / result.total) * 100) : 0
  const mins = Math.floor(result.seconds / 60)
  const secs = String(result.seconds % 60).padStart(2, '0')
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 8) * 0.18,
        dur: 2.4 + (i % 5) * 0.4,
        icon: ['🎉', '⭐', '✨', '🟢', '🟡'][i % 5],
      })),
    [],
  )
  return (
    <div className="relative mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center overflow-hidden px-6 text-center">
      {accuracy >= 60 &&
        confetti.map((c, i) => (
          <span key={i} aria-hidden className="confetti pointer-events-none absolute top-0 text-2xl" style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }}>
            {c.icon}
          </span>
        ))}
      <div className="text-7xl">{accuracy === 100 ? '🏆' : accuracy >= 70 ? '🎉' : '💪'}</div>
      <h1 className="mt-4 text-3xl font-extrabold text-brand">{accuracy === 100 ? 'Идеально!' : 'Урок пройден!'}</h1>
      <div className="mt-8 grid w-full grid-cols-3 gap-3">
        <Stat label="Опыт" value={`+${result.xp}`} icon="⚡" color="text-amber-500" />
        <Stat label="Точность" value={`${accuracy}%`} icon="🎯" color="text-brand" />
        <Stat label="Время" value={`${mins}:${secs}`} icon="⏱️" color="text-sky" />
      </div>
      <div className="mt-6 w-full rounded-3xl border-2 p-4 text-left dark:border-slate-700">
        <p className="font-extrabold">🔥 Серия: {streak} {plural(streak, 'день', 'дня', 'дней')}</p>
        <p className="mt-1 text-sm opacity-80">
          Дневная цель: {Math.min(todayXp, goalXp)} / {goalXp} XP {todayXp >= goalXp ? '— выполнена! 🎊' : ''}
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (todayXp / goalXp) * 100)}%` }} />
        </div>
      </div>
      <div className="mt-8 w-full">
        <Btn onClick={onDone} autoFocus>
          Продолжить
        </Btn>
      </div>
    </div>
  )
}

function Stat({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <div className="rounded-2xl border-2 p-3 dark:border-slate-700">
      <p className="text-xs font-bold uppercase opacity-60">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${color}`}>
        {icon} {value}
      </p>
    </div>
  )
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
