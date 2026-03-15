/**
 * @jest-environment node
 */
import { subscribe, broadcast } from "@/lib/sse"

describe("sse broadcast", () => {
  it("subscriber receives broadcast", () => {
    const received: string[] = []
    const unsub = subscribe((d) => received.push(d))
    broadcast({ type: "test" })
    expect(received).toHaveLength(1)
    unsub()
  })

  it("unsubscribed fn does not receive", () => {
    const received: string[] = []
    const unsub = subscribe((d) => received.push(d))
    unsub()
    broadcast({ type: "test2" })
    expect(received).toHaveLength(0)
  })

  it("multiple subscribers all receive", () => {
    const r1: string[] = [], r2: string[] = []
    const u1 = subscribe((d) => r1.push(d))
    const u2 = subscribe((d) => r2.push(d))
    broadcast({ msg: "hello" })
    expect(r1).toHaveLength(1)
    expect(r2).toHaveLength(1)
    u1(); u2()
  })

  it("broadcast is no-op with no subscribers", () => {
    expect(() => broadcast({ x: 1 })).not.toThrow()
  })
})
