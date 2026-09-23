export type ContextMode =
  | 'deep_work'
  | 'studying'
  | 'meeting'
  | 'gaming'
  | 'idle';

export type AttentionAction =
  | 'interrupt_now'
  | 'show_soon'
  | 'batch'
  | 'silence';

export type EventSource =
  | 'slack'
  | 'email'
  | 'github'
  | 'calendar'
  | 'discord'
  | 'phone'
  | 'sms'
  | 'system'
  | 'agent'
  | 'custom';

export interface AttentionEvent {
  id: string;
  timestamp: string;
  source: EventSource;
  sender?: string;
  title: string;
  body: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UserContext {
  mode: ContextMode;
  activeApp: string;
  activity: string;
  meeting: boolean;
  deadlineMinutes?: number;
  attentionBudgetRemaining: number;
  interruptionsToday: number;
  recentInterruptions: number;
  customRules: string[];
}

export interface DecisionResult {
  action: AttentionAction;
  rawAction?: AttentionAction;
  probabilities: Record<AttentionAction, number>;
  confidence: number;
  engine: 'jev' | 'laya' | 'mock' | 'rules';
  requestedEngine?: 'jev' | 'laya' | 'mock' | 'rules';
  latencyMs?: number;
  latencySource?: 'measured' | 'simulated';
  requestId?: string;
  timestamp: string;
  questionVersion: string;
  urgencyScore?: number; // 0-4
  requiresUserAction?: boolean; // noul
  highConsequence?: boolean; // noul
  contextConflict?: boolean; // noul
  gatedReason?: string;
}

export interface CompactStatePayload {
  event: {
    source: string;
    sender?: string;
    title: string;
    body: string;
  };
  context: {
    mode: ContextMode;
    active_app: string;
    activity: string;
    meeting: boolean;
    deadline_minutes?: number;
    attention_budget_remaining: number;
    interruptions_today: number;
    recent_interruptions: number;
  };
  policy: {
    interrupt_only_when: string;
    silence_only_when: string;
  };
}

export interface BenchmarkScenario {
  id: string;
  context: ContextMode;
  event: AttentionEvent;
  expected_action: AttentionAction;
  difficulty: 'easy' | 'normal' | 'hard' | 'adversarial';
  reason: string;
  pairId?: string;
}

export interface BenchmarkRunItem {
  scenario: BenchmarkScenario;
  decision?: DecisionResult;
  agreed: boolean;
  error?: boolean;
  errorMessage?: string;
  criticalRecallHit?: boolean;
  falseInterruption?: boolean;
  suppressionPrecisionHit?: boolean;
}

export interface BenchmarkRunMetadata {
  runId: string;
  datasetVersion: string;
  policyVersion: string;
  engine: string;
  thresholds: ConfidenceThresholds;
  startedAt: string;
  completedAt: string;
  latencyScope: string;
  timestamp?: string;
}

export interface BenchmarkMetrics {
  totalScenarios: number;
  completedScenarios: number;
  evaluatedCount: number;
  errorCount: number;
  routingAgreement: number; // percentage (0-100)
  criticalRecall: number; // percentage (0-100)
  falseInterruptionRate: number; // percentage (0-100)
  suppressionPrecision: number; // percentage (0-100)
  contextSensitivity: number; // percentage (0-100) where routed matched expected under contrasting contexts
  contextDivergence?: number; // percentage (0-100) where routed actions diverged across contexts
  confidenceCoverage: number; // percentage (0-100)
  p50LatencyMs: number;
  p95LatencyMs: number;
  meanLatencyMs: number;
  percentileMethod?: string;
  actionDistribution: Record<AttentionAction, number>;
  engineBreakdown: Record<string, number>;
  difficultyBreakdown: Record<string, { total: number; correct: number }>;
  confusionMatrix: Record<AttentionAction, Record<AttentionAction, number>>;
  metadata?: BenchmarkRunMetadata;
}

export interface ConfidenceThresholds {
  interrupt_now: number;
  show_soon: number;
  batch: number;
  silence: number;
}

export interface FeedbackLogItem {
  id: string;
  timestamp: string;
  eventId: string;
  eventTitle: string;
  contextMode: ContextMode;
  originalAction: AttentionAction;
  feedback: 'correct' | 'wrong';
  overrideAction?: AttentionAction;
}
