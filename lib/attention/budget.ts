import { AttentionAction } from './types';

export const ACTION_ATTENTION_COSTS: Record<AttentionAction, number> = {
  interrupt_now: 8,
  show_soon: 3,
  batch: 1,
  silence: 0,
};

export const INITIAL_DAILY_BUDGET = 100;

export function calculateNewBudget(
  currentBudget: number,
  action: AttentionAction
): number {
  const cost = ACTION_ATTENTION_COSTS[action] ?? 0;
  return Math.max(0, currentBudget - cost);
}

export function getBudgetBurnPercentage(
  budgetRemaining: number,
  totalBudget: number = INITIAL_DAILY_BUDGET
): number {
  if (totalBudget <= 0) return 100;
  return Math.min(100, Math.max(0, ((totalBudget - budgetRemaining) / totalBudget) * 100));
}
