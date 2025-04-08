import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create a PostgreSQL client
export const client = postgres(process.env.DATABASE_URL || '');

// Create a Drizzle client using the PostgreSQL client and schema
export const db = drizzle(client, { schema });