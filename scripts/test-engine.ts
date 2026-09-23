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

// Test 6: Benchmark Metrics Calculation
const sampleItems: BenchmarkRunItem[] = [
  {
    scenario: { id: 's1', context: 'deep_work', event: { id: 'e1', timestamp: '', source: 'github', title: '', body: '' }, expected_action: 'batch', difficulty: 'normal', reason: '' },
    decision: { action: 'batch', probabilities: { interrupt_now: 0, show_soon: 0, batch: 1, silence: 0 }, confidence: 0.9, engine: 'mock', latencyMs: 25, timestamp: '', questionVersion: '' },
    agreed: true
  },
  {
    scenario: { id: 's2', context: 'meeting', event: { id: 'e2', timestamp: '', source: 'system', title: '', body: '' }, expected_action: 'interrupt_now', difficulty: 'normal', reason: '' },
    decision: { action: 'interrupt_now', probabilities: { interrupt_now: 0.95, show_soon: 0.05, batch: 0, silence: 0 }, confidence: 0.95, engine: 'mock', latencyMs: 40, timestamp: '', questionVersion: '' },
    agreed: true
  }
];
const metrics = calculateBenchmarkMetrics(sampleItems);
assert.strictEqual(metrics.routingAgreement, 100);
assert.strictEqual(metrics.criticalRecall, 100);
assert.strictEqual(metrics.falseInterruptionRate, 0);
console.log('✓ Test 6 Passed: Benchmark metrics calculation correct');

console.log('\nALL 6 CORE POLICY TESTS PASSED!\n');
