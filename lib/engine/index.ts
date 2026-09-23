import { DecisionEngine } from './types';
import { JevEngine } from './jev';
import { MockEngine } from './mock';
import { LayaEngine } from './laya';

export function getEngine(preferred?: 'jev' | 'mock' | 'laya'): DecisionEngine {
  const jev = new JevEngine();
  const laya = new LayaEngine();

  if (preferred === 'laya') {
    return laya;
  }

  if (preferred === 'jev') {
    if (jev.hasApiKey()) {
      return jev;
    }
    // If Jev requested without API key, return jev anyway (which triggers explicit rules fallback with explanation)
    return jev;
  }

  // Default to Mock deterministic engine for zero-dependency public runtime
  return new MockEngine();
}

export * from './types';
export * from './prompts';
export * from './jev';
export * from './mock';
export * from './laya';
