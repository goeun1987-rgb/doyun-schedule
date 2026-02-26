import { getDb } from './db';
import type {
  NotificationRule,
  CreateNotificationRuleRequest,
  PendingNotification,
} from './types';

export async function getNotificationRules(scheduleId?: number): Promise<NotificationRule[]> {
  const db = getDb();

  if (scheduleId !== undefined) {
    const result = await db.execute({
      sql: 'SELECT * FROM notification_rules WHERE schedule_id = ? ORDER BY minutes_before ASC',
      args: [scheduleId],
    });
    return result.rows as unknown as NotificationRule[];
  }

  const result = await db.execute('SELECT * FROM notification_rules ORDER BY schedule_id ASC, minutes_before ASC');
  return result.rows as unknown as NotificationRule[];
}

export async function createNotificationRule(data: CreateNotificationRuleRequest): Promise<NotificationRule> {
  const db = getDb();
  const result = await db.execute({
    sql: `INSERT INTO notification_rules (schedule_id, minutes_before, message_template) VALUES (?, ?, ?)`,
    args: [data.schedule_id, data.minutes_before, data.message_template],
  });

  const created = await db.execute({
    sql: 'SELECT * FROM notification_rules WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  });
  return created.rows[0] as unknown as NotificationRule;
}

export async function deleteNotificationRule(id: number): Promise<boolean> {
  const db = getDb();
  const result = await db.execute({ sql: 'DELETE FROM notification_rules WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

export async function getSchedulesWithNotificationsForNow(
  dayOfWeek: number,
  currentTime: string,
): Promise<PendingNotification[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT
            nr.id AS rule_id, s.id AS schedule_id, s.title, s.location,
            nr.minutes_before, nr.message_template
          FROM schedules s
          INNER JOIN notification_rules nr ON nr.schedule_id = s.id
          WHERE s.day_of_week = ? AND s.is_active = 1 AND nr.is_active = 1
            AND time(s.start_time, '-' || nr.minutes_before || ' minutes') = ?`,
    args: [dayOfWeek, currentTime],
  });
  return result.rows as unknown as PendingNotification[];
}
