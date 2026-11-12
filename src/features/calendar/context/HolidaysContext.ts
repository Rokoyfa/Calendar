import { createContext, use } from 'react'

export type HolidayMap = ReadonlyMap<string, readonly string[]>

const NO_NAMES: readonly string[] = []

export const HolidaysContext = createContext<HolidayMap>(new Map())

export const useHolidayMap = () => use(HolidaysContext)

export const useHolidayNames = (date: string) => use(HolidaysContext).get(date) ?? NO_NAMES
