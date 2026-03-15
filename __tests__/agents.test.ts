/**
 * @jest-environment node
 */
import { getAgents } from "@/lib/agents"

describe("agents", () => {
  it("returns 3 agents", () => {
    expect(getAgents()).toHaveLength(3)
  })

  it("all agents have required fields", () => {
    const agents = getAgents()
    for (const a of agents) {
      expect(a.name).toBeDefined()
      expect(a.role).toBeDefined()
      expect(["idle", "working", "done"]).toContain(a.status)
      expect(a.currentTask).toBeDefined()
      expect(a.lastActive).toBeDefined()
    }
  })

  it("Planning Agent is in the list", () => {
    const names = getAgents().map((a) => a.name)
    expect(names).toContain("Planning Agent")
    expect(names).toContain("Builder Agent")
    expect(names).toContain("QA Agent")
  })

  it("Builder Agent is working", () => {
    const builder = getAgents().find((a) => a.name === "Builder Agent")
    expect(builder?.status).toBe("working")
  })
})
