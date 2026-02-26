import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || './data/schedule.db';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.resolve(DB_PATH);
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS kakao_tokens (
      id                  INTEGER PRIMARY KEY CHECK (id = 1),
      access_token        TEXT NOT NULL,
      refresh_token       TEXT NOT NULL,
      access_expires_at   TEXT NOT NULL,
      refresh_expires_at  TEXT NOT NULL,
      updated_at          TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Insert default settings if not exist
  const insertSetting = db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`
  );
  insertSetting.run('scheduler_active', 'true');
  insertSetting.run('default_minutes_before', '10');
  insertSetting.run('timezone', 'Asia/Seoul');
}
