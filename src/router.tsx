import { createBrowserRouter, Navigate } from 'react-router'
import { ROUTES } from './config/routes.ts'
import { GuestOnly, LoginPage, RegisterPage } from './features/authorization/index.ts'
import { CalendarPage } from './pages/CalendarPage.tsx'

export const router = createBrowserRouter([
  { path: ROUTES.calendar, element: <CalendarPage /> },
  {
    path: ROUTES.login,
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: ROUTES.register,
    element: (
      <GuestOnly>
        <RegisterPage />
      </GuestOnly>
    ),
  },
  { path: '*', element: <Navigate to={ROUTES.calendar} replace /> },
])
