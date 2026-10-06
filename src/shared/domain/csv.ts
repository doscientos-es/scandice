export type CsvCell = string | number | null | undefined

const escapeCell = (c: CsvCell) => {
  const s = c === null || c === undefined ? '' : String(c)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV con `;` como separador y coma decimal, que es lo que Excel espera en español. */
export function toCsv(rows: CsvCell[][]): string {
  return rows
    .map((r) => r.map((c) => escapeCell(typeof c === 'number' ? String(c).replace('.', ',') : c)).join(';'))
    .join('\r\n')
}

/** Descarga un CSV en el navegador (con BOM para que Excel respete los acentos). */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
  const blob = new Blob(['\uFEFF', toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const todayStamp = () => new Date().toISOString().slice(0, 10)
