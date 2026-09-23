'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AttentionAction, ContextMode } from '@/lib/attention/types';

export default function HomePage() {
  // Interactive mini-console state in the hero
  const [selectedContext, setSelectedContext] = useState<ContextMode>('deep_work');
  const [activeDecision, setActiveDecision] = useState<{
    title: string;
    source: string;
    action: AttentionAction;
    confidence: number;
    probs: Record<AttentionAction, number>;
  }>({
    title: 'CI failed on main branch',
    source: 'github',
    action: 'interrupt_now',
    confidence: 0.93,
    probs: { interrupt_now: 0.93, show_soon: 0.03, batch: 0.03, silence: 0.01 },
  });

  const sampleEvents = [
    {
      title: 'CI failed on main branch',
      source: 'github',
      decisions: {
        deep_work: { action: 'interrupt_now' as AttentionAction, confidence: 0.93, probs: { interrupt_now: 0.93, show_soon: 0.03, batch: 0.03, silence: 0.01 } },
        meeting: { action: 'show_soon' as AttentionAction, confidence: 0.81, probs: { interrupt_now: 0.12, show_soon: 0.81, batch: 0.05, silence: 0.02 } },
        idle: { action: 'interrupt_now' as AttentionAction, confidence: 0.91, probs: { interrupt_now: 0.91, show_soon: 0.06, batch: 0.02, silence: 0.01 } },
      },
    },
    {
      title: 'Can you review this pull request later?',
      source: 'slack',
      decisions: {
        deep_work: { action: 'batch' as AttentionAction, confidence: 0.78, probs: { interrupt_now: 0.04, show_soon: 0.14, batch: 0.78, silence: 0.04 } },
        meeting: { action: 'silence' as AttentionAction, confidence: 0.91, probs: { interrupt_now: 0.01, show_soon: 0.03, batch: 0.05, silence: 0.91 } },
        idle: { action: 'show_soon' as AttentionAction, confidence: 0.74, probs: { interrupt_now: 0.12, show_soon: 0.74, batch: 0.11, silence: 0.03 } },
      },
    },
    {
      title: 'bro 😂 check out this meme in #random',
      source: 'discord',
      decisions: {
        deep_work: { action: 'silence' as AttentionAction, confidence: 0.94, probs: { interrupt_now: 0.01, show_soon: 0.01, batch: 0.04, silence: 0.94 } },
        meeting: { action: 'silence' as AttentionAction, confidence: 0.96, probs: { interrupt_now: 0.01, show_soon: 0.01, batch: 0.02, silence: 0.96 } },
        idle: { action: 'show_soon' as AttentionAction, confidence: 0.68, probs: { interrupt_now: 0.05, show_soon: 0.68, batch: 0.20, silence: 0.07 } },
      },
    },
  ];

  const handleContextClick = (ctx: ContextMode) => {
    setSelectedContext(ctx);
    const curr = sampleEvents.find((e) => e.title === activeDecision.title) || sampleEvents[0];
    const dec = (curr.decisions as any)[ctx] || curr.decisions.deep_work;
    setActiveDecision({
      title: curr.title,
      source: curr.source,
      action: dec.action,
      confidence: dec.confidence,
      probs: dec.probs,
    });
  };

  const handleEventClick = (sample: typeof sampleEvents[0]) => {
    const dec = (sample.decisions as any)[selectedContext] || sample.decisions.deep_work;
    setActiveDecision({
      title: sample.title,
      source: sample.source,
      action: dec.action,
      confidence: dec.confidence,
      probs: dec.probs,
    });
  };

  return (
    <div className="space-y-16 pb-16 font-mono text-xs">
      {/* Hero Section */}
      <section className="border-b border-line bg-paper py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-line bg-surface text-ink text-[11px] font-bold shadow-hard">
              <span className="w-2 h-2 bg-pink inline-block animate-pulse" />
              <span>THE ATTENTION ROUTER // MADE WITH JEV</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl text-ink leading-[0.92] tracking-tight">
              YOUR COMPUTER <br />
              KNOWS WHAT ARRIVED. <br />
              <span className="text-pink">FOCUSFIREWALL</span> <br />
              DECIDES WHETHER <br />
              YOU NEED IT NOW.
            </h1>

            <p className="text-ink-muted text-sm sm:text-base font-sans max-w-xl leading-relaxed">
              A fast System-1 decision layer between incoming events and human attention.
              Jev decides. Code enforces confidence gates. You stay in deep flow.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/live" className="btn-retro-pink text-sm px-6 py-3.5 shadow-hard-lg">
                OPEN LIVE ROUTER →
              </Link>
              <Link href="/replay" className="btn-retro text-sm px-5 py-3.5 shadow-hard">
                RUN 100-EVENT REPLAY
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Live Decision Preview */}
          <div className="lg:col-span-5">
            <div className="panel-window shadow-hard-xl bg-surface">
              <div className="panel-header">
                <span>FOCUSFIREWALL // RUNTIME</span>
                <span className="text-[10px] text-pink font-bold">INTERACTIVE PREVIEW</span>
              </div>

              <div className="p-4 space-y-3 font-mono text-xs">
                {/* Context Selector Toggle */}
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block mb-1">
                    1. TOGGLE ACTIVE USER CONTEXT:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['deep_work', 'meeting', 'idle'] as ContextMode[]).map((ctx) => (
                      <button
                        key={ctx}
                        onClick={() => handleContextClick(ctx)}
                        className={`py-1.5 px-2 border text-[11px] font-bold uppercase transition-all ${
                          selectedContext === ctx
                            ? 'bg-line text-white border-line shadow-hard'
                            : 'bg-paper text-ink border-line hover:bg-surface'
                        }`}
                      >
                        {ctx.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Selector */}
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block mb-1">
                    2. SELECT INCOMING EVENT:
                  </span>
                  <div className="space-y-1">
                    {sampleEvents.map((sample) => (
                      <button
                        key={sample.title}
                        onClick={() => handleEventClick(sample)}
                        className={`w-full text-left p-2 border text-[11px] transition-all flex items-center justify-between ${
                          activeDecision.title === sample.title
                            ? 'border-line bg-paper-2 font-bold shadow-hard'
                            : 'border-line/50 bg-paper hover:bg-surface text-ink-muted'
                        }`}
                      >
                        <span className="truncate pr-2">{sample.title}</span>
                        <span className="uppercase text-[9px] bg-surface px-1 border border-line">
                          {sample.source}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Decision Result Card */}
                <div className="border border-line bg-paper p-3 space-y-2 mt-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-ink-muted uppercase">Jev Gated Action:</span>
                    <span className="font-bold text-ink uppercase">
                      CONFIDENCE {(activeDecision.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div
                    className={`py-2 px-3 border border-line text-center text-sm font-black uppercase tracking-wider ${
                      activeDecision.action === 'interrupt_now'
                        ? 'bg-danger text-white'
                        : activeDecision.action === 'show_soon'
                        ? 'bg-orange text-white'
                        : activeDecision.action === 'batch'
                        ? 'bg-paper-2 text-ink'
                        : 'bg-line text-white'
                    }`}
                  >
                    {activeDecision.action.replace('_', ' ')}
                  </div>

                  {/* Probabilities preview */}
                  <div className="space-y-1 pt-1 text-[10px]">
                    <div className="flex justify-between">
                      <span>NOW: {(activeDecision.probs.interrupt_now * 100).toFixed(0)}%</span>
                      <span>SOON: {(activeDecision.probs.show_soon * 100).toFixed(0)}%</span>
                      <span>BATCH: {(activeDecision.probs.batch * 100).toFixed(0)}%</span>
                      <span>SILENCE: {(activeDecision.probs.silence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface border border-line flex overflow-hidden">
                      <div className="bg-danger h-full" style={{ width: `${activeDecision.probs.interrupt_now * 100}%` }} />
                      <div className="bg-orange h-full" style={{ width: `${activeDecision.probs.show_soon * 100}%` }} />
                      <div className="bg-ink h-full" style={{ width: `${activeDecision.probs.batch * 100}%` }} />
                      <div className="bg-ink-muted h-full" style={{ width: `${activeDecision.probs.silence * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Proof Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">EVALUATION DATASET</span>
            <div className="font-display font-black text-3xl text-ink">400</div>
            <span className="text-[10px] text-ink-muted">Frozen Test Scenarios</span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">INTERRUPTIONS SAVED</span>
            <div className="font-display font-black text-3xl text-pink">84%</div>
            <span className="text-[10px] text-ink-muted">Events Safely Filtered</span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">DECISION LATENCY</span>
            <div className="font-display font-black text-3xl text-orange">38 ms</div>
            <span className="text-[10px] text-ink-muted">Median P50 Response</span>
          </div>

          <div className="panel-window p-4 bg-surface">
            <span className="text-[10px] text-ink-muted uppercase block mb-1">SYSTEM 1 ARCHITECTURE</span>
            <div className="font-display font-black text-3xl text-ink">TYPED</div>
            <span className="text-[10px] text-ink-muted">Choice, Score, Noul</span>
          </div>
        </div>
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
