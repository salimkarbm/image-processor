import { DataSource, DataSourceOptions } from 'typeorm';
import { ENV_CONFIG } from '../config';

let AppDataSource: DataSource;
export const dataSourceOptions: DataSourceOptions = {
    // TypeORM PostgreSQL DB Drivers
    type: ENV_CONFIG.database.DATABASE_DRIVER as 'postgres',
    host: ENV_CONFIG.database.DATABASE_HOST,
    port: ENV_CONFIG.database.DATABASE_PORT,
    username: ENV_CONFIG.database.DATABASE_USERNAME,
    password: ENV_CONFIG.database.DATABASE_PASSWORD,
    database: ENV_CONFIG.database.DATABASE_NAME,
    entities: ['**/*.entity.ts'],
    synchronize: ENV_CONFIG.app_env === 'development',
    migrations: ['src/database/migrations/*-migration.ts'],
    migrationsRun: ENV_CONFIG.app_env !== 'development',
    poolSize: 20,
    logging: ENV_CONFIG.app_env === 'development',
    ssl: ENV_CONFIG.app_env === 'production',
    extra: {
        ssl:
            ENV_CONFIG.app_env === 'production'
                ? { rejectUnauthorized: false }
                : null
    }
};

if (dataSourceOptions) {
    AppDataSource = new DataSource(dataSourceOptions);
}
AppDataSource = new DataSource({
    type: ENV_CONFIG.database.DATABASE_DRIVER as 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['**/*.entity.ts'],
    synchronize: ENV_CONFIG.app_env === 'development',
    migrations: ['src/database/migrations/*-migration.ts'],
    migrationsRun: ENV_CONFIG.app_env !== 'development',
    poolSize: 20,
    logging: ENV_CONFIG.app_env === 'development',
    ssl: ENV_CONFIG.app_env === 'production',
    extra: {
        ssl:
            ENV_CONFIG.app_env === 'production'
                ? { rejectUnauthorized: false }
                : null
    }
});

export default AppDataSource;
