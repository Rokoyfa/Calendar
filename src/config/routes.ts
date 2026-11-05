export const ROUTES = {
  calendar: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  settings: '/settings',
  createCalendar: '/calendars/new',
} as const

export const TOKEN_PARAM = 'token'

const REDIRECT_PARAM = 'redirect'

export const isSafeRedirect = (path: string | null): path is string =>
  path !== null && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')

export const getRedirectTarget = (searchParams: URLSearchParams) => {
  const target = searchParams.get(REDIRECT_PARAM)
  return isSafeRedirect(target) ? target : ROUTES.calendar
}

export const withRedirect = (route: string, redirectTo: string | null) =>
  isSafeRedirect(redirectTo) && redirectTo !== ROUTES.calendar
    ? `${route}?${new URLSearchParams({ [REDIRECT_PARAM]: redirectTo })}`
    : route
