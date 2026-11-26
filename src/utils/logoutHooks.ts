type LogoutHook = () => Promise<void>

const hooks = new Set<LogoutHook>()

export const addLogoutHook = (hook: LogoutHook) => {
  hooks.add(hook)
  return () => {
    hooks.delete(hook)
  }
}

export const runLogoutHooks = async () => {
  await Promise.all([...hooks].map((hook) => hook().catch(() => undefined)))
}
