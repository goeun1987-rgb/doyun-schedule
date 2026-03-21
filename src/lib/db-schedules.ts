import { getDb, initDb } from './db';
import type { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from './types';

async function ensureDb() {
  await initDb();
  return getDb();
}

export async function getAllSchedules(dayFilter?: number, scheduleType?: string): Promise<Schedule[]> {
  const db = await ensureDb();
  const type = scheduleType ?? 'regular';

  if (dayFilter !== undefined) {
    const result = await db.execute({
      sql: 'SELECT * FROM schedules WHERE day_of_week = ? AND schedule_type = ? ORDER BY start_time ASC',
      args: [dayFilter, type],
    });
    return result.rows as unknown as Schedule[];
  }

  const result = await db.execute({
    sql: 'SELECT * FROM schedules WHERE schedule_type = ? ORDER BY day_of_week ASC, start_time ASC',
    args: [type],
  });
  return result.rows as unknown as Schedule[];
}

export async function getScheduleById(id: number): Promise<Schedule | undefined> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'SELECT * FROM schedules WHERE id = ?', args: [id] });
  return (result.rows[0] as unknown as Schedule) ?? undefined;
}

export async function createSchedule(data: CreateScheduleRequest): Promise<Schedule> {
  const db = await ensureDb();

  const result = await db.execute({
    sql: `INSERT INTO schedules (title, type, schedule_type, day_of_week, start_time, end_time, location, color, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.title,
      data.type,
      data.schedule_type ?? 'regular',
      data.day_of_week,
      data.start_time,
      data.end_time,
      data.location ?? null,
      data.color ?? '#3B82F6',
      data.notes ?? null,
    ],
  });

  return (await getScheduleById(Number(result.lastInsertRowid)))!;
}

export async function updateSchedule(id: number, data: UpdateScheduleRequest): Promise<Schedule | undefined> {
  const db = await ensureDb();

  const existing = await getScheduleById(id);
  if (!existing) return undefined;

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
  if (data.day_of_week !== undefined) { fields.push('day_of_week = ?'); values.push(data.day_of_week); }
  if (data.start_time !== undefined) { fields.push('start_time = ?'); values.push(data.start_time); }
  if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location ?? null); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes ?? null); }
  if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }

  if (fields.length === 0) return existing;

  fields.push("updated_at = datetime('now','localtime')");
  values.push(id);

  await db.execute({
    sql: `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
    args: values,
  });

  return getScheduleById(id);
}

export async function deleteSchedule(id: number): Promise<boolean> {
  const db = await ensureDb();
  const result = await db.execute({ sql: 'DELETE FROM schedules WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
