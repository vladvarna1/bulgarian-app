import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { units } from '../../content'
import { TAGS, type Extra } from '../../content/schema'
import { Btn } from '../../components/ui'

const FLAGS_KEY = 'bgru-flags-v1'

function loadFlags(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(FLAGS_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

/** Content review for a native speaker: every authored exercise with its answer, plus a flag/comment box. */
export function ReviewPage() {
  const [flags, setFlags] = useState<Record<string, string>>(loadFlags)
  const [open, setOpen] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const total = useMemo(() => units.flatMap((u) => u.lessons).reduce((n, l) => n + l.extra.length, 0), [])

  function setFlag(key: string, note: string | null) {
    const next = { ...flags }
    if (note === null) delete next[key]
    else next[key] = note
    setFlags(next)
    try {
      localStorage.setItem(FLAGS_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable */
    }
  }

  async function copy() {
    const text = JSON.stringify(
      Object.entries(flags).map(([key, note]) => ({ id: key, comment: note })),
      null,
      2,
    )
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Скопируйте текст вручную', text)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-4">
      <Link to="/settings" aria-label="Назад" className="mb-2 grid h-10 w-10 place-items-center rounded-full text-2xl opacity-60">
        ←
      </Link>
      <h1 className="text-3xl font-extrabold">Проверка контента</h1>
      <p className="mt-1 opacity-70">
        Все задания ({total}) с правильными ответами. Нашли ошибку или неестественную фразу? Отметьте 🚩 и напишите комментарий, потом
        нажмите «Скопировать отмеченные» и отправьте текст разработчику.
      </p>

      {units.map((u) => (
        <section key={u.id} className="mt-8">
          <h2 className="text-xl font-extrabold" style={{ color: u.color }}>
            {u.emoji} {u.title_ru} <span className="text-sm opacity-60">· {u.track === 'pro' ? 'основной курс' : 'основы'}</span>
          </h2>
          {u.lessons.map((l) => (
            <div key={l.id} className="mt-4">
              <h3 className="font-bold">
                {l.title_ru} <span className="text-xs opacity-50">{l.id}</span>
              </h3>
              <ol className="mt-2 space-y-2">
                {l.extra.map((e, i) => {
                  const key = `${l.id}-x${i}`
                  const flagged = key in flags
                  return (
                    <li key={key} className={`rounded-2xl border-2 p-3 dark:border-slate-700 ${flagged ? 'border-amber-400 bg-amber-50 dark:bg-[#3b2a0a]' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <ExtraView e={e} />
                          <p className="mt-1 text-xs opacity-50">
                            {key} · {TAGS[e.tag as keyof typeof TAGS] ?? e.tag}
                          </p>
                        </div>
                        <button
                          aria-label={flagged ? 'Снять отметку' : 'Отметить как проблемное'}
                          onClick={() => {
                            if (flagged) setFlag(key, null)
                            else {
                              setFlag(key, '')
                              setOpen(key)
                            }
                          }}
                          className={`text-xl ${flagged ? '' : 'opacity-30 hover:opacity-100'}`}
                        >
                          🚩
                        </button>
                      </div>
                      {flagged && (
                        <textarea
                          value={flags[key]}
                          autoFocus={open === key}
                          onChange={(ev) => setFlag(key, ev.target.value)}
                          placeholder="Что не так? Как правильно?"
                          aria-label="Комментарий"
                          rows={2}
                          className="mt-2 w-full rounded-xl border-2 bg-transparent p-2 text-sm dark:border-slate-600"
                        />
                      )}
                    </li>
                  )
                })}
              </ol>
            </div>
          ))}
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t-2 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-[#131f24]">
        <div className="mx-auto max-w-2xl">
          <Btn disabled={Object.keys(flags).length === 0} onClick={() => void copy()}>
            {copied ? 'Скопировано ✓' : `Скопировать отмеченные (${Object.keys(flags).length})`}
          </Btn>
        </div>
      </div>
    </div>
  )
}

function ExtraView({ e }: { e: Extra }) {
  const ok = 'font-bold text-[#2d6a00] dark:text-[#8ee05a]'
  switch (e.type) {
    case 'choose':
      return (
        <div>
          {e.passage && <p className="mb-1 whitespace-pre-line rounded-xl bg-slate-100 p-2 text-sm dark:bg-[#1f2c33]">{e.passage}</p>}
          <p className="font-bold">{e.prompt}</p>
          <p className="text-sm">
            {e.options.map((o, i) => (
              <span key={o} className={o === e.answer ? ok : 'opacity-70'}>
                {i > 0 && ' · '}
                {o === e.answer ? '✓ ' : ''}
                {o}
              </span>
            ))}
          </p>
          {e.explanation && <p className="mt-1 text-sm opacity-70">{e.explanation}</p>}
        </div>
      )
    case 'type':
      return (
        <div>
          <p className="font-bold">{e.prompt}</p>
          <p className={`text-sm ${ok}`}>✓ {[e.answer, ...e.accepted].join(' / ')}</p>
          {e.explanation && <p className="mt-1 text-sm opacity-70">{e.explanation}</p>}
        </div>
      )
    case 'tiles':
      return (
        <div>
          <p className="font-bold">{e.prompt}</p>
          <p className={`text-sm ${ok}`}>✓ {[e.answer, ...e.accepted].join(' / ')}</p>
          {e.explanation && <p className="mt-1 text-sm opacity-70">{e.explanation}</p>}
        </div>
      )
    case 'spot':
      return (
        <div>
          <p className="font-bold">
            {e.sentence.split(' ').map((w, i) => (
              <span key={i} className={e.errors.includes(i) ? 'text-danger underline' : ''}>
                {i > 0 && ' '}
                {w}
              </span>
            ))}
          </p>
          <p className={`text-sm ${ok}`}>{e.errors.length ? `✓ ${e.fix}` : '✓ ошибок нет'}</p>
          {e.explanation && <p className="mt-1 text-sm opacity-70">{e.explanation}</p>}
        </div>
      )
  }
}
