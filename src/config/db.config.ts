import { DataSource } from 'typeorm';
import { join } from 'path';
import dotenv from 'dotenv';
import { ENV_CONFIG } from '.';

dotenv.config();

export const makeDataSource = () => {
  const isProduction = ENV_CONFIG.app_env === 'production';
  // const isDevelopment = ENV_CONFIG.app_env === 'development';

  const common = {
    type: ENV_CONFIG.database.DATABASE_DRIVER as 'postgres',
    // entities: ['**/*.entity.ts'],
    // migrations: ['src/database/migrations/*-migration.ts'],
    // migrationsRun: !isDevelopment,
    // logging: isDevelopment,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', '/database/migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
    migrationsRun: false,
    synchronize: false,
    poolSize: 20,
    ssl: isProduction,
    extra: {
      ssl: isProduction
        ? { rejectUnauthorized: true } // ← verify-full behaviour
        : null,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
      poolSize: 10,
      max: 20,
      idleTimeoutMillis: 30000,
    },
  };

  if (process.env.DATABASE_URL) {
    return new DataSource({
      ...common,
      url: `${process.env.DATABASE_URL}?sslmode=verify-full`, // ← explicit
    });
  }

  return new DataSource({
    ...common,
    host: ENV_CONFIG.database.DATABASE_HOST,
    port: ENV_CONFIG.database.DATABASE_PORT,
    username: ENV_CONFIG.database.DATABASE_USERNAME,
    password: ENV_CONFIG.database.DATABASE_PASSWORD,
    database: ENV_CONFIG.database.DATABASE_NAME,
  });
};

export const AppDataSource = makeDataSource();
