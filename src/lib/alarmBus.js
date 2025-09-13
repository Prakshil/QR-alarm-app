// Minimal event bus for alarm stop events
const listeners = new Set();

export function onAlarmStop(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAlarmStop() {
  for (const l of Array.from(listeners)) {
    try { l(); } catch {}
  }
}
