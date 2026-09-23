'use client';

import { AttentionAction, AttentionEvent, DecisionResult } from '@/lib/attention/types';

export interface StreamItem {
  event: AttentionEvent;
  decision?: DecisionResult;
  status: 'pending' | 'processing' | 'routed';
}

interface EventStreamProps {
  items: StreamItem[];
  selectedId: string | null;
  onSelectItem: (item: StreamItem) => void;
  isRunningDemo: boolean;
  onStartDemo: () => void;
  onPauseDemo: () => void;
  onStepNext: () => void;
  onClearStream: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onOpenPlayground: () => void;
}

export function EventStream({
  items,
  selectedId,
  onSelectItem,
  isRunningDemo,
  onStartDemo,
  onPauseDemo,
  onStepNext,
  onClearStream,
  playbackSpeed,
  onSpeedChange,
  onOpenPlayground,
}: EventStreamProps) {
  const getActionBadge = (action?: AttentionAction) => {
    switch (action) {
      case 'interrupt_now':
        return <span className="tag-badge bg-danger text-white">INTERRUPT NOW</span>;
      case 'show_soon':
        return <span className="tag-badge bg-orange text-white">SHOW SOON</span>;
      case 'batch':
        return <span className="tag-badge bg-paper-2 text-ink">BATCH</span>;
      case 'silence':
        return <span className="tag-badge bg-line text-white">SILENCE</span>;
      default:
        return <span className="tag-badge bg-surface text-ink-muted">QUEUED</span>;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return '🐙';
      case 'slack':
        return '💬';
      case 'email':
        return '✉️';
      case 'calendar':
        return '📅';
      case 'discord':
        return '🎮';
      case 'system':
        return '⚙️';
      case 'agent':
        return '🤖';
      default:
        return '⚡';
    }
  };

  return (
    <section className="flex-1 min-w-0 flex flex-col panel-window">
      {/* Control bar */}
      <div className="panel-header flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span>2. EVENT STREAM</span>
          <span className="text-[10px] bg-pink px-1.5 py-0.2 text-white font-bold">
            {items.length} EVENTS
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isRunningDemo ? (
            <button
              onClick={onPauseDemo}
              className="bg-orange text-white text-[11px] px-2.5 py-1 font-bold border border-line"
            >
              ❚❚ PAUSE
            </button>
          ) : (
            <button
              onClick={onStartDemo}
              className="bg-pink text-white text-[11px] px-2.5 py-1 font-bold border border-line hover:bg-pink-hover shadow-hard active:translate-x-0.5 active:translate-y-0.5"
            >
              ▶ RUN 20-EVENT DEMO
            </button>
          )}

          <button
            onClick={onStepNext}
            disabled={isRunningDemo}
            className="bg-surface text-ink text-[11px] px-2 py-1 font-bold border border-line hover:bg-paper disabled:opacity-50"
            title="Step next single event"
          >
            ⏭ STEP
          </button>

          {/* Speed Selector */}
          <div className="flex items-center border border-line bg-surface text-[10px] font-bold">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeedChange(spd)}
                className={`px-1.5 py-0.5 ${
                  playbackSpeed === spd ? 'bg-line text-white' : 'hover:bg-paper text-ink'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={onOpenPlayground}
            className="bg-surface text-ink text-[11px] px-2 py-1 font-bold border border-line hover:bg-paper"
          >
            + CUSTOM
          </button>

          <button
            onClick={onClearStream}
            className="bg-surface text-ink-muted text-[11px] px-2 py-1 border border-line hover:text-danger"
            title="Clear stream"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* Events list */}
      <div className="p-3 overflow-y-auto max-h-[640px] space-y-2 flex-1">
        {items.length === 0 ? (
          <div className="py-20 text-center text-ink-muted font-mono space-y-3">
            <div className="text-3xl">📡</div>
            <p className="text-sm font-semibold">Router is idle. Ready for incoming events.</p>
            <p className="text-xs max-w-sm mx-auto">
              Click <strong className="text-ink">RUN 20-EVENT DEMO</strong> to replay realistic digital events through the attention firewall.
            </p>
            <button
              onClick={onStartDemo}
              className="btn-retro-pink mt-2"
            >
              START DEMO STREAM
            </button>
          </div>
        ) : (
          items.map((item) => {
            const isSelected = selectedId === item.event.id;
            const isProcessing = item.status === 'processing';

            return (
              <div
                key={item.event.id}
                onClick={() => onSelectItem(item)}
                className={`p-3 border transition-all cursor-pointer relative font-mono ${
                  isSelected
                    ? 'border-line bg-surface shadow-hard ring-2 ring-orange'
                    : 'border-line/70 bg-surface/90 hover:bg-surface hover:border-line'
                }`}
              >
                {/* Scanning indicator when processing */}
                {isProcessing && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-orange animate-pulse" />
                )}

                <div className="flex items-center justify-between gap-2 text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getSourceIcon(item.event.source)}</span>
                    <span className="font-bold uppercase text-[11px] tracking-wide text-ink">
                      {item.event.source}
                    </span>
                    {item.event.sender && (
                      <span className="text-ink-muted text-[11px]">
                        @{item.event.sender}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-ink-muted">
                      {item.event.timestamp.includes('T')
                        ? item.event.timestamp.split('T')[1].slice(0, 8)
                        : item.event.timestamp}
                    </span>
                    {isProcessing ? (
                      <span className="tag-badge bg-orange text-white animate-pulse">
                        ROUTING...
                      </span>
                    ) : (
                      getActionBadge(item.decision?.action)
                    )}
                  </div>
                </div>

                <div className="text-xs font-semibold text-ink leading-snug line-clamp-1">
                  {item.event.title}
                </div>

                {item.event.body && (
                  <div className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 font-normal">
                    {item.event.body}
                  </div>
                )}

                {item.decision && (
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-line/30 text-[10px] text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      <span>Conf:</span>
                      <strong className="text-ink font-mono">
                        {(item.decision.confidence * 100).toFixed(0)}%
                      </strong>
                    </span>
                    <span className="flex items-center gap-2">
                      <span>Engine: <strong className="text-ink uppercase">{item.decision.engine}</strong></span>
                      <span>Latency: <strong className="text-ink">{item.decision.latencyMs ?? '—'}ms</strong></span>
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
