import { migrate, getSchemaVersion, SCHEMA_VERSION } from '../migrations';

// Node's built-in SQLite (Node 22+) stands in for expo-sqlite here.
let DatabaseSync = null;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch {
  // Older Node: these tests are skipped.
}

function openTestDb() {
  const raw = new DatabaseSync(':memory:');
  return {
    raw,
    execAsync: async (sql) => raw.exec(sql),
    getFirstAsync: async (sql) => raw.prepare(sql).get(),
  };
}

const describeIfSqlite = DatabaseSync ? describe : describe.skip;

describeIfSqlite('migrate', () => {
  it('creates the foundation tables and sets user_version', async () => {
    const db = openTestDb();
    expect(await migrate(db)).toBe(SCHEMA_VERSION);
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const tables = db.raw
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((r) => r.name);
    expect(tables).toEqual(['daily_activity', 'food_entries', 'profile', 'weight_entries']);
  });

  it('is safe to run twice', async () => {
    const db = openTestDb();
    await migrate(db);
    expect(await migrate(db)).toBe(SCHEMA_VERSION);
  });

  it('keeps one activity row per date', async () => {
    const db = openTestDb();
    await migrate(db);
    db.raw.exec("INSERT INTO daily_activity (date, steps, updated_at) VALUES ('2026-10-18', 100, 0)");
    expect(() =>
      db.raw.exec("INSERT INTO daily_activity (date, steps, updated_at) VALUES ('2026-10-18', 200, 0)"),
    ).toThrow(/UNIQUE/);
  });

  it('allows only one profile row and valid values', async () => {
    const db = openTestDb();
    await migrate(db);
    const insert = (id, sex) =>
      db.raw.exec(
        `INSERT INTO profile (id, sex, birth_date, height_cm, weight_kg, goal, created_at, updated_at)
         VALUES (${id}, '${sex}', '2000-01-01', 170, 70, 'maintain', 0, 0)`,
      );
    insert(1, 'male');
    expect(() => insert(2, 'male')).toThrow(/CHECK/);
    db.raw.exec('DELETE FROM profile');
    expect(() => insert(1, 'other')).toThrow(/CHECK/);
  });

  it('rolls back a failed step and leaves the version unchanged', async () => {
    const db = openTestDb();
    await migrate(db);
    const broken = ['SELECT 1', 'CREATE TABLE extra (id INTEGER); THIS IS NOT SQL;'];
    await expect(migrate(db, broken)).rejects.toThrow();
    expect(await getSchemaVersion(db)).toBe(SCHEMA_VERSION);
    const extra = db.raw.prepare("SELECT name FROM sqlite_master WHERE name = 'extra'").get();
    expect(extra).toBeUndefined();
  });

  it('refuses a database newer than the app', async () => {
    const db = openTestDb();
    db.raw.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
    await expect(migrate(db)).rejects.toThrow('Update the app');
  });
});
