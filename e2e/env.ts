export const API_PORT = Number(process.env.E2E_API_PORT ?? 3998)
export const APP_PORT = Number(process.env.E2E_APP_PORT ?? 5198)
export const API_URL = `http://localhost:${API_PORT}/api`
export const APP_URL = `http://localhost:${APP_PORT}`
