import { useSearchParams } from 'react-router'

const TAB_PARAM = 'tab'

export function useTabParam<T extends string>(tabs: readonly { value: T }[]) {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get(TAB_PARAM)
  const active = tabs.find((tab) => tab.value === requested)?.value ?? tabs[0].value
  const select = (tab: T) => setSearchParams({ [TAB_PARAM]: tab }, { replace: true })
  return [active, select] as const
}
