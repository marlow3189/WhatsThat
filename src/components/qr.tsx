import qrcode from 'qrcode-generator'

/** Kod QR jako SVG (bez wstawiania surowego HTML): ciemne moduły jako jedna ścieżka. */
export function QrCode({ value, size = 220, label }: { value: string; size?: number; label: string }) {
  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()
  const n = qr.getModuleCount()
  const quiet = 2
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + quiet} ${r + quiet}h1v1h-1z`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n + quiet * 2} ${n + quiet * 2}`} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width="100%" height="100%" fill="#ffffff" />
      <path d={d} fill="#121316" />
    </svg>
  )
}
