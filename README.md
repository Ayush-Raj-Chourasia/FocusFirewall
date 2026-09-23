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

---

## System Architecture Pipeline

```
                 ┌───────────────────────────┐
                 │       Incoming Event      │
                 │   (Slack, GitHub, Email)  │
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │    Active Context State   │
                 │(Deep Work, Meeting, Idle) │
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │     Compact JSON State    │
                 │ (Event + Context + Budget)│
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │     DECISION ENGINE       │
                 │   ● JEV (Primary Model)   │
                 │   ○ LAYA (Microservice)   │
                 │   ○ MOCK (Deterministic)  │
                 └─────────────┬─────────────┘
                               │
                               ▼
                 ┌───────────────────────────┐
                 │  Confidence / Safety Gate │
                 │ (Threshold & Budget Check)│
                 └─────────────┬─────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼                       ▼
┌──────────────┐        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│INTERRUPT NOW │        │  SHOW SOON   │        │    BATCH     │        │   SILENCE    │
│(Urgent Alert)│        │(Gentle Toast)│        │(Daily Digest)│        │(Zero Popups) │
└──────────────┘        └──────────────┘        └──────────────┘        └──────────────┘
```

---

## Engine Boundaries & Deployment Architecture

FocusFirewall strictly separates model execution into three mutually exclusive, labeled modes:

```text
ENGINE MODES
────────────────────────────────────────────────────────────────
● JEV     Primary System-1 API (sub-100ms typed choice/score/noul)
○ LAYA    Local/Remote open-weights service via server/laya_service.py
○ MOCK    Local calibrated baseline with transparent engine: 'mock' badge
```

### Production Deployment Clarification (Vercel vs Backend)
- **Frontend & Edge Router**: Deployed on Vercel (`https://focusfirewall.vercel.app`). Runs Next.js 15 App Router serverless functions for `/api/decide` and `/api/events`.
- **Laya Service**: Provided as a standalone FastAPI service in `server/laya_service.py`. For local self-hosting or deployment to GPU hosts (Modal, RunPod, Hugging Face Spaces).
- **Network Safety Guarantee**: If an external engine times out, FocusFirewall **never** turns the error into a fake 30ms success metric. Errors are isolated, counted separately, and excluded from latency/agreement statistics.

---

## Reproducible Benchmark Suite

The evaluation suite (`/benchmark`) runs 400 frozen scenarios across 5 distinct human contexts (80 scenarios each):

```text
400 FROZEN EVALUATION SCENARIOS
────────────────────────────────────────────────────
Contexts (80 each) : DEEP WORK · STUDYING · MEETING · GAMING · IDLE
Actions            : NOW · SOON · BATCH · SILENCE
Ground Truth       : Pre-labeled policy expectations
Confusion Matrix   : 4 × 4 Expected vs Routed Matrix
Reproducibility    : Full manifest (Run ID, Policy, Dataset, Thresholds)
```

### Latency Measurement Specification
- **Latency Metric**: P50 / P95 End-to-End Serverless HTTP API round-trip (in milliseconds).
- **Includes**: Network transport, JSON deserialization, compact state extraction, engine execution, confidence safety gating, and response serialization.
- **Integrity Guarantee**: Failed scenarios are marked `ERROR` and strictly excluded from latency and agreement ratios.

---

## Safety Invariant Verification (`npm test`)

The policy engine enforces four non-negotiable mathematical invariants verified by automated tests:

1. **High Consequence Invariant**: Any event with `high_consequence: true` and `action_required: true` can NEVER be silenced.
2. **Meeting Distraction Invariant**: Low-urgency events in a `meeting` context must be gated to `SHOW_SOON` or `BATCH`.
3. **Probability Normalization**: All output probability distributions must sum to `1.00 ± 0.01`.
4. **Confidence Contract**: Output confidence strictly matches the maximum probability among chosen actions.

Run tests locally:
```bash
npm test
```

---

## Known Limitations & Roadmap

- **Simulated Stream vs Native Hooks**: Current version uses simulated adapters for Slack, GitHub, Discord, Email, and Calendar. Native Windows Toast notifications and Chrome Extension listeners are planned future adapters.
- **Client Storage**: Session history and feedback overrides persist in `localStorage` without a centralized SQL database.

