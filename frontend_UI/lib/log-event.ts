export function logEvent(eventName: string, metadata?: Record<string, unknown>): void {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_name: eventName, metadata }),
  }).catch(() => {})
}
