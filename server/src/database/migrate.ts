import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.js';

export async function runMigrations(): Promise<void> {
  console.log('[Migration] Starting database migrations...');
  await db.init();
  console.log(`[Migration] Database Engine: ${db.getEngineMode()}`);

  const migrationsDir = path.resolve(process.cwd(), '../database/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`[Migration] Applying ${file}...`);
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Execute SQL script with exec for multi-command DDL
    await db.exec(sql);
    console.log(`[Migration] Successfully applied ${file}`);
  }

  console.log('[Migration] All migrations completed successfully.');
}

// If run directly via CLI
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Failed:', err);
      process.exit(1);
    });
}
