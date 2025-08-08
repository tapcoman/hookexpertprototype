# Hook Line Expert

- Left input sidebar and right results panel built with shadcn/ui Sidebar primitives. [^1]
- Dual-model pipeline wired via Vercel AI SDK (`generateText`) and OpenAI integrations for gpt-4o and gpt-4o-mini. [^2]
- Transparent 0–5 composite score: Gaussian length curve (+1), curiosity (+2), platform fit (+1), framework bonus (+1).
- Onboarding dialog stores brand voice, audience, and banned terms in localStorage.
- Sticky “Try 10 more” CTA and CSV export out of the box.

Set OPENAI_API_KEY in your environment to enable real generations.
