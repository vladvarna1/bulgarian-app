import { useEffect, useState } from 'react'
import { speak } from '../lib/audio'
import { useShow } from '../lib/useShow'
import { SpeakBtn } from '../components/ui'
import type { ChooseEx, ExerciseProps } from './types'

export function Choose({ ex, onAnswer, locked }: ExerciseProps<ChooseEx>) {
  const show = useShow()
  const [picked, setPicked] = useState<string | null>(null)
  const hasGap = ex.prompt.includes('___')

  useEffect(() => {
    if (ex.speak) speak(ex.speak)
  }, [ex.speak])

  useEffect(() => {
    if (locked) return
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key)
      if (n >= 1 && n <= ex.options.length) {
        setPicked(ex.options[n - 1])
        onAnswer(ex.options[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ex.options, locked, onAnswer])

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">
        {ex.hidePrompt ? ex.prompt : hasGap ? 'Вставьте пропущенное' : ex.speak ? 'Что это значит?' : ex.prompt}
      </h2>
      {hasGap && (
        <p className="rounded-3xl bg-slate-100 p-4 text-2xl font-bold leading-relaxed dark:bg-[#1f2c33]">
          {ex.prompt.split('___').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && <span className="mx-1 inline-block min-w-[4.5rem] border-b-4 border-sky text-center text-sky">{picked ?? ' '}</span>}
            </span>
          ))}
        </p>
      )}
      {(ex.speak || ex.emoji) && (
        <div className="flex items-center gap-4 rounded-3xl bg-slate-100 p-4 dark:bg-[#1f2c33]">
          {ex.speak && <SpeakBtn text={ex.speak} size="lg" />}
          {ex.speak && !ex.hidePrompt && <span className="text-3xl font-extrabold">{show(ex.prompt)}</span>}
          {ex.emoji && !ex.hidePrompt && <span className="ml-auto text-5xl">{ex.emoji}</span>}
          {ex.hidePrompt && <SpeakBtn text={ex.speak!} slow size="md" />}
        </div>
      )}
      <div className="grid gap-3" role="radiogroup">
        {ex.options.map((o, i) => {
          const on = picked === o
          return (
            <button
              key={o}
              role="radio"
              aria-checked={on}
              disabled={locked}
              onClick={() => {
                setPicked(o)
                onAnswer(o)
                if (ex.optionsLang === 'bg') speak(o)
              }}
              className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left text-lg font-bold transition active:translate-y-0.5 ${
                on
                  ? 'border-sky bg-sky/10 text-sky'
                  : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-[#1b2a31] dark:hover:bg-[#223841]'
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 text-sm opacity-70">{i + 1}</span>
              {show(o)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
