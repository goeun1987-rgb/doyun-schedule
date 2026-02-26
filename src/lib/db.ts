import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;

export function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./data/schedule.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

export async function initDb() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS schedules (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT NOT NULL,
      type          TEXT NOT NULL DEFAULT 'academy',
      day_of_week   INTEGER NOT NULL,
      start_time    TEXT NOT NULL,
      end_time      TEXT NOT NULL,
      location      TEXT,
      color         TEXT DEFAULT '#3B82F6',
      notes         TEXT,
      is_active     INTEGER DEFAULT 1,
      created_at    TEXT DEFAULT (datetime('now','localtime')),
      updated_at    TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS notification_rules (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id       INTEGER NOT NULL,
      minutes_before    INTEGER NOT NULL DEFAULT 10,
      message_template  TEXT NOT NULL,
      is_active         INTEGER DEFAULT 1,
      created_at        TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id                    INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_rule_id  INTEGER NOT NULL,
      schedule_id           INTEGER NOT NULL,
      message               TEXT NOT NULL,
      status                TEXT NOT NULL DEFAULT 'pending',
      error_message         TEXT,
      sent_at               TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (notification_rule_id) REFERENCES notification_rules(id),
      FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('scheduler_active', 'true')`);
  await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('default_minutes_before', '10')`);
  await db.execute(`INSERT OR IGNORE INTO settings (key, value) VALUES ('timezone', 'Asia/Seoul')`);
}
