import { getDb } from './db';
import type {
  NotificationRule,
  CreateNotificationRuleRequest,
  PendingNotification,
} from './types';

export function getNotificationRules(scheduleId?: number): NotificationRule[] {
  const db = getDb();

  if (scheduleId !== undefined) {
    const stmt = db.prepare('SELECT * FROM notification_rules WHERE schedule_id = ? ORDER BY minutes_before ASC');
    return stmt.all(scheduleId) as NotificationRule[];
  }

  const stmt = db.prepare('SELECT * FROM notification_rules ORDER BY schedule_id ASC, minutes_before ASC');
  return stmt.all() as NotificationRule[];
}

export function createNotificationRule(data: CreateNotificationRuleRequest): NotificationRule {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO notification_rules (schedule_id, minutes_before, message_template)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    data.schedule_id,
    data.minutes_before,
    data.message_template,
  );

  const created = db.prepare('SELECT * FROM notification_rules WHERE id = ?')
    .get(Number(result.lastInsertRowid)) as NotificationRule;

  return created;
}

export function updateNotificationRule(
  id: number,
  data: Partial<CreateNotificationRuleRequest>,
): NotificationRule | undefined {
  const db = getDb();

  const existing = db.prepare('SELECT * FROM notification_rules WHERE id = ?')
    .get(id) as NotificationRule | undefined;

  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.schedule_id !== undefined) {
    fields.push('schedule_id = ?');
    values.push(data.schedule_id);
  }
  if (data.minutes_before !== undefined) {
    fields.push('minutes_before = ?');
    values.push(data.minutes_before);
  }
  if (data.message_template !== undefined) {
    fields.push('message_template = ?');
    values.push(data.message_template);
  }

  if (fields.length === 0) {
    return existing;
  }

  values.push(id);

  const stmt = db.prepare(`UPDATE notification_rules SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return db.prepare('SELECT * FROM notification_rules WHERE id = ?')
    .get(id) as NotificationRule;
}

export function deleteNotificationRule(id: number): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM notification_rules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function getSchedulesWithNotificationsForNow(
  dayOfWeek: number,
  currentTime: string,
): PendingNotification[] {
  const db = getDb();

  const stmt = db.prepare(`
    SELECT
      nr.id AS rule_id,
      s.id AS schedule_id,
      s.title,
      s.location,
      nr.minutes_before,
      nr.message_template
    FROM schedules s
    INNER JOIN notification_rules nr ON nr.schedule_id = s.id
    WHERE s.day_of_week = ?
      AND s.is_active = 1
      AND nr.is_active = 1
      AND time(s.start_time, '-' || nr.minutes_before || ' minutes') = ?
  `);

  return stmt.all(dayOfWeek, currentTime) as PendingNotification[];
}
