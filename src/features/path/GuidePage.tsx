import { Link, Navigate, useParams } from 'react-router-dom'
import { units } from '../../content'
import { SimBadge, SpeakBtn } from '../../components/ui'
import { useShow } from '../../lib/useShow'

export function GuidePage() {
  const { unitId } = useParams()
  const unit = units.find((u) => u.id === unitId)
  const show = useShow()
  if (!unit) return <Navigate to="/" replace />
  const falseFriends = unit.words.filter((w) => w.sim === 'false_friend')

  return (
    <div className="mx-auto max-w-xl px-4 pb-16 pt-4">
      <Link to="/" aria-label="Назад" className="mb-2 grid h-10 w-10 place-items-center rounded-full text-2xl opacity-60">
        ←
      </Link>
      <div className="rounded-3xl p-5 text-white" style={{ background: unit.color }}>
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">Гид · юнит {unit.order}</p>
        <h1 className="text-2xl font-extrabold">{unit.title_ru}</h1>
      </div>
      <p className="mt-4 text-lg">{unit.guide.intro}</p>

      <h2 className="mb-3 mt-8 text-xl font-extrabold">Русский ↔ болгарский</h2>
      <div className="space-y-4">
        {unit.guide.cards.map((c) => (
          <div key={c.title} className="overflow-hidden rounded-3xl border-2 dark:border-slate-700">
            <p className="bg-slate-100 px-4 py-2 font-extrabold dark:bg-[#1f2c33]">{c.title}</p>
            <div className="grid grid-cols-2 divide-x-2 dark:divide-slate-700">
              <div className="p-3">
                <p className="mb-1 text-xs font-extrabold uppercase text-sky">🇷🇺 Русский</p>
                <p>{c.ru}</p>
              </div>
              <div className="p-3">
                <p className="mb-1 text-xs font-extrabold uppercase text-brand">🇧🇬 Болгарский</p>
                <p className="font-bold">{show(c.bg)}</p>
              </div>
            </div>
            {c.note && <p className="border-t-2 bg-amber-50 px-4 py-2 text-sm dark:border-slate-700 dark:bg-[#3b2a0a]">💡 {c.note}</p>}
          </div>
        ))}
      </div>

      {unit.guide.tips.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl font-extrabold">Полезно знать</h2>
          <ul className="space-y-2">
            {unit.guide.tips.map((t) => (
              <li key={t} className="rounded-2xl bg-sky/10 p-3">
                💬 {t}
              </li>
            ))}
          </ul>
        </>
      )}

      {falseFriends.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-xl font-extrabold">⚠️ Ложные друзья в этом юните</h2>
          <ul className="space-y-2">
            {falseFriends.map((w) => (
              <li key={w.id} className="flex items-center gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-[#3b2a0a]">
                <div className="flex-1">
                  <p className="font-extrabold">
                    {show(w.bg)} = {w.ru}
                  </p>
                  {w.note && <p className="text-sm">{w.note}</p>}
                </div>
                <SpeakBtn text={w.bg} />
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mb-3 mt-8 text-xl font-extrabold">Все слова юнита</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {unit.words.map((w) => (
          <li key={w.id} className="flex items-center gap-2 rounded-2xl border-2 p-2 dark:border-slate-700">
            <span className="text-2xl">{w.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{show(w.bg)}</p>
              <p className="truncate text-sm opacity-70">{w.ru}</p>
            </div>
            <SimBadge sim={w.sim} />
            <SpeakBtn text={w.bg} size="sm" />
          </li>
        ))}
      </ul>
    </div>
  )
}
