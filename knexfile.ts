import type { Knex } from 'knex';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Parse database URL if provided, otherwise use individual variables
const getConnectionConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.replace(/^\//, '')
    };
  }
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'lendsqr'
  };
};

const connection = getConnectionConfig();

// Common configuration
const commonConfig: Partial<Knex.Config> = {
  client: 'mysql2',
  migrations: {
    directory: path.join(__dirname, 'src/database/migrations'),
    extension: 'ts',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.join(__dirname, 'src/database/seeds'),
  },
  pool: {
    min: 2,
    max: 10,
    afterCreate: (conn: any, done: (err: Error | null, conn: any) => void) => {
      // Set timezone to UTC
      conn.query('SET time_zone="+00:00";', (err: Error) => {
        done(err, conn);
      });
    }
  },
  // Enable debug logging in development
  debug: process.env.NODE_ENV === 'development',
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...commonConfig,
    connection: {
      ...connection,
      charset: 'utf8mb4',
      timezone: 'UTC',
      typeCast: (field: any, next: any) => {
        // Convert TINY(1) to boolean
        if (field.type === 'TINY' && field.length === 1) {
          return field.string() === '1';
        }
        return next();
      },
    },
  },
  test: {
    ...commonConfig,
    connection: {
      ...connection,
      database: process.env.TEST_DB_NAME || 'lendsqr_test',
      charset: 'utf8mb4',
    },
  },
  production: {
    ...commonConfig,
    connection: {
      ...connection,
      ssl: { rejectUnauthorized: true },
      charset: 'utf8mb4',
    },
    pool: {
      ...commonConfig.pool,
      min: 5,
      max: 20,
    },
  },
} as const;

export default config;
