import { NextResponse } from "next/server"
import { getActivities, getTasks, getMetrics, seedIfEmpty } from "@/lib/db"
import { getAgents } from "@/lib/agents"

export async function GET() {
  seedIfEmpty()
  return NextResponse.json({
    agents: getAgents(),
    activities: getActivities(30),
    tasks: getTasks(),
    metrics: getMetrics(),
  })
}
