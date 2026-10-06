import { useState } from 'react'
import { speak } from '../lib/audio'
import { SpeakBtn } from '../components/ui'
import type { ExerciseProps, SpotEx } from './types'

/** "Find the mistake": tap the wrong word, or say the sentence is correct. */
export function Spot({ ex, onAnswer, locked }: ExerciseProps<SpotEx>) {
  const words = ex.sentence.split(' ')
  const [picked, setPicked] = useState<string | null>(null)

  function pick(v: string) {
    setPicked(v)
    onAnswer(v)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">Найдите ошибку</h2>
      <p className="text-sm opacity-70">Нажмите на неверное слово. Если ошибки нет, выберите «Ошибок нет».</p>
      <div className="flex items-start gap-3 rounded-3xl bg-slate-100 p-4 dark:bg-[#1f2c33]">
        <div className="flex flex-1 flex-wrap gap-2" role="group" aria-label="Предложение">
          {words.map((w, i) => {
            const isErr = locked && ex.errors.includes(i)
            const isPicked = picked === String(i)
            return (
              <button
                key={i}
                disabled={locked}
                aria-pressed={isPicked}
                onClick={() => pick(String(i))}
                className={`rounded-xl border-2 border-b-4 px-3 py-2 text-xl font-bold transition active:translate-y-0.5 ${
                  isErr
                    ? 'border-danger bg-danger/10 text-danger'
                    : isPicked
                      ? 'border-sky bg-sky/10 text-sky'
                      : 'border-transparent bg-white hover:border-slate-300 dark:bg-[#1b2a31]'
                }`}
              >
                {w}
              </button>
            )
          })}
        </div>
        <SpeakBtn text={ex.fix} />
      </div>
      <button
        disabled={locked}
        aria-pressed={picked === 'none'}
        onClick={() => {
          pick('none')
          speak(ex.fix)
        }}
        className={`w-full rounded-2xl border-2 border-b-4 p-4 text-lg font-bold ${
          picked === 'none' ? 'border-sky bg-sky/10 text-sky' : 'dark:border-slate-600'
        }`}
      >
        ✓ Ошибок нет
      </button>
    </div>
  )
}
