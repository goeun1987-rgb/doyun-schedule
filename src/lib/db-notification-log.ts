import { getDb } from './db';
import type { NotificationLog } from './types';

export function logNotification(
  ruleId: number,
  scheduleId: number,
  message: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO notification_log (notification_rule_id, schedule_id, message, status, error_message)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(ruleId, scheduleId, message, status, errorMessage ?? null);
}

export function getNotificationLogs(
  limit: number = 50,
): (NotificationLog & { schedule_title: string })[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      nl.*,
      s.title AS schedule_title
    FROM notification_log nl
    INNER JOIN schedules s ON s.id = nl.schedule_id
    ORDER BY nl.sent_at DESC
    LIMIT ?
  `);

  return stmt.all(limit) as (NotificationLog & { schedule_title: string })[];
}
