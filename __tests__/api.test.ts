/**
 * @jest-environment node
 */
jest.mock("@/lib/db", () => ({
  getActivities: jest.fn(() => []),
  getTasks: jest.fn(() => []),
  getMetrics: jest.fn(() => ({ totalPRs: 5, totalTests: 250, tasksCompleted: 4, weeklyActivity: [] })),
  seedIfEmpty: jest.fn(),
}))
jest.mock("@/lib/agents", () => ({
  getAgents: jest.fn(() => [
    { name: "Planning Agent", role: "Planning", status: "idle", currentTask: "Monitoring", lastActive: new Date().toISOString(), color: "violet", icon: "🧠" },
  ]),
}))

import { GET } from "@/app/api/data/route"

describe("GET /api/data", () => {
  it("returns 200", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("response includes agents, activities, tasks, metrics", async () => {
    const res = await GET()
    const json = await res.json()
    expect(json.agents).toBeDefined()
    expect(json.activities).toBeDefined()
    expect(json.tasks).toBeDefined()
    expect(json.metrics).toBeDefined()
  })

  it("metrics shape is correct", async () => {
    const res = await GET()
    const { metrics } = await res.json()
    expect(metrics.totalPRs).toBe(5)
    expect(metrics.totalTests).toBe(250)
    expect(metrics.tasksCompleted).toBe(4)
  })

  it("agents array is returned", async () => {
    const res = await GET()
    const { agents } = await res.json()
    expect(Array.isArray(agents)).toBe(true)
    expect(agents[0].name).toBe("Planning Agent")
  })
})
