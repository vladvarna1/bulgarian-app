import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Btn } from '../../components/ui'
import { useProgress } from '../../stores/progress'

const REASONS = [
  { id: 'travel', icon: '✈️', label: 'Путешествия' },
  { id: 'family', icon: '👪', label: 'Семья и друзья' },
  { id: 'work', icon: '💼', label: 'Работа' },
  { id: 'moving', icon: '🏡', label: 'Переезд' },
]
const GOALS = [
  { min: 5, label: 'Лёгкая', desc: '5 минут в день' },
  { min: 10, label: 'Обычная', desc: '10 минут в день' },
  { min: 15, label: 'Серьёзная', desc: '15 минут в день' },
  { min: 20, label: 'Упорная', desc: '20 минут в день' },
]

export function Welcome() {
  const [step, setStep] = useState(0)
  const [reason, setReason] = useState('travel')
  const [goal, setGoal] = useState(10)
  const finish = useProgress((s) => s.finishOnboarding)
  const nav = useNavigate()

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col px-6 py-8">
      <div className="mb-8 flex gap-2" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <div className="text-center">
            <div className="text-8xl">🇧🇬</div>
            <h1 className="mt-6 text-3xl font-extrabold text-brand">Болгарский с нуля</h1>
            <p className="mt-3 text-lg">Учите болгарский, опираясь на русский. Короткие уроки, ложные друзья и понятные объяснения.</p>
            <ul className="mx-auto mt-8 max-w-xs space-y-3 text-left font-bold">
              <li>⚡ Уроки по 5–10 минут</li>
              <li>🧠 Похожие слова — быстрее, трудные — чаще</li>
              <li>🔊 Произношение каждого слова</li>
              <li>⚠️ Ложные друзья: «стол» ≠ стол!</li>
            </ul>
          </div>
        )}
        {step === 1 && (
          <div>
            <h1 className="mb-6 text-2xl font-extrabold">Зачем вы учите болгарский?</h1>
            <div className="grid gap-3">
              {REASONS.map((r) => (
                <Choice key={r.id} active={reason === r.id} onClick={() => setReason(r.id)}>
                  <span className="text-3xl">{r.icon}</span> {r.label}
                </Choice>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h1 className="mb-6 text-2xl font-extrabold">Сколько времени в день?</h1>
            <div className="grid gap-3">
              {GOALS.map((g) => (
                <Choice key={g.min} active={goal === g.min} onClick={() => setGoal(g.min)}>
                  <span className="font-extrabold">{g.label}</span>
                  <span className="ml-auto opacity-70">{g.desc}</span>
                </Choice>
              ))}
            </div>
          </div>
        )}
      </div>

      <Btn
        onClick={() => {
          if (step < 2) setStep(step + 1)
          else {
            finish(reason, goal)
            nav('/', { replace: true })
          }
        }}
      >
        {step === 0 ? 'Начать' : step === 1 ? 'Продолжить' : 'Поехали!'}
      </Btn>
    </div>
  )
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 p-4 text-left text-lg ${active ? 'border-sky bg-sky/10 text-sky' : 'dark:border-slate-600'}`}
    >
      {children}
    </button>
  )
}
