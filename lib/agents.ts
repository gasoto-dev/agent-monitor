export interface AgentState {
  name: string
  role: string
  status: "idle" | "working" | "done"
  currentTask: string
  lastActive: string
  color: string
  icon: string
}

// In-process agent state (demo — simulates real agent activity)
const agentStates: AgentState[] = [
  {
    name: "Planning Agent",
    role: "Planning & Specs",
    status: "idle",
    currentTask: "Monitoring queue",
    lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    color: "violet",
    icon: "🧠",
  },
  {
    name: "Builder Agent",
    role: "Implementation",
    status: "working",
    currentTask: "Building agent-monitor dashboard",
    lastActive: new Date().toISOString(),
    color: "blue",
    icon: "🔨",
  },
  {
    name: "QA Agent",
    role: "Quality Assurance",
    status: "idle",
    currentTask: "Awaiting PR #1",
    lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    color: "green",
    icon: "🔬",
  },
]

export function getAgents(): AgentState[] {
  return agentStates
}
