'use client';

import { useState } from 'react';
import { AttentionEvent, EventSource } from '@/lib/attention/types';

interface EventPlaygroundProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEvent: (event: AttentionEvent) => void;
}

export function EventPlayground({
  isOpen,
  onClose,
  onSubmitEvent,
}: EventPlaygroundProps) {
  const [source, setSource] = useState<EventSource>('slack');
  const [sender, setSender] = useState('teammate');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [isJsonMode, setIsJsonMode] = useState(false);

  if (!isOpen) return null;

  const presets: { label: string; event: Partial<AttentionEvent> }[] = [
    {
      label: 'CRITICAL',
      event: {
        source: 'system',
        sender: 'AWS-Alerts',
        title: 'Production Database Primary Replica Failed',
        body: 'Automatic failover initiated. Write traffic stalled in region us-east-1.',
      },
    },
    {
      label: 'DEADLINE',
      event: {
        source: 'slack',
        sender: 'eng-lead',
        title: 'Need your sign-off on PR #402 before 5:00 PM today',
        body: 'Staging deployment cannot proceed without your team review.',
      },
    },
    {
      label: 'SOCIAL',
      event: {
        source: 'discord',
        sender: 'bro_dev',
        title: 'bro 😂 check out this meme in #general',
        body: 'https://cdn.discordapp.com/attachments/memes.mp4',
      },
    },
    {
      label: 'MARKETING',
      event: {
        source: 'email',
        sender: 'SaaS Newsletter',
        title: '50% off Developer Productivity Suite',
        body: 'Special spring promo valid until Friday night.',
      },
    },
    {
      label: 'SYSTEM',
      event: {
        source: 'system',
        sender: 'OS Power',
        title: 'Battery at 11% — Connect Charger',
        body: 'Estimated 15 minutes of battery remaining.',
      },
    },
    {
      label: 'TEAMMATE',
      event: {
        source: 'slack',
        sender: 'sam.k',
        title: 'Can you review this pull request whenever you have time?',
        body: 'Non-urgent dark mode CSS variables update.',
      },
    },
    {
      label: 'LOW-SIGNAL',
      event: {
        source: 'email',
        sender: 'Uber Receipts',
        title: 'Your receipt for Tuesday lunch delivery',
        body: 'Total: $19.20. Receipt ID: #90218.',
      },
    },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    if (p.event.source) setSource(p.event.source as EventSource);
    if (p.event.sender) setSender(p.event.sender);
    if (p.event.title) setTitle(p.event.title);
    if (p.event.body) setBody(p.event.body);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isJsonMode) {
      try {
        const parsed = JSON.parse(jsonInput);
        onSubmitEvent({
          id: `custom-${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: parsed.source || 'custom',
          sender: parsed.sender || 'custom',
          title: parsed.title || 'Untitled Custom Event',
          body: parsed.body || '',
          metadata: parsed.metadata,
        });
        onClose();
      } catch {
        alert('Invalid JSON input. Please format as valid JSON object with title, source, body.');
      }
      return;
    }

    if (!title.trim()) {
      alert('Event title is required');
      return;
    }

    onSubmitEvent({
      id: `custom-${Date.now()}`,
      timestamp: new Date().toISOString(),
      source,
      sender,
      title: title.trim(),
      body: body.trim(),
    });

    setTitle('');
    setBody('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
      <div className="panel-window bg-surface w-full max-w-xl font-mono text-xs shadow-hard-lg">
        <div className="panel-header">
          <span>TEST AN EVENT PLAYGROUND</span>
          <button
            onClick={onClose}
            className="hover:text-pink text-sm px-1.5 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Presets */}
          <div>
            <span className="text-[10px] text-ink-muted uppercase block mb-1.5 font-bold">
              QUICK TEST PRESETS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2 py-1 border border-line bg-paper hover:bg-line hover:text-surface text-[10px] font-bold uppercase transition-all"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center border-t border-line/40 pt-3">
            <span className="font-bold text-xs uppercase">
              {isJsonMode ? 'JSON Payload Mode' : 'Form Input Mode'}
            </span>
            <button
              type="button"
              onClick={() => setIsJsonMode(!isJsonMode)}
              className="text-[10px] text-pink underline font-bold"
            >
              {isJsonMode ? 'Switch to Form' : 'Paste Raw JSON'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isJsonMode ? (
              <div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`{\n  "source": "slack",\n  "sender": "lead",\n  "title": "Incident in Prod",\n  "body": "Need quick confirmation."\n}`}
                  rows={6}
                  className="w-full bg-paper border border-line p-2 text-xs font-mono font-normal"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-ink-muted uppercase block mb-0.5">
                      Source
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as EventSource)}
                      className="w-full bg-paper border border-line px-2 py-1.5 text-xs font-bold"
                    >
                      <option value="slack">Slack</option>
                      <option value="email">Email</option>
                      <option value="github">GitHub</option>
                      <option value="calendar">Calendar</option>
                      <option value="discord">Discord</option>
                      <option value="system">System</option>
                      <option value="agent">Agent</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-ink-muted uppercase block mb-0.5">
                      Sender
                    </label>
                    <input
                      type="text"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="e.g. teammate, CI-bot"
                      className="w-full bg-paper border border-line px-2 py-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-ink-muted uppercase block mb-0.5">
                    Title / Subject *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title..."
                    required
                    className="w-full bg-paper border border-line px-2 py-1 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-ink-muted uppercase block mb-0.5">
                    Body / Message
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Additional context or notification text..."
                    rows={3}
                    className="w-full bg-paper border border-line p-2 text-xs"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-line/40">
              <button
                type="button"
                onClick={onClose}
                className="btn-retro"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-retro-pink"
              >
                ROUTE EVENT →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
