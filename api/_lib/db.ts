import { Pool } from 'pg';

function parseNumberEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Variavel de ambiente DATABASE_URL nao configurada.');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: parseNumberEnv(process.env.DB_POOL_MAX, 10),
  idleTimeoutMillis: parseNumberEnv(process.env.DB_IDLE_TIMEOUT_MS, 30000),
  connectionTimeoutMillis: parseNumberEnv(process.env.DB_CONNECT_TIMEOUT_MS, 10000),
});

export default pool;
