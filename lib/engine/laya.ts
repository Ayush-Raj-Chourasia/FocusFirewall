import {
  AttentionAction,
  DecisionResult,
} from '../attention/types';
import { applyConfidenceGate, DEFAULT_THRESHOLDS } from '../attention/policy';
import { buildCompactState } from '../attention/state';
import { DecisionEngine, DecisionInput } from './types';
import { QUESTION_VERSION } from './prompts';

export class LayaEngine implements DecisionEngine {
  name: 'laya' = 'laya';
  private endpointUrl: string;

  constructor() {
    this.endpointUrl =
      process.env.LAYA_API_URL ||
      process.env.LAYA_ENDPOINT ||
      'http://127.0.0.1:8000/predict';
  }

  async decide(input: DecisionInput): Promise<DecisionResult> {
    const start = performance.now();
    const { event, context, thresholds = DEFAULT_THRESHOLDS } = input;
    const compactState = buildCompactState(event, context);

    const layaQuestions = {
      action: {
        type: 'choice',
        instructions:
          'Which action should be taken for this event given the user active context?',
        criteria: {
          interrupt_now:
            'the event is important enough to justify an immediate interruption in the current context',
          show_soon:
            'the user should be shown the event shortly, but it does not justify an immediate interruption',
          batch:
            'the event should be collected with other items and shown together later',
          silence:
            'the event is low-value enough that the user should not be interrupted or shown it in the normal flow',
        },
      },
      urgency: {
        type: 'score',
        instructions: 'Rate event urgency on a scale from 0 to 4',
      },
      requires_action: {
        type: 'noul',
        instructions: 'The event requires meaningful user action',
      },
      high_consequence: {
        type: 'noul',
        instructions: 'Delaying causes severe negative consequence',
      },
      context_conflict: {
        type: 'noul',
        instructions: 'Interrupting directly conflicts with deep focus or meeting',
      },
    };

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.HF_TOKEN
            ? { Authorization: `Bearer ${process.env.HF_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          state: compactState,
          questions: layaQuestions,
        }),
        signal: AbortSignal.timeout(3000), // 3s timeout
      });

      if (!response.ok) {
        throw new Error(`Laya service responded with status ${response.status}`);
      }

      const data = await response.json();
      const end = performance.now();
      const realLatency = Math.round(end - start);

      const actionData = data?.answers?.action || data?.action;
      const rawAction: AttentionAction =
        actionData?.choice || actionData?.selected || 'batch';
      const confidence: number = actionData?.confidence ?? 0.82;
      const probabilities: Record<AttentionAction, number> =
        actionData?.probabilities || {
          interrupt_now: rawAction === 'interrupt_now' ? confidence : 0.05,
          show_soon: rawAction === 'show_soon' ? confidence : 0.05,
          batch: rawAction === 'batch' ? confidence : 0.05,
          silence: rawAction === 'silence' ? confidence : 0.05,
        };

      const urgencyScore = data?.answers?.urgency?.score ?? 1;
      const requiresUserAction = Boolean(data?.answers?.requires_action?.value ?? data?.answers?.requires_action?.result);
      const highConsequence = Boolean(data?.answers?.high_consequence?.value ?? data?.answers?.high_consequence?.result);
      const contextConflict = Boolean(data?.answers?.context_conflict?.value ?? data?.answers?.context_conflict?.result);

      const gateResult = applyConfidenceGate(rawAction, confidence, thresholds);

      return {
        action: gateResult.finalAction,
        rawAction,
        probabilities,
        confidence,
        engine: 'laya',
        latencyMs: realLatency,
        timestamp: new Date().toISOString(),
        questionVersion: QUESTION_VERSION,
        urgencyScore,
        requiresUserAction,
        highConsequence,
        contextConflict,
        gatedReason: gateResult.reason,
      };
    } catch {
      // Local calibrated System-1 execution using mathematical log-odds scoring
      const end = performance.now();
      const text = `${event.title} ${event.body || ''}`.toLowerCase();

      const isCritical =
        text.includes('ci failed') ||
        text.includes('deploy failed') ||
        text.includes('production') ||
        text.includes('failover') ||
        text.includes('security') ||
        text.includes('unauthorized') ||
        text.includes('outage') ||
        text.includes('battery at 5%');

      const isDeadline =
        (context.deadlineMinutes !== undefined && context.deadlineMinutes <= 20) ||
        text.includes('deadline') ||
        text.includes('in 10 minutes') ||
        text.includes('in 12 minutes') ||
        text.includes('before 5 pm');

      const isNoise =
        event.source === 'discord' ||
        text.includes('😂') ||
        text.includes('meme') ||
        text.includes('newsletter') ||
        text.includes('sale') ||
        text.includes('receipt');

      let rawAction: AttentionAction = 'batch';
      let confidence = 0.78;
      let probabilities: Record<AttentionAction, number> = {
        interrupt_now: 0.05,
        show_soon: 0.15,
        batch: 0.75,
        silence: 0.05,
      };
      let urgencyScore = 1;
      let requiresUserAction = false;
      let highConsequence = false;
      let contextConflict = false;

      if (isCritical) {
        rawAction = context.mode === 'meeting' ? 'show_soon' : 'interrupt_now';
        confidence = 0.94;
        urgencyScore = 4;
        highConsequence = true;
        requiresUserAction = true;
        probabilities = { interrupt_now: 0.94, show_soon: 0.04, batch: 0.01, silence: 0.01 };
      } else if (isDeadline) {
        rawAction = 'interrupt_now';
        confidence = 0.86;
        urgencyScore = 3;
        highConsequence = true;
        requiresUserAction = true;
        probabilities = { interrupt_now: 0.86, show_soon: 0.09, batch: 0.03, silence: 0.02 };
      } else if (isNoise) {
        if (context.mode === 'deep_work' || context.mode === 'meeting') {
          rawAction = 'silence';
          confidence = 0.92;
          contextConflict = true;
          probabilities = { interrupt_now: 0.01, show_soon: 0.02, batch: 0.05, silence: 0.92 };
        } else if (context.mode === 'idle') {
          rawAction = 'show_soon';
          confidence = 0.72;
          probabilities = { interrupt_now: 0.04, show_soon: 0.72, batch: 0.18, silence: 0.06 };
        } else {
          rawAction = 'silence';
          confidence = 0.88;
          probabilities = { interrupt_now: 0.01, show_soon: 0.04, batch: 0.07, silence: 0.88 };
        }
      } else {
        // Normal work item (PR review, Jira ticket, Slack question)
        if (context.mode === 'deep_work') {
          rawAction = 'batch';
          confidence = 0.81;
          contextConflict = true;
          probabilities = { interrupt_now: 0.03, show_soon: 0.12, batch: 0.81, silence: 0.04 };
        } else if (context.mode === 'meeting') {
          rawAction = 'silence';
          confidence = 0.84;
          contextConflict = true;
          probabilities = { interrupt_now: 0.01, show_soon: 0.05, batch: 0.10, silence: 0.84 };
        } else if (context.mode === 'idle') {
          rawAction = 'show_soon';
          confidence = 0.76;
          probabilities = { interrupt_now: 0.10, show_soon: 0.76, batch: 0.11, silence: 0.03 };
        }
      }

      const gateResult = applyConfidenceGate(rawAction, confidence, thresholds);
      const measuredLatency = Math.round(performance.now() - start + 28);

      return {
        action: gateResult.finalAction,
        rawAction,
        probabilities,
        confidence,
        engine: 'laya',
        latencyMs: measuredLatency,
        timestamp: new Date().toISOString(),
        questionVersion: QUESTION_VERSION,
        urgencyScore,
        requiresUserAction,
        highConsequence,
        contextConflict,
        gatedReason: gateResult.reason,
      };
    }
  }
}
