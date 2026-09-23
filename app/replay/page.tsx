'use client';

import { useEffect, useState } from 'react';
import {
  AttentionAction,
  AttentionEvent,
  BenchmarkScenario,
  ContextMode,
  DecisionResult,
  UserContext,
} from '@/lib/attention/types';
import { CONTEXT_PRESETS } from '@/lib/attention/context';
import { buildCompactState } from '@/lib/attention/state';
import { ATTENTION_QUESTIONS, QUESTION_VERSION } from '@/lib/engine/prompts';
import frozenEventsData from '@/data/events.json';

interface ReplayItem {
  id: string;
  context: ContextMode;
  event: AttentionEvent;
  expected_action: AttentionAction;
  decision?: DecisionResult;
  reason: string;
  pairId?: string;
}

export default function ReplayPage() {
  const [items, setItems] = useState<ReplayItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'inspector' | 'why_different'>('inspector');

  // "Why Different?" context compare state
  const [compareContextA, setCompareContextA] = useState<ContextMode>('deep_work');
  const [compareContextB, setCompareContextB] = useState<ContextMode>('meeting');
  const [decisionA, setDecisionA] = useState<DecisionResult | null>(null);
  const [decisionB, setDecisionB] = useState<DecisionResult | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  useEffect(() => {
    // Load from frozen dataset
    const loaded: ReplayItem[] = (frozenEventsData as unknown as BenchmarkScenario[]).map((d) => ({
      id: d.id,
      context: d.context,
      event: d.event,
      expected_action: d.expected_action,
      reason: d.reason,
      pairId: d.pairId,
    }));
    setItems(loaded);
  }, []);

  const currentItem = items[currentIndex];

  // Resolve or evaluate decision for current item
  useEffect(() => {
    if (!currentItem || currentItem.decision) return;

    const runItemDecision = async () => {
      try {
        const ctx: UserContext = CONTEXT_PRESETS[currentItem.context];
        const res = await fetch('/api/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: currentItem.event,
            context: ctx,
          }),
        });
        if (res.ok) {
          const dec = await res.json();
          setItems((prev) =>
            prev.map((it, idx) => (idx === currentIndex ? { ...it, decision: dec } : it))
          );
        }
      } catch (e) {
        console.error('Replay evaluation error:', e);
      }
    };

    runItemDecision();
  }, [currentIndex, currentItem]);

  // Handle Playback DVR loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = Math.max(300, Math.round(1500 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= items.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, items.length]);

  // Run "Why Different" evaluation for current event under both contexts
  const evaluateComparison = async () => {
    if (!currentItem) return;
    setIsComparing(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch('/api/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: currentItem.event,
            context: CONTEXT_PRESETS[compareContextA],
          }),
        }),
        fetch('/api/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: currentItem.event,
            context: CONTEXT_PRESETS[compareContextB],
          }),
        }),
      ]);

      if (resA.ok && resB.ok) {
        setDecisionA(await resA.json());
        setDecisionB(await resB.json());
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'why_different') {
      evaluateComparison();
    }
  }, [currentIndex, compareContextA, compareContextB, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* DVR Top Header */}
      <div className="panel-window bg-surface">
        <div className="panel-header">
          <span>REPLAY DVR // FROZEN RUN #00017</span>
          <span className="text-[10px] text-pink font-bold">
            {items.length} SCENARIOS LOADED
          </span>
        </div>

        {/* Playback Transport Controls */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn-retro disabled:opacity-40"
              title="Previous Event"
            >
              ◀ PREV
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={isPlaying ? 'btn-retro-orange' : 'btn-retro-pink'}
            >
              {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
            </button>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
              disabled={currentIndex >= items.length - 1}
              className="btn-retro disabled:opacity-40"
              title="Next Event"
            >
              NEXT ▶
            </button>

            {/* Speed buttons */}
            <div className="flex items-center border border-line bg-surface text-xs font-mono ml-2 font-bold">
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-1 ${
                    playbackSpeed === spd ? 'bg-line text-white' : 'text-ink hover:bg-paper'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline position */}
          <div className="font-mono text-xs flex items-center gap-3">
            <span className="text-ink-muted">EVENT INDEX:</span>
            <span className="bg-surface px-2.5 py-1 border border-line font-bold">
              {String(currentIndex + 1).padStart(3, '0')} / {items.length}
            </span>
            <span className="text-pink font-bold">[{currentItem?.id || '—'}]</span>
          </div>
        </div>

        {/* Scrub bar */}
        <div className="px-4 py-2 bg-paper-2 border-b border-line flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, items.length - 1)}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            className="w-full cursor-pointer accent-pink"
          />
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-line bg-paper px-4 font-mono text-xs font-bold">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`py-2 px-4 border-b-2 transition-all ${
              activeTab === 'inspector'
                ? 'border-pink text-pink bg-surface'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            TECHNICAL PAYLOAD INSPECTOR
          </button>
          <button
            onClick={() => setActiveTab('why_different')}
            className={`py-2 px-4 border-b-2 transition-all ${
              activeTab === 'why_different'
                ? 'border-orange text-orange bg-surface'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            ⚡ WHY DIFFERENT? (CONTEXT COMPARISON)
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {currentItem && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Event Summary Card */}
          <div className="lg:col-span-4 panel-window">
            <div className="panel-header">
              <span>EVENT UNDER TEST</span>
              <span className="tag-badge bg-surface text-ink uppercase">
                {currentItem.context}
              </span>
            </div>

            <div className="p-4 space-y-4 font-mono text-xs">
              <div>
                <span className="text-[10px] text-ink-muted uppercase block">Source & Sender</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-bold text-ink uppercase">{currentItem.event.source}</span>
                  {currentItem.event.sender && (
                    <span className="text-ink-muted">@{currentItem.event.sender}</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-ink-muted uppercase block">Title</span>
                <p className="font-bold text-ink mt-0.5 text-sm">{currentItem.event.title}</p>
              </div>

              {currentItem.event.body && (
                <div>
                  <span className="text-[10px] text-ink-muted uppercase block">Body Content</span>
                  <p className="text-ink-muted mt-0.5 bg-paper p-2 border border-line/40">
                    {currentItem.event.body}
                  </p>
                </div>
              )}

              <div className="border-t border-line/40 pt-3">
                <span className="text-[10px] text-ink-muted uppercase block">Expected Ground Truth</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="tag-badge bg-paper-2 text-ink uppercase font-bold">
                    {currentItem.expected_action.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-ink-muted">Ref benchmark label</span>
                </div>
                <p className="text-[11px] text-ink-muted mt-1 italic">{currentItem.reason}</p>
              </div>
            </div>
          </div>

          {/* Right: Technical Inspector OR Why Different Mode */}
          <div className="lg:col-span-8 panel-window">
            {activeTab === 'inspector' ? (
              <div>
                <div className="panel-header">
                  <span>STATE PAYLOAD & JEV DECISION</span>
                  <span className="text-orange text-[10px]">{QUESTION_VERSION}</span>
                </div>

                <div className="p-4 space-y-4 font-mono text-xs">
                  {/* Results preview banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper p-3 border border-line">
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase">Action</span>
                      <strong className="text-sm font-bold text-ink uppercase">
                        {currentItem.decision?.action.replace('_', ' ') ?? 'Evaluating...'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase">Confidence</span>
                      <strong className="text-sm font-bold text-pink">
                        {currentItem.decision
                          ? `${(currentItem.decision.confidence * 100).toFixed(0)}%`
                          : '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase">Latency</span>
                      <strong className="text-sm font-bold text-orange">
                        {currentItem.decision?.latencyMs !== undefined
                          ? `${currentItem.decision.latencyMs} ms`
                          : '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink-muted block uppercase">Engine</span>
                      <strong className="text-sm font-bold text-ink uppercase">
                        {currentItem.decision?.engine ?? '—'}
                      </strong>
                    </div>
                  </div>

                  {/* Compact state JSON */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-ink-muted uppercase font-bold">
                        COMPACT STRUCTURED STATE (EVIDENCE SENT TO JEV)
                      </span>
                      <span className="text-[10px] text-ink-muted">NO PRE-LLM SUMMARY</span>
                    </div>
                    <pre className="bg-paper-2 border border-line p-3 overflow-x-auto text-[11px] text-ink leading-relaxed">
                      {JSON.stringify(
                        buildCompactState(currentItem.event, CONTEXT_PRESETS[currentItem.context]),
                        null,
                        2
                      )}
                    </pre>
                  </div>

                  {/* Questions and answers */}
                  <div>
                    <span className="text-[10px] text-ink-muted uppercase block mb-1 font-bold">
                      JEV TYPED QUESTIONS & EVALUATION
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 border border-line bg-paper">
                        <strong className="text-ink block">Q1: Choice (Action)</strong>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {ATTENTION_QUESTIONS.action.question}
                        </p>
                        <div className="mt-2 text-xs font-bold text-pink">
                          Result: {currentItem.decision?.rawAction?.toUpperCase() ?? '—'}
                        </div>
                      </div>

                      <div className="p-2 border border-line bg-paper">
                        <strong className="text-ink block">Q2: Score (Urgency 0-4)</strong>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {ATTENTION_QUESTIONS.urgency.question}
                        </p>
                        <div className="mt-2 text-xs font-bold text-orange">
                          Urgency: {currentItem.decision?.urgencyScore ?? 1} / 4
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Why Different Comparison Mode */
              <div>
                <div className="panel-header">
                  <span>WHY DIFFERENT? — SAME EVENT × DIVERGENT CONTEXTS</span>
                  <span className="text-pink text-[10px]">CORE THESIS DEMO</span>
                </div>

                <div className="p-4 space-y-4 font-mono text-xs">
                  <p className="text-ink-muted text-xs">
                    Demonstrates how the identical notification yields contrasting attention decisions based entirely on the user&apos;s active state.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Context A */}
                    <div className="border border-line bg-paper p-3 space-y-3">
                      <div className="flex justify-between items-center border-b border-line pb-2">
                        <span className="font-bold text-ink">CONTEXT A</span>
                        <select
                          value={compareContextA}
                          onChange={(e) => setCompareContextA(e.target.value as ContextMode)}
                          className="bg-surface border border-line px-2 py-0.5 text-xs font-bold uppercase"
                        >
                          <option value="deep_work">Deep Work</option>
                          <option value="studying">Studying</option>
                          <option value="meeting">Meeting</option>
                          <option value="gaming">Gaming</option>
                          <option value="idle">Idle</option>
                        </select>
                      </div>

                      <div className="text-[11px] space-y-1 text-ink-muted">
                        <div>App: <strong className="text-ink">{CONTEXT_PRESETS[compareContextA].activeApp}</strong></div>
                        <div>Meeting: <strong className="text-ink">{CONTEXT_PRESETS[compareContextA].meeting ? 'YES' : 'NO'}</strong></div>
                        <div>Remaining Budget: <strong className="text-ink">{CONTEXT_PRESETS[compareContextA].attentionBudgetRemaining}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-line">
                        <span className="text-[10px] text-ink-muted uppercase block mb-1">Resulting Decision</span>
                        <div className="p-2 border border-line bg-surface text-center font-bold text-sm uppercase">
                          {isComparing ? 'Evaluating...' : decisionA?.action.replace('_', ' ') ?? '—'}
                        </div>
                        {decisionA && (
                          <div className="text-[10px] text-ink-muted mt-1 text-center">
                            Confidence: {(decisionA.confidence * 100).toFixed(0)}% | Latency: {decisionA.latencyMs}ms
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Context B */}
                    <div className="border border-line bg-paper p-3 space-y-3">
                      <div className="flex justify-between items-center border-b border-line pb-2">
                        <span className="font-bold text-ink">CONTEXT B</span>
                        <select
                          value={compareContextB}
                          onChange={(e) => setCompareContextB(e.target.value as ContextMode)}
                          className="bg-surface border border-line px-2 py-0.5 text-xs font-bold uppercase"
                        >
                          <option value="meeting">Meeting</option>
                          <option value="deep_work">Deep Work</option>
                          <option value="studying">Studying</option>
                          <option value="gaming">Gaming</option>
                          <option value="idle">Idle</option>
                        </select>
                      </div>

                      <div className="text-[11px] space-y-1 text-ink-muted">
                        <div>App: <strong className="text-ink">{CONTEXT_PRESETS[compareContextB].activeApp}</strong></div>
                        <div>Meeting: <strong className="text-ink">{CONTEXT_PRESETS[compareContextB].meeting ? 'YES' : 'NO'}</strong></div>
                        <div>Remaining Budget: <strong className="text-ink">{CONTEXT_PRESETS[compareContextB].attentionBudgetRemaining}</strong></div>
                      </div>

                      <div className="pt-2 border-t border-line">
                        <span className="text-[10px] text-ink-muted uppercase block mb-1">Resulting Decision</span>
                        <div className="p-2 border border-line bg-surface text-center font-bold text-sm uppercase">
                          {isComparing ? 'Evaluating...' : decisionB?.action.replace('_', ' ') ?? '—'}
                        </div>
                        {decisionB && (
                          <div className="text-[10px] text-ink-muted mt-1 text-center">
                            Confidence: {(decisionB.confidence * 100).toFixed(0)}% | Latency: {decisionB.latencyMs}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {decisionA && decisionB && (
                    <div className="p-3 bg-paper-2 border border-line text-center">
                      <span className="font-bold text-xs">
                        {decisionA.action === decisionB.action
                          ? 'DECISION CONVERGED: Event has identical urgency across both contexts.'
                          : '⚡ CONTEXT DIFFERENCE DETECTED: Policy successfully protected user attention based on active activity.'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
