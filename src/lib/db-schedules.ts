import { getDb } from './db';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from './types';

export function getAllSchedules(dayFilter?: number): Schedule[] {
  const db = getDb();

  if (dayFilter !== undefined) {
    const stmt = db.prepare('SELECT * FROM schedules WHERE day_of_week = ? ORDER BY start_time ASC');
    return stmt.all(dayFilter) as Schedule[];
  }

  const stmt = db.prepare('SELECT * FROM schedules ORDER BY day_of_week ASC, start_time ASC');
  return stmt.all() as Schedule[];
}

export function getScheduleById(id: number): Schedule | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM schedules WHERE id = ?');
  return stmt.get(id) as Schedule | undefined;
}

export function createSchedule(data: CreateScheduleRequest): Schedule {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO schedules (title, type, day_of_week, start_time, end_time, location, color, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.title,
    data.type,
    data.day_of_week,
    data.start_time,
    data.end_time,
    data.location ?? null,
    data.color ?? '#3B82F6',
    data.notes ?? null,
  );

  return getScheduleById(Number(result.lastInsertRowid)) as Schedule;
}

export function updateSchedule(id: number, data: UpdateScheduleRequest): Schedule | undefined {
  const db = getDb();

  const existing = getScheduleById(id);
  if (!existing) {
    return undefined;
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) {
    fields.push('title = ?');
    values.push(data.title);
  }
  if (data.type !== undefined) {
    fields.push('type = ?');
    values.push(data.type);
  }
  if (data.day_of_week !== undefined) {
    fields.push('day_of_week = ?');
    values.push(data.day_of_week);
  }
  if (data.start_time !== undefined) {
    fields.push('start_time = ?');
    values.push(data.start_time);
  }
  if (data.end_time !== undefined) {
    fields.push('end_time = ?');
    values.push(data.end_time);
  }
  if (data.location !== undefined) {
    fields.push('location = ?');
    values.push(data.location);
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    values.push(data.color);
  }
  if (data.notes !== undefined) {
    fields.push('notes = ?');
    values.push(data.notes);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(data.is_active);
  }

  if (fields.length === 0) {
    return existing;
  }

  fields.push("updated_at = datetime('now','localtime')");
  values.push(id);

  const stmt = db.prepare(`UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getScheduleById(id);
}

export function deleteSchedule(id: number): boolean {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM schedules WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}
