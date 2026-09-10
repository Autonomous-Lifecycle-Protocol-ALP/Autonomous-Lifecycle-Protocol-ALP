/**
 * ALP Collaboration — activity feed for agent runs, policy decisions, and team edits.
 */

import { ActivityEvent, ActivityType } from './types';

export class ActivityFeed {
  activities: ActivityEvent[] = [];
  private activityCounter = 0;

  /**
   * Log an activity event to the feed.
   */
  logActivity(docId: string, type: ActivityType, actorId: string, payload: Record<string, any>): ActivityEvent {
    const event: ActivityEvent = {
      id: `activity-${++this.activityCounter}`,
      docId,
      type,
      actorId,
      timestamp: Date.now(),
      payload,
    };
    this.activities.push(event);
    return event;
  }

  /**
   * Get activity feed for a document, optionally filtered by type and actor.
   */
  getActivityFeed(docId: string, type?: ActivityType, actorId?: string): ActivityEvent[] {
    return this.activities.filter(a => {
      if (a.docId !== docId) return false;
      if (type && a.type !== type) return false;
      if (actorId && a.actorId !== actorId) return false;
      return true;
    });
  }

  getActivityCounter(): number {
    return this.activityCounter;
  }

  setActivityCounter(n: number): void {
    this.activityCounter = n;
  }

  serializeActivities(): ActivityEvent[] {
    return this.activities;
  }

  restoreActivities(activities: ActivityEvent[]): void {
    this.activities = activities || [];
  }
}
