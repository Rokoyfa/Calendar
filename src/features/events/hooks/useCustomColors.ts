import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { HexColor } from '../../../utils/color.ts'
import { useColorRepository } from '../../storage/index.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'

const NO_COLORS: HexColor[] = []

export function useCustomColors() {
  const repository = useColorRepository()
  const load = useCallback(() => repository.list(), [repository])
  const { data: colors, setData } = useAsyncResource(load, NO_COLORS)

  const addColor = useCallback(
    async (color: HexColor) => {
      const next = await repository.add(color)
      setData(next)
      return next
    },
    [repository, setData],
  )

  return { colors, addColor, canAddMore: colors.length < MAX_CUSTOM_COLORS }
}
