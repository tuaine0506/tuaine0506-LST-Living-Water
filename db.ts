import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';

// Interface for our database operations
export interface IDatabase {
  init(): Promise<void>;
  getSystemValue(key: string): Promise<string | null>;
  setSystemValue(key: string, value: string): Promise<void>;
  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | null>;
  insert(table: string, id: string, data: any): Promise<void>;
  update(table: string, id: string, data: any): Promise<void>;
  delete(table: string, id: string): Promise<void>;
  
  // Specific methods for verification codes and sessions
  saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void>;
  getVerificationCode(identifier: string): Promise<{ code: string, expires_at: number } | null>;
  deleteVerificationCode(identifier: string): Promise<void>;
  
  saveSession(token: string, expiresAt: number): Promise<void>;
  getSession(token: string): Promise<{ expires_at: number } | null>;
  deleteSession(token: string): Promise<void>;

  // Bulk operations
  bulkInsert(table: string, items: any[], idField: string): Promise<void>;

  // Custom queries
  hasOrderForIdentifier(identifier: string): Promise<boolean>;
}

class SQLiteDB implements IDatabase {
  private db: Database.Database;

  constructor() {
    const DB_FILE = path.join(process.cwd(), 'database.sqlite');
    this.db = new Database(DB_FILE);
  }

  async init(): Promise<void> {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS ingredients (name TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS volunteers (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS availability (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS verification_codes (identifier TEXT PRIMARY KEY, code TEXT, expires_at INTEGER);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires_at INTEGER);
    `);
  }

  async hasOrderForIdentifier(identifier: string): Promise<boolean> {
    const row = this.db.prepare(`
      SELECT 1 FROM orders 
      WHERE json_extract(data, '$.customerEmail') = ? 
      OR json_extract(data, '$.customerContact') = ?
    `).get(identifier, identifier);
    return !!row;
  }

  async getSystemValue(key: string): Promise<string | null> {
    const row = this.db.prepare('SELECT value FROM system WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  async setSystemValue(key: string, value: string): Promise<void> {
    this.db.prepare('INSERT OR REPLACE INTO system (key, value) VALUES (?, ?)').run(key, value);
  }

  async getAll<T>(table: string): Promise<T[]> {
    const rows = this.db.prepare(`SELECT data FROM ${table}`).all() as { data: string }[];
    return rows.map(row => JSON.parse(row.data));
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const idField = table === 'ingredients' ? 'name' : 'id';
    const row = this.db.prepare(`SELECT data FROM ${table} WHERE ${idField} = ?`).get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  }

  async insert(table: string, id: string, data: any): Promise<void> {
    const idField = table === 'ingredients' ? 'name' : 'id';
    this.db.prepare(`INSERT OR REPLACE INTO ${table} (${idField}, data) VALUES (?, ?)`).run(id, JSON.stringify(data));
  }

  async update(table: string, id: string, data: any): Promise<void> {
    const idField = table === 'ingredients' ? 'name' : 'id';
    this.db.prepare(`UPDATE ${table} SET data = ? WHERE ${idField} = ?`).run(JSON.stringify(data), id);
  }

  async delete(table: string, id: string): Promise<void> {
    const idField = table === 'ingredients' ? 'name' : 'id';
    this.db.prepare(`DELETE FROM ${table} WHERE ${idField} = ?`).run(id);
  }

  async saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void> {
    this.db.prepare('INSERT OR REPLACE INTO verification_codes (identifier, code, expires_at) VALUES (?, ?, ?)').run(identifier, code, expiresAt);
  }

  async getVerificationCode(identifier: string): Promise<{ code: string, expires_at: number } | null> {
    return this.db.prepare('SELECT * FROM verification_codes WHERE identifier = ?').get(identifier) as any;
  }

  async deleteVerificationCode(identifier: string): Promise<void> {
    this.db.prepare('DELETE FROM verification_codes WHERE identifier = ?').run(identifier);
  }

  async saveSession(token: string, expiresAt: number): Promise<void> {
    this.db.prepare('INSERT INTO sessions (token, expires_at) VALUES (?, ?)').run(token, expiresAt);
  }

  async getSession(token: string): Promise<{ expires_at: number } | null> {
    return this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
  }

  async deleteSession(token: string): Promise<void> {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  async bulkInsert(table: string, items: any[], idField: string): Promise<void> {
    const insert = this.db.prepare(`INSERT OR REPLACE INTO ${table} (${idField}, data) VALUES (?, ?)`);
    const transaction = this.db.transaction((items) => {
      for (const item of items) insert.run(item[idField], JSON.stringify(item));
    });
    transaction(items);
  }
}

class PostgresDB implements IDatabase {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false } // Required for many cloud providers
    });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS system (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS ingredients (name TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS volunteers (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS availability (id TEXT PRIMARY KEY, data TEXT);
      CREATE TABLE IF NOT EXISTS verification_codes (identifier TEXT PRIMARY KEY, code TEXT, expires_at BIGINT);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires_at BIGINT);
    `);
  }

  async getSystemValue(key: string): Promise<string | null> {
    const res = await this.pool.query('SELECT value FROM system WHERE key = $1', [key]);
    return res.rows[0]?.value || null;
  }

  async setSystemValue(key: string, value: string): Promise<void> {
    await this.pool.query(`
      INSERT INTO system (key, value) VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, value]);
  }

  async getAll<T>(table: string): Promise<T[]> {
    // Sanitize table name to prevent SQL injection (though this is internal use)
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');
    
    const res = await this.pool.query(`SELECT data FROM ${table}`);
    return res.rows.map(row => JSON.parse(row.data));
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');
    
    const idField = table === 'ingredients' ? 'name' : 'id';
    const res = await this.pool.query(`SELECT data FROM ${table} WHERE ${idField} = $1`, [id]);
    return res.rows[0] ? JSON.parse(res.rows[0].data) : null;
  }

  async insert(table: string, id: string, data: any): Promise<void> {
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');

    const idField = table === 'ingredients' ? 'name' : 'id';
    await this.pool.query(`
      INSERT INTO ${table} (${idField}, data) VALUES ($1, $2)
      ON CONFLICT (${idField}) DO UPDATE SET data = $2
    `, [id, JSON.stringify(data)]);
  }

  async update(table: string, id: string, data: any): Promise<void> {
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');

    const idField = table === 'ingredients' ? 'name' : 'id';
    await this.pool.query(`UPDATE ${table} SET data = $1 WHERE ${idField} = $2`, [JSON.stringify(data), id]);
  }

  async delete(table: string, id: string): Promise<void> {
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');

    const idField = table === 'ingredients' ? 'name' : 'id';
    await this.pool.query(`DELETE FROM ${table} WHERE ${idField} = $1`, [id]);
  }

  async saveVerificationCode(identifier: string, code: string, expiresAt: number): Promise<void> {
    await this.pool.query(`
      INSERT INTO verification_codes (identifier, code, expires_at) VALUES ($1, $2, $3)
      ON CONFLICT (identifier) DO UPDATE SET code = $2, expires_at = $3
    `, [identifier, code, expiresAt]);
  }

  async getVerificationCode(identifier: string): Promise<{ code: string, expires_at: number } | null> {
    const res = await this.pool.query('SELECT * FROM verification_codes WHERE identifier = $1', [identifier]);
    if (!res.rows[0]) return null;
    return {
      code: res.rows[0].code,
      expires_at: parseInt(res.rows[0].expires_at) // Convert BIGINT string to number
    };
  }

  async deleteVerificationCode(identifier: string): Promise<void> {
    await this.pool.query('DELETE FROM verification_codes WHERE identifier = $1', [identifier]);
  }

  async saveSession(token: string, expiresAt: number): Promise<void> {
    await this.pool.query('INSERT INTO sessions (token, expires_at) VALUES ($1, $2)', [token, expiresAt]);
  }

  async getSession(token: string): Promise<{ expires_at: number } | null> {
    const res = await this.pool.query('SELECT * FROM sessions WHERE token = $1', [token]);
    if (!res.rows[0]) return null;
    return {
      expires_at: parseInt(res.rows[0].expires_at)
    };
  }

  async deleteSession(token: string): Promise<void> {
    await this.pool.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  async bulkInsert(table: string, items: any[], idField: string): Promise<void> {
    const validTables = ['products', 'orders', 'ingredients', 'volunteers', 'availability'];
    if (!validTables.includes(table)) throw new Error('Invalid table');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        await client.query(`
          INSERT INTO ${table} (${idField}, data) VALUES ($1, $2)
          ON CONFLICT (${idField}) DO UPDATE SET data = $2
        `, [item[idField], JSON.stringify(item)]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async hasOrderForIdentifier(identifier: string): Promise<boolean> {
    const res = await this.pool.query(`
      SELECT 1 FROM orders 
      WHERE data->>'customerEmail' = $1 
      OR data->>'customerContact' = $1
    `, [identifier]);
    return (res.rowCount || 0) > 0;
  }
}

// Factory function to create the appropriate database instance
export const getDatabase = (): IDatabase => {
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database');
    return new PostgresDB(process.env.DATABASE_URL);
  } else {
    console.log('Using SQLite database');
    return new SQLiteDB();
  }
};

export const db = getDatabase();
