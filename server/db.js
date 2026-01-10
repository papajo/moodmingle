import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Use DATABASE_URL from environment (set by Docker or .env)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/moodmingle',
});

// Test connection
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();

export default {
    query,
    getClient
};
