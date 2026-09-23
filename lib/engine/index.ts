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
    // If Jev requested without API key, use Laya open-source engine
    return laya;
  }

  if (preferred === 'mock') {
    return new MockEngine();
  }

  // Default: if Jev key present, use Jev; else use Laya
  if (jev.hasApiKey()) {
    return jev;
  }

  return laya;
}

export * from './types';
export * from './prompts';
export * from './jev';
export * from './mock';
export * from './laya';
