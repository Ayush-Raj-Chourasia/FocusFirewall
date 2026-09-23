'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AttentionAction,
  AttentionEvent,
  DecisionResult,
  UserContext,
} from '@/lib/attention/types';
import { CONTEXT_PRESETS } from '@/lib/attention/context';
import { calculateNewBudget } from '@/lib/attention/budget';
import {
  appendProcessedEvent,
  loadEnginePreference,
  loadProcessedEvents,
  loadStoredContext,
  loadStoredThresholds,
  saveStoredContext,
} from '@/lib/storage/local';
import demoStream from '@/data/demo-stream.json';
import { ContextRail } from '@/components/live/ContextRail';
import { EventStream, StreamItem } from '@/components/live/EventStream';
import { DecisionInspector } from '@/components/live/DecisionInspector';
import { EventPlayground } from '@/components/live/EventPlayground';

export default function LiveConsolePage() {
  const [context, setContext] = useState<UserContext>(CONTEXT_PRESETS.deep_work);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<StreamItem | null>(null);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [demoIndex, setDemoIndex] = useState<number>(0);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from storage on client
  useEffect(() => {
    const savedCtx = loadStoredContext();
    setContext(savedCtx);

    const history = loadProcessedEvents();
    if (history.length > 0) {
      const items: StreamItem[] = history.map((h) => ({
        event: h.event,
        decision: h.decision,
        status: 'routed',
      }));
      setStreamItems(items);
      setSelectedItem(items[0]);
    }
  }, []);

  const handleContextChange = (newContext: UserContext) => {
    setContext(newContext);
    saveStoredContext(newContext);
  };

  // Route an event through the attention firewall API
  const routeEvent = async (event: AttentionEvent, activeCtx: UserContext = context): Promise<DecisionResult> => {
    const enginePref = loadEnginePreference();
    const thresholds = loadStoredThresholds();

    const response = await fetch('/api/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        context: activeCtx,
        preferredEngine: enginePref,
        thresholds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Decision API returned status ${response.status}`);
    }

    const decision: DecisionResult = await response.json();
    return decision;
  };

  // Process a single event and update state + attention budget
  const processEventItem = async (rawEvent: AttentionEvent) => {
    const pendingItem: StreamItem = {
      event: rawEvent,
      status: 'processing',
    };

    setStreamItems((prev) => [pendingItem, ...prev]);

    try {
      const decision = await routeEvent(rawEvent, context);

      const completedItem: StreamItem = {
        event: rawEvent,
        decision,
        status: 'routed',
      };

      setStreamItems((prev) =>
        prev.map((item) => (item.event.id === rawEvent.id ? completedItem : item))
      );
      setSelectedItem(completedItem);

      // Save to client history
      appendProcessedEvent({
        event: rawEvent,
        context,
        decision,
        timestamp: new Date().toISOString(),
      });

      // Update Attention Budget
      const updatedBudget = calculateNewBudget(context.attentionBudgetRemaining, decision.action);
      const isInterrupted = decision.action === 'interrupt_now';

      const nextContext: UserContext = {
        ...context,
        attentionBudgetRemaining: updatedBudget,
        interruptionsToday: isInterrupted
          ? context.interruptionsToday + 1
          : context.interruptionsToday,
        recentInterruptions: isInterrupted
          ? context.recentInterruptions + 1
          : context.recentInterruptions,
      };

      handleContextChange(nextContext);
    } catch (err) {
      console.error('Failed to route event:', err);
    }
  };

  // Run demo playback loop
  useEffect(() => {
    if (!isRunningDemo) {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      return;
    }

    const delay = Math.max(250, Math.round(1400 / playbackSpeed));

    demoIntervalRef.current = setInterval(() => {
      if (demoIndex >= demoStream.length) {
        setIsRunningDemo(false);
        setDemoIndex(0);
        return;
      }

      const nextEvt = demoStream[demoIndex] as unknown as AttentionEvent;
      setDemoIndex((prev) => prev + 1);
      processEventItem(nextEvt);
    }, delay);

    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [isRunningDemo, demoIndex, playbackSpeed, context]);

  const handleStartDemo = () => {
    if (demoIndex >= demoStream.length) {
      setDemoIndex(0);
    }
    setIsRunningDemo(true);
  };

  const handlePauseDemo = () => {
    setIsRunningDemo(false);
  };

  const handleStepNext = () => {
    const idx = demoIndex % demoStream.length;
    const nextEvt = demoStream[idx] as unknown as AttentionEvent;
    setDemoIndex(idx + 1);
    processEventItem(nextEvt);
  };

  const handleClearStream = () => {
    setIsRunningDemo(false);
    setStreamItems([]);
    setSelectedItem(null);
  };

  const handleOverrideAction = (newAction: AttentionAction) => {
    if (!selectedItem || !selectedItem.decision) return;
    const updatedDecision: DecisionResult = {
      ...selectedItem.decision,
      action: newAction,
      gatedReason: `Human manual override to: ${newAction.toUpperCase()}`,
    };
    const updatedItem: StreamItem = {
      ...selectedItem,
      decision: updatedDecision,
    };
    setSelectedItem(updatedItem);
    setStreamItems((prev) =>
      prev.map((i) => (i.event.id === selectedItem.event.id ? updatedItem : i))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-paper-2 border border-line">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-orange inline-block" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
            OPERATOR CONSOLE // ATTENTION FIREWALL RUNTIME
          </span>
        </div>
        <div className="font-mono text-[11px] text-ink-muted">
          Events evaluate under active context. Same event under different context produces different actions.
        </div>
      </div>

      {/* 3-Column Operator Layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left: Context Rail */}
        <ContextRail context={context} onContextChange={handleContextChange} />

        {/* Center: Live Stream */}
        <EventStream
          items={streamItems}
          selectedId={selectedItem?.event.id ?? null}
          onSelectItem={(item) => setSelectedItem(item)}
          isRunningDemo={isRunningDemo}
          onStartDemo={handleStartDemo}
          onPauseDemo={handlePauseDemo}
          onStepNext={handleStepNext}
          onClearStream={handleClearStream}
          playbackSpeed={playbackSpeed}
          onSpeedChange={setPlaybackSpeed}
          onOpenPlayground={() => setIsPlaygroundOpen(true)}
        />

        {/* Right: Decision Inspector */}
        <DecisionInspector
          event={selectedItem?.event ?? null}
          decision={selectedItem?.decision ?? null}
          context={context}
          onOverrideAction={handleOverrideAction}
        />
      </div>

      {/* Event Playground Drawer */}
      <EventPlayground
        isOpen={isPlaygroundOpen}
        onClose={() => setIsPlaygroundOpen(false)}
        onSubmitEvent={(customEvt) => processEventItem(customEvt)}
      />
    </div>
  );
}
