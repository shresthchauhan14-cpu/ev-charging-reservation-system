import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface Queryable {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

class DatabaseAdapter implements Queryable {
  private pgPool: pg.Pool | null = null;
  private pgliteInstance: PGlite | null = null;
  private isInitialized = false;
  private mode: 'pg' | 'pglite' = 'pglite';

  async init(): Promise<void> {
    if (this.isInitialized) return;

    const databaseUrl = process.env.DATABASE_URL?.trim();

    if (databaseUrl && databaseUrl.startsWith('postgres')) {
      try {
        console.log('[Database] Attempting connection to external PostgreSQL server...');
        const pool = new pg.Pool({
          connectionString: databaseUrl,
          connectionTimeoutMillis: 3000,
          max: 10,
        });
        // Test connection
        await pool.query('SELECT 1');
        this.pgPool = pool;
        this.mode = 'pg';
        this.isInitialized = true;
        console.log('[Database] Connected to external PostgreSQL database successfully.');
        return;
      } catch (err) {
        console.warn('[Database] External PostgreSQL unavailable, falling back to embedded PostgreSQL 16 (PGlite)...', (err as Error).message);
      }
    }

    // Embedded PostgreSQL 16 mode
    const dbDir = process.env.DATABASE_DIR || path.resolve(process.cwd(), '../database/pgdata');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    console.log(`[Database] Initializing persistent PostgreSQL 16 engine at: ${dbDir}`);
    this.pgliteInstance = new PGlite(dbDir);
    await this.pgliteInstance.waitReady;
    this.mode = 'pglite';
    this.isInitialized = true;
    console.log('[Database] Embedded PostgreSQL 16 engine ready.');
  }

  getEngineMode(): string {
    return this.mode === 'pg' ? 'PostgreSQL Server (External)' : 'PostgreSQL 16 Engine (Embedded PGlite)';
  }

  async exec(sql: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.mode === 'pg' && this.pgPool) {
      await this.pgPool.query(sql);
    } else if (this.pgliteInstance) {
      await this.pgliteInstance.exec(sql);
    } else {
      throw new Error('[Database] No active database connection.');
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.mode === 'pg' && this.pgPool) {
      const res = await this.pgPool.query(text, params);
      return {
        rows: res.rows as T[],
        rowCount: res.rowCount ?? 0,
      };
    } else if (this.pgliteInstance) {
      // PGlite uses $1, $2 params natively
      const res = await this.pgliteInstance.query<T>(text, params);
      return {
        rows: (res.rows || []) as T[],
        rowCount: res.rows?.length ?? (res.affectedRows ?? 0),
      };
    } else {
      throw new Error('[Database] No active database connection.');
    }
  }

  async transaction<T>(callback: (client: Queryable) => Promise<T>): Promise<T> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (this.mode === 'pg' && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const queryable: Queryable = {
          query: async <R = any>(sql: string, params?: any[]) => {
            const res = await client.query(sql, params);
            return { rows: res.rows as R[], rowCount: res.rowCount ?? 0 };
          },
        };
        const result = await callback(queryable);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } else if (this.pgliteInstance) {
      return await this.pgliteInstance.transaction(async (tx) => {
        const queryable: Queryable = {
          query: async <R = any>(sql: string, params?: any[]) => {
            const res = await tx.query<R>(sql, params);
            return {
              rows: (res.rows || []) as R[],
              rowCount: res.rows?.length ?? (res.affectedRows ?? 0),
            };
          },
        };
        return await callback(queryable);
      });
    } else {
      throw new Error('[Database] No active database connection.');
    }
  }

  async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
    }
    if (this.pgliteInstance) {
      await this.pgliteInstance.close();
      this.pgliteInstance = null;
    }
    this.isInitialized = false;
  }
}

export const db = new DatabaseAdapter();
