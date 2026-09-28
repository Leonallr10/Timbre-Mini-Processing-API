/**
 * Creates the application database/user if they do not exist.
 *
 * Usage (PowerShell):
 *   $env:POSTGRES_ADMIN_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/postgres"
 *   npm run setup:db
 *
 * Then:
 *   npm run migrate
 *   npm start
 */
require('dotenv').config();
const { Client } = require('pg');

const adminUrl =
  process.env.POSTGRES_ADMIN_URL ||
  process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/postgres');

const appDb = 'timbre';
const appUser = 'timbre';
const appPassword = 'timbre';

async function main() {
  if (!adminUrl) {
    console.error('Set POSTGRES_ADMIN_URL or DATABASE_URL first.');
    process.exit(1);
  }

  console.log('Connecting as admin to create role/database...');
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  try {
    const role = await client.query(
      `SELECT 1 FROM pg_roles WHERE rolname = $1`,
      [appUser]
    );
    if (role.rowCount === 0) {
      await client.query(
        `CREATE ROLE ${appUser} LOGIN PASSWORD '${appPassword}'`
      );
      console.log(`Created role "${appUser}"`);
    } else {
      console.log(`Role "${appUser}" already exists`);
    }

    const db = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [appDb]
    );
    if (db.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${appDb} OWNER ${appUser}`
      );
      console.log(`Created database "${appDb}"`);
    } else {
      console.log(`Database "${appDb}" already exists`);
    }

    console.log('Done. Ensure DATABASE_URL=postgresql://timbre:timbre@localhost:5432/timbre');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('setup:db failed:', err.message);
  console.error(
    'Hint: set POSTGRES_ADMIN_URL to your postgres superuser connection string.'
  );
  process.exit(1);
});
