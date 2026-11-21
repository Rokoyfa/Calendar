import { useCallback, useState } from 'react'

export type Undo = () => Promise<void>

type UndoOffer = { id: number; message: string; undo: Undo }

export function useUndo(enabled: boolean, attempt: (action: Undo) => Promise<unknown>) {
  const [offer, setOffer] = useState<UndoOffer | null>(null)

  const offerUndo = useCallback(
    (message: string, undo: Undo | null) => setOffer(undo && enabled ? { id: Date.now(), message, undo } : null),
    [enabled],
  )
  const dismiss = useCallback(() => setOffer(null), [])
  const run = useCallback(async () => {
    if (!offer) return
    setOffer(null)
    await attempt(offer.undo)
  }, [offer, attempt])

  return { offer, offerUndo, dismiss, run }
}
