import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from 'react-router'
import type { CalendarRouting } from './lib/config.ts'
import { TeamsGate } from './components/TeamsGate.tsx'
import { ROUTES } from './config/routes.ts'
import { AuthGate } from './features/authorization/index.ts'
import { PageLoading } from './components/PageLoading.tsx'
import { CalendarPage } from './pages/CalendarPage.tsx'

const lazyPage = <Name extends string>(load: () => Promise<Record<Name, ComponentType>>, name: Name) =>
  lazy(async () => ({ default: (await load())[name] }))

const SettingsPage = lazyPage(() => import('./pages/SettingsPage.tsx'), 'SettingsPage')
const CalendarSettingsPage = lazyPage(
  () => import('./features/calendars/components/settings/CalendarSettingsPage.tsx'),
  'CalendarSettingsPage',
)
const CreateCalendarPage = lazyPage(
  () => import('./features/calendars/components/create/CreateCalendarPage.tsx'),
  'CreateCalendarPage',
)
const LoginPage = lazyPage(() => import('./features/authorization/components/LoginPage.tsx'), 'LoginPage')
const RegisterPage = lazyPage(() => import('./features/authorization/components/RegisterPage.tsx'), 'RegisterPage')
const ForgotPasswordPage = lazyPage(
  () => import('./features/authorization/components/ForgotPasswordPage.tsx'),
  'ForgotPasswordPage',
)
const ResetPasswordPage = lazyPage(
  () => import('./features/authorization/components/ResetPasswordPage.tsx'),
  'ResetPasswordPage',
)
const VerifyEmailPage = lazyPage(
  () => import('./features/authorization/components/VerifyEmailPage.tsx'),
  'VerifyEmailPage',
)
const RespondPage = lazyPage(() => import('./pages/RespondPage.tsx'), 'RespondPage')
const SharedCalendarPage = lazyPage(() => import('./pages/SharedCalendarPage.tsx'), 'SharedCalendarPage')

const loaded = (page: ReactNode) => <Suspense fallback={<PageLoading />}>{page}</Suspense>

const guestOnly = (page: ReactNode) => <AuthGate access="guest">{loaded(page)}</AuthGate>

const withAuth = (page: ReactNode) => <AuthGate access="any">{loaded(page)}</AuthGate>

const usersOnly = (page: ReactNode) => <AuthGate access="user">{loaded(page)}</AuthGate>

const accountsOnly = (page: ReactNode) => <AuthGate access="account">{loaded(page)}</AuthGate>

const teamsOnly = (page: ReactNode) => <TeamsGate>{accountsOnly(page)}</TeamsGate>

const routes: RouteObject[] = [
  { path: ROUTES.calendar, element: <CalendarPage /> },
  { path: ROUTES.settings, element: usersOnly(<SettingsPage />) },
  { path: ROUTES.createCalendar, element: teamsOnly(<CreateCalendarPage />) },
  { path: ROUTES.calendarSettings, element: usersOnly(<CalendarSettingsPage />) },
  { path: ROUTES.login, element: guestOnly(<LoginPage />) },
  { path: ROUTES.register, element: guestOnly(<RegisterPage />) },
  { path: ROUTES.forgotPassword, element: guestOnly(<ForgotPasswordPage />) },
  { path: ROUTES.resetPassword, element: withAuth(<ResetPasswordPage />) },
  { path: ROUTES.verifyEmail, element: withAuth(<VerifyEmailPage />) },
  { path: ROUTES.respond, element: withAuth(<RespondPage />) },
  { path: ROUTES.shared, element: loaded(<SharedCalendarPage />) },
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
