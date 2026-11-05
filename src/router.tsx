import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { ROUTES } from './config/routes.ts'
import {
  AuthGate,
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from './features/authorization/index.ts'
import { CreateCalendarPage } from './features/calendars/index.ts'
import { CalendarPage } from './pages/CalendarPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'

const guestOnly = (page: ReactNode) => <AuthGate access="guest">{page}</AuthGate>

const withAuth = (page: ReactNode) => <AuthGate access="any">{page}</AuthGate>

const usersOnly = (page: ReactNode) => <AuthGate access="user">{page}</AuthGate>

const accountsOnly = (page: ReactNode) => <AuthGate access="account">{page}</AuthGate>

export const router = createBrowserRouter([
  { path: ROUTES.calendar, element: <CalendarPage /> },
  { path: ROUTES.settings, element: usersOnly(<SettingsPage />) },
  { path: ROUTES.createCalendar, element: accountsOnly(<CreateCalendarPage />) },
  { path: ROUTES.login, element: guestOnly(<LoginPage />) },
  { path: ROUTES.register, element: guestOnly(<RegisterPage />) },
  { path: ROUTES.forgotPassword, element: guestOnly(<ForgotPasswordPage />) },
  { path: ROUTES.resetPassword, element: withAuth(<ResetPasswordPage />) },
  { path: ROUTES.verifyEmail, element: withAuth(<VerifyEmailPage />) },
  { path: '*', element: <Navigate to={ROUTES.calendar} replace /> },
])
