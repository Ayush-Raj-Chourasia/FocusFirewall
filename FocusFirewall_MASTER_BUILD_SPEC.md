# FocusFirewall — MASTER BUILD SPEC

## 0. Mission

Build a polished, public, working web application called **FocusFirewall**.

One-sentence product definition:
> FocusFirewall is a real-time attention router that decides which digital events deserve a person's attention now, which should be shown later, which should be batched, and which should be silently suppressed.

The central technical idea is **System-One decisioning**:
- collect raw event evidence + current user context
- ask a small set of typed decision questions
- let Jev make the semantic judgment
- use deterministic code to enforce confidence thresholds and perform the action

The product must feel like a real tool, not an AI demo.

---

# 1. PRIMARY OUTCOME

The final result must be a deployable application that can be opened by anyone without an account and immediately demonstrate:

1. A stream of incoming notifications/events.
2. A visible current context such as Deep Work, Meeting, Studying, Gaming, or Idle.
3. Each event is routed to exactly one action:
   - INTERRUPT NOW
   - SHOW SOON
   - BATCH
   - SILENCE
4. Jev is the actual semantic decision engine when real mode is enabled.
5. The UI exposes the decision, probability distribution, confidence, latency, engine, and resulting action.
6. A benchmark/replay mode demonstrates repeatable decisions over a frozen test set.
7. The same event can produce a different action after the user context changes.
8. Mock mode exists for development/demo reliability, but it must be visually and technically explicit and must never pretend to be Jev.
9. No fake metrics. Every benchmark number shown must come from an actual local run.
10. The application must work without a database.

---

# 2. WHY THIS PROJECT

Existing Jev/Laya builds are heavily concentrated around browser agents, game control, email/support triage, routing, model/runtime ports, content scoring, research classification, and developer tools. The catalog repeatedly shows the same pattern: software presents a constrained state and a decision model chooses one of a fixed set of actions.

FocusFirewall should apply the same architecture to a different human-facing problem:

> deciding whether a new event should consume a person's scarce attention right now.

This is NOT another inbox classifier.

The product deliberately operates across multiple event types and, most importantly, incorporates **current human context**. The same message may be interrupt-worthy while idle and deferrable during deep work.

---

# 3. POSITIONING

Product name:
**FocusFirewall**

Subtitle:
**The attention router for your digital life.**

Primary headline:
**YOUR COMPUTER KNOWS WHAT ARRIVED.**
**FOCUSFIREWALL DECIDES WHETHER YOU NEED IT NOW.**

Supporting copy:
> A fast decision layer between incoming events and human attention. Jev decides. Code enforces. You stay focused.

Short directory/submission description:
> A real-time attention router that uses Jev to decide whether digital events should interrupt, wait, batch, or disappear — with context-aware decisions and a replayable benchmark.

Do not describe it as a chatbot.
Do not call Jev an autonomous agent.
Do not make generic AGI claims.

---

# 4. RESEARCHED VISUAL LANGUAGE TO FOLLOW

Use the **visual grammar** of the Made with Jev / Made with Laya ecosystem without copying their exact site, logo, artwork, or proprietary assets.

The observed visual language is:

- editorial / independent-tech publication feel
- warm paper rather than sterile SaaS white
- black ink as the dominant text and border color
- hot pink used as a major poster/background accent
- orange used as a decision/status accent
- heavy condensed display typography
- monospaced labels and data readouts
- thin black rules and rectangular outlined panels
- retro computer / terminal / zine / technical-poster motifs
- halftone-dot illustrations
- subtle paper grain/noise
- small window-like cards with black title bars and tiny close boxes
- dense but deliberate information layout
- almost no rounded-pill-everything SaaS styling
- no giant gradient blobs
- no glassmorphism
- no purple AI aesthetic
- no excessive iconography

The official Jev explainer artwork confirms the warm paper, black, hot-pink and orange palette, condensed display type, monospace/terminal panels, thin technical outlines, halftone treatment and computer-window motifs.

Laya's catalog uses a similarly editorial, compact, information-dense presentation: search, category navigation, numbered/typed metadata, source labels, and metric-first build cards.

IMPORTANT:
Do not clone the Made with Jev website. Build an original FocusFirewall interface that feels like it belongs in the same design ecosystem.

---

# 5. DESIGN SYSTEM

## 5.1 Color tokens

These are implementation approximations inspired by the researched visual language, not claims about official brand tokens.

```css
--paper: #F3EEDF;
--paper-2: #E7E0D1;
--ink: #11110F;
--ink-muted: #5E5B53;
--line: #1B1A17;
--pink: #F04F96;
--orange: #F26422;
--white: #FFFDF7;
--danger: #D6352F;
--green: #4D7A48;
```

Use black/ink for most content.
Use pink for major branded surfaces, highlights, active tabs, large background blocks.
Use orange for live model decisions, cursors, active state, and decision highlights.
Use red only for genuinely dangerous/blocked states.
Use green sparingly for trusted/approved states.

Do not introduce a large secondary color palette.

## 5.2 Typography

Preferred stack:

Display:
- `Archivo Narrow`, fallback `Arial Narrow`, `Impact`, sans-serif
- uppercase, heavy weight, tight line-height

Body:
- `Inter`, fallback system sans-serif

Data / terminal / labels:
- `IBM Plex Mono`, fallback `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace

If remote fonts are unavailable, the app must remain visually acceptable with local fallbacks.

## 5.3 Geometry

- mostly square corners
- border radius: 0–4px max
- 1px black borders
- occasional 2–4px hard offset shadow
- no soft drop shadows on normal cards
- large horizontal rules
- strong alignment to a visible grid
- desktop container roughly 1180–1280px
- comfortable 24–40px page gutters

## 5.4 Texture

Create the paper feel using CSS/SVG only:
- subtle noise texture with inline SVG filter or tiny generated data URI
- optional halftone dot pattern using SVG circles
- keep opacity low enough that text remains perfectly legible

Do not download stock paper textures.
Do not use copyrighted illustrations.

## 5.5 Motion

Motion should communicate live decision activity, not decorate the page.

Use:
- 120–220ms transitions
- queue rows sliding/fading into the decision rail
- orange activity cursor while a decision is processing
- tiny number counters for live statistics
- a short horizontal scan when an event enters the router

Avoid:
- floating blobs
- bouncing cards
- excessive spring animations
- full-screen parallax
- perpetual spinning elements

Respect `prefers-reduced-motion`.

---

# 6. GLOBAL UI SHELL

## Header

Desktop:

Left:
```text
FOCUSFIREWALL
// ATTENTION ROUTER
```

Middle navigation:
```text
LIVE     REPLAY     BENCHMARK     HOW IT WORKS
```

Right:
```text
ENGINE: JEV   ◉ LIVE
```

Mobile:
- wordmark left
- menu button right
- engine indicator preserved

Header behavior:
- sticky on desktop
- 1px bottom rule
- warm paper background

## Footer

Very compact.

Left:
```text
FOCUSFIREWALL
A decision layer for human attention.
```

Right:
```text
LIVE DEMO   GITHUB   SUBMIT BUILD
```

Small note:
```text
Jev decides. Code acts. No generated text required.
```

---

# 7. ROUTES

Create these routes:

```text
/
/live
/replay
/benchmark
/how-it-works
/settings
/api/decide
/api/events
```

## `/`
Marketing + live demo landing page.

## `/live`
Main application console.

## `/replay`
Replay frozen events and inspect every decision.

## `/benchmark`
Evaluation results with reproducible controls.

## `/how-it-works`
Technical explanation of the decision architecture.

## `/settings`
Context/profile configuration and thresholds.

---

# 8. HOME PAGE

The home page must not feel like a standard AI SaaS landing page.

## Hero

Two-column layout.

Left:
- huge condensed headline
- one-sentence explanation
- primary button `OPEN LIVE ROUTER`
- secondary button `RUN 100-EVENT REPLAY`

Right:
A large illustrated/interactive decision console composed from real UI components, not a stock screenshot.

Example:

```text
┌──────────────────────────────────────┐
│ FOCUSFIREWALL                         ×│
│                                      │
│ INCOMING        JE V DECISION        │
│ ─────────       ─────────────        │
│ GitHub          INTERRUPT NOW       │
│ CI failed on    confidence 0.93     │
│ main                                    │
│                                      │
│ context: DEEP WORK                   │
│                                      │
│ ███████████████████░ 93%             │
└──────────────────────────────────────┘
```

## Hero proof strip

Four metric blocks, with live values when available:

```text
DECISIONS        EVENTS FILTERED       P50 LATENCY       ENGINE
---              ---                   ---              ---
0000             00%                    000 ms            JEV
```

If no live run has happened, show `—` rather than fabricated numbers.

## Problem section

Headline:
**EVERY NOTIFICATION ASKS THE SAME QUESTION.**

Show 5 incoming event examples with crossed-out distraction states.

## Context section

Show the same event under 3 contexts:

```text
IDLE         → SHOW SOON
DEEP WORK    → BATCH
MEETING      → SILENCE
```

This is a central product story.

## Architecture strip

```text
EVENT → CONTEXT → JEV → CONFIDENCE GATE → ACTION
```

Use large monospace labels and thin connector lines.

## Benchmark preview

Three large numbers pulled from the actual latest local benchmark run.

## CTA

```text
START THE ROUTER
```

---

# 9. LIVE CONSOLE

This is the core of the product.

Desktop layout:

```text
┌──────────────┬──────────────────────────────┬─────────────────┐
│ CONTEXT      │ EVENT STREAM                 │ DECISION        │
│              │                              │                 │
│ DEEP WORK    │ 14:37 Slack                  │ INTERRUPT NOW   │
│              │ 14:37 GitHub                 │ confidence 0.93 │
│ Focus        │ 14:38 Gmail                  │                 │
│ Study        │ 14:38 Discord                │ probabilities   │
│ Meeting      │ ...                          │ NOW  .93        │
│ Idle         │                              │ SOON .03        │
│              │                              │ BATCH .03       │
│ thresholds   │                              │ SILENCE .01     │
└──────────────┴──────────────────────────────┴─────────────────┘
```

## Left rail: context

Context presets:
- Deep Work
- Studying
- Meeting
- Gaming
- Idle

Each preset changes:
- active app
- attention budget
- interruption tolerance
- expected response style
- quiet preference

Show a small editable context object:

```text
ACTIVE APP       VS CODE
ACTIVITY         DEEP WORK
MEETING          NO
DEADLINE         18 MIN
ATTENTION BUDGET 6
INTERRUPTIONS     14
```

## Middle: event stream

Each event card contains:

```text
SOURCE
TIME
SENDER
TITLE
BODY PREVIEW
STATUS
```

Example:

```text
GITHUB                      14:38:04
repo-owner
CI FAILED — main
Build #281 failed after deploy step.
[ROUTED]
```

The stream must visibly process events one by one.

## Right: decision inspector

When an event is selected:

```text
DECISION
INTERRUPT NOW

CONFIDENCE
0.93

PROBABILITIES
NOW       ██████████████████  .93
SOON      █                      .03
BATCH     █                      .03
SILENCE   █                      .01

ENGINE
JEV 1.13

LATENCY
--- ms

CONTEXT
DEEP WORK
```

Do not invent latency. Populate from the real request timing.

Include buttons:

```text
✓ CORRECT
✕ WRONG
OVERRIDE
```

These affect a local feedback log only.

---

# 10. EVENT PLAYGROUND

Add a collapsible section in `/live`:

```text
TEST AN EVENT

Source      [ Slack ▼ ]
Sender      [ teammate           ]
Title       [                   ]
Body        [                   ]

[ ROUTE EVENT ]
```

Preset buttons:

```text
CRITICAL
DEADLINE
SOCIAL
MARKETING
SYSTEM
TEAMMATE
LOW-SIGNAL
```

Also support pasting JSON.

---

# 11. CORE DATA MODEL

TypeScript types:

```ts
type ContextMode =
  | 'deep_work'
  | 'studying'
  | 'meeting'
  | 'gaming'
  | 'idle';

type AttentionAction =
  | 'interrupt_now'
  | 'show_soon'
  | 'batch'
  | 'silence';

type EventSource =
  | 'slack'
  | 'email'
  | 'github'
  | 'calendar'
  | 'discord'
  | 'system'
  | 'agent'
  | 'custom';

interface AttentionEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  sender?: string;
  title: string;
  body: string;
  metadata?: Record<string, string | number | boolean>;
}

interface UserContext {
  mode: ContextMode;
  activeApp: string;
  activity: string;
  meeting: boolean;
  deadlineMinutes?: number;
  attentionBudgetRemaining: number;
  interruptionsToday: number;
  recentInterruptions: number;
  customRules: string[];
}

interface DecisionResult {
  action: AttentionAction;
  probabilities: Record<AttentionAction, number>;
  confidence: number;
  engine: 'jev' | 'laya' | 'mock' | 'rules';
  latencyMs?: number;
  requestId?: string;
  timestamp: string;
  questionVersion: string;
}
```

---

# 12. STATE CONSTRUCTION

Do not send a model-generated summary.

Send structured evidence.

Build a compact state containing:

```json
{
  "event": {
    "source": "github",
    "sender": "repo-owner",
    "title": "CI failed — main",
    "body": "Build 281 failed during deploy step"
  },
  "context": {
    "mode": "deep_work",
    "active_app": "VS Code",
    "activity": "coding",
    "meeting": false,
    "deadline_minutes": 18,
    "attention_budget_remaining": 6,
    "interruptions_today": 14,
    "recent_interruptions": 2
  },
  "policy": {
    "interrupt_only_when": "high consequence or immediate time sensitivity",
    "silence_only_when": "high confidence and low consequence"
  }
}
```

The state should contain raw evidence and deterministic fields.

Never let an LLM summarize the event before Jev in the MVP.

---

# 13. JEV QUESTIONS

Use one Jev call with multiple questions so the questions run against the same state.

Question version:
`attention-v1`

## Q1 — action

Type: `choice`

Options:

```text
interrupt_now: the event is important enough to justify an immediate interruption in the current context
show_soon: the user should be shown the event shortly, but it does not justify an immediate interruption
batch: the event should be collected with other items and shown together later
silence: the event is low-value enough that the user should not be interrupted or shown it in the normal flow
```

## Q2 — urgency

Type: `score`

Scale:

```text
0: no time sensitivity
1: can comfortably wait
2: should be handled soon
3: time-sensitive
4: immediate attention may be warranted
```

## Q3 — requires user action

Type: `noul`

Instruction:
> The event requires a meaningful action or response from the user rather than merely providing information.

## Q4 — high consequence if delayed

Type: `noul`

Instruction:
> Delaying this event could materially worsen a task, deadline, system state, or other important outcome.

## Q5 — context conflict

Type: `noul`

Instruction:
> Showing this event immediately would meaningfully disrupt the user's current activity without a strong reason to do so.

The app may display all five signals, but the final action must remain the explicit Choice answer after confidence gating.

---

# 14. CONFIDENCE POLICY

Never treat a low-confidence semantic decision as a high-confidence action.

Make thresholds configurable in settings.

Defaults:

```text
INTERRUPT_NOW    0.82
SHOW_SOON        0.72
BATCH            0.72
SILENCE          0.90
```

Safety rule:

- If Jev chooses SILENCE but confidence is below the silence threshold, downgrade to BATCH.
- If Jev chooses INTERRUPT_NOW but confidence is below the interrupt threshold, downgrade to SHOW_SOON.
- If any result is missing/invalid, do not silently guess. Use deterministic fallback policy and label engine `rules`.

Deterministic fallback:

1. If `deadlineMinutes <= 10` AND event requires action → INTERRUPT_NOW.
2. If high-consequence flag is true → SHOW_SOON.
3. If source is known low-signal and there is no action requirement → BATCH.
4. Otherwise → BATCH.

This is a fallback, not the semantic brain.

---

# 15. ATTENTION BUDGET

Every context has an attention budget.

Example:

```text
100 total daily attention credits
```

Use simple deterministic costs:

```text
INTERRUPT_NOW = 8
SHOW_SOON     = 3
BATCH         = 1
SILENCE       = 0
```

The budget is a product visualization, not a scientific measurement.

As budget decreases, include it in state:

```text
attention_budget_remaining: 22
```

The model can then take scarcity into account.

Do not claim this mathematically optimizes human productivity. Present it as an explicit user policy.

---

# 16. KEY DEMO SCENARIO

Build a deterministic 20-event demo stream.

Starting context:
`DEEP WORK`

Events:

1. GitHub — CI failure on main
2. Slack — teammate asks to review something later
3. Gmail — newsletter
4. Calendar — meeting in 12 minutes
5. Discord — meme
6. System — battery at 12%
7. GitHub — new non-blocking issue
8. Team chat — “Need decision before 5 PM”
9. Marketing email — product announcement
10. Calendar — meeting moved to now
11. CI — production deploy failed
12. Slack — social message
13. Gmail — receipt
14. Course platform — deadline moved earlier
15. Discord — mention
16. GitHub — PR approval requested
17. System — security update available
18. Newsletter — weekly digest
19. Team chat — incident resolved
20. Calendar — event cancelled

Show them arriving in 4–8 second simulation intervals, with a `RUN DEMO` button that accelerates the queue.

Then switch context to `MEETING`.

Replay at least 5 of the same events and visibly show different decisions where context materially changes the result.

This context-change demonstration is one of the most important moments in the final video.

---

# 17. BENCHMARK DATASET

Create a frozen local dataset at:

```text
data/events.json
```

Target:
**400 labeled scenarios**

Structure:

```json
{
  "id": "evt-001",
  "context": "deep_work",
  "event": { ... },
  "expected_action": "batch",
  "difficulty": "normal",
  "reason": "non-urgent social communication during focused work"
}
```

Dataset design:

- 80 per context × 5 contexts = 400
- balance all four actions
- at least 25% context-sensitive cases
- at least 10% adversarial/ambiguous cases
- at least 10% urgency-without-importance cases
- at least 10% important-but-non-urgent cases

Do not use private user data.
Do not claim labels came from human studies.
These are project benchmark labels defined by the creator.

---

# 18. BENCHMARK METRICS

On `/benchmark`, compute:

### Routing agreement
Percentage matching `expected_action`.

### Critical recall
Among events labeled `interrupt_now`, percentage routed to `interrupt_now` or `show_soon`.

### False interruption rate
Among events not labeled `interrupt_now`, percentage routed to `interrupt_now`.

### Suppression precision
Among events labeled `silence`, percentage routed to `silence`.

### Context sensitivity
For paired examples where the event is identical but context differs, percentage where the resulting action changes as intended.

### Confidence coverage
Percentage automatically acted on above the configured threshold.

### Latency
Report actual median/p50/p95 local end-to-end decision time.

### Cost
Only report provider usage/cost when actual usage data is available or a configured cost formula is explicitly labeled as an estimate.

Never fabricate a cheap Jev number.

---

# 19. REPLAY PAGE

`/replay` should feel like a technical DVR.

Top bar:

```text
REPLAY / FROZEN RUN 00017
400 EVENTS
```

Controls:

```text
◀  ▶  PLAY  PAUSE  0.5x  1x  2x  4x
```

Main view:
- timeline of events
- selected event
- state payload
- exact question set
- raw model answer
- final gated action

Add a “WHY DIFFERENT?” mode:
Select two contexts for the same event.
Show side-by-side states and resulting decisions.

---

# 20. HOW IT WORKS PAGE

Make it technical and visual.

Large pipeline:

```text
RAW EVENT
   ↓
USER CONTEXT
   ↓
COMPACT STATE
   ↓
JEV CHOICE / SCORE / NOUL
   ↓
PROBABILITIES + CONFIDENCE
   ↓
CONFIDENCE GATE
   ↓
DETERMINISTIC ACTION
```

Use a terminal-style panel beside it.

Explain:

- why typed decisions are used
- why the output is not generated prose
- why confidence matters
- why deterministic code remains responsible for execution
- why context is part of the evidence

Include a real request example, redacted of secrets.

---

# 21. SETTINGS

Sections:

## Context presets
Editable:
- mode
- active app
- activity label
- meeting state
- deadline minutes

## Thresholds
Sliders/numeric values for the four actions.

## Sources
Enable/disable event source types.

## Attention budget
Daily credits.

## Engine
```text
REAL JEV
MOCK DEMO
```

If an optional Laya adapter is implemented:
```text
REAL JEV
LOCAL LAYA
MOCK DEMO
```

The engine badge must always state which engine actually produced a decision.

---

# 22. API DESIGN

## `POST /api/decide`

Input:

```json
{
  "event": { ... },
  "context": { ... }
}
```

Output:

```json
{
  "action": "batch",
  "probabilities": {
    "interrupt_now": 0.04,
    "show_soon": 0.11,
    "batch": 0.78,
    "silence": 0.07
  },
  "confidence": 0.78,
  "engine": "jev",
  "latencyMs": 184,
  "questionVersion": "attention-v1"
}
```

Never send the Jev secret to the browser.

Server code must validate all request input with Zod.

## `POST /api/events`
Optional convenience endpoint for external simulations.

Input:
```json
{
  "events": [ ... ]
}
```

Return accepted count.

---

# 23. ENGINE ADAPTERS

Create:

```text
lib/engine/types.ts
lib/engine/jev.ts
lib/engine/mock.ts
```

Interface:

```ts
interface DecisionEngine {
  decide(input: DecisionInput): Promise<DecisionResult>;
}
```

`JevEngine`:
- builds state
- constructs typed questions
- sends server-side API request
- validates response
- measures end-to-end timing
- returns normalized `DecisionResult`

`MockEngine`:
- deterministic rules based on event fixtures
- only for UI/local development
- UI badge must say `MOCK`

Optional `LayaEngine` should be a separate adapter and must not be required for the deployable Jev demo.

---

# 24. OPTIONAL LAYA MODE

If time allows, implement Laya as a local-only adapter.

Architecture:

```text
Next.js UI
   ↓
/local-decision bridge
   ↓
Python local service
   ↓
Laya checkpoint
```

Do not bundle the model weights into the web deployment.

The UI should show:

```text
ENGINE: LAYA / LOCAL
NETWORK: OFF
```

This is an optional differentiator, not an MVP requirement.

---

# 25. TECH STACK

Preferred:

- Next.js App Router
- TypeScript
- Tailwind CSS for layout utilities
- custom CSS variables for the design system
- Zod for runtime validation
- Framer Motion only for small purposeful animations, or CSS transitions if simpler
- Recharts only if charts become genuinely useful; otherwise use custom HTML/CSS bars
- localStorage for demo/replay state
- no database in MVP
- no authentication

Deployment:
- Vercel-compatible

Development:
- Node.js 22+
- npm/pnpm

Do not add unnecessary dependencies.

---

# 26. PROJECT STRUCTURE

Use a clean structure similar to:

```text
app/
  page.tsx
  live/page.tsx
  replay/page.tsx
  benchmark/page.tsx
  how-it-works/page.tsx
  settings/page.tsx
  api/
    decide/route.ts
    events/route.ts

components/
  shell/
  live/
  replay/
  benchmark/
  ui/

lib/
  engine/
    types.ts
    jev.ts
    mock.ts
    prompts.ts
  attention/
    policy.ts
    context.ts
    event-fixtures.ts
    simulator.ts
    metrics.ts
  validation/
    schemas.ts
  storage/
    local.ts

data/
  events.json
  demo-stream.json

public/
  textures/

README.md
SUBMISSION.md
.env.example
```

---

# 27. NO-AI-SLOP DESIGN RULES

Absolutely avoid:

- purple-blue gradients
- glass cards
- 20px rounded corners everywhere
- floating glowing AI brain
- generic robot art
- generic sparkle icons
- oversized “AI POWERED” pills
- lorem ipsum
- stock illustrations
- fake customer logos
- fake testimonials
- fake benchmark numbers
- fake live status
- excessive cards inside cards inside cards
- huge whitespace that hides the useful product

The site should look like a technically literate independent product from the same cultural ecosystem as Made with Jev / Made with Laya.

---

# 28. ACCESSIBILITY

Must have:
- semantic HTML
- visible keyboard focus
- keyboard-operable buttons
- minimum AA-ish contrast
- reduced-motion mode
- no meaning conveyed by color alone
- labels for all form controls

---

# 29. RESPONSIVE DESIGN

Desktop is the primary showcase.

At <= 1024px:
- collapse the three-column live console to context → stream → inspector vertically

At <= 700px:
- horizontal event stream becomes single-column
- inspector becomes an expandable bottom sheet/card
- navigation becomes a menu
- preserve typography hierarchy

Do not simply scale desktop down.

---

# 30. ERROR STATES

Implement:

### Missing Jev key
```text
JEV OFFLINE
The live engine is not configured.
Run the local demo or add JEV_API_KEY on the server.
```

### Rate limit
```text
JEV RATE LIMITED
Decision queued / fallback applied.
```

### Invalid response
```text
INVALID DECISION
Rules fallback applied.
```

### Low confidence
Show a visually distinct amber/orange gate state:
```text
LOW CONFIDENCE
SAFE DOWNGRADE → BATCH
```

Never hide errors.
Never show a green success check when the engine did not actually run.

---

# 31. README REQUIREMENTS

README must contain:

1. Product screenshot/GIF
2. One-sentence description
3. Why Jev is used
4. Architecture diagram
5. Local setup
6. `.env` variables
7. Demo steps
8. Benchmark methodology
9. Example Jev request shape
10. Safety/fallback behavior
11. Known limitations
12. What is simulated vs actually integrated
13. Deployment notes

Include a clear statement:
> The demo simulator is local fixture data. Real Jev mode uses the Jev API when `JEV_API_KEY` is configured.

---

# 32. SUBMISSION PAGE / SUBMISSION MD

Create a concise submission summary:

Title:
**FocusFirewall — Context-Aware Attention Routing with Jev**

Description:
> FocusFirewall uses Jev as a rapid decision layer between incoming digital events and human attention. It considers the event plus current context, asks typed questions, gates low-confidence decisions, and routes each event to interrupt, show soon, batch, or silence. The project includes a replayable 400-scenario benchmark and a live visual console.

Proof points to include only after measuring them:
- number of events in benchmark
- actual p50/p95 latency
- actual decision agreement
- actual false interruption rate
- actual critical recall
- actual API usage/cost if measurable

Do not claim superiority over other builds.

---

# 33. DEMO VIDEO SCRIPT PLAN

Target: 60–90 seconds.

0–7 sec:
Show homepage.
Text:
`YOUR COMPUTER KNOWS WHAT ARRIVED.`

7–15 sec:
Open live router.
Start event stream.

15–28 sec:
Show 5 rapid decisions with live probabilities.

28–40 sec:
Switch context from `DEEP WORK` to `MEETING`.
Replay the same event.
Show the action changing.

40–52 sec:
Open a decision inspector.
Show:
- Choice
- probabilities
- confidence
- latency
- final gated action

52–66 sec:
Open benchmark page.
Show actual metrics from a completed run.

66–78 sec:
Open how-it-works architecture.

Final frame:
```text
FOCUSFIREWALL
JEV DECIDES.
CODE ACTS.
YOU STAY FOCUSED.
```

Do not narrate unsupported performance claims.

---

# 34. ACCEPTANCE CRITERIA

The build is complete only when all of these are true:

- [ ] Home page renders polished and responsive.
- [ ] Live page can run demo stream.
- [ ] Real Jev mode works from server route with secret key.
- [ ] Mock mode is explicit.
- [ ] Context presets work.
- [ ] Same event can be replayed under different contexts.
- [ ] Decision inspector shows actual probabilities/confidence.
- [ ] Confidence gate is implemented.
- [ ] Deterministic fallback works.
- [ ] Benchmark dataset contains 400 scenarios.
- [ ] Benchmark metrics calculate from actual results.
- [ ] Replay mode works.
- [ ] No fabricated metrics.
- [ ] No client-side secret exposure.
- [ ] README is complete.
- [ ] SUBMISSION.md is complete.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] TypeScript errors are resolved.
- [ ] Main UI works in Chrome and Edge.
- [ ] Mobile layout is usable.
- [ ] Reduced-motion mode works.

---

# 35. AGENT EXECUTION PLAN

You are the coding agent responsible for building the complete project.

Follow this order.

## Phase 1 — inspect and plan

- inspect repository and existing files
- preserve useful existing project configuration if present
- identify framework/version
- create an implementation checklist

Do not ask the user for confirmation for normal implementation choices.

## Phase 2 — scaffold

- set up routes
- install only needed packages
- create design tokens
- build shell/header/footer

## Phase 3 — implement the actual attention engine

- types
- schemas
- state builder
- questions
- Jev adapter
- mock adapter
- policy gate
- simulator

Do this before polishing decorative UI.

## Phase 4 — live console

Build and test the 3-column console.

## Phase 5 — benchmark + replay

Build fixture dataset and metric engine.

## Phase 6 — visual polish

Apply the researched paper / ink / pink / orange visual language.

## Phase 7 — real-world validation

Run:
- unit tests
- type check
- lint
- build
- local production preview

Run a real Jev request if a key is configured.

Record actual latency and response shape.

## Phase 8 — submission assets

Write:
- README
- SUBMISSION.md
- final setup instructions
- demo script

Do not report success until the production build passes.

---

# 36. TEST PLAN

Unit tests:

- schema validation
- action thresholds
- fallback behavior
- probability normalization
- context serialization
- metric calculations

Decision policy tests:

1. low confidence silence → batch
2. low confidence interrupt → show soon
3. missing engine result → rules fallback
4. urgent deadline + meaningful action → interrupt
5. low-signal event in deep work → batch/silence depending on fixture

Integration tests:

- `/api/decide` input validation
- mocked Jev response normalization
- error handling

UI tests:

- run demo
- change context
- inspect decision
- replay run
- benchmark rendering

---

# 37. FINAL PRODUCT FEEL

The interface should feel like:

**an old technical poster turned into a modern operator console.**

It should be:

- compact
- confident
- slightly strange
- tactile
- technical
- editorial
- highly legible

The product itself should remain calm despite the visual personality.

The moment that should stick in a viewer's mind is:

> the same notification enters twice, the user's context changes, and FocusFirewall makes a different decision.

That is the product thesis in one interaction.

---

# 38. MOST IMPORTANT IMPLEMENTATION RULE

Do not build a chatbot around Jev.

Do not ask Jev to explain its reasoning.

Do not use Jev to generate prose.

Do not summarize the event with another model before sending it.

Use Jev for the small semantic decision.
Use the application code for:
- state construction
- thresholds
- fallback
- action execution
- logging
- metrics
- replay

The architecture must remain:

```text
STATE → DECISION → CODE
```

not:

```text
STATE → BIG CHATBOT → PARAGRAPH → PARSE JSON → CODE
```

---

# 39. OPTIONAL FUTURE EXTENSIONS

Only after the MVP is stable:

1. Browser extension adapters.
2. Windows notification listener adapter.
3. Calendar adapter.
4. Slack/email adapters.
5. Local Laya engine.
6. User-specific policy learning from overrides.
7. Team/shared attention modes.
8. Weekly attention report.

Do not let these extensions delay the core public demo.

---

# END STATE

A stranger should be able to open the site, understand the idea in under 10 seconds, click one button, watch events arrive, see Jev make typed decisions, switch context, observe the decision change, inspect the confidence/probabilities, and then run the benchmark.

That is the bar.
