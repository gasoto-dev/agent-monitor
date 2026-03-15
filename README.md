# Agent Monitor

Real-time multi-agent AI workflow dashboard. Displays agent activity, task queue, test counts, and PR status with live updates via SSE.

## What this demonstrates

Multi-agent AI systems are hard to observe in real time. Agent Monitor shows how you'd build a live operations dashboard for an AI crew — status indicators, activity feeds, task queues, and metrics charts — with Server-Sent Events pushing updates to the browser as they happen.

## Features

- **Agent status panel** — 3 agents (Planning / Builder / QA) with idle/working/done status and current task
- **Activity feed** — live scrolling log with action type icons, agent attribution, PR links, and relative timestamps
- **Metrics strip** — total PRs merged, tests run, tasks completed
- **Task queue** — pending/in-progress/done tasks with agent assignment and PR links
- **Area chart** — 14-day activity trend (Recharts)
- **SSE live updates** — new activity events push to all connected clients instantly
- **Seed data** — realistic 2-week mock history on first load (no config required)

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — the dashboard seeds itself with mock data on first run.

## Architecture

```
Browser → GET / (dashboard page)
               │
               ├── GET /api/data (agents + activities + tasks + metrics, one-shot)
               │         │
               │    SQLite (agent-monitor.db) ← seedIfEmpty() on first load
               │
               └── GET /api/stream (SSE — new activity events pushed live)
                         │
                    lib/sse.ts (in-process subscriber registry)
```

### SSE model

`lib/sse.ts` is a lightweight in-process pub/sub using a `Set<fn>`. When new activity is inserted via `insertActivity()`, `broadcast()` fires all connected SSE clients instantly. The stream endpoint sends the last 30 activities on connect, then live events.

### Seed data

`seedIfEmpty()` (called on first `GET /api/data`) inserts 18 realistic activities and 6 tasks spanning 14 days — PRs opened/merged, tests run, deploys, task completions. Subsequent calls are no-ops.

## Testing

```bash
npm test
```

27 tests: DB operations (8), agent state (4), SSE pub/sub (4), API route (4), page smoke tests (7).
