import { migrate, getSchemaVersion } from './migrations';

export const DATABASE_NAME = 'sehat.db';

/** Passed to <SQLiteProvider onInit>: runs once when the database opens. */
export async function initDatabase(db) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await migrate(db);
}

/** Small health check for the home screen. */
export async function databaseStatus(db) {
  const version = await getSchemaVersion(db);
  const rows = await db.getAllAsync(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  );
  return { version, tables: rows.map((r) => r.name) };
}
