import { getActivities } from "@/lib/db"
import { subscribe } from "@/lib/sse"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Send last 30 activities on connect
      const existing = getActivities(30).reverse()
      for (const a of existing) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(a)}\n\n`))
      }

      const unsub = subscribe((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          unsub()
        }
      })

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
          unsub()
        }
      }, 30000)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
