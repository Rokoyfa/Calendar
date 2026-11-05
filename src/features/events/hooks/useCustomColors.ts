import { useCallback } from 'react'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { HexColor } from '../../../utils/color.ts'
import { useColorRepository } from '../../storage/index.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'

const NO_COLORS: HexColor[] = []

export function useCustomColors() {
  const repository = useColorRepository()
  const load = useCallback(() => repository.list(), [repository])
  const { data: colors, error, apply } = useAsyncResource(load, NO_COLORS)

  const addColor = useCallback((color: HexColor) => apply(repository.add(color)), [repository, apply])

  const removeColor = useCallback(
    async (color: HexColor) => {
      await apply(repository.remove(color))
    },
    [repository, apply],
  )

  return { colors, error, addColor, removeColor, canAddMore: colors.length < MAX_CUSTOM_COLORS }
}
