import { getDb } from './db';
import type { NotificationLog } from './types';

export async function logNotification(
  ruleId: number,
  scheduleId: number,
  message: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `INSERT INTO notification_log (notification_rule_id, schedule_id, message, status, error_message)
          VALUES (?, ?, ?, ?, ?)`,
    args: [ruleId, scheduleId, message, status, errorMessage ?? null],
  });
}

export async function getNotificationLogs(
  limit: number = 50,
): Promise<(NotificationLog & { schedule_title: string })[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT nl.*, s.title AS schedule_title
          FROM notification_log nl
          INNER JOIN schedules s ON s.id = nl.schedule_id
          ORDER BY nl.sent_at DESC
          LIMIT ?`,
    args: [limit],
  });
  return result.rows as unknown as (NotificationLog & { schedule_title: string })[];
}
