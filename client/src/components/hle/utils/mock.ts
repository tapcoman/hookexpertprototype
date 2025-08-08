import type { HookItem, Outcome, Platform } from '../types'

// Simple local mock generator to preview what results look like.
// Mirrors the server mock, but runs client-side.
export function makeMockHooks(
  idea: string,
  platform: Platform,
  outcome: Outcome,
  count: number
): HookItem[] {
  const frameworks = ['Open Loop', 'PAS', 'AIDA', "4U's", 'Question Lead', 'Data Tease']
  const proofCues = ['screenshot results', 'timer overlay', 'scale reading', 'before/after cut', 'comment proof']

  const baseSpoken = [
    `Day 3 with zero sugar—guess what changed?`,
    `Before you scroll: this ended my 3PM crash.`,
    `What happens when you cut sugar for 72 hours?`,
    `I tested sugar-free for 3 days—here’s the plot twist.`,
    `The one tweak that fixed my cravings (fast).`,
    `I tried no sugar for 3 days. Here’s the honest chart.`,
  ]

  const visuals = [
    'Cold-open: slam fridge door, show calendar “Day 3”',
    'Cold-open: rapid cut to energy graph going up',
    'Cold-open: step on scale, close-up, then face',
    'Cold-open: spoon drops into black coffee; timer overlay',
    'Cold-open: phone lock screen showing earlier bedtime',
    'Cold-open: split-screen before/after skin under same light',
  ]

  const overlays = [
    '72 hours. Big shift.',
    'No sugar. Real results.',
    '3 days in: it works?',
    'Day 3: unexpected win',
    'Cravings gone fast',
    'No sugar: honest chart',
  ]

  return Array.from({ length: count }).map((_, i) => {
    const fw = frameworks[i % frameworks.length]
    // Slightly tailor the first words with the idea for realism
    const ideaLead = idea ? idea.split(' ').slice(0, 4).join(' ') : 'Quick test'
    const spoken = `${i % 2 === 0 ? ideaLead + ' — ' : ''}${baseSpoken[i % baseSpoken.length]}`
    const item: HookItem = {
      id: `preview-${Date.now()}-${i}`,
      spokenHook: spoken,
      visualCue: visuals[i % visuals.length],
      overlayText: overlays[i % overlays.length],
      framework: fw,
      platformNotes: { idealWordCount: 8, proofCue: proofCues[i % proofCues.length] },
      score: 0,
      reasons: [],
    }
    return item
  })
}
