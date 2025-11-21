import { DataSource } from 'typeorm';
import { ENV_CONFIG } from '../config';

export const makeDataSource = () => {
    const common = {
        type: ENV_CONFIG.database.DATABASE_DRIVER as 'postgres',
        entities: ['**/*.entity.ts'],
        migrations: ['src/database/migrations/*-migration.ts'],
        migrationsRun: ENV_CONFIG.app_env !== 'development',
        synchronize: ENV_CONFIG.app_env === 'development',
        logging: ENV_CONFIG.app_env === 'development',
        ssl: ENV_CONFIG.app_env === 'production',
        poolSize: 20,
        extra: {
            ssl:
                ENV_CONFIG.app_env === 'production'
                    ? { rejectUnauthorized: false }
                    : null
        }
    };

    if (process.env.DATABASE_URL) {
        return new DataSource({
            ...common,
            url: process.env.DATABASE_URL
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
