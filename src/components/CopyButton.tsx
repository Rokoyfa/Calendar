import { useState } from 'react'
import { useI18n } from '../i18n/index.ts'
import { Button } from './Button.tsx'

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const { m } = useI18n()
  const [copiedValue, setCopiedValue] = useState<string | null>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedValue(value)
    } catch {
      setCopiedValue(null)
    }
  }

  return (
    <Button variant="outline" onClick={() => void copy()}>
      {copiedValue === value ? m.common.copied : (label ?? m.common.copy)}
    </Button>
  )
}
