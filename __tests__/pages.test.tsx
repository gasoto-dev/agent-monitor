import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))

// Mock fetch for data API
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve({
    agents: [
      { name: "Planning Agent", role: "Planning", status: "idle", currentTask: "Monitoring queue", lastActive: new Date().toISOString(), color: "violet", icon: "🧠" },
      { name: "Builder Agent", role: "Implementation", status: "working", currentTask: "Building dashboard", lastActive: new Date().toISOString(), color: "blue", icon: "🔨" },
      { name: "QA Agent", role: "QA", status: "idle", currentTask: "Awaiting PR", lastActive: new Date().toISOString(), color: "green", icon: "🔬" },
    ],
    activities: [
      { id: 1, agent: "Builder Agent", action_type: "pr_opened", details: "Opened PR #1", pr_link: null, created_at: Date.now() },
    ],
    tasks: [
      { id: 1, title: "Build agent monitor", status: "in_progress", agent: "Builder Agent", pr_link: null, created_at: Date.now(), updated_at: Date.now() },
    ],
    metrics: { totalPRs: 8, totalTests: 400, tasksCompleted: 5, weeklyActivity: [{ date: "2026-03-14", count: 3 }] },
  }),
}) as jest.Mock

// Mock EventSource
class MockEventSource {
  onmessage: ((e: { data: string }) => void) | null = null
  close() {}
}
global.EventSource = MockEventSource as unknown as typeof EventSource

import DashboardPage from "@/app/page"

describe("DashboardPage", () => {
  it("renders header", async () => {
    render(<DashboardPage />)
    // Header brand is split across spans; check for the header element itself
    await waitFor(() => expect(document.querySelector("header")).toBeInTheDocument())
  })

  it("shows agent panel after load", async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByTestId("agent-panel")).toBeInTheDocument())
  })

  it("shows all 3 agents", async () => {
    render(<DashboardPage />)
    await waitFor(() => {
      // Agent names appear inside the agent panel cards
      expect(screen.getByTestId("agent-panel")).toBeInTheDocument()
      expect(screen.getAllByText(/Agent/).length).toBeGreaterThanOrEqual(3)
    })
  })

  it("shows metrics panel", async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByTestId("metrics-panel")).toBeInTheDocument())
  })

  it("shows activity feed", async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByTestId("activity-feed")).toBeInTheDocument())
  })

  it("shows task queue", async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByTestId("task-queue")).toBeInTheDocument())
  })

  it("shows PR count in metrics", async () => {
    render(<DashboardPage />)
    await waitFor(() => expect(screen.getByText("8")).toBeInTheDocument())
  })
})
