import { Link, Navigate, useNavigate } from 'react-router-dom'
import { outline, units } from '../../content'
import { currentStreak, dailyGoalXp } from '../../domain/xp'
import { currentLessonId, today, useProgress } from '../../stores/progress'
import { plural } from '../lesson/Session'
import { useAuth } from '../auth/AuthProvider'

const OFFSETS = [0, 38, 58, 38, 0, -38, -58, -38]

export function HomePage() {
  const { onboarded, lessons, activity, xp, goalMin } = useProgress()
  const { user, enabled } = useAuth()
  const nav = useNavigate()
  if (!onboarded) return <Navigate to="/welcome" replace />

  const current = currentLessonId(lessons)
  const streak = currentStreak(activity, today())
  const todayXp = activity[today()] ?? 0
  const goalXp = dailyGoalXp(goalMin)
  const readyOrders = new Set(units.map((u) => u.order))

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b-2 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-[#131f24]/95">
        <Chip icon="🔥" value={streak} label={plural(streak, 'день', 'дня', 'дней')} tone="text-orange-500" />
        <Chip icon="⚡" value={xp} label="XP" tone="text-amber-500" />
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-bold opacity-70">
            <span>Цель дня</span>
            <span>
              {Math.min(todayXp, goalXp)}/{goalXp}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (todayXp / goalXp) * 100)}%` }} />
          </div>
        </div>
      </div>

      {enabled && !user && (
        <Link to="/login" className="mx-4 mt-4 block rounded-2xl bg-sky/10 p-3 text-center text-sm font-bold text-sky">
          Войдите, чтобы сохранить прогресс на всех устройствах
        </Link>
      )}

      {units.map((unit, ui) => {
        const unitLessonsDone = unit.lessons.filter((l) => lessons[l.id]).length
        return (
          <section key={unit.id} className="mt-6">
            <div className="mx-4 flex items-center gap-3 rounded-3xl p-4 text-white shadow-[0_4px_0_rgba(0,0,0,0.2)]" style={{ background: unit.color }}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                  Юнит {unit.order} · {unit.cefr}
                </p>
                <h2 className="text-xl font-extrabold leading-tight">{unit.title_ru}</h2>
                <p className="text-sm opacity-90">{unit.subtitle_ru}</p>
                <p className="mt-1 text-xs font-bold opacity-80">
                  {unitLessonsDone}/{unit.lessons.length} уроков
                </p>
              </div>
              <Link
                to={`/guide/${unit.id}`}
                className="shrink-0 rounded-2xl border-2 border-b-4 border-white/40 bg-white/20 px-3 py-2 text-sm font-extrabold hover:bg-white/30"
              >
                📖 Гид
              </Link>
            </div>

            <ol className="mt-10 flex flex-col items-center gap-4">
              {unit.lessons.map((l, i) => {
                const done = Boolean(lessons[l.id])
                const isCurrent = l.id === current
                const locked = !done && !isCurrent
                const offset = OFFSETS[(i + ui * 3) % OFFSETS.length]
                return (
                  <li key={l.id} style={{ transform: `translateX(${offset}px)` }} className="relative flex flex-col items-center">
                    {isCurrent && (
                      <span className="absolute -top-8 animate-bounce rounded-xl border-2 bg-white px-3 py-1 text-sm font-extrabold uppercase text-brand dark:border-slate-600 dark:bg-[#1b2a31]">
                        Начать
                      </span>
                    )}
                    <button
                      disabled={locked}
                      aria-label={`${l.title_ru}${done ? ', пройден' : locked ? ', закрыт' : ''}`}
                      onClick={() => nav(`/lesson/${l.id}`)}
                      className={`grid h-[72px] w-[72px] place-items-center rounded-full border-b-8 text-3xl transition active:translate-y-1 active:border-b-4 ${
                        done
                          ? 'border-[#c99400] bg-[#ffc800]'
                          : isCurrent
                            ? 'border-brand-dark bg-brand ring-4 ring-brand/30'
                            : 'border-slate-300 bg-slate-200 opacity-80 dark:border-slate-700 dark:bg-slate-600'
                      }`}
                    >
                      <span className={locked ? 'opacity-40 grayscale' : ''}>{done ? '✓' : locked ? '🔒' : l.icon}</span>
                    </button>
                    <span className="mt-1 max-w-[9rem] text-center text-xs font-bold opacity-70">{l.title_ru}</span>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      <section className="mx-4 mt-10">
        <h2 className="mb-3 text-lg font-extrabold">Дальше по курсу</h2>
        <ul className="space-y-2">
          {outline
            .filter((u) => !readyOrders.has(u.order))
            .map((u) => (
              <li key={u.order} className="flex items-center gap-3 rounded-2xl border-2 border-dashed p-3 opacity-70 dark:border-slate-700">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-extrabold dark:bg-slate-700">{u.order}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{u.title_ru}</p>
                  <p className="truncate text-xs opacity-80">{u.focus_ru}</p>
                </div>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-700">{u.cefr}</span>
              </li>
            ))}
        </ul>
      </section>
    </div>
  )
}

function Chip({ icon, value, label, tone }: { icon: string; value: number; label: string; tone: string }) {
  return (
    <div className={`flex items-center gap-1 font-extrabold ${tone}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-lg">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}
