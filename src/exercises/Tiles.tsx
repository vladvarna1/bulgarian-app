import { useEffect, useState } from 'react'
import { speak } from '../lib/audio'
import { useShow } from '../lib/useShow'
import { SpeakBtn } from '../components/ui'
import { TextInput } from './TextInput'
import type { ExerciseProps, TilesEx } from './types'

export function Tiles({ ex, onAnswer, onSubmit, locked }: ExerciseProps<TilesEx>) {
  const show = useShow()
  const [chosen, setChosen] = useState<number[]>([])
  const [typing, setTyping] = useState(false)
  const [text, setText] = useState('')

  useEffect(() => {
    if (ex.speak) speak(ex.speak)
  }, [ex.speak])

  function update(next: number[]) {
    setChosen(next)
    onAnswer(next.length ? next.map((i) => ex.tiles[i]).join(' ') : null)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">
        {ex.hidePrompt ? ex.prompt : ex.targetLang === 'ru' ? 'Переведите на русский' : 'Переведите на болгарский'}
      </h2>
      {ex.speak && (
        <div className="flex items-center gap-3">
          <SpeakBtn text={ex.speak} size="lg" />
          <SpeakBtn text={ex.speak} slow size="md" />
          {!ex.hidePrompt && <span className="text-xl font-bold">{show(ex.prompt)}</span>}
        </div>
      )}
      {!ex.speak && <p className="rounded-2xl bg-slate-100 p-4 text-xl font-bold dark:bg-[#1f2c33]">{ex.prompt}</p>}

      {typing ? (
        <TextInput
          value={text}
          onChange={(v) => {
            setText(v)
            onAnswer(v.trim() ? v : null)
          }}
          onSubmit={onSubmit}
          disabled={locked}
          lang={ex.targetLang}
        />
      ) : (
        <>
          <div
            aria-label="Ваш ответ"
            className="flex min-h-[7.5rem] flex-wrap content-start gap-2 border-y-2 py-3 dark:border-slate-600"
          >
            {chosen.map((i, pos) => (
              <button
                key={i}
                disabled={locked}
                onClick={() => update(chosen.filter((_, p) => p !== pos))}
                className="rounded-2xl border-2 border-b-4 bg-white px-4 py-2 text-lg font-bold dark:border-slate-600 dark:bg-[#1b2a31]"
              >
                {ex.tiles[i]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {ex.tiles.map((t, i) => {
              const used = chosen.includes(i)
              return (
                <button
                  key={i}
                  disabled={locked || used}
                  onClick={() => update([...chosen, i])}
                  className={`rounded-2xl border-2 border-b-4 px-4 py-2 text-lg font-bold transition active:translate-y-0.5 ${
                    used
                      ? 'border-transparent bg-slate-200 text-transparent dark:bg-slate-700'
                      : 'bg-white dark:border-slate-600 dark:bg-[#1b2a31]'
                  }`}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </>
      )}
      {!locked && (
        <button
          onClick={() => {
            setTyping((t) => !t)
            setChosen([])
            setText('')
            onAnswer(null)
          }}
          className="mx-auto block rounded-xl border-2 px-4 py-2 text-sm font-bold text-sky dark:border-slate-600"
        >
          {typing ? 'Собрать из слов' : 'Печатать вместо этого'}
        </button>
      )}
    </div>
  )
}
