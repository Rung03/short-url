// Creates the database (if missing) and runs db/schema.sql, then prints the tables.
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { dbConfig } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbName = process.env.DB_NAME || 'shorturl';

// 1) Create the database from the default "postgres" database.
//    Hosted providers (DATABASE_URL) already give you a database, so skip it.
if (!process.env.DATABASE_URL) {
  const admin = new pg.Client(dbConfig('postgres'));
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (rowCount === 0) {
      await admin.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Created database "${dbName}".`);
    }
  } finally {
    await admin.end();
  }
}

// 2) Create tables, then show them
const client = new pg.Client(dbConfig(dbName));
await client.connect();
try {
  const schema = await fs.readFile(path.join(__dirname, '../db/schema.sql'), 'utf8');
  await client.query(schema);
  console.log(`Database "${dbName}" ready.\n`);

  const { rows: tables } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  for (const { table_name } of tables) {
    const { rows } = await client.query(
      `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position`,
      [table_name]
    );
    console.log(`Table: ${table_name}`);
    console.table(rows);
  }
} finally {
  await client.end();
}
