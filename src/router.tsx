import type { ReactNode } from 'react'
import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router'
import type { CalendarRouting } from './lib/config.ts'
import { TeamsGate } from './components/TeamsGate.tsx'
import { ROUTES } from './config/routes.ts'
import {
  AuthGate,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './features/authorization/index.ts'
import { CalendarSettingsPage, CreateCalendarPage } from './features/calendars/index.ts'
import { CalendarPage } from './pages/CalendarPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'

const guestOnly = (page: ReactNode) => <AuthGate access="guest">{page}</AuthGate>

const withAuth = (page: ReactNode) => <AuthGate access="any">{page}</AuthGate>

const usersOnly = (page: ReactNode) => <AuthGate access="user">{page}</AuthGate>

const accountsOnly = (page: ReactNode) => <AuthGate access="account">{page}</AuthGate>

const teamsOnly = (page: ReactNode) => <TeamsGate>{accountsOnly(page)}</TeamsGate>

const routes: RouteObject[] = [
  { path: ROUTES.calendar, element: <CalendarPage /> },
  { path: ROUTES.settings, element: usersOnly(<SettingsPage />) },
  { path: ROUTES.createCalendar, element: teamsOnly(<CreateCalendarPage />) },
  { path: ROUTES.calendarSettings, element: accountsOnly(<CalendarSettingsPage />) },
  { path: ROUTES.login, element: guestOnly(<LoginPage />) },
  { path: ROUTES.register, element: guestOnly(<RegisterPage />) },
  { path: ROUTES.forgotPassword, element: guestOnly(<ForgotPasswordPage />) },
  { path: ROUTES.resetPassword, element: withAuth(<ResetPasswordPage />) },
  { path: ROUTES.verifyEmail, element: withAuth(<VerifyEmailPage />) },
  { path: '*', element: <Navigate to={ROUTES.calendar} replace /> },
]

type RouterOptions = {
  basename?: string
  initialPath?: string
}

export function createCalendarRouter(routing: CalendarRouting, { basename, initialPath }: RouterOptions = {}) {
  if (routing === 'browser') return createBrowserRouter(routes, { basename })
  return createMemoryRouter(routes, { initialEntries: [initialPath ?? ROUTES.calendar] })
}
