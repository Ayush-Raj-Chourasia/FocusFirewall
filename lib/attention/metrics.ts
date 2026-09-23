import {
  AttentionAction,
  BenchmarkMetrics,
  BenchmarkRunItem,
  ConfidenceThresholds,
} from './types';
import { DEFAULT_THRESHOLDS } from './policy';

export function calculateBenchmarkMetrics(
  items: BenchmarkRunItem[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS
): BenchmarkMetrics {
  const total = items.length;
  if (total === 0) {
    return {
      totalScenarios: 0,
      completedScenarios: 0,
      routingAgreement: 0,
      criticalRecall: 0,
      falseInterruptionRate: 0,
      suppressionPrecision: 0,
      contextSensitivity: 0,
      confidenceCoverage: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      meanLatencyMs: 0,
      actionDistribution: {
        interrupt_now: 0,
        show_soon: 0,
        batch: 0,
        silence: 0,
      },
      engineBreakdown: {},
      difficultyBreakdown: {},
    };
  }

  let agreedCount = 0;
  let expectedInterruptCount = 0;
  let criticalRecallHits = 0;
  let nonInterruptExpectedCount = 0;
  let falseInterruptCount = 0;
  let expectedSilenceCount = 0;
  let suppressionPrecisionHits = 0;
  let aboveConfidenceThresholdCount = 0;

  const latencies: number[] = [];
  const actionDistribution: Record<AttentionAction, number> = {
    interrupt_now: 0,
    show_soon: 0,
    batch: 0,
    silence: 0,
  };
  const engineBreakdown: Record<string, number> = {};
  const difficultyBreakdown: Record<string, { total: number; correct: number }> = {};

  const pairMap = new Map<string, { action: AttentionAction; expected: AttentionAction; context: string }[]>();

  for (const item of items) {
    const { scenario, decision } = item;
    const finalAction = decision.action;

    // Distribution
    actionDistribution[finalAction] = (actionDistribution[finalAction] || 0) + 1;
    engineBreakdown[decision.engine] = (engineBreakdown[decision.engine] || 0) + 1;

    // Difficulty breakdown
    const diff = scenario.difficulty || 'normal';
    if (!difficultyBreakdown[diff]) {
      difficultyBreakdown[diff] = { total: 0, correct: 0 };
    }
    difficultyBreakdown[diff].total += 1;

    // Agreement
    if (finalAction === scenario.expected_action) {
      agreedCount += 1;
      difficultyBreakdown[diff].correct += 1;
    }

    // Critical Recall: events where ground truth is interrupt_now -> routed to interrupt_now or show_soon
    if (scenario.expected_action === 'interrupt_now') {
      expectedInterruptCount += 1;
      if (finalAction === 'interrupt_now' || finalAction === 'show_soon') {
        criticalRecallHits += 1;
      }
    } else {
      // False Interruption: expected NOT interrupt_now, but routed to interrupt_now
      nonInterruptExpectedCount += 1;
      if (finalAction === 'interrupt_now') {
        falseInterruptCount += 1;
      }
    }

    // Suppression Precision: expected silence -> routed to silence
    if (scenario.expected_action === 'silence') {
      expectedSilenceCount += 1;
      if (finalAction === 'silence') {
        suppressionPrecisionHits += 1;
      }
    }

    // Confidence coverage
    const reqThreshold = thresholds[finalAction] ?? 0.75;
    if (decision.confidence >= reqThreshold) {
      aboveConfidenceThresholdCount += 1;
    }

    // Latency
    if (typeof decision.latencyMs === 'number' && !isNaN(decision.latencyMs)) {
      latencies.push(decision.latencyMs);
    }

    // Paired tracking
    if (scenario.pairId) {
      const list = pairMap.get(scenario.pairId) || [];
      list.push({ action: finalAction, expected: scenario.expected_action, context: scenario.context });
      pairMap.set(scenario.pairId, list);
    }
  }

  // Calculate Context Sensitivity over pairs
  let pairedSetsCount = 0;
  let contextSensitivityHits = 0;
  for (const [, pairList] of pairMap.entries()) {
    if (pairList.length >= 2) {
      pairedSetsCount += 1;
      // Check if decisions differed when contexts differed as expected
      const first = pairList[0];
      const second = pairList[1];
      if (first.expected !== second.expected && first.action !== second.action) {
        contextSensitivityHits += 1;
      }
    }
  }

  latencies.sort((a, b) => a - b);
  const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
  const p95 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.95)] : 0;
  const mean = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  return {
    totalScenarios: total,
    completedScenarios: items.length,
    routingAgreement: total > 0 ? Number(((agreedCount / total) * 100).toFixed(1)) : 0,
    criticalRecall:
      expectedInterruptCount > 0
        ? Number(((criticalRecallHits / expectedInterruptCount) * 100).toFixed(1))
        : 100,
    falseInterruptionRate:
      nonInterruptExpectedCount > 0
        ? Number(((falseInterruptCount / nonInterruptExpectedCount) * 100).toFixed(1))
        : 0,
    suppressionPrecision:
      expectedSilenceCount > 0
        ? Number(((suppressionPrecisionHits / expectedSilenceCount) * 100).toFixed(1))
        : 100,
    contextSensitivity:
      pairedSetsCount > 0
        ? Number(((contextSensitivityHits / pairedSetsCount) * 100).toFixed(1))
        : 100,
    confidenceCoverage:
      total > 0 ? Number(((aboveConfidenceThresholdCount / total) * 100).toFixed(1)) : 0,
    p50LatencyMs: Math.round(p50),
    p95LatencyMs: Math.round(p95),
    meanLatencyMs: Math.round(mean),
    actionDistribution,
    engineBreakdown,
    difficultyBreakdown,
  };
}
