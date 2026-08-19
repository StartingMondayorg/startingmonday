let isReady = false
const listeners = new Set<() => void>()

export function markPosthogClientReady() {
  isReady = true
  for (const listener of listeners) listener()
  listeners.clear()
}

export function onPosthogClientReady(listener: () => void) {
  if (isReady) {
    listener()
    return () => undefined
  }

  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}