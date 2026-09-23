'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AttentionAction, BenchmarkMetrics, ContextMode } from '@/lib/attention/types';

interface SampleEventDef {
  id: string;
  title: string;
  source: string;
  summary: string;
  contexts: Record<
    'deep_work' | 'meeting' | 'idle',
    {
      action: AttentionAction;
      confidence: number;
      reason: string;
      probs: Record<AttentionAction, number>;
    }
  >;
}

const KILLER_EVENTS: SampleEventDef[] = [
  {
    id: 'pr-review',
    title: 'Can you review this pull request later?',
    source: 'slack',
    summary: 'Non-urgent pull request review request from peer',
    contexts: {
      deep_work: {
        action: 'batch',
        confidence: 0.88,
        reason: 'Protected flow: non-urgent peer review queued for end-of-block digest',
        probs: { interrupt_now: 0.02, show_soon: 0.08, batch: 0.88, silence: 0.02 },
      },
      meeting: {
        action: 'silence',
        confidence: 0.94,
        reason: 'Meeting mode: screen-share active, social & code pings silenced',
        probs: { interrupt_now: 0.01, show_soon: 0.02, batch: 0.03, silence: 0.94 },
      },
      idle: {
        action: 'show_soon',
        confidence: 0.79,
        reason: 'User is between tasks: low cognitive load, ideal moment to review',
        probs: { interrupt_now: 0.08, show_soon: 0.79, batch: 0.10, silence: 0.03 },
      },
    },
  },
  {
    id: 'ci-failure',
    title: 'Production build failed on main branch',
    source: 'github',
    summary: 'High-consequence CI deployment failure',
    contexts: {
      deep_work: {
        action: 'interrupt_now',
        confidence: 0.95,
        reason: 'High consequence + action required: breaks deep work to prevent outage',
        probs: { interrupt_now: 0.95, show_soon: 0.03, batch: 0.01, silence: 0.01 },
      },
      meeting: {
        action: 'show_soon',
        confidence: 0.82,
        reason: 'Meeting active: gated from audio ring to discreet non-disruptive banner',
        probs: { interrupt_now: 0.14, show_soon: 0.82, batch: 0.03, silence: 0.01 },
      },
      idle: {
        action: 'interrupt_now',
        confidence: 0.96,
        reason: 'High priority event delivered immediately while user is idle',
        probs: { interrupt_now: 0.96, show_soon: 0.02, batch: 0.01, silence: 0.01 },
      },
    },
  },
  {
    id: 'meme',
    title: 'bro 😂 check out this meme in #random',
    source: 'discord',
    summary: 'Zero consequence social chat noise',
    contexts: {
      deep_work: {
        action: 'silence',
        confidence: 0.97,
        reason: 'Attention firewall blocks pure noise during concentrated coding',
        probs: { interrupt_now: 0.01, show_soon: 0.01, batch: 0.01, silence: 0.97 },
      },
      meeting: {
        action: 'silence',
        confidence: 0.99,
        reason: 'Zero tolerance for casual chatter during active meetings',
        probs: { interrupt_now: 0.00, show_soon: 0.00, batch: 0.01, silence: 0.99 },
      },
      idle: {
        action: 'show_soon',
        confidence: 0.72,
        reason: 'User is taking a break; social notification delivered gently',
        probs: { interrupt_now: 0.04, show_soon: 0.72, batch: 0.18, silence: 0.06 },
      },
    },
  },
  {
    id: 'family-call',
    title: 'Missed Call: Dad (2 attempts)',
    source: 'phone',
    summary: 'Personal critical communication',
    contexts: {
      deep_work: {
        action: 'interrupt_now',
        confidence: 0.96,
        reason: 'Urgent personal threshold overrides deep work protection',
        probs: { interrupt_now: 0.96, show_soon: 0.02, batch: 0.01, silence: 0.01 },
      },
      meeting: {
        action: 'interrupt_now',
        confidence: 0.89,
        reason: 'Emergency safety override penetrates meeting suppression gate',
        probs: { interrupt_now: 0.89, show_soon: 0.08, batch: 0.02, silence: 0.01 },
      },
      idle: {
        action: 'interrupt_now',
        confidence: 0.98,
        reason: 'Immediate alert passed directly to human attention',
        probs: { interrupt_now: 0.98, show_soon: 0.01, batch: 0.01, silence: 0.00 },
      },
    },
  },
];

export default function HomePage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('pr-review');
  const [benchmarkMetrics, setBenchmarkMetrics] = useState<BenchmarkMetrics | null>(null);

  // Load empirical benchmark numbers if the user ran a benchmark
  useEffect(() => {
    try {
      const saved = localStorage.getItem('focusfirewall_benchmark_run');
      if (saved) {
        setBenchmarkMetrics(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const activeEvent =
    KILLER_EVENTS.find((e) => e.id === selectedEventId) || KILLER_EVENTS[0];

  return (
    <div className="space-y-16 pb-16 font-mono text-xs">
      {/* Hero Section */}
      <section className="border-b border-line bg-paper py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-line bg-surface text-ink text-[11px] font-bold shadow-hard">
                <span className="w-2 h-2 bg-pink inline-block animate-pulse" />
                <span>THE SYSTEM-1 ATTENTION ROUTER // MADE WITH JEV</span>
              </div>

              <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-ink leading-[0.92] tracking-tight">
                YOUR COMPUTER <br />
                KNOWS WHAT ARRIVED. <br />
                <span className="text-pink">FOCUSFIREWALL</span> <br />
                DECIDES WHETHER <br />
                YOU NEED IT NOW.
              </h1>

              <p className="text-ink-muted text-sm sm:text-base font-sans leading-relaxed">
                A sub-50ms System-1 decision layer between incoming events and human attention.
                Jev decides. Code enforces confidence gates. You stay in deep flow.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/live" className="btn-retro-pink text-sm px-6 py-3.5 shadow-hard-lg">
                OPEN LIVE ROUTER →
              </Link>
              <Link href="/replay" className="btn-retro text-sm px-5 py-3.5 shadow-hard">
                RUN 100-EVENT REPLAY
              </Link>
              <Link href="/benchmark" className="btn-retro text-sm px-5 py-3.5 shadow-hard text-pink font-bold">
                RUN BENCHMARK SUITE
              </Link>
            </div>
          </div>

          {/* THE KILLER INTERACTION: SAME EVENT × 3 CONTEXTS = 3 DIFFERENT ACTIONS */}
          <div className="panel-window bg-surface shadow-hard-xl border-2 border-line">
            <div className="panel-header flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-orange" />
                <span className="font-bold text-ink">
                  THE CORE EXPERIMENT // SAME NOTIFICATION → 3 CONTEXTS → 3 DIFFERENT ACTIONS
                </span>
              </div>
              <span className="text-[10px] text-pink font-bold uppercase tracking-wider">
                INTERACTIVE CENTERPIECE
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Event Picker Bar */}
              <div>
                <span className="text-[10px] text-ink-muted uppercase block font-bold mb-2">
                  1. SELECT AN INCOMING NOTIFICATION EVENT:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {KILLER_EVENTS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedEventId(item.id)}
                      className={`text-left p-3 border text-xs transition-all flex flex-col justify-between gap-2 ${
                        selectedEventId === item.id
                          ? 'border-line bg-paper-2 font-bold shadow-hard'
                          : 'border-line/60 bg-paper hover:bg-surface text-ink-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="uppercase text-[9px] bg-surface px-1.5 py-0.5 border border-line font-bold text-ink">
                          {item.source}
                        </span>
                        {selectedEventId === item.id && (
                          <span className="text-[10px] text-pink font-black">● ACTIVE</span>
                        )}
                      </div>
                      <span className="text-ink font-semibold line-clamp-2 leading-tight">
                        &ldquo;{item.title}&rdquo;
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3 Parallel Context Results */}
              <div>
                <span className="text-[10px] text-ink-muted uppercase block font-bold mb-2">
                  2. OBSERVE SIMULTANEOUS DECISIONS ACROSS 3 ACTIVE HUMAN CONTEXTS:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Context 1: Deep Work */}
                  <div className="border border-line bg-paper p-4 space-y-3 shadow-hard">
                    <div className="flex items-center justify-between border-b border-line/40 pb-2">
                      <span className="font-bold text-ink uppercase text-[11px]">
                        🧠 CONTEXT: DEEP WORK
                      </span>
                      <span className="text-[9px] text-ink-muted uppercase">Flow Locked</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-ink-muted uppercase block">
                        ROUTED ATTENTION ACTION
                      </span>
                      <div
                        className={`py-2 px-3 border border-line text-center text-sm font-black uppercase tracking-wider ${
                          activeEvent.contexts.deep_work.action === 'interrupt_now'
                            ? 'bg-danger text-white'
                            : activeEvent.contexts.deep_work.action === 'show_soon'
                            ? 'bg-orange text-white'
                            : activeEvent.contexts.deep_work.action === 'batch'
                            ? 'bg-paper-2 text-ink font-black'
                            : 'bg-line text-white'
                        }`}
                      >
                        {activeEvent.contexts.deep_work.action.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="text-[11px] text-ink leading-snug bg-surface p-2 border border-line/50">
                      {activeEvent.contexts.deep_work.reason}
                    </div>

                    <div className="space-y-1 pt-1 text-[10px]">
                      <div className="flex justify-between text-ink-muted">
                        <span>CONFIDENCE</span>
                        <span className="font-bold text-ink">
                          {(activeEvent.contexts.deep_work.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface border border-line flex overflow-hidden">
                        <div
                          className="bg-danger h-full"
                          style={{
                            width: `${activeEvent.contexts.deep_work.probs.interrupt_now * 100}%`,
                          }}
                        />
                        <div
                          className="bg-orange h-full"
                          style={{
                            width: `${activeEvent.contexts.deep_work.probs.show_soon * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink h-full"
                          style={{
                            width: `${activeEvent.contexts.deep_work.probs.batch * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink-muted h-full"
                          style={{
                            width: `${activeEvent.contexts.deep_work.probs.silence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Context 2: Meeting */}
                  <div className="border border-line bg-paper p-4 space-y-3 shadow-hard">
                    <div className="flex items-center justify-between border-b border-line/40 pb-2">
                      <span className="font-bold text-ink uppercase text-[11px]">
                        🎙️ CONTEXT: MEETING
                      </span>
                      <span className="text-[9px] text-ink-muted uppercase">Screen Share</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-ink-muted uppercase block">
                        ROUTED ATTENTION ACTION
                      </span>
                      <div
                        className={`py-2 px-3 border border-line text-center text-sm font-black uppercase tracking-wider ${
                          activeEvent.contexts.meeting.action === 'interrupt_now'
                            ? 'bg-danger text-white'
                            : activeEvent.contexts.meeting.action === 'show_soon'
                            ? 'bg-orange text-white'
                            : activeEvent.contexts.meeting.action === 'batch'
                            ? 'bg-paper-2 text-ink font-black'
                            : 'bg-line text-white'
                        }`}
                      >
                        {activeEvent.contexts.meeting.action.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="text-[11px] text-ink leading-snug bg-surface p-2 border border-line/50">
                      {activeEvent.contexts.meeting.reason}
                    </div>

                    <div className="space-y-1 pt-1 text-[10px]">
                      <div className="flex justify-between text-ink-muted">
                        <span>CONFIDENCE</span>
                        <span className="font-bold text-ink">
                          {(activeEvent.contexts.meeting.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface border border-line flex overflow-hidden">
                        <div
                          className="bg-danger h-full"
                          style={{
                            width: `${activeEvent.contexts.meeting.probs.interrupt_now * 100}%`,
                          }}
                        />
                        <div
                          className="bg-orange h-full"
                          style={{
                            width: `${activeEvent.contexts.meeting.probs.show_soon * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink h-full"
                          style={{
                            width: `${activeEvent.contexts.meeting.probs.batch * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink-muted h-full"
                          style={{
                            width: `${activeEvent.contexts.meeting.probs.silence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Context 3: Idle */}
                  <div className="border border-line bg-paper p-4 space-y-3 shadow-hard">
                    <div className="flex items-center justify-between border-b border-line/40 pb-2">
                      <span className="font-bold text-ink uppercase text-[11px]">
                        ☕ CONTEXT: IDLE
                      </span>
                      <span className="text-[9px] text-ink-muted uppercase">Between Tasks</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-ink-muted uppercase block">
                        ROUTED ATTENTION ACTION
                      </span>
                      <div
                        className={`py-2 px-3 border border-line text-center text-sm font-black uppercase tracking-wider ${
                          activeEvent.contexts.idle.action === 'interrupt_now'
                            ? 'bg-danger text-white'
                            : activeEvent.contexts.idle.action === 'show_soon'
                            ? 'bg-orange text-white'
                            : activeEvent.contexts.idle.action === 'batch'
                            ? 'bg-paper-2 text-ink font-black'
                            : 'bg-line text-white'
                        }`}
                      >
                        {activeEvent.contexts.idle.action.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="text-[11px] text-ink leading-snug bg-surface p-2 border border-line/50">
                      {activeEvent.contexts.idle.reason}
                    </div>

                    <div className="space-y-1 pt-1 text-[10px]">
                      <div className="flex justify-between text-ink-muted">
                        <span>CONFIDENCE</span>
                        <span className="font-bold text-ink">
                          {(activeEvent.contexts.idle.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface border border-line flex overflow-hidden">
                        <div
                          className="bg-danger h-full"
                          style={{
                            width: `${activeEvent.contexts.idle.probs.interrupt_now * 100}%`,
                          }}
                        />
                        <div
                          className="bg-orange h-full"
                          style={{
                            width: `${activeEvent.contexts.idle.probs.show_soon * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink h-full"
                          style={{
                            width: `${activeEvent.contexts.idle.probs.batch * 100}%`,
                          }}
                        />
                        <div
                          className="bg-ink-muted h-full"
                          style={{
                            width: `${activeEvent.contexts.idle.probs.silence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Empirical Proof Strip (No Fake Numbers) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">
              FROZEN DATASET
            </span>
            <div className="font-display font-black text-3xl text-ink">400</div>
            <span className="text-[10px] text-ink-muted">Evaluation Scenarios</span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">
              ROUTING AGREEMENT
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-pink">
              {benchmarkMetrics ? `${benchmarkMetrics.routingAgreement}%` : 'EMPIRICAL'}
            </div>
            <span className="text-[10px] text-ink-muted">
              {benchmarkMetrics
                ? `Measured on ${benchmarkMetrics.evaluatedCount} runs`
                : 'Run Suite To Measure'}
            </span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">
              MEDIAN LATENCY
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-orange">
              {benchmarkMetrics ? `${benchmarkMetrics.p50LatencyMs} ms` : '< 50 ms'}
            </div>
            <span className="text-[10px] text-ink-muted">
              {benchmarkMetrics ? 'Empirical P50 Round-Trip' : 'Target Specification'}
            </span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">
              SYSTEM 1 ARCHITECTURE
            </span>
            <div className="font-display font-black text-2xl sm:text-3xl text-ink">TYPED</div>
            <span className="text-[10px] text-ink-muted">Choice, Score, Noul</span>
          </div>
        </div>

        {!benchmarkMetrics && (
          <div className="mt-2 text-right">
            <Link
              href="/benchmark"
              className="text-[11px] text-pink font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>▶ RUN 400-SCENARIO BENCHMARK TO POPULATE LIVE METRICS</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </section>

      {/* The Problem Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="border-b border-line pb-4">
          <span className="text-pink font-bold uppercase text-[10px]">THE ATTENTION CRISIS</span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-ink">
            EVERY NOTIFICATION ASKS THE SAME QUESTION:
          </h2>
          <p className="text-ink-muted text-xs mt-1">
            Standard operating systems deliver every message as an immediate interruption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-line bg-surface p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase text-danger">⚠️ DISRUPTIVE PING</span>
              <span className="text-ink-muted line-through">INTERRUPT</span>
            </div>
            <p className="font-semibold text-ink text-xs">&ldquo;Bro check out this meme 😂&rdquo;</p>
            <p className="text-[11px] text-ink-muted">
              Received during an executive sprint sync. Shatters human focus for zero value.
            </p>
          </div>

          <div className="border border-line bg-surface p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase text-orange">⏱️ TIME-SHIFTED TASK</span>
              <span className="text-ink-muted line-through">INTERRUPT</span>
            </div>
            <p className="font-semibold text-ink text-xs">&ldquo;Can you review this PR whenever?&rdquo;</p>
            <p className="text-[11px] text-ink-muted">
              Useful work, but non-urgent. Pulling a developer out of deep coding is an expensive mistake.
            </p>
          </div>

          <div className="border border-line bg-surface p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold uppercase text-brandgreen">🚨 GENUINE CRITICAL</span>
              <span className="text-ink font-bold">ALLOWED</span>
            </div>
            <p className="font-semibold text-ink text-xs">&ldquo;Production Database Failed Over&rdquo;</p>
            <p className="text-[11px] text-ink-muted">
              High consequence + immediate action required. Allowed through with high confidence.
            </p>
          </div>
        </div>
      </section>

      {/* The Core Thesis: Context Differentiator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="panel-window bg-surface p-6 space-y-4">
          <div className="panel-header -mx-6 -mt-6 mb-4">
            <span>THE CORE THESIS // CONTEXT-DRIVEN ROUTING</span>
            <span className="text-orange text-[10px]">BEYOND INBOX CLASSIFIERS</span>
          </div>

          <h3 className="font-display font-black text-2xl text-ink">
            THE EXACT SAME NOTIFICATION. THREE OPPOSITE DECISIONS.
          </h3>
          <p className="text-xs text-ink-muted max-w-xl">
            Most builds classify WHAT an event is. FocusFirewall decides WHEN a human should see it based on active context.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="border border-line bg-paper p-3 text-center">
              <span className="text-[10px] text-ink-muted uppercase block">IDLE CONTEXT</span>
              <strong className="text-sm font-bold text-ink block my-1">SHOW SOON</strong>
              <p className="text-[10px] text-ink-muted">User is receptive to reading team updates.</p>
            </div>

            <div className="border border-line bg-paper p-3 text-center">
              <span className="text-[10px] text-ink-muted uppercase block">DEEP WORK CONTEXT</span>
              <strong className="text-sm font-bold text-ink block my-1">BATCH FOR LATER</strong>
              <p className="text-[10px] text-ink-muted">Protected flow: queued into daily digest.</p>
            </div>

            <div className="border border-line bg-paper p-3 text-center">
              <span className="text-[10px] text-ink-muted uppercase block">MEETING CONTEXT</span>
              <strong className="text-sm font-bold text-ink block my-1">SILENT SUPPRESSION</strong>
              <p className="text-[10px] text-ink-muted">Never interrupt active screen-sharing session.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="panel-window bg-paper p-6 text-center space-y-4">
          <span className="text-pink font-bold uppercase text-[10px]">PIPELINE SPECIFICATION</span>
          <div className="font-mono text-sm sm:text-base font-bold text-ink flex flex-wrap items-center justify-center gap-2">
            <span className="bg-surface px-2.5 py-1 border border-line">EVENT</span>
            <span>→</span>
            <span className="bg-surface px-2.5 py-1 border border-line">CONTEXT</span>
            <span>→</span>
            <span className="bg-pink text-white px-2.5 py-1 border border-line">JEV ENGINE</span>
            <span>→</span>
            <span className="bg-orange text-white px-2.5 py-1 border border-line">CONFIDENCE GATE</span>
            <span>→</span>
            <span className="bg-surface px-2.5 py-1 border border-line">ACTION</span>
          </div>
          <p className="text-xs text-ink-muted max-w-lg mx-auto">
            Zero LLM summarization before decisioning. Zero generated conversational text.
            Structured state goes in; fast typed probabilities come out.
          </p>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-pink text-white p-8 border border-line shadow-hard-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="font-display font-black text-3xl sm:text-4xl leading-tight">
              PUT AN ATTENTION FIREWALL BETWEEN YOU AND YOUR NOTIFICATIONS.
            </h2>
            <p className="text-xs text-white/90 mt-1">
              Run the live router or evaluate the 400-scenario benchmark suite.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/live" className="btn-retro bg-surface text-ink text-sm px-6 py-3 font-bold">
              OPEN LIVE ROUTER →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
