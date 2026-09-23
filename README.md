# FocusFirewall — The Real-Time Attention Router

> FocusFirewall is an attention router for humans. It watches incoming digital events and decides whether they should interrupt you now, be shown soon, batched for later, or silently suppressed.

```
       RAW EVENT                 USER CONTEXT
(Slack, GitHub, Email...)   (Deep Work, Meeting, Idle...)
           \                     /
            ▼                   ▼
           [ COMPACT STRUCTURED STATE ]
                        │
                        ▼
                [ JEV DECISION ]
         (Choice, Score, Noul Questions)
                        │
                        ▼
            [ CONFIDENCE SAFETY GATE ]
                        │
                        ▼
             [ DETERMINISTIC ACTION ]
   INTERRUPT NOW · SHOW SOON · BATCH · SILENCE
```

---

## Why Jev?

Most existing AI builds classify **WHAT** an item is (spam vs ham, sentiment, code generation) and generate paragraphs of slow conversational prose.

FocusFirewall decides **WHEN** a human should be interrupted.

Jev provides sub-100ms typed decisions (`choice`, `score`, `noul`) over structured evidence without conversational tokens or hallucinated syntax. FocusFirewall pairs Jev's System-1 semantic judgment with deterministic code that enforces confidence thresholds and manages an attention scarcity budget.

> **Transparency Note**: The demo simulator operates over frozen fixture datasets. Real Jev mode invokes the live Jev API when `JEV_API_KEY` is configured.

---

## Key Features

1. **Context-Aware Attention Routing**: The exact same event produces contrasting decisions depending on active user state (Deep Work vs Meeting vs Studying vs Gaming vs Idle).
2. **System-1 Typed Questions**: Evaluates Action (Choice), Urgency (Score 0-4), and 3 Noul flags (Requires Action, High Consequence, Context Conflict).
3. **Deterministic Confidence Gate**: Low-confidence silences are safely downgraded to batching; low-confidence interrupts are downgraded to show-soon.
4. **Attention Budget Scarcity**: Tracks daily attention credits (Interrupt = 8, Show Soon = 3, Batch = 1, Silence = 0) and feeds scarcity directly into decision context.
5. **Frozen 400-Scenario Benchmark**: Measures routing agreement, critical recall, false interruption rate, context sensitivity, and P50/P95 latency without fabricated metrics.
6. **Technical Replay DVR & "Why Different?" Mode**: Step through historical runs or inspect side-by-side divergent decisions for the same event under differing contexts.
7. **Human Override Loop**: Operator feedback buttons (`✓ Correct`, `✕ Wrong`, `Override`) recorded locally to personalize future user policy.

---

## Local Setup & Quickstart

### Prerequisites
- Node.js 20+ or 22+
- npm, pnpm, or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env.local
```
Add your `JEV_API_KEY` if testing against live Jev endpoints. If left empty, FocusFirewall runs in explicit `MOCK` mode with identical typed schemas and calibrated distributions.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Core Routes

- `/` — Editorial poster landing page with interactive decision preview and thesis demo.
- `/live` — 3-column operator console: Context Rail, Real-time Stream, Decision Inspector, and Custom Event Playground.
- `/replay` — Technical DVR playback for inspecting raw state JSON, question outputs, and side-by-side context comparisons.
- `/benchmark` — Automated evaluation suite across 400 frozen scenarios with empirical metrics.
- `/how-it-works` — System-1 architecture documentation and JSON schema specifications.
- `/settings` — Confidence gating threshold sliders, attention budget meters, and engine toggles.

---

## State & Question Architecture

### Compact State Shape (Sent into Engine)
```json
{
  "event": {
    "source": "github",
    "sender": "ci-bot",
    "title": "CI failure on main branch",
    "body": "Build #4182 failed on test stage: integration/auth.test.ts"
  },
  "context": {
    "mode": "deep_work",
    "active_app": "VS Code",
    "activity": "Writing payment webhook handler",
    "meeting": false,
    "deadline_minutes": 18,
    "attention_budget_remaining": 65,
    "interruptions_today": 14,
    "recent_interruptions": 2
  },
  "policy": {
    "interrupt_only_when": "high consequence or immediate time sensitivity",
    "silence_only_when": "high confidence and low consequence"
  }
}
```

### Typed Questions (`attention-v1`)
1. **Action** (`choice`): `interrupt_now`, `show_soon`, `batch`, `silence`
2. **Urgency** (`score`): 0–4 time sensitivity scale
3. **Requires Action** (`noul`): Does this require meaningful human action?
4. **High Consequence** (`noul`): Would delay materially worsen outcome?
5. **Context Conflict** (`noul`): Does this meaningfully disrupt current focus?

---

## Safety & Fallback Behavior

```
               [ RAW JEV ACTION ]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
   SILENCE (< 90% conf)    INTERRUPT (< 82% conf)
          │                         │
          ▼                         ▼
   DOWNGRADE TO BATCH      DOWNGRADE TO SHOW SOON
```

If the Jev API is unreachable or rate-limited:
1. Urgent imminent deadlines (`<=10m`) with required action fallback to `INTERRUPT_NOW`.
2. High consequence system alerts fallback to `SHOW_SOON`.
3. Low-signal feeds fallback to `BATCH`.
4. Engine is labeled `rules` with an explicit safety reason banner.

---

## Known Limitations

- **Simulated Stream vs Operating System Hooks**: Current version uses simulated adapters for Slack, GitHub, Discord, Email, and Calendar. Native Windows Toast notifications and Chrome Extension listeners are planned future adapters.
- **Client Storage**: Session history and feedback overrides persist in `localStorage` without a centralized SQL database.

---

