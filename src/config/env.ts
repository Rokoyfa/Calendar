import { parseEnv } from './parseEnv.ts'

export type { AppEnv, AppStorageMode } from './parseEnv.ts'

export const env = parseEnv(import.meta.env)
