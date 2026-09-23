import {
  AttentionAction,
  DecisionResult,
} from '../attention/types';
import { applyConfidenceGate, DEFAULT_THRESHOLDS } from '../attention/policy';
import { DecisionEngine, DecisionInput } from './types';
import { QUESTION_VERSION } from './prompts';

export class MockEngine implements DecisionEngine {
  name: 'mock' = 'mock';

  async decide(input: DecisionInput): Promise<DecisionResult> {
    const start = performance.now();
    const { event, context, thresholds = DEFAULT_THRESHOLDS } = input;

    const titleLower = event.title.toLowerCase();
    const bodyLower = (event.body || '').toLowerCase();
    const text = `${titleLower} ${bodyLower}`;

    // Semantic feature extractors
    const isCriticalSystem =
      text.includes('ci failed') ||
      text.includes('deploy failed') ||
      text.includes('production') ||
      text.includes('security') ||
      text.includes('database is down') ||
      text.includes('outage') ||
      text.includes('incident');

    const isUrgentDeadline =
      (context.deadlineMinutes !== undefined && context.deadlineMinutes <= 15) ||
      text.includes('deadline') ||
      text.includes('exam tomorrow') ||
      text.includes('before 5 pm');

    const isCalendarImminent =
      event.source === 'calendar' &&
      (text.includes('now') || text.includes('in 10') || text.includes('in 12') || text.includes('in 5'));

    const isSocialOrMeme =
      event.source === 'discord' ||
      text.includes('😂') ||
      text.includes('meme') ||
      text.includes('bro') ||
      text.includes('lol');

    const isMarketing =
      text.includes('newsletter') ||
      text.includes('digest') ||
      text.includes('announcement') ||
      text.includes('discount') ||
      text.includes('receipt');

    const isTeammateReview =
      text.includes('review') ||
      text.includes('pr') ||
      text.includes('pull request') ||
      text.includes('approval');

    // Context weightings
    const isDeepWork = context.mode === 'deep_work';
    const isMeeting = context.mode === 'meeting';
    const isGaming = context.mode === 'gaming';
    const isStudying = context.mode === 'studying';
    const isIdle = context.mode === 'idle';

    // Base probability distribution
    let probs: Record<AttentionAction, number> = {
      interrupt_now: 0.05,
      show_soon: 0.15,
      batch: 0.65,
      silence: 0.15,
    };

    let urgencyScore = 1;
    let requiresUserAction = false;
    let highConsequence = false;
    let contextConflict = false;

    if (isCriticalSystem) {
      urgencyScore = 4;
      highConsequence = true;
      requiresUserAction = true;
      if (isMeeting) {
        probs = { interrupt_now: 0.65, show_soon: 0.25, batch: 0.08, silence: 0.02 };
      } else {
        probs = { interrupt_now: 0.92, show_soon: 0.05, batch: 0.02, silence: 0.01 };
      }
    } else if (isCalendarImminent) {
      urgencyScore = 3;
      requiresUserAction = true;
      if (isMeeting) {
        // Already in a meeting
        probs = { interrupt_now: 0.1, show_soon: 0.35, batch: 0.45, silence: 0.1 };
      } else {
        probs = { interrupt_now: 0.88, show_soon: 0.08, batch: 0.03, silence: 0.01 };
      }
    } else if (isUrgentDeadline) {
      urgencyScore = 3;
      highConsequence = true;
      requiresUserAction = true;
      if (isDeepWork || isStudying) {
        probs = { interrupt_now: 0.84, show_soon: 0.11, batch: 0.04, silence: 0.01 };
      } else {
        probs = { interrupt_now: 0.75, show_soon: 0.18, batch: 0.05, silence: 0.02 };
      }
    } else if (isSocialOrMeme) {
      urgencyScore = 0;
      contextConflict = isDeepWork || isMeeting || isStudying;
      if (isMeeting || isDeepWork) {
        probs = { interrupt_now: 0.01, show_soon: 0.02, batch: 0.07, silence: 0.9 };
      } else if (isIdle || isGaming) {
        probs = { interrupt_now: 0.05, show_soon: 0.55, batch: 0.3, silence: 0.1 };
      } else {
        probs = { interrupt_now: 0.02, show_soon: 0.08, batch: 0.4, silence: 0.5 };
      }
    } else if (isMarketing) {
      urgencyScore = 0;
      if (isMeeting || isDeepWork) {
        probs = { interrupt_now: 0.01, show_soon: 0.02, batch: 0.37, silence: 0.6 };
      } else {
        probs = { interrupt_now: 0.02, show_soon: 0.08, batch: 0.75, silence: 0.15 };
      }
    } else if (isTeammateReview) {
      urgencyScore = 2;
      requiresUserAction = true;
      if (isDeepWork) {
        contextConflict = true;
        probs = { interrupt_now: 0.04, show_soon: 0.18, batch: 0.73, silence: 0.05 };
      } else if (isMeeting) {
        contextConflict = true;
        probs = { interrupt_now: 0.02, show_soon: 0.1, batch: 0.68, silence: 0.2 };
      } else if (isIdle) {
        probs = { interrupt_now: 0.15, show_soon: 0.72, batch: 0.11, silence: 0.02 };
      } else {
        probs = { interrupt_now: 0.08, show_soon: 0.35, batch: 0.52, silence: 0.05 };
      }
    } else {
      // General item
      if (isDeepWork) {
        probs = { interrupt_now: 0.04, show_soon: 0.12, batch: 0.76, silence: 0.08 };
      } else if (isMeeting) {
        probs = { interrupt_now: 0.02, show_soon: 0.08, batch: 0.45, silence: 0.45 };
      } else if (isIdle) {
        probs = { interrupt_now: 0.12, show_soon: 0.65, batch: 0.2, silence: 0.03 };
      }
    }

    // Adjust for scarce attention budget
    if (context.attentionBudgetRemaining < 15) {
      if (probs.interrupt_now > 0.5 && !isCriticalSystem) {
        probs.show_soon += probs.interrupt_now * 0.4;
        probs.interrupt_now *= 0.6;
      }
    }

    // Normalize probabilities to strictly sum to 1.00
    const sum = Object.values(probs).reduce((acc, v) => acc + v, 0);
    const normalizedProbs: Record<AttentionAction, number> = {
      interrupt_now: Number((probs.interrupt_now / sum).toFixed(2)),
      show_soon: Number((probs.show_soon / sum).toFixed(2)),
      batch: Number((probs.batch / sum).toFixed(2)),
      silence: Number((probs.silence / sum).toFixed(2)),
    };

    // Correct floating rounding diff
    const currentSum =
      normalizedProbs.interrupt_now +
      normalizedProbs.show_soon +
      normalizedProbs.batch +
      normalizedProbs.silence;
    const diff = Number((1.0 - currentSum).toFixed(2));
    normalizedProbs.batch = Number((normalizedProbs.batch + diff).toFixed(2));

    // Determine highest probability as rawAction
    let rawAction: AttentionAction = 'batch';
    let maxP = -1;
    for (const [actionKey, p] of Object.entries(normalizedProbs) as [AttentionAction, number][]) {
      if (p > maxP) {
        maxP = p;
        rawAction = actionKey;
      }
    }

    const confidence = maxP;

    // Apply confidence gate
    const gateResult = applyConfidenceGate(rawAction, confidence, thresholds);

    const end = performance.now();
    // Honest empirical measurement: actual local computation time (no artificial +24-56ms additions or random noise)
    const measuredLatency = Math.max(1, Math.round(end - start));

    return {
      action: gateResult.finalAction,
      rawAction,
      probabilities: normalizedProbs,
      confidence,
      engine: 'mock',
      requestedEngine: 'mock',
      latencyMs: measuredLatency,
      latencySource: 'measured',
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
