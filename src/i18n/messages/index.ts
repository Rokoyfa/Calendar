import type { Language } from '../locale.ts'
import { de } from './de/index.ts'
import { en } from './en/index.ts'
import type { Messages } from './types.ts'

export type { Messages } from './types.ts'

export const MESSAGES: Record<Language, Messages> = { en, de }
