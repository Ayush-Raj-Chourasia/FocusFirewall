# FocusFirewall — Submission Summary

## Title
**FocusFirewall — Context-Aware Attention Routing with Jev**

## Tagline
Your computer already knows what arrived. FocusFirewall decides whether you need to see it now.

## Category
Triage and Routing / Human Attention

## Short Description
FocusFirewall uses Jev as a rapid System-1 decision layer between incoming digital events and human attention. Rather than another chatbot or email classifier, it evaluates both the raw event and the user's active context (Deep Work, Meeting, Studying, Gaming, Idle), asks typed questions (Choice, Score, Noul), enforces deterministic confidence gates, and routes each item to interrupt, show soon, batch, or silence. The project includes a replayable 400-scenario benchmark and an interactive technical operator console.

## Architecture Highlights
- **State -> Decision -> Code**: No conversational prose generation, no markdown parsing, and no pre-LLM event summarization.
- **Typed Question Set (`attention-v1`)**: Choice (Action), Score (0-4 Urgency), and Noul flags (Requires Action, High Consequence, Context Conflict).
- **Deterministic Confidence Policy**: Low-confidence silences are safely downgraded to batching; low-confidence interrupts are downgraded to show-soon banners.
- **Attention Budget Scarcity**: Tracks cognitive bandwidth credits and feeds remaining budget directly into the context payload.
- **Empirical 400-Scenario Evaluation**: 80 scenarios across 5 distinct human contexts measuring agreement, recall, false interruption rates, and P50/P95 response latency.

## Key Interaction
The core thesis is demonstrated in one interaction:
> The exact same notification (e.g. non-urgent Slack PR review) arrives under **Deep Work** and is routed to **BATCH**. Switch context to **MEETING**, and the decision shifts to **SILENCE**. Switch context to **IDLE**, and it shifts to **SHOW SOON**.
