import { useMemo, useRef, useState } from 'react'
import { speak } from '../lib/audio'
import { shuffle } from '../domain/lessonBuilder'
import { useShow } from '../lib/useShow'
import type { ExerciseProps, MatchEx } from './types'

export function Match({ ex, onAnswer, locked }: ExerciseProps<MatchEx>) {
  const show = useShow()
  const left = useMemo(() => shuffle(ex.pairs), [ex.pairs])
  const right = useMemo(() => shuffle(ex.pairs), [ex.pairs])
  const [sel, setSel] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const [wrong, setWrong] = useState<string | null>(null)
  const mistakes = useRef(0)
  const bad = useRef(new Set<string>())

  function pickRight(id: string) {
    if (!sel || locked) return
    if (sel === id) {
      const bg = ex.pairs.find((p) => p.id === id)!.bg
      speak(bg)
      const next = [...done, id]
      setDone(next)
      setSel(null)
      if (next.length === ex.pairs.length) onAnswer({ mistakes: mistakes.current, badIds: [...bad.current] })
    } else {
      mistakes.current++
      bad.current.add(sel)
      setWrong(id)
      setTimeout(() => setWrong(null), 450)
    }
  }

  const cell = (state: 'idle' | 'sel' | 'done' | 'wrong') =>
    `w-full rounded-2xl border-2 border-b-4 p-3 text-lg font-bold transition ${
      state === 'done'
        ? 'border-transparent bg-slate-100 text-transparent dark:bg-slate-800'
        : state === 'sel'
          ? 'border-sky bg-sky/10 text-sky'
          : state === 'wrong'
            ? 'border-danger bg-danger/10 text-danger'
            : 'bg-white dark:border-slate-600 dark:bg-[#1b2a31]'
    }`

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-extrabold">{ex.prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-3">
          {left.map((p) => (
            <button
              key={p.id}
              disabled={locked || done.includes(p.id)}
              onClick={() => {
                setSel(p.id)
                speak(p.bg)
              }}
              className={cell(done.includes(p.id) ? 'done' : sel === p.id ? 'sel' : 'idle')}
            >
              {show(p.bg)}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {right.map((p) => (
            <button
              key={p.id}
              disabled={locked || done.includes(p.id)}
              onClick={() => pickRight(p.id)}
              className={cell(done.includes(p.id) ? 'done' : wrong === p.id ? 'wrong' : 'idle')}
            >
              {p.ru}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
