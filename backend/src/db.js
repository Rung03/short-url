import pg from 'pg';

// DATABASE_URL (e.g. Neon in production) takes priority over the DB_* parts.
export function dbConfig(database = process.env.DB_NAME || 'shorturl') {
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL, ssl };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database,
    ssl,
  };
}

export const pool = new pg.Pool(dbConfig());
