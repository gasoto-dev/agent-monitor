import Database from "better-sqlite3"
import path from "path"

export type AgentStatus = "idle" | "working" | "done"
export type ActionType = "pr_opened" | "pr_merged" | "tests_run" | "task_started" | "task_done" | "review" | "deploy"
export type TaskStatus = "pending" | "in_progress" | "done"

export interface Activity {
  id: number
  agent: string
  action_type: ActionType
  details: string
  pr_link: string | null
  created_at: number
}

export interface Task {
  id: number
  title: string
  status: TaskStatus
  agent: string
  pr_link: string | null
  created_at: number
  updated_at: number
}

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "agent-monitor.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
    db.exec(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent TEXT NOT NULL,
        action_type TEXT NOT NULL,
        details TEXT NOT NULL,
        pr_link TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        agent TEXT NOT NULL,
        pr_link TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
  }
  return db
}

export function getActivities(limit = 50): Activity[] {
  return getDb()
    .prepare("SELECT * FROM activities ORDER BY created_at DESC LIMIT ?")
    .all(limit) as Activity[]
}

export function insertActivity(a: Omit<Activity, "id" | "created_at">): Activity {
  const db = getDb()
  const created_at = Date.now()
  const result = db.prepare(`
    INSERT INTO activities (agent, action_type, details, pr_link, created_at)
    VALUES (@agent, @action_type, @details, @pr_link, @created_at)
  `).run({ ...a, created_at })
  return { id: Number(result.lastInsertRowid), ...a, created_at }
}

export function getTasks(): Task[] {
  return getDb()
    .prepare("SELECT * FROM tasks ORDER BY updated_at DESC")
    .all() as Task[]
}

export function getMetrics(): { totalPRs: number; totalTests: number; tasksCompleted: number; weeklyActivity: { date: string; count: number }[] } {
  const db = getDb()
  const totalPRs = (db.prepare("SELECT COUNT(*) as c FROM activities WHERE action_type IN ('pr_merged', 'pr_opened')").get() as { c: number }).c
  const totalTests = (db.prepare("SELECT COUNT(*) as c FROM activities WHERE action_type = 'tests_run'").get() as { c: number }).c * 50 // mock multiplier
  const tasksCompleted = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status = 'done'").get() as { c: number }).c
  const weeklyActivity = db.prepare(`
    SELECT date(created_at / 1000, 'unixepoch') as date, COUNT(*) as count
    FROM activities
    WHERE created_at > ?
    GROUP BY date ORDER BY date ASC
  `).all(Date.now() - 14 * 24 * 60 * 60 * 1000) as { date: string; count: number }[]
  return { totalPRs, totalTests, tasksCompleted, weeklyActivity }
}

// Seed realistic mock data
export function seedIfEmpty(): void {
  const db = getDb()
  const count = (db.prepare("SELECT COUNT(*) as c FROM activities").get() as { c: number }).c
  if (count > 0) return

  const now = Date.now()
  const day = 24 * 60 * 60 * 1000

  const activities: Omit<Activity, "id" | "created_at">[] = []
  const seededActivities = [
    { agent: "Planning Agent", action_type: "task_started" as ActionType, details: "Started: Design checkout flow spec", pr_link: null, daysAgo: 14 },
    { agent: "Builder Agent", action_type: "pr_opened" as ActionType, details: "Opened PR #1: scaffold Next.js app", pr_link: "https://github.com/gasoto-dev/checkout-demo/pull/1", daysAgo: 13 },
    { agent: "QA Agent", action_type: "tests_run" as ActionType, details: "8 tests pass on PR #1", pr_link: null, daysAgo: 13 },
    { agent: "Builder Agent", action_type: "pr_merged" as ActionType, details: "Merged PR #1: checkout foundation", pr_link: "https://github.com/gasoto-dev/checkout-demo/pull/1", daysAgo: 13 },
    { agent: "Planning Agent", action_type: "task_done" as ActionType, details: "Spec complete: Stripe integration", pr_link: null, daysAgo: 12 },
    { agent: "Builder Agent", action_type: "pr_opened" as ActionType, details: "Opened PR #2: Stripe checkout + SQLite", pr_link: "https://github.com/gasoto-dev/checkout-demo/pull/2", daysAgo: 11 },
    { agent: "QA Agent", action_type: "tests_run" as ActionType, details: "33 tests pass on PR #2", pr_link: null, daysAgo: 11 },
    { agent: "QA Agent", action_type: "review" as ActionType, details: "PR #2 PASS — all AC covered", pr_link: null, daysAgo: 11 },
    { agent: "Builder Agent", action_type: "pr_merged" as ActionType, details: "Merged PR #2: full checkout demo", pr_link: "https://github.com/gasoto-dev/checkout-demo/pull/2", daysAgo: 10 },
    { agent: "Builder Agent", action_type: "deploy" as ActionType, details: "Deployed checkout-demo to Vercel", pr_link: null, daysAgo: 10 },
    { agent: "Planning Agent", action_type: "task_started" as ActionType, details: "Started: Webhook Inspector spec", pr_link: null, daysAgo: 9 },
    { agent: "Builder Agent", action_type: "pr_opened" as ActionType, details: "Opened PR #1: webhook inspector (SSE + SQLite)", pr_link: "https://github.com/gasoto-dev/webhook-inspector/pull/1", daysAgo: 8 },
    { agent: "QA Agent", action_type: "tests_run" as ActionType, details: "24 tests pass on webhook-inspector", pr_link: null, daysAgo: 8 },
    { agent: "Builder Agent", action_type: "pr_merged" as ActionType, details: "Merged: webhook-inspector to main", pr_link: null, daysAgo: 7 },
    { agent: "Builder Agent", action_type: "deploy" as ActionType, details: "Deployed webhook-inspector to Vercel", pr_link: null, daysAgo: 7 },
    { agent: "Planning Agent", action_type: "task_started" as ActionType, details: "Started: Agent Monitor spec", pr_link: null, daysAgo: 5 },
    { agent: "Builder Agent", action_type: "pr_opened" as ActionType, details: "Opened PR #1: agent monitor dashboard", pr_link: "https://github.com/gasoto-dev/agent-monitor/pull/1", daysAgo: 1 },
    { agent: "QA Agent", action_type: "tests_run" as ActionType, details: "28 tests pass on agent-monitor", pr_link: null, daysAgo: 0 },
  ]

  const stmt = db.prepare(`
    INSERT INTO activities (agent, action_type, details, pr_link, created_at)
    VALUES (@agent, @action_type, @details, @pr_link, @created_at)
  `)
  for (const a of seededActivities) {
    stmt.run({ ...a, created_at: now - a.daysAgo * day })
  }

  const taskStmt = db.prepare(`
    INSERT INTO tasks (title, status, agent, pr_link, created_at, updated_at)
    VALUES (@title, @status, @agent, @pr_link, @created_at, @updated_at)
  `)
  const tasks = [
    { title: "Design checkout flow spec", status: "done", agent: "Planning Agent", pr_link: null, daysAgo: 14 },
    { title: "Build checkout demo (Stripe + SQLite)", status: "done", agent: "Builder Agent", pr_link: "https://github.com/gasoto-dev/checkout-demo/pull/2", daysAgo: 10 },
    { title: "QA gate: checkout-demo PR #2", status: "done", agent: "QA Agent", pr_link: null, daysAgo: 11 },
    { title: "Build webhook inspector", status: "done", agent: "Builder Agent", pr_link: null, daysAgo: 7 },
    { title: "Build agent monitor dashboard", status: "in_progress", agent: "Builder Agent", pr_link: "https://github.com/gasoto-dev/agent-monitor/pull/1", daysAgo: 1 },
    { title: "QA gate: agent-monitor PR #1", status: "pending", agent: "QA Agent", pr_link: null, daysAgo: 0 },
  ]
  for (const t of tasks) {
    taskStmt.run({ ...t, created_at: now - t.daysAgo * day, updated_at: now - t.daysAgo * day })
  }
}
