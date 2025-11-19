import 'dotenv/config';

export const configuration = () => {
    return {
        port: parseInt(process.env.PORT as string, 10) || 3000,
        app_env: process.env.APP_ENV || 'development',
        database: {
            DATABASE_URI:
                process.env.DATABASE_URI ||
                'postgres://postgres:yourpassword@localhost:5432/image_processor_db',
            DATABASE_URL: process.env.DATABASE_URL,
            DATABASE_DRIVER: process.env.DATABASE_DRIVER as 'postgres',
            DATABASE_HOST: process.env.DATABASE,
            DATABASE_PORT: Number(process.env.DATABASE_PORT),
            DATABASE_USERNAME: process.env.DATABASE_USERNAME,
            DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
            DATABASE_NAME: process.env.DATABASE_DATABASE,
            DATABASE_SSL: process.env.DATABASE_SSL
        },
        app_name: process.env.APP_NAME,
        jwt: {
            secret: process.env.JWT_SECRET,
            accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '1d',
            refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '14d',
            expiresIn: process.env.JWT_EXPIRY || '30s'
        }
    };
};

export const envConfig = configuration();
