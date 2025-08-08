import type { HookItem } from '../types'

export function downloadCsv(items: HookItem[], filename = 'hooks.csv') {
  if (!items?.length) return
  const headers = [
    'rank',
    'score',
    'framework',
    'spokenHook',
    'visualCue',
    'overlayText',
    'idealWordCount',
    'proofCue',
    'reasons',
  ]
  const rows = items.map((h, i) => [
    String(i + 1),
    h.score.toFixed(2),
    escapeCsv(h.framework),
    escapeCsv(h.spokenHook),
    escapeCsv(h.visualCue),
    escapeCsv(h.overlayText),
    h.platformNotes?.idealWordCount ?? '',
    escapeCsv(h.platformNotes?.proofCue ?? ''),
    escapeCsv(h.reasons.join(' | ')),
  ])
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function escapeCsv(s: string) {
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}
