import { useEffect } from 'react'
import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { LessonPage } from './features/lesson/LessonPage'
import { Welcome } from './features/onboarding/Welcome'
import { GuidePage } from './features/path/GuidePage'
import { HomePage } from './features/path/HomePage'
import { PracticePage, PracticeRun } from './features/practice/PracticePage'
import { ProfilePage } from './features/profile/ProfilePage'
import { ReviewPage } from './features/review/ReviewPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { useProgress } from './stores/progress'

function Root() {
  const theme = useProgress((s) => s.settings.theme)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches))
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/practice', element: <PracticePage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      { path: '/lesson/:lessonId', element: <LessonPage /> },
      { path: '/practice/run/:mode', element: <PracticeRun /> },
      { path: '/guide/:unitId', element: <GuidePage /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/review', element: <ReviewPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
])
