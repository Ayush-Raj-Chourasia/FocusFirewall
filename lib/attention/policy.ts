import {
  AttentionAction,
  AttentionEvent,
  ConfidenceThresholds,
  DecisionResult,
  UserContext,
} from './types';

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  interrupt_now: 0.82,
  show_soon: 0.72,
  batch: 0.72,
  silence: 0.9,
};

export interface ConfidenceGateResult {
  finalAction: AttentionAction;
  rawAction: AttentionAction;
  gated: boolean;
  reason?: string;
}

/**
 * Applies deterministic safety thresholds to model's raw semantic choice.
 */
export function applyConfidenceGate(
  rawAction: AttentionAction,
  confidence: number,
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): ConfidenceGateResult {
  // Safety rule 1: Low confidence SILENCE downgrades to BATCH (prevents dropping important items)
  if (rawAction === 'silence' && confidence < thresholds.silence) {
    return {
      finalAction: 'batch',
      rawAction,
      gated: true,
      reason: `Silence confidence (${(confidence * 100).toFixed(0)}%) < threshold (${(thresholds.silence * 100).toFixed(0)}%). Safe downgrade to BATCH.`,
    };
  }

  // Safety rule 2: Low confidence INTERRUPT_NOW downgrades to SHOW_SOON (protects deep focus)
  if (rawAction === 'interrupt_now' && confidence < thresholds.interrupt_now) {
    return {
      finalAction: 'show_soon',
      rawAction,
      gated: true,
      reason: `Interrupt confidence (${(confidence * 100).toFixed(0)}%) < threshold (${(thresholds.interrupt_now * 100).toFixed(0)}%). Safe downgrade to SHOW SOON.`,
    };
  }

  return {
    finalAction: rawAction,
    rawAction,
    gated: false,
  };
}

/**
 * Deterministic fallback logic when model is unavailable or throws invalid output.
 */
export function runDeterministicFallback(
  event: AttentionEvent,
  context: UserContext,
  signals?: {
    requiresAction?: boolean;
    highConsequence?: boolean;
  }
): DecisionResult {
  const reqAction =
    signals?.requiresAction ??
    (event.title.toLowerCase().includes('action') ||
      event.title.toLowerCase().includes('deadline') ||
      event.title.toLowerCase().includes('failed') ||
      event.title.toLowerCase().includes('review'));

  const highConsequence =
    signals?.highConsequence ??
    (event.title.toLowerCase().includes('failed') ||
      event.title.toLowerCase().includes('down') ||
      event.title.toLowerCase().includes('incident') ||
      event.title.toLowerCase().includes('deadline') ||
      event.title.toLowerCase().includes('security'));

  let action: AttentionAction = 'batch';
  let reason = 'Default fallback to batch';

  if (context.deadlineMinutes !== undefined && context.deadlineMinutes <= 10 && reqAction) {
    action = 'interrupt_now';
    reason = 'Urgent context deadline (<=10m) + action required';
  } else if (highConsequence) {
    action = 'show_soon';
    reason = 'High-consequence event flagged';
  } else if (['discord', 'custom'].includes(event.source) && !reqAction) {
    action = context.mode === 'meeting' ? 'silence' : 'batch';
    reason = 'Low-signal source with no action requirement';
  }

  return {
    action,
    rawAction: action,
    probabilities: {
      interrupt_now: action === 'interrupt_now' ? 0.85 : 0.05,
      show_soon: action === 'show_soon' ? 0.85 : 0.05,
      batch: action === 'batch' ? 0.85 : 0.05,
      silence: (action as AttentionAction) === 'silence' ? 0.85 : 0.05,
    },
    confidence: 0.85,
    engine: 'rules',
    latencyMs: 1,
    timestamp: new Date().toISOString(),
    questionVersion: 'attention-v1',
    gatedReason: `Deterministic rules fallback applied: ${reason}`,
    requiresUserAction: reqAction,
    highConsequence,
  };
}
