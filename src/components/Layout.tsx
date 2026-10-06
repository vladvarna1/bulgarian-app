import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Путь', icon: '🏠' },
  { to: '/practice', label: 'Практика', icon: '🎯' },
  { to: '/profile', label: 'Профиль', icon: '👤' },
  { to: '/settings', label: 'Настройки', icon: '⚙️' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <nav
        aria-label="Основная навигация"
        className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl border-t-2 bg-white pb-[env(safe-area-inset-bottom)] dark:bg-[#131f24]"
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center py-2 text-xs font-bold ${isActive ? 'text-brand' : 'opacity-60'}`
            }
          >
            <span className="text-2xl" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
