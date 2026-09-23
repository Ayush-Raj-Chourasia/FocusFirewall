import {
  AttentionAction,
  DecisionResult,
} from '../attention/types';
import { applyConfidenceGate, DEFAULT_THRESHOLDS, runDeterministicFallback } from '../attention/policy';
import { buildCompactState } from '../attention/state';
import { DecisionEngine, DecisionInput } from './types';
import { ATTENTION_QUESTIONS, QUESTION_VERSION } from './prompts';

export class JevEngine implements DecisionEngine {
  name: 'jev' = 'jev';
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.JEV_API_KEY || '';
    this.apiUrl = process.env.JEV_API_URL || 'https://api.jev.ai/v1/decide';
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async decide(input: DecisionInput): Promise<DecisionResult> {
    const start = performance.now();
    const { event, context, thresholds = DEFAULT_THRESHOLDS } = input;

    if (!this.hasApiKey()) {
      throw new Error(
        'JEV_API_KEY is not configured on the server. Please provide a key in .env or switch to MOCK mode.'
      );
    }

    const state = buildCompactState(event, context);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          state,
          version: QUESTION_VERSION,
          questions: [
            ATTENTION_QUESTIONS.action,
            ATTENTION_QUESTIONS.urgency,
            ATTENTION_QUESTIONS.requires_action,
            ATTENTION_QUESTIONS.high_consequence,
            ATTENTION_QUESTIONS.context_conflict,
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Jev API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const end = performance.now();
      const latencyMs = Math.round(end - start);

      // Parse Jev typed answers
      // Expected Jev structure: { answers: { q1_action: { choice: '...', probabilities: {...}, confidence: 0.9 } ... } }
      const actionAnswer = data?.answers?.q1_action || data?.action;
      const rawAction: AttentionAction =
        actionAnswer?.choice || actionAnswer?.selected || 'batch';
      const confidence: number = actionAnswer?.confidence ?? 0.8;
      const probabilities: Record<AttentionAction, number> = actionAnswer?.probabilities || {
        interrupt_now: rawAction === 'interrupt_now' ? confidence : 0.05,
        show_soon: rawAction === 'show_soon' ? confidence : 0.05,
        batch: rawAction === 'batch' ? confidence : 0.05,
        silence: rawAction === 'silence' ? confidence : 0.05,
      };

      const urgencyScore = data?.answers?.q2_urgency?.score ?? 1;
      const requiresUserAction = Boolean(data?.answers?.q3_requires_action?.result);
      const highConsequence = Boolean(data?.answers?.q4_high_consequence?.result);
      const contextConflict = Boolean(data?.answers?.q5_context_conflict?.result);

      // Confidence gate
      const gateResult = applyConfidenceGate(rawAction, confidence, thresholds);

      return {
        action: gateResult.finalAction,
        rawAction,
        probabilities,
        confidence,
        engine: 'jev',
        latencyMs,
        timestamp: new Date().toISOString(),
        questionVersion: QUESTION_VERSION,
        urgencyScore,
        requiresUserAction,
        highConsequence,
        contextConflict,
        gatedReason: gateResult.reason,
      };
    } catch (err: unknown) {
      console.error('Jev engine execution error, falling back to deterministic policy:', err);
      // Fallback
      const fallback = runDeterministicFallback(event, context);
      return {
        ...fallback,
        gatedReason: `Jev API call failed: ${err instanceof Error ? err.message : String(err)}. Deterministic rules applied.`,
      };
    }
  }
}
