'use client';

import { useEffect, useState } from 'react';
import { ConfidenceThresholds } from '@/lib/attention/types';
import { DEFAULT_THRESHOLDS } from '@/lib/attention/policy';
import {
  loadEnginePreference,
  loadStoredThresholds,
  saveEnginePreference,
  saveStoredThresholds,
} from '@/lib/storage/local';

export default function SettingsPage() {
  const [engine, setEngine] = useState<'laya' | 'jev' | 'mock'>('laya');
  const [thresholds, setThresholds] = useState<ConfidenceThresholds>(DEFAULT_THRESHOLDS);
  const [dailyBudget, setDailyBudget] = useState<number>(100);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    setEngine(loadEnginePreference());
    setThresholds(loadStoredThresholds());
  }, []);

  const handleSave = () => {
    saveEnginePreference(engine);
    saveStoredThresholds(thresholds);
    setSaveNotice('Settings saved successfully!');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleReset = () => {
    setThresholds(DEFAULT_THRESHOLDS);
    setEngine('laya');
    setDailyBudget(100);
    saveEnginePreference('laya');
    saveStoredThresholds(DEFAULT_THRESHOLDS);
    setSaveNotice('Reset to original default values.');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-mono text-xs">
      <div className="border-b border-line pb-4 flex justify-between items-center">
        <div>
          <span className="text-pink font-bold uppercase text-[10px]">CONFIGURATION</span>
          <h1 className="font-display font-black text-2xl text-ink">SYSTEM SETTINGS</h1>
        </div>
        {saveNotice && (
          <span className="bg-brandgreen text-white px-3 py-1 font-bold shadow-hard">
            {saveNotice}
          </span>
        )}
      </div>

      {/* Engine Selection */}
      <div className="panel-window bg-surface p-4 space-y-3">
        <div className="panel-header -mx-4 -mt-4 mb-3">
          <span>DECISION ENGINE</span>
          <span className="text-pink text-[10px]">SELECTION</span>
        </div>

        <p className="text-ink-muted text-xs">
          Choose the active semantic decision engine. Laya is the open-weights System-1 model. Jev connects via API key.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setEngine('laya')}
            className={`p-3 border text-left transition-all ${
              engine === 'laya'
                ? 'border-line bg-paper shadow-hard ring-2 ring-pink'
                : 'border-line bg-surface hover:bg-paper'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <strong className="text-ink font-bold text-sm">LAYA (OPEN-WEIGHTS)</strong>
              {engine === 'laya' && <span className="tag-badge bg-pink text-white">ACTIVE</span>}
            </div>
            <p className="text-ink-muted text-[11px]">
              Open-weights System-1 decision architecture (convaiinnovations/laya). Local REST service or local policy engine.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setEngine('jev')}
            className={`p-3 border text-left transition-all ${
              engine === 'jev'
                ? 'border-line bg-paper shadow-hard ring-2 ring-orange'
                : 'border-line bg-surface hover:bg-paper'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <strong className="text-ink font-bold text-sm">REAL JEV (API)</strong>
              {engine === 'jev' && <span className="tag-badge bg-orange text-white">ACTIVE</span>}
            </div>
            <p className="text-ink-muted text-[11px]">
              Connects to live Jev endpoint server-side. Requires JEV_API_KEY in server environment.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setEngine('mock')}
            className={`p-3 border text-left transition-all ${
              engine === 'mock'
                ? 'border-line bg-paper shadow-hard ring-2 ring-ink'
                : 'border-line bg-surface hover:bg-paper'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <strong className="text-ink font-bold text-sm">MOCK DEMO MODE</strong>
              {engine === 'mock' && <span className="tag-badge bg-line text-white">ACTIVE</span>}
            </div>
            <p className="text-ink-muted text-[11px]">
              Offline deterministic simulation for testing UI with fixed latency.
            </p>
          </button>
        </div>
      </div>

      {/* Confidence Gating Thresholds */}
      <div className="panel-window bg-surface p-4 space-y-4">
        <div className="panel-header -mx-4 -mt-4 mb-3">
          <span>CONFIDENCE GATING THRESHOLDS</span>
          <span className="text-orange text-[10px]">SAFETY ENFORCEMENT</span>
        </div>

        <p className="text-ink-muted text-xs">
          If Jev&apos;s decision confidence falls below these cutoffs, deterministic safety rules automatically downgrade the action (e.g. low-confidence silence downgrades to batch).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 border border-line bg-paper space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-danger uppercase">INTERRUPT NOW THRESHOLD</span>
              <strong className="text-ink">{(thresholds.interrupt_now * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={thresholds.interrupt_now}
              onChange={(e) =>
                setThresholds({ ...thresholds, interrupt_now: parseFloat(e.target.value) })
              }
              className="w-full accent-danger cursor-pointer"
            />
            <span className="text-[10px] text-ink-muted block">
              Default: 82%. Lower values permit more immediate interruptions.
            </span>
          </div>

          <div className="p-3 border border-line bg-paper space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-orange uppercase">SHOW SOON THRESHOLD</span>
              <strong className="text-ink">{(thresholds.show_soon * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={thresholds.show_soon}
              onChange={(e) =>
                setThresholds({ ...thresholds, show_soon: parseFloat(e.target.value) })
              }
              className="w-full accent-orange cursor-pointer"
            />
            <span className="text-[10px] text-ink-muted block">
              Default: 72%. Threshold for non-disruptive banners.
            </span>
          </div>

          <div className="p-3 border border-line bg-paper space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-ink uppercase">BATCH THRESHOLD</span>
              <strong className="text-ink">{(thresholds.batch * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={thresholds.batch}
              onChange={(e) =>
                setThresholds({ ...thresholds, batch: parseFloat(e.target.value) })
              }
              className="w-full accent-ink cursor-pointer"
            />
            <span className="text-[10px] text-ink-muted block">
              Default: 72%. Threshold for grouping into periodic digests.
            </span>
          </div>

          <div className="p-3 border border-line bg-paper space-y-2">
            <div className="flex justify-between">
              <span className="font-bold text-ink-muted uppercase">SILENCE THRESHOLD</span>
              <strong className="text-ink">{(thresholds.silence * 100).toFixed(0)}%</strong>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={thresholds.silence}
              onChange={(e) =>
                setThresholds({ ...thresholds, silence: parseFloat(e.target.value) })
              }
              className="w-full accent-line cursor-pointer"
            />
            <span className="text-[10px] text-ink-muted block">
              Default: 90%. High safety bar before discarding notifications completely.
            </span>
          </div>
        </div>
      </div>

      {/* Attention Budget Default */}
      <div className="panel-window bg-surface p-4 space-y-3">
        <div className="panel-header -mx-4 -mt-4 mb-3">
          <span>DAILY ATTENTION BUDGET</span>
          <span className="text-pink text-[10px]">SCARCITY MODEL</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <strong className="text-ink text-sm block">Starting Daily Credits</strong>
            <p className="text-ink-muted text-xs">
              Credits consumed per action: Interrupt Now (8), Show Soon (3), Batch (1), Silence (0).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="20"
              max="200"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(Number(e.target.value))}
              className="w-20 bg-paper border border-line px-2 py-1 font-bold text-right text-sm"
            />
            <span className="text-ink-muted">credits</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="btn-retro text-ink-muted hover:text-danger"
        >
          RESET TO DEFAULTS
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="btn-retro-pink px-6 py-2.5 shadow-hard-lg text-sm"
        >
          SAVE CONFIGURATION
        </button>
      </div>
    </div>
  );
}
