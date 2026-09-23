'use client';

import { useState } from 'react';
import { AttentionAction, AttentionEvent, DecisionResult, UserContext } from '@/lib/attention/types';
import { appendFeedbackItem } from '@/lib/storage/local';

interface DecisionInspectorProps {
  event: AttentionEvent | null;
  decision: DecisionResult | null;
  context: UserContext;
  onOverrideAction?: (action: AttentionAction) => void;
}

export function DecisionInspector({
  event,
  decision,
  context,
  onOverrideAction,
}: DecisionInspectorProps) {
  const [feedbackSent, setFeedbackSent] = useState<'correct' | 'wrong' | null>(null);
  const [showOverrideMenu, setShowOverrideMenu] = useState(false);

  if (!event || !decision) {
    return (
      <aside className="w-full lg:w-80 flex-shrink-0 panel-window">
        <div className="panel-header">
          <span>3. DECISION INSPECTOR</span>
          <span className="text-[10px] text-ink-muted">INSPECT</span>
        </div>
        <div className="p-8 text-center text-ink-muted font-mono text-xs space-y-2">
          <div className="text-2xl">🔍</div>
          <p className="font-semibold">No event selected</p>
          <p className="text-[11px]">
            Click any event in the live stream to inspect Jev&apos;s typed decision, probabilities, and safety gating.
          </p>
        </div>
      </aside>
    );
  }

  const handleFeedback = (type: 'correct' | 'wrong') => {
    setFeedbackSent(type);
    appendFeedbackItem({
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: event.id,
      eventTitle: event.title,
      contextMode: context.mode,
      originalAction: decision.action,
      feedback: type,
    });
  };

  const handleOverride = (newAction: AttentionAction) => {
    appendFeedbackItem({
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventId: event.id,
      eventTitle: event.title,
      contextMode: context.mode,
      originalAction: decision.action,
      feedback: 'wrong',
      overrideAction: newAction,
    });
    setShowOverrideMenu(false);
    onOverrideAction?.(newAction);
  };

  const actions: { key: AttentionAction; label: string; bg: string }[] = [
    { key: 'interrupt_now', label: 'NOW', bg: 'bg-danger' },
    { key: 'show_soon', label: 'SOON', bg: 'bg-orange' },
    { key: 'batch', label: 'BATCH', bg: 'bg-ink' },
    { key: 'silence', label: 'SILENCE', bg: 'bg-ink-muted' },
  ];

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 panel-window font-mono text-xs">
      <div className="panel-header">
        <span>3. DECISION INSPECTOR</span>
        <span className="text-[10px] text-pink font-bold">JEV // EVAL</span>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Routed Action Title Block */}
        <div>
          <span className="text-[10px] text-ink-muted uppercase tracking-wider block mb-1">
            GATED ATTENTION ACTION
          </span>
          <div
            className={`px-3 py-2 border border-line text-sm font-black uppercase tracking-wider text-center shadow-hard ${
              decision.action === 'interrupt_now'
                ? 'bg-danger text-white'
                : decision.action === 'show_soon'
                ? 'bg-orange text-white'
                : decision.action === 'batch'
                ? 'bg-paper-2 text-ink'
                : 'bg-line text-white'
            }`}
          >
            {decision.action.replace('_', ' ')}
          </div>
          {decision.gatedReason && (
            <div className="mt-1.5 p-1.5 bg-paper-2 border border-line text-[10px] text-ink-muted leading-tight">
              ⚠️ <strong className="text-ink">SAFETY GATE:</strong> {decision.gatedReason}
            </div>
          )}
        </div>

        {/* Confidence Gauge */}
        <div className="border-t border-line/40 pt-3">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-ink-muted uppercase">Confidence</span>
            <span className="font-bold text-sm">{(decision.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-2.5 border border-line bg-paper-2">
            <div
              className="h-full bg-pink transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, decision.confidence * 100))}%` }}
            />
          </div>
        </div>

        {/* Probabilities Distribution */}
        <div className="border-t border-line/40 pt-3 space-y-1.5">
          <span className="text-[10px] text-ink-muted uppercase tracking-wider block">
            JEV PROBABILITIES
          </span>
          {actions.map((act) => {
            const prob = decision.probabilities[act.key] ?? 0;
            const isHighest = decision.rawAction === act.key;
            return (
              <div key={act.key} className="space-y-0.5">
                <div className="flex justify-between text-[11px]">
                  <span className={isHighest ? 'font-bold text-ink' : 'text-ink-muted'}>
                    {act.label}
                  </span>
                  <span className="font-mono text-xs">{(prob * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-paper-2 border border-line/30">
                  <div
                    className={`h-full ${act.bg} transition-all duration-300`}
                    style={{ width: `${Math.min(100, Math.max(0, prob * 100))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Structured Decision Trace: WHY [ACTION]? */}
        <div className="border border-line bg-paper p-2.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-ink border-b border-line/40 pb-1">
            <span className="text-pink">WHY {decision.action.replace('_', ' ').toUpperCase()}?</span>
            <span className="text-ink-muted">STRUCTURED TRACE</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1 text-[11px]">
            <span className="text-ink-muted">Urgency Score:</span>
            <span className="font-bold text-right text-ink">
              {decision.urgencyScore !== undefined ? `${decision.urgencyScore} / 4` : '—'}
            </span>

            <span className="text-ink-muted">Action Required:</span>
            <span className="font-bold text-right text-ink">
              {decision.requiresUserAction ? 'YES' : 'NO'}
            </span>

            <span className="text-ink-muted">High Consequence:</span>
            <span className="font-bold text-right text-ink">
              {decision.highConsequence ? 'YES' : 'NO'}
            </span>

            <span className="text-ink-muted">Context Conflict:</span>
            <span className="font-bold text-right text-ink">
              {decision.contextConflict ? 'YES' : 'NO'}
            </span>

            <span className="text-ink-muted">Safety Gate:</span>
            <span className="font-bold text-right text-pink">
              {decision.gatedReason ? 'OVERRIDDEN' : 'PASSED'}
            </span>
          </div>
        </div>

        {/* Engine & Latency telemetry */}
        <div className="border-t border-line/40 pt-3 space-y-1.5 text-[11px] bg-paper-2 p-2 border border-line">
          <div className="flex justify-between items-center">
            <span className="text-ink-muted">Requested Engine:</span>
            <span className="font-bold text-ink uppercase">
              {decision.requestedEngine ? decision.requestedEngine.toUpperCase() : 'MOCK'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-ink-muted">Executed Engine:</span>
            <span className="font-bold text-pink uppercase flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${
                  decision.engine === 'rules' ? 'bg-orange' : 'bg-brandgreen animate-pulse'
                }`}
              />
              {decision.engine.toUpperCase()}{' '}
              {decision.engine === 'rules' ? '(FALLBACK)' : ''}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Latency:</span>
            <span className="font-bold text-orange">
              {decision.latencyMs !== undefined ? `${decision.latencyMs} ms` : '—'}{' '}
              <span className="text-[9px] text-ink-muted font-normal">(measured)</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Context Mode:</span>
            <span className="font-bold uppercase text-ink">
              {context.mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Human Feedback Loop */}
        <div className="border-t border-line/40 pt-3 space-y-2">
          <div className="text-[10px] text-ink-muted uppercase">HUMAN OVERRIDE LOOP</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => handleFeedback('correct')}
              className={`py-1.5 px-2 border border-line text-xs font-bold transition-all ${
                feedbackSent === 'correct'
                  ? 'bg-brandgreen text-white'
                  : 'bg-surface hover:bg-paper text-ink'
              }`}
            >
              ✓ CORRECT
            </button>
            <button
              onClick={() => handleFeedback('wrong')}
              className={`py-1.5 px-2 border border-line text-xs font-bold transition-all ${
                feedbackSent === 'wrong'
                  ? 'bg-danger text-white'
                  : 'bg-surface hover:bg-paper text-ink'
              }`}
            >
              ✕ WRONG
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowOverrideMenu(!showOverrideMenu)}
              className="w-full py-1 text-[11px] border border-line bg-surface hover:bg-paper text-ink font-semibold"
            >
              ⚡ OVERRIDE ACTION...
            </button>

            {showOverrideMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-1 border border-line bg-surface shadow-hard p-1 space-y-1 z-20">
                {(['interrupt_now', 'show_soon', 'batch', 'silence'] as AttentionAction[]).map(
                  (actionOption) => (
                    <button
                      key={actionOption}
                      onClick={() => handleOverride(actionOption)}
                      className="w-full text-left px-2 py-1 text-[11px] hover:bg-paper border border-transparent hover:border-line font-bold uppercase"
                    >
                      {actionOption.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
