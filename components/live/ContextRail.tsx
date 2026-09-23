'use client';

import { ContextMode, UserContext } from '@/lib/attention/types';
import { CONTEXT_PRESETS } from '@/lib/attention/context';
import { getBudgetBurnPercentage } from '@/lib/attention/budget';

interface ContextRailProps {
  context: UserContext;
  onContextChange: (newContext: UserContext) => void;
}

export function ContextRail({ context, onContextChange }: ContextRailProps) {
  const modes: { mode: ContextMode; label: string; icon: string }[] = [
    { mode: 'deep_work', label: 'DEEP WORK', icon: '⚡' },
    { mode: 'studying', label: 'STUDYING', icon: '📚' },
    { mode: 'meeting', label: 'MEETING', icon: '🎙️' },
    { mode: 'gaming', label: 'GAMING', icon: '🎮' },
    { mode: 'idle', label: 'IDLE', icon: '☕' },
  ];

  const handleSelectMode = (mode: ContextMode) => {
    const preset = CONTEXT_PRESETS[mode];
    onContextChange({
      ...preset,
      // Preserve current day's cumulative interruptions
      interruptionsToday: context.interruptionsToday,
      attentionBudgetRemaining: context.attentionBudgetRemaining,
    });
  };

  const burnPercent = getBudgetBurnPercentage(context.attentionBudgetRemaining);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
      {/* Context Mode Selection */}
      <div className="panel-window">
        <div className="panel-header">
          <span>1. ACTIVE CONTEXT</span>
          <span className="text-[10px] text-pink font-bold">STATE</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-[11px] text-ink-muted leading-tight">
            Switching context immediately alters routing policy for incoming events.
          </p>
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {modes.map((item) => {
              const isSelected = context.mode === item.mode;
              return (
                <button
                  key={item.mode}
                  onClick={() => handleSelectMode(item.mode)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-mono font-bold border transition-all text-left ${
                    isSelected
                      ? 'bg-pink text-white border-line shadow-hard font-black'
                      : 'bg-surface text-ink border-line hover:bg-paper'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  {isSelected && <span className="text-[10px] uppercase">ACTIVE ●</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Editable Structured State */}
      <div className="panel-window">
        <div className="panel-header">
          <span>ATTENTION STATE</span>
          <span className="text-[10px] text-orange">EVIDENCE</span>
        </div>
        <div className="p-3 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between items-center pb-1.5 border-b border-line/40">
            <span className="text-ink-muted text-[11px]">ACTIVE APP</span>
            <input
              type="text"
              value={context.activeApp}
              onChange={(e) => onContextChange({ ...context, activeApp: e.target.value })}
              className="font-bold text-right bg-paper border border-line px-1.5 py-0.5 max-w-[130px] text-xs"
            />
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-line/40">
            <span className="text-ink-muted text-[11px]">ACTIVITY</span>
            <input
              type="text"
              value={context.activity}
              onChange={(e) => onContextChange({ ...context, activity: e.target.value })}
              className="font-semibold text-right bg-paper border border-line px-1.5 py-0.5 max-w-[130px] text-xs"
            />
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-line/40">
            <span className="text-ink-muted text-[11px]">MEETING ACTIVE</span>
            <button
              onClick={() => onContextChange({ ...context, meeting: !context.meeting })}
              className={`px-2 py-0.5 border border-line text-xs font-bold ${
                context.meeting ? 'bg-danger text-white' : 'bg-surface text-ink'
              }`}
            >
              {context.meeting ? 'YES (MUTED)' : 'NO'}
            </button>
          </div>

          <div className="flex justify-between items-center pb-1.5 border-b border-line/40">
            <span className="text-ink-muted text-[11px]">NEXT DEADLINE</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={context.deadlineMinutes ?? ''}
                placeholder="None"
                onChange={(e) =>
                  onContextChange({
                    ...context,
                    deadlineMinutes: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-14 text-right bg-paper border border-line px-1 py-0.5 text-xs font-bold"
              />
              <span className="text-[10px] text-ink-muted">MIN</span>
            </div>
          </div>

          {/* Attention Budget Gauge */}
          <div className="pt-2">
            <div className="flex justify-between text-[11px] font-bold mb-1">
              <span>ATTENTION BUDGET</span>
              <span className="text-orange">{context.attentionBudgetRemaining} / 100 CREDITS</span>
            </div>
            <div className="w-full h-3 border border-line bg-paper-2 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  context.attentionBudgetRemaining > 40
                    ? 'bg-ink'
                    : context.attentionBudgetRemaining > 15
                    ? 'bg-orange'
                    : 'bg-danger'
                }`}
                style={{ width: `${context.attentionBudgetRemaining}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-muted mt-1">
              <span>Burn: {burnPercent.toFixed(0)}%</span>
              <span>Interrupted: {context.interruptionsToday}x</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
