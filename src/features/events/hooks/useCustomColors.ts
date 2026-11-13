import { useCallback } from 'react'
import { useFeatures } from '../../../context/HostContext.ts'
import { useAsyncResource } from '../../../hooks/useAsyncResource.ts'
import type { HexColor } from '../../../utils/color.ts'
import { useColorRepository } from '../../storage/index.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'

const NO_COLORS: HexColor[] = []

export function useCustomColors() {
  const repository = useColorRepository()
  const { customColors: enabled } = useFeatures()
  const load = useCallback(() => (enabled ? repository.list() : Promise.resolve(NO_COLORS)), [repository, enabled])
  const { data: colors, error, apply } = useAsyncResource(load, NO_COLORS)

  const addColor = useCallback((color: HexColor) => apply(repository.add(color)), [repository, apply])

  const removeColor = useCallback(
    async (color: HexColor) => {
      await apply(repository.remove(color))
    },
    [repository, apply],
  )

  return {
    colors,
    error,
    addColor,
    removeColor,
    canAddMore: enabled && colors.length < MAX_CUSTOM_COLORS,
  }
}
