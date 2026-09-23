export const QUESTION_VERSION = 'attention-v1';

export interface JevQuestionDefinition {
  id: string;
  type: 'choice' | 'score' | 'noul';
  question: string;
  options?: Record<string, string>;
  scale?: Record<number, string>;
  instruction?: string;
}

export const ATTENTION_QUESTIONS: Record<string, JevQuestionDefinition> = {
  action: {
    id: 'q1_action',
    type: 'choice',
    question: 'Which action should be taken for this event given the user context?',
    options: {
      interrupt_now: 'the event is important enough to justify an immediate interruption in the current context',
      show_soon: 'the user should be shown the event shortly, but it does not justify an immediate interruption',
      batch: 'the event should be collected with other items and shown together later',
      silence: 'the event is low-value enough that the user should not be interrupted or shown it in the normal flow',
    },
  },
  urgency: {
    id: 'q2_urgency',
    type: 'score',
    question: 'How urgent is this incoming event on a 0-4 scale?',
    scale: {
      0: 'no time sensitivity',
      1: 'can comfortably wait',
      2: 'should be handled soon',
      3: 'time-sensitive',
      4: 'immediate attention may be warranted',
    },
  },
  requires_action: {
    id: 'q3_requires_action',
    type: 'noul',
    question: 'Does this event require meaningful user action?',
    instruction:
      'The event requires a meaningful action or response from the user rather than merely providing information.',
  },
  high_consequence: {
    id: 'q4_high_consequence',
    type: 'noul',
    question: 'Would delaying this event cause high negative consequence?',
    instruction:
      'Delaying this event could materially worsen a task, deadline, system state, or other important outcome.',
  },
  context_conflict: {
    id: 'q5_context_conflict',
    type: 'noul',
    question: 'Does interrupting with this event conflict with the user current focus?',
    instruction:
      "Showing this event immediately would meaningfully disrupt the user's current activity without a strong reason to do so.",
  },
};
