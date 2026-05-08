# ReGenAI
**For Samsung's Prism 2026 - Bengaluru**
**ReGenAI** is an OpenClaw-based Intelligent Agent designed to solve the "Implementation Void" in academic and professional engineering research. It serves as an autonomous bridge that transforms theoretical ArXiv research into functional engineering outcomes.

## Core Unique Selling Points (USPs)

- **Autonomous Research Discovery**: ReGenAI monitors ArXiv RSS feeds 24/7 to provide high-density summaries of the latest tech, specifically filtered for buildability.
- **The Feasibility Decision Engine**: It categorizes projects into `[BUILDABLE]`, `[PARTIALLY BUILDABLE]`, or `[HIGH COMPLEXITY]`, allowing engineers to avoid "Feasibility Blindness".
- **Automated Execution Roadmaps**: For every buildable idea, ReGenAI generates a 4-week Gantt-style timeline in Notion, complete with weekly milestones and resource tracking.
- **GitHub Bit-Rot Auditor**: Through the `/audit` command via Telegram, it assigns a numerical Build Feasibility Score (0-100) by scanning repository health and dependency structures.

## System Architecture

| Layer | Technology | Role |
|-------|------------|------|
| **Intelligence** | OpenAI GPT-4-Turbo | Strategic decision-making and semantic analysis. |
| **Automation** | Make.com | The "Central Nervous System" connecting APIs. |
| **Interface** | Vercel (Next.js) | Unified conversational web dashboard. |
| **Storage** | Notion | Persistent Memory System for long-term project tracking. |
| **Mobile** | Telegram Bot | Low-friction interface for real-time research alerts. |

## Booting the System

1. Clone this repository.
2. Duplicate `.env.example` to `.env` and fill in your API keys.
3. Start the engine: `node index.js`.
4. Run `node simulate.js` to view an offline mock run of the ReGenAI decision engine.
