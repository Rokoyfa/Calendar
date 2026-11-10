declare global {
  const __CALENDAR_VERSION__: string

  interface ImportMetaEnv {
    readonly VITE_STORAGE_MODE?: string
    readonly VITE_API_BASE_URL?: string
    readonly VITE_API_TIMEOUT_MS?: string
    readonly VITE_FEATURE_AUTH?: string
    readonly VITE_FEATURE_TEAMS?: string
  }
}

export {}
