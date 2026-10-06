import { useEffect, useRef, useState } from 'react'

const BG_KEYS = ['ъ', 'щ', 'ь', 'ю', 'я', 'ѝ']

/** Text box with an on-screen row of Bulgarian letters (users type on a Russian layout). */
export function TextInput({
  value,
  onChange,
  onSubmit,
  disabled,
  lang,
  autoFocus = true,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled: boolean
  lang: 'bg' | 'ru'
  autoFocus?: boolean
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    if (autoFocus) ref.current?.focus()
  }, [autoFocus])

  return (
    <div className="space-y-2">
      <textarea
        ref={ref}
        rows={2}
        value={value}
        disabled={disabled}
        lang={lang === 'bg' ? 'bg' : 'ru'}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Ваш ответ"
        placeholder={lang === 'bg' ? 'Пишите по-болгарски…' : 'Пишите по-русски…'}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSubmit()
          }
        }}
        className="w-full resize-none rounded-2xl border-2 bg-transparent p-3 text-xl dark:border-slate-600"
      />
      {lang === 'bg' && (
        <>
          <div className="flex flex-wrap items-center gap-2" aria-label="Болгарские буквы">
            {BG_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(value + k)
                  ref.current?.focus()
                }}
                className="h-11 w-11 rounded-xl border-2 border-b-4 text-xl font-bold active:translate-y-0.5 dark:border-slate-600"
              >
                {k}
              </button>
            ))}
            <button type="button" onClick={() => setHelp((h) => !h)} className="ml-auto text-sm font-bold text-sky">
              Помощь с буквами
            </button>
          </div>
          {help && (
            <p className="rounded-2xl bg-sky/10 p-3 text-sm">
              Нет болгарской раскладки? Нажимайте кнопки выше. На болгарской фонетической раскладке «ъ» находится на месте русской
              «ы». Буквы «ы», «э», «ё» в болгарском не используются. «щ» пишется одной буквой (не «шт»).
            </p>
          )}
        </>
      )}
    </div>
  )
}
