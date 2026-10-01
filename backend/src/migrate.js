import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../db/schema.sql');

// schema.sql only uses CREATE ... IF NOT EXISTS, so running it on every start is safe.
export async function migrate(client) {
  const schema = await fs.readFile(schemaPath, 'utf8');
  await client.query(schema);
}
