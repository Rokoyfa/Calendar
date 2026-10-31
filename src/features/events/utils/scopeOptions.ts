import type { EditScope } from '../../../utils/event.ts'

type ScopeContext = {
  isSeries: boolean
  keepsRule: boolean
  canSplit: boolean
}

export const getScopeOptions = ({ isSeries, keepsRule, canSplit }: ScopeContext): EditScope[] => {
  if (!isSeries) return ['all']
  const options: EditScope[] = []
  if (keepsRule) options.push('single')
  if (canSplit) options.push('following')
  options.push('all')
  return options
}
