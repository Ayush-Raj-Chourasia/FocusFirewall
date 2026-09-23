import { z } from 'zod';

export const contextModeSchema = z.enum([
  'deep_work',
  'studying',
  'meeting',
  'gaming',
  'idle',
]);

export const attentionActionSchema = z.enum([
  'interrupt_now',
  'show_soon',
  'batch',
  'silence',
]);

export const eventSourceSchema = z.enum([
  'slack',
  'email',
  'github',
  'calendar',
  'discord',
  'system',
  'agent',
  'custom',
]);

export const attentionEventSchema = z.object({
  id: z.string().default(() => `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
  timestamp: z.string().default(() => new Date().toISOString()),
  source: eventSourceSchema,
  sender: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  body: z.string().default(''),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

export const userContextSchema = z.object({
  mode: contextModeSchema,
  activeApp: z.string(),
  activity: z.string(),
  meeting: z.boolean(),
  deadlineMinutes: z.number().optional(),
  attentionBudgetRemaining: z.number().min(0).max(100),
  interruptionsToday: z.number().min(0),
  recentInterruptions: z.number().min(0),
  customRules: z.array(z.string()).default([]),
});

export const decideRequestSchema = z.object({
  event: attentionEventSchema,
  context: userContextSchema,
  preferredEngine: z.enum(['jev', 'mock', 'laya']).optional(),
  thresholds: z
    .object({
      interrupt_now: z.number().min(0).max(1).optional(),
      show_soon: z.number().min(0).max(1).optional(),
      batch: z.number().min(0).max(1).optional(),
      silence: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

export const eventsIngestSchema = z.object({
  events: z.array(attentionEventSchema),
});
