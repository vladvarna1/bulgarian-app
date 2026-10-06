import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function HomePage() {
  const { user, enabled } = useAuth()
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-3xl font-extrabold text-brand">Болгарский с нуля</h1>
      <p>Учим болгарский, опираясь на русский. Первый урок скоро появится здесь.</p>
      {enabled && !user && (
        <Link to="/login" className="block rounded-2xl bg-sky p-3 text-center font-bold text-white">
          Войти / сохранить прогресс
        </Link>
      )}
    </div>
  )
}
