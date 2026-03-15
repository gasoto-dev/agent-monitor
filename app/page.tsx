"use client"

import { useEffect, useState } from "react"
import type { AgentState } from "@/lib/agents"
import type { Activity, Task } from "@/lib/db"
import ActivityChart from "@/components/ActivityChart"

interface Metrics {
  totalPRs: number
  totalTests: number
  tasksCompleted: number
  weeklyActivity: { date: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-gray-500/20 text-gray-400 border-gray-500/20",
  working: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  done: "bg-green-500/20 text-green-400 border-green-500/20",
}
const STATUS_DOT: Record<string, string> = {
  idle: "bg-gray-400",
  working: "bg-blue-400 animate-pulse",
  done: "bg-green-400",
}
const TASK_COLORS: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-400",
  in_progress: "bg-blue-500/20 text-blue-300",
  done: "bg-green-500/20 text-green-400",
}
const ACTION_ICONS: Record<string, string> = {
  pr_opened: "🔀",
  pr_merged: "✅",
  tests_run: "🧪",
  task_started: "▶️",
  task_done: "✓",
  review: "🔬",
  deploy: "🚀",
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<AgentState[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((d) => {
        setAgents(d.agents)
        setActivities(d.activities)
        setTasks(d.tasks)
        setMetrics(d.metrics)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const es = new EventSource("/api/stream")
    es.onmessage = (e) => {
      try {
        const a = JSON.parse(e.data) as Activity
        if (a.id) setActivities((prev) => [a, ...prev].slice(0, 50))
      } catch { /* ignore heartbeats */ }
    }
    return () => es.close()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl tracking-tight">
            agent<span className="text-violet-400">monitor</span>
          </h1>
          <p className="text-white/30 text-xs mt-0.5">Real-time AI workflow dashboard</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Metrics strip */}
        {metrics && (
          <div className="grid grid-cols-3 gap-4" data-testid="metrics-panel">
            {[
              { label: "PRs Merged", value: metrics.totalPRs, icon: "🔀" },
              { label: "Tests Run", value: `${metrics.totalTests.toLocaleString()}+`, icon: "🧪" },
              { label: "Tasks Done", value: metrics.tasksCompleted, icon: "✅" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-2xl font-black">{value}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Agent status panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="agent-panel">
          {agents.map((agent) => (
            <div key={agent.name} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{agent.icon}</span>
                    <span className="font-bold text-sm">{agent.name}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5">{agent.role}</p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[agent.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[agent.status]}`} />
                  {agent.status}
                </span>
              </div>
              <div className="bg-black/30 rounded-lg px-3 py-2">
                <p className="text-xs text-white/60 truncate">{agent.currentTask}</p>
              </div>
              <p className="text-xs text-white/25 mt-2">
                Last active: {timeAgo(new Date(agent.lastActive).getTime())}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Activity feed */}
          <div className="lg:col-span-3 bg-white/5 border border-white/10 rounded-xl overflow-hidden" data-testid="activity-feed">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Activity Feed</h2>
              <span className="text-xs text-white/30">{activities.length} events</span>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-start gap-3 hover:bg-white/3 transition-colors">
                  <span className="text-base mt-0.5 flex-shrink-0">{ACTION_ICONS[a.action_type] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-violet-300">{a.agent}</span>
                      <span className="text-xs text-white/25">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5 truncate">{a.details}</p>
                    {a.pr_link && (
                      <a href={a.pr_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-0.5 inline-block">
                        View PR →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task queue */}
          <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl overflow-hidden" data-testid="task-queue">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-semibold">Task Queue</h2>
            </div>
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {tasks.map((t) => (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-white/70 leading-relaxed flex-1">{t.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${TASK_COLORS[t.status]}`}>
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-white/30">{t.agent}</span>
                    {t.pr_link && (
                      <a href={t.pr_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">
                        PR →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        {metrics && metrics.weeklyActivity.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5" data-testid="chart-panel">
            <h2 className="text-sm font-semibold mb-4">Activity — Last 14 Days</h2>
            <ActivityChart data={metrics.weeklyActivity} />
          </div>
        )}
      </div>
    </div>
  )
}
