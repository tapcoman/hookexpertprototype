import * as React from 'react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Trash2, RotateCcw, Download } from 'lucide-react'
import { getRuns, deleteRun, clearRuns, type RunRecord } from './utils/store'
import { downloadCsv } from './utils/csv'

export function HistoryList({ onRestore }: { onRestore: (run: RunRecord) => void }) {
  const [runs, setRuns] = useState<RunRecord[]>([])

  useEffect(() => {
    setRuns(getRuns())
  }, [])

  function handleDelete(id: string) {
    deleteRun(id)
    setRuns(getRuns())
  }

  function handleClear() {
    clearRuns()
    setRuns(getRuns())
  }

  if (!runs.length) {
    return <div className="rounded-xl border p-6 text-sm text-muted-foreground">No history yet. Generate to populate your history.</div>
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <Trash2 className="mr-2 h-4 w-4" />
          Clear all
        </Button>
      </div>
      {runs.map((run) => (
        <Card key={run.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">"{run.idea.slice(0, 64)}{run.idea.length > 64 ? '…' : ''}"</CardTitle>
              <div className="text-xs text-muted-foreground">{new Date(run.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{run.platform}</Badge>
              <Badge variant="outline">{run.outcome}</Badge>
              <Badge variant="outline">{run.count} hooks</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button size="sm" onClick={() => onRestore(run)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadCsv(run.hooks, `hooks-${run.platform}-${run.id}.csv`)}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleDelete(run.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
