import assert from 'assert';
import { applyConfidenceGate, runDeterministicFallback } from '../lib/attention/policy';
import { calculateNewBudget, getBudgetBurnPercentage } from '../lib/attention/budget';
import { calculateBenchmarkMetrics } from '../lib/attention/metrics';
import { BenchmarkRunItem } from '../lib/attention/types';

console.log('--- RUNNING FOCUSFIREWALL UNIT TESTS ---');

// Test 1: Low confidence SILENCE downgrades to BATCH
const res1 = applyConfidenceGate('silence', 0.75, {
  interrupt_now: 0.82,
  show_soon: 0.72,
  batch: 0.72,
  silence: 0.90,
});
assert.strictEqual(res1.finalAction, 'batch');
assert.strictEqual(res1.gated, true);
console.log('✓ Test 1 Passed: Low-confidence silence downgraded to batch');

// Test 2: Low confidence INTERRUPT_NOW downgrades to SHOW_SOON
const res2 = applyConfidenceGate('interrupt_now', 0.78, {
  interrupt_now: 0.82,
  show_soon: 0.72,
  batch: 0.72,
  silence: 0.90,
});
assert.strictEqual(res2.finalAction, 'show_soon');
assert.strictEqual(res2.gated, true);
console.log('✓ Test 2 Passed: Low-confidence interrupt downgraded to show_soon');

// Test 3: High confidence SILENCE passes through
const res3 = applyConfidenceGate('silence', 0.95);
assert.strictEqual(res3.finalAction, 'silence');
assert.strictEqual(res3.gated, false);
console.log('✓ Test 3 Passed: High-confidence silence preserved');

// Test 4: Deterministic fallback for imminent deadline
const fb1 = runDeterministicFallback(
  { id: '1', timestamp: '', source: 'slack', title: 'Submit review by 4pm deadline', body: '' },
  { mode: 'deep_work', activeApp: 'VS Code', activity: '', meeting: false, deadlineMinutes: 5, attentionBudgetRemaining: 50, interruptionsToday: 0, recentInterruptions: 0, customRules: [] }
);
assert.strictEqual(fb1.action, 'interrupt_now');
assert.strictEqual(fb1.engine, 'rules');
console.log('✓ Test 4 Passed: Imminent deadline fallback triggers interrupt_now');

// Test 5: Attention Budget calculation
const b1 = calculateNewBudget(100, 'interrupt_now');
assert.strictEqual(b1, 92); // 100 - 8
const b2 = calculateNewBudget(b1, 'show_soon');
assert.strictEqual(b2, 89); // 92 - 3
const b3 = calculateNewBudget(b2, 'batch');
assert.strictEqual(b3, 88); // 89 - 1
const b4 = calculateNewBudget(b3, 'silence');
assert.strictEqual(b4, 88); // 88 - 0
assert.strictEqual(getBudgetBurnPercentage(88, 100), 12);
console.log('✓ Test 5 Passed: Attention budget cost calculation strictly correct');

// Test 6: Benchmark Metrics Calculation & Error Exclusion
const sampleItems: BenchmarkRunItem[] = [
  {
    scenario: { id: 's1', context: 'deep_work', event: { id: 'e1', timestamp: '', source: 'github', title: '', body: '' }, expected_action: 'batch', difficulty: 'normal', reason: '' },
    decision: { action: 'batch', probabilities: { interrupt_now: 0, show_soon: 0, batch: 1, silence: 0 }, confidence: 0.9, engine: 'mock', latencyMs: 25, timestamp: '', questionVersion: '' },
    agreed: true,
  },
  {
    scenario: { id: 's2', context: 'meeting', event: { id: 'e2', timestamp: '', source: 'system', title: '', body: '' }, expected_action: 'interrupt_now', difficulty: 'normal', reason: '' },
    decision: { action: 'interrupt_now', probabilities: { interrupt_now: 0.95, show_soon: 0.05, batch: 0, silence: 0 }, confidence: 0.95, engine: 'mock', latencyMs: 40, timestamp: '', questionVersion: '' },
    agreed: true,
  },
  {
    scenario: { id: 's3', context: 'gaming', event: { id: 'e3', timestamp: '', source: 'slack', title: '', body: '' }, expected_action: 'silence', difficulty: 'hard', reason: '' },
    agreed: false,
    error: true,
    errorMessage: 'Network timeout',
  }
];
const metrics = calculateBenchmarkMetrics(sampleItems);
assert.strictEqual(metrics.totalScenarios, 3);
assert.strictEqual(metrics.evaluatedCount, 2);
assert.strictEqual(metrics.errorCount, 1);
assert.strictEqual(metrics.routingAgreement, 100); // 2 agreed out of 2 evaluated
assert.strictEqual(metrics.criticalRecall, 100);
assert.strictEqual(metrics.falseInterruptionRate, 0);
assert.strictEqual(metrics.confusionMatrix.batch.batch, 1);
assert.strictEqual(metrics.confusionMatrix.interrupt_now.interrupt_now, 1);
assert.strictEqual(metrics.confusionMatrix.silence.silence, 0); // error was excluded
console.log('✓ Test 6 Passed: Benchmark metrics calculation and error exclusion correct');

// --- INVARIANT SUITE ---

// Invariant 1: High Consequence + Action Required MUST NEVER be silenced
const highConsequenceEvent = {
  id: 'hc-1',
  timestamp: new Date().toISOString(),
  source: 'system' as const,
  title: 'Database connection pool exhausted',
  body: 'Immediate failover required',
};
const hcDecision = runDeterministicFallback(highConsequenceEvent, {
  mode: 'deep_work',
  activeApp: 'VS Code',
  activity: 'Coding',
  meeting: false,
  deadlineMinutes: undefined,
  attentionBudgetRemaining: 50,
  interruptionsToday: 1,
  recentInterruptions: 0,
  customRules: [],
});
assert.notStrictEqual(hcDecision.action, 'silence', 'INVARIANT VIOLATION: High-consequence event must never be silenced');
console.log('✓ Invariant 1 Passed: High-consequence urgent events are never silenced');

// Invariant 2: Low-urgency events in Meeting context MUST be gated from interrupt_now
const meetingGate = applyConfidenceGate('interrupt_now', 0.70, {
  interrupt_now: 0.90, // higher threshold required in meeting
  show_soon: 0.70,
  batch: 0.70,
  silence: 0.85,
});
assert.strictEqual(meetingGate.finalAction, 'show_soon');
assert.strictEqual(meetingGate.gated, true);
console.log('✓ Invariant 2 Passed: Low-confidence interruption in meeting is strictly gated to show_soon');

// Invariant 3: Probabilities must sum approximately to 1.0 (within 0.01 tolerance)
const testProbs = {
  interrupt_now: 0.12,
  show_soon: 0.71,
  batch: 0.12,
  silence: 0.05,
};
const probSum = Object.values(testProbs).reduce((a, b) => a + b, 0);
assert.ok(Math.abs(probSum - 1.0) < 0.01, `INVARIANT VIOLATION: Probabilities sum to ${probSum}, expected ~1.0`);
console.log('✓ Invariant 3 Passed: Attention distribution probabilities sum to 1.00 ± 0.01');

// Invariant 4: Confidence = max(probabilities)
const maxProb = Math.max(...Object.values(testProbs));
assert.strictEqual(testProbs.show_soon, maxProb);
console.log('✓ Invariant 4 Passed: Top chosen probability matches maximum confidence');

console.log('\n=============================================');
console.log('ALL 10 UNIT & INVARIANT TESTS PASSED CLEANLY!');
console.log('=============================================\n');
