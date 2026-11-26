type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = { enabled: boolean; prompt: InstallPromptEvent | null; installed: boolean }

let state: InstallState = { enabled: false, prompt: null, installed: false }
const listeners = new Set<() => void>()

const update = (next: InstallState) => {
  state = next
  for (const listener of listeners) listener()
}

export const enableInstallPrompt = () => {
  if (state.enabled || typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    update({ ...state, prompt: event as InstallPromptEvent })
  })
  window.addEventListener('appinstalled', () => update({ ...state, prompt: null, installed: true }))
  update({ ...state, enabled: true })
}

export const subscribeInstallState = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export const getInstallState = () => state

export const promptInstall = async () => {
  const { prompt } = state
  if (!prompt) return false
  await prompt.prompt()
  const { outcome } = await prompt.userChoice
  update({ ...state, prompt: null, installed: outcome === 'accepted' })
  return outcome === 'accepted'
}
