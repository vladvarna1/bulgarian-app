import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LoginPage } from './features/auth/LoginPage'
import { HomePage } from './features/path/HomePage'
import { Placeholder } from './components/Placeholder'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/practice', element: <Placeholder title="Практика" /> },
      { path: '/profile', element: <Placeholder title="Профиль" /> },
      { path: '/settings', element: <Placeholder title="Настройки" /> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
])
