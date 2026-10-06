import { Download, Printer } from 'lucide-react'

import { Button } from './primitives'

/** Botones "Exportar CSV" e "Imprimir". En móvil quedan solo con icono para no desbordar la cabecera. */
export function ExportActions({ onExport }: { onExport?: () => void }) {
  return (
    <div className="flex gap-2 print:hidden">
      {onExport && (
        <Button variant="secondary" onClick={onExport} aria-label="Exportar CSV">
          <Download className="size-4" />
          <span className="max-sm:sr-only">Exportar CSV</span>
        </Button>
      )}
      <Button variant="secondary" onClick={() => window.print()} aria-label="Imprimir">
        <Printer className="size-4" />
        <span className="max-sm:sr-only">Imprimir</span>
      </Button>
    </div>
  )
}
