import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const { user, enabled, signInWithEmail, signInWithGoogle, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const err = await signInWithEmail(email.trim())
    if (err) setError(err)
    else setStatus('sent')
  }

  if (user) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-6">
        <h1 className="text-2xl font-bold">Вы вошли</h1>
        <p>{user.email}</p>
        <button onClick={() => void signOut()} className="w-full rounded-2xl border-2 p-3 font-bold">
          Выйти
        </button>
        <Link to="/" className="block text-center font-bold text-sky">
          На главную
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Сохранить прогресс</h1>
      {!enabled && (
        <p className="rounded-2xl bg-yellow-100 p-3 text-yellow-900">
          Вход ещё не настроен (нет ключей Supabase). Приложение работает как гость.
        </p>
      )}
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border-2 bg-transparent p-3"
            placeholder="you@example.com"
          />
        </label>
        <button
          disabled={!enabled || status === 'sent'}
          className="w-full rounded-2xl bg-brand p-3 font-bold text-white shadow-[0_4px_0_var(--color-brand-dark)] disabled:opacity-50"
        >
          Получить ссылку для входа
        </button>
      </form>
      {status === 'sent' && <p className="text-brand-dark">Ссылка отправлена. Проверьте почту.</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      <button
        disabled={!enabled}
        onClick={() => void signInWithGoogle().then((e) => e && setError(e))}
        className="w-full rounded-2xl border-2 p-3 font-bold disabled:opacity-50"
      >
        Войти через Google
      </button>
      <Link to="/" className="block text-center font-bold text-sky">
        Продолжить как гость
      </Link>
    </div>
  )
}
