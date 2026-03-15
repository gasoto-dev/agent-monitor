const subscribers = new Set<(data: string) => void>()

export function subscribe(fn: (data: string) => void): () => void {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

export function broadcast(data: unknown): void {
  const str = JSON.stringify(data)
  for (const fn of subscribers) fn(str)
}
