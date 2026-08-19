let isReady = false
const listeners = new Set<() => void>()
const READY_EVENT = 'startingmonday:posthog-ready'

type PosthogReadyWindow = Window & {
  __startingMondayPosthogReady?: boolean
}

function getBrowserWindow(): PosthogReadyWindow | undefined {
  return typeof window === 'undefined' ? undefined : window
}

export function markPosthogClientReady() {
  isReady = true
  const browserWindow = getBrowserWindow()
  if (browserWindow) {
    browserWindow.__startingMondayPosthogReady = true
    browserWindow.dispatchEvent(new Event(READY_EVENT))
  }
  for (const listener of listeners) listener()
  listeners.clear()
}

export function onPosthogClientReady(listener: () => void) {
  const browserWindow = getBrowserWindow()
  if (isReady || browserWindow?.__startingMondayPosthogReady) {
    listener()
    return () => undefined
  }

  if (browserWindow) {
    browserWindow.addEventListener(READY_EVENT, listener, { once: true })
    return () => browserWindow.removeEventListener(READY_EVENT, listener)
  }

  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}