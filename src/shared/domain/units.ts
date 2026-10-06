import type { Unit } from './types'

export const UNITS: Unit[] = ['ud', 'g', 'ml']

/** `bigLabel` y `scale` sirven para escribir/mostrar kg y L en lugar de g y ml. */
export const unitMeta: Record<Unit, { label: string; bigLabel: string; scale: number }> = {
  ud: { label: 'ud', bigLabel: 'ud', scale: 1 },
  g: { label: 'g', bigLabel: 'kg', scale: 1000 },
  ml: { label: 'ml', bigLabel: 'L', scale: 1000 },
}

const numberFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 })
const moneyFormat = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

export const formatNumber = (n: number) => numberFormat.format(n)
export const formatMoney = (n: number) => moneyFormat.format(n)

export function formatQty(qty: number, unit: Unit): string {
  const { label, bigLabel, scale } = unitMeta[unit]
  if (scale > 1 && Math.abs(qty) >= scale) return `${formatNumber(qty / scale)} ${bigLabel}`
  return `${formatNumber(qty)} ${label}`
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(iso),
  )

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))

/** Evita restos de coma flotante (0.1 + 0.2). */
export const round = (n: number, decimals = 3) => {
  const f = 10 ** decimals
  return Math.round((n + Number.EPSILON) * f) / f
}
