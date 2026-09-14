import * as fs from 'fs';
import * as path from 'path';

// ─── Resource Subscription State ─────────────────────────────────────────
export const subscribers = new Map<string, Set<(uri: string) => void>>();
export let subscriptionTimer: NodeJS.Timeout | null = null;
export let lastEventLogSize = 0;

export function getResourceUri(resourcePath: string): string {
  return `file://${resourcePath.replace(/\\/g, '/')}`;
}

export function startSubscriptionPolling(rootDir: string) {
  if (subscriptionTimer) return;
  const logPath = path.join(rootDir, '.alp', '.runtime', 'log.jsonl');
  const eventsPath = path.join(rootDir, '.alp', '.events', 'events.jsonl');

  subscriptionTimer = setInterval(() => {
    try {
      let newEvents = false;
      if (fs.existsSync(eventsPath)) {
        const { size } = fs.statSync(eventsPath);
        if (size > lastEventLogSize) {
          lastEventLogSize = size;
          newEvents = true;
        }
      }
      if (fs.existsSync(logPath)) {
        const { size } = fs.statSync(logPath);
        if (size > lastEventLogSize) {
          lastEventLogSize = size;
          newEvents = true;
        }
      }
      if (newEvents && subscribers.size > 0) {
        for (const [, callbacks] of subscribers) {
          for (const cb of callbacks) {
            try { cb('alp://events'); } catch { /* best-effort */ }
          }
        }
      }
    } catch {
      /* best-effort polling */
    }
  }, 2000);
}

export function stopSubscriptionPolling() {
  if (subscriptionTimer) {
    clearInterval(subscriptionTimer);
    subscriptionTimer = null;
  }
}
