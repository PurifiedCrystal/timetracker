# CLAUDE.md — Time Tracker Project Rules

Purpose: give Claude Code an **external memory** for important project facts.
Defines **triggers**, **templates**, and **commands** for the `progress-recorder` subagent.

## Project: Time Tracking Application
- **Goal**: Build a simple, elegant clock in/out time tracker with subscription service
- **Stack**: React, Next.js, Supabase, Stripe
- **Pricing**: $1.99/month subscription
- **Features**: Clock in/out, California labor rules, export functionality, landing page

## Always log
Use the **progress-recorder** subagent to capture **decisions, constraints, tasks, completions, risks, notes** into `progress.md`.
Treat `progress.md` as the **single source of truth**.

## Auto-wake triggers (semantic)
- Decisions: “decide / decided to / adopt / switch to / finalize …”
- Constraints: “must / required / cannot / must support …”
- Completions: “finished / shipped / fixed / implemented …”
- New tasks: “need to / should / plan to …”
- Risks & assumptions: “risk is … / we assume …”

## Trigger Matrices
**High-confidence → Pinned/Decisions**: must, required, cannot, will, decided, adopt, switch to, finalized, shipped, finished, implemented
**Hedged → Notes (Needs-Confirmation)**: maybe, might, consider, suggest, TBD, roughly, similar, tentative, explore, brainstorm, later, probably, seems

## Protected sections
**Pinned** and **Decisions** are **append-only**. Conflicts → add a **Notes** reminder; do not overwrite.

## Capacity & Archiving
- Archive when **Notes + Done > 100** **or** when `progress.md` exceeds **~2,000 lines**.
- Archive is **append-only** to `progress.archive.md`.

## Slash commands
/record — incremental merge now
/archive — archive older **Notes/Done**
/recap — summarize current state from `progress.md`

## Recap Template
```
# Recap
**Pinned:** …
**Decisions (latest 5):** …
**TODO snapshot (ID • Title • Status • P):** …
**Latest Done (≤5):** …
**Risks & Assumptions:** …
**Notes (Highlights ≤5):** …
**Last updated:** YYYY-MM-DD HH:00
```

## Cold-start tip
After `/clear`, run `/recap` to reload context from files.

## Evidence Link Convention
`[type: commit|PR|issue|file] (<short note>) → <link or path>`
Example: `[commit] add auth flow → abcd123 on main`

## Conflict Note Convention
`Notes • Conflict: New "<X>" conflicts with <Pinned|Decision> dated <YYYY-MM-DD>. Needs review.`

## Tools / mcp avaialbe
n8n
playwright
Supabase

###

_Last updated: 2025-09-24 08:00_
