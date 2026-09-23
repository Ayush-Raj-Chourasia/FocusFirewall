import {
  AttentionEvent,
  ConfidenceThresholds,
  DecisionResult,
  FeedbackLogItem,
  UserContext,
} from '../attention/types';
import { CONTEXT_PRESETS } from '../attention/context';
import { DEFAULT_THRESHOLDS } from '../attention/policy';

const CONTEXT_KEY = 'focusfirewall_user_context';
const THRESHOLDS_KEY = 'focusfirewall_thresholds';
const ENGINE_KEY = 'focusfirewall_engine_preference';
const FEEDBACK_KEY = 'focusfirewall_feedback_log';
const PROCESSED_EVENTS_KEY = 'focusfirewall_processed_events';

export interface ProcessedEventRecord {
  event: AttentionEvent;
  context: UserContext;
  decision: DecisionResult;
  timestamp: string;
}

export function loadStoredContext(): UserContext {
  if (typeof window === 'undefined') return CONTEXT_PRESETS.deep_work;
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? JSON.parse(raw) : CONTEXT_PRESETS.deep_work;
  } catch {
    return CONTEXT_PRESETS.deep_work;
  }
}

export function saveStoredContext(ctx: UserContext): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));
  } catch {}
}

export function loadStoredThresholds(): ConfidenceThresholds {
  if (typeof window === 'undefined') return DEFAULT_THRESHOLDS;
  try {
    const raw = localStorage.getItem(THRESHOLDS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_THRESHOLDS;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function saveStoredThresholds(thresholds: ConfidenceThresholds): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THRESHOLDS_KEY, JSON.stringify(thresholds));
  } catch {}
}

export function loadEnginePreference(): 'laya' | 'jev' | 'mock' {
  if (typeof window === 'undefined') return 'laya';
  try {
    const pref = localStorage.getItem(ENGINE_KEY);
    if (pref === 'jev' || pref === 'mock') return pref;
    return 'laya';
  } catch {
    return 'laya';
  }
}

export function saveEnginePreference(pref: 'laya' | 'jev' | 'mock'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENGINE_KEY, pref);
  } catch {}
}

export function loadFeedbackLog(): FeedbackLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendFeedbackItem(item: FeedbackLogItem): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadFeedbackLog();
    existing.unshift(item);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing.slice(0, 200)));
  } catch {}
}

export function loadProcessedEvents(): ProcessedEventRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PROCESSED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function appendProcessedEvent(record: ProcessedEventRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadProcessedEvents();
    existing.unshift(record);
    localStorage.setItem(PROCESSED_EVENTS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch {}
}

export function clearProcessedEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROCESSED_EVENTS_KEY);
  } catch {}
}
