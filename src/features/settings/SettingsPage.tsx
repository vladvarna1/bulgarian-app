import { Link } from 'react-router-dom'
import { useProgress } from '../../stores/progress'
import { Btn, Card } from '../../components/ui'
import { useAuth } from '../auth/AuthProvider'

export const APP_VERSION = '0.2.0'

export function SettingsPage() {
  const { settings, setSettings, goalMin, setGoal, resetAll } = useProgress()
  const { user, enabled, signOut } = useAuth()

  function exportData() {
    const { xp, activity, lessons, words, goalMin, settings, perfectLessons } = useProgress.getState()
    const blob = new Blob([JSON.stringify({ xp, activity, lessons, words, goalMin, settings, perfectLessons }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'bolgarski-progress.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-3xl font-extrabold">Настройки</h1>

      <Card className="space-y-4">
        <Toggle label="Звуки" desc="Сигналы при ответах" value={settings.sound} onChange={(v) => setSettings({ sound: v })} />
        <Toggle label="Знаки ударения" desc="Показывать ударение над гласными (́)" value={settings.stress} onChange={(v) => setSettings({ stress: v })} />
      </Card>

      <Card>
        <p className="mb-2 font-extrabold">Дневная цель</p>
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((m) => (
            <button
              key={m}
              aria-pressed={goalMin === m}
              onClick={() => setGoal(m)}
              className={`rounded-2xl border-2 border-b-4 py-3 font-extrabold ${goalMin === m ? 'border-sky bg-sky/10 text-sky' : 'dark:border-slate-600'}`}
            >
              {m} мин
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-2 font-extrabold">Тема</p>
        <div className="grid grid-cols-3 gap-2">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              aria-pressed={settings.theme === t}
              onClick={() => setSettings({ theme: t })}
              className={`rounded-2xl border-2 border-b-4 py-3 font-extrabold ${settings.theme === t ? 'border-sky bg-sky/10 text-sky' : 'dark:border-slate-600'}`}
            >
              {t === 'system' ? 'Авто' : t === 'light' ? 'Светлая' : 'Тёмная'}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="font-extrabold">Аккаунт</p>
        {user ? (
          <>
            <p className="text-sm opacity-80">{user.email}</p>
            <Btn variant="secondary" onClick={() => void signOut()}>
              Выйти
            </Btn>
          </>
        ) : enabled ? (
          <Link to="/login" className="block rounded-2xl bg-sky p-3 text-center font-extrabold text-white">
            Войти / создать аккаунт
          </Link>
        ) : (
          <p className="text-sm opacity-70">Прогресс хранится на этом устройстве. Облачная синхронизация скоро появится.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <p className="font-extrabold">Данные</p>
        <Btn variant="secondary" onClick={exportData}>
          Экспорт прогресса
        </Btn>
        <Btn
          variant="danger"
          onClick={() => {
            if (window.confirm('Сбросить весь прогресс? Это нельзя отменить.')) resetAll()
          }}
        >
          Сбросить прогресс
        </Btn>
      </Card>

      <p className="pb-4 text-center text-sm opacity-50">Болгарский с нуля · версия {APP_VERSION}</p>
    </div>
  )
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div className="flex-1">
        <p className="font-extrabold">{label}</p>
        <p className="text-sm opacity-70">{desc}</p>
      </div>
      <input type="checkbox" role="switch" checked={value} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="relative h-8 w-14 rounded-full bg-slate-300 transition peer-checked:bg-brand peer-focus-visible:outline peer-focus-visible:outline-4 peer-focus-visible:outline-sky after:absolute after:left-1 after:top-1 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-6" />
    </label>
  )
}
