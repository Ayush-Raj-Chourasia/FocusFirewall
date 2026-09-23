import {
  AttentionEvent,
  ConfidenceThresholds,
  DecisionResult,
  UserContext,
} from '../attention/types';

export interface DecisionInput {
  event: AttentionEvent;
  context: UserContext;
  thresholds?: ConfidenceThresholds;
}

export interface DecisionEngine {
  name: 'jev' | 'laya' | 'mock' | 'rules';
  decide(input: DecisionInput): Promise<DecisionResult>;
}
