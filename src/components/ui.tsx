import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { speak } from '../lib/audio'

const variants = {
  primary: 'bg-brand text-white border-brand-dark',
  secondary: 'bg-white text-sky border-slate-300 dark:bg-[#1f2c33] dark:border-slate-600',
  danger: 'bg-danger text-white border-[#b91c1c]',
  warn: 'bg-[#f59e0b] text-white border-[#b45309]',
  gray: 'bg-slate-200 text-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-800',
} as const

export function Btn({
  variant = 'primary',
  className = '',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      {...p}
      className={`w-full rounded-2xl border-2 border-b-4 px-4 py-3.5 text-base font-extrabold uppercase tracking-wide transition active:translate-y-0.5 active:border-b-2 disabled:pointer-events-none ${variants[p.disabled ? 'gray' : variant]} ${className}`}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border-2 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2a31] ${className}`}>{children}</div>
  )
}

export function SpeakBtn({ text, slow, size = 'md' }: { text: string; slow?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-16 w-16 text-3xl' : size === 'sm' ? 'h-8 w-8 text-base' : 'h-11 w-11 text-xl'
  return (
    <button
      type="button"
      aria-label={slow ? 'Послушать медленно' : 'Послушать'}
      onClick={(e) => {
        e.stopPropagation()
        speak(text, { slow })
      }}
      className={`grid shrink-0 place-items-center rounded-full bg-sky/15 ${dim} text-sky hover:bg-sky/25`}
    >
      {slow ? '🐢' : '🔊'}
    </button>
  )
}

const simStyle = {
  identical: ['=', 'bg-emerald-100 text-emerald-800', 'Совпадает с русским'],
  similar: ['≈', 'bg-sky-100 text-sky-800', 'Похоже на русское слово'],
  different: ['≠', 'bg-slate-200 text-slate-700', 'Новое слово'],
  false_friend: ['⚠', 'bg-amber-200 text-amber-900', 'Ложный друг!'],
} as const

export function SimBadge({ sim }: { sim: keyof typeof simStyle }) {
  const [sym, cls, label] = simStyle[sim]
  return (
    <span title={label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>
      {sym} {sim === 'false_friend' ? 'ложный друг' : ''}
    </span>
  )
}
