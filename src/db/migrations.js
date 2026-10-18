/**
 * Versioned schema. The database's PRAGMA user_version is the number of
 * migrations applied. Never edit a migration once it has shipped; add a new one.
 */

export const MIGRATIONS = [
  // 1: foundation tables
  `
  CREATE TABLE profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
    birth_date TEXT NOT NULL,
    height_cm REAL NOT NULL CHECK (height_cm > 0),
    weight_kg REAL NOT NULL CHECK (weight_kg > 0),
    goal TEXT NOT NULL CHECK (goal IN ('lose', 'maintain', 'gain')),
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE daily_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    steps INTEGER NOT NULL DEFAULT 0 CHECK (steps >= 0),
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    name TEXT NOT NULL,
    kcal INTEGER NOT NULL CHECK (kcal >= 0),
    meal TEXT CHECK (meal IN ('breakfast', 'lunch', 'dinner', 'snack')),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_food_entries_date ON food_entries (date);

  CREATE TABLE weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    weight_kg REAL NOT NULL CHECK (weight_kg > 0),
    created_at INTEGER NOT NULL
  );
  CREATE INDEX idx_weight_entries_date ON weight_entries (date);
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export async function getSchemaVersion(db) {
  const row = await db.getFirstAsync('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Bring the database up to SCHEMA_VERSION. Each step runs in its own
 * transaction, so a failure leaves the database at the last good version.
 * `db` only needs execAsync and getFirstAsync (expo-sqlite, or a test adapter).
 */
export async function migrate(db, migrations = MIGRATIONS) {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  let version = await getSchemaVersion(db);
  if (version > migrations.length) {
    throw new Error(`Database is version ${version}, but this app only knows ${migrations.length}. Update the app.`);
  }
  while (version < migrations.length) {
    await db.execAsync('BEGIN IMMEDIATE');
    try {
      version = await getSchemaVersion(db); // another connection may have migrated meanwhile
      if (version >= migrations.length) {
        await db.execAsync('COMMIT');
        break;
      }
      await db.execAsync(migrations[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1}`);
      await db.execAsync('COMMIT');
      version += 1;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }
  return version;
}
