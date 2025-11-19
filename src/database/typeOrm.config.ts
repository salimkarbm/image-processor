import { DataSource, DataSourceOptions } from 'typeorm';
import { envConfig } from '../config';

let AppDataSource: DataSource;
export const dataSourceOptions: DataSourceOptions = {
    // TypeORM PostgreSQL DB Drivers
    type: envConfig.database.DATABASE_DRIVER as 'postgres',
    host: envConfig.database.DATABASE_HOST,
    port: envConfig.database.DATABASE_PORT,
    username: envConfig.database.DATABASE_USERNAME,
    password: envConfig.database.DATABASE_PASSWORD,
    database: envConfig.database.DATABASE_NAME,
    entities: ['**/*.entity.ts'],
    synchronize: envConfig.app_env === 'development',
    migrations: ['src/database/migrations/*-migration.ts'],
    migrationsRun: envConfig.app_env !== 'development',
    poolSize: 20,
    logging: envConfig.app_env === 'development',
    ssl: envConfig.app_env === 'production',
    extra: {
        ssl:
            envConfig.app_env === 'production'
                ? { rejectUnauthorized: false }
                : null
    }
};

if (dataSourceOptions) {
    AppDataSource = new DataSource(dataSourceOptions);
}
AppDataSource = new DataSource({
    type: envConfig.database.DATABASE_DRIVER as 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['**/*.entity.ts'],
    synchronize: envConfig.app_env === 'development',
    migrations: ['src/database/migrations/*-migration.ts'],
    migrationsRun: envConfig.app_env !== 'development',
    poolSize: 20,
    logging: envConfig.app_env === 'development',
    ssl: envConfig.app_env === 'production',
    extra: {
        ssl:
            envConfig.app_env === 'production'
                ? { rejectUnauthorized: false }
                : null
    }
});

export default AppDataSource;
