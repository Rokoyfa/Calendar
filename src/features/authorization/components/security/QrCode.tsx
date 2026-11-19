import { useEffect, useState } from 'react'

type QrCodeProps = {
  value: string
  label: string
}

export function QrCode({ value, label }: QrCodeProps) {
  const [source, setSource] = useState<{ value: string; url: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    import('qrcode')
      .then(({ toString }) => toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' }))
      .then((svg) => {
        if (!cancelled) setSource({ value, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
      })
      .catch(() => {
        if (!cancelled) setSource(null)
      })
    return () => {
      cancelled = true
    }
  }, [value])

  if (source?.value !== value) return <div className="qrCode qrCode--loading" role="img" aria-label={label} />
  return <img className="qrCode" src={source.url} alt={label} width={200} height={200} />
}
