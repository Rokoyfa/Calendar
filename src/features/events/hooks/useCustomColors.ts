import { useCallback, useEffect, useState } from 'react'
import type { HexColor } from '../../../utils/color.ts'
import { useColorRepository } from '../../storage/index.ts'
import { MAX_CUSTOM_COLORS } from '../constants/colors.ts'

export function useCustomColors() {
  const repository = useColorRepository()
  const [colors, setColors] = useState<HexColor[]>([])

  useEffect(() => {
    let cancelled = false

    repository
      .list()
      .then((stored) => {
        if (!cancelled) setColors(stored)
      })
      .catch(() => {
        if (!cancelled) setColors([])
      })

    return () => {
      cancelled = true
    }
  }, [repository])

  const addColor = useCallback(
    async (color: HexColor) => {
      const next = await repository.add(color)
      setColors(next)
      return next
    },
    [repository],
  )

  return { colors, addColor, canAddMore: colors.length < MAX_CUSTOM_COLORS }
}
