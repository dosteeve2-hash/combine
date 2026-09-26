/**
 * Applique db/schema.sql sur la base pointée par DATABASE_URL.
 * Idempotent : toutes les créations sont en `if not exists`.
 *
 *   npm run db:migrer
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const ici = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL est absent. Renseigne .env.local, puis relance.');
  process.exit(1);
}

const schema = readFileSync(join(ici, 'schema.sql'), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(schema);
  const { rows } = await client.query(
    `select table_name from information_schema.tables
      where table_schema = 'public' order by table_name`,
  );
  console.log(`Schéma appliqué. ${rows.length} tables :`);
  console.log(rows.map((r) => `  · ${r.table_name}`).join('\n'));
} catch (e) {
  console.error('Échec de la migration :', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
