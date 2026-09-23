import fs from 'fs';
import path from 'path';

const contexts = ['deep_work', 'studying', 'meeting', 'gaming', 'idle'];

// Base templates for diverse realistic events
const criticalEvents = [
  { source: 'system', sender: 'AWS CloudWatch', title: 'ALARM: RDS Aurora CPU > 95% in us-east-1', body: 'Database threshold violated. Primary node CPU sustained at 98% for 5 minutes.' },
  { source: 'github', sender: 'ci-bot', title: 'Production Deploy Failed: Release v2.4.0', body: 'Failed on smoke tests: HTTP 500 returned on /healthcheck endpoint.' },
  { source: 'system', sender: 'Security Sentry', title: 'CRITICAL: Unauthorized SSH Key Added to Bastion', body: 'New public key injected from unknown IP 194.26.29.112.' },
  { source: 'calendar', sender: 'Google Calendar', title: 'Incident Retrospective starting NOW', body: 'Host moved time forward to immediately address outage #409.' },
  { source: 'slack', sender: 'cto', title: 'URGENT: Rollback commit 8f9b12 immediately', body: 'Payment gateway is double-charging Stripe transactions in prod.' },
  { source: 'system', sender: 'Battery Monitor', title: 'Battery at 5% — Critical Low Power', body: 'Machine will hibernate in 3 minutes unless connected to AC power.' },
  { source: 'email', sender: 'Bank Fraud Alert', title: 'Suspicious transaction flagged on Visa card #9012', body: 'Charge of $1,420.00 at BestBuy Online. Reply YES if authorized.' },
  { source: 'agent', sender: 'Canvas LMS', title: 'Final Exam submission window closes in 15 minutes', body: 'Portal strictly locks at 16:00. 1 submission attempt remaining.' }
];

const urgentDeadlineEvents = [
  { source: 'slack', sender: 'team-lead', title: 'Need your sign-off before 4:00 PM for client demo', body: 'Please verify the pricing table changes before the enterprise pitch.' },
  { source: 'email', sender: 'DevOps Team', title: 'Scheduled maintenance in 20 minutes', body: 'Kubernetes staging clusters will undergo restart at 15:00.' },
  { source: 'calendar', sender: 'Calendar', title: '1-on-1 with Engineering VP in 10 minutes', body: 'Prepare sprint status summary and blocker notes.' },
  { source: 'github', sender: 'release-bot', title: 'Release candidate rc-3 waiting for your review', body: 'Blocker on branch merge until senior frontend approval.' }
];

const teammateWorkEvents = [
  { source: 'slack', sender: 'alex.k', title: 'Can you look at PR #302 when you have a moment?', body: 'Refactored auth middleware to use Jose instead of jsonwebtoken. No rush.' },
  { source: 'github', sender: 'github-actions', title: 'Staging build #591 succeeded', body: 'Deployment to preview-app-stg.fly.dev completed in 3m 42s.' },
  { source: 'email', sender: 'jira@company.atlassian.net', title: '[PROJ-1082] Issue assigned to you by Sarah', body: 'Implement CSV export for transaction history table.' },
  { source: 'slack', sender: 'danielle.m', title: 'Did you get a chance to test the new Figma tokens?', body: 'Designer updated color palette variables in v2 library.' },
  { source: 'github', sender: 'dependabot[bot]', title: 'chore(deps): bump tailwindcss from 3.4.1 to 3.4.2', body: 'Dependabot automated dependency bump.' },
  { source: 'email', sender: 'DocuSign', title: 'Completed: NDA with CloudTech Partner', body: 'All parties have signed the mutual non-disclosure agreement.' }
];

const socialAndChatEvents = [
  { source: 'discord', sender: 'sam_dev', title: 'bro 😂 check out this meme in #random', body: 'when the junior pushes straight to main and it actually works' },
  { source: 'slack', sender: 'jenny.h', title: 'Anyone down for lunch in 15 mins?', body: 'Thinking about that taco spot down the street.' },
  { source: 'discord', sender: 'gamer_tag', title: '@everyone who is playing tonight?', body: 'Setting up lobby for 8pm.' },
  { source: 'slack', sender: 'slackbot', title: 'Reminder: Friday social trivia starts in 2 hours', body: 'Join #social-lounge zoom link if you want to participate.' }
];

const lowSignalMarketingEvents = [
  { source: 'email', sender: 'Substack Newsletter', title: 'The Weekly Architecture Digest #142', body: 'Microservices vs Monoliths in 2026: An updated retrospective.' },
  { source: 'email', sender: 'SaaS Tool', title: 'Feature update: Introducing dark mode icons', body: 'We updated our icon set with improved contrast.' },
  { source: 'email', sender: 'Online Store', title: 'Flash Sale: 20% off all developer mechanical keyboards', body: 'Use coupon CODE20 at checkout before midnight.' },
  { source: 'email', sender: 'Uber Eats', title: 'Your receipt for Tuesday dinner order', body: 'Total: $24.80. Thanks for ordering from Ramen Bar.' },
  { source: 'system', sender: 'App Store', title: '5 applications updated in the background', body: 'VS Code, Slack, Docker, Figma, Notion.' }
];

const scenarios = [];
let idCounter = 1;
let pairCounter = 1;

// 1. Generate 100 context-sensitive paired cases (20 pairs x 5 contexts = 100 items)
// The same event under different contexts generates DIFFERENT expected actions!
const pairedTemplates = [
  {
    event: { source: 'slack', sender: 'teammate.sam', title: 'Can you review this pull request for me?', body: 'Quick PR adding tests for the user profile route.' },
    rules: {
      deep_work: { action: 'batch', reason: 'Non-urgent teammate PR during deep focused coding' },
      studying: { action: 'batch', reason: 'Non-urgent code review during study session' },
      meeting: { action: 'silence', reason: 'Active meeting: do not interrupt or show non-critical review' },
      gaming: { action: 'show_soon', reason: 'Gaming context: show soon without blocking screen' },
      idle: { action: 'show_soon', reason: 'Idle context: user is receptive to review request' }
    }
  },
  {
    event: { source: 'discord', sender: 'kyle_g', title: 'Check out this funny video clip 😂', body: 'Look at this game physics glitch that happened earlier' },
    rules: {
      deep_work: { action: 'silence', reason: 'Pure social distraction during deep focus' },
      studying: { action: 'silence', reason: 'Social noise during studying' },
      meeting: { action: 'silence', reason: 'Irrelevant social chat during meeting' },
      gaming: { action: 'show_soon', reason: 'Gaming mode: social banter with friends is acceptable' },
      idle: { action: 'show_soon', reason: 'Idle mode: social distractions are fine to surface' }
    }
  },
  {
    event: { source: 'calendar', sender: 'Google Calendar', title: 'Team retrospective sync in 10 minutes', body: 'Bi-weekly sprint retrospective with engineering squad.' },
    rules: {
      deep_work: { action: 'interrupt_now', reason: 'Imminent scheduled meeting: interrupt before it starts' },
      studying: { action: 'interrupt_now', reason: 'Scheduled meeting requires breaking study session' },
      meeting: { action: 'show_soon', reason: 'Already in meeting: show soon as a subtle transition banner' },
      gaming: { action: 'interrupt_now', reason: 'Interrupt to prevent missing scheduled work meeting' },
      idle: { action: 'interrupt_now', reason: 'Prompt user that scheduled meeting is in 10 minutes' }
    }
  },
  {
    event: { source: 'email', sender: 'OReilly Radar', title: 'New trends in WebAssembly and Edge Runtimes', body: 'Deep dive into edge compute performance benchmarks.' },
    rules: {
      deep_work: { action: 'batch', reason: 'Educational newsletter: collect for later reading' },
      studying: { action: 'batch', reason: 'External reading material: defer until study block ends' },
      meeting: { action: 'silence', reason: 'Newsletter during meeting is irrelevant slop' },
      gaming: { action: 'silence', reason: 'Technical newsletter during gaming is noise' },
      idle: { action: 'show_soon', reason: 'Idle user might enjoy reading newsletter' }
    }
  },
  {
    event: { source: 'slack', sender: 'product.manager', title: 'Quick question about the checkout modal styling', body: 'Did we decide on 8px or 12px border radius for the buttons?' },
    rules: {
      deep_work: { action: 'batch', reason: 'Low-urgency design question interrupts flow; batch for later' },
      studying: { action: 'batch', reason: 'Defer question to avoid breaking study momentum' },
      meeting: { action: 'silence', reason: 'Do not disrupt active meeting with design trivia' },
      gaming: { action: 'batch', reason: 'Batch work questions while user is gaming' },
      idle: { action: 'show_soon', reason: 'User is idle; show soon so question can be quickly answered' }
    }
  }
];

// Add paired cases
for (const pt of pairedTemplates) {
  const currentPairId = `pair-${String(pairCounter++).padStart(3, '0')}`;
  for (const ctx of contexts) {
    const rule = pt.rules[ctx];
    scenarios.push({
      id: `evt-${String(idCounter++).padStart(4, '0')}`,
      context: ctx,
      event: {
        id: `e-${idCounter}`,
        timestamp: new Date().toISOString(),
        source: pt.event.source,
        sender: pt.event.sender,
        title: pt.event.title,
        body: pt.event.body
      },
      expected_action: rule.action,
      difficulty: 'normal',
      reason: rule.reason,
      pairId: currentPairId
    });
  }
}

// 2. Generate balanced scenarios per context until each has exactly 80 scenarios (total 400)
for (const ctx of contexts) {
  const currentCount = scenarios.filter(s => s.context === ctx).length;
  const needed = 80 - currentCount;

  for (let i = 0; i < needed; i++) {
    const mod = i % 4;
    let expectedAction = 'batch';
    let difficulty = 'normal';
    let template;
    let reason = '';

    if (mod === 0) {
      // interrupt_now
      template = criticalEvents[i % criticalEvents.length];
      expectedAction = (ctx === 'meeting' && template.source !== 'system' && !template.title.includes('CRITICAL'))
        ? 'show_soon'
        : 'interrupt_now';
      difficulty = (i % 5 === 0) ? 'adversarial' : (i % 2 === 0 ? 'hard' : 'normal');
      reason = 'High-consequence or time-critical event requiring immediate attention';
    } else if (mod === 1) {
      // show_soon
      template = (ctx === 'idle' || ctx === 'gaming')
        ? teammateWorkEvents[i % teammateWorkEvents.length]
        : urgentDeadlineEvents[i % urgentDeadlineEvents.length];
      expectedAction = (ctx === 'meeting' && template.source === 'slack') ? 'batch' : 'show_soon';
      difficulty = (i % 3 === 0) ? 'hard' : 'normal';
      reason = 'Relevant event that warrants notice soon without forceful interruption';
    } else if (mod === 2) {
      // batch
      template = teammateWorkEvents[(i + 2) % teammateWorkEvents.length];
      expectedAction = 'batch';
      difficulty = (i % 4 === 0) ? 'easy' : 'normal';
      reason = 'Valuable work event that can be processed in batch digest';
    } else {
      // silence
      template = (i % 2 === 0)
        ? socialAndChatEvents[i % socialAndChatEvents.length]
        : lowSignalMarketingEvents[i % lowSignalMarketingEvents.length];
      expectedAction = (ctx === 'idle') ? 'batch' : 'silence';
      difficulty = (i % 3 === 0) ? 'easy' : 'normal';
      reason = 'Low-signal or recreational event during productive/focused context';
    }

    scenarios.push({
      id: `evt-${String(idCounter++).padStart(4, '0')}`,
      context: ctx,
      event: {
        id: `e-${idCounter}`,
        timestamp: new Date().toISOString(),
        source: template.source,
        sender: template.sender,
        title: `${template.title} [ref ${i + 1}]`,
        body: template.body
      },
      expected_action: expectedAction,
      difficulty,
      reason
    });
  }
}

// Final check: exactly 400
console.log(`Generated ${scenarios.length} scenarios.`);
const byContext = {};
const byAction = {};
for (const s of scenarios) {
  byContext[s.context] = (byContext[s.context] || 0) + 1;
  byAction[s.expected_action] = (byAction[s.expected_action] || 0) + 1;
}
console.log('By context:', byContext);
console.log('By action:', byAction);

fs.writeFileSync(path.resolve('./data/events.json'), JSON.stringify(scenarios, null, 2));
console.log('Saved to ./data/events.json');
