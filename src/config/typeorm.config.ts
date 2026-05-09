import { DataSource, DataSourceOptions } from 'typeorm';
import dotenv from 'dotenv';
import { ENV_CONFIG } from '.';
import { AuditLog } from '../audit/entities/audit.entity';
import User from '../users/entities/user.entity';
import { join } from 'path';

dotenv.config();
export const makeDataSource = (): DataSource => {
  const isProduction = ENV_CONFIG.APP.env === 'production';
  const isDevelopment = ENV_CONFIG.APP.env === 'development';

  const common: Partial<DataSourceOptions> = {
    type: 'postgres',
    schema: 'public',
    entities: [User, AuditLog],
    migrations: [join(__dirname, '..', '/database/migrations', '*.{ts,js}')],
    migrationsTableName: 'migrations',
    migrationsRun: false,
    synchronize: false,
    logging: isDevelopment ? (['query', 'error', 'schema'] as const) : false,
  };

  if (process.env.DATABASE_URL) {
    const options: DataSourceOptions = {
      ...common,
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: isProduction, // Tell pg to use SSL
      extra: {
        ssl: isProduction
          ? {
              rejectUnauthorized: true, // This = verify-full
              // ca: process.env.DATABASE_SSL_CA
              //   ? Buffer.from(process.env.DATABASE_SSL_CA, 'base64').toString('utf-8')
              //   : undefined,
            }
          : false, // This = disable
        connectionTimeoutMillis: 10000,
        query_timeout: 10000,
        statement_timeout: 10000,
        max: 20,
        idleTimeoutMillis: 30000,
      },
    };
    return new DataSource(options);
  }

  const options: DataSourceOptions = {
    ...common,
    type: 'postgres',
    host: ENV_CONFIG.DATABASE.HOST,
    port: ENV_CONFIG.DATABASE.PORT,
    username: ENV_CONFIG.DATABASE.USERNAME,
    password: ENV_CONFIG.DATABASE.PASSWORD,
    database: ENV_CONFIG.DATABASE.NAME,
    ssl: isProduction,
    extra: {
      ssl: isProduction ? { rejectUnauthorized: true } : false,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
      statement_timeout: 10000,
      max: 20,
      idleTimeoutMillis: 30000,
    },
  };
  return new DataSource(options);
};

// export const makeDataSource = () => {
//   const isProduction = ENV_CONFIG.APP.env === 'production';
//   const isDevelopment = ENV_CONFIG.APP.env === 'development';

//   const common = {
//     type: ENV_CONFIG.DATABASE.DRIVER as 'postgres',
//     // entities: ['**/*.entity.ts'],
//     // migrations: ['src/database/migrations/*-migration.ts'],
//     // migrationsRun: !isDevelopment,
//     // entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
//     // migrations: [join(__dirname, '..', '/database/migrations', '*.{ts,js}')],
//     // logging: isDevelopment,
//     logging: isDevelopment ? ['query', 'error', 'schema'] as const : false,
//     entities: ['src/**/*.entity.ts'],
//     migrations: ['src/database/migrations/*.ts'],
//     migrationsTableName: 'migrations',
//     migrationsRun: false,
//     synchronize: false,
//   };

//   if (process.env.DATABASE_URL) {
//     return new DataSource({
//       ...common,
//       url: `${process.env.DATABASE_URL}?sslmode=verify-full`, // ← explicit
//       ssl: isProduction,
//       extra: {
//         ssl: isProduction
//           ? {
//               rejectUnauthorized: true, // ← verify-full behaviour
//               // ca: fs.readFileSync('/path/to/ca.pem').toString(), // if you have CA cert
//               //ca: process.env.DATABASE_SSL_CA ? Buffer.from(process.env.DATABASE_SSL_CA, 'base64').toString('utf-8') : undefined,
//             }
//           : false,
//         connectionTimeoutMillis: 10000,
//         query_timeout: 10000,
//         statement_timeout: 10000,
//         poolSize: 10,
//         max: 20,
//         idleTimeoutMillis: 30000,
//       },
//     });
//   }

//   return new DataSource({
//     ...common,
//     host: ENV_CONFIG.DATABASE.HOST,
//     port: ENV_CONFIG.DATABASE.PORT,
//     username: ENV_CONFIG.DATABASE.USERNAME,
//     password: ENV_CONFIG.DATABASE.PASSWORD,
//     database: ENV_CONFIG.DATABASE.NAME,
//     ssl: isProduction,
//     extra: {
//       ssl: isProduction ? { rejectUnauthorized: true } : false,
//     },
//   });
// };
export const AppDataSource = makeDataSource();