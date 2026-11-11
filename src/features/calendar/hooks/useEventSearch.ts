import { useEffect, useState } from 'react'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue.ts'
import { getErrorMessage, useI18n } from '../../../i18n/index.ts'
import { useStorage } from '../../storage/index.ts'
import {
  getFallbackSearchRange,
  matchesSearch,
  SEARCH_MIN_LENGTH,
  toSearchResults,
  type SearchResult,
} from '../utils/search.ts'

const DEBOUNCE_MS = 250

type SearchState = { query: string; results: SearchResult[]; error: string | null }

export function useEventSearch(text: string, calendarIds: readonly string[], today: string) {
  const { m } = useI18n()
  const { events: repository } = useStorage()
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS)
  const [state, setState] = useState<SearchState | null>(null)
  const isTooShort = query.length < SEARCH_MIN_LENGTH

  useEffect(() => {
    if (isTooShort) return
    let isCurrent = true
    const search = repository.search
      ? repository.search({ text: query, calendarIds })
      : repository
          .list({ ...getFallbackSearchRange(today), calendarIds })
          .then((events) => events.filter((event) => matchesSearch(event, query)))
    search
      .then((events) => {
        if (isCurrent) setState({ query, results: toSearchResults(events, today), error: null })
      })
      .catch((error: unknown) => {
        if (isCurrent) setState({ query, results: [], error: getErrorMessage(error, m) })
      })
    return () => {
      isCurrent = false
    }
  }, [repository, query, isTooShort, calendarIds, today, m])

  const current = !isTooShort && state?.query === query ? state : null
  return {
    results: current?.results ?? [],
    error: current?.error ?? null,
    isSearching: !isTooShort && current === null,
    isTooShort,
  }
}
