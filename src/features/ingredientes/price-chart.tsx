import type { PricePoint } from '@/shared/domain/prices'
import { formatDate, formatMoney } from '@/shared/domain/units'

const W = 600
const H = 200
const PAD = { top: 16, right: 16, bottom: 28, left: 56 }

/**
 * Gráfica de líneas del precio en cada compra (SVG sin dependencias).
 * `scale` convierte el precio por unidad mínima a por kg / L.
 */
export function PriceChart({ points, scale, unitLabel }: { points: PricePoint[]; scale: number; unitLabel: string }) {
  const values = points.map((p) => p.price * scale)
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || Math.max(hi * 0.1, 0.01)
  const yMin = lo - span * 0.15
  const yMax = hi + span * 0.15
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * innerH
  const path = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const ticks = [yMin + (yMax - yMin) * 0.1, (yMin + yMax) / 2, yMax - (yMax - yMin) * 0.1]
  const summary = points
    .map((p) => `${formatDate(p.date)}: ${formatMoney(p.price * scale)} por ${unitLabel}`)
    .join('. ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Evolución del precio por ${unitLabel}. ${summary}`} className="h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray="3 4" />
          <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
            {formatMoney(t)}
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={path} fill="none" className="stroke-brand" strokeWidth={2} strokeLinejoin="round" />}
      {points.map((p, i) => (
        <g key={`${p.noteId}-${i}`}>
          <circle cx={x(i)} cy={y(values[i]!)} r={4} className="fill-surface stroke-brand" strokeWidth={2}>
            <title>{`${formatDate(p.date)} · ${p.supplier}: ${formatMoney(values[i]!)} / ${unitLabel}`}</title>
          </circle>
          {(i === 0 || i === points.length - 1 || points.length <= 6) && (
            <text x={x(i)} y={H - 8} textAnchor={i === 0 && points.length > 1 ? 'start' : i === points.length - 1 && points.length > 1 ? 'end' : 'middle'} className="fill-muted text-[11px]">
              {formatDate(p.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
