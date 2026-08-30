"use client"
import { exportToCsv } from '@/app/(dashboard)/dashboard/_utils/export-csv'
import { Button } from '@/components/ui'
export function ExportCsvButton({ rows }: { rows: Record<string, unknown>[] }) {
  return (
    <div className="mb-4">
      <Button
        onClick={() => exportToCsv('partner-attributions.csv', rows)}
        disabled={!rows.length}
      >
        Export Attributions CSV
      </Button>
    </div>
  )
}
