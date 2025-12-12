import { Pool } from 'pg';

// Buat connection pool untuk PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export async function query({ query, values = [] }) {
  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error(error.message);
  }
}

export default pool;