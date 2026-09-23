import { AttentionEvent, CompactStatePayload, UserContext } from './types';

/**
 * Builds the compact structured evidence payload sent directly to Jev / decision engine.
 * STRICT RULE: No LLM summarization before decisioning. Raw evidence + structured context.
 */
export function buildCompactState(
  event: AttentionEvent,
  context: UserContext
): CompactStatePayload {
  return {
    event: {
      source: event.source,
      sender: event.sender || 'unknown',
      title: event.title.trim(),
      body: event.body ? event.body.slice(0, 300).trim() : '',
    },
    context: {
      mode: context.mode,
      active_app: context.activeApp,
      activity: context.activity,
      meeting: context.meeting,
      deadline_minutes: context.deadlineMinutes,
      attention_budget_remaining: context.attentionBudgetRemaining,
      interruptions_today: context.interruptionsToday,
      recent_interruptions: context.recentInterruptions,
    },
    policy: {
      interrupt_only_when: 'high consequence or immediate time sensitivity',
      silence_only_when: 'high confidence and low consequence',
    },
  };
}
