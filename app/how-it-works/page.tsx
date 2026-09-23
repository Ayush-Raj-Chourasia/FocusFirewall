import Link from 'next/link';

export default function HowItWorksPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10 font-mono text-xs">
      {/* Header */}
      <div className="space-y-2 border-b border-line pb-6">
        <span className="text-pink font-bold uppercase text-[11px] tracking-widest block">
          SYSTEM-1 ARCHITECTURE SPECIFICATION
        </span>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-ink tracking-tight">
          HOW FOCUSFIREWALL WORKS
        </h1>
        <p className="text-ink-muted text-sm max-w-2xl font-sans">
          Most AI apps ask a giant LLM to generate paragraphs of text to explain whether an email is important.
          FocusFirewall uses Jev for rapid, narrow typed decisions over structured evidence, leaving execution to deterministic code.
        </p>
      </div>

      {/* Visual Pipeline Diagram */}
      <div className="panel-window bg-surface p-6">
        <div className="panel-header mb-4">
          <span>THE DECISION PIPELINE</span>
          <span className="text-orange text-[10px]">ZERO PROSE GENERATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center text-center">
          <div className="p-3 border border-line bg-paper">
            <span className="text-[10px] text-ink-muted uppercase block">1. EVIDENCE</span>
            <strong className="text-ink text-xs font-bold block mt-1">RAW EVENT</strong>
            <span className="text-[10px] text-ink-muted">Title, body, sender</span>
          </div>

          <div className="text-lg font-bold text-ink-muted hidden md:block">→</div>

          <div className="p-3 border border-line bg-paper">
            <span className="text-[10px] text-ink-muted uppercase block">2. CONTEXT</span>
            <strong className="text-ink text-xs font-bold block mt-1">USER STATE</strong>
            <span className="text-[10px] text-ink-muted">App, meeting, budget</span>
          </div>

          <div className="text-lg font-bold text-ink-muted hidden md:block">→</div>

          <div className="p-3 border border-line bg-pink text-white shadow-hard">
            <span className="text-[10px] text-white/80 uppercase block">3. JEV ENGINE</span>
            <strong className="text-white text-xs font-black block mt-1">TYPED QUESTIONS</strong>
            <span className="text-[10px] text-white/80">Choice, Score, Noul</span>
          </div>

          <div className="text-lg font-bold text-ink-muted hidden md:block">→</div>

          <div className="p-3 border border-line bg-orange text-white shadow-hard">
            <span className="text-[10px] text-white/80 uppercase block">4. SAFETY GATE</span>
            <strong className="text-white text-xs font-black block mt-1">CONFIDENCE</strong>
            <span className="text-[10px] text-white/80">Threshold downgrade</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-line text-center">
          <div className="inline-block px-4 py-2 border border-line bg-paper-2 font-bold text-xs uppercase shadow-hard">
            RESULT: EXACTLY ONE DETERMINISTIC ACTION [INTERRUPT NOW | SHOW SOON | BATCH | SILENCE]
          </div>
        </div>
      </div>

      {/* Technical Comparison: System-1 vs Generic LLM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="panel-window bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-3 h-3 bg-danger inline-block" />
            <strong className="text-ink font-bold uppercase text-sm">
              Standard Generative AI Approach (Slow & Flaky)
            </strong>
          </div>
          <ul className="space-y-2 text-[11px] text-ink-muted list-disc list-inside">
            <li>Takes raw event and asks a 70B parameter model to summarize it.</li>
            <li>Generates 3 paragraphs explaining whether you should read it.</li>
            <li>Latency: 1,500ms – 4,000ms per event.</li>
            <li>Prone to JSON parsing errors and markdown formatting failures.</li>
            <li>No explicit probability distribution or calibration.</li>
            <li>High cost per decision; cannot run 500 times a day in background.</li>
          </ul>
        </div>

        <div className="panel-window bg-surface p-4 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="w-3 h-3 bg-brandgreen inline-block" />
            <strong className="text-ink font-bold uppercase text-sm">
              FocusFirewall System-1 Approach (Fast & Typed)
            </strong>
          </div>
          <ul className="space-y-2 text-[11px] text-ink list-disc list-inside">
            <li>Combines raw event + user context into a compact state JSON.</li>
            <li>Asks fixed typed questions: Choice (4 actions), Score (0-4), Noul (binary).</li>
            <li>Latency: 20ms – 90ms end-to-end.</li>
            <li>Zero tokens generated = zero hallucinated schema syntax.</li>
            <li>Returns calibrated probability distribution across actions.</li>
            <li>Deterministic confidence gate enforces safety rules in code.</li>
          </ul>
        </div>
      </div>

      {/* Sample Payload Inspection */}
      <div className="panel-window bg-surface">
        <div className="panel-header">
          <span>REAL STATE EVIDENCE FORMAT (NO PRE-LLM SUMMARY)</span>
          <span className="text-[10px] text-pink">VERIFIED SCHEMA</span>
        </div>
        <div className="p-4">
          <pre className="bg-paper-2 border border-line p-4 text-[11px] overflow-x-auto text-ink">
{`{
  "event": {
    "source": "github",
    "sender": "ci-bot",
    "title": "CI failure on main branch",
    "body": "Build #4182 failed on test stage: integration/auth.test.ts exited with code 1."
  },
  "context": {
    "mode": "deep_work",
    "active_app": "VS Code",
    "activity": "Coding payment webhook handler",
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
}`}
          </pre>
        </div>
      </div>

      {/* CTA */}
      <div className="flex justify-between items-center bg-paper-2 p-4 border border-line">
        <div>
          <strong className="text-sm text-ink font-bold block">EXPERIENCE IT IN ACTION</strong>
          <span className="text-[11px] text-ink-muted">Run the 20-event live console or inspect the replay DVR.</span>
        </div>
        <div className="flex gap-2">
          <Link href="/live" className="btn-retro-pink">
            OPEN LIVE ROUTER →
          </Link>
          <Link href="/replay" className="btn-retro">
            VIEW REPLAY DVR
          </Link>
        </div>
      </div>
    </div>
  );
}
