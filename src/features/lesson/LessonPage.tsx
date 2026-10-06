import { useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { lessonIndex, wordsOf } from '../../content'
import { buildLesson } from '../../domain/lessonBuilder'
import { Btn, SimBadge, SpeakBtn } from '../../components/ui'
import { useShow } from '../../lib/useShow'
import { Session } from './Session'

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const nav = useNavigate()
  const entry = lessonIndex.get(lessonId)
  const [started, setStarted] = useState(false)
  const show = useShow()

  const exercises = useMemo(() => (entry && started ? buildLesson(entry.unit, entry.lesson) : []), [entry, started])

  if (!entry) return <Navigate to="/" replace />
  const { unit, lesson } = entry

  if (started) return <Session exercises={exercises} kind="lesson" lessonId={lesson.id} onExit={() => nav('/')} />

  const words = wordsOf(lesson)
  return (
    <div className="mx-auto min-h-svh max-w-xl px-5 pb-32 pt-4">
      <button aria-label="Назад" onClick={() => nav('/')} className="mb-2 grid h-10 w-10 place-items-center rounded-full text-2xl opacity-60">
        ←
      </button>
      <p className="text-sm font-bold uppercase tracking-wide opacity-60">{unit.title_ru}</p>
      <h1 className="text-3xl font-extrabold">
        {lesson.icon} {lesson.title_ru}
      </h1>

      {lesson.culture && (
        <div className="mt-5 rounded-3xl border-2 border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-700 dark:bg-[#3b2a0a]">
          <p className="mb-1 font-extrabold">🌍 Культурная заметка</p>
          {lesson.culture}
        </div>
      )}

      <h2 className="mb-2 mt-6 text-lg font-extrabold">Новые слова</h2>
      <ul className="space-y-2">
        {words.map((w) => (
          <li key={w.id} className="rounded-2xl border-2 p-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                {w.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-extrabold">{show(w.bg)}</p>
                <p className="opacity-80">{w.ru}</p>
              </div>
              <SimBadge sim={w.sim} />
              <SpeakBtn text={w.bg} />
            </div>
            {w.note && <p className="mt-2 rounded-xl bg-amber-100 p-2 text-sm text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">⚠️ {w.note}</p>}
          </li>
        ))}
      </ul>

      {lesson.sentences.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-lg font-extrabold">Фразы</h2>
          <ul className="space-y-2">
            {lesson.sentences.map((s) => (
              <li key={s.bg} className="flex items-center gap-3 rounded-2xl border-2 p-3 dark:border-slate-700">
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold">{show(s.bg)}</p>
                  <p className="text-sm opacity-80">{s.ru}</p>
                  {s.note && <p className="mt-1 text-xs opacity-70">{s.note}</p>}
                </div>
                <SpeakBtn text={s.bg} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="fixed inset-x-0 bottom-0 border-t-2 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-[#131f24]">
        <div className="mx-auto max-w-xl">
          <Btn onClick={() => setStarted(true)}>Начать урок</Btn>
        </div>
      </div>
    </div>
  )
}
