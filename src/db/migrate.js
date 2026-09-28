/**
 * Lightweight migration runner — applies SQL files in order.
 * Usage: npm run migrate | npm run migrate:down
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('../config');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getApplied(client) {
  const { rows } = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return new Set(rows.map((r) => r.filename));
}

function listMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('.down.sql'))
    .sort();
}

async function migrateUp(client) {
  await ensureMigrationsTable(client);
  const applied = await getApplied(client);
  const files = listMigrationFiles();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  skip  ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`  apply ${file}`);
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
}

async function migrateDown(client) {
  await ensureMigrationsTable(client);
  const { rows } = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename DESC LIMIT 1'
  );
  if (rows.length === 0) {
    console.log('  nothing to roll back');
    return;
  }

  const file = rows[0].filename;
  const downFile = file.replace(/\.sql$/, '.down.sql');
  const downPath = path.join(MIGRATIONS_DIR, downFile);

  if (!fs.existsSync(downPath)) {
    throw new Error(`Missing down migration: ${downFile}`);
  }

  const sql = fs.readFileSync(downPath, 'utf8');
  console.log(`  revert ${file}`);
  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query('DELETE FROM schema_migrations WHERE filename = $1', [
      file,
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const down = process.argv.includes('--down');
  const pool = new Pool({ connectionString: config.databaseUrl });
  const client = await pool.connect();

  try {
    console.log(down ? 'Rolling back last migration...' : 'Running migrations...');
    if (down) {
      await migrateDown(client);
    } else {
      await migrateUp(client);
    }
    console.log('Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
