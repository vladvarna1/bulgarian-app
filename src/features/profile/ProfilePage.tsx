import { units } from '../../content'
import { TAGS } from '../../content/schema'
import { achievements, completedUnits, estimateCefr } from '../../domain/achievements'
import { currentStreak, lastDays } from '../../domain/xp'
import { today, useProgress } from '../../stores/progress'
import { Card } from '../../components/ui'

const DOW = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

export function ProfilePage() {
  const { xp, activity, lessons, words, tags, perfectLessons } = useProgress()
  const t = today()
  const streak = currentStreak(activity, t)
  const week = lastDays(t, 7)
  const max = Math.max(1, ...week.map((d) => activity[d] ?? 0))
  const month = lastDays(t, 28)
  const ach = achievements({ lessons, words, tags, activity, perfectLessons, today: t })
  const cefr = estimateCefr(lessons)

  return (
    <div className="space-y-5 p-4">
      <h1 className="text-3xl font-extrabold">Профиль</h1>

      <div className="grid grid-cols-2 gap-3">
        <Tile icon="🔥" value={streak} label="дней подряд" />
        <Tile icon="⚡" value={xp} label="всего XP" />
        <Tile icon="🎯" value={Object.values(tags).reduce((n, x) => n + x.ok, 0)} label="верных ответов по грамматике" />
        <Tile icon="🏅" value={`${completedUnits(lessons).length}/${units.length}`} label="юнитов пройдено" />
      </div>

      <Card>
        <p className="text-sm font-bold uppercase opacity-60">Оценка уровня</p>
        <p className="text-4xl font-extrabold text-brand">{cefr}</p>
        <p className="text-sm opacity-70">Ориентировочно, по самому высокому полностью пройденному юниту.</p>
      </Card>

      {Object.keys(tags).length > 0 && (
        <Card>
          <p className="mb-3 font-extrabold">Точность по правилам</p>
          <ul className="space-y-3">
            {Object.entries(tags)
              .filter(([, v]) => v.ok + v.bad > 0)
              .sort(([, a], [, b]) => a.ok / (a.ok + a.bad) - b.ok / (b.ok + b.bad))
              .map(([k, v]) => {
                const acc = Math.round((v.ok / (v.ok + v.bad)) * 100)
                return (
                  <li key={k}>
                    <div className="mb-1 flex justify-between text-sm font-bold">
                      <span>{TAGS[k as keyof typeof TAGS] ?? k}</span>
                      <span className={acc >= 85 ? 'text-brand' : acc >= 60 ? 'text-amber-500' : 'text-danger'}>{acc}% · {v.ok + v.bad}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className={`h-full rounded-full ${acc >= 85 ? 'bg-brand' : acc >= 60 ? 'bg-amber-400' : 'bg-danger'}`} style={{ width: `${acc}%` }} />
                    </div>
                  </li>
                )
              })}
          </ul>
        </Card>
      )}

      <Card>
        <p className="mb-3 font-extrabold">XP за неделю</p>
        <div className="flex h-32 items-end gap-2">
          {week.map((d) => {
            const v = activity[d] ?? 0
            return (
              <div key={d} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-bold opacity-70">{v || ''}</span>
                <div className="w-full rounded-t-lg bg-amber-400" style={{ height: `${Math.max(v ? 8 : 3, (v / max) * 88)}px`, opacity: v ? 1 : 0.25 }} />
                <span className="text-xs opacity-60">{DOW[new Date(d + 'T12:00:00Z').getUTCDay()]}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <p className="mb-3 font-extrabold">Календарь серии</p>
        <div className="grid grid-cols-7 gap-1.5">
          {month.map((d) => (
            <div
              key={d}
              title={`${d}: ${activity[d] ?? 0} XP`}
              className={`aspect-square rounded-lg ${(activity[d] ?? 0) > 0 ? 'bg-orange-400' : 'bg-slate-200 dark:bg-slate-700'} ${d === t ? 'ring-2 ring-sky' : ''}`}
            />
          ))}
        </div>
      </Card>

      <div>
        <p className="mb-3 text-xl font-extrabold">Достижения</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ach.map((a) => (
            <li key={a.id} className={`flex items-center gap-3 rounded-2xl border-2 p-3 dark:border-slate-700 ${a.earned ? '' : 'opacity-50 grayscale'}`}>
              <span className="text-3xl">{a.icon}</span>
              <div>
                <p className="font-extrabold">{a.title}</p>
                <p className="text-sm opacity-70">{a.desc}</p>
              </div>
              {a.earned && <span className="ml-auto text-xl">✅</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function Tile({ icon, value, label }: { icon: string; value: number | string; label: string }) {
  return (
    <div className="rounded-3xl border-2 p-4 dark:border-slate-700">
      <p className="text-2xl font-extrabold">
        {icon} {value}
      </p>
      <p className="text-sm opacity-70">{label}</p>
    </div>
  )
}
