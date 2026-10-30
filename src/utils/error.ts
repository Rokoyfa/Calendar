export const getErrorMessage = (error: unknown, fallback = 'Ein unbekannter Fehler ist aufgetreten.') =>
  error instanceof Error && error.message ? error.message : fallback
