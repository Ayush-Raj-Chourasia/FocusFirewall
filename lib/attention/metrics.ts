import {
  AttentionAction,
  BenchmarkMetrics,
  BenchmarkRunItem,
  BenchmarkRunMetadata,
  ConfidenceThresholds,
} from './types';
import { DEFAULT_THRESHOLDS } from './policy';

/**
 * Calculates percentile using standard nearest-rank method:
 * Rank k = ceil(p * n) (1-indexed), mapped to 0-indexed array: max(0, min(n - 1, ceil(p * n) - 1)).
 */
export function getNearestRankPercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const n = sortedValues.length;
  const rank = Math.ceil(p * n);
  const index = Math.max(0, Math.min(n - 1, rank - 1));
  return sortedValues[index];
}

export function calculateBenchmarkMetrics(
  items: BenchmarkRunItem[],
  thresholds: ConfidenceThresholds = DEFAULT_THRESHOLDS,
  metadata?: BenchmarkRunMetadata
): BenchmarkMetrics {
  const total = items.length;

  const emptyMatrix = (): Record<AttentionAction, Record<AttentionAction, number>> => ({
    interrupt_now: { interrupt_now: 0, show_soon: 0, batch: 0, silence: 0 },
    show_soon: { interrupt_now: 0, show_soon: 0, batch: 0, silence: 0 },
    batch: { interrupt_now: 0, show_soon: 0, batch: 0, silence: 0 },
    silence: { interrupt_now: 0, show_soon: 0, batch: 0, silence: 0 },
  });

  if (total === 0) {
    return {
      totalScenarios: 0,
      completedScenarios: 0,
      evaluatedCount: 0,
      errorCount: 0,
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
      confusionMatrix: emptyMatrix(),
      metadata,
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
  let errorCount = 0;

  const latencies: number[] = [];
  const actionDistribution: Record<AttentionAction, number> = {
    interrupt_now: 0,
    show_soon: 0,
    batch: 0,
    silence: 0,
  };
  const engineBreakdown: Record<string, number> = {};
  const difficultyBreakdown: Record<string, { total: number; correct: number }> = {};
  const confusionMatrix = emptyMatrix();

  const pairMap = new Map<string, { action: AttentionAction; expected: AttentionAction; context: string }[]>();

  for (const item of items) {
    const { scenario, decision, error } = item;

    // Methodological rule: Errors are tracked explicitly and excluded from performance ratios
    if (error || !decision) {
      errorCount += 1;
      continue;
    }

    const finalAction = decision.action;
    const expectedAction = scenario.expected_action;

    // Confusion Matrix: [Expected][Routed]
    if (confusionMatrix[expectedAction] && confusionMatrix[expectedAction][finalAction] !== undefined) {
      confusionMatrix[expectedAction][finalAction] += 1;
    }

    // Distribution
    actionDistribution[finalAction] = (actionDistribution[finalAction] || 0) + 1;
    engineBreakdown[decision.engine] = (engineBreakdown[decision.engine] || 0) + 1;

    // Difficulty breakdown
    const diff = scenario.difficulty || 'normal';
    if (!difficultyBreakdown[diff]) {
      difficultyBreakdown[diff] = { total: 0, correct: 0 };
    }
    difficultyBreakdown[diff].total += 1;

    // Routing Agreement
    if (finalAction === expectedAction) {
      agreedCount += 1;
      difficultyBreakdown[diff].correct += 1;
    }

    // Critical Recall: expected interrupt_now -> routed to interrupt_now or show_soon
    if (expectedAction === 'interrupt_now') {
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
    if (expectedAction === 'silence') {
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

    // Measured Latency (excludes fake / error latency)
    if (typeof decision.latencyMs === 'number' && !isNaN(decision.latencyMs) && decision.latencyMs > 0) {
      latencies.push(decision.latencyMs);
    }

    // Paired tracking for context sensitivity
    if (scenario.pairId) {
      const list = pairMap.get(scenario.pairId) || [];
      list.push({ action: finalAction, expected: expectedAction, context: scenario.context });
      pairMap.set(scenario.pairId, list);
    }
  }

  // Calculate Context Sensitivity over paired controlled scenarios
  let pairedSetsCount = 0;
  let contextSensitivityHits = 0;
  let contextDivergenceHits = 0;
  for (const [, pairList] of pairMap.entries()) {
    if (pairList.length >= 2) {
      pairedSetsCount += 1;
      const first = pairList[0];
      const second = pairList[1];
      // Raw divergence: did routing change when context changed?
      if (first.expected !== second.expected && first.action !== second.action) {
        contextDivergenceHits += 1;
      }
      // Strict Context Sensitivity: routed action matched intended ground-truth policy in both contexts
      if (
        first.expected !== second.expected &&
        first.action === first.expected &&
        second.action === second.expected
      ) {
        contextSensitivityHits += 1;
      }
    }
  }

  const evaluatedCount = total - errorCount;

  // Standard nearest-rank percentile calculation
  latencies.sort((a, b) => a - b);
  const p50 = getNearestRankPercentile(latencies, 0.5);
  const p95 = getNearestRankPercentile(latencies, 0.95);
  const mean = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  return {
    totalScenarios: total,
    processedScenarios: total,
    completedScenarios: evaluatedCount,
    evaluatedCount,
    errorCount,
    routingAgreement: evaluatedCount > 0 ? Number(((agreedCount / evaluatedCount) * 100).toFixed(1)) : 0,
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
    contextDivergence:
      pairedSetsCount > 0
        ? Number(((contextDivergenceHits / pairedSetsCount) * 100).toFixed(1))
        : 100,
    confidenceCoverage:
      evaluatedCount > 0 ? Number(((aboveConfidenceThresholdCount / evaluatedCount) * 100).toFixed(1)) : 0,
    p50LatencyMs: Math.round(p50),
    p95LatencyMs: Math.round(p95),
    meanLatencyMs: Math.round(mean),
    percentileMethod: 'nearest-rank',
    actionDistribution,
    engineBreakdown,
    difficultyBreakdown,
    confusionMatrix,
    metadata,
  };
}
