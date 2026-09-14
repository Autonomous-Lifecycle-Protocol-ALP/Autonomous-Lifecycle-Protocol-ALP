const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL || process.env.HYDRA_DATABASE_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL or HYDRA_DATABASE_URL to run migrations');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'migrations');
const files = fs.readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const pool = new Pool({ connectionString });

async function run() {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}...`);
    await pool.query(sql);
    console.log(`  OK`);
  }
  await pool.end();
  console.log('Migrations complete');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
