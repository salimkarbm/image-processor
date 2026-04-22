import { DataSource } from 'typeorm';
import { ENV_CONFIG } from '../config';

export const makeDataSource = () => {
    const isProduction = ENV_CONFIG.app_env === 'production';
    const isDevelopment = ENV_CONFIG.app_env === 'development';

    const common = {
        type: ENV_CONFIG.database.DATABASE_DRIVER as 'postgres',
        entities: ['**/*.entity.ts'],
        migrations: ['src/database/migrations/*-migration.ts'],
        migrationsRun: !isDevelopment,
        synchronize: isDevelopment,
        logging: isDevelopment,
        poolSize: 20,
        ssl: isProduction,
        extra: {
            ssl: isProduction
                ? { rejectUnauthorized: true } // ← verify-full behaviour
                : null
        }
    };

    if (process.env.DATABASE_URL) {
        return new DataSource({
            ...common,
            url: `${process.env.DATABASE_URL}?sslmode=verify-full` // ← explicit
        });
    }

    return new DataSource({
        ...common,
        host: ENV_CONFIG.database.DATABASE_HOST,
        port: ENV_CONFIG.database.DATABASE_PORT,
        username: ENV_CONFIG.database.DATABASE_USERNAME,
        password: ENV_CONFIG.database.DATABASE_PASSWORD,
        database: ENV_CONFIG.database.DATABASE_NAME
    });
};

export const AppDataSource = makeDataSource();
