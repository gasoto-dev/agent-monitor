/**
 * @jest-environment node
 */
process.env.DB_PATH = ":memory:"

// Re-import after setting env to get a fresh in-memory DB
let insertActivity: typeof import("@/lib/db").insertActivity
let getActivities: typeof import("@/lib/db").getActivities
let getTasks: typeof import("@/lib/db").getTasks
let getMetrics: typeof import("@/lib/db").getMetrics
let seedIfEmpty: typeof import("@/lib/db").seedIfEmpty

beforeAll(async () => {
  jest.resetModules()
  const mod = await import("@/lib/db")
  insertActivity = mod.insertActivity
  getActivities = mod.getActivities
  getTasks = mod.getTasks
  getMetrics = mod.getMetrics
  seedIfEmpty = mod.seedIfEmpty
})

describe("db — activities", () => {
  it("inserts and retrieves an activity", () => {
    const a = insertActivity({
      agent: "Builder Agent",
      action_type: "pr_opened",
      details: "Opened PR #1",
      pr_link: "https://github.com/test/repo/pull/1",
    })
    expect(a.id).toBeGreaterThan(0)
    expect(a.agent).toBe("Builder Agent")
    expect(a.created_at).toBeGreaterThan(0)
  })

  it("getActivities returns most recent first", () => {
    insertActivity({ agent: "QA Agent", action_type: "tests_run", details: "5 pass", pr_link: null })
    insertActivity({ agent: "Planning Agent", action_type: "task_started", details: "Started", pr_link: null })
    const acts = getActivities(10)
    expect(acts.length).toBeGreaterThanOrEqual(2)
    expect(acts[0].created_at).toBeGreaterThanOrEqual(acts[1].created_at)
  })

  it("getActivities respects limit", () => {
    const acts = getActivities(1)
    expect(acts.length).toBeLessThanOrEqual(1)
  })
})

describe("db — seed", () => {
  it("seedIfEmpty does not throw", () => {
    expect(() => seedIfEmpty()).not.toThrow()
  })

  it("seedIfEmpty is idempotent", () => {
    const before = getActivities(100).length
    seedIfEmpty()
    expect(getActivities(100).length).toBe(before)
  })

  it("getTasks returns an array", () => {
    expect(Array.isArray(getTasks())).toBe(true)
  })
})

describe("db — metrics", () => {
  it("returns numeric metrics", () => {
    const m = getMetrics()
    expect(typeof m.totalPRs).toBe("number")
    expect(typeof m.tasksCompleted).toBe("number")
    expect(typeof m.totalTests).toBe("number")
  })

  it("weeklyActivity is an array", () => {
    expect(Array.isArray(getMetrics().weeklyActivity)).toBe(true)
  })
})
