import type { en } from './en/index.ts'

export type Messages = typeof en

export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T

export type PartialMessages = DeepPartial<Messages>

export type MessageOverrides = Readonly<Record<string, PartialMessages>>
