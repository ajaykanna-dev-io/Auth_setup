import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import pg from 'pg';
import type { Contract } from './schema.d.js';
import contractJson from './schema.json' with { type: 'json' };

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});

export const pgPool = new pg.Pool({
  connectionString: process.env['DATABASE_URL']!,
});
